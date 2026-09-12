# WO-5.7 — Copy the draft to the clipboard · implementer's report

**Route** Claude Opus (work-order-implementer) · **Date** 2026-09-12
**Brief** `.claude/dispatch/WO-5.7-brief.md` · **Work order** `plans/work-orders/phase-5-outreach.md` § WO-5.7

---

## 1. Headline

Built. **Four of five Acceptance lines closed; the fifth is now marked 👤 and left open.**
Both harnesses green on the delivered tree, and every figure below is from output I read.

| | |
|---|---|
| `node tools/verify-shell.mjs` | `1342 checks · 1342 passed · 0 failed · 0 skipped`, 41,737 lines, 31.1 lines per check, **449s, exit 0** |
| `node tools/wo-sweep.mjs` | `42 checks · 39 passed · 0 failed · 3 to review` — all three reviews pre-existing and unchanged |
| `node tools/wo-gate.mjs --audit` | PASS |
| `node tools/wo-gate.mjs WO-5.7` | `PASS | gates clear for WO-5.7` |

Four mutations were run and **all four reverted before any prose was written**;
`grep -rn MUTATION src/ index.html sw.js` returns only the one pre-existing occurrence in
`src/shell.js:866`. Status left at `🤖 CLAIMED — 2026-09-12` — moving it is not mine.
No `CHANGELOG.md` entry written; a draft is in § 7 below.

---

## 2. Acceptance, line by line

### 1. *"The copied text carries the recipient, the subject and the body, and pastes into a compose window as readable text with its paragraph breaks intact."* — **NOT TICKED. I added 👤 to the line.**

**What I verified, by running:** the whole of it up to the edge of the app, character for character.
`tools/verify/outreach.mjs` compares the block the app hands `navigator.clipboard.writeText` against a
string built from **fixture literals** (not from the model, so a model that picked the wrong recipient
fails rather than moves the target):

```
To: Wo53Guardian One <wo53guardian1@example.invalid>
Cc: wo53teacher@example.invalid
Subject: WO-5.7 — the subject line, #3 and all

Dear Wo53Guardian One,
…
```

Run output: `0 carriage return(s), 3 blank line(s), matches the expected block = true`, and at the same
instant the `mailto:` URL for the same draft encodes the em dash as `%E2%80%94`, the `#` as `%23` and
its breaks as `%0D%0A` — the two serialisers proved opposite on purpose. The clipboard is then pressed
with a real CDP mouse click and read back: `1 call(s), handed matches = true, read back matches = true`.
A second check asks `draftText()` directly about the inputs the screen cannot produce (a `<textarea>`
normalises `\r\n` to `\n` before the app sees it): a CRLF and a lone CR in the body both fold to one
LF, a break inside a header folds to a space, an administrator is written once rather than as
`admin@school <admin@school>`, and an empty `Cc:` is left out.

**Why I did not tick it:** the second half of the sentence — *"pastes into a compose window"* — ends in
somebody else's compose window. I have no Gmail tab and no iPad. **I added the 👤 mark rather than
ticking or silently leaving it blank**, with a parenthetical in the work order saying when and why,
which is precedent: WO-5.3's own first Acceptance line records *"the mark was added when the row was
built, 2026-08-28, rather than being on it when it was written"* for exactly this shape.

**If you disagree with the mark, the box still should not be ticked by me** — I cannot name evidence
for a paste.

### 2. *"A blocked draft cannot be copied, and presentation mode disables the control with the rest of the flow."* — **TICKED.**

Verified by running, in two checks. Blocked (a `{{token}}` typed into the body): the model has nothing
to copy (`clipboard: ""`), the button is `disabled`, a `click()` dispatched at it raises **no event at
all** so a spy on `writeText` records zero calls, and `copyDraft()` called **directly, past the
markup** returns `false`. The handoff link lost its `href` in the same paint. Projected: the same three
hold, `formHidden: true`, the label is back at *Copy the draft* rather than standing at *Copied*, and
`names: false` — the whole modal searched for the student, both guardians and the guardian's address.

