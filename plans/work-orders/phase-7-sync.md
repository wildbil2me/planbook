# Phase 7 work orders — Drive sync (opt-in) 🔒

**Phase goal:** the same year on the laptop and the iPad, with one scope and no fear.

Branch: `phase/7-sync`. **🔒 GATED on Google OAuth verification** — the paperwork is
[WO-3.18](phase-3-gradebook.md#wo-318--verification-submitted-), not here. The gate is
calendar-bound rather than work-bound, which is why it is slotted in wherever it opens rather than
scheduled.

**But the gate is on public launch, not on building this phase.** The OAuth client
([WO-3.10](phase-3-gradebook.md#wo-310--the-oauth-client-exists-and-asks-for-one-scope), done in the
console 2026-08-11) sits in **Testing** mode with the owner as a test user, and it runs `drive.file`
today. So everything here can be built, run and used on the owner's own devices months before any
paperwork clears — the unverified-app screen is a click-through for one person who knows what it is.
**One caveat inherited from that client:** its only authorized origin is `https://localhost:8443`,
because Google will not take a raw LAN address, so the auth handshake is drivable on the laptop only
until [WO-8.7](phase-8-packaging.md#wo-87--the-name-and-the-host-decided) settles a domain. The rest
of the protocol is ordinary code and tests anywhere.

Read [`../../docs/sync.md`](../../docs/sync.md) first. The whole protocol is settled there.

**Until it lands, the Phase 1 export file is the iPad story: crude, manual, and real.** That is
acceptable, and it is why sync is last.

---

## WO-7.1 — Auth

**Ship** — · **Status** 🔒 GATED · **Size** M · **Depends on** WO-3.10 — the client, not the
verification: Testing mode issues real tokens
**Closes roadmap** Phase 7 → "Google Identity Services token flow", "Sign-in is opt-in and
reversible."

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

**Acceptance**
- [ ] The consent screen shows exactly one scope.
- [ ] Every feature outside this phase works identically signed-out. Walk the app with sync off.
- [ ] Sign-out leaves the local document intact and removes the token.
- [ ] Token expiry after ~1 hour is handled without data loss and without a silent failure.
- [ ] No refresh token is requested or stored — there isn't one in a browser flow, and building as
      if there were is how a background-sync assumption gets in.

**Traps** — **Never build a feature that assumes background or scheduled sync.** It is not possible
here. Sync is a foreground act, while the app is open and the teacher is signed in.

---

## WO-7.2 — Document transfer & conflicts

**Ship** — · **Status** 🔒 GATED · **Size** L · **Depends on** WO-7.1
**Closes roadmap** Phase 7 → "Upload/download the year document", "`rev`/`baseRev` comparison",
"Conflict: keep both", "Handle token expiry gracefully."

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

**Acceptance**
- [ ] Edit on device A, sync, open on device B: B has A's changes.
- [ ] Edit both devices while offline, then sync both: **two files exist**, the conflict copy is
      named and findable, and no edit from either side is lost.
- [ ] The conflict message names the file and where it went, in plain language.
- [ ] Killing the network mid-upload leaves the local document valid and the remote unchanged or
      complete — never half-written.
- [ ] An expired token during sync produces a re-auth prompt, not a silent no-op.
- [ ] Sync never touches a year document other than the one matched by `docId`.

**Traps** — Silent merge of two gradebooks is how you lose a term of grades and never find out. If
you find yourself writing merge logic, stop: the design says keep both. And remember **sync is not a
backup** — Drive holds one live copy that sync will happily overwrite. WO-1.5 stays mandatory.

---

## WO-7.3 — Verification complete

**Ship** — · **Status** 🔒 GATED · **Size** S · **Depends on** WO-3.18, WO-7.2 — approval cannot
follow from a client nobody submitted
**Closes roadmap** Phase 7 → "Verification complete."

**Deliverables**
- Verification approved by Google, recorded here with the date.
- Privacy policy live at the verified domain and linked from the app.
- Demo video accepted.
- Sync taken out from behind its flag.

**Acceptance**
- [ ] A teacher signing in from a clean Google account sees one scope and **no unverified-app
      warning**. Verify on an account that has never used the app.
- [ ] The privacy policy is reachable from inside the app.
- [ ] Sync is available without a flag, and still off by default.
