# WO-7.1 — Auth · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-7-sync.md`
**Report to** `.claude/dispatch/WO-7.1-result.md` — as your last act, and return it in-band too.

**Route: Claude, Opus tier, no model override.** The deciding signal is `plans/work-orders/ROUTING.md`
§ "Route to Claude" bullet one — **OAuth scope decisions** is a named sensitive surface — reinforced by
that file's § "Later phases, at a glance": *all of Phase 7 (OAuth scope) is Claude-only — that is a
property of the work, not a runner's record.* The runner-up consideration set aside: the protocol is
fully written down in `docs/sync.md`, which is the "spec lives outside the work order" bullet that
usually means Codex — but the spec stops at the wire protocol and answers **none** of the three
judgment calls in § 2b below, and one of them is where a credential lives.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-7.1 — Auth

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-24 · **Size** M · **Depends on** WO-3.10 — the client, not the
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

**Acceptance**
- [ ] A sign-in completes on the owner's own account and the app receives a token — driven, not
      assumed. The unverified-app screen is expected while the client sits in Testing mode and is not
      a failure.
- [ ] The consent screen shows exactly one scope.
- [ ] Every feature outside this phase works identically signed-out. Walk the app with sync off.
- [ ] Sign-out leaves the local document intact and removes the token.
- [ ] Token expiry after ~1 hour is handled without data loss and without a silent failure.
- [ ] No refresh token is requested or stored — there isn't one in a browser flow, and building as
      if there were is how a background-sync assumption gets in.

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

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `AGENTS.md` — your rules, and it must not drift from `CLAUDE.md`.
- **`docs/sync.md` in full — all 91 lines.** The whole protocol is settled there and the work order
  points at it first. § "Auth" is yours; § "The model: whole document, last writer wins" is **not**
  (see the scope fence below).
- **`plans/work-orders/phase-3-gradebook.md` § WO-3.10** — the OAuth client as actually built. Read
  the whole entry, roughly lines 771–870. It is the file this work order is told to read the client
  id out of, it explains why the client id is public and a client *secret* never appears here, and
  it explains why the origin list is the only thing protecting this client.
- **`plans/work-orders/phase-3-gradebook.md` § WO-3.18** — what your work unblocks. Its demo-video
  deliverable must show **the scope in use**. If a teacher cannot reach your sign-in on the laptop,
  that video still cannot be filmed and this work order has not done its job.
- `src/prefs.js` — the only file allowed to touch `localStorage`, and `PREF_DEFAULTS` refuses a key
  that is not declared. Any preference you add goes there with a comment saying why it is a fact
  about this browser rather than about a student.
- `src/store.js` — its header, and the `docId` / `deviceId` block around line 85, which says in as
  many words that these are the two ids Phase 7 uses.
- `src/save-indicator.js` — its header. The `syncing` state already exists with **no caller in the
  app**, and the comment says Phase 7 owns it. Read the scope fence before you wire it.
- `src/modal.js`, `src/shell.js` (the `data-modal-open` convention around line 18 and the
  `aboutModal` exception at ~1295), and the About modal markup in `index.html` (~1567–1660) —
  including the comment block explaining why the app's first two links live in that modal and why
  there is no settings screen.
- `index.html`'s header comments around lines 236–260 — they **measure** the header's spare width at
  390px under a coarse pointer as ~46px, and presentation mode already spent it.
- `design/style-guide.md` in Roll Call! (path in `CLAUDE.md`) — only if you add a new control, and
  then lift rather than re-derive.

---

## 2b. What is already true in the tree, and the three calls you have to make

**Confirmed by the orchestrator on 2026-08-24. Re-check anything you rely on — this is a starting
point, not evidence.**

Facts:

- **`accounts.google`, `drive.file`, `gapi`, `oauth`, `clientId`, `client_id` return zero hits across
  `src/` and `index.html`.** The only two matches anywhere are prose comments in `sw.js`. You are
  writing the app's first OAuth code; nothing is half-built and there is no local pattern to match.
- **There is no `Content-Security-Policy` meta tag in `index.html`**, so loading Google Identity
  Services from `accounts.google.com` is not blocked. If you *add* a CSP, you have widened the work
  order — say so instead.
- **`sw.js` already stays out of the way**: its `fetch` handler returns early for anything that is
  not a same-origin GET (`if (url.origin !== self.location.origin) return;`, ~line 172), and the
  header comment says never to cache a response from anywhere but this origin. **Do not add the GIS
  script to `SHELL` and do not cache a cross-origin response.**
- **`CACHE` is `planbook-shell-v93` in `sw.js`, and `./` is entry one of `SHELL`** — so an
  `index.html` edit means a `CACHE` bump in the same commit, or no device sees your change at all.
- **`baseRev` exists nowhere in `src/`** — only in `docs/sync.md` prose. That is correct today; see
  the fence.
