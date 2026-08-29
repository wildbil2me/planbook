# Phase 5 work orders — Outreach

**Phase goal:** from "this student needs a conversation" to a sent message, without leaving the app
or granting a mail scope.

After Phase 4, because **a draft is worthless if the list of who to write to is wrong.**

Merge fields are specified in [`../../docs/data-model.md`](../../docs/data-model.md) § Outreach
templates. Two rules dominate this phase, and both are about what must never leave the app:

- **No merge field ever resolves accommodation, medical, or plan data.**
- **An unresolved merge field never renders blank.**

**The editor is drawn, and the drawing is not a work order.**
[`outreach.html`](../../design/mockups/outreach.html) in
[`design/mockups/`](../../design/mockups/README.md) was made 2026-08-28, the day WO-5.1 landed and
before a line of WO-5.2 existed, under [`PROTOCOL.md`](../../design/mockups/PROTOCOL.md). **Read it
before building WO-5.2.** It draws that work order and stops — WO-5.3's send flow is deliberately
not in it — but one section of `proposed-phase5.css` is drawn for **both**: `§ UNRESOLVED`, the
treatment of a field that did not resolve, which WO-5.2's preview and WO-5.3's send flow both render
and which the second rule above is the whole of the specification for. It lifts into
`src/shell.css` rather than into either screen's sheet, for the reason `§ LOG SHEET` did.

---

## WO-5.1 — Merge-field resolver

**Ship** — · **Status** ✅ DONE — 2026-08-28 · **Size** M · **Depends on** WO-3.4, WO-4.1
**Closes roadmap** Phase 5 → "An unresolved merge field never renders blank" and "No merge field
ever resolves accommodation, medical, or plan data."

**Why it exists.** A template system makes an IEP disclosure a one-keystroke mistake unless it is
impossible by construction. An email to an administrator that happens to quote a 504 plan is a
disclosure incident. And separately: "Dear ," going home is worse than sending nothing.

**Deliverables**
- Resolver over one student at send time, supporting exactly the documented fields:

  | Field | Resolves to |
  |---|---|
  | `{{student.first}}` `{{student.last}}` `{{student.nickname}}` | Name parts |
  | `{{guardian.name}}` | The recipient guardian |
  | `{{class.name}}` `{{teacher.name}}` | Context |
  | `{{grade.percent}}` `{{grade.letter}}` | Current weighted grade |
  | `{{grade.delta}}` | Change over the signal's window — the praise workhorse |
  | `{{missing.count}}` `{{missing.list}}` | Missing work |
  | `{{attendance.percent}}` `{{attendance.absences}}` `{{attendance.tardies}}` | Term totals |
  | `{{signals.list}}` | Why this student surfaced, in plain sentences |
  | `{{behavior.recent}}` | Recent behavior log entries |

- **A refusal list, enforced at the resolver, not at the template editor.** Any path reaching
  `supports`, `medical`, `behaviorPlan`, `plan`, `caseManager`, or `reviewDate` is refused — it does
  not render, and it raises a named error. `{{signals.list}}` and `{{behavior.recent}}` are
  explicitly filtered too, since either could otherwise carry a plan reference through.
- Unresolved fields render **visibly intact** (`{{guardian.name}}` stays on screen) and block the
  send with a named error saying which field and which student.
- Numbers come from WO-3.4 and WO-2.4, never recomputed here — two grade implementations will
  disagree eventually, and the email is the copy that's wrong.

**Acceptance**
- [x] A template containing `{{supports.accommodations}}` (or any refused path) refuses with a named
      error and renders nothing sensitive. Verify every path in the refusal list individually.
- [x] `{{signals.list}}` for a student with an accommodation-derived signal emits no plan reference.
- [x] A student with no guardian on file blocks the send naming the missing field; the draft is not
      sendable in that state.
- [x] `{{grade.percent}}` matches the gradebook exactly for the same student and term.
- [x] `{{grade.delta}}` matches the delta shown on the praise signal that produced the draft.
- [x] An unknown field name is refused, not silently blanked.

**Where this stands.** ✅ on 2026-08-28, all six Acceptance lines closed — none of them wanted a
human or a date. `src/merge-fields.js` is the resolver; both tools are green on the delivered tree
(`verify-shell.mjs` `1194 checks · 1194 passed · 0 failed · 0 skipped`, 396s, exit 0; `wo-sweep.mjs`
`34 checks · 31 passed · 0 failed · 3 to review`, all three pre-existing), with nineteen new checks
in § *"the merge-field resolver (WO-5.1)"* and a new sweep § 20. `TESTING.md` § WO-5.1 carries the
readings.

**Four things it decided that this work order did not**, each argued at its own point of departure
and recorded in [`../../docs/data-model.md`](../../docs/data-model.md) § Outreach templates:

