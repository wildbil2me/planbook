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

**One defect, found the day after it was ticked and fixed the same day** (the owner, on hardware,
2026-08-29: *"There's no way out of the message template screen"*). This editor is the **only** full
view in the app that is not a `CLASS_SCREENS` entry, so the header's class-tab strip did not draw
over it — and what drew instead was the caption branch's dead `<span>Your classes</span>`, sitting
over a panel headed *Message templates*. **That is word for word the bug WO-6.6 fixed for the
calendar**, arriving again in the sitting `src/classes.js` had explicitly warned would produce it:
*"A third view that belongs to neither kind would put the lookup back in the same sitting that adds
its `<div>`."* WO-5.2 added the `<div>` and no line there. A caption that reads like a control and
answers no tap is worse than an empty strip, and the panel's own `← All classes` button was the only
real door — the second door `index.html` says is never enough on its own at 390px.

**The repair is the owner's call and not the one that comment predicted.** The editor now draws the
class tabs and the *All classes* door, taking the strip **without** becoming a class screen: it is
not in `CLASS_SCREENS`, so it earns no segment on the class switcher and no `paintClassScreen()`
branch, and **no tab is marked active** — there is no class it is in, and lighting up whichever one
was open last would say so falsely. Templates are global; `templatesFor(doc, tone, audience)` takes
no `classId`. See the note over `carriesTabs` in `src/classes.js`. `verify-shell.mjs` green
afterwards at `1251 checks · 1251 passed · 0 failed · 0 skipped`.

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

**Ship** — · **Status** ✅ DONE — 2026-08-29 · **Size** M · **Depends on** WO-5.2
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
- [x] 👤 The draft opens in the default mail client on desktop and on iPad with subject and body
      intact. *(**The mark was added when the row was built**, 2026-08-28, rather than being on it
      when it was written: this line ends outside the app, in a mail client, on two devices. What
      the harness closes is everything up to that edge — the `href` on the handoff link is read out
      of the DOM and the body decoded back out of it matches the box character for character. What
      it cannot do is press it, because a headless browser that follows a `mailto:` hands the page
      to the operating system.)* **Read by the owner on hardware 2026-08-29 and closed** — the
      draft opened in the default client on both devices with the subject and body intact.
- [x] A long body survives the handoff, or the app warns before truncation. *(`mailto:` length
      limits are real and client-specific — find the practical ceiling and document it.)*
      *(**2,000 characters of assembled URL**, reasoned from the tightest documented figure rather
      than measured on every client: `ShellExecute` on Windows caps at 2,083 and Outlook's handler
      has cut at ~2,048 for two decades, where macOS and iOS Mail carry several thousand. The number
      and its working are in `src/outreach.js` at `MAILTO_CEILING`. **The app truncates nothing** —
      it warns before the fact, names the number and names Outlook, and the link still carries the
      whole message, because silent truncation is what this line is written against and an app that
      trimmed the body to fit would be committing it on purpose. Measured on the ENCODED URL, which
      is the only number related to what gets cut: a line break costs six characters and an em dash
      nine.)*
- [x] 👤 Copy-to-self is on by default and lands in the teacher's sent folder after sending.
      *(**Half of this is closed and half of it cannot be**, which is why the mark was added when
      the row was built. `teacher.defaultCc` seeds the toggle at open time, and the harness reads a
      real `cc=` header carrying the teacher's own address off the link, watches it come off when
      the toggle goes off and come back when it goes on, and asserts the per-draft toggle writes
      nothing back to the year. Whether a copy **lands in the sent folder** is a fact about a mail
      client and an account, and it wants a person who has actually sent one.)* **Read by the owner
      on hardware 2026-08-29 and closed** — the copy arrived and the message was in the sent folder.
- [x] Every draft is editable in-app before handoff.
- [x] No Google scope is requested anywhere in this flow.
- [x] A blocked draft (unresolved field) cannot reach the handoff.
- [x] A concern template and a praise template written for the same audience are offered
      **separately** in the picker — read through `templatesFor(doc, tone, audience)` with both
      arguments, never audience alone. *(**This line is WO-5.2's first Acceptance line finishing
      here, and it is not a re-homed box** — no `**Owes**` pointer, because nothing was moved and
      that box closed honestly. It reads "…and are offered separately **at send time**," and at send
      time there was no send flow: what WO-5.2 could close is that the collection holds the pair and
      hands them back apart, which its harness proves on four numbers including a `concern/admin` → 0
      that a tone-only filter would pass. The other half had no owner — none of the five lines above
      re-asks it — so it was booked here by WO-5.2's verifier on 2026-08-28 rather than left to the
      reader who eventually notices the picker offering one template for two tones.)*
      *(**Closed 2026-08-28, on four numbers and on the picker itself.** The flow reads
      `templatesFor(doc, tone, audience)` with both arguments, once, and the fixture is written so
      that either wrong filter is visible: praise/guardian hands back 3, concern/guardian 1 with no
      record in common, concern/counselor 1, and **praise/counselor 0 — the number a tone-only
      filter would answer 3 to**. Then the same question of the `<select>` a teacher taps: it holds
      the three praise templates, tapping Concern replaces them with the one concern template
      written for the same guardian, and the draft is rebuilt from it rather than left as the old
      words under a new heading.)*

**Traps** — Line breaks and non-ASCII characters in `mailto:` bodies need correct percent-encoding,
and getting it wrong produces a mangled email a teacher sends without noticing. Test with an
apostrophe, an em dash, and a multi-paragraph body. *(Held, and* **the round trip is the assertion
rather than a list of characters**: *what decodes out of the URL is compared to the box on screen
character for character, with every line break encoded `%0D%0A` per RFC 6068 § 5 and not one bare
`%0A` — the half that goes wrong quietly, because three paragraphs run into one arrive looking like
a message somebody typed badly rather than like a bug. The fixture carries the three the trap names*
**plus the two that break a `mailto:` silently rather than visibly** *—* `&`*, which starts a new
header, and* `#`*, which truncates everything after it into a fragment.)*

**Where this stands.** 🔨 on 2026-08-28: five of the seven Acceptance lines closed, and **the two
that are open are both 👤 and neither is a build**. `src/outreach.js` is the model — who a draft can
go to, the URL, and the ceiling — `src/outreach-view.js` is the modal over it, `src/shell.css`
§ THE SEND FLOW is the four rules that panel needed on top of components this app already owns, and
`tools/verify/outreach.mjs` is twenty-eight checks driving the real flow through both of its doors.
`TESTING.md` § WO-5.3 carries the readings.

**Six things it decided that this work order did not**, each argued at its own point of departure:

- **A recipient is not an audience, and the picker offers five people over four drawers.** The
  Deliverables name "guardian 1 / guardian 2 / counselor / admin"; `AUDIENCES` has one `guardian`
  value and a fourth value, `student`, that they do not name. So `src/outreach.js` maps recipient →
  audience and **`AUDIENCES` is not widened**: both guardians read the `guardian` drawer, because a
  message written to a guardian reads the same to either and what makes it personal is
  `{{guardian.name}}`, which resolves to the one the teacher picked. **The fifth chip is the student
  herself**, and that is a departure from the four named above: `src/templates.js` put `student` on
  the vocabulary *for this picker*, in as many words, and four of the app's eight starters are
  written for her — a picker without it can never reach them and `templatesFor(doc, tone, 'student')`
  is never called by anything.
