# WO-5.14 — The compose doors take a list, and which header the others ride in · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-5-outreach.md`
**Report to** `.claude/dispatch/WO-5.14-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude, at **Opus**. `ROUTING.md` names all of Phase 5 as Claude-only as a
property of the work, and this row's first deliverable is a disclosure ruling — which header the
non-primary recipients ride in, argued in terms of who can see whose address — plus two judgment
Traps (one shape only; keep the CRLF/LF split). The runner-up set aside: the encoding half
(map-then-join, string-to-list across three builders) is Codex-shaped, but it cannot be cut away
from the ruling it implements, and a tie goes to Claude anyway.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-5.14 — The compose doors take a list, and which header the others ride in

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-20 · **Size** M · **Depends on** WO-5.3

**The dependency is WO-5.3 and not WO-5.12, deliberately.** WO-5.12 built two of the three doors
this row changes, so it is the obvious id to name — and naming it would gate this row on a 👤 line
nobody can currently close: WO-5.12 is 🔨 on *"Preference at Outlook on the web, in any browser with
an Outlook account"*, and its own text says **the owner has no Outlook account on hand**. The three
builders are in the tree and stable whatever that reading does; a dependency that cannot be
discharged is a row that never starts. **WO-5.3 is what created `mailtoUrl()` and `draftText()`**,
which is the honest floor for this work. *(Said here rather than left to be rediscovered: the gate
refused `WO-5.12` on 2026-09-20 and this is the answer, not an oversight.)*

**Why it exists.** [WO-5.8](#wo-58--several-recipients-and-one-of-them-is-primary) said it owed an
argument nobody had made: **which header do the non-primary recipients ride in — To, Cc, or Bcc?**
A guardian who can see the counselor's address is a different thing from one who cannot, and that is
a disclosure question rather than a formatting one. **This row makes that argument, and implements
it, before the picker exists** — so the picker consumes a settled ruling instead of making one at
the point in a build where the budget is thinnest. Cut out of WO-5.8 on 2026-09-20.

**It lands invisibly, which is the point.** The model passes one-element lists, the app behaves
exactly as it does today, and the multi-address behaviour is proved by harness fixtures calling the
builders directly. That is clean here and nowhere else: `wo-sweep.mjs` § 24 already forbids
`src/outreach.js` from importing the store or mutating the document, so these are pure functions
over a hand-built draft object.

**Deliverables**
- The ruling, written down at its own point of departure in `src/outreach.js`, with the disclosure
  argument for it — not a comment saying which header, a comment saying **why that header**.
  `src/outreach.js` has **no bcc anywhere today**, so choosing one is a new field, not a toggle.
- `encodeAddress()` (`src/outreach.js:228-230`) over a list. It runs `encodeURIComponent` across the
  whole string and restores only `@`; a comma-joined list comes back with `%2C` between addresses,
  which is **not** the RFC 6068 to-list grammar. It becomes map-then-join.
- `draft.to` and `draft.cc` become lists, across all three builders that share them:
  `mailtoUrl()` (`:261-271`), `composeUrl()` (`:409-427`, the Gmail and Outlook doors), and
  `draftText()` (`:492-505`) for the clipboard — whose `Name <addr>` line and admin special-case
  (`:498`) need the same treatment.
- The ceiling recounted. `MAILTO_CEILING = 2000` (`:304`), `overCeiling()` (`:306`), `ceilingFor()`
  (`:432`) measure the **whole encoded URL**, so several addresses eat into the same budget the body
  does. The warning at `src/outreach-view.js:787-810` must count what is actually on the wire.

**Acceptance**
- [ ] All three doors — default, Gmail and Outlook — carry several addresses, each correctly
      encoded, and copy-to-self behaves as WO-5.3 proved. *(The builders' half of WO-5.8's line
      "The `mailto:` URL carries every chosen recipient", moved here at the cut of 2026-09-20; the
      picker's half stayed with WO-5.8.)*
- [ ] The header the non-primary recipients ride in is chosen, and the disclosure argument for it is
      written down where the code makes it. *(The argument WO-5.8's Deliverables said that row owed,
      moved here at the cut.)*
- [ ] The ceiling warning counts every address on the wire, and still **warns rather than
      truncates** — nothing truncates today and nothing starts to here.

**Traps** — **One shape only.** Do not let the builders accept both a string and a list "so nothing
breaks"; this repo does not keep two truths, and the second one is what rots.

Second: `encodeField()` (`:249`) normalises to CRLF for `mailto:` and `encodeComposeField()` (`:400`)
to LF for webmail, and that split is argued at `:339-349`. **Do not collapse it while you are in the
file.** A deleted CRLF normalisation is invisible on screen and produces exactly the
mangled-paragraph email WO-5.3's Traps line exists to catch — it is one of the five live mutations
that sitting's dead dispatch left behind.

Third: `MAIL_DOORS` (`:380-384`) and `ceilingFor()` return `null` for the webmail doors on purpose —
the 2,000 is ShellExecute's limit and belongs to the default door alone. Do not give the webmail
doors a ceiling while making the count correct for the one that has one.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/outreach-view.js`
  - `src/outreach.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `tools/verify/outreach.mjs` — the harness section that drives this screen. It already reaches
  the pure module as `window.planbook.outreach.<name>` (line ~1902 calls `draftText` directly with a
  hand-built draft); the multi-address fixtures this work order asks for go in the same shape, in
  this file, not in a new one.
- `tools/wo-sweep.mjs` § 24 — the fence on `src/outreach.js` (no store import, no document
  mutation), and line ~2858's `ANSWERS` list of exported names. If you add an export, read that
  block before deciding whether the list needs it.
- `plans/work-orders/phase-5-outreach.md` § WO-5.8 (line 905) — the row that will *consume* your
  ruling. Read its Deliverables and third Acceptance line so the shape you hand it is the shape it
  expects: a primary, plus the rest riding in the header you choose.

### What the orchestrator wants you to know before you start

**The callers today.** `src/outreach-view.js` builds the draft object in exactly two places, both in
`outreachModel()` — the `composeUrl({ to, cc, subject, body }, mail)` call at ~line 545 and the
`draftText({ to, name, cc, subject, body })` call at ~line 562. `to` is `chosen.email` (one string)
and `cc` is the copy-to-self address or `''`. Under "one shape only" those become one-element lists
(and `[]` for no cc) at the call site — the view is where the string becomes a list, and the
builders never accept a bare string. `name` is the primary's name and stays a scalar: the primary is
one person; `draftText()`'s `Name <addr>` form is for the primary only, and any further To
addresses ride bare after it. Say so at the point of departure.

**The harness assertions you will move.** `tools/verify/outreach.mjs` asserts exact URL strings
in several places (search `mailto:` and `mail.google.com` in it) and the `draftText` fixture at
~1902 hands in scalar `to`/`cc`. Every one of those fixtures changes to the list shape — do not
leave a string-accepting compatibility branch in the builder to keep an old fixture green. That
branch is exactly the second truth the first Trap forbids.

**The ruling is a comment, and it has a shape.** Deliverable 1 asks for *why that header*, at the
point of departure in `src/outreach.js`. The argument the work order wants made is a disclosure
one: who, among the people on one message, can see whose address. Weigh at least these three
facts in it — a guardian and a counselor are not peers, and a parent seeing an admin's direct
address (or vice versa) is a different thing from two guardians of one student seeing each
other's; Bcc hides the list from every recipient including the primary, so the primary does not
know who else was told, which is its own kind of dishonesty on a message about a child; and Cc is
visible to all and says "these people were told too", which is the thing a counselor copy is for.
Whatever you rule, the comment must let a later reader disagree with it on its own terms, and
WO-5.8 will build to it without re-opening it. If you introduce `bcc`, it is a third list field
carried through all three builders and `draftText()`'s block, with the same empty-header rule
`mailtoUrl()` already keeps for `cc`.

**Do not touch these while you are in the file.** `encodeField()` (CRLF) and
`encodeComposeField()` (LF) stay as they are — the work order's second Trap, and one of WO-5.3's
five live mutations. `ceilingFor()` keeps returning `null` for the webmail doors — third Trap. The
`overCeiling()` measure stays on the whole encoded URL; the fix for the ceiling is that the URL
now *contains* every address, so the count is right by construction. Confirm that with a fixture
(a draft with several long addresses that crosses 2,000 only because of them) rather than by
reasoning.

**Presentation mode.** `outreachModel()` returns before any recipient is built when the projector
is on. Nothing here changes that, and nothing here should read the roster — the builders take a
draft object and nothing else, which `wo-sweep` § 24 enforces.

**Verification.** `node tools/verify-shell.mjs` is ~4.4 minutes and usually cannot run in a
sandboxed agent; if it cannot run for you, say "could not run" and do not tick the line it
would have closed. `node tools/wo-sweep.mjs` must stay green — if it goes red on a count you grew
(a `check()` total recorded in `tools/README.md`), fix the recorded number; that is the sweep line
that goes red on work being done rather than wrong. Mutation-prove the two claims worth proving:
comma-join without map (the `%2C` shape) turns a fixture red, and a string handed to a builder is
refused rather than quietly wrapped. **Revert every mutation before you write a word of the result
file**, and grep your own diff for `MUTATION` before you return.

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

## 5. Done means these 3 lines, reported against one by one

1. All three doors — default, Gmail and Outlook — carry several addresses, each correctly encoded, and copy-to-self behaves as WO-5.3 proved. *(The builders' half of WO-5.8's line "The `mailto:` URL carries every chosen recipient", moved here at the cut of 2026-09-20; the picker's half stayed with WO-5.8.)*
2. The header the non-primary recipients ride in is chosen, and the disclosure argument for it is written down where the code makes it. *(The argument WO-5.8's Deliverables said that row owed, moved here at the cut.)*
3. The ceiling warning counts every address on the wire, and still **warns rather than truncates** — nothing truncates today and nothing starts to here.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