- **The refusal list is a test surface and the wording of an error, not the fence.** `REFUSED_WORDS`
  runs only over names the whitelist has *already* refused, and deleting it would change no outcome.
  That is what makes the Traps line structural rather than promised.
- **A refused token stays visibly intact, exactly as an unresolved one does** — three outcomes told
  apart by a named `code`, never by the shape of the output. Dropping or blanking a refused token
  produces a body that reads clean and could be sent; a literal `{{supports.medical}}` carries no
  student's data and cannot be mistaken for a finished sentence.
- **`{{behavior.recent}}` carries a date and a `subject`, three entries, newest first — never a
  `body`.** The limit that leaves is stated rather than claimed away: a subject is free text.
- **Presentation mode is not asked here.** It is the screen's suppression; **WO-5.2's live preview
  is the screen that owes `src/supports.js` the question** before it draws a resolved body.

**Traps** — Whitelist the resolvable paths; do not blacklist the forbidden ones. A blacklist fails
open the moment someone adds a field to the data model. *(Held, and* **the whitelist is an ARRAY
scanned by `===` rather than an object indexed by the token** *— indexed, `{{constructor}}`,
`{{toString}}` and `{{__proto__}}` all find something truthy, which is the first build of a resolver
of this shape and is measured against here.)*

---

## WO-5.2 — Templates

**Ship** — · **Status** ✅ DONE — 2026-08-28 · **Size** M · **Depends on** WO-5.1
**Closes roadmap** Phase 5 → "Templates with merge fields" and "Separate concern and praise
templates."

**Why it exists.** A good praise message reads nothing like a good concern message — same length,
opposite structure. One template set that tries to be both produces a praise email that sounds like
a warning.

**Deliverables**
- `templates[]` per the data model: `{ id, name, audience, tone, subject, body }` with
  `tone: "concern" | "praise"` and `audience: guardian | counselor | admin | student`.
- Editor with a live preview resolved against a chosen real student, so a broken field is caught at
  authoring time rather than at send time.
- A field palette listing exactly what's resolvable — which doubles as documentation of the refusal
  list, by omission.
- Starter templates for both tones and each audience, written in the suite's voice: friendly-
  utilitarian, sentence case.
- **Surface** — [`design/mockups/outreach.html`](../../design/mockups/outreach.html), drawn
  2026-08-28. It settles: three columns in the order of the work (list · editor · preview) with the
  preview never behind a button; **one in-body treatment for all three failures**, the token handed
  back intact and the block strip carrying the named reason and the student; the palette stating the
  supports rule in words rather than by omission; a plain `textarea` body with no token highlighting,
  because the alternative is this app's first `contenteditable`; and the 390px stacking order
  list · editor · preview · palette. The CSS is `design/mockups/proposed-phase5.css`, five sections,
  and `§ UNRESOLVED` is the one WO-5.3 inherits.

**Open — answered by the owner, 2026-08-28** — *where is this screen reached from?* The drawing
shows it with *All classes* selected, because a template is not about one class, which makes the
class switcher wrong; *Your details* is the nearest existing home; a sixth screen-nav segment is what
WO-6.6 ruled against twice. **Answer this when cutting the row, not in the editor.**
→ **A fourth icon in `hdr-right-controls`, opening a full main-area view.** That cluster already
holds exactly the surfaces that belong to no class — the roster, the classes and terms, the
teacher's own details — so this is an established pattern rather than a new one. Not *Your details*
(a message a hundred guardians read is not a setting) and not a sixth segment. **It cost 49px of the
header row at 390px**, paid in `src/shell.css`'s 640px block: the divider goes and the term nav's
floor drops 96 → 64, because a fourth 44px control put the page into horizontal overflow and
reddened five sideways-scroll checks across four screens. The class strip's own floor was
deliberately not touched.

**Open — answered by the owner, 2026-08-28** — *does the block strip stay when nothing is wrong?*
Drawn green and permanent, on the argument that a strip appearing only on failure reads as an error
banner while one always present is a report, and WO-5.3 reads the same `blocked` flag. The cost is
permanent chrome on a narrow screen.
→ **Permanent, wording as drawn**, and the one line of chrome at 390px is accepted. It says
*"Nothing blocked · N fields resolved"* in the green state and names the field, the reason and the
student in the amber one.

**Open — answered by the owner, 2026-08-28** — *do the starter templates ship filled in, and how
many?* Written well they teach what a merge field is faster than any help text; written once they
are also the sentences a hundred guardians read in the same words.
→ **Eight, filled in — both tones × each of the four audiences — and NONE auto-loaded.** They are
shipped TEXT rather than document rows: `newYearDocument()` gains nothing, the list offers them
under the teacher's own, opening one fills the editor as an unsaved draft, and a **Save** is what
writes a record. The editor opens empty. That one keystroke is the whole of the answer to "the same
sentences to a hundred guardians".

