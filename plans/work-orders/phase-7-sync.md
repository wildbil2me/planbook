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
`https://localhost:8443` since 2026-08-21, so what keeps the handshake on the laptop today is
`hostAllowsSignIn()`'s own list and nothing else; widening it is WO-7.3's one edit. The rest of the
protocol is ordinary code and tests anywhere. *(This paragraph said the client had one authorized
origin until 2026-09-07.)*

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
  that sentence conditional; that is the argument that settled it. **WO-7.3 widens that one function, and the
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
      take until WO-7.3. The runnable form is **two browser profiles at `https://localhost:8443`**,
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
- Sync taken out from behind its flag.

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
- [ ] Sync is available without a flag, and still off by default.
