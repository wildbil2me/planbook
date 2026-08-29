# WO-5.2 — Templates · implementation result

**Route** Claude (work-order-implementer) · **Brief** `.claude/dispatch/WO-5.2-brief.md`
**Status written into the tracker** ✅ DONE — 2026-08-28, all four Acceptance lines ticked.
**Nothing was committed and nothing was pushed.** The brief did not ask for it.

---

## Both harnesses, from output I read

```
node tools/verify-shell.mjs
  1223 checks · 1223 passed · 0 failed · 0 skipped
  36,525 lines · 29.9 lines per check · 413s
  EXIT=0
node tools/wo-sweep.mjs
  34 checks · 30 passed · 0 failed · 4 to review
```

Four runs were made and the numbers above are the **fourth**, on the delivered tree with nothing
edited under it. Reported in full because the earlier three are the honest story of this work order:

| run | result | what it found |
|---|---|---|
| 1 | `1223 · 1215 · 8 failed` | **eight red**, and only one of them mine to write: the fourth header icon put the page into horizontal overflow at 390px (`document 417 in 390`), reddening five sideways-scroll assertions across four screens plus the tab-strip check. Every one of the 26 content checks in the new section passed. |
| 2 | `1223 · 1222 · 1 failed` | 41px freed in the header's 640px block. Overflow gone; the tab-strip check still red **by one pixel** — `src/classes.js`'s `keepInView()` scrolls the open tab with an 8px margin, so the class strip has to be at least *widest tab + 8*, which is 107 against the 106 that 41px bought. |
| 3 | `1223 · 1223 · 0 failed`, 411s | 49px instead of 41. Green — but I had edited `src/templates-view.js` 40 seconds into the run (removing a focus steal), so the run is not one tree and I did not report it as one. |
| 4 | `1223 · 1223 · 0 failed`, 413s | the delivered tree, untouched from first check to last. **This is the run quoted above and in `TESTING.md`.** |

`wo-sweep.mjs` § 20's five claims over `src/merge-fields.js` are green and unchanged — that file was
not opened. `node tools/wo-gate.mjs --audit` and `--self-check` are both PASS.