### 3. *"The teacher is told the copy happened, through `announce()` as well as on screen."* — **TICKED.**

Verified by running. Status line: `"Copied. The recipient, the subject and the message are on your
clipboard as plain text — paste it into your mail and send it from there."`, `hidden: false`. Button
label: `"Copied"`. Live region: `"Copied to your clipboard."`. `aria-label` changed too. And
`names: false` across all four strings — the acknowledgement names nobody.

### 4. *"Copying writes nothing to the document."* — **TICKED.**

Two independent halves, and both mutation-proved.

*Fixture half* (`verify/outreach.mjs`), quoting the final clean run's detail line:
`rev 298 → 298, log 0 → 0, contact entries 0, localStorage mentions none of it` — taken **after
`flush()`**, across two real copies, a blocked one, a refusal, a projector cycle and every keystroke
between them. (`rev` reads 297 or 298 depending on where in the run the section lands; what the check
asserts is that the two readings are equal.)

*Structural half* (`tools/wo-sweep.mjs` **§ 24**, new, in § 17's shape): `src/outreach.js` imports
neither `./store.js` nor `./log.js` and holds no writer of any kind, with a vacuity guard that it still
exports all seven answers and still imports `./roster.js`; and `copyDraft()` — whose own file
legitimately *does* write, through `recordHandoff()` — reaches no writer. **I checked whether § 17's
whole-file shape fit before assuming it did, as the brief asked: it fits one of the two files and not
the other**, so the view's claim is scoped to the function.

### 5. *"The control clears 44px under a coarse pointer at 390px."* — **TICKED.**

Verified by running, in the send flow's **existing** touch pass rather than a block of its own, because
the control stands in that panel's `.modal-actions` row and what a third control costs is a property of
the row: `15 control(s) measured, 0 under 44px, sideways scroll 0px`, `coarse: true`. I strengthened
that check so it cannot pass by counting — the copy is asserted to be **in** the measured set by its
own id, and the floor was raised from `>= 8` to `>= 9`.

---

## 3. Mutations — four, all reverted before any prose

| # | Mutation | Result |
|---|---|---|
| 1 | `renderOutreach({fields:false})` inserted between `copyDraft()`'s gate and its `writeText(` | `wo-sweep` `42 · 38 passed · 1 failed` — § 24 names the line and the call |
| 2 | `writeContact({ studentId: '', … })` in the copy's success path | `verify-shell` **`1342 · 1342 passed · 0 failed`, exit 0** — and `wo-sweep` `42 · 38 · 1 failed`. See below |
| 3 | the same, with the real `subject.studentId` | `verify-shell` `1342 · 1338 passed · 4 failed` — mine at `rev 297 → 299, log 0 → 2, contact entries 2`, plus **three in `verify/contact-log.mjs`** |
| 4 | the body normalised to `\r\n` in `draftText()` — the `mailto:` answer at the clipboard door | `verify-shell` `1342 · 1339 passed · 3 failed` |

**Two of these are findings rather than bookkeeping, and both are written into `TESTING.md` and
`tools/README.md`.**

**Mutation 2 was vacuous, and the check was innocent.** `writeContact()` returns `null` on a falsy
`studentId`, so nothing was ever written and the harness was right to stay green. I only found this by
reading `src/log.js` after the run rather than concluding the check was weak. *A green harness under a
mutation is two claims — the check is vacuous, or the mutation is — and only reading what the mutated
code actually does tells them apart.*

**Mutation 4 is why the clipboard is spied on as well as read back.** Its detail line:

```
clipboard granted, 1 call(s), handed matches = false, read back matches = true
```

The platform normalises a clipboard's line endings away on the way out, so **a check that only read the
clipboard back would have passed over the exact defect WO-5.3's Traps line is about.** The spy wraps the
real `writeText` and delegates to it, so the platform still receives the string and the two readings
stay independent.

---

## 4. What I could not verify

- **Acceptance line 1's second half** — an actual paste into a real compose window. Needs Gmail in a
  browser and the iPad's Mail. Marked 👤; owed to a person. `TESTING.md` § WO-5.7 says what to do.
- **The Traps line itself — that the clipboard call is inside the user gesture.** I want to be explicit
  that the green click **does not prove this**: the harness grants `clipboardReadWrite` at the browser
  level in order to press the control at all, and a granted permission is exactly what makes the
  activation requirement stop applying. I carried the claim two other ways — `wo-sweep` § 24 asserts
  nothing asynchronous sits between the gate and the call (mutation 1 proves that check live), and the
  tap on hardware is part of the 👤 line — and I said so **at the check, in the work order and in
  `TESTING.md`** rather than letting a green run imply it. A copy that works on a laptop and fails
  silently on an iPad is the default outcome here, and only the iPad settles it.
- **Anything on a real device.** No 👤 line was ticked. No iPad was touched.

---

## 5. Decisions the work order did not settle

1. **The refusal for a button is `disabled`.** The handoff refuses structurally by having no `href`;
   a button with no attributes is still a button. `disabled` is the same *kind* of answer — the browser
   refuses the event — and it cost no stylesheet, because `.class-action-btn:disabled` was already the
   same dimming `a.class-action-btn[aria-disabled="true"]` wears. `copyDraft()` asks the model anyway.
2. **No `execCommand` fallback.** Argued at the point of departure in `src/outreach-view.js`: secure
   context everywhere this app runs (including the harness's `127.0.0.1`), `writeText` in every
   supported browser since iPad Safari 13.4, and a hidden `<textarea>` plus a deprecated call is a
   polyfill in a repo whose first rule is that it has none. **A browser without the API gets a
   sentence**, in the status line and through `announce()` — not a silent no-op and not a second
   mechanism — and the control stays live, so `disabled` keeps meaning exactly one thing.
3. **The line ending is LF at the clipboard and CRLF at the `mailto:`.** Departure named at
   `draftText()`. Proved by mutation 4, not reasoned about.
4. **The acknowledgement has no flag of its own.** The button's label is derived from a comparison
   against the one status sentence, so every other act in the flow clears it by doing what it already
   did. A keystroke blanks it — deliberate: a draft edited after a copy is a draft the clipboard no
   longer holds.
5. **The hook is `data-outreach-clipboard`, not `data-outreach-copy-draft`.** `data-outreach-copy` is
   already the *copy-me* toggle. Attribute selectors match a whole name and never a prefix, so this was
   never a collision in a browser — it would have been a collision in the next reader. Named in the
   `index.html` comment and in `src/shell.js`'s inventory row.
6. **`#outreachModal .modal-actions { flex-wrap: wrap; }`** — scoped to this panel, not added to
   `.modal-actions`. `.class-action-btn` is `white-space: nowrap` and three of them do not fit 390px.
   Every other actions row in the app holds two controls and fits.
7. **`#outreachModal .class-action-btn { min-height/min-width: 44px }`** in the coarse block — scoped
   rather than a bare `.class-action-btn`, because that class is worn by every action button in the app
   and a 44px *min-width* on all of them would silently widen `.class-action-btn.move` (the one-glyph
   reorder arrows) on eleven screens this work order never opened.

---

## 6. Things I did not do, and why

- **⚠ A pre-existing disclosure gap I found by reading and did NOT fix.** `renderOutreach()`'s
  presentation-mode branch empties the two boxes, both pickers, three hint lines, the block strip and
  the handoff's `href` — and **does not clear `#outreachStatus`**, which at that moment can hold
  *"The draft was rebuilt for Wo53Guardian One…"* or *"Handed to your mail app and logged on Ada
  Wo53Full's record."* The element is inside the `.hidden` form, and this flow's own rule is that
  hidden is not a redaction (`src/outreach-view.js`'s header, in as many words). It predates this work
  order and belongs to WO-5.3's rule. **WO-5.7's own sentence names nobody by construction and is
  asserted to**, so nothing I added deepens it, and I did not widen the work order to repair it.
  *This is a code reading, not a driven reproduction* — I did not write a check for somebody else's
  defect. Recommend booking it.
- **The rebuild confirm's hint** (`index.html`, `#outreachConfirmModal`) reads *"If you want to keep
  both, copy what you wrote somewhere first."* There is now a copy button. Rewording it is a WO-5.6
  surface and out of scope; noting the temptation here instead.
- **Nothing of WO-5.8.** No multi-select, no primary, no widening of `templatesFor()`. The copy reads
  the single recipient the flow already has, through the same `outreachModel()`.
- **No `CHANGELOG.md` entry** (§ 7 is a draft for the teacher).
- **No commit, no push.** The brief did not ask.
- **No third harness.** Eight `check()` sites in `tools/verify/outreach.mjs` and one new section in
  `tools/wo-sweep.mjs`; both counts recorded in `tools/README.md` and re-asserted green by § 11 and
  § 22.

---

## 7. Draft `CHANGELOG.md` entry — for the teacher to accept, reword or drop

> **Copy the draft.** An email draft now has a second way out: a *Copy the draft* button beside
> *Open in my mail app* puts the recipient, the subject and the message on the clipboard as plain
> text, ready to paste into Gmail or any other webmail. It costs no new permission — Planbook still
> sends nothing and asks Google for nothing. A blocked draft cannot be copied, and nothing is
> copyable while presentation mode is on.

---

## 8. Files changed

| File | What |
|---|---|
| `src/outreach.js` | `draftText()` — the second serialiser, beside `mailtoUrl()`; header updated; the no-writer paragraph now points at its fence |
| `src/outreach-view.js` | `COPY_ID`/`COPIED_NOTE`, `clipboard`+`copied` on the model, `paintCopy()`, the projector branch, `copyDraft()` and `copyRefused()`; three header sections updated |
| `index.html` | the `<button id="outreachCopy" data-outreach-clipboard disabled>` in `.modal-actions`, with its comment |
| `src/shell.css` | `#outreachModal .modal-actions { flex-wrap: wrap; }` and `#outreachModal .class-action-btn` at 44px in the coarse block |
| `src/shell.js` | the delegated hook and its inventory row |
| `sw.js` | `CACHE` bumped `v112` → `v113` (`index.html` is `SHELL` entry one) |
| `tools/verify/outreach.mjs` | eight new `check()` sites; `PORT` destructured; the send flow's touch check names the new control and asserts it by id |
| `tools/wo-sweep.mjs` | § 24, inserted before § 22 so the census stays the last result-pushing site |
| `tools/README.md` | sweep count 41 → 42 with § 24 described; call-site count 1324 → 1332 with a WO-5.7 entry and the two mutation findings |
| `TESTING.md` | § WO-5.7 |
| `plans/work-orders/phase-5-outreach.md` | Acceptance list ticked/marked, decisions recorded |

Not changed: `CHANGELOG.md`, anything under `docs/`, `privacy.html`, `plans/ROADMAP.md`
(the audit reports Phase 5 at 9/9 boxes either side of this).

---

## 9. One environment note, reported as an environment and not as a result

`verify-shell.mjs` **hung after printing its summary on three of the six runs taken while building
this** — the process has to be killed and `msedge.exe` is still in the process list when it is.
`tools/verify-shell.mjs` predicts exactly this at its own last three lines. **What rules out a
property of this change is that two runs of byte-identical trees disagreed**: the first green run of
the delivered tree hung, and the last one exited 0. The correlation available from six runs is that
the hangs followed runs whose stray `msedge.exe` processes had not been cleared first.

**Consequence for this report:** the `exit 0` in § 1 is from the final clean run, whose `EXIT=0` line I
read. The mutation runs' summaries in § 3 are from output I read; two of those runs I killed in
teardown, so I am quoting their summaries and **not** claiming their exit codes. Written up in
`TESTING.md` § WO-5.7 as a flake worth a work order if it starts costing runs.