- **A recipient with no email address is on the list and blocks, rather than being left off it.**
  An absence and a bug look identical (`src/calendar-view.js`'s rule): a guardian silently missing
  reads as *this app cannot write to a second guardian*, where what is true is *there is no address
  on file for him*. The one thing never done is opening a mail window with an empty To field.
- **The eight starters are NOT offered at send time.** They are shipped text and a Save is what
  makes one a record (WO-5.2, the owner) — "the one keystroke between a shipped sentence and a
  hundred guardians reading it in the same words". Offering them here would be that keystroke
  removed. A teacher with nothing saved for a tone-and-audience pair is told so and pointed at the
  Message templates screen.
- **The handoff is an `<a href="mailto:…">` and a blocked draft's link has no `href` at all.** Not a
  disabled button: an anchor with no `href` is not focusable, not clickable and carries no address,
  which is the same posture the live preview takes when it returns before resolving. It also makes
  the string the operating system receives readable from the DOM, which is the only way the
  percent-encoding above could be measured rather than promised.
- **After the resolve, the gate is what is on the page.** `resolveDraft()` runs once per template,
  recipient or tone — never on a keystroke — and what blocks the send afterwards is any `{{…}}` left
  in the boxes. That is the resolver's own sentence (*"until it is corrected or removed"*) honoured
  at the end that can see the correction: a teacher who types a guardian's name over the token has
  fixed the draft, and a button that stayed dead would make the feature useless for the one student
  it was opened about. **Re-resolving her edits was the other answer and is wrong twice over** — it
  would either overwrite what she typed or report `{{grade.percent}}` as resolved while that literal
  sat in the body on its way out.
- **Presentation mode closes this flow outright**, which is `src/signals-view.js`'s refusal rather
  than the template screen's one-column suppression. That screen keeps its list, editor and palette
  because a template names nobody; **there is no such half here** — the title, the picker, the
  recipient line, the subject and the body are all one child's business, and the picker carries her
  guardians' email addresses. The fields are emptied rather than hidden, which is
  `src/supports.js`'s `sensitiveValue()` rule applied to a `<textarea>`.

**One thing it found and did not act on.** `src/merge-fields.js`'s header (~line 130) says *"WO-5.3
is what writes a `contact` entry once a draft has actually left the building"*. **That line is stale
and this work order deliberately left it standing**: the contact log is
[WO-5.4](#wo-54--contact-log--history)'s Deliverables — `log[]`, `kind: "contact"`, the audience and
the `ruleId` the cooldown keys on — and editing another module's prose to match a boundary is that
work order's sitting rather than this one's. Nothing in this flow writes to the document at all, and
the harness proves it on `rev`: unchanged across a whole flow of picking, toggling, typing and
blocking.

---

## WO-5.4 — Contact log & history

**Ship** — · **Status** ✅ DONE — 2026-08-29 · **Size** S · **Depends on** WO-5.3, WO-4.5
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
- [x] A contact appears in the student's history immediately after handoff.
      *(Driven rather than reasoned: the handoff is pressed and the row is read back off the card
      the draft was opened from, still open, with no reload and without the card being rebuilt
      around it — the audience, the subject, the day and the rule that prompted it.* `rev 277 → 278`
      *and the entry carries the eight fields* `docs/data-model.md` *§ log documents, in order, with
      a local* `at` *stamp carrying its offset rather than a Z.)*
- [x] The logged rule id is what WO-4.5's cooldown matches on, and suppression follows.
      *(Off the handoff alone, on a student who trips two concern rules: her row comes back holding*
      `["grade-below","grade-rose"]` *with the cooldown holding* `"missing-count"` *— 1 suppressed,
      1 row drawn, the foot reading* "1 you wrote about recently · show it" *and the return date
      Sep 12.* **The two-rule student is the check rather than a fixture detail**: *keyed on the
      student alone she would have vanished from the screen altogether, and a one-rule fixture could
      not tell the two apart.* **This is the line the dead dispatch's live mutation was aimed at** —
      `ruleId: ''` *reaches* `lastContactAbout()`, *which returns* `null` *for an empty rule, so
      every contact the app wrote would have silenced nothing and the screen would have looked
      exactly as it does today. See the note under the section head in* `TESTING.md`.)*
- [x] Log entries are never edited or deleted.
      *(Two handoffs driven end to end: the log goes 1 → 2 and the first entry is still there byte
      for byte, compared whole rather than by length.* **A second handoff is a second entry** *, which
      is the append-only rule rather than a gap in it —* `src/log.js` *gained a second writer and it
      is still a* `push` *inside one* `update()`*, with no id lookup anywhere in the file. The
      harness pin is an* **equality**, `pushes === 2`, *raised from* `=== 1` *rather than loosened
      to* `<=`*, which is the difference between a check that still bites and one edited down to
      fit.)*
- [x] The UI is honest about what "logged" means given `mailto:` cannot confirm delivery.
      *(Deliverable 4 offered two answers and this took the second:* **honest copy, not a *mark
      sent* control** *— a second write to an entry that already exists is what the line above
      forbids, so the cheaper answer is also the only one that does not need a second entry to mean
      "I sent it". It says so in four places —* `index.html:2680`*,* `src/outreach-view.js:1099`
      *at the moment of the act, and* `src/contact-history.js:112` *and* `:214` *at the moment it is
      read back. The card's own title carries it too:* **"Who you have written to"**, *never* sent.)*
- [x] Contact history is presentation-mode safe — a projected history of behavior contacts is a
      disclosure.
      *(**Absent rather than redacted**: the model hands back 0 of 2 contacts with the mode on and 2
      with it off, the card draws no row, and no subject, body or guardian address is in any
      container a projector can show. There is no* "N hidden" *line, because a count is the
      disclosure — and the empty sentence is asserted* **character for character** *against a
      student nobody has ever written to, which is the only way to prove the count did not arrive by
      wording instead of by number.* `src/contact-history.js` *contains no* `presentationMode()`
      *test and must never contain one: suppression arrives as a shorter list out of* `src/log.js`*,
      so the rule stays in* `src/supports.js` *and the screen cannot disagree with it —*
      `src/calendar-view.js`*'s ruling, and* `wo-sweep.mjs` *§ 5 counts the askers.)*

---

*(**The four work orders below all came out of one sitting**: the owner used the finished send flow
on real hardware on 2026-08-29, closed WO-5.3's last two Acceptance lines, and reported seven things
in the same breath. One was a defect and was fixed that day — the template editor had no class tabs
and so no way out, which is WO-5.2's screen and is recorded there. The other six are these. **They
are booked rather than folded into WO-5.3** for the reason that work order closed at all: a row that
grows to absorb everything its own demo suggests is a row that never closes, and none of the six is
a failure of the seven lines that were verified. Read them as one conversation cut four ways rather
than as four independent ideas — WO-5.8 in particular reverses something WO-5.3 proved.)*

---

## WO-5.5 — The two sentences the flow does not say

**Ship** — · **Status** ✅ DONE — 2026-08-29 · **Size** S · **Depends on** WO-5.3

**Why it exists.** Two places where the app knows something the teacher does not, and says nothing.
Both were found by watching one person use it for the first time, which is the only way this kind of
defect is ever found.

**The first is in the editor.** The eight starter templates ship as TEXT and become records only
when saved — WO-5.2's ruling, and a good one: a Save is "the one keystroke between a shipped
sentence and a hundred guardians reading it in the same words." But nothing on the screen says so.
A teacher who reads a starter, likes it, and goes to write a message finds it is not on offer, and
the app's explanation is an empty picker. **The rule is right and its silence is the bug.**

**The second is in the send flow.** A draft holding an unresolved field says *"This draft cannot be
sent"* — true, and no help at all. It does not say what to do, and what to do is simple: type over
the token, or take it out. The owner's wording is better than the shipped one because it describes
the state rather than announcing a refusal, and a teacher who reads *"has at least one undefined
field"* already knows more than one who reads *"cannot be sent."*

**Deliverables**
- The template editor says, where a starter is opened, that it is not available in a draft until it
  is saved — at the moment the question arises, not in a help panel.
- The block strip's head changes from *This draft cannot be sent* to **This draft has at least one
  undefined field** (the owner's words, 2026-08-29).
- The strip carries the instruction: remove the field or type what it should say, and the draft
  continues. The resolver's existing per-field sentences stay exactly as they are — this adds the
  sentence about what to DO, which no resolver can write because it is about the box, not the token.

**Acceptance**
- [x] Opening a starter in the editor states that it must be saved before a draft can use it.
      *(The line under the editor, which used to say* "Saving makes it yours" *— true, and an answer
      to a question about ownership nobody was asking. It reads* **"Starting from one of Planbook’s
      templates. It is not on offer when you write a message until you save it — change anything in
      it first, then save to make it yours."** *`openStarter()`'s announcement carries the same
      sentence, so a teacher on a screen reader hears it when she opens the starter rather than only
      if she goes looking for that line. Asserted off the DOM rather than off the model, because the
      claim is about what the screen says.)*
- [x] A draft with an unresolved field heads its strip *This draft has at least one undefined field*
      and says, in words, that removing the field or typing over it will unblock the draft.
      *(One constant in a new `src/block-strip.js`, imported by both screens — see the first of the
      two rulings below. The instruction is* **"Remove the field or type what it should say over it
      — either one unblocks the draft."** *and it is the send flow's; the second ruling below says
      why it is not on the editor's preview. The head is asserted* **whole** *in both harnesses, the
      sentence and the count after the `·` together, and the instruction is asserted* **gone** *once
      the field is typed over — the pair that stops it passing vacuously.)*
- [x] The resolver's own per-field sentences are unchanged — this work order adds a sentence and
      rewrites a heading, and touches `src/merge-fields.js` not at all. *(That file is not in this
      work order's diff at all, and `wo-sweep.mjs` § 20 reads it at the same 221 lines of stripped
      code with the same sixteen fields and nine refusal words. The refused, unknown and unresolved
      sentences are still printed word for word* **under** *the new head, which the check above the
      new one in `tools/verify/outreach.mjs` asserts in the same breath as the head itself.)*
- [x] Neither new sentence names a student, so presentation mode is unaffected. *(Neither
      interpolates anything: both are constants with no student, guardian, class or support value
      anywhere in them. Neither is reachable while the projector is on either — the send flow empties
      the strip before `paintBlock()` runs and the preview hides it, both of which their own
      projector checks already assert.)*

**Traps** — The block strip is drawn by two screens (`src/templates-view.js`'s preview and
`src/outreach-view.js`) over one shared section, § UNRESOLVED in `src/shell.css`. A heading changed
in one and not the other is this phase's own "two askers" defect. Change it once.

*(**Three things read off the tree on 2026-08-29, after WO-5.6 landed and the flow went live.**
Added here rather than left for the implementer to hit, because two of them turn a green harness red
and the third turns it green while breaking an Acceptance line above.*

- ***"Change it once" is the intent and not yet the shape.*** *The two heads are already different
  strings —* `src/outreach-view.js:481` *ends "· N things to fix",* `src/templates-view.js:513` *ends
  "· N field did not resolve" — so there is no shared constant to edit and an implementer looking
  for one will not find it.* **Whether to unify them into one place or change both in step is this
  work order's call to make and to write down**, *but it cannot be made by accident.*
- ***The old head is asserted in two harness files, and both go red.*** `tools/verify/outreach.mjs:585`
  *tests* `/cannot be sent/` *on the strip head and* `tools/verify/templates.mjs:498-502` *tests*
  `/cannot be sent/i` *on the preview's.* **Update the assertions to the new head and keep every
  other conjunct** *— the WO-5.6 sitting reddened four WO-5.3 checks the same way and the answer was
  to strengthen them, never to relax one to match new copy. A check edited down to fit is the defect
  this directory exists to catch.*
- ***`src/merge-fields.js` says "cannot be sent" too, and must not be touched.*** *Lines 549 and 552
  are the resolver's own per-field sentences, which* **Acceptance line 3 protects in as many words**.
  *A find-and-replace over the phrase satisfies the second Acceptance line and breaks the third in
  the same keystroke.* `src/outreach.js:18` *and* `:178` *quote the resolver in prose and are not copy.*

*And one thing that is an opportunity rather than a trap: the strip itself is an empty*
`<div id="outreachBlock">` *filled by JS, so the send-flow half likely opens no* `index.html` *at
all — but the editor half may.* **If this sitting opens `index.html`, row 42 rides with it** *—*
[WO-8.13](phase-8-packaging.md#wo-813--the-about-modal-names-two-documents-and-not-the-licence)*,
one About row, which is what the* 🎒 *mark is for. An* `index.html` *change also wants a* `CACHE`
*bump in* `sw.js`*.)*

**Where this stands.** ✅ on 2026-08-29: all four Acceptance lines closed, **no 👤 and no 📆**. It is
`src/templates-view.js`, `src/outreach-view.js` and one new module; **no stylesheet was opened and
`index.html` was not edited** — the instruction is a `.mf-reason`, which is what the strip's own
ready-state sentence already is, and the editor's line is text in a `<p>` that was already there. So
there is no new control and no `@media (pointer: coarse)` pass to take. Both tools green on the
delivered tree: `verify-shell.mjs` at `1265 checks · 1265 passed · 0 failed · 0 skipped`, 38,000
lines, 421s, exit 0, and `wo-sweep.mjs` at `34 checks · 31 passed · 0 failed · 3 to review`, all
three reviews pre-existing and unchanged. `TESTING.md` § WO-5.5 carries the readings.

**The two heads are one string now — `src/block-strip.js` — and the mutation round is what says
that is structural rather than currently-true.** Putting `UNDEFINED_FIELD_HEAD` back to
*"This draft cannot be sent"* turns **both** screens' head checks red from one line, which is
exactly what could not happen before: the same edit made by hand would have reddened one and left
the other quietly saying something else. Three lines undone — that head, the instruction, and the
editor's starter sentence — read `1265 checks · 1261 passed · 4 failed`, exit 1. *(Two clauses
correctly did not fire, and both are absences: that the instruction row is gone once the draft is
clear, and that it never appears on the editor's preview. Neither can fail when the sentence is
merely emptied. Named rather than counted, because a mutation that cannot express a failure is not
evidence about it.)*

**Three things it decided that this work order did not.**

- **The new head is conditional on there being a field in the list, and the old sentence survives as
  the other arm.** The send flow's strip counts *things to fix*, and three of the four kinds are not
  merge fields: a recipient with no address, no message chosen, and *Copy me* with nowhere to copy
  to. Heading a draft whose only fault is a missing guardian address with *"has at least one
  undefined field"* would be the strip stating something false about the draft — a worse defect than
  the one this row came to fix, and the opposite of the owner's own reason for preferring the new
  wording, which is that **it describes the state**. So the owner's sentence heads the case it is
  true of and the shipped one heads the rest. **The phrase surviving in `src/outreach-view.js` is
  that arm and not a missed replacement**, and `src/merge-fields.js` was not opened for either.
- **The instruction is on the send flow and not on the editor's preview.** It is advice about a BOX,
  and the two boxes are not the same object: the send flow's holds one message to one person. The
  editor's holds the template every later draft is cut from, so a teacher whose one previewed
  student has no guardian on file would be told, by the app, to strip `{{guardian.name}}` out of a
  template that works for the other twenty-nine — against the resolver's own sentence on the same
  strip, which says there is nothing to put there and points at the roster. **Why it exists** puts
  this half of the work order *"in the send flow"* in as many words, and the Traps line is about a
  HEADING changed in one screen and not the other, which is held exactly. The absence is asserted in
  `tools/verify/templates.mjs` rather than left to be noticed.
- **The shared file holds the head's grammar as well as its words**, and that arrived through a
  check rather than through taste. As two exported constants it was 175 characters of stripped code,
  and `tools/verify/classes-terms.mjs`'s term-literal sweep guards itself with `shortest > 200` so
  that a comment-stripper which ate a file cannot read green — so the run went red at a check with
  nothing to do with this row. **Lowering the floor would have been relaxing a check to fit new
  code.** `blockHead(sentence, count, singular, plural)` went in instead, which the two screens have
  as much reason to agree about as they have about the sentence — the `·` and the plural were also
  written out twice — and the module stands at 288, above `src/live-region.js`'s 250. The tree's
  smallest module is the one it was before.

**And the ride-along was not taken.** `index.html` was read in one `grep` and never opened to edit,
so [WO-8.13](phase-8-packaging.md#wo-813--the-about-modal-names-two-documents-and-not-the-licence)
is exactly where it was: still 🎒, still unbuilt, still owed its own dispatch.

**One thing it found and did not close, and it is the first bullet above turning into a work order.**
The head is conditional, and the surviving arm — `'This draft cannot be sent'` at
`src/outreach-view.js:504` — **is asserted nowhere**: `grep -rn "cannot be sent" tools/verify/`
returns nothing, and every blocked draft this harness builds carries a merge field, so the fixture
cannot express a failure of the false branch. A later edit making the head unconditional reads green
at 1265 while telling a teacher whose only fault is a missing guardian address that her draft has an
undefined field — **the exact falsehood this row's own ruling was made to prevent, with the ruling
sitting in a comment nothing pays for.** Booked as
[WO-1.37](phase-1-shell-store-roster.md#wo-137--the-strips-other-head-is-asserted-nowhere-and-no-fixture-can-reach-it),
row 43, rather than widened into this one: the fix is a fixture and a mutation in
`tools/verify/outreach.mjs` and opens no file this work order owns.

---

## WO-5.6 — A draft survives a change of mind

**Ship** — · **Status** ✅ DONE — 2026-08-29 · **Size** S · **Depends on** WO-5.3

**Why it exists.** Changing the template, the tone or the recipient rebuilds the draft from
`resolveDraft()` and **throws away whatever the teacher had typed**, with no warning and no undo.
WO-5.3 chose to re-resolve on those three changes deliberately — the alternative was a flow that
re-resolved on every keystroke and overwrote her edits continuously, which is worse — but it never
asked what should happen to work already done. The owner found the answer the expensive way on
2026-08-29: *"Don't blank the template automatically on changing anything — put a confirm button up
so work isn't lost."*

**This is the smallest of the four and the one worth doing first.** The other three add capability;
this one stops the app destroying something a teacher wrote.

**Deliverables**
- A change to template, tone or recipient that would discard **edited** text asks first, names what
  it is about to do, and does nothing until the teacher says so.
- An **unedited** draft rebuilds silently, as it does today. A confirm on every tap of a tone pill
  while nothing has been typed is a dialog that teaches people to dismiss dialogs.
- So the flow has to know whether the draft has been touched since it was resolved — a comparison
  against the resolved text, not a keystroke flag, so that typing a word and deleting it again
  leaves the draft unedited.

**Acceptance**
- [x] Typing in the body, then changing the template, asks before rebuilding; cancelling leaves the
      typed text exactly as it was. *(Driven through the real controls. While the question is up the
      model still holds the old template, the body still holds the typed words, and* **the
      `<select>` has been put back** *— a select takes its new value before its `change` event is
      delivered, so a flow that asked without repainting would leave the picker claiming a rebuild
      that had not happened. After the cancel the body is compared* **character for character**
      *against the string that was typed, and the tone, the recipient, the picker and the live
      `mailto:` link are all what they were.)*
- [x] Confirming rebuilds the draft from the new template, as today. *(The body is the new template
      resolved, not one word of hers survives, no merge field is left, and the status line says the
      replacement happened* **at her word** *rather than reporting a loss she was never asked
      about.)*
- [x] An untouched draft rebuilds with no prompt at all, on all three controls. *(All three in one
      pass, each asserted to have* **actually rebuilt** *as well as to have stayed quiet — three
      different templates, three different bodies — because a control that had silently done nothing
      would pass a check that only counted dialogs.* **The tone tap is the one that hides here**:
      *it changes which templates are on offer and therefore which one is selected, so it replaces
      the draft without anything having named a template.)*
- [x] Typing a character and removing it again counts as untouched. *(Asserted as a* **pair**, *so
      it cannot pass vacuously: the same chip is tapped twice over the same draft, once with one
      stray `z` in the body and once with it removed. The first asks and the second does not. A
      check that only did the second half would pass over a flow that had stopped asking
      altogether.)*
- [x] The document is not written at any point — this flow still holds `rev` still, per WO-5.3.
      *(A second `rev` reading of its own across the asking, the cancelling, the confirming, three
      silent rebuilds, a projector cycle and a touch pass, with `log[]` and `templates[]` compared
      too —* **flushed first**, *for the reason WO-5.3's own check gained a `flush()` on its
      mutation round.)*

**Traps** — The subject and the body are two boxes and either can be edited; a confirm that watches
only the body loses a rewritten subject silently, which is the same bug one field further along.
*(Held, and measured rather than reasoned about: a rewritten subject over an untouched body asks,
and the panel lists* **the subject and only the subject** — *the fact list is built from the same
comparison that decided to open the dialog, so the panel cannot disagree with the test behind it.)*
**Build this before WO-5.8**: several recipients change what "changing the recipient" means, and
that work order extends this rule rather than inventing a second one.

**Where this stands.** ✅ on 2026-08-29: all five Acceptance lines closed, **no 👤 and no 📆**. It is
`src/outreach-view.js` and one new overlay in `index.html`; **no stylesheet was opened**, because
every control in the panel is a component `src/shell.css` already owns. `tools/verify/outreach.mjs`
gained eleven checks *inside* § *"the send flow (WO-5.3)"* rather than a section of its own — a
confirm dialog over a surface that already has a section and a fixture is not a new surface. Both
tools green on the delivered tree: `verify-shell.mjs` at
`1263 checks · 1263 passed · 0 failed · 0 skipped`, 37,943 lines, 421s, exit 0, and `wo-sweep.mjs`
at `34 checks · 31 passed · 0 failed · 3 to review`, all three reviews pre-existing.
`TESTING.md` § WO-5.6 carries the readings.

**The mutation round is one line and it reddens ten, four of them WO-5.3's.** `draftEdited()` cut to
`return false` — the app never asks, which is the behaviour this work order exists to end — reads
`1263 checks · 1253 passed · 10 failed`, exit 1. **The four are the point**: two of WO-5.3's own
checks now drive a control over a draft they have just typed into, so they go through a helper that
answers the confirm — and that helper hands back *whether the dialog appeared*, which both callers
assert, so a build that stopped asking is caught by the thing added to accommodate the asking rather
than swallowed by it. *(A sixth new check was red on the first run of the delivered tree and was
right to be: its setup tapped the tone pill the flow was already on, every one of the three doors
returns early on a value it already holds, so no panel opened and it measured* **0 controls, 0 of
them under 44px** *— a clean pass over an empty set, which is `tools/README.md`'s own first CDP trap.
It asserts the panel is open now.)*

**Four things it decided that this work order did not.**

- **The test is a comparison and the state that makes it one is written in exactly one place.**
  `resolved` is set by `buildDraft()`, which is the one resolve, and by nothing else; `draftEdited()`
  is the only reader. A keystroke flag was the obvious alternative and fails the fourth Acceptance
  line by construction. It is a **separate object** rather than a second reference to `draft`,
  because `editOutreachField()` writes into `draft` and a shared object would leave every draft
  eternally unedited — the comparison would be a string against itself.
- **The three doors are now `set…` / `apply…` pairs, and that split is the fix rather than
  tidiness.** All three used to mutate module state and then call `buildDraft()`, so there was no
  moment at which the change had been proposed and not yet made, and a cancel would have had to put
  four things back by hand. Now nothing moves until the draft turns out to be untouched or the
  teacher presses the button, and *cancel* is the absence of a call.
- **The dialog names nobody, and presentation mode closes it.** The recipient case is written in
  terms of the chip's **position** — *"Writing to Guardian 1 instead…"* — and never the person on
  the line below it, who is a named guardian with an address beside her; and the ask goes down with
  the form when the projector comes on. A dialog stacked over a panel that has just emptied itself
  is the one thing on this screen the mode could otherwise leave on the glass, which is the shape of
  the disclosure WO-5.3's own mutation round found. Both are asserted.
- **Escape and the ✕ are left to `src/modal.js`.** Neither comes through this module and neither
  needs to: the screen behind the dialog is put back **at the moment the question is asked**, so a
  dismissal already lands on the correct state. What they leave behind is a proposal nothing reads —
  the only reader is the button inside the panel they just closed — which is the same inert corpse
  `src/assignments.js`'s copy and delete confirms leave, for the same reason.

**And one sentence it rewrote in all three places rather than in none.** Every rebuild used to end
its status line *"Anything you had typed is gone."* A rebuild is now either one she agreed to or one
that cost her nothing, so the line says which; the same sentence for both would leave the silent
case sounding like a near miss.

---

## WO-5.7 — Copy the draft to the clipboard

**Ship** — · **Status** ✅ DONE — 2026-09-12 · **Size** S · **Depends on** WO-5.3

**Why it exists.** `mailto:` opens the machine's **default** mail client, and a teacher whose real
mail is Gmail in a browser tab has no default worth opening. She can see a finished draft on screen
and no way to get it into the window where she actually writes email. The owner, 2026-08-29: *"A
'copy' button would be helpful… so someone using GMail could move it there since the button doesn't
open gmail."*

**It is not a workaround for a missing feature — it is the second honest door.** Sending as the
teacher would need a mail scope, which the architecture forbids for a reason that has not changed:
the consent screen reads "Send email as you." Between "open your desktop client" and "grant us your
mailbox" there is a third option costing no permission at all, which is to hand her the text.
*(Whether the app ever sends mail itself is a* **v2.0** *question, and the owner named it as one on
that day rather than leaving it implied.)*

**Deliverables**
- A control beside the handoff link that copies the recipient line, the subject and the body as one
  block of plain text, in a shape that pastes usefully into a compose window.
- It is subject to the same gate as the handoff: a blocked draft copies nothing, for the same reason
  it cannot be sent, and a projected screen copies nothing at all.
- It says it worked. A copy button that looks identical before and after is a button people press
  four times.

**Acceptance**
- [x] 👤 The copied text carries the recipient, the subject and the body, and pastes into a compose
      window as readable text with its paragraph breaks intact. *(**Read on hardware by the owner
      2026-09-12** — the iPad Mail paste and the laptop Gmail paste both arrived with headers, one
      blank line and the paragraphs intact; "it works great on iPad." **The mark was added when the row
      was built**, 2026-09-12, rather than being on it when it was written — WO-5.3's first line,
      same shape, same reason: the second half of this sentence ends outside the app, in somebody
      else's compose window. What the harness closes is everything up to that edge, and it closes it
      character for character: the block the app hands `navigator.clipboard.writeText` is compared
      against a string built from fixture literals, the clipboard is read back, and both halves of
      the line ending are asserted — no `\r` anywhere, three blank lines where three were typed.
      What it cannot do is paste. **The mutation round is why this is two readings and not one**:
      with the body normalised to CRLF — the `mailto:` answer applied at the wrong door, which is
      WO-5.3's own mangled-paragraph defect arriving here — the spy on the write went red and the
      read-back went GREEN, because the platform normalises a clipboard's line endings away on the
      way out. A check that only read the clipboard back would have passed over it.)*
- [x] A blocked draft cannot be copied, and presentation mode disables the control with the rest of
      the flow. *(Asked three ways, because a button is not a link and the refusal had to be
      re-decided: the model has nothing to copy — `clipboard` is empty on exactly the drafts `url`
      is empty on — the control is `disabled`, which is a button's structural equivalent of the
      handoff's missing `href`, so a click dispatched at it raises no event at all and the spy on
      the clipboard stays empty; and `copyDraft()` called **directly, past the markup** still
      refuses, because both ends read one `outreachModel()`. Under a projector the same three hold,
      the label goes back to its resting word rather than standing at *Copied* over an emptied
      panel, and no student, guardian or address is left anywhere in the modal.)*
- [x] The teacher is told the copy happened, through `announce()` as well as on screen. *(Three
      channels asserted together: the status line under the actions, no longer `.hidden`; the
      button's own label, which moves off *Copy the draft* — WO-5.7's third Deliverable in as many
      words; and the live region. **None of the three names a student, a guardian or an address**,
      which is asserted rather than assumed.)*
- [x] Copying writes nothing to the document. *(Both halves. The fixture half: `rev`, `log[]`,
      `templates[]` and `localStorage` are unmoved across two real copies, a blocked one, a refusal,
      a projector cycle and every keystroke between them — flushed first, because `update()` only
      schedules a save. The structural half is `tools/wo-sweep.mjs` § **24**, in § 17's shape:
      `src/outreach.js` imports neither the store nor the log and holds no writer of any kind, and
      `copyDraft()` — whose own file legitimately DOES write, through `recordHandoff()` — reaches
      none. **Mutation-proved on both**: a real `writeContact()` in the copy's success path reddens
      the fixture check at `rev 297 → 299, log 0 → 2` and three downstream checks in
      `verify/contact-log.mjs`, and the same line reddens § 24 by name.)*
- [x] The control clears 44px under a coarse pointer at 390px. *(Measured in the send flow's
      existing touch pass rather than in a block of its own, because it stands in that panel's
      `.modal-actions` row — and what a third control costs is a property of the ROW: fifteen
      controls, none under 44px, **no sideways scroll**, with the copy asserted to be IN the
      measured set by its own id rather than counted. That conjunct is the one this work order could
      break: `.class-action-btn` is `white-space: nowrap` and three of them do not fit 390px, which
      is why `#outreachModal .modal-actions` gained a `flex-wrap`.)*

**Traps** — `navigator.clipboard` needs a secure context and is refused without a user gesture. The
app is HTTPS everywhere so the first half is satisfied, but a copy fired from anything other than
the tap itself fails on iOS. Do not fall back to a hidden `<textarea>` and `execCommand` without
saying so at the point of departure — it is deprecated, and this repo has no polyfills.

**What it decided, 2026-09-12.**

**The refusal is `disabled`, and that is the one thing this work order had to invent.** The handoff
beside it refuses by having no `href` at all — not a link, not focusable, not clickable — and a
button cannot inherit that, because a button with no attributes is still a button. `disabled` is the
same *kind* of answer rather than a weaker one: the browser refuses the event. It also cost no
stylesheet, because `.class-action-btn:disabled` was already the same dimming
`a.class-action-btn[aria-disabled="true"]` wears, so the two controls in that row refuse in the same
pixels. And `copyDraft()` asks the model anyway — `recordHandoff()`'s posture, in its own words.

**There is no `execCommand` fallback, and the Traps line permitted one.** Three parts: the API needs
a secure context and this app has one everywhere it runs, including the harness's `127.0.0.1`; every
browser it supports has had `writeText` for years, iPad Safari from 13.4; and a hidden `<textarea>`
plus a deprecated call is a polyfill, in a repository whose first architectural rule is that it has
none. **So a browser without the API gets a sentence** — in the status line and through `announce()`
— rather than a silent no-op or a second mechanism, and the control stays live so that `disabled`
keeps meaning exactly one thing.

**The acknowledgement is the status line's own sentence and nothing else is remembered.** The
button's label is drawn from a comparison against that one string, so every other act in the flow
clears it by doing what it already did — writing over `status`. A keystroke blanks it, which is
deliberate: a draft edited after a copy is a draft the clipboard no longer holds, and a button still
reading *Copied* over it would be lying about the clipboard rather than about the draft.

**The line ending is LF here and CRLF at the `mailto:`, and that is a departure with a reason.**
RFC 6068 § 5 wants `%0D%0A`; the clipboard's `text/plain` flavour takes LF and the platform puts its
own ending back — Chromium writes CRLF onto the Windows clipboard itself. Handing it CRLF as well is
how a bare `\r` reaches a compose window that draws it as a second break. Argued at `draftText()`.

**⚠ ONE OPEN EDGE, STATED RATHER THAN CLAIMED AWAY.** Presentation mode empties this panel and
disables this control, and it cannot reach a draft copied a minute earlier: the clipboard is the
operating system's, and a paste into any other window still produces a named student's business.
Nothing in a browser can undo that. It is written down at `src/outreach-view.js`'s own point of
departure rather than left to imply that the mode covers it.

**And one thing found while reading, not fixed here, because it is not this work order's:**
`renderOutreach()`'s presentation-mode branch empties the two boxes, both pickers, three hint lines
and the block strip, and **does not clear `#outreachStatus`** — which can be holding
*"…rebuilt for Wo53Guardian One"* or *"Handed to your mail app and logged on Ada Wo53Full's
record."* The element is inside the `.hidden` form, and this flow's own rule is that hidden is not a
redaction. WO-5.7's own sentence names nobody by construction and is asserted to, so nothing here
deepens it. Booking the repair is the owner's call.

---

## WO-5.8 — Several recipients, and one of them is primary

**Ship** — · **Status** ⬜ NOT STARTED · **Size** L · **Depends on** WO-5.3, WO-5.6

**Why it exists.** One message often goes to more than one person — both guardians, or a guardian
and the counselor — and today that is one draft written twice. The owner, 2026-08-29: *"You should
be able to select more than one 'recipient' and all templates should be available regardless of
recipient. One should be 'primary.'"*

**⚠ THIS REVERSES A VERIFIED ACCEPTANCE LINE, and it is the owner's call rather than a correction.**
WO-5.3's seventh line — proved, mutation-tested, and inherited from WO-5.2's first — reads templates
through `templatesFor(doc, tone, audience)` **with both arguments, never audience alone**, so that a
guardian's concern template is not offered for a praise draft. **The tone half is untouched and must
stay.** The audience half is what is being reversed: templates become available whatever the
recipients are, because a message to both guardians and the counselor has no single audience to
filter on. Whoever builds this amends that line where it stands rather than leaving two documents
disagreeing — and `{{guardian.name}}` then has to resolve against *somebody*, which is what
`primary` is for.

**Deliverables**
- Several recipients selectable at once from the list WO-5.3 already builds, with one marked
  **primary**.
- The primary is who the merge fields resolve against and who the message is addressed to; the rest
  ride as additional recipients. **Which header they ride in is a decision this work order owes an
  argument for** — a guardian who can see the counselor's address is a different thing from one who
  cannot, and that is a disclosure question rather than a formatting one.
- All templates offered regardless of recipient; tone filtering unchanged.
- WO-5.3's Acceptance line 7 amended in place, in the same sitting, with the reversal recorded.

**Acceptance**
- [ ] Two guardians and a counselor can be chosen for one draft, with exactly one primary at all
      times, and the primary changeable without losing the selection.
- [ ] `{{guardian.name}}` and every other merge field resolve against the primary, and the draft
      says who that is.
- [ ] Every saved template is offered whatever the recipients are; a concern template is still never
      offered for a praise draft.
- [ ] The `mailto:` URL carries every chosen recipient, and copy-to-self behaves as WO-5.3 proved.
- [ ] A recipient with no address on file cannot be chosen, and says why — WO-5.3's rule, unchanged.
- [ ] Changing the recipients obeys WO-5.6's confirm rather than a second rule of its own.
- [ ] WO-5.3's seventh Acceptance line and `TESTING.md` § WO-5.3 both record the reversal.

**Traps** — The accommodation fence does not move: the picker still reads `students[].counselor` and
never `supports.caseManager`, and `AUDIENCES` is not widened to make a recipient list work. The
`mailto:` ceiling is measured on the whole encoded URL, so several addresses eat into the same 2,000
characters the body does.

---

## WO-5.9 — The hitless draft is written but never driven

**Ship** — · **Status** ✅ DONE — 2026-08-30 · **Size** S · **Depends on** WO-5.4

**Why it exists.** `recordHandoff()` writes `ruleId: hit ? hit.ruleId : ''`, and **the harness has
never walked the false branch.** Both contacts `tools/verify/contact-log.mjs` writes are Ada's, and
Ada trips two concern rules, so `hit` is truthy every time it is read. The branch is reachable in
the real app and not rarely: the student record's door opens the outreach flow for **any** student,
including one no rule has fired for, so a teacher writing home about a child nothing flagged takes
this path on her first use of the feature.

**The half that is proved, and why it is not the same half.** `tools/verify/cooldown-quiet.mjs`
already checks that a `contact` with no `ruleId` silences nothing — but it runs off a **planted**
record the fixture hand-writes. That proves the READER tolerates absence. Nothing anywhere proves
the WRITER produces it. The two halves of one contract are each tested against a hand-made
counterpart and have never been introduced to each other, which is the shape of gap that survives
a green run indefinitely.

**Two regressions that pass the harness as it stands**, failing in opposite directions — which is
why this is worth an hour rather than a note:

- **The guard is dropped** — `ruleId: hit.ruleId`. `hitFor()` returns `orderHits(...)[0] || null`,
  so this throws a `TypeError` inside the click handler. The handler deliberately calls no
  `preventDefault()`, so **the browser follows the `mailto:` anyway**: the mail app opens, the
  teacher writes and sends, and nothing is logged. Silent loss on the path where she is least likely
  to check, because she saw the draft open and has no reason to think anything failed.
- **The gap is filled** — a fallback to a hit in the other direction, or a literal like `'manual'`.
  Now `lastContactAbout()` matches it and **silences a signal nobody ever wrote about**. That is the
  exact inverse of the mutation WO-5.4's dead dispatch left behind, and it is what the under-fire
  posture at the foot of `src/log.js` exists to prevent: praise not sent is a missed opportunity, a
  rule silenced by a message that was never about it is how a teacher stops trusting the list.

**Deliverables**
- One check in `tools/verify/contact-log.mjs` that drives a handoff for a student **no rule has
  fired for**, opened through the student record's door — there is no signal card for her, which is
  the point.
- It asserts three things together: exactly one entry is appended (so the writer did not throw),
  its `ruleId` is `''` — **empty, not `undefined`, and not invented** — and a signals pass over the
  document afterwards suppresses nothing for her. The third conjunct is the one that matters: it
  closes the loop from writer to reader on a record **the app itself wrote**, which is what
  `cooldown-quiet.mjs` structurally cannot do.
- The second, smaller hole in the same sitting: Acceptance line 1's *immediate, no reload* property
  is asserted on the signal-card path only. A handoff made **from the student record** has its
  repaint reached but not asserted.

**Acceptance**
- [x] A handoff for a student with no hit in either direction appends exactly one entry, and its
      `ruleId` is the empty string. *(A third student — Ben plus one guardian with an address, so
      the draft becomes ready — driven through the student record's own door. The engine fired* `[]`
      *for her at the tap, the draft opened* ready *on the* concern *tone, one entry was written
      (*`rev 278 → 279`*), and the id is asserted as an* **own property**, `typeof === 'string'`
      *and* `=== ''`*, so absent, undefined and invented fail differently.)*
- [x] That contact suppresses nothing on a following signals pass — proved against a record the app
      wrote, not a planted one. *(The concern list is identical either side of the write —*
      `{"rows":1,"drawn":1,"held":1,"hers":0,"hersHeld":0}` *— with* `held > 0` *asserted so the
      claim is made about a list that is suppressing something. And* `lastContactAbout()` *is asked
      with the id the WRITER produced and hands back* `null`*: the loop*
      `cooldown-quiet.mjs` *cannot close, closed.)*
- [x] Both new claims are mutation-proved: restoring `hit.ruleId` without the guard, and inventing a
      rule id in the else branch, each turn a named check red. *(Two real runs.* **Guard dropped**:
      `1284 checks · 1282 passed · 2 failed`*, exit 1 — the handler throws, both new checks redden,
      and* `pressed.had` *is still true, which is the silent loss in one reading.* **Id invented**
      (`'manual'`): `1284 checks · 1283 passed · 1 failed`*, exit 1 — both conjuncts catch it, and
      the one that names the cost is the READER:* `{"on":"2026-08-30","audience":"guardian"}` *where
      a correct build hands back* `null`*. Each
      was reverted by hand the moment it went red, and* `grep -rn MUTATION` *was run over the tree
      after the second revert.)*
- [x] A handoff made from the student record shows in that screen's history immediately, without a
      reload. *(One row on the card, the empty sentence gone, the record still open on her — and a
      mark set on* `window` *before the press still there after it, which is the only thing here
      that can tell a repaint from a reload.)*

**Traps** — **The fixture's second student is already the right student and cannot be used as he
stands.** Ben exists in `contact-log.mjs` solely so the empty-history sentence can be compared
character for character against a suppressed one, and writing a contact for him populates his
history and reddens that check. Run the new check strictly after the empty-sentence check, or give
the fixture a third student — and say which, at the point of departure, because a harness that goes
red for a reason that looks unrelated costs an hour of confusion.

Second: **do not reach for the signal card to open this draft.** No rule fired, so there is no card;
the record's door is the only way in and is itself the thing under test. `src/shell.js`'s door there
threw a `ReferenceError` once already — `signals.evaluate(getDoc(), …)` against a `getDoc` that file
does not import — and a check that asked the model instead of driving the screen would have walked
straight past it (`TESTING.md` § WO-5.3).

Third: this adds a check to `tools/verify/contact-log.mjs`, so `tools/README.md`'s `check()`
call-site count moves and `wo-sweep.mjs` compares against it. Update the count in the same sitting —
the WO-3.26 scar, where a green tree turned the sweep red on work being *done*.

*(**All three held.** The fixture took a **third student** rather than running after the empty
sentence, and the reason is written at the point of departure in `tools/verify/contact-log.mjs`
together with a second one the Traps line does not name: three checks above it count contacts
rather than name them — `entries === 2`, `inDoc === 2` — so the block runs last regardless of which
student it uses, and a contact written earlier would move numbers belonging to other claims. Her id
keeps the `s_wo54` prefix because the section's cleanup sweeps by exactly that string. The draft is
opened by clicking the record's own button, never through the seam. And the count moved 1267 → 1269
in the same sitting, with a paragraph beside it —* **which also records that 1267 arrived with
WO-5.4's seventeen sites and no paragraph at all**, *the same bookkeeping a dead dispatch lost at
WO-5.1.)*

**Where this stands.** ✅ on 2026-08-30, all four Acceptance lines closed — **no 👤 and no 📆**, and
nothing here could want either: the work order writes no app code, adds no control and opens no
stylesheet. `verify-shell.mjs` `1284 checks · 1284 passed · 0 failed · 0 skipped`, 38,923 lines,
429s, exit 0 (before-run on the same machine: `1282 · 1282 · 0 · 0`, 38,751 lines, 429s);
`wo-sweep.mjs` `34 checks · 31 passed · 0 failed · 3 to review`, all three reviews pre-existing and
byte-identical to the before-run's. `TESTING.md` § WO-5.9 carries the readings and both mutation
runs.

## WO-5.10 — The status line is the one field the projector does not empty

**Ship** — · **Status** ⬜ NOT STARTED · **Size** XS · **Depends on** WO-5.7

**Why it exists.** `paintOutreach()`'s blocked branch empties the subject, the body, the *To* line,
its note, the chips, the template options and the reasons list, in as many words: *"emptied rather
than hidden … `display: none` is not a redaction."* Then it returns, and **the status line is drawn
after the return, from `model.status`, which `outreachModel()` puts on `base` before it asks whether
the projector is on.** Two of the sentences that variable can hold name a person: *"The draft was
rebuilt for Wo53Guardian One…"* (`setOutreachRecipient()`) and *"Handed to your mail app and logged
on Ada …'s record"* (`recordHandoff()`). So a teacher who switches recipient, or hands a draft off,
and then flips the projector has a guardian's name or a child's sitting inside the `.hidden` form —
`display: none`, exactly the thing the flow's own rule says is not a redaction.

**It is a breach of the rule and not a live disclosure, and both halves of that sentence matter.**
Nothing is on the glass today; `#outreachStatus` is inside `#outreachForm`, which the same paint
hides. But the rule exists because a hidden element is one CSS regression, one `hidden` class
dropped by a later work order, or one *Inspect element* under a projector from being read — and
WO-5.3's mutation round found the shape once already, a confirm dialog left standing over a form
that had just emptied itself. **Found by WO-5.7's implementer, confirmed by its verifier against
`git show HEAD:src/outreach-view.js`, and deliberately not fixed there**: the fix is one line, but
it is a line in the presentation-mode branch of a sensitive surface, and WO-5.7 was about a
clipboard.

**Why the harness is green over it.** `tools/verify/outreach.mjs`'s projector check reads
`#outreachModal.textContent` — which *does* include hidden text — and asserts no guardian's name is
in it. It passes because of **ordering**: the fixture flips the projector before it has ever
switched a recipient or handed anything off, so `status` is `''` when the flip lands and the check
never sees the sentence it would catch. The check is right; the fixture cannot make it fire.

**Deliverables**
- `outreachModel()` returns `status: ''` when `blocked` — on `base`, beside `clipboard: ''`, for the
  reason written there: the projected model has nothing to draw rather than a paint declining to
  draw it. **The model, not the paint**: the paint draws `model.status` and must keep doing so, or the
  status line becomes the one field with two opinions about the projector.
- A check in `tools/verify/outreach.mjs` that **switches recipient first, then flips the projector**,
  and asserts `#outreachStatus` is empty and `#outreachModal.textContent` carries no guardian's name.
  The existing projector check is left as it is — it is a different fixture and it already passes
  for an honest reason.
- `tools/README.md`'s `check()` count moves; update it in the same sitting (the WO-3.26 scar).

**Acceptance**
- [ ] With a recipient switched and the rebuilt note on screen, flipping the projector leaves
      `#outreachStatus` empty and no guardian's name anywhere in `#outreachModal.textContent`, hidden
      or not.
- [ ] Flipping the projector back does not resurrect the sentence: the status line stays empty until
      the teacher does something that writes a new one.
- [ ] The mutation — `status: status` restored on `base` — turns the new check red and leaves the
      existing projector check green, which is the proof that the new fixture reaches what the old
      one cannot.

**Traps** — **Do not clear the module variable from inside the paint.** `status = ''` in
`paintOutreach()`'s blocked branch would pass the first two Acceptance lines and put a writer of flow
state inside a function whose contract is to draw a model; every other status write in the file is
in a handler, and `resetOutreach()` is the one place the paint's caller clears it. **And do not widen
into `announce()`.** `setOutreachRecipient()` announces *"Writing to Wo53Guardian One."* to the live
region — that is a screen reader, not a projector, and the same reasoning that keeps a `note`
visible under presentation mode (`CLAUDE.md` § Accommodations) applies: the teacher at the keyboard
is not the audience the mode protects against. Leave it.

## WO-5.11 — A web mail handler takes the PWA window with it

**Ship** — · **Status** ⬜ NOT STARTED · **Size** XS · **Depends on** WO-5.7

**Why it exists.** `#outreachOpen` is a plain `<a href="mailto:…">` with no `target`, and
`src/outreach-view.js`'s header gives three reasons it is a link and not a scripted navigation —
the second being that *iOS opens a `mailto:` link more reliably than a scripted navigation*. All
three hold. What none of them considered is a **web** handler for the scheme. On 2026-09-12 the
owner registered Gmail as Chrome's `mailto:` handler on the laptop (the setting is per browser
profile and Gmail had never been allowed to ask), clicked *Open in my mail app* from the installed
PWA, and the app window **navigated** to `mail.google.com/mail/?extsrc=mailto&url=…` — Gmail's
bare compose-only page, outside the app's scope, no address bar, Planbook gone from under it. The
owner's words: *"it opens it in a broken email window within the PWA."* With an OS client the
scheme never touches the window, which is why WO-5.3's two hardware readings did not see this.

**The fix is one attribute** — `target="_blank" rel="noopener"` on the anchor. A web handler then
opens in a real browser tab, with To, Subject and body filled, and the PWA stays on the draft. An
OS handler ignores `target` entirely, so Outlook and Mail on the desktop see no change. **The whole
cost is the iPad**: Safari has a history of leaving an empty tab or window behind for a `mailto:`
carrying `_blank`, and the iPad is the device that decides go-live. If it does that here, this work
order reverses itself and says so — an honest outcome, not a failure of the reading.

**It is a work order rather than a line typed in the moment for two reasons.** The 👤 reading above
is the whole of it; nothing on a desk can take it. And the contact-log listener in `src/shell.js`
rides this anchor's click, WO-5.9's mutation round proved the browser follows the `href` even when
that listener throws, and `tools/verify/outreach.mjs` asserts the `href` — a new attribute on the
same element needs a check beside those so a later hand cannot strip it back to the shape that
looked complete for two weeks.

**Deliverables**
- `target="_blank" rel="noopener"` on `#outreachOpen` in `index.html`, present whether or not the
  draft is ready — an anchor with no `href` is not a link and the attributes do nothing on it.
- The three-reason comment in `src/outreach-view.js`'s header gains a fourth, at the point of
  departure: what a web handler does to a same-window `mailto:`, and why `_blank` is safe for an OS
  handler.
- A check in `tools/verify/outreach.mjs` beside the `href` check, asserting `target === '_blank'`
  and `rel` containing `noopener` on the ready draft; `tools/README.md`'s count moves with it.
- `CACHE` bumped in `sw.js` — `index.html` is in `SHELL`.

**Acceptance**
- [ ] 👤 On the laptop, with mail.google.com registered as Chrome's `mailto:` handler, *Open in my
      mail app* from the **installed** PWA opens a Gmail compose in a browser tab with recipient,
      subject and body filled, and the PWA window is still showing the draft.
- [ ] 👤 On the iPad, the same tap opens Mail with the draft filled and leaves **no blank tab and no
      blank window** behind, in Safari or in the installed app. **This is the line that decides
      it** — if it fails, the attribute comes out and the failure is written at the point of
      departure.
- [ ] The contact-log entry is still written on the click: the existing check in
      `tools/verify/contact-log.mjs` passes unchanged.
- [ ] A blocked draft is still not a link — no `href` — and the new check asserts the attributes
      only on a ready one.
- [ ] The mutation — the attribute removed — turns exactly the new check red.

**Traps** — **Do not reach for `window.open()` or a click handler that assigns `location`.** The
header's second reason is the one that bites: a scripted navigation on iOS is what the anchor exists
to avoid, and `preventDefault()` on this click is what WO-5.4's listener deliberately never calls.
The attribute keeps the browser's own navigation and changes only where it lands. **`rel="noopener"`
is not optional** — without it the new tab holds a `window.opener` onto a page carrying a student's
draft. **And nothing here detects the handler, offers to register Gmail, or explains a Chrome
settings page.** The app cannot see a browser's protocol-handler table, and the webmail teacher's
documented door is WO-5.7's *Copy the draft*; this work order only stops the other door taking the
app with it.