**Traps** *(added 2026-08-28, out of WO-1.32's verification — see its note and WO-1.34)*

- **The resolver is already built for you, and you have no reason to open it.**
  `mergeFieldPalette()` returns `{ name, about }` for all sixteen fields in the documented order, a
  fresh copy each call, with **no `resolve` on it** — WO-5.1 built it for this work order by name,
  and its own comment says why it carries no resolver: a screen that could reach one through the
  palette could resolve a field outside a draft, which is a second door into the same room. Map over
  what it hands you. Do not import `FIELDS`, do not add an export, and do not index anything by a
  token.
- **If you find yourself wanting `FIELDS[name]`, stop and say so — do not write it.**
  `wo-sweep.mjs` § 20 claim 5 forbids every dynamic property read in that file: a bracket subscript
  whose key is not an integer literal, a split, a fold, `eval`, `new Function`, `Reflect.get`. It
  goes red and names the line, so this is not a rule you can discover late cheaply — you would
  discover it after the screen was built. It exists because WO-5.1's dispatch shipped a path walk
  that resolved `{{student.supports.medical}}` to the roster string while every tool was green. **A
  palette that needs a lookup by key is a finding, not a workaround:** say so in your result file and
  name [WO-1.34](phase-1-shell-store-roster.md#wo-134--claim-5-reads-member-position-and-three-spellings-walk-around-it),
  which is the booked work order for the one gap in that check. **If this work order's result file
  names WO-1.34, that row goes next** — the finding is the only thing that moves it up the queue.

**Out of scope** — any change to `src/merge-fields.js`, including its exports: the palette this work
order needs was built by WO-5.1 and is already there. Any resolver of your own, anywhere, including
one behind the live preview.

**Acceptance**
- [x] A concern template and a praise template can exist for the same audience and are offered
      separately at send time. *(Both written through the real controls, then asked the question
      WO-5.3 asks from the signal card: `templatesFor(doc, tone, audience)` filters on **both**, so
      it hands back one record for `concern/guardian`, a different one for `praise/guardian`, two
      when the tone is not named and none for an audience they were not written for. The list on
      screen draws two rows and the tone switch narrows it to one and back. "At send time" is the
      half this work order cannot finish — the send flow is WO-5.3 — so what is closed here is that
      the collection can hold the pair and offers them apart; the button that reads it is that work
      order's.)*
- [x] The live preview shows unresolved fields visibly, exactly as the send flow will. *(**"Exactly"
      is asked as an identity rather than as a screenshot**: what the column draws is character for
      character what `resolveDraft()` returned for the same request, and WO-5.3 renders the same
      string from the same call. All three failures are measured on screen — a real field with
      nothing behind it for this student, a refused path and a typo — each handed back as the
      teacher's own token, marked with `.mf-token` and told apart only by the sentence in the block
      strip.)*
- [x] The field palette contains no refused path. *(Sixteen chips drawn in the DOM, matching
      `mergeFieldNames()` name for name and in order, none of them matching
      `supports|accommodation|medical|behaviou?rPlan|plan|caseManager|reviewDate|attendanceClause`.
      And the palette says the rule out loud as well as by omission: the fence names accommodations,
      IEP and 504 details, medical needs, behavior plans, the case manager and the review date as
      things that cannot be merged and cannot be added.)*
- [x] Templates survive a backup round-trip. *(Twice. Through the FILE — `buildBackup()` then
      `parseBackup()`, the validator that refuses a document whose shape does not match
      `newYearDocument()` — byte for byte; and through the real restore, `restoreFromText()` and the
      confirm button a teacher taps, after which both records are still there, still offered
      separately by tone, and drawn on the list.)*

**Where this stands.** ✅ on 2026-08-28, all four Acceptance lines closed — none of them wanted a
human or a date. `src/templates.js` is the model, `src/templates-view.js` the screen,
`src/templates.css` the sheet the drawing's four screen sections lifted into, and
`src/shell.css` § UNRESOLVED the fifth section, which WO-5.3 inherits. `TESTING.md` § WO-5.2 carries
the readings.

**One reading was waived and is NOT closed here** (the owner, 2026-08-28). The last caption of
[`outreach.html`](../../design/mockups/outreach.html) asks in bold for a thumb on a real tablet
before this row was dispatched: *"tap a chip to insert at the cursor"* is a desk gesture, and on a
phone the keyboard is up, the palette is below the fold, and tapping it may close the field it is
meant to type into. **The palette ships as drawn** — chips in a column under the field — and the
alternative in hand is a sheet over the keyboard. Nothing about it has been measured; the harness
proves the insertion lands at the caret, which is a different claim from *it is reachable while the
keyboard is up*. Written down here rather than closed quietly.

**Three things it decided that this work order did not:**

- **The starters are shipped text, not document rows.** See the answered `Open` above. It is what
  keeps `newYearDocument()` unchanged, so no backup written by an earlier build is refused by name.
- **Presentation mode suppresses ONE COLUMN, not the screen.** WO-4.2's signals list closes
  outright; this screen's list, editor and palette are the teacher's own writing and name nobody,
  while the preview names a child. Nothing is resolved at all while the mode is on and the student
  picker is emptied rather than merely hidden. Argued at `src/templates-view.js`'s own header.
- **The preview passes the real signal hits.** `{{grade.delta}}` reads the hit a draft was opened
  from, so a preview that passed none would show two unresolvable fields on a template that is about
  to work perfectly. It runs the engine over the previewed class and takes the first hit in the
  engine's own order whose direction matches the template's TONE — which is what the signal card
  will hand over. A student with no hit in that direction gets none, and the field blocks: that is
  the honest answer rather than an invented row.

---

## WO-5.3 — Send flow

**Ship** — · **Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-5.2
**Closes roadmap** Phase 5 → "Audience picker", "Copy to self", "`mailto:` handoff", "Editable
before sending."

**Why it exists.** `mailto:` instead of a mail scope is an architectural commitment, not a
shortcut: a mail scope reads "Send email as you" on the consent screen, and the teacher's own sent-
mail record — which is what a school asks for when it asks — stays intact this way.

**Deliverables**
- Audience picker: guardian 1 / guardian 2 / counselor / admin, reading contacts already on the
  roster from WO-1.7.
- **Copy to self, on by default**, using the teacher email from settings.
- `mailto:` handoff opening the teacher's own client with subject and body populated.
- **Editable before sending. Always.** A generated message going out unread is the failure mode that
  ends trust in the feature.
- Entry points from the signal card and from the student record.

**Out of scope** — sending mail ourselves, in any form, ever. No SMTP, no API, no scope.

**Acceptance**
- [ ] The draft opens in the default mail client on desktop and on iPad with subject and body intact.
- [ ] A long body survives the handoff, or the app warns before truncation. *(`mailto:` length
      limits are real and client-specific — find the practical ceiling and document it.)*
- [ ] Copy-to-self is on by default and lands in the teacher's sent folder after sending.
- [ ] Every draft is editable in-app before handoff.
- [ ] No Google scope is requested anywhere in this flow.
- [ ] A blocked draft (unresolved field) cannot reach the handoff.
- [ ] A concern template and a praise template written for the same audience are offered
      **separately** in the picker — read through `templatesFor(doc, tone, audience)` with both
      arguments, never audience alone. *(**This line is WO-5.2's first Acceptance line finishing
      here, and it is not a re-homed box** — no `**Owes**` pointer, because nothing was moved and
      that box closed honestly. It reads "…and are offered separately **at send time**," and at send
      time there was no send flow: what WO-5.2 could close is that the collection holds the pair and
      hands them back apart, which its harness proves on four numbers including a `concern/admin` → 0
      that a tone-only filter would pass. The other half had no owner — none of the five lines above
      re-asks it — so it was booked here by WO-5.2's verifier on 2026-08-28 rather than left to the
      reader who eventually notices the picker offering one template for two tones.)*

**Traps** — Line breaks and non-ASCII characters in `mailto:` bodies need correct percent-encoding,
and getting it wrong produces a mangled email a teacher sends without noticing. Test with an
apostrophe, an em dash, and a multi-paragraph body.

---

## WO-5.4 — Contact log & history

**Ship** — · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** WO-5.3, WO-4.5
**Closes roadmap** Phase 5 → "Log the contact (append-only) and show contact history per student."

**Why it exists.** The log is what WO-4.5's cooldown reads. Without it the signal lists are
identical every week and the whole Phase 4 investment decays.

**Deliverables**
- On handoff, append to `log[]` with `kind: "contact"`, the audience, subject, body, and **the
  signal rule that prompted it** — the cooldown keys on `student + rule`.
- Contact history on the student record and on the signal card, newest first.
- Append-only, same as WO-4.4.
- Handle the honest gap: `mailto:` cannot confirm the message was actually sent. Log it as
  *drafted*, and let the teacher mark it sent — or state plainly in the UI that the log records the
  handoff, not delivery.

**Acceptance**
- [ ] A contact appears in the student's history immediately after handoff.
- [ ] The logged rule id is what WO-4.5's cooldown matches on, and suppression follows.
- [ ] Log entries are never edited or deleted.
- [ ] The UI is honest about what "logged" means given `mailto:` cannot confirm delivery.
- [ ] Contact history is presentation-mode safe — a projected history of behavior contacts is a
      disclosure.