- **`tools/README.md` states that `verify-shell.mjs` holds `1078 check() call sites`, and
  `tools/wo-sweep.mjs` reads that sentence and diffs it against the file.** Add a `check()` and that
  number is stale and **the sweep goes red on your work being done** — the WO-3.26 scar exactly. Fix
  the number in the same edit, and mind that it counts *lines holding a call*, not executions.

The three judgment calls — this is why the work order came to Claude, and each one wants an argued
decision with a comment at its own point of departure, in this repo's house style:

1. **Where the sign-in control lives.** The header has no room (measured above, and presentation mode
   took the last of it), and the About modal says in as many words that this app has no settings
   screen. Candidates include the About modal (where the "no account and no server" claim and both
   privacy links already are) and the Backup & restore panel (the app's other "what leaves this
   device" surface). Pick one, and write down why the other lost.
2. **What "behind a flag" means here.** `docs/sync.md` says sync stays behind a flag until the client
   is verified, and WO-7.3's deliverable is *"Sync taken out from behind its flag."* So the flag is
   yours to define — but it has to be **reachable by the owner on the laptop today**, because WO-3.18
   cannot film a video of a control nobody can get to. A flag that hides the sign-in from its only
   intended user this term is a deadlock of the same shape the work order's own note describes.
3. **Where the access token lives — and this is the one with a wrong answer.** It is not student data
   and it is not a UI preference, so `src/prefs.js`'s `PREF_DEFAULTS` would refuse it and should. An
   access token in `localStorage` outlives the tab, survives a shared or handed-over device, and is a
   credential sitting in the storage this project restricts to UI preferences. Argue for memory only,
   or argue against it explicitly — do not decide it by omission.

Two more things that are easy to get wrong:

- **The consent screen must show exactly one scope**, and the way to guarantee that is to request
  exactly one scope string, in exactly one place in the code:
  `https://www.googleapis.com/auth/drive.file`. Not `spreadsheets`, not a mail scope, not
  `drive.appdata`, not `openid`/`profile`/`email` added for convenience — every extra string is a
  line on a screen a teacher reads and fears.
- **`prompt: ''` first, a visible prompt when that fails**, and **no refresh token requested or
  stored** — there isn't one in a browser flow, and code written as if there were is how a
  background-sync assumption gets in. The work order's Traps line is the same point: sync is a
  foreground act.

---

## 2c. Scope fence — this work order is auth and nothing else

It has no **Out of scope** line, so this is the brief's fence. Each of these belongs to a named later
work order, and building it here is widening:

- Upload, download, `files.list`, `appProperties.docId` matching, `rev`/`baseRev` comparison, the
  conflict copy, and the "network killed mid-upload" path → **WO-7.2**.
- **Wiring `save-indicator`'s `syncing` state** → WO-7.2's own deliverable, verbatim: *"The save
  indicator's syncing / queued / retry states wired up."* Leaving `syncing` with no caller is the
  correct outcome of this dispatch.
- `docs/sync.md`'s *"Open for Phase 7, not decided here"* paragraph — what a backup restored from a
  different device does to `docId` — → **WO-7.2**, which is the work order that matches files.
- Taking sync out from behind the flag, and anything about a *verified* client → **WO-7.3**.

If you conclude one of these genuinely has to move, **say so in your report as a proposed follow-up
work order** and leave it unbuilt.

You may and should update `docs/sync.md` and `plans/` prose for what you actually decided, and add
`TESTING.md` lines for the human readings below. Leave the `CHANGELOG.md` entry to the teacher.

---

## 2d. Two Acceptance lines cannot close at a desk

**Acceptance 1 (a sign-in completes and the app receives a token) and Acceptance 2 (the consent
screen shows exactly one scope) require a real Google account in a real browser.** They cannot be
driven headless and they are not yours to tick — mark them as needing a human, name the exact steps,
and leave the boxes `- [ ]`.

The procedure they need, so the report can hand it over ready to run: the client's **only** authorized
JavaScript origin is `https://localhost:8443`, which is what `node tools/serve-https.mjs` serves, so
the handshake is drivable **on the laptop only** until WO-8.7 settles a domain — not on the iPad, and
not on the LAN address. The unverified-app screen **is expected** while the client sits in Testing
mode with the owner as the sole test user, and it is not a failure.

Acceptance 5 (token expiry after ~1 hour) will not be observed inside a dispatch either. Say how the
code handles it, say what a human would have to sit through to see it, and be honest about which half
you proved.

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
  exceptions: **never tick a 👤 line** — it needs a real iPad and you do not have one — and leave the
  `CHANGELOG.md` entry to the teacher, who decides what a change means. Anything you do tick must be
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

1. A sign-in completes on the owner's own account and the app receives a token — driven, not assumed. The unverified-app screen is expected while the client sits in Testing mode and is not a failure.
2. The consent screen shows exactly one scope.
3. Every feature outside this phase works identically signed-out. Walk the app with sync off.
4. Sign-out leaves the local document intact and removes the token.
5. Token expiry after ~1 hour is handled without data loss and without a silent failure.
6. No refresh token is requested or stored — there isn't one in a browser flow, and building as if there were is how a background-sync assumption gets in.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

