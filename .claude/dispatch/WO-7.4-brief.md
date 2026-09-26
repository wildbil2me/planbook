# WO-7.4 — the deployed app has no sign-in for Google's reviewer to find · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-7-sync.md`
**Report to** `.claude/dispatch/WO-7.4-result.md` — as your last act, and return it in-band too.

**Routing.** Claude Opus, on its own merits: this work order rewrites the privacy policy and `docs/FERPA.md` (a sensitive surface, never delegated) and moves the door on the OAuth flow, and most of its bulk is teacher-facing prose that must stay word-for-word across two public documents. The runner-up was Codex for the one-function flip plus truth-table edit, which is mechanical — set aside because it is a fraction of the work and cannot be separated from the policy change it makes true.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-7.4 — the deployed app has no sign-in for Google's reviewer to find

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-25 · **Size** S · **Depends on** WO-7.2, WO-8.15 — the transfer the
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
- [ ] `hostAllowsSignIn('planbook.hwgteach.com')` is `true`; the LAN address, `hwgteach.com` and an
      unrelated host are `false`; the harness asserts the whole table.
- [ ] A signed-out page makes no request to `accounts.google.com` until Connect is tapped — asserted
      in the harness, since this is now the whole of the policy's third-party claim.
- [ ] `privacy.html` and `docs/FERPA.md` carry the narrowed third-party sentence identically, and
      neither they nor `about.html` says sync is unreleased. `verify-deploy.mjs` green after the push.
- [ ] The Drive panel names the Testing-mode limit before Connect is tapped.
- [ ] 👤 On the deployed app, cold, on the laptop: Connect reaches the consent screen with one
      permission line, the owner's own year uploads, and Disconnect leaves the app as it was.
- [ ] 👤 On the iPad, force-quit first: the Drive section is drawn and the app is otherwise unchanged.
      Download a backup before connecting the classroom year.

**Traps** — **Only the deployed origin.** Widening to "any HTTPS host" or to the LAN address sends a
live handshake to an origin the client does not list and teaches the list nothing. **Do not change
the scope, the token's lifetime or where it lives** — this work order moves a door, and adding a scope
after WO-3.18 submits restarts Google's review. **The two privacy documents change together or not at
all**, per `CLAUDE.md` § Accommodations; a policy that claims less third-party code than the app
loads is the one sentence here a district would hold against us. **And sync is still not a backup**:
the panel's existing wording on that stays exactly as it is, and the real classroom year is the one
most at risk from a first live sync.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/FERPA.md`
  - `docs/sync.md`
  - `plans/wo-3-18-video-runbook.html`
  - `src/auth.js`
  - `tools/verify/drive-sign-in.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `privacy.html`, `about.html`, `tools/verify-deploy.mjs` (its policy and `/about` checks), `sw.js` (`CACHE`, `SHELL`).
- Both WO-3.18 runbooks: `plans/wo-3-18-runbook.html` and `plans/wo-3-18-video-runbook.html` (Blocker 2, § "Decide before you shoot", the shot list).
- Stale-sentence locations the orchestrator found by grep (a starting list, not exhaustive — grep again yourself): `CLAUDE.md` (the WO-7.1 status block: "fetch no Google script, and contact Google not at all"), `AGENTS.md` (its twin, if any), `docs/sync.md`, `plans/work-orders/gates.md`, `plans/work-orders/phase-3-gradebook.md` (WO-3.18 / WO-3.10 prose), `plans/work-orders/phase-7-sync.md` (WO-7.3's fourth deliverable, its "one half is already paid" note, and its third Acceptance line move to this work order — say so in WO-7.3 rather than silently deleting them).

**Orchestrator's traps, beyond the work order's own:**
- **The harness can never be on `planbook.hwgteach.com`.** It serves on a loopback host, so the new truth-table row is proved by calling `hostAllowsSignIn('planbook.hwgteach.com')` directly, and the "no request to `accounts.google.com` until Connect" line is proved on the loopback page where the section *does* draw — watch the network (CDP) through a signed-out load and assert zero requests to that host before the Connect tap, and at least one after, so the check is not vacuous. Match the host exactly: `hwgteach.com` and e.g. `evil-planbook.hwgteach.com.example` must stay false.
- **`CLAUDE.md` and `AGENTS.md` are a watched pair** (`tools/wo-sweep.mjs` § 21). A rule changed in one is changed in the other in the same sitting; run the sweep after touching either. Do not rewrite CLAUDE.md's history blocks wholesale — correct the false present-tense claim and say when it changed, in the file's existing style.
- **The Testing-mode sentence is one exported/named constant**, drawn only while signed out and before Connect, and it must not displace or reword the panel's "sync is not a backup" copy.
- **Mutation-prove the two harness claims** (flip the host check wide; load GIS eagerly) and **revert each mutation before writing anything else** — `grep -rn MUTATION` over your delivered files must be empty when you finish. Stage your own edits before any `git checkout` used to revert a mutation.
- The 3rd Acceptance line's `verify-deploy.mjs` half needs a push, which is the owner's call (push to `main` is a production deploy). Do not push; report it as owed.
- `verify-shell.mjs` runs locally here (~4.4 min/run). Report the exact totals.

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

1. `hostAllowsSignIn('planbook.hwgteach.com')` is `true`; the LAN address, `hwgteach.com` and an unrelated host are `false`; the harness asserts the whole table.
2. A signed-out page makes no request to `accounts.google.com` until Connect is tapped — asserted in the harness, since this is now the whole of the policy's third-party claim.
3. `privacy.html` and `docs/FERPA.md` carry the narrowed third-party sentence identically, and neither they nor `about.html` says sync is unreleased. `verify-deploy.mjs` green after the push.
4. The Drive panel names the Testing-mode limit before Connect is tapped.
5. 👤 On the deployed app, cold, on the laptop: Connect reaches the consent screen with one permission line, the owner's own year uploads, and Disconnect leaves the app as it was.
6. 👤 On the iPad, force-quit first: the Drive section is drawn and the app is otherwise unchanged. Download a backup before connecting the classroom year.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

