# WO-7.16 — the privacy documents say Google loads only on Connect, and since WO-7.9 a fresh device has a second door · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-7-sync.md`
**Report to** `.claude/dispatch/WO-7.16-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at Opus (no override). Two signals decide it: the work edits `docs/FERPA.md`,
which is a sensitive surface and is never delegated, and it rewrites public, teacher-facing prose
that a district may hold us to (ROUTING § "Route to Claude", bullets 1 and 4). The runner-up was
Codex, since the work order is size S and fully specified, and I set it aside on the
sensitive-surface rule alone.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-7.16 — the privacy documents say Google loads only on Connect, and since WO-7.9 a fresh device has a second door

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-28 · **Size** S · **Depends on** WO-7.6 — the wording this re-words
**Closes roadmap** *(no box. A correction to two public documents and the notes that quote them.)*

**Booked 2026-09-28**, owner-directed, out of WO-7.9's verdict. The verifier returned PASS WITH
MANUAL CHECKS and its implementer declined, correctly, to edit the public documents (WO-7.9's trap 4).
WO-7.9 put **Open from Google Drive** into the empty state of an untouched device. That tap does what
Connect does — `src/first-run.js` calls `auth.reconnect()` first inside the gesture, which loads
Google's sign-in library from `accounts.google.com` and asks for a token, and a successful sign-in
sets the WO-7.5 opt-in. But `privacy.html` (~299-303) and `docs/FERPA.md` (~104-108) say the library
**"loads first when Connect is tapped"**, that a sign-in is asked for **"only when Connect or the sync
button is tapped"**, and that **"on a device where Connect has never been tapped, nothing is fetched
from Google."** A teacher who opens her year on a new iPad from the first screen never taps Connect,
and the device has fetched from Google. The sentence is false on the day WO-7.9 deploys.

**Why it is its own work order and ships in the same push as WO-7.9.** WO-7.9 is committed (`665b18c`)
and verified, and deliberately **not pushed**: a push to `main` is a production deploy, and its two
open lines are 👤 readings that can only be taken on the deployed app. So WO-7.9 closes *after* a push,
and the owner ruled that push carries this wording too, so the live `/privacy` is never wrong. This is
WO-7.5 → WO-7.6 again, and it takes the same shape: it names WO-7.6 as its dependency rather than
WO-7.9, which would make the two wait on each other, and **its subject is WO-7.9 as committed** —
`src/first-run.js`, `src/drive-sync.js`'s `listDriveYears()` and `pullYear()`, and `src/auth.js`'s
`loadGis()` are the facts to describe. It must also land **before WO-3.18 submits**, because
`/privacy` is the page Google's reviewer reads.

**Deliverables**
- **`privacy.html` and `docs/FERPA.md`, in the same sitting and identically in the shared data-flow
  statement** (`CLAUDE.md` § Accommodations). The third-party sentence says what happens now, in words
  a teacher and a technology director can both read: Google's sign-in library loads **first when the
  teacher taps Connect in About, or Open from Google Drive on the first screen of a device with
  nothing on it yet**; after that, on that device, it loads each time Planbook opens until sync is
  switched off; a sign-in is asked for **only on a tap** (Connect, the sync button, or Open from Google
  Drive); and **a device where neither Connect nor Open from Google Drive was ever tapped fetches
  nothing from Google.** The exact words are the implementer's; the claim is not. The policy's *Last
  updated* date changes.
- **The comment above each copy** of the statement (`privacy.html` ~272, `docs/FERPA.md` ~80) gains a
  WO-7.16 sentence naming the first-run door as a third way `loadGis()` is reached, in the same dated
  style as the WO-7.6, WO-7.10 and WO-7.11 sentences already there.
- **The notes that say a device where Connect was never tapped fetches nothing** say what is true
  instead, or are shown to be still true where they read: `index.html` (~2185, the Drive block
  comment), `src/auth.js` (~430), `src/sync-button.js` (~471), `docs/sync.md` (~79 and ~562), and
  **`CLAUDE.md`'s WO-7.4 parenthetical** (~128, "a device where Connect was never tapped loads no
  Google library"), with `AGENTS.md` checked for a twin in the same sitting. Dated history — earlier
  work orders' own records in this file, `CHANGELOG.md`, old `TESTING.md` sections — stays as written.
- **`about.html` is read and left alone unless it now overclaims**, as WO-7.6 did.
- **`CACHE` in `sw.js` bumped** only if a file in `SHELL` moves (a comment in `index.html` or
  `src/auth.js` counts). WO-7.9 bumped it to v143 and **v143 has not shipped**, so a second bump is
  not needed if this lands before the push; check `git log origin/main -- sw.js` before deciding.

**Acceptance**
- [ ] The shared data-flow statement in `privacy.html` and `docs/FERPA.md` is identical after tags,
      backticks and whitespace are normalised (the method in `TESTING.md` § WO-7.6), names both
      Connect and Open from Google Drive as the first load, and says a device where neither was ever
      tapped fetches nothing from Google.
- [ ] No file outside dated history still says the library loads first, or only, on the Connect tap,
      or that a device where Connect was never tapped fetches nothing — shown by a grep, quoted and
      each hit classified in `TESTING.md`.
- [ ] The existing network assertions still hold: a device that takes neither door makes no request
      to `accounts.google.com` (WO-7.4's, WO-7.5's and WO-7.9's third line), and `verify-shell.mjs`
      is green.
- [ ] `verify-deploy.mjs` green after the push that carries this and WO-7.9, with its policy claims
      re-read for anything that asserted the old wording, and the live `/privacy`, tags stripped,
      carries the new *Last updated* date and names Open from Google Drive.

**Traps** — **Change the words, never the behaviour.** WO-7.9's door and its rulings are the owner's
and this work order does not revisit them; a sentence describing a narrower app than the one shipped
is the thing being fixed. **The two documents change together or not at all.** **Do not say "sync
turned on" and mean "the door was tapped"**: a tap on Open from Google Drive that is cancelled at
Google's window has loaded the library and set no opt-in, so the sentence about the *first* load is
about taps, and the sentence about *every launch* is about the opt-in. **Do not push.** The push that
deploys this also deploys WO-7.9, and it is the owner's to make. **And no new claims**: the policy is a
public promise a district may hold us to, so it says what the app does and nothing about what it might
do next.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/FERPA.md`
  - `docs/sync.md`
  - `src/auth.js`
  - `src/drive-sync.js`
  - `src/first-run.js`
  - `src/sync-button.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `privacy.html` (~272-305), `about.html`, `index.html` (~2185), `CLAUDE.md` (~128, the WO-7.4
  parenthetical), and `AGENTS.md` (check it for a twin).
- `TESTING.md` § WO-7.6 has the normalise-and-compare method, and WO-7.6 in `phase-7-sync.md` is the
  precedent: same shape, same two files. Write a `TESTING.md` § WO-7.16 that takes the same form.
- `tools/verify-deploy.mjs`: read its policy claims now (grep for `Connect`, `accounts.google`,
  `Last updated`). If one asserts the old wording, the push that carries this work order goes red.
  Update the claim in this sitting so it matches the new text. That is inside scope: Acceptance
  line 4 asks for exactly this.

**Orchestrator facts, already checked (2026-09-28).** `origin/main:sw.js` is `planbook-shell-v142`.
Locally it is v143, from WO-7.9, and that has not shipped. So **do not bump `CACHE`**, even if you
edit a comment in `index.html` or `src/auth.js`. Two local commits are ahead of origin (`665b18c`
and `b2092f3`).

**Lines you cannot close, and must not tick.** Acceptance line 4 (`verify-deploy.mjs` green after
the push, and the live `/privacy`) needs a push, and **the push is the owner's to make. Do not
push, and do not commit either.** Leave the tree dirty for the verifier. Report line 4 as owed after
the push.

**Traps to hold hard.** Treat each of these as a hard rule:
- **Taps and the opt-in are two different things.** The *first load* sentence is about taps. The
  *every launch* sentence is about the WO-7.5 opt-in. A cancelled tap on Open from Google Drive
  loads the library and sets no opt-in.
- **Check the claim against the committed code before you write it:** `src/first-run.js`,
  `auth.reconnect()`, `loadGis()`, and where the opt-in is actually set. This work order describes
  the app as it is and adds no new claims.
- **Leave dated history as written.** That means earlier work orders' records, `CHANGELOG.md`, and
  old `TESTING.md` sections. The Acceptance line 2 grep classifies each hit rather than rewriting it.
- **Report stays short.** Say which lines you ticked, the grep hits and how you classified each one,
  the verify-shell result, and the diffstat. Watch for line-ending churn: question any whole-file
  diff you did not intend.

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

1. The shared data-flow statement in `privacy.html` and `docs/FERPA.md` is identical after tags, backticks and whitespace are normalised (the method in `TESTING.md` § WO-7.6), names both Connect and Open from Google Drive as the first load, and says a device where neither was ever tapped fetches nothing from Google.
2. No file outside dated history still says the library loads first, or only, on the Connect tap, or that a device where Connect was never tapped fetches nothing — shown by a grep, quoted and each hit classified in `TESTING.md`.
3. The existing network assertions still hold: a device that takes neither door makes no request to `accounts.google.com` (WO-7.4's, WO-7.5's and WO-7.9's third line), and `verify-shell.mjs` is green.
4. `verify-deploy.mjs` green after the push that carries this and WO-7.9, with its policy claims re-read for anything that asserted the old wording, and the live `/privacy`, tags stripped, carries the new *Last updated* date and names Open from Google Drive.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