**The four sweep REVIEWs** — three are pre-existing (the due-date/late one, the mockup-banner one,
and § 5's sensitive-name census); the fourth, § 6, is this work order's and every line of it was read.
It lists thirty-five added selectors with no coarse-block rule: `.mf-token` (an inline `<span>`),
`.mf-block*`/`.mf-reason` (a box and its lines of type), `.hdr-divider` (an existing hairline
re-mentioned in the 640px block to hide it) and thirty `.tpl-*` that are layout, containers and type.
**Every control this work order adds is named in a coarse block** — `.tpl-tone-btn`, `.tpl-item`,
`.tpl-new`, `.tpl-chip`, `.tpl-preview-refresh`, `.tpl-input`, `.tpl-select`, `.mf-jump` — and the
measurement rather than the declaration is what settles it: 40 controls on the screen at 390px under
a coarse pointer, none under 44. § 5's census grew by three files because the palette's fence and
the two new modules' prose *name* the fields that cannot be merged, which is the disclosure control
working rather than a leak.

---

## Against the Acceptance list, one by one

### 1 · A concern template and a praise template can exist for the same audience and are offered separately at send time — ticked

**What I did.** `tone` and `audience` are separate fields on the record, nothing in the writers is
unique on either, and `templatesFor(doc, tone, audience)` in `src/templates.js` filters on **both**.
That function is the model's whole reason for being a module rather than part of the screen: WO-5.3
asks it from the signal card with the editor nowhere on screen.

**Evidence.** `tools/verify/templates.mjs`, driven through the real controls (`+ New template`, the
two `<select>`s, `Save`): one record for `concern/guardian`, a different one for `praise/guardian`,
two when the tone is not named, none for an audience they were not written for; two rows on the
list, and the tone switch narrows to one and back, taking the eight starters with it.

**What I did NOT close, and said so in the work order rather than rounding up.** "At send time" is
half in WO-5.3 — there is no send flow to offer anything yet. What is closed is that the collection
can hold the pair and hands them back apart.

### 2 · The live preview shows unresolved fields visibly, exactly as the send flow will — ticked

**What I did.** The preview asks `resolveDraft()` for a whole draft and draws what comes back,
wrapping whatever `{{…}}` survived the resolve in `.mf-token`. One treatment for all three failures
in the body; the strip is the layer that explains, and every sentence in it is the `message`
`src/merge-fields.js` built.

**Evidence, and the reading of "exactly" I chose.** A screenshot cannot settle "exactly", so it is
asserted as an **identity**: the drawn subject and body are character for character what
`resolveDraft()` returned for the same request, asked of the resolver directly in the same check.
WO-5.3 renders the same string from the same call, so a preview that agrees with the resolver here
cannot disagree with the send flow there. All three failures are measured on screen — an unresolved
`{{guardian.name}}` for the student with no guardian, refused `{{student.supports.accommodations}}`
and `{{supports.medical}}`, and the typo `{{studnet.first}}` — with codes
`refused-field, refused-field, unknown-field` and the strip naming the field and the student.
Separately: none of the six fixture-unique roster strings is anywhere in the drawn screen, and none
of the eight (those six plus `IEP` and `extended-time`) is in the drawn draft, searched over a
template that asks for them about the student who has all of them on file.

### 3 · The field palette contains no refused path — ticked

**What I did.** The palette is `mergeFieldPalette()` mapped. No `FIELDS` import, no export added, no
lookup by token anywhere in this work order — see the finding below.

**Evidence.** Sixteen chips read out of the DOM, matching `mergeFieldNames()` name for name and in
order, each with its `about` sentence, and not one matching
`supports|accommodation|medical|behaviou?rPlan|plan|caseManager|reviewDate|attendanceClause`. Two
things beside it: the fence states the rule in words as well as by omission, and **every `{{token}}`
in all eight shipped starters is reconciled against the same whitelist** — those eight are the app's
own prose going into a teacher's document, so a starter naming a support field is a red run rather
than a draft a teacher finds refuses to send.

### 4 · Templates survive a backup round-trip — ticked

**What I did.** Nothing: `templates[]` was already in `newYearDocument()` and already classified as
content by `src/backup.js`. What this work order adds is records in it, and the check.

**Evidence, twice.** Through the FILE — `buildBackup()` then `parseBackup()`, the validator that
refuses a document whose shape does not match `newYearDocument()` — identical byte for byte. Then
through the REAL restore: `restoreFromText()` and the confirm button a teacher taps, after which
both records are still there, still offered separately by tone, and drawn on the list.

---

## What I could not verify

- **👤 The palette under a phone keyboard.** The drawing's last caption asks in bold for a thumb on
  a real tablet; the owner **waived** that reading and ruled the palette ships as drawn. I built it
  as drawn and **left the gap open** rather than closing it quietly — it is recorded in the work
  order's *Where this stands*, in `TESTING.md` § WO-5.2, and in a comment at `insertField()`. The
  harness proves the insertion lands at the caret and that every control clears 44px at 390px;
  neither is the same claim as *the chip is reachable while the keyboard is up*. **No box was ticked
  for it and there is none to tick.**
- **Everything measured at 390px is emulated.** That includes the header-row repair below. No
  hardware reading was taken, by me or by any run.
- **The starters' prose is unread by a teacher.** Eight templates in the suite's voice is a judgement
  a harness cannot make; what is checked is that they are filled in, cover both tones × four
  audiences, and name only resolvable fields.

---

## The one thing that reddened checks I did not write

**The fourth header icon cost the header row 49px at 390px, and it is the owner's entry-point answer
arriving with a bill.** At 390px under a coarse pointer every part of `.header-bottom` sits at its
floor and the class tab strip absorbs what is left (~109px, which `.hdr-class-tabs`'s own comment
already recorded). A fourth 44px control does not come out of the class strip — it is already at its
96px floor — so the page went into horizontal overflow, and five sideways-scroll assertions across
four screens went red, none of them Phase 5's.

Paid in `src/shell.css`'s 640px block, in the shape WO-1.9 and WO-2.29 already used for this row:
**the divider is hidden** (a hairline plus 16px of margin, the only thing in the row that is not a
control) and **the term nav's floor drops 96 → 64** (it scrolls; a floor is only about not
collapsing beside a neighbour with content). The class strip's own floor was deliberately not
touched, because it is the strip that has to hold a whole tab.

**41px was not enough and the second run said so by one pixel.** `src/classes.js`'s `keepInView()`
scrolls the open tab back with an 8px margin, so the class strip needs *widest tab + 8* — 107px for
the 99px tab six classes produce at 390px — and 41px bought 106. 49px lands it at ~114, seven clear
of what the check needs where it was two clear before the icon existed. The arithmetic is written
out at the rule.

**Worth the owner knowing:** that row is now full. A fifth cross-class icon has nowhere to go at
390px without taking room off the class tab strip, which is the one thing in the row that cannot
give it.

