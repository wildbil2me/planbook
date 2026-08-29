# WO-5.6 — A draft survives a change of mind · implementer result

**Route** Claude Opus (work-order-implementer) · **Date** 2026-08-29
**Verdict** Built, both tools green, all five Acceptance lines closed. **No 👤 and no 📆 on this
work order**, so nothing here is owed to a real iPad — but see § "What I could not verify" for the
one thing a headless browser cannot say about it.

---

## The two commands, and what they actually printed

Both run from `c:\dev\planbook`, both read from their own output rather than predicted.

**`node tools/verify-shell.mjs`** — delivered tree, run to completion (421 s):

```
1263 checks · 1263 passed · 0 failed · 0 skipped
37,943 lines · 30.0 lines per check · 421s
```

exit 0. **This is the second run.** The first, over the same source but an earlier harness, printed
`1263 checks · 1258 passed · 5 failed`; all five are diagnosed and fixed below under
"Five reds on the first run" — four of them were pre-existing WO-5.3 checks meeting the new
behaviour, and one was a real defect in a check I had just written.

**`node tools/wo-sweep.mjs`** — delivered tree:

```
34 checks · 31 passed · 0 failed · 3 to review
```

All three reviews are pre-existing and byte-identical to the baseline I took before touching
anything (sensitive field names outside `src/backup.js`; due-date and late/missing on one line; a
mockup banner disagreeing with the build). Nothing I did added or removed a review.

`node tools/wo-gate.mjs --audit` also PASSes, and the Phase 5 dashboard row is unchanged at 8/9 —
this work order closes no roadmap box, which is correct: it is a fix to behaviour four boxes above
it already claim.

---

## The mutation round

One line, planted and **reverted before a word of any document was written**, per the standing rule.
Everything else was staged first (`git add -A`) so that `git checkout -- src/outreach-view.js` could
not take my own work with it.

`draftEdited()` cut to `return false` — the app never asks, which is exactly the behaviour this work
order exists to end:

```
1263 checks · 1253 passed · 10 failed
```

**Six of the ten are the new checks.** The four that matter are **WO-5.3's own**: two of its checks
now drive a control over a draft they have just typed into, so they go through a small helper
(`agree()`) that answers the confirm — and that helper hands back *whether the dialog appeared*,
which both callers assert. So a build that stopped asking over an edited draft is caught by the very
thing added to accommodate the asking, rather than absorbed by it. That was the design intent of the
helper and the mutation is what proved it.

**Reverted, and verified**: `git checkout -- src/outreach-view.js` (never `git checkout .`), the
function reads `return draft.subject !== resolved.subject || draft.body !== resolved.body;` again,
and `git status --short` shows no unstaged modification on any file. `grep -rn MUTATION` over the
changed files finds four hits and **all four are pre-existing prose** on lines I did not write
(`src/shell.js:762`, `tools/README.md:1630`, `tools/verify/outreach.mjs:748`, `TESTING.md:3986`).
The tree is clean of live mutations.

---

## Against the Acceptance list, one by one

### 1. Typing in the body, then changing the template, asks before rebuilding; cancelling leaves the typed text exactly as it was — **met**

Two checks in `tools/verify/outreach.mjs`, driven through the real controls (an `input` event through
the delegated listener, then a real `change` on the picker).

*Asking half.* While the question is up: the model still holds the old template, the body still
holds the typed words, two overlays are open, focus is inside the panel, and — the assertion I care
most about — **the `<select>` has been put back**. A `<select>` takes its new value before its
`change` event is delivered, so without the repaint at the moment of asking the picker would sit
behind the dialog claiming a rebuild that had not happened. Printed detail on the green run:
`{"open":true,"overlays":2,"select":"put back","model":"unchanged"}`.

*Cancelling half.* Compared **character for character** against the string that was typed, plus the
tone, the recipient, the template name and id, the select's value, and the live `mailto:` href:
`{"body":"exactly as typed","template":"WO-5.3 praise to a guardian","tone":"praise","to":"guardian-0"}`.

A second check covers the panel's own copy: the fact list names *the message and not the subject*
(only one box differs), and the confirm button reads `Rebuild from “WO-5.3 a long one”` rather than
*OK*.

### 2. Confirming rebuilds the draft from the new template, as today — **met**

Same tap again, then the button in the panel. The body is the new template resolved, **not one word
of hers survives** (`mineGone: true`), no merge field is left, the picker and the model agree on the
template, and the status line reads *"The draft was rebuilt from WO-5.3 a long one. What you had
typed was replaced, as you asked."*

### 3. An untouched draft rebuilds with no prompt at all, on all three controls — **met**

Template picker, tone pill and recipient chip in one pass. Each step is asserted to have **actually
rebuilt** as well as to have stayed quiet — a control that had silently done nothing would pass a
check that only counted dialogs — so the check requires three different template names, three
different bodies, and three status lines saying nothing was lost:

```
template: asked=false → WO-5.3 praise to a guardian ·
tone: asked=false → WO-5.3 concern to a guardian ·
recipient: asked=false → WO-5.3 to the counselor
```

