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

**Ship** — · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** WO-5.3

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
- [ ] Opening a starter in the editor states that it must be saved before a draft can use it.
- [ ] A draft with an unresolved field heads its strip *This draft has at least one undefined field*
      and says, in words, that removing the field or typing over it will unblock the draft.
- [ ] The resolver's own per-field sentences are unchanged — this work order adds a sentence and
      rewrites a heading, and touches `src/merge-fields.js` not at all.
- [ ] Neither new sentence names a student, so presentation mode is unaffected.

**Traps** — The block strip is drawn by two screens (`src/templates-view.js`'s preview and
`src/outreach-view.js`) over one shared section, § UNRESOLVED in `src/shell.css`. A heading changed
in one and not the other is this phase's own "two askers" defect. Change it once.

---

## WO-5.6 — A draft survives a change of mind

**Ship** — · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** WO-5.3

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
- [ ] Typing in the body, then changing the template, asks before rebuilding; cancelling leaves the
      typed text exactly as it was.
- [ ] Confirming rebuilds the draft from the new template, as today.
- [ ] An untouched draft rebuilds with no prompt at all, on all three controls.
- [ ] Typing a character and removing it again counts as untouched.
- [ ] The document is not written at any point — this flow still holds `rev` still, per WO-5.3.

**Traps** — The subject and the body are two boxes and either can be edited; a confirm that watches
only the body loses a rewritten subject silently, which is the same bug one field further along.
**Build this before WO-5.8**: several recipients change what "changing the recipient" means, and
that work order extends this rule rather than inventing a second one.

---

## WO-5.7 — Copy the draft to the clipboard

**Ship** — · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** WO-5.3

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
- [ ] The copied text carries the recipient, the subject and the body, and pastes into a compose
      window as readable text with its paragraph breaks intact.
- [ ] A blocked draft cannot be copied, and presentation mode disables the control with the rest of
      the flow.
- [ ] The teacher is told the copy happened, through `announce()` as well as on screen.
- [ ] Copying writes nothing to the document.
- [ ] The control clears 44px under a coarse pointer at 390px.

**Traps** — `navigator.clipboard` needs a secure context and is refused without a user gesture. The
app is HTTPS everywhere so the first half is satisfied, but a copy fired from anything other than
the tap itself fails on iOS. Do not fall back to a hidden `<textarea>` and `execCommand` without
saying so at the point of departure — it is deprecated, and this repo has no polyfills.

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