---

## Decisions the work order did not settle, and which way I went

1. **Two modules, and the sheet keeps the drawing's name.** `src/templates.js` (model) +
   `src/templates-view.js` (screen), the split `signals.js`/`signals-view.js` makes, because WO-5.3
   must read the collection without importing a screen. The stylesheet is **`src/templates.css`**,
   not `templates-view.css`, because that is the file the drawing's four banners promised and
   PROTOCOL.md rule 4 makes the banner the record. The asymmetry with `signals-view.css` is
   deliberate and noted in the sheet's header.
2. **The eight starters are shipped TEXT, not document rows.** The owner ruled "filled in, none
   auto-loaded"; the question of *where they live* was mine. They are constants, offered in the list
   under the teacher's own, and a **Save** is what writes a record. `newYearDocument()` gains
   nothing — so no backup written by an earlier build is refused by name (the trap `src/store.js`
   records against the calendar block), and a teacher who deletes all eight does not get them back
   on the next restore.
3. **A Delete button, which the drawing does not draw, with no confirm.** A CRUD editor a teacher
   cannot delete from is a trap of its own; the no-confirm half is `src/events.js`'s test applied
   rather than re-argued — a template destroys nothing on the way out and putting it back costs one
   Save. It is drawn only while a saved template is open.
4. **`.tpl-student-pick` did not arrive.** The drawing gives the preview's student a pill with a `▾`,
   which is a menu this app has no component for. What shipped is a `<select>` wearing `.tpl-select`
   — `src/events.js`'s own idiom for choosing a student, and what iPadOS answers with a thumb-sized
   wheel. The drawn rule stays drawn with a note at its own line, per PROTOCOL.md § *When the
   drawing lands*; *Another student* beside it shipped exactly as drawn.
5. **The third column is preview over palette.** The drawing's markup puts the palette first and its
   own 390px caption puts the preview first; both cannot be true, and the caption carries the
   argument ("the palette is a reference she consults, the preview is what she is watching"). So the
   preview is above the palette at every width and the 390px stacking order is the drawn one —
   asserted in the harness by reading the four columns' actual top offsets.
6. **The preview passes the real signal hits.** `{{grade.delta}}` reads the hit a draft was opened
   from, so a preview passing none would show two unresolvable fields on a template about to work
   perfectly. It runs the engine over the previewed class and takes the first hit in the engine's own
   order whose **direction matches the template's tone**. A student with no hit in that direction
   gets none and the field blocks — the honest answer rather than an invented row.
7. **Presentation mode suppresses one COLUMN, not the screen.** This is the obligation
   `docs/data-model.md` lands on this work order, discharged, and it is a departure from
   `src/signals-view.js`'s outright refusal, argued at the point of departure: a template names
   nobody, a resolved draft names a child. Nothing is resolved at all while the mode is on, and the
   **student picker is emptied rather than merely hidden** — `src/supports.js`'s own rule about an
   element that is `display: none` still being one a screenshot or an accessibility tree can reach.
8. **`REMEMBERED_AS: { templates: 'home' }`** — the first entry in that map written down as something
   other than `class`. Its reason is `detail`'s: a browser that reopened here would put a named
   student's resolved draft on the glass with nobody having asked.
9. **The block strip's jump goes to the subject or the body only.** The drawing also draws a
   *Roster* door on a missing guardian; `where` is what the resolver hands back, and a jump to the
   roster would be this screen deciding which record a fault belongs to. Declined as scope — see
   below.
10. **Picking a template does not steal focus.** Focusing a field raises the software keyboard, which
    on a phone covers the preview this screen exists for. *New template*, *Duplicate* and the
    missing-name refusal take focus, because those are the three arrivals where she is about to type.

---

## The trap the work order names — not sprung, and no finding to report

**I never wanted `FIELDS[name]`.** `mergeFieldPalette()` returns exactly what the palette needed —
`{ name, about }` for sixteen fields, in the documented order — and `resolveDraft()` returned exactly
what the preview needed. Nothing in `src/templates.js`, `src/templates-view.js` or
`tools/verify/templates.mjs` splits a token, indexes anything by one, or reads a property named after
one; the one place either file reads a `{{` at all is `countTokens()`, which counts them for the
strip's "8 fields resolved" and looks nothing up. **`src/merge-fields.js` was not opened**, its
exports are unchanged, and § 20's five claims are green on the delivered tree.