The tone step is the brief's named trap: it changes which templates are on offer and therefore which
one is selected, so it replaces the draft without anything having named a template. It neither slips
past the check nor trips it.

### 4. Typing a character and removing it again counts as untouched — **met**

Asserted as a **pair**, so it cannot pass vacuously: the same recipient chip is tapped twice over the
same draft, once with one stray `z` in the body and once with it removed. `with the stray character
the chip asked = true, with it removed = false`. A check that only did the second half would pass
over a flow that had stopped asking altogether — which is precisely the state the mutation round put
the app in, and this check goes red there.

### 5. The document is not written at any point — **met**

A second `rev` reading of its own, spanning the asking, the cancelling, the confirming, three silent
rebuilds, a projector cycle and a touch pass: `rev 275 → 275, log 0 → 0, contact entries 0`, with
`templates[]` compared byte for byte. **Flushed first** — `await window.planbook.store.flush()` —
for the reason WO-5.3's own check gained a `flush()` on its mutation round: `update()` only
*schedules* a save and `rev` advances ~800 ms later, so a read taken straight after the last control
cannot see a write made by it. `src/outreach-view.js` still calls `update()` nowhere.

---

## Beyond the five, because they were the brief's own Traps

- **Both boxes, not one.** A rewritten subject over an untouched body asks, and the panel lists **the
  subject and only the subject**. The fact list is built from the same comparison that decided to
  open the dialog, so the panel cannot disagree with the test behind it.
- **A cancel leaves *everything* as it was**, not just the text. Asserted on the tone, the recipient,
  the template name, the template id, the select's DOM value and the live link.
- **Presentation mode.** I closed a hole the brief did not name: the ask is an overlay stacked over a
  panel the mode empties, so a projector switched on while it is up would leave a dialog on the
  glass. `renderOutreach()`'s blocked branch now closes it and clears the proposal, and a check
  drives exactly that. Belt and braces, because the panel **also names nobody by construction** — the
  recipient case quotes the chip's *position* ("Guardian 1"), never the person on the line below it —
  and that is asserted too, searched over the whole overlay's text against the seven planted
  `supports` strings plus the student's name, her guardian's name, her first name and the address.
- **44px.** Measured at 390 px under an emulated coarse pointer, with `matchMedia('(pointer: coarse)')`
  asserted first. **This work order added no CSS at all**: the three controls are two
  `.class-action-btn`s and a `.modal-close`, all already inside the coarse block's shared selector.
  The sweep's § 6 confirms zero new selectors. An inherited floor is worth measuring precisely
  because it is inherited, and this check is the reason I know it holds.

---

## Five reds on the first run, and what they were

Worth recording because four of them are the *right* kind of red.

