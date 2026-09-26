# Phase 7 work orders — Drive sync (opt-in) 🔒

**Phase goal:** the same year on the laptop and the iPad, with one scope and no fear.

**🔒 GATED on Google OAuth verification** — the paperwork is
[WO-3.18](phase-3-gradebook.md#wo-318--verification-submitted-), not here. The gate is calendar-bound
rather than work-bound, which is why it is slotted in wherever it opens rather than scheduled.

**But the gate is on public launch, not on building this phase.** The OAuth client
([WO-3.10](phase-3-gradebook.md#wo-310--the-oauth-client-exists-and-asks-for-one-scope), done in the
console 2026-08-11) sits in **Testing** mode with the owner as a test user, and it runs `drive.file`
today. So everything here can be built, run and used on the owner's own devices months before any
paperwork clears — the unverified-app screen is a click-through for one person who knows what it is.
**One caveat inherited from that client:** Google will not take a raw LAN address, so the handshake
was drivable on the laptop only until
[WO-8.7](phase-8-packaging.md#wo-87--the-name-and-the-host-decided) settled a domain — **which it
has.** `https://planbook.hwgteach.com` has sat in the client's authorized origins beside
`https://localhost:8443` since 2026-08-21, and **since 2026-09-25 `hostAllowsSignIn()` accepts it
too** — [WO-7.4](#wo-74--the-deployed-app-has-no-sign-in-for-googles-reviewer-to-find) widened the
code's list to match the client's, ahead of approval, so the deployed app draws the Drive section and
Google's Testing mode (listed test users only) is what limits who can connect until approval. The
rest of the protocol is ordinary code and tests anywhere. *(This paragraph said the client had one
authorized origin until 2026-09-07, and that keeping the handshake on the laptop was the code's own
list and widening it WO-7.3's one edit until 2026-09-25.)*

***The dependency runs the other way too, and nobody had written that down until 2026-08-20.*** *WO-3.18's
third deliverable is a demo video* **showing the scope in use** *— and until this phase builds a sign-in
there is nothing to film, because the app contains no OAuth call of any kind. So the paperwork is not
merely "slotted in wherever it opens": it waits on* [WO-7.1](#wo-71--auth) *first.* **The phase gate and
the work order statuses had been contradicting each other the whole time.** *The paragraph above says
building here is ungated; all three work orders below wore the glyph that says it is not — and on WO-7.1
that glyph had quietly become a deadlock, with WO-3.18 blocked on a sign-in and the sign-in marked "do not
start it."* **WO-7.1 is ⬜ NOT STARTED as of 2026-08-20 and buildable today.** *WO-7.2 and WO-7.3 keep
their* `🔒`*: those genuinely are the public-launch half. And* [WO-7.3](#wo-73--verification-complete)
*is what keeps the paperwork gated now that Ship 2 no longer does — it has depended on WO-3.18 since this
phase was cut.*

Read [`../../docs/sync.md`](../../docs/sync.md) first. The whole protocol is settled there.

**Two drawings, both 2026-09-26.** [`design/mockups/sync-button.html`](../../design/mockups/sync-button.html)
is WO-7.5's: the header's sync button in every state. [`design/mockups/first-run.html`](../../design/mockups/first-run.html)
is WO-7.9's: a fresh device's home screen with the Drive and backup doors, in two variants. Read the
one for a work order before building it. Its questions are that work order's **Open** lines, and where
a drawing and its work order disagree, the work order wins.

**Until it lands, the Phase 1 export file is the iPad story: crude, manual, and real.** That is
acceptable, and it is why sync is last.

---

## WO-7.1 — Auth

**Ship** — · **Status** ✅ DONE — 2026-08-24 · **Size** M · **Depends on** WO-3.10 — the client, not the
verification: Testing mode issues real tokens · **Blocks** WO-3.18 — the demo video has nothing to film
until a sign-in exists
**Closes roadmap** Phase 7 → "Google Identity Services token flow", "Sign-in is opt-in and
reversible."

*(**`🔒 GATED` until 2026-08-20**, owner-directed. The glyph was the phase header's, inherited by all
three work orders in this file, and on this one it was **false in the direction that costs**: the header
says in as many words that the gate is on public launch and not on building, the Testing-mode client
issues real `drive.file` tokens today, and `Depends on` names WO-3.10 — which is ✅ DONE. **Nothing was
waiting.** What made it worth an edit rather than a note is that it had become **circular**: WO-3.18
cannot film its demo video until a sign-in exists, this work order was gated on WO-3.18's verification,
and `wo-gate.mjs` reports one "dependency is 🔒 GATED, not ✅ DONE" and the other "is 🔒 GATED — do not
start it", with no way in from either end. A `🔒` that reads as a wait when the road is open is the rot
[WO-1.21](phase-1-shell-store-roster.md#wo-121--the-tracker-has-no-word-for-work-that-is-not-coming)
named from the other side — there, work nobody intends to do sitting on a dependency line; here, a work
order nobody may start standing in front of the only thing that unblocks it.)*

**Why it exists.** One OAuth client, owned and verified by us. Teachers deploy nothing — that is the
entire difference from the predecessor app, where each teacher was their own unverified developer
and the "Google hasn't verified this app" warning could never be cleared.

**Deliverables**
- Google Identity Services token flow, browser-only, no client secret and no backend.
- **`drive.file` and nothing else.** Not `spreadsheets`, not a mail scope.
- Sign-in is opt-in, reversible, and off by default. Sign-out clears the token and leaves the local
  document untouched.
- **The app stays fully functional signed-out, forever.** A teacher whose Workspace admin blocks
  third-party apps is still a customer.
- Silent re-auth (`prompt: ''`) attempted first; a visible sign-in prompt when it fails.

**What landed — 2026-08-24 — and the three calls the deliverables above did not settle.** The code is
[`src/auth.js`](../../src/auth.js), which argues each of these at its own point of departure; the
short form is in [`docs/sync.md`](../../docs/sync.md) § "What WO-7.1 settled", and the reason it is in
both is that one is the decision and the other is the protocol a later work order reads first.

- **The token lives in memory and only in memory** — a module variable, so a reload is a sign-out.
  `PREF_DEFAULTS` would have refused it and should, but the argument is not the closed door: an
  access token is a bearer credential, and in `localStorage` it outlives the tab and survives a
  laptop handed to a substitute. **Persisting it buys nothing** — there is no refresh token, so the
  most it could preserve is the tail of one hour, and what actually makes the next sign-in silent is
  the teacher's Google session rather than our storage. Decided out loud, because "never got round to
  it" and "it is wrong" read identically in a diff.
- **The control is in the About modal**, and the Backup & restore panel lost on one sentence from
  `docs/sync.md`: **sync is not a backup.** A *Connect Google Drive* button under *Download a backup*
  teaches the one misconception that costs a term of grades. About already carries the sentence a
  sign-in qualifies — *"There is no account and no server"* — which is the argument the two privacy
  links in that modal already make in general terms. The header was never a candidate: `index.html`
  measures its spare width at 390px under a coarse pointer at ~46px and presentation mode spent it.
- **The flag is the origin.** `hostAllowsSignIn()` answers for loopback and nothing else, which is
  exactly where this client's one authorized JavaScript origin — `https://localhost:8443` — can
  succeed. So the owner reaches it on the laptop today (which is what WO-3.18's demo video needs),
  and **the released app draws no sign-in and fetches no Google script at all**, which keeps
  `privacy.html`'s flat claim that Planbook loads no third-party code of any kind true word for word.
  A preference-shaped flag would have put a Google script one toggle away from every teacher and made
  that sentence conditional; that is the argument that settled it. *(**Superseded 2026-09-25 by
  [WO-7.4](#wo-74--the-deployed-app-has-no-sign-in-for-googles-reviewer-to-find)**, which widened the
  function to the deployed host ahead of approval — the record below is WO-7.1's as it was decided.
  The deployed app now draws the section, and the policy's claim narrowed in the same sitting to "no
  third-party code unless a teacher connects Google Drive", true because the library loads only on the
  Connect tap.)* **WO-7.3 widens that one function, and the
  console half of the pair is already paid** — both origins have been registered since 2026-08-21. Either
  half alone gives a button that ends in `origin_mismatch`, and today it is the code that is behind,
  which is why `connect()` refuses off-flag rather than trusting the markup to stay hidden.

**Two things it deliberately did not build.** The save indicator's `syncing` state still has no
caller — that is WO-7.2's own deliverable, verbatim — and `ensureFreshToken()`, the silent-renewal
door, has no caller either, for the same reason and with the same note at the function. Leaving both
unwired is the correct outcome of this work order rather than an omission in it.

**And one line of teacher-facing copy that is a deliverable rather than a caveat:** the panel says
**nothing is uploaded yet**. This build signs in and stops. A teacher who connects, assumes her
gradebook is in Drive and stops downloading backups has been misled by an omission this panel could
have prevented, and whatever moves a document says so in the same place.

**Acceptance**
- [x] A sign-in completes on the owner's own account and the app receives a token — driven, not
      assumed. The unverified-app screen is expected while the client sits in Testing mode and is not
      a failure. 👤
      *(**Owed to a human and not tickable at a desk.** No headless browser has a Google account, a
      Google session or a consent screen, so the success path of the handshake is unreachable from
      `verify-shell.mjs` and always will be. The procedure is one paragraph and it is in `TESTING.md`
      § WO-7.1: `node tools/serve-https.mjs`, open **`https://localhost:8443`** on the laptop — that
      exact origin, because it is the only one `hostAllowsSignIn()` accepts — About ▸ Connect Google Drive.
      **Driven by the owner on 2026-08-24 at that origin** — the handshake completed and the panel
      read *Connected to Google Drive* with a clock time about an hour out.)*
- [x] The consent screen shows exactly one scope. 👤
      *(Same sitting as the line above, and it is the screen that has to be read. **What IS settled
      at the desk is the thing the screen is drawn from:** Google prints one line per scope string
      requested, and `verify-shell.mjs` asserts that the string
      `https://www.googleapis.com/auth/drive.file` occurs **exactly once across the 54 files the app
      itself runs** — `index.html`, `sw.js` and all of `src/` — in `src/auth.js`, and that it is the
      only `googleapis.com/auth/` string of any kind in that set. **The set is what executes, not
      "everything the browser loads"**: `privacy.html` is served and names the scope in prose, and it
      carries no script, so nothing on that page can ask Google for anything — word the claim any
      wider and it is false by exactly that one file. A second scope cannot reach that screen without
      failing this run. **Read on the laptop by the owner, 2026-08-24: one permission line.**)*
- [x] Every feature outside this phase works identically signed-out. Walk the app with sync off.
      *(Measured as a property of the whole run rather than as one check: **all 1,116 checks in
      `verify-shell.mjs` pass with nobody signed in**, and the Drive section's own first reading is
      that the app arrived at it signed out, holding nothing, with no Google script in the document
      after the thousand checks in front of it. The other half is structural and is asserted too —
      **no file in `src/` imports `src/auth.js` except `src/shell.js`**, which calls it twice, so
      there is nothing anywhere else in the app that can observe a sign-in and behave differently.
      What this does NOT cover: an installed app on hardware. The harness drives a page.)*
- [x] Sign-out leaves the local document intact and removes the token.
      *(Driven through the real button, by a tap, through the one delegated listener: with a session
      seeded through `acceptTokenResponse()`, one tap of **Disconnect** takes `signedIn` to false,
      `accessToken()` to null and the held fields to none, with the year document's fingerprint —
      length, `rev` and a hash over the serialised document — identical on both sides of it. The
      stronger half is the import graph: `src/auth.js` imports `src/live-region.js` and nothing else,
      so there is no path from here to `src/store.js` at all, and the harness asserts that too.)*
- [x] Token expiry after ~1 hour is handled without data loss and without a silent failure.
      *(**Half proved at the desk, half owed to a human, and the halves are worth naming.** What is
      driven: `signedIn` is computed from the clock on every read and stored as no flag anywhere, so
      a token seeded with 63 seconds of life reads as signed in and then — with no code running,
      nothing dispatched and nothing polled by the app — reads as signed out the moment it crosses
      the one-minute freshness margin, in about three seconds of a run. `accessToken()` stops handing
      it out, the panel opened on it says "not connected" rather than reporting an hour it no longer
      has, and the year document is unchanged across the whole thing — a lapse is not an event this
      build responds to, so there is nothing for it to lose. What is NOT proved: a real token really
      lapsing at ~3,600s on a real sign-in, and the silent re-auth (`prompt: ''`) that
      `ensureFreshToken()` attempts when it does. That wants a human signed in at
      `https://localhost:8443` who comes back an hour later — `TESTING.md` § WO-7.1 carries it.
      **Sat through by the owner on 2026-08-24, and the desk half predicted the hour correctly**: the
      panel reported not-connected rather than an hour it no longer had, and reconnecting did not ask
      for consent a second time. So the 63-second token is a faithful model of the 3,600-second one,
      which is worth knowing the next time a lapse has to be tested without an hour to spend.)*
- [x] No refresh token is requested or stored — there isn't one in a browser flow, and building as
      if there were is how a background-sync assumption gets in.
      *(**Written as a shape rather than as a check for a name**, which is the part worth reading:
      `acceptTokenResponse()` copies three fields out of Google's answer — the token, when it lapses,
      and what Google said it granted — and never keeps the answer, so there is no field a refresh
      token could sit in whatever arrives. Driven: a response carrying a refresh token, an id token
      and three extras leaves the session at those same three fields with none of them anywhere in
      the state a screen can read, which is the one edit that would break this line and pass every
      grep. And statically: no served file **uses** `client_secret`, `refresh_token`, `access_type`,
      `approval_prompt` or `grant_type` — read, written or passed. Nothing here schedules anything;
      `ensureFreshToken()` is silent-only and never opens a window without a tap behind it.)*

**The first Acceptance line was added 2026-08-11, and the hole it fills is worth naming.** This list
already carried sign-*out*, token expiry, and the refusal to store a refresh token — three lines that
each **presuppose a token was obtained**, and none that asserts obtaining one. The phase that builds
the token flow had no check that the flow succeeds. It surfaced from the other end: WO-3.10 landed
the OAuth client with its own sign-in line open on purpose, that line belongs here by the `Owes` rule
WO-3.11 built, and there was no box for the pointer to land on. **A pointer with nowhere to resolve
is precisely the signal that field exists to raise**, so the answer was the missing box rather than a
fragment bent to fit an existing one. WO-3.10's `Owes` field now points at this line; **if it is
reworded, that pointer has to be requoted with it** — which `--audit` will say out loud.

**Traps** — **Never build a feature that assumes background or scheduled sync.** It is not possible
here. Sync is a foreground act, while the app is open and the teacher is signed in.

---

## WO-7.2 — Document transfer & conflicts

**Ship** — · **Status** ✅ DONE — 2026-09-07 · **Size** L · **Depends on** WO-7.1
**Closes roadmap** Phase 7 → "Upload/download the year document", "`rev`/`baseRev` comparison",
"Conflict: keep both", "Handle token expiry gracefully."

*(**`🔒 GATED` until 2026-08-28, and by then it was gating nothing.** The glyph is Phase 7's
original blanket — `docs/sync.md`'s "sync stays behind a flag until it is verified" read as *do not
build any of it yet* — and
[WO-3.10](phase-3-gradebook.md#wo-310--the-oauth-client-exists-and-asks-for-one-scope) demolished
that argument on 2026-08-11 for the whole phase: **verification gates public launch, not
development**, and a Testing-mode client issues real `drive.file` tokens to the owner today.
[WO-7.1](#wo-71--auth) took the glyph off on that reasoning and shipped 2026-08-24; this work order
kept it, with its one `Depends on` ✅ DONE and* **nothing in its body naming a gate** *— which the
§ Header fields rule requires:* `🔒` *means do not start it, and what it is gated **on** is the work
order's to say. It said nothing, so there was nothing to re-check and nothing to lift it.*

**It had also gone circular, exactly as WO-7.1's did.**
[WO-3.18](phase-3-gradebook.md#wo-318--verification-submitted-) *owes Google a demo video* **showing
the scope in use**, *and the only thing that uses the scope is this work order. WO-7.1's note records
the first turn of that loop — the paperwork could not film a sign-in marked do-not-start — and this
is the second: the paperwork cannot film a* file transfer *marked do-not-start. **The lesson is not
about Phase 7.** A `🔒` that names no gate cannot be audited, cannot expire, and outlives the
argument that put it there;* `--audit` *reads fragments, `Owes` pointers and dashboards, and has
never once asked a gated work order what it is waiting for. **Booked as a check nobody has written:**
if a `🔒` must state its gate, something should refuse one that does not.)*

*(**Written 2026-09-12** —
[WO-1.31](phase-1-shell-store-roster.md#wo-131--a--gated-work-order-that-never-says-what-it-is-gated-on).
The gate goes on the status line as a suffix, a bare `🔒 GATED` is refused twice — on the work
order's own gate report and in `--audit`, which is the half this work order's seventeen days argue
for — and the paragraph above is what the check quotes. **It could not have lifted this lock**: a
grep can ask whether a gate is *stated*, never whether it is still *live*. What it buys is that the
question is askable by somebody who did not write the work order.)*

**Why it exists.** The teacher never edits two devices at once — established up front, and it is
what makes whole-document last-writer-wins sound rather than lazy. But "never" is a habit, not a
guarantee, so the conflict path has to be correct anyway.

**Deliverables**
- Upload and download the year document, matched by `appProperties.docId`. `drive.file` limits
  `files.list` to app-created files, so the app lists its own — no folder picker, no stored path.
- `rev` carried in `appProperties` so ordering is readable without downloading the file.
- The comparison, exactly as specified:

  ```
  remote.rev == baseRev   → local is ahead      → upload
  remote.rev >  baseRev   → remote is ahead     → download (if local is unchanged since baseRev)
  both changed            → conflict            → keep both, never discard
  ```

- **Conflict handling: keep both, never merge, never discard.** Write the losing side to Drive as
  `Planbook 2026-2027 (conflict from iPad 2026-11-14).json`, keep the winner active, and **tell the
  teacher plainly what happened and where the other copy is.**
- Token expiry mid-sync fails safely: local data untouched, clear message, retry available.
- The save indicator's syncing / queued / retry states wired up.

**What landed, 2026-09-07.** `src/drive-sync.js` — the transfer, the comparison and the conflict —
plus one control in the About modal's existing Drive section (**Sync this year now**, drawn only
when a sign-in is behind it), three functions and one object store in `src/store.js`, and the panel
copy that replaces WO-7.1's *nothing is uploaded yet*. **Five decisions the work order did not
settle** are argued at their own points of definition and summarised in
[`docs/sync.md`](../../docs/sync.md) § "What WO-7.2 settled":

- **`baseRev` lives in IndexedDB, in a second object store keyed by `docId`** — refused from the
  year document (that is the thing being synced: a per-device bookmark inside it travels, and
  writing it would bump `rev` and leave the document permanently ahead of the bookmark just
  written) and refused from `localStorage` (`PREF_DEFAULTS` is UI preferences, and the state of a
  data transfer is not a switch position). `src/store.js` stays the only file that opens IndexedDB.
- **`docs/sync.md`'s open question is answered in that file**, not deferred: a backup restored from
  a different device brings its own `docId`, so it asks for a bookmark that has never existed, and
  no bookmark with a remote file present is a **conflict** — keep both, guess nothing.
- **`queued` did not come back.** `syncing` and `retry` are wired; `error` is deliberately not,
  because it draws *"✕ Save failed"* and every failure path here leaves the document untouched.
- **The dependency points one way.** `src/drive-sync.js` imports `src/auth.js` and `src/store.js`;
  neither imports it back, so sign-out still cannot reach IndexedDB.
- **The conflict copy is a second copy of the most sensitive data in the app**, so the panel names
  what sync puts in a teacher's Drive field by field — accommodations, IEP and 504 plans, case
  managers and review dates, medical needs, behavior plans — and the conflict message says the same
  about the file it just made. That is `CLAUDE.md`'s one-exception rule applied a second time.

**Two things it deliberately did not build.** There is no automatic sync of any kind — no timer, no
`online` listener, no sync-on-save — because a browser token flow has no refresh token and this
phase's Traps line forbids designing as if it did. And there is **no seam exported for the
harness**: `tools/verify/drive-sync.mjs` replaces `window.fetch` for the length of its section, so
the shipped module has no injectable transport and no test hook at all.

**Acceptance**
- [x] Edit on device A, sync, open on device B: B has A's changes. 👤
      *(**Owed to a human and not tickable at a desk**, and the reason is `hostAllowsSignIn()`
      rather than Google: the released app never draws this panel, so there is no iPad reading to
      take until WO-7.3. *(WO-7.4 opened the deployed host on 2026-09-25, a work order early — the
      iPad reading is possible on the deployed app from that deploy, and WO-7.4's own last 👤 line
      takes the first of it.)* The runnable form is **two browser profiles at `https://localhost:8443`**,
      which are two devices as far as IndexedDB and the sync bookmark are concerned — the procedure
      is in `TESTING.md` § WO-7.2. What IS driven at the desk is every decision the line rests on,
      against a Drive `tools/verify/drive-sync.mjs` stands up in `window.fetch`: an upload creates
      one file named for the year carrying `docId` and `rev`, a remote that is further along is
      downloaded and adopted at the Drive copy's own save number, and the document on the device
      really is replaced through `store.adoptRemoteDocument()`. That proves the state machine and
      proves nothing about two IndexedDBs, which is why this box is open.)*
- [x] Edit both devices while offline, then sync both: **two files exist**, the conflict copy is
      named and findable, and no edit from either side is lost. 👤
      *(Same sitting and same reason as the line above. Driven at the desk against the stand-in
      Drive: both sides changed, **two files exist afterwards**, the conflict copy holds the remote
      bytes and the live file holds this device's, the local document's fingerprint is identical
      either side of the whole thing, and the create of the conflict copy is asserted to happen
      **before** the overwrite of the live file — which is the ordering the guarantee is made of.
      What two profiles add is the half a single device cannot show: that the other machine's
      document really was the losing side and really is in that file.)*
- [x] The conflict message names the file and where it went, in plain language.
      *(Driven against the stand-in Drive: the sentence names the conflict copy by the filename it
      was actually given, says it is in **My Drive**, says **nothing was thrown away**, says
      Planbook **merged nothing**, and says what is inside it — the last clause being the one that
      is not decoration, because a conflict copy is a second copy of accommodations, medical needs
      and behavior plans and is owed the same sentence the backup panel owes her. It is painted in
      the quiet grammar (`class-hint`), not the red one, because a conflict is not an error:
      everything worked. **Proved non-vacuous** — dropping the copy's name out of the message and
      leaving every other clause intact reddens this check and only this check.)*
- [x] Killing the network mid-upload leaves the local document valid and the remote unchanged or
      complete — never half-written.
      *(**Two halves, and both are proved.** The structural half is a property of the code: every
      write to Drive is **one multipart request** and nothing in the module can start a resumable
      upload, so there is no session URI and no half-finished transfer for a dropped connection to
      have left behind — Drive commits the whole body or the previous revision stands. The
      behavioural half is driven: with the connection dying while an upload is in the air, the
      bytes at Drive, its `appProperties`, the bookmark, the local fingerprint and the file count
      are all identical either side, it was **tried twice** before giving up, the save chip was
      never painted red — `error` reads "✕ Save failed", which would be a lie about local storage
      at the one moment a teacher is deciding whether to re-key a period of grades — and the retry
      she makes by hand afterwards works. Three separate mutations redden it: removing the one
      retry, planting the word `resumable` in code, and writing the bookmark **before** the upload
      instead of after it. **One honest limit, found by the third and recorded rather than
      repaired:** the *never half-written* check reads the **in-memory** bookmark, so a premature
      write to the bookmark in **IndexedDB** is invisible to it — it passed at `baseRev 281 -> 281`
      over a document that really had been corrupted, and what caught the damage was its neighbour,
      the manual-retry check, which saw the next pass turn into a `conflict`. The line holds; the
      check's stated claim is wider than what it measures. Same species as WO-5.3's `flush()`
      blind spot.)*
- [x] An expired token during sync produces a re-auth prompt, not a silent no-op.
      *(**Three arms, and only one of them touches the network** — which is what makes the proof
      worth stating rather than counting. Signed out: no request is made at all, no byte of a
      gradebook is offered to anybody, and the answer names the Connect button. Already lapsed when
      Sync is tapped: the Connect button is back, the Sync button is gone, no request is made, and
      the document is untouched. Refused **part-way through** by Google: a sentence naming the
      sign-in and telling her to connect again — not a raw Google error code — with the Drive file
      exactly as it was. Turning the `401` branch off reddens **only the third**, and correctly so:
      the first two never reach a request, so that branch is unreachable for them. A mutation that
      smeared across all three would have been the weaker result, not the stronger one.)*
- [x] Sync never touches a year document other than the one matched by `docId`.
      *(Measured against a file that was there to be damaged: a year document belonging to somebody
      else's `docId` sat in the same Drive through a create, an overwrite, a download **and** a
      conflict, and came out byte for byte as it went in — name, properties and body. The matching
      is `appProperties.docId` and only that; two files claiming the same document stop the sync
      dead rather than picking one, because one of them holds work that overwriting the other would
      destroy and there is no fact available to say which. **The defence is two layers deep, and
      the mutation round says so.** Removing the module's own client-side filter changes nothing
      observable — the harness's stand-in Drive parses the `q` parameter and filters server-side
      exactly as Google does — so that mutation is **correctly not caught**, the same shape as
      WO-5.3's MUTATION 1: belt to the query's braces. Pointing the lookup at a foreign `docId`
      instead reddens **thirteen** checks, this line's among them by name.)*

**Traps** — Silent merge of two gradebooks is how you lose a term of grades and never find out. If
you find yourself writing merge logic, stop: the design says keep both. And remember **sync is not a
backup** — Drive holds one live copy that sync will happily overwrite. WO-1.5 stays mandatory.

---

## WO-7.4 — the deployed app has no sign-in for Google's reviewer to find

**Ship** — · **Status** ✅ DONE — 2026-09-26 · **Size** S · **Depends on** WO-7.2, WO-8.15 — the transfer the
sign-in exists for, and the front page whose sync sentence changes with the policy's · **Blocks**
WO-3.18 — a submission whose homepage would otherwise lead to an app that never uses the scope
**Closes roadmap** *(no box. Phase 7's **Verification complete.** is WO-7.3's, and a box is closed by
one work order, never two.)*

**Booked 2026-09-25**, owner-directed, out of the question *"why not turn on sign-in for the live
site?"* asked after WO-8.15 closed. **This is WO-7.3's fourth deliverable — "Sync taken out from
behind its flag" — split off and moved ahead of the submission**, which is the first of the three ways
out that [`plans/wo-3-18-video-runbook.html`](../wo-3-18-video-runbook.html) § "Decide before you shoot"
names. The owner picked it over the middle path the shot list assumed.

**Why it exists.** `hostAllowsSignIn()` answers `true` for `localhost` and `127.0.0.1` and nothing
else, so on `https://planbook.hwgteach.com` — the domain on the verification form, and the homepage
WO-8.15 built for it — **there is no Connect control anywhere**. A reviewer who opens the submitted
app finds a permission requested and never used, which is the shape of the two commonest rejection
reasons the video runbook names: *insufficient functionality relative to requested scopes*, and
*demo app differs from submitted application*. A rejection is another round trip in a queue nobody
here controls. The flag held the code back so the deployed app contacted Google not at all; the
submission now needs the opposite, and **the cost is smaller than the old reasoning assumed**:
`loadGis()` in `src/auth.js` appends Google's script only when Connect is tapped, so a teacher who
never taps it sees the network behave exactly as it does today.

**The console half is already paid.** The OAuth client has carried `https://planbook.hwgteach.com`
beside `https://localhost:8443` since 2026-08-21 (WO-3.10's table, confirmed 2026-08-24). Widening
the list does not risk `origin_mismatch`.

**Deliverables**
- **`hostAllowsSignIn()` answers `true` for `planbook.hwgteach.com`**, and still `false` for the LAN
  address and anything else. The comments in `src/auth.js` that say the deployed host is shut, or that
  this is WO-7.3's edit, say what is true instead.
- **The Drive panel says, while the client is in Testing, that sign-in is limited.** Until Google
  approves the client, an account that is not a listed test user meets Google's *Access blocked*
  page. The panel says so before Connect is tapped, in plain words — for example *"Google is still
  reviewing Planbook's Drive sign-in. Until it approves, only accounts the developer has added can
  connect."* — and the sentence is one constant, easy to delete when WO-7.3 closes.
- **`privacy.html` and `docs/FERPA.md`, in the same sitting and word for word where they share a
  sentence.** "No third-party code of any kind" becomes true again as a narrower claim — none unless
  the teacher connects Google Drive, when Google's own sign-in library loads from
  `accounts.google.com`. Every *not in the released app yet* comes out of both. The date at the top of
  the policy changes, as the policy's own sync section promises.
- **`about.html`'s sync item loses *Not in the released app yet*** and stays a compression of the
  policy (WO-8.15's first Trap).
- **`tools/verify/drive-sign-in.mjs`'s truth table** flips for `planbook.hwgteach.com` and keeps the
  LAN address shut. `verify-deploy.mjs`'s policy and `/about` checks are re-read for anything that
  asserted the old wording.
- **`docs/sync.md`, WO-7.3, both WO-3.18 runbooks and `CLAUDE.md`/`AGENTS.md`**: every sentence that
  says the deployed app draws no Drive section or contacts Google not at all. WO-7.3 keeps approval,
  the demo video and the no-warning consent screen, and loses the flag deliverable and its third
  Acceptance line to this work order. The video runbook's Blocker 2 is discharged, and its shot list
  can film the flow at the real domain.
- **`CACHE` in `sw.js` bumped** — `src/auth.js` is in `SHELL`.

**Acceptance**
- [x] `hostAllowsSignIn('planbook.hwgteach.com')` is `true`; the LAN address, `hwgteach.com` and an
      unrelated host are `false`; the harness asserts the whole table.
      *(Fourteen rows in `tools/verify/drive-sign-in.mjs`, each against an expected answer, including
      a subdomain, both-ends near misses and a case variant. Red under a suffix-match mutation —
      `TESTING.md` § WO-7.4.)*
- [x] A signed-out page makes no request to `accounts.google.com` until Connect is tapped — asserted
      in the harness, since this is now the whole of the policy's third-party claim.
      *(From the Network domain across a reload: `0 request(s) to accounts.google.com and 68 to this
      origin` before the tap, `["https://accounts.google.com/gsi/client"]` after it. Red under an
      eager-load mutation.)*
- [x] `privacy.html` and `docs/FERPA.md` carry the narrowed third-party sentence identically, and
      neither they nor `about.html` says sync is unreleased. `verify-deploy.mjs` green after the push.
      *(**Desk half met, push half owed — so open.** The sentence is identical in both files after
      tags, backticks and whitespace are normalised, and none of the three pages matches
      `released app|not built into`. `verify-deploy.mjs`'s three policy claims and its `/about`
      check were re-read and assert nothing the rewrite removed, so no edit there. **Push half met
      2026-09-26**: pushed at `c775315`, and `verify-deploy.mjs` against the live origin ran 19 of 19
      green with the deployed `CACHE` equal to the tree's `planbook-shell-v130` — policy at `/privacy`
      is the policy with all three claims, `/about` is the front page.)*
- [x] The Drive panel names the Testing-mode limit before Connect is tapped.
      *(`TESTING_MODE_NOTE` in `src/auth.js`, drawn into `#driveTestingNote` above Connect while
      nobody is signed in; the harness asserts drawn, above Connect, equal to the constant, and
      hidden again once a sign-in is held.)*
- [x] 👤 On the deployed app, cold, on the laptop: Connect reaches the consent screen with one
      permission line, the owner's own year uploads, and Disconnect leaves the app as it was.
      *(Read by the owner on Windows 2026-09-26, after `c775315` was live: all four laptop checks
      green — Drive section with the Testing-mode line above Connect, one permission line, the year
      in My Drive, Disconnect back to Not connected.)*
- [x] 👤 On the iPad, force-quit first: the Drive section is drawn and the app is otherwise unchanged.
      Download a backup before connecting the classroom year.
      *(Read by the owner on the iPad 2026-09-26: backup downloaded, force-quit and relaunched, About
      draws the Drive section with the Testing-mode line above Connect, nothing else moved. Connect
      was not part of this line; on the iPad it wants Safari's pop-up blocker off, because the
      visible attempt fires after the silent one fails and lands outside the tap's gesture window —
      noted by the owner, not yet booked.)*

**Traps** — **Only the deployed origin.** Widening to "any HTTPS host" or to the LAN address sends a
live handshake to an origin the client does not list and teaches the list nothing. **Do not change
the scope, the token's lifetime or where it lives** — this work order moves a door, and adding a scope
after WO-3.18 submits restarts Google's review. **The two privacy documents change together or not at
all**, per `CLAUDE.md` § Accommodations; a policy that claims less third-party code than the app
loads is the one sentence here a district would hold against us. **And sync is still not a backup**:
the panel's existing wording on that stays exactly as it is, and the real classroom year is the one
most at risk from a first live sync.

---

## WO-7.3 — Verification complete

**Ship** — · **Status** 🔒 GATED — Google's verdict on a submission nobody has made yet · **Size** S · **Depends on** WO-3.18, WO-7.2 — approval cannot
follow from a client nobody submitted
**Closes roadmap** Phase 7 → "Verification complete."

*(**This work order is now the only thing gating the OAuth paperwork, as of 2026-08-20.** It always
depended on WO-3.18; what changed is what does not.* [WO-G2](gates.md#wo-g2--ship-2-gate-first-grades)
*carried a box reading* **"WO-3.18 OAuth paperwork submitted, with the date recorded"** *until that day,
when WO-3.18 gained a dependency on WO-7.1 and left Ship 2 — so a grade-arithmetic gate would otherwise
have been left waiting on the token flow. That box is re-homed to WO-3.18's own third Acceptance line,
which is the same promise in the work order that owns it, and* **this `Depends on` field is what stops
the re-home from being a quiet drop.** *No box was added here to receive it: WO-3.18's already says it,
and a second one would be the duplicate reader this repository keeps refusing. Phase 7 cannot complete
without the submission, which is where the deadline always belonged.)*

**Deliverables**
- Verification approved by Google, recorded here with the date.
- Privacy policy live at the verified domain and linked from the app.
- Demo video accepted.
- ~~Sync taken out from behind its flag.~~ **Moved to
  [WO-7.4](#wo-74--the-deployed-app-has-no-sign-in-for-googles-reviewer-to-find) on 2026-09-25**,
  owner-directed: Google's reviewer has to find the permission in use on the submitted domain, so the
  flag had to come down ahead of approval rather than after it. What this work order keeps is the
  approval itself, the demo video, and the no-warning consent screen. When the approval lands, one
  thing here is owed that WO-7.4 left behind on purpose: **delete `TESTING_MODE_NOTE` in
  `src/auth.js`** (and the `#driveTestingNote` paragraph in `index.html`), the Drive panel's line
  saying only listed test accounts can connect — it goes false the day Google approves.

*(**Both halves are paid now — the second by WO-7.4 on 2026-09-25, which widened the function; the
note below is the record of the first, kept as written.**)*

*(**One half of "sync taken out from behind its flag" is already paid — 2026-08-24.** `src/auth.js`
says twice that this work order widens `hostAllowsSignIn()` *in the same sitting as* it adds the
deployed origin to the OAuth client, because widening one and not the other ends in Google's
`origin_mismatch`. **The console half is done**: the client has carried both
`https://localhost:8443` and `https://planbook.hwgteach.com` since 2026-08-21, confirmed by the owner
in the console on 2026-08-24 and recorded in
[WO-3.10](phase-3-gradebook.md#wo-310--the-oauth-client-exists-and-asks-for-one-scope)'s table. So
what is left of that pairing is **the one function**, and a reader of those comments should not book a
console trip for the other half. The safety argument behind the pairing is untouched and still points
the same way: the code is the half that is behind, so nothing can reach a live handshake early.)*


**Acceptance**
- [ ] A teacher signing in from a clean Google account sees one scope and **no unverified-app
      warning**. Verify on an account that has never used the app.
- [ ] The privacy policy is reachable from inside the app.
- *(Third line, "Sync is available without a flag, and still off by default", **moved to
  [WO-7.4](#wo-74--the-deployed-app-has-no-sign-in-for-googles-reviewer-to-find) on 2026-09-25**
  with the deliverable it tested — that work order's first four Acceptance lines are its form, and
  a box is closed by one work order, never two. Not a checkbox here any more so that it cannot be
  ticked twice or left open by accident.)*

---

## WO-7.5 — the header says how fresh this device's sync is

**Ship** — · **Status** ✅ DONE — 2026-09-26 · **Size** M · **Depends on** WO-7.2 — the transfer whose state the button reads, and the bookmark it counts from
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
- [x] A device that has never connected draws the header exactly as today, and makes no request to
      `accounts.google.com` — asserted from the network in the harness, as WO-7.4's second line was.
      *(`verify/sync-button.mjs`, 2026-09-26: `0 request(s) to accounts.google.com and 69 to this
      origin`, five controls laid out, no badge — and opted in, the same reload asks `/gsi/client`.)*
- [x] Connect sets the opt-in, Disconnect clears it, it survives a reload, and nothing but a boolean
      reaches `localStorage` — asserted in the harness.
      *(Real Connect and Disconnect taps: `"true"`, kept across a reload, then `"false"`; no token in
      the store. `TESTING.md` § WO-7.5.)*
- [x] Each of the six states draws its reading and does its tap, asserted in the harness; *ahead*
      appears after a save that has not synced and clears after one that has.
      *(All six read and tapped; the lapsed tap's one visible request is made in the click listener's
      own stack, which a mutation one `.then` late turns red. `TESTING.md` § WO-7.5.)*
- [x] At 390×844 the header draws no fifth button and the About button carries the badge in every
      state but *up to date*; at iPad width the sync button sits last before About. `verify-shell.mjs`
      measures the row at both widths, and its existing 390px slack figure does not move.
      *(Slack 5.92px opted out and 5.92px in all six states; at 834×1194 the button is 44×44 and
      immediately before About in all six. The "~8px" in ruling 2 is the remembered figure.)*
- [x] A last sync on an earlier calendar day draws the stale state on first launch, asserted with
      `--today` moved a day past the bookmark's `at`.
      *(A real sync's bookmark, then a relaunch under `--today`'s own `Date` proxy moved one day on:
      `"Last synced yesterday at 8:05 AM."`; back on the real clock, up to date. Installed for that
      relaunch rather than taken from a whole `--today` run — a bookmark cannot outlive a run.)*
- [x] 👤 On the iPad, force-quit first, **with Safari's pop-up blocker left on**: let the sign-in
      lapse, tap the button, and Google's sign-in opens and reconnects.
      *(Read by the owner on the iPad 2026-09-26 on the deployed v131, after `61ec569`: the lapsed
      tap opened Google's window with the blocker on and reconnected.)*
- [x] 👤 On the laptop and the iPad: a save shows *ahead*, a tap brings it back to *up to date*, and
      the reading is legible at arm's length without hovering.
      *(**Laptop half read by the owner 2026-09-26** on `localhost:8443`, before the push: working
      as intended. **iPad half read the same day on the deployed v131** — ahead, back to up to date,
      legible without hovering. The same sitting found that a sync which DOWNLOADS does not repaint
      the screen behind it; that is WO-7.2's defect, outside this line, booked as WO-7.7.)*

*(**Closed 2026-09-26, and five things came out differently from what the plan predicted.** The
verifier's findings from outside the Acceptance list, recorded here so none is lost:*
**1. The privacy wording.** *Ruling 5 made an opted-in device load Google's library at launch, and the
two public documents still say it loads when Connect is tapped — booked as WO-7.6.* **2. About still
retires its Sync entry the moment the token lapses.** *The Deliverable said "the screen stops retiring
the entry point"; the implementer read "the screen" as the header, which is defensible and is an
interpretation. The header covers it, so nothing is booked.* **3. A token that lapses while the app
stays open needs two taps on the iPad** *— the first renews silently and fails, the second asks
visibly inside the gesture (`src/sync-button.js` ~60-63). Documented, not booked.* **4. The harness
tells "stale by calendar day" from "stale after 24 hours" only before 15:12 local time** *— after that
the two readings agree. The verifier proposed planting a sync at 23:30 and reading at 00:30, and it was
booked as WO-7.8 the same day, owner-directed.* **5. A sync that downloads does not repaint the screen** *— found by
the owner on the iPad, WO-7.2's defect, booked as WO-7.7.)*

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

## WO-7.6 — the privacy documents say Google loads only on the Connect tap, and since WO-7.5 it also loads at launch

**Ship** — · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** WO-7.4 — the narrowed third-party sentence this re-words
**Closes roadmap** *(no box. A correction to two public documents and the notes that quote them.)*

**Booked 2026-09-26**, owner-directed, out of WO-7.5's verdict. The verifier returned PASS WITH
MANUAL CHECKS and named, outside the Acceptance list, one finding to settle **before the tree is
committed**: WO-7.5's ruling 5 made opting in the consent to reconnect at launch, so **a device that
has connected now loads Google's sign-in library and asks `accounts.google.com` for a token silently
on every launch and every return to the app, with no tap.** The public sentence in `privacy.html` and
`docs/FERPA.md` — *"Nothing is fetched from Google until Connect is tapped."* — survives only if
*until* is read as *before the first time*, and a policy a district reads should not need that
reading. Four internal notes say something flatly false.

**Why it is its own work order and does not wait for WO-7.5 to close.** WO-7.5's two open lines are
👤 iPad readings, and the iPad can only take them on the deployed app — `hostAllowsSignIn()` keeps the
LAN address shut — so WO-7.5 closes *after* a push. The owner ruled the wording lands *before* that
push. So this work order names WO-7.4 as its dependency rather than WO-7.5, which would make the two
wait on each other; **its subject is WO-7.5's launch-time renewal as it stands in the tree**, and
`src/sync-button.js` and `src/auth.js`'s `loadGis()` are the facts to describe. If WO-7.5's tree is
still uncommitted when this starts, read it as it is; do not change its code.

**Deliverables**
- **`privacy.html` and `docs/FERPA.md`, in the same sitting and identically in the shared data-flow
  statement** (`CLAUDE.md` § Accommodations). The third-party sentence says what happens now, in words
  a teacher and a technology director can both read: Google's sign-in library loads from
  `accounts.google.com` **only on a device where Google Drive sync has been connected — first when
  Connect is tapped, and after that each time Planbook opens or comes back to the screen on that
  device, until Disconnect is tapped** — and a device that has never connected fetches nothing from
  Google. The exact words are the implementer's; the claim is not. The policy's *Last updated* date
  changes.
- **The comment above each copy** of the statement (`privacy.html` ~276-278, `docs/FERPA.md` ~80-85)
  names both ways the library is reached, not only the Connect tap.
- **The notes that claim the old sentence is "still true word for word"** say what is true instead:
  `src/auth.js` (`loadGis()`'s comment), `src/sync-button.js` (the launch-renewal comment),
  `docs/sync.md` (~68-71 and the WO-7.5 section ~478-479), and `index.html`'s Drive block comment
  (~2135). **`CLAUDE.md`'s WO-7.4 parenthetical** ("Google's library loads only on the Connect tap")
  and the WO-7.1 block's *"a reload is a sign-out"* are corrected there, and `AGENTS.md` is checked for
  a twin in the same sitting. Dated history — WO-7.4's own record in this file, `CHANGELOG.md`, old
  `TESTING.md` sections — stays as written.
- **`about.html` is read and left alone unless it now overclaims**: its sync item names the scope and
  says nothing about when the library loads, which is WO-8.15's first Trap working as meant.
- **`CACHE` in `sw.js` bumped** only if a file in `SHELL` moves (a comment in `index.html` or
  `src/auth.js` counts). WO-7.5 already bumped it once in the uncommitted tree; one bump per deploy is
  enough, so check whether the tree's value has shipped before bumping again.

**Acceptance**
- [ ] The shared data-flow statement in `privacy.html` and `docs/FERPA.md` is identical after tags,
      backticks and whitespace are normalised, names both the Connect tap and the launch-time
      renewal, and says a device that never connected fetches nothing from Google.
- [ ] No file outside dated history still says the library loads only on the Connect tap, or that the
      public sentence is still true word for word — shown by a grep, quoted in `TESTING.md`.
- [ ] The existing network assertions still hold: a device never connected makes no request to
      `accounts.google.com` (WO-7.4's and WO-7.5's first lines), and `verify-shell.mjs` is green.
- [ ] `verify-deploy.mjs` green after the push, with its policy claims re-read for anything that
      asserted the old wording.

**Traps** — **Change the words, never the behaviour.** Ruling 5 is the owner's and this work order does
not revisit it; a sentence that describes a narrower app than the one shipped is the thing being
fixed, not a licence to narrow the app. **The two documents change together or not at all.** **Do not
say "connected" and mean "signed in"**: since WO-7.5 a device can be opted in with its sign-in lapsed,
and it still loads the library at launch — the sentence is about the opt-in. **And no new claims**: the
policy is a public promise a district may hold us to, so it says what the app does and nothing about
what it might do next.

---

## WO-7.7 — a sync that downloads leaves the screen showing the document it replaced

**Ship** — · **Status** 🔍 AWAITING VERDICT — 2026-09-26 · **Size** S · **Depends on** WO-7.2 — the download path this repaints after
**Closes roadmap** *(no box. A defect in WO-7.2's download, found reading WO-7.5.)*

**Booked 2026-09-26**, from the owner's iPad reading of WO-7.5 on the deployed v131: *"syncing isn't
redrawing the screen when it's pulling down information."* WO-7.5 itself passed. This fault is older.
WO-7.5 just made it easy to hit, because the header button lets a teacher sync while she is looking
at the gradebook instead of from inside About.

**Why it happens.** When `syncNow()` in `src/drive-sync.js` plans `download`, it calls
`store.adoptRemoteDocument(incoming)`. That puts the downloaded document in memory and in IndexedDB,
and then calls the store's `notify()`. **No screen subscribes to the store, on purpose**:
`src/classes.js`, `src/home.js`, `src/scores.js`, `src/detail.js`, `src/assignments.js` and
`src/calendar-view.js` each say they do not subscribe, because a subscriber fires on every save.
The only subscriber is `src/sync-button.js`. So the data changes underneath and the screen keeps
drawing the document it replaced until something else redraws it: a navigation, a reload, a
relaunch. **The comment above the `[data-drive-sync]` handler in `src/shell.js` (~2150-2155) says the
opposite**: *"notify() is what every screen in this app already listens to."* That was false the day
it was written, and it is why nothing repaints.

**The precedent is already in the file.** A restore also replaces the whole document, and
`src/shell.js` repaints after it by chaining `afterRestore` onto `backup.confirmRestore()`. A year
switch does the same with `afterYearChange()` (~912), which redraws the class bar, the open screen
and the header identity, and empties the template editor. A download is the same kind of event.

**Deliverables**
- **After a sync whose outcome is `downloaded`, the open screen is redrawn from the new document.**
  This applies from both doors: the About panel's **Sync** and the header button's tap
  (`src/sync-button.js` `tapSyncButton()`, which today repaints only the button via `afterSync`).
  Use the repaint the year switch and the restore already use rather than a new one, chained where
  those are chained, in `src/shell.js`, not inside `src/drive-sync.js` (the import-loop reason the
  restore's comment gives). The implementer decides whether that is `afterYearChange()` itself or a
  named sibling, and says why at the call.
- **Only on `downloaded`.** An upload, *nothing to do*, a conflict or a failure leaves this device's
  document as it was, so the screen does not need redrawing and must not flicker.
- **The false comment in `src/shell.js`** says what is true, and so does any other note that claims
  screens hear `notify()`.
- **`CACHE` in `sw.js` bumped**, because `src/shell.js` is in `SHELL`.

**Acceptance**
- [x] In the harness, a download from each door changes what the open screen draws. Plant a remote
      document with a different score or student name, sync, and read the new value off the page
      with no navigation in between. Mutation-proved: removing the repaint turns the check red.
- [x] An upload and an in-sync sync do not redraw the screen, asserted in the harness.
- [ ] 👤 Laptop and iPad on the deployed app: change a grade on one device, sync; on the other,
      with the same class's screen open, tap the header button and the new grade appears without
      leaving the screen.

*(Lines 1 and 2 ticked by the implementer 2026-09-26 on a green run of `verify-shell.mjs` and a
three-run mutation round; the evidence and the one mutant that is correctly not caught are in
`TESTING.md` § WO-7.7. The repaint is `afterDownload()` in `src/shell.js`, a named sibling of
`afterRestore()` — its comment says why that rather than `afterYearChange()`.)*

**Traps** — **Do not subscribe screens to the store** to fix this. Six modules explain why they do
not: a subscriber fires on every save and redraws while a teacher is typing. **A download never
lands on unsaved work**: `planFor()` downloads only when this device is unchanged since the last
sync, so the redraw cannot throw away something she typed. If it looks like it might, that is a
different bug; report it instead of guarding for it here. **Do not reload the page** to get the
redraw: it throws away the in-memory token, so every download would also sign her out.

---

## WO-7.8 — the stale-by-day check cannot tell a calendar day from 24 hours after 15:12

**Ship** — · **Status** ⬜ NOT STARTED · **Size** XS · **Depends on** WO-7.5 — the check this pins to a fixed clock
**Closes roadmap** *(no box. A hole in a harness check, found by WO-7.5's verifier.)*

**Booked 2026-09-26**, owner-directed, from finding 4 in WO-7.5's closing note. WO-7.5's ruling 4 says
an old sync turns amber **on a calendar day**, and says specifically that it must not turn amber after a
fixed number of hours, which "would go amber in the middle of a teaching day for no reason." The
harness asserts that line, but **only on a real clock that happens to be early enough in the day.**

**Why the check is blind after 15:12.** `tools/verify/sync-button.mjs` asserts the stale state in two
places, and neither can fail under a 24-hour rule after mid-afternoon:
- **The planted bookmark** (`PLANT(1, 15)`, ~551-570) is yesterday at 15:12 on the real clock. A run
  before 15:12 reads it less than 24 hours old, so only a calendar-day rule calls it stale. A run
  after 15:12 reads it more than 24 hours old, so a 24-hour rule calls it stale too, and the check
  passes either way.
- **The shifted-clock check** (`SHIFT`, ~600-632) moves the page clock exactly 24 hours past a real
  sync. At exactly 24 hours both rules agree at any time of day, so it cannot tell them apart at all.

So `freshnessOf()` in `src/drive-sync.js` could be changed to `now - at > 24h` and any run after 15:12
would stay green. Nothing is wrong with the app today. The fault is that the check which says so only
has teeth for part of the day.

**Deliverables**
- **Both directions pinned to a fixed clock, independent of when the harness runs.** Install the
  page's `Date` as a fixed moment, by the same page-start-script mechanism `SHIFT` already uses:
  - **A sync at 23:30 yesterday, read at 00:30 today**, one hour apart and across midnight, must read
    *stale*. A 24-hour rule reads it as current.
  - **A sync at 00:30 today, read at 23:30 today**, 23 hours apart and on one day, must read *up to
    date*. A rule with a threshold shorter than a day reads it as stale.
- **The existing checks keep what they prove**: the reading's wording, "on Sep 23" for older syncs,
  and a tap bringing it back. Narrow or replace them in place rather than adding a second copy of
  the same claim.
- Harness only. **No file in `src/` moves**, so `sw.js`'s `CACHE` does not move either.

**Acceptance**
- [ ] Both fixed-clock cases pass, and the run's own output names the two planted times and the two
      page clocks.
- [ ] Mutation-proved in both directions: `freshnessOf()` changed to a 24-hour rule turns the
      midnight case red, and to a 12-hour rule turns the same-day case red. **Both mutations are
      reverted before anything else is written** (`AGENTS.md`).
- [ ] The whole browser harness is green on the real clock and again with `--today` moved.

**Traps** — **Do not pin the whole run's clock.** A run on a moved clock is evidence about a
different day for every other section, which is why `SHIFT` is installed for one reload and then
removed. Do the same. **Local time, not UTC**: `localDayOf()` is local on purpose, and a check
written in UTC would test a different midnight from the teacher's.

---

## WO-7.9 — a fresh device cannot open the year it already has in Google Drive

**Ship** — · **Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-7.2, WO-7.5, WO-7.7 — the download and its validation, the opt-in a pull must set, and the repaint a pull must trigger
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