**So this result file does not raise the WO-1.34 finding**, and that row does not move up the queue
on my account. Said explicitly because the work order says naming it is what moves it.

---

## Out of scope, and the temptations I declined

- **The *Roster* jump on an unresolved guardian** (drawn; one call away through
  `roster.openStudentEditor`). It would have been useful and it is not in any Acceptance line.
- **Token highlighting in the body `textarea`.** The drawing forbids it — it needs this app's first
  `contenteditable` — and I did not try.
- **A second sort/ordering control on the template list.** The list is document order, which is the
  order she wrote them in.
- **Anything in `src/merge-fields.js`**, including a `resolve` on the palette or a `FIELDS[name]`
  lookup. Nothing there moved.

---

## Proposed follow-ups (not written, not booked)

1. **If the 👤 palette reading fails on hardware**, the alternative is already named in the drawing —
   a palette that opens as a sheet over the keyboard — and it is a work order of its own, not a
   correction to this one.
2. **The header row at 390px is now full.** If a fifth cross-class surface ever wants an icon there,
   it needs a decision rather than another 44px: an overflow menu, a scrolling icon cluster, or a
   different home. Worth a row before it is discovered by five red checks again.
3. Neither of those is a check `verify-shell.mjs` cannot make; I did not need a second harness and
   did not write one.

---

## Files changed

**New**

- `src/templates.js` — the model: record, the two vocabularies, three writers, `templatesFor()`, the
  eight starters.
- `src/templates-view.js` — the screen: list, editor, palette, live preview, `templatesModel()`.
- `src/templates.css` — §§ TEMPLATE LIST · EDITOR · PALETTE · PREVIEW, lifted from the drawing.
- `tools/verify/templates.mjs` — 26 `check()` sites, 2 `skip()` guards.

**Changed**

- `index.html` — the fourth header icon, the `#templatesView` markup, the stylesheet link.
- `src/shell.css` — § UNRESOLVED lifted in (`.mf-token`, the block strip), `.mf-jump` in the coarse
  block, and the 49px repair in the 640px block.
- `src/shell.js` — imports, 14 census rows, 14 delegated hooks across `click`/`input`/`change`/
  `focusin`, `showTemplates()`, and four chains: `afterClassChange`, `afterYearChange`,
  `afterRestore`, `flipPresentationMode`.
- `src/views.js` — the `templates` view and its `REMEMBERED_AS` line.
- `sw.js` — three files precached, `CACHE` → `planbook-shell-v102`.
- `design/mockups/proposed-phase5.css` — banners amended (the `not yet lifted` token dropped in the
  same sitting as the lift), and the two things the build did not take, named at their own rules.
- `docs/data-model.md` — § Outreach templates gains *"Where a template is written, and where the
  eight come from"*: four rulings, no new table row (§ 20 reads that table's rows for field names).
- `plans/work-orders/phase-5-outreach.md` — status, the three `Open` lines answered **in place**, the
  four boxes, *Where this stands*, the waived reading, three decisions.
- `plans/work-orders/README.md` — the phase row and rows 21–22.
- `plans/ROADMAP.md` — two Phase 5 boxes ticked with their notes, the Phase 5 row 2/9 → 4/9, the
  overall row 58/81 → 60/81 (a hand edit by rule; `--tick` never writes it).
- `TESTING.md` — § WO-5.2.
- `tools/verify-shell.mjs` — one import, one `BROWSER_SECTIONS` row, one count in prose.
- `tools/verify/touch-targets.mjs` — `templatesView` in `VIEW_PLAN` as the fourth `byHand`, and the
  first one there because the loop has **no door** to the screen rather than because the document is
  empty by then.
- `tools/README.md` — the call-site count 1182 → 1208, the file count, and a WO-5.2 paragraph.

**Not touched:** `src/merge-fields.js`, `CHANGELOG.md`, and git — nothing was committed.

---

## CHANGELOG entry — a draft, for the teacher to accept, rewrite or bin

> **Message templates.** Write what a message says before it says it about anybody. Concern and
> praise are written separately, because a good praise message reads nothing like a good concern
> one, and both live under the new envelope icon in the header. The sixteen fields a message can
> fill in are a palette you tap to drop in at the cursor — and the preview beside it resolves the
> whole thing against a real student as you type, so a field with nothing behind it turns up there
> instead of in somebody's inbox. Eight templates ship with the app, two for each of the four people
> you write to; opening one fills the editor and nothing is yours until you save it. Nothing on a
> student's supports block can be merged, the palette says so out loud, and the preview goes quiet
> while you are projecting.