1–4. **`refused`, its strip check, `noAddress` and `long` (all WO-5.3's).** Each drives a template
pick or a recipient tap over a draft the check immediately above it had typed into. Before this work
order they read the rebuilt draft straight back; now the app asks and rebuilds nothing. I did **not**
weaken them or reset the draft to dodge the dialog — I added a page-side `agree()` helper that
performs the tap, notices whether the dialog appeared, answers it, and **hands that boolean back**,
which both callers assert. That keeps the checks asserting what they always asserted and turns the
accommodation into a second detector for the same defect.

5. **My own touch check, and it was a genuine defect.** Its setup opened the dialog by tapping a tone
pill — and tapped the tone the flow was already on. All three doors return early on a value they
already hold, so no panel opened and the check measured **0 controls, 0 of them under 44px**: a clean
pass over an empty set, which is `tools/README.md`'s own first CDP trap wearing new clothes. It taps
the other pill now and asserts the panel is open before measuring. I would not have found this by
reading.

---

## Decisions the work order did not settle, and which way I went

- **Escape and the ✕ are left to `src/modal.js`, with no handler of my own.** They dismiss without
  coming through this module and leave a `pending` proposal behind. That is inert: the only thing
  that reads it is the button inside the panel they just closed, and the next ask overwrites it —
  the same corpse `src/assignments.js`'s copy and delete confirms leave, for the same reason. What
  makes it *safe* rather than merely harmless is that the screen behind the dialog is repainted **at
  the moment the question is asked**, so a dismissal already lands on the correct state. Written down
  at `askBeforeRebuild()` and in the markup comment. The alternative — routing the ✕ through my own
  cancel hook — would have departed from every other confirm in the app for no behavioural gain.
- **The status sentence changed in all three places, not none.** Every rebuild used to end
  *"Anything you had typed is gone."* A rebuild is now either one she agreed to or one that cost her
  nothing, so `rebuiltNote()` says which. Using one sentence for both would leave the silent case
  sounding like a near miss.
- **The dialog names a position, never a person.** `Writing to Guardian 1 instead…` rather than the
  guardian's name, which the status line under the form still uses. The two are different because
  one is inside the panel presentation mode empties and one is not.
- **The three doors became `set…`/`apply…` pairs.** They used to mutate module state and *then* call
  `buildDraft()`, so there was no moment at which a change had been proposed and not yet made. This
  is what lets *cancel* be the absence of a call rather than an undo, and it is the shape WO-5.8 will
  extend.
- **The confirm's fact list wears `.class-delete-facts` / `.class-delete-line`** — the red danger
  wash, whose stylesheet comment says it is for "what a deletion destroys". A rebuild destroys typed
  text with no undo, so I read that as in scope rather than inventing a milder variant.

---

## Out of scope, declined — noted rather than acted on

- **WO-5.8 (several recipients).** Left entirely alone. The `set…`/`apply…` split and the
  `{ kind, value }` proposal are the seam it should extend; nothing about "several recipients" is
  built or half-built here.
- **`CLAUDE.md` got no new paragraph.** Its Phase 5 narrative blocks read as owner/orchestrator prose
  written at land time, and nothing in this work order changes an architectural rule the file
  records. **Proposed follow-up if you disagree:** the one sentence worth adding is that the send
  flow now has a third kind of overlay — a confirm stacked three deep over the signal card — and
  that its copy names a position rather than a person for a presentation-mode reason.
- **`plans/ROADMAP.md` is untouched.** No box moves; the dashboard is already right at 8/9, and the
  audit agrees. The paragraph under Phase 5 that names "four smaller ones" booked from the
  2026-08-29 sitting could gain a clause saying the first of them landed — **proposed follow-up**,
  not done, because it is roadmap prose about a box that did not move.
- **`CHANGELOG.md` deliberately not written.** Draft, for the teacher to accept, reject or rewrite:

  > **A draft you have written in now asks before it is rebuilt.** Changing the template, the tone
  > or the recipient used to replace the subject and the message with no warning — and then tell you
  > it had. It now puts a question up naming what it is about to do and which of the two boxes you
  > have written in, and does nothing until you say so. A draft you have not touched still rebuilds
  > on the tap, because a dialog on every tap is a dialog nobody reads.

- **No check I wanted was impossible.** Both commands could express everything the Acceptance list
  asks. No throwaway script was written and no third harness exists.

---

## What I could not verify

- **Nothing on this work order is 👤 or 📆, and I ticked no such line** — there are none in it to
  tick.
- **What a headless browser still cannot say**: how the panel *feels* under a thumb on a real iPad —
  whether a confirm at that moment in the gesture reads as protective or as an interruption, and
  whether the ✕ / Escape behaviour (dismiss silently, change nothing) is discoverable. The 44px floor
  is measured and the focus path is asserted; the judgement is not. If it is worth a reading, it is
  the same trip that closed WO-5.3's two 👤 lines, and **force-quit the app from the app switcher
  first**.
- **The first harness run's five reds are reported from its own output**, as is the mutation run's
  ten and the delivered run's zero. Every figure in this file and in the documents I edited was read
  off a run that finished; the two placeholder numbers I wrote into `tools/README.md` before the run
  completed were corrected against the printed summary (37,943 lines / 421 s, not the 37,927 / 424 s
  I had guessed).

---

## Files changed

- `c:\dev\planbook\src\outreach-view.js` — the snapshot (`resolved`), `draftEdited()`, the proposal
  (`pending`), `askBeforeRebuild()`, `confirmLine()`, `rebuiltNote()`, the three `set…`/`apply…`
  pairs, `confirmOutreachRebuild()`, `cancelOutreachRebuild()`; resets in `resetOutreach()` and
  `openOutreach()`; the close in `renderOutreach()`'s blocked branch; a new header section.
- `c:\dev\planbook\index.html` — `#outreachConfirmModal`, and its comment block.
- `c:\dev\planbook\src\shell.js` — two hooks (`data-outreach-rebuild-confirm`,
  `data-outreach-rebuild-cancel`) routed and added to the delegation inventory; the three setters now
  receive their opener so focus comes back.
- `c:\dev\planbook\sw.js` — `CACHE` `planbook-shell-v104` → `v105`, because `index.html` is `SHELL`
  entry one and v104 is committed.
- `c:\dev\planbook\tools\verify\outreach.mjs` — eleven new checks inside § "the send flow (WO-5.3)",
  the `CONFIRM` page-side reader, the `AGREE` helper, and two pre-existing checks that now assert
  the ask happened.
- `c:\dev\planbook\tools\README.md` — call-site count 1237 → 1248, and the WO-5.6 paragraph with its
  run figures and mutation round.
- `c:\dev\planbook\TESTING.md` — § WO-5.6, and the "WO-5.3 and WO-5.4 append…" line dropped to
  WO-5.4 alone.
- `c:\dev\planbook\plans\work-orders\phase-5-outreach.md` — status ✅ DONE, five boxes ticked with
  their evidence, the Traps line answered, and "Where this stands".
- `c:\dev\planbook\plans\work-orders\README.md` — row 38 marked ✅ with its summary.

**No stylesheet was opened**, and no `package.json`, dependency, framework or second harness exists.

**Everything is staged but nothing is committed** — I staged before the mutation round so the revert
could not clobber unstaged work, and left it staged. No `git commit`, no `git push`.
