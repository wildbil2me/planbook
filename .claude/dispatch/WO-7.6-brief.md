# WO-7.6 — the privacy documents say Google loads only on the Connect tap, and since WO-7.5 it also loads at launch · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-7-sync.md`
**Report to** `.claude/dispatch/WO-7.6-result.md` — as your last act, and return it in-band too.

**Routing: Claude Opus** (no model override). The deciding signal is that the deliverable is public
prose — the privacy policy and the FERPA document a district may hold the app to, and ROUTING.md's
"teacher-facing prose" column names exactly that. The runner-up, Codex on "it is a mechanical grep and
reword", was set aside because the Acceptance's first line is a judgment about wording ("a teacher and a
technology director can both read"), not a checkable formula.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-7.6 — the privacy documents say Google loads only on the Connect tap, and since WO-7.5 it also loads at launch

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-26 · **Size** S · **Depends on** WO-7.4 — the narrowed third-party sentence this re-words
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

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/FERPA.md`
  - `docs/sync.md`
  - `src/auth.js`
  - `src/sync-button.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `privacy.html`, `docs/FERPA.md`, `index.html` (Drive block comment ~2135), `about.html`, `CLAUDE.md`,
  `AGENTS.md`, `tools/verify-deploy.mjs` (its policy-wording assertions), `sw.js`.

**Orchestrator notes — the traps specific to this tree (2026-09-26):**

- **WO-7.5 is committed** (`61ec569`), and WO-7.7 after it (`83127c4`). `sw.js` reads
  `planbook-shell-v132`, and the owner read **v132 on the deployed app** for WO-7.7 — so v132 has
  shipped. If you touch `index.html` or `src/auth.js` / `src/sync-button.js` (all in `SHELL`), bump to
  v133. Only one bump.
- **Change words, never behaviour.** No edit to executable code in `src/` — comments only. A diff that
  moves a non-comment line in `src/` is out of scope.
- **The shared data-flow statement must be identical** in `privacy.html` and `docs/FERPA.md` after tags,
  backticks and whitespace are normalised. Check it by extracting both and comparing, and quote the
  method in `TESTING.md`. Both files say at their tops how they pair; honour that.
- **`verify-deploy.mjs` may assert the old sentence** against the live origin. If it does, update the
  assertion to the new wording in the same sitting — otherwise the post-push run goes red for a reason
  that is the fix, not a fault. Its 4th Acceptance line is post-push and cannot be ticked by you; say so.
- **The `<!--email_off-->` wrapper in `privacy.html`** (Cloudflare Scrape Shield repair) must survive.
- **"Connected" is the opt-in, not the token** (`planbook_driveSyncOptIn`). Read `src/sync-button.js`
  and `loadGis()` for when the library is actually reached, and describe that — including the
  return-to-visibility renewal.
- **CLAUDE.md / AGENTS.md** are the watched pair (`wo-sweep.mjs` § 21). Correct the WO-7.4 parenthetical
  and the WO-7.1 "a reload is a sign-out" per the work order; note CLAUDE.md's WO-7.5 block already
  records both as history — do not duplicate it, make the older sentences stop asserting it in the
  present tense. Check AGENTS.md for a twin.
- **The grep for Acceptance line 2** goes in `TESTING.md` § WO-7.6 verbatim with its output, and
  distinguishes dated-history hits (left alone) from live claims (fixed).
- Run `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs`; both green before you report.

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

## 5. Done means these 4 lines, reported against one by one

1. The shared data-flow statement in `privacy.html` and `docs/FERPA.md` is identical after tags, backticks and whitespace are normalised, names both the Connect tap and the launch-time renewal, and says a device that never connected fetches nothing from Google.
2. No file outside dated history still says the library loads only on the Connect tap, or that the public sentence is still true word for word — shown by a grep, quoted in `TESTING.md`.
3. The existing network assertions still hold: a device never connected makes no request to `accounts.google.com` (WO-7.4's and WO-7.5's first lines), and `verify-shell.mjs` is green.
4. `verify-deploy.mjs` green after the push, with its policy claims re-read for anything that asserted the old wording.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

