/*
  The send flow — the audience picker, the draft, and the two ways it leaves: the handoff to the
  teacher's own mail client (WO-5.3) and the copy to her clipboard (WO-5.7).

  ── WHAT THIS FILE IS, AND THE THREE IT IS NOT ──

  It is the SCREEN over src/outreach.js, the same split src/templates-view.js makes with
  src/templates.js: that file owns who a recipient is, what a `mailto:` URL is, how long one may be
  and what the same draft reads like as plain text; this one owns the pixels, the order things
  happen in, and the two controls that hand the draft over. **The second one is a control and not a
  second draft** — both doors are built from one `outreachModel()`, past one gate, out of the same
  four fields, so nothing on this screen can offer to copy a message it would refuse to send.

  IT IS NOT A RESOLVER. `{{field}}` becomes text in exactly one place — src/merge-fields.js — and
  this file asks `resolveDraft()` for a whole draft and puts what comes back in a box. Nothing here
  splits a token, indexes anything by one, or reads a property named after one.

  IT IS NOT A SECOND OPINION ABOUT WHY A FIELD FAILED. Every sentence in the block strip about a
  merge field is the `message` the resolver built, printed as it was handed over. What this file
  adds to that list are the two reasons the resolver knows nothing about — a recipient with no
  address on the roster, and no template chosen — and they are different sentences about different
  objects rather than a re-diagnosis of the same one.

  IT WRITES ONE THING, ON ONE GESTURE, AND WROTE NOTHING AT ALL UNTIL WO-5.4. Drafting is still a
  read: picking a recipient, switching the tone, typing in either box, cycling the projector and
  changing your mind about a rebuild leave the document byte-identical, and the harness asserts that
  on `rev` across the whole of it. **What writes is the handoff** — recordHandoff() below, on the
  click that opens the mail app — and what it writes is one `contact` in `log[]` through
  src/log.js's writeContact(): the audience, the subject, the body and the `ruleId` the cooldown
  keys on. This file holds no `update()` of its own and knows nothing about the shape of a log
  entry; the split is src/log-sheet.js's with the sheet it draws.

  **AND COPYING IS STILL A READ (WO-5.7).** The second door writes nothing — not a log entry, not a
  preference, not a byte of the document — and that is the deliberate half of it rather than an
  omission. The handoff logs because a `mailto:` is the moment a message leaves the building and the
  cooldown keys on it; a copy is a string on a clipboard, which may be pasted into a mail window, a
  notes app, or nothing at all. **Planbook cannot tell, and a `contact` entry written on a copy
  would be the app recording an outreach that may never have happened** — which is the one thing
  src/log.js's append-only rule makes impossible to take back. The `rev` assertions in
  tools/verify/outreach.mjs are asserted across the copy for that reason, and tools/wo-sweep.mjs
  § 24 asserts the same thing from the other side.

  ── A MODAL, AND IT OPENS OVER THE CARD RATHER THAN REPLACING IT ──

  plans/gradebook-surfaces.md's test, applied rather than re-argued: a surface a teacher works in is
  a view, and a task she finishes and dismisses is a modal. Drafting one message is a task. Opened
  from the signal card it is a modal over a modal, which src/modal.js supports by construction — the
  stack is built at open time, Escape closes the top-most, and focus returns to the button that
  opened it, so dismissing the draft puts her back on the card she was reading.

  ── PRESENTATION MODE CLOSES THIS FLOW OUTRIGHT, AND THAT IS src/signals-view.js's RULE ──

  Not src/templates-view.js's. That screen suppresses ONE COLUMN because the list, the editor and
  the palette are the teacher's own writing and name nobody, while only the preview names a child.
  **There is no such column here.** The title names the student, the picker names her guardians, the
  subject and the body are about her, and the recipient line carries her guardian's email address —
  every part of this modal is one child's business, which is the shape the concern list is in and
  the reason that screen closes rather than filters.

  So while the mode is on: the form is not drawn, nothing is resolved, and **the fields are emptied
  rather than merely hidden** — src/supports.js's sensitiveValue() rule, in src/templates-view.js's
  own words: an element with `display: none` is still an element a screenshot tool, a find-in-page
  or an accessibility tree can reach, and a guardian's address is not a thing to leave sitting in a
  hidden control on a screen that is facing a room. What stays is one sentence naming the control
  that undoes it, which is what WO-4.2 shipped and what makes a refusal something other than a bug.

  ── WHAT IS HELD HERE, AND WHY NONE OF IT IS REMEMBERED ──

  Which student the draft is about, which tone, which recipient, which template, the draft itself,
  whether it copies the teacher, and one status sentence. Not one of them reaches localStorage —
  src/signals-view.js's and src/templates-view.js's ruling, and their reason: a remembered choice is
  a choice made by nobody the teacher can remember. Every arrival starts from the row she tapped.

  ── THE DRAFT IS RESOLVED ONCE PER CHOICE, AND EDITED FROM THERE ──

  `resolveDraft()` runs when the template, the recipient or the tone changes, and NOT on every
  keystroke. After that the text in the box is the teacher's, exactly as she left it, and the thing
  that is handed to her mail client is the text she is looking at — a flow that re-resolved her
  edits would either overwrite what she typed or report a field as resolved while a literal
  `{{grade.percent}}` sat in the body on its way out.

  What the block strip watches after that is `tokensLeftIn()` (src/outreach.js): arithmetic over the
  string, no lookup of any kind. A token still on the page blocks the handoff, and a token she has
  typed over does not — which is the resolver's own sentence, *"cannot be sent until it is corrected
  or removed"*, honoured at the end that can see the correction.

  ── AND A REBUILD ASKS FIRST WHEN THERE IS SOMETHING TO LOSE (WO-5.6) ──

  The paragraph above settles WHEN the resolve runs. It never settled what happens to work already
  done, and until 2026-08-29 the answer was: it goes, with no warning and no undo, and a status line
  afterwards saying so. That is the loss reported rather than prevented, and the owner's ruling is
  that the flow asks first — *"don't blank the template automatically on changing anything, put a
  confirm button up so work isn't lost."*

  THE TEST IS A COMPARISON, NOT A KEYSTROKE FLAG. `resolved` below holds what the last resolve put
  in the two boxes; `draft` holds what is in them now; and the draft counts as edited when they
  differ. So a word typed and deleted again leaves the draft UNEDITED and rebuilds in silence, where
  a flag set on the first keypress would have asked about a draft nobody had changed. **Both boxes
  are compared**, because a rewritten subject over an untouched body is an edited draft and a
  confirm that watched only the body would lose it silently.

  AN UNEDITED DRAFT STILL REBUILDS ON THE TAP, and that half is as deliberate as the other. A
  confirm on every tap of a tone pill while nothing has been typed is a dialog that teaches people
  to dismiss dialogs, and the tap after that is the one that destroys something.

  IT IS A REAL DIALOG AND NOT `window.confirm()` — src/classes.js § "delete, and what it costs" in
  as many words: *"OK to delete Period 3?" is a question a tired teacher answers yes to*. The panel
  names the change, lists which of the two boxes she has changed, and its confirm button says what
  it is about to rebuild rather than *OK*.

  ── THE HANDOFF IS A REAL LINK, AND THAT IS THE POINT OF DEPARTURE WORTH READING ──

  `#outreachOpen` is an `<a href="mailto:…">` wearing `.class-action-btn`, not a button that assigns
  `window.location`. Three reasons, in the order they bite:

    · **A blocked draft cannot reach the handoff, and with a link that is structural.** When the
      draft is blocked the anchor has no `href` at all — it is not focusable, not clickable and not
      a link, which is a stronger refusal than a disabled button and is the same posture the preview
      column takes when it returns before resolving.
    · **iOS opens a `mailto:` link more reliably than a scripted navigation**, which matters because
      the iPad is the device that decides go-live.
    · **The URL is readable.** What the operating system will receive is sitting in the DOM, so the
      percent-encoding WO-5.3's Traps line is about can be measured rather than promised.

  AND WO-5.4's WRITE RIDES THAT CLICK RATHER THAN REPLACING IT. The hook on the anchor is a plain
  delegated listener in src/shell.js: it appends the contact and returns, and **nothing anywhere
  calls preventDefault() on it** — the navigation stays the browser's, because the second bullet
  above is about the device that decides go-live and a scripted `window.location` on iOS is the
  thing it warns against. A log entry is not worth trading the handoff for.

  It also means the refusal is unchanged: a blocked draft's anchor has no `href`, so the click that
  writes cannot happen on it. recordHandoff() asks the model the same question paintOpen() asked
  when it decided whether to put the `href` there — one answer, computed twice from one function,
  rather than a listener that trusts the markup it is standing on.

  It is the app's third anchor — src/shell.css records the first two and the rule they set: a link
  standing on its own line is a thing you tap and takes the touch pass. This one wears a button's
  class, so it takes `.class-action-btn`'s 44px floor with it.
*/

import { getDoc } from './store.js';
import { getActiveClasses, getTerms, termName } from './classes.js';
import { fullName } from './roster.js';
import { announce } from './live-region.js';
import { openModal, closeModal } from './modal.js';
/* The switch, and only the switch — see this file's header for why it is this accessor and not the
   visibility rule beside it. src/templates-view.js and src/signals-view.js import the same one from
   the same place, so this is that switch rather than a second copy of it. */
import { presentationMode } from './supports.js';
/* The resolver. `resolveDraft` is the whole of what this file asks of it, and `blocked` is that
   module's whole say in the send — its header says so in as many words, and the button below is
   what reads it. Nothing else is imported from there and nothing here indexes by a token. */
import { resolveDraft } from './merge-fields.js';
/* The engine's own ranking, asked rather than re-decided: which of this student's signals leads is
   src/signals.js's answer, and the draft speaks from the same row the card put at the top. The
   engine itself is not imported and is never run here — the hits arrive with the row that was
   tapped, and re-running would answer about today rather than about that row. */
import { orderHits } from './signals.js';
/* The two sentences the strip says on both screens (WO-5.5). src/templates-view.js imports the
   same two from the same place, which is the whole of "change it once" — see that file's header
   for why the words are shared where the pixels already were, in src/shell.css § UNRESOLVED. */
import { UNDEFINED_FIELD_HEAD, FIELD_FIX_SENTENCE, blockHead } from './block-strip.js';
/* THE ONE WRITER THIS FLOW REACHES (WO-5.4), and the whole of what this file knows about `log[]`.
   It is handed five named fields and hands back the record it appended; the shape, the timestamp,
   the id and the append-only rule are all src/log.js's, exactly as they are for the sheet in
   src/log-sheet.js. Nothing else from that module is imported — no reader, no kind list — because
   this screen has no reason to read the log it writes to. */
import { writeContact } from './log.js';
import * as templates from './templates.js';
import * as outreach from './outreach.js';

const MODAL_ID = 'outreachModal';
const TITLE_ID = 'outreachTitle';
const SUB_ID = 'outreachSub';
const PROJECTING_ID = 'outreachProjecting';
const FORM_ID = 'outreachForm';
const TONES_ID = 'outreachTones';
const TO_ID = 'outreachRecipients';
const TO_NOTE_ID = 'outreachRecipientNote';
const TEMPLATE_ID = 'outreachTemplate';
const TEMPLATE_NOTE_ID = 'outreachTemplateNote';
const SUBJECT_ID = 'outreachSubject';
const BODY_ID = 'outreachBody';
const CC_ID = 'outreachCc';
const CC_NOTE_ID = 'outreachCcNote';
const BLOCK_ID = 'outreachBlock';
const LENGTH_ID = 'outreachLength';
const OPEN_ID = 'outreachOpen';
const COPY_ID = 'outreachCopy';
const STATUS_ID = 'outreachStatus';

/* ── THE COPY (WO-5.7), AND THE THREE THINGS ABOUT IT THAT ARE RULINGS ──

   WHY THERE IS A SECOND DOOR AT ALL. `mailto:` opens the machine's DEFAULT mail client, and a
   teacher whose real mail is Gmail in a browser tab has no default worth opening — she can see a
   finished draft and have no way into the window she actually writes email in (the owner,
   2026-08-29). It costs no permission, which is the point: the alternative to "open your desktop
   client" is not a mail scope, it is handing her the text.

   IT IS A `<button>` STANDING BESIDE A LINK, AND THE REFUSAL HAD TO BE RE-DECIDED. The handoff is
   refused STRUCTURALLY by having no `href` at all — not a link, not focusable, not clickable — and
   a button cannot inherit that mechanism because a button with no attributes is still a button. The
   structural equivalent is `disabled`, and it is the same kind of answer rather than a weaker one:
   the BROWSER refuses the event, so a blocked draft's copy control is not reachable by a tap, by a
   keyboard, or by a click dispatched at it. It costs no stylesheet either — `.class-action-btn
   :disabled` in src/shell.css is already the same dimming `a.class-action-btn[aria-disabled=true]`
   wears, so the two controls refuse in the same pixels. **And copyDraft() asks the model anyway**,
   which is recordHandoff()'s posture in as many words: "the markup says so" is not the kind of
   answer this app makes about a disclosure, and both ends read one outreachModel().

   THE ACKNOWLEDGEMENT IS THE STATUS LINE THIS FLOW ALREADY HAS, AND IT IS ALSO THE BUTTON'S LABEL.
   WO-5.7's third Deliverable: *a copy button that looks identical before and after is a button
   people press four times*. So the label is drawn from a comparison against the one sentence below,
   which means the acknowledgement is cleared by whatever the teacher does next WITHOUT a second
   flag to keep in step — every other act in this file writes over `status`, and a keystroke blanks
   it. That is deliberate: a draft edited after a copy is a draft the clipboard no longer holds, and
   a button still reading *Copied* over it would be lying about the clipboard rather than about the
   draft.

   THE OPEN EDGE, STATED RATHER THAN CLAIMED AWAY: **the clipboard is the operating system's and
   presentation mode cannot reach into it.** Turning the projector on empties this panel and
   disables this control, and it does nothing whatever to a draft copied a minute earlier — a paste
   into any other window still produces a named student's business. Nothing in a browser can undo
   that, and the honest thing is to write it down here rather than to imply the mode covers it. */
const COPIED_NOTE = 'Copied. The recipient, the subject and the message are on your clipboard as '
  + 'plain text — paste it into your mail and send it from there.';

/* The rebuild confirm (WO-5.6) — a second overlay, opened OVER this one when a rebuild would throw
   away something the teacher typed. src/modal.js stacks by construction, so it can sit three deep
   over the signal card without anything here knowing about the card. */
const CONFIRM_ID = 'outreachConfirmModal';
const CONFIRM_LEAD_ID = 'outreachConfirmLead';
const CONFIRM_FACTS_ID = 'outreachConfirmFacts';
const CONFIRM_BTN_ID = 'outreachConfirmBtn';

/* ── THE FLOW STATE ── */

/* Which student this draft is about, and the facts that came with the row it was opened from. Null
   when the modal has never been opened. `hits` is captured ONCE, at open time, and the engine is
   never re-run behind it: src/merge-fields.js's contextOf() says why in as many words — re-running
   would answer about today, and the draft is about the row the teacher tapped. */
let subject = null;

let tone = templates.TONES[0];
let recipientKey = '';
let templateId = '';

/* What is in the two boxes RIGHT NOW. It starts as whatever the resolver handed back and is the
   teacher's from the first keystroke — WO-5.3's "editable before sending, always". */
let draft = { subject: '', body: '' };

/* WHAT THE LAST RESOLVE PUT IN THOSE TWO BOXES, and the only thing it is for is the comparison in
   draftEdited() (WO-5.6). It is written in exactly one place — buildDraft(), which is the one
   resolve — and it is a SEPARATE object rather than a second reference to `draft`, because
   editOutreachField() writes into `draft` and a shared object would leave every draft eternally
   unedited: the comparison would be a string against itself. */
let resolved = { subject: '', body: '' };

/* THE CHANGE SHE HAS ASKED FOR AND NOT YET AGREED TO PAY FOR — `{ kind, value }`, where `kind` is
   one of the three doors below and `value` is the tone, the recipient key or the template id.
   Null whenever nothing is being asked.

   A PROPOSAL AND NOT A COMMITMENT: nothing in the document, in the draft or on the screen has moved
   while this is set, which is what makes Escape and the ✕ safe to leave to src/modal.js. Both close
   the dialog without coming through this module, and both leave a `pending` behind — inert, because
   the only thing that reads it is the button inside the panel they just closed, and the next ask
   overwrites it. src/assignments.js's copy and delete confirms leave the same kind of corpse for
   the same reason. */
let pending = null;

/* Whether the draft above has been resolved yet. It is false between opening the flow and the
   first paint that is ALLOWED to resolve one — see openOutreach() and renderOutreach(), where the
   rule is that nothing is resolved at all while the projector is on. */
let built = false;

/* What the last resolve said, kept for its ERRORS and for nothing else. The text of it is already
   in `draft` above; these are the sentences src/merge-fields.js wrote about the fields that did not
   resolve, printed as it wrote them. */
let errors = [];

/* Whether this draft copies the teacher. Seeded from `teacher.defaultCc` at open time and toggled
   per draft — a change here is a fact about this message and is deliberately not written back to
   the year: *Your details* is where that default lives, and a per-draft toggle that rewrote it
   would change the next forty messages because of one. */
let copySelf = true;

/* One sentence under the actions — what the last thing pressed did. One line rather than a banner,
   so the eye has one place to go back to (src/templates-view.js's status line, one screen over).

   THERE IS STILL NO ERROR TONE HERE, AND WO-5.7 DID NOT ADD ONE. Until that work order every
   sentence this line could hold was about a draft being rebuilt or handed over; it can now also
   say that the clipboard refused. That is not an error about the DRAFT — what is wrong with a draft
   is the block strip's to say, in the resolver's own words — it is a fact about the browser, and it
   is drawn in the same neutral type as the rest for that reason.

   IT IS ALSO THE FLOW'S WHOLE MEMORY OF THE CLIPBOARD. The copy control's label is drawn from a
   comparison against COPIED_NOTE above, so every other act in this file clears the acknowledgement
   by doing what it already did — writing over this string. See that block. */
let status = '';

/* ────────────────────────────── the model ──────────────────────────────

   THE WHOLE OF WHAT IS ON SCREEN, AS DATA, WITH NO DOM IN IT — the build-it / hand-it-over split
   src/signals-view.js's signalsModel(), src/templates-view.js's templatesModel() and
   src/detail.js's detailModel() all make. Every decision about who this can go to, which templates
   are on offer, what is blocking it and what URL the link carries is made once, here, and
   tools/verify/outreach.mjs can assert it without a check that also has to be right about markup —
   and then reads the DOM as well, so a model that is right about a draft nobody drew still fails. */

function classById(doc, classId) {
  return getActiveClasses().filter((c) => c.id === classId)[0]
    || ((doc && Array.isArray(doc.classes) ? doc.classes : []).filter((c) => c && c.id === classId)[0]
      || null);
}

function studentById(doc, studentId) {
  return (doc && Array.isArray(doc.students) ? doc.students : [])
    .filter((s) => s && s.id === studentId)[0] || null;
}

/* The signal this draft speaks from: the first of the student's hits, in the ENGINE's order, whose
   direction matches the tone. `{{grade.delta}}` reads it and nothing else, so a praise draft speaks
   from her praise row and a concern draft from her concern row — which is src/templates-view.js's
   ruling about the live preview, inherited rather than re-made, and the two surfaces therefore
   rehearse the same draft. A student with no hit in that direction gets none, and the field does
   not resolve: the honest answer rather than an invented row. */
function hitFor(direction) {
  const hits = subject && Array.isArray(subject.hits) ? subject.hits : [];
  return orderHits(hits.filter((h) => h && h.direction === direction))[0] || null;
}

export function outreachModel() {
  const blocked = presentationMode();
  const doc = getDoc();
  const student = subject ? studentById(doc, subject.studentId) : null;
  const cls = subject ? classById(doc, subject.classId) : null;
  const base = {
    open: !!subject,
    blocked: blocked,
    name: '', className: '', termLabel: '',
    tone: tone,
    recipients: [], recipient: null, audience: '',
    templates: [], templateId: '', templateName: '',
    subject: '', body: '',
    cc: { on: false, email: '', ok: false },
    reasons: [], ready: false,
    url: '', length: 0, long: false,
    /* WO-5.7's two. `clipboard` is empty for exactly as long as `url` is — see the pair of them
       further down — so a blocked draft and a projected screen both copy nothing, and they do it by
       having nothing to copy rather than by a control declining. */
    clipboard: '', copied: false,
    status: status,
  };
  /* NOTHING IS RESOLVED, LISTED OR ADDRESSED WHILE THE PROJECTOR IS ON. Returned before a recipient
     is built, not filtered out of a model that was built anyway — src/signals-view.js's rule, and
     its reason: a list that exists in memory is a list a later render can draw. */
  if (blocked || !subject || !student) return base;

  const term = cls ? getTerms(cls.id).filter((t) => t.id === subject.termId)[0] : null;
  const recipients = outreach.recipientsFor(doc, student);
  const chosen = outreach.recipientByKey(recipients, recipientKey) || recipients[0] || null;
  const audience = chosen ? outreach.audienceOf(chosen) : '';
  /* THE SEVENTH ACCEPTANCE LINE, AND IT IS ONE CALL WITH BOTH ARGUMENTS. A concern template and a
     praise template written for the same audience are two records and are offered separately,
     because this read is filtered on the tone AND the audience — never on the audience alone, which
     would hand a guardian's concern template back for a praise draft. src/templates.js owns that
     question so that this flow and the editor cannot come to disagree about what is on offer.

     THE EIGHT STARTERS ARE NOT HERE, AND THAT IS THE OWNER'S RULING RATHER THAN AN OVERSIGHT
     (2026-08-28, WO-5.2). They are shipped TEXT offered in the editor's list, and a Save is what
     makes one a record — "the one keystroke between a shipped sentence and a hundred guardians
     reading it in the same words". Offering them at send time would be that keystroke removed. A
     teacher with nothing saved for this pair is told so and pointed at the door. */
  const offered = templates.templatesFor(doc, tone, audience);
  const record = offered.filter((t) => t.id === templateId)[0] || null;

  const cc = {
    on: copySelf,
    email: String((doc && doc.teacher && doc.teacher.email) || '').trim(),
    ok: false,
  };
  cc.ok = !!cc.email;

  /* WHAT IS STOPPING THIS DRAFT, in the order a teacher can act on them. Three kinds, and only the
     first is the resolver's: it names a merge field and carries the sentence src/merge-fields.js
     wrote about it. The other two are about this flow's own objects — a person with no address, and
     no message chosen — which the resolver has never heard of and must not be asked about. */
  const reasons = [];
  if (!record) {
    reasons.push({
      kind: 'template',
      text: offered.length
        ? 'Pick which message this is, above.'
        : 'You have not saved a ' + templates.toneLabel(tone).toLowerCase() + ' template for a '
          + templates.audienceLabel(audience).toLowerCase() + ' yet. Write one on the Message '
          + 'templates screen — Planbook ships one you can start from.',
    });
  }
  if (!chosen) {
    reasons.push({ kind: 'recipient', text: 'There is nobody on this student’s roster entry to '
      + 'write to. Add a guardian, a counselor or your administrator’s address first.' });
  } else if (!chosen.email) {
    reasons.push({ kind: 'recipient', text: chosen.kind === 'admin'
      ? 'There is no administrator address in Your details, so there is nowhere to send this.'
      : 'There is no email address on file for ' + (chosen.name || chosen.label.toLowerCase())
        + ', so there is nowhere to send this. Add one on the roster.' });
  }
  if (cc.on && !cc.ok) {
    reasons.push({ kind: 'cc', text: 'Copy me is on and there is no email address in Your details, '
      + 'so there is nothing to copy you at. Add one, or turn the copy off for this message.' });
  }
  /* EVERY MERGE FIELD STILL ON THE PAGE, WITH THE RESOLVER'S OWN SENTENCE UNDER IT. The list is what
     is in the boxes NOW rather than what the resolve found, so a token the teacher has typed over is
     gone from it and a token she has typed IN is on it. Where the resolver named the field, its
     message is printed word for word; where it did not — a name she typed after the resolve — the
     sentence says the one thing this file can honestly say about it, which is that nothing will fill
     it in a mail app. */
  const left = outreach.tokensLeftIn(draft.subject);
  outreach.tokensLeftIn(draft.body).forEach((name) => {
    if (left.indexOf(name) < 0) left.push(name);
  });
  left.forEach((field) => {
    const named = errors.filter((e) => e.field === field)[0] || null;
    reasons.push({
      kind: 'field',
      field: field,
      where: named && named.where === 'subject' ? 'subject' : 'body',
      text: named ? named.message
        : '{{' + field + '}} is still in this draft. Nothing fills a merge field once the message '
          + 'is in your mail app, so type what it should say or take it out.',
    });
  });

  const to = chosen ? chosen.email : '';
  const ready = reasons.length === 0;
  const url = ready ? outreach.mailtoUrl({
    to: to,
    cc: cc.on && cc.ok ? cc.email : '',
    subject: draft.subject,
    body: draft.body,
  }) : '';
  /* THE SAME FOUR FIELDS, THE SAME GATE, THE SAME OBJECT (WO-5.7). Built here beside the URL rather
     than inside the tap, so that the one gate `ready` — every reason in the list above — decides
     both doors at once and neither can be open while the other is shut. What comes back is plain
     text rather than a URL and the difference is entirely src/outreach.js's, argued at draftText():
     the line break is LF here and CRLF there, and that is a departure rather than an oversight.

     `name` IS THE FIFTH FIELD AND THE URL HAS NO USE FOR IT. A `mailto:` carries a bare addr-spec
     (RFC 6068), so the person's name is not in the URL at all; a pasted block is read by a human
     and by a compose window's To field, and both of them want "Jane Okafor <jane@…>". It is the
     name that is already on the line under the chips, which presentation mode empties with
     everything else — this is the same string, not a second reach into the roster. */
  const clipboard = ready ? outreach.draftText({
    to: to,
    name: chosen ? chosen.name : '',
    cc: cc.on && cc.ok ? cc.email : '',
    subject: draft.subject,
    body: draft.body,
  }) : '';

  return Object.assign(base, {
    name: fullName(student),
    className: cls ? cls.name : '',
    termLabel: termName(term),
    recipients: recipients.map((r) => ({ key: r.key, label: r.label, name: r.name, email: r.email,
      active: !!chosen && r.key === chosen.key, has: !!r.email })),
    recipient: chosen ? { key: chosen.key, label: chosen.label, name: chosen.name,
      email: chosen.email } : null,
    audience: audience,
    templates: offered.map((t) => ({ id: t.id, name: t.name, active: !!record && t.id === record.id })),
    templateId: record ? record.id : '',
    templateName: record ? record.name : '',
    subject: draft.subject,
    body: draft.body,
    cc: cc,
    reasons: reasons,
    ready: ready,
    url: url,
    length: url.length,
    long: outreach.overCeiling(url),
    clipboard: clipboard,
    /* WHETHER THE CLIPBOARD HOLDS THIS DRAFT, ASKED OF THE STATUS LINE RATHER THAN OF A FLAG —
       see COPIED_NOTE at the head of this file for why that is the whole of the bookkeeping. */
    copied: status === COPIED_NOTE,
  });
}

/* ────────────────────────────── drawing it ────────────────────────────── */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function paintRecipients(model) {
  const host = document.getElementById(TO_ID);
  if (host) {
    host.textContent = '';
    model.recipients.forEach((row) => {
      const button = el('button', 'toggle-btn' + (row.active ? ' active' : ''), row.label);
      button.type = 'button';
      button.setAttribute('data-outreach-to', row.key);
      button.setAttribute('aria-pressed', row.active ? 'true' : 'false');
      /* The whole row said in one string, because the chip is a position and the person is on the
         line below it: a screen reader on the chip alone would hear "Guardian 2" and nothing about
         who that is or whether there is an address for her. */
      button.setAttribute('aria-label', row.label + (row.name ? ' — ' + row.name : '')
        + (row.email ? ', ' + row.email : ', no email address on file'));
      host.append(button);
    });
  }
  const note = document.getElementById(TO_NOTE_ID);
  if (!note) return;
  const to = model.recipient;
  note.textContent = !to ? ''
    : (to.name ? to.name + (to.email ? ' · ' + to.email : '') : (to.email || ''))
      || 'No name and no address on file for this one yet.';
}

/*
  THE TEMPLATE PICKER IS A `<select>` AND THE OTHER TWO ARE CHIPS, and the difference is whose words
  they are. A tone and a recipient are the app's own short strings; a template name is whatever the
  teacher typed, and a row of nowrap chips holding "Missing work — first contact, second attempt"
  puts a 390px modal into sideways scroll. src/templates-view.js reached for a `<select>` one screen
  over for the same reason and named it at its own line.
*/
function paintTemplates(model) {
  const picker = document.getElementById(TEMPLATE_ID);
  if (picker) {
    /* REBUILT ONLY WHEN THE LIST ACTUALLY CHANGED. On iPadOS a `<select>` replaced while its wheel
       is open loses the wheel, and this paint runs on every keystroke — src/templates-view.js's
       rule about the same control, and src/categories.js's about an input under a caret. */
    const wanted = model.templates.map((t) => t.id + '|' + (t.name || 'Untitled template'));
    const there = Array.prototype.map.call(picker.options, (o) => o.value + '|' + o.textContent);
    if (JSON.stringify(wanted) !== JSON.stringify(there)) {
      picker.textContent = '';
      model.templates.forEach((t) => {
        const option = document.createElement('option');
        option.value = t.id;
        option.textContent = t.name || 'Untitled template';
        picker.append(option);
      });
    }
    picker.value = model.templateId;
    picker.classList.toggle('hidden', model.templates.length === 0);
  }
  const note = document.getElementById(TEMPLATE_NOTE_ID);
  if (note) {
    note.textContent = model.templates.length
      ? model.templates.length + (model.templates.length === 1 ? ' template' : ' templates')
        + ' written for a ' + templates.audienceLabel(model.audience).toLowerCase() + ' in the '
        + templates.toneLabel(model.tone).toLowerCase() + ' tone.'
      : 'Nothing saved for this pair yet.';
  }
}

function paintTones(model) {
  const host = document.getElementById(TONES_ID);
  if (!host) return;
  host.querySelectorAll('[data-outreach-tone]').forEach((button) => {
    const on = (button.getAttribute('data-outreach-tone') || '') === model.tone;
    button.classList.toggle('active', on);
    button.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

/*
  THE BLOCK STRIP, LIFTED FROM src/shell.css § UNRESOLVED RATHER THAN RE-CUT. It is the same
  component the live preview draws — WO-5.2 put it in the shell's own sheet precisely because this
  surface renders one too — and it is permanent here for the reason it is permanent there: a strip
  that appears only on failure is read as an error banner, and one that is always there is a report.

  WHAT IS DIFFERENT IS WHAT IT COUNTS. The preview counts fields, because a template is what it is
  about. This one counts THINGS TO FIX, because a draft can also be blocked by a recipient with no
  address or by no message being chosen, and calling those "fields" would be this screen pretending
  the resolver had an opinion about them.

  AND SINCE WO-5.5 THE HEAD ITSELF IS NOT WRITTEN HERE. The sentence before the `·` comes from
  src/block-strip.js, which the preview imports too — the strip's words kept in one place the way
  its pixels already were. What stays this screen's own is everything after the `·` (see the
  paragraph above) and the choice of WHICH head to print (see paintBlock() below).
*/
function paintBlock(model) {
  const host = document.getElementById(BLOCK_ID);
  if (!host) return;
  host.textContent = '';
  host.classList.toggle('clear', model.ready);
  const count = model.reasons.length;
  /*
    THE HEAD IS CONDITIONAL ON THERE BEING A FIELD IN THE LIST, and that is a ruling WO-5.5 did not
    make for this screen because the defect it was written from was a field one. The owner's
    sentence is about an undefined field; this list also carries a recipient with no address, no
    message chosen, and *Copy me* with nowhere to copy to — none of which is a field. Printing
    "This draft has at least one undefined field" over a draft whose only fault is a missing
    guardian address would be the strip stating something false about the draft, which is a worse
    failure than the one this work order came to fix. So the new sentence heads the case it is true
    of and the shipped one heads the rest. **`src/merge-fields.js` was not opened for either**, and
    the phrase surviving here is this file's own head rather than a resolver sentence.
  */
  const fields = model.reasons.some((reason) => reason.kind === 'field');
  /* The ready line is written out whole because it carries no count — the one head on either
     screen that blockHead() has nothing to compose. */
  host.append(el('div', 'mf-block-head', model.ready
    ? 'Nothing blocked · this draft is ready for your mail app'
    : blockHead(fields ? UNDEFINED_FIELD_HEAD : 'This draft cannot be sent',
      count, 'thing to fix', 'things to fix')));

  if (model.ready) {
    host.append(el('div', 'mf-reason', 'It opens in your own mail app, addressed to '
      + (model.recipient ? (model.recipient.name || model.recipient.email) : '')
      + (model.cc.on && model.cc.ok ? ', copied to you' : '')
      + '. Nothing is sent until you send it there.'));
    return;
  }
  /*
    WHAT TO DO ABOUT IT, ONCE, ABOVE THE LIST RATHER THAN ON EVERY ROW (WO-5.5). The per-field rows
    under this one are the resolver's sentences and they are about the TOKEN — what it was, why it
    did not become anything. Not one of them can say what to DO, because the answer is about this
    screen's own box: the teacher types in it, and the draft she is changing is one message to one
    person. It is a `.mf-reason` and not a class of its own, which is what the ready state's own
    sentence already is — one more line in the strip's own type, rather than a second treatment
    inside a component whose whole ruling is that it has one.
  */
  if (fields) host.append(el('div', 'mf-reason', FIELD_FIX_SENTENCE));
  model.reasons.forEach((reason) => {
    const row = el('div', 'mf-reason');
    if (reason.field) row.append(el('code', '', '{{' + reason.field + '}}'));
    row.append(el('span', '', reason.text));
    /* The one control on the row, and it goes to the half of the draft the field is in — the same
       gesture the preview's strip offers, wearing the same class and carrying this flow's own hook.
       Only a merge field gets one: there is nothing on this screen for "add a guardian's email" to
       jump to, and a button that went nowhere would be worse than no button. */
    if (reason.field) {
      const jump = el('button', 'mf-jump', reason.where === 'subject' ? 'Subject' : 'Body');
      jump.type = 'button';
      jump.setAttribute('data-outreach-jump', reason.where);
      jump.setAttribute('aria-label', 'Go to the ' + reason.where + ' and fix ' + reason.field);
      row.append(jump);
    }
    host.append(row);
  });
}

/*
  THE HANDOFF ITSELF. The link carries the URL when the draft is ready and carries NO `href` at all
  when it is not — see this file's header for why that is the refusal rather than a disabled button.
*/
function paintOpen(model) {
  const link = document.getElementById(OPEN_ID);
  if (!link) return;
  if (model.ready && model.url) {
    link.setAttribute('href', model.url);
    link.removeAttribute('aria-disabled');
    link.setAttribute('aria-label', 'Open this draft in your mail app, addressed to '
      + (model.recipient ? (model.recipient.name || model.recipient.email) : ''));
  } else {
    link.removeAttribute('href');
    link.setAttribute('aria-disabled', 'true');
    link.setAttribute('aria-label', 'Open in my mail app — not until the draft is unblocked');
  }

  const length = document.getElementById(LENGTH_ID);
  if (length) {
    /* THE WARNING IS BEFORE THE FACT, because truncation leaves no gap and no error — see
       src/outreach.js's MAILTO_CEILING for where 2,000 comes from and why it is measured on the
       encoded URL rather than on what the teacher typed. Nothing in this app cuts the message. */
    length.classList.toggle('hidden', !model.long);
    length.textContent = model.long
      ? 'This draft is ' + model.length + ' characters once it is encoded for your mail app, which '
        + 'is over the ' + outreach.MAILTO_CEILING + ' some apps carry — Outlook on Windows cuts '
        + 'there, silently. Planbook does not shorten it: send it and check what arrived, or trim '
        + 'it here first.'
      : '';
  }
}

/*
  THE COPY CONTROL (WO-5.7). Three lines, and every one of them is argued at COPIED_NOTE above: the
  refusal is `disabled` because that is a button's structural equivalent of the anchor's missing
  `href`; the label changes because a control that looks identical before and after is one people
  press four times; and the gate is `model.clipboard`, which is empty on exactly the drafts `url`
  is empty on. Nothing here decides anything — paintOpen() reads the same model beside it.
*/
function paintCopy(model) {
  const button = document.getElementById(COPY_ID);
  if (!button) return;
  button.disabled = !(model.ready && model.clipboard);
  button.textContent = model.copied ? 'Copied' : 'Copy the draft';
  /* The spoken label says what the control is FOR rather than repeating the word on it, and in the
     refused state it says what is stopping it — the sentence the handoff link's own label takes,
     because the two controls are refused by one gate and a screen reader should not hear two
     different reasons for it. */
  button.setAttribute('aria-label', button.disabled
    ? 'Copy the draft — not until the draft is unblocked'
    : (model.copied
      ? 'Copied. The recipient, the subject and the message are on your clipboard'
      : 'Copy the recipient, the subject and the message to your clipboard'));
}

/*
  PAINT THE FLOW. `opts.fields === false` leaves the subject and the body alone, and that is the
  rule src/templates-view.js's paintEditor() and src/categories.js both keep: replacing the value of
  a field while somebody is typing into it moves the caret to the end, and on iPadOS it can close
  the software keyboard. So a keystroke repaints the strip, the link and the length warning and
  touches neither box; rebuilding the draft is what re-fills them.
*/
export function renderOutreach(opts) {
  const host = document.getElementById(FORM_ID);
  if (!host) return;
  const fields = !opts || opts.fields !== false;
  /*
    THE DRAFT IS RESOLVED ON THE FIRST PAINT THAT IS ALLOWED TO DRAW ONE, which is what makes
    "nothing is resolved at all while the projector is on" true of the flow rather than only of the
    screen. The send flow can be opened from the student record with the mode already on — that
    screen does not refuse — and a draft built there would be a resolved draft sitting in memory for
    a later render to draw, which is exactly what src/signals-view.js's rule forbids.

    So openOutreach() sets the state and stops, and the resolve happens here, on the paint the
    header switch chains into when the mode comes off.
  */
  if (subject && !built && !presentationMode()) { buildDraft(); built = true; }
  const model = outreachModel();

  const title = document.getElementById(TITLE_ID);
  if (title) title.textContent = model.blocked || !model.name ? 'Draft an email'
    : 'Draft an email — ' + model.name;
  const sub = document.getElementById(SUB_ID);
  if (sub) {
    sub.textContent = model.blocked ? '' : model.className
      + (model.termLabel ? ' · ' + model.termLabel : '');
    sub.classList.toggle('hidden', model.blocked || !model.className);
  }

  const projecting = document.getElementById(PROJECTING_ID);
  if (projecting) projecting.classList.toggle('hidden', !model.blocked);
  /* NO SUBJECT AND THE PROJECTOR ARE THE SAME PAINT, deliberately: both are states in which nothing
     about a student may be on the glass. The first is only reachable by a year switch or a restore
     under an open modal, which resetOutreach() below also closes. */
  host.classList.toggle('hidden', model.blocked || !model.open);

  /* EMPTIED RATHER THAN HIDDEN. The two boxes hold a named student's business and a guardian's
     address, and `display: none` is not a redaction — see this file's header. */
  const subjectField = document.getElementById(SUBJECT_ID);
  const bodyField = document.getElementById(BODY_ID);
  if (model.blocked || !model.open) {
    /* THE ASK GOES DOWN WITH THE FORM (WO-5.6). The rebuild confirm sits OVER this panel, so a
       projector switched on while it is up would leave a dialog on the glass over a modal that had
       just emptied itself — the shape of the disclosure WO-5.3's mutation round found. It names no
       student and no guardian by construction (see the three doors below, which hand it the chip's
       POSITION and never the person), so this is the second fence rather than the only one. */
    pending = null;
    closeModal(CONFIRM_ID);
    if (subjectField) subjectField.value = '';
    if (bodyField) bodyField.value = '';
    const to = document.getElementById(TO_ID);
    if (to) to.textContent = '';
    const note = document.getElementById(TO_NOTE_ID);
    if (note) note.textContent = '';
    const picker = document.getElementById(TEMPLATE_ID);
    if (picker) picker.textContent = '';
    /* The two lines of type under the pickers go with them. Neither names a student, and both are
       emptied anyway: what a projected room learns from "3 templates written for a guardian" is
       that somebody is being written about, and the teacher's own address is not a thing to leave
       on a wall either. */
    const templateNote = document.getElementById(TEMPLATE_NOTE_ID);
    if (templateNote) templateNote.textContent = '';
    const ccNote = document.getElementById(CC_NOTE_ID);
    if (ccNote) ccNote.textContent = '';
    const block = document.getElementById(BLOCK_ID);
    if (block) block.textContent = '';
    const link = document.getElementById(OPEN_ID);
    if (link) { link.removeAttribute('href'); link.setAttribute('aria-disabled', 'true'); }
    /* AND THE COPY GOES DOWN WITH IT (WO-5.7), on the same line as the link and for the link's
       reason: the form is `.hidden` here, and `display: none` is not a refusal any more than it is
       a redaction. The control is disabled rather than merely undrawn, so a click dispatched at it
       — by a script, by a stuck focus, by a screen reader on a page a stylesheet lied to — does
       nothing at all. The label goes back to its resting word in the same breath, because *Copied*
       left standing on a panel that has just emptied itself is the flow reporting on a draft
       nothing on screen admits to. */
    const copy = document.getElementById(COPY_ID);
    if (copy) { copy.disabled = true; copy.textContent = 'Copy the draft'; }
    return;
  }

  paintTones(model);
  paintRecipients(model);
  paintTemplates(model);
  /* THE TWO BOXES, WRITTEN ONLY WHEN THE DRAFT CHANGED UNDER THE TEACHER — see this function's
     own comment for the rule and the reason. */
  if (fields && subjectField) subjectField.value = model.subject;
  if (fields && bodyField) bodyField.value = model.body;

  const cc = document.getElementById(CC_ID);
  if (cc) {
    cc.classList.toggle('active', model.cc.on);
    cc.setAttribute('aria-pressed', model.cc.on ? 'true' : 'false');
    cc.textContent = model.cc.on ? 'Copy me: on' : 'Copy me: off';
  }
  const ccNote = document.getElementById(CC_NOTE_ID);
  if (ccNote) {
    ccNote.textContent = !model.cc.on
      ? 'This one will not copy you. Your sent-mail folder still holds it once you send it.'
      : (model.cc.ok
        ? 'You are copied at ' + model.cc.email + ', so you keep your own record of what went home.'
        : 'There is no email address in Your details yet, so there is nothing to copy you at.');
  }

  paintBlock(model);
  paintOpen(model);
  paintCopy(model);

  const line = document.getElementById(STATUS_ID);
  if (line) {
    line.textContent = model.status;
    line.classList.toggle('hidden', !model.status);
  }
}

/*
  EVERYTHING THIS FLOW HOLDS, DROPPED — and the modal closed with it. Called by src/shell.js after a
  year switch and after a restore, for the reason resetTemplates() is called there: a draft about a
  student in the document that was just replaced is a draft about nobody. Closing rather than
  emptying, because the state behind this modal is a row the teacher tapped and that row is gone.
*/
export function resetOutreach() {
  subject = null;
  tone = templates.TONES[0];
  recipientKey = '';
  templateId = '';
  draft = { subject: '', body: '' };
  /* The snapshot and the proposal go with everything else, and the reason is the one this function
     already had: a stale snapshot surviving a reset makes the NEXT student's untouched draft read
     as edited, and the first tone tap over it opens a confirm dialog about nothing. */
  resolved = { subject: '', body: '' };
  pending = null;
  errors = [];
  built = false;
  status = '';
  closeModal(CONFIRM_ID);
  closeModal(MODAL_ID);
  renderOutreach();
}

/* ────────────────────────────── the controls ────────────────────────────── */

/*
  THE ONE RESOLVE. Called when the template, the recipient or the tone changes and never on a
  keystroke — see this file's header. It replaces whatever is in the two boxes, which is why every
  caller of it says so in the status line: a teacher who has typed four lines and then changes the
  recipient has to be told her draft was rebuilt rather than left to notice.
*/
function buildDraft() {
  const doc = getDoc();
  const model = outreachModel();
  const record = model.templateId
    ? templates.templateById(doc, model.templateId) : null;
  if (!record || !subject) {
    draft = { subject: '', body: '' };
    errors = [];
    /* THE SNAPSHOT IS TAKEN ON THIS PATH TOO. An empty pair is still what the last resolve
       produced, and leaving the previous draft's snapshot here would make an empty draft read as
       edited — a confirm dialog over two empty boxes. */
    resolved = { subject: '', body: '' };
    return;
  }
  const chosen = outreach.recipientByKey(
    outreach.recipientsFor(doc, studentById(doc, subject.studentId)), model.recipient
      ? model.recipient.key : '');
  const out = resolveDraft({
    doc: doc,
    classId: subject.classId,
    termId: subject.termId,
    studentId: subject.studentId,
    /* WHICH GUARDIAN `{{guardian.name}}` MEANS — the parameter src/merge-fields.js left open for
       this work order by name. A guardian recipient hands her own record over; every other
       recipient hands none, and that field falls back to the preferred guardian, which is that
       module's own documented answer rather than a decision made here. */
    guardian: chosen ? chosen.guardian : null,
    hit: hitFor(tone === 'praise' ? 'praise' : 'concern'),
    hits: subject.hits,
    template: { subject: record.subject, body: record.body },
  });
  draft = { subject: out.subject, body: out.body };
  errors = out.errors;
  /* WHAT WO-5.6 COMPARES AGAINST, recorded at the one resolve because this is the only moment the
     two boxes are known to hold nobody's words but the resolver's. */
  resolved = { subject: out.subject, body: out.body };
}

/*
  HAS THE TEACHER TYPED IN THIS DRAFT — the whole of WO-5.6's third Deliverable, and it is a string
  comparison rather than a bit somebody sets. Two Acceptance lines fall straight out of that shape:
  a character typed and removed again counts as UNTOUCHED, because the string is back where it
  started; and a rewritten SUBJECT counts as edited over an untouched body, because both halves are
  compared and a confirm watching only the body is the same bug one field further along.
*/
function draftEdited() {
  return draft.subject !== resolved.subject || draft.body !== resolved.body;
}

/*
  OPEN THE FLOW FOR ONE STUDENT. `where` carries the row the draft was opened from:

      { studentId, classId, termId, hits }

  `hits` is the student's own signals, captured by the caller at the moment of the tap — the signal
  card hands over the hits its row is drawn from, and the student record runs the engine once for
  the class it is standing in. Nothing here re-runs it afterwards.
*/
export function openOutreach(where, opener) {
  const w = where || {};
  const doc = getDoc();
  const student = studentById(doc, w.studentId);
  if (!student) return false;
  subject = {
    studentId: w.studentId,
    classId: w.classId || '',
    termId: w.termId || '',
    hits: Array.isArray(w.hits) ? w.hits.filter(Boolean) : [],
  };
  /* THE TONE OPENS ON THE DIRECTION OF THE ROW SHE TAPPED, which is the whole of what the two
     columns mean: a draft opened from a praise row is a praise message. With no signals at all —
     the student record, for a student nothing has fired for — it opens on concern, because that is
     the tone every audience has a starter for and the switch is one tap. */
  const lead = orderHits(subject.hits)[0] || null;
  tone = lead && lead.direction === 'praise' ? 'praise' : 'concern';
  /* THE FIRST RECIPIENT WITH AN ADDRESS, rather than the first row: a modal that opens on a
     guardian with no email and a dead button teaches that the feature is broken. The order is
     src/outreach.js's — guardians first, in roster order. */
  const people = outreach.recipientsFor(doc, student);
  const first = people.filter((r) => r.email)[0] || people[0] || null;
  recipientKey = first ? first.key : '';
  const offered = templates.templatesFor(doc, tone, first ? outreach.audienceOf(first) : '');
  templateId = offered.length ? offered[0].id : '';
  copySelf = !!(doc && doc.teacher && doc.teacher.defaultCc !== false);
  status = '';
  /* NOT RESOLVED HERE. renderOutreach() below does it, and only when it is allowed to — see the
     note at that function. The announcement follows the same rule: with the projector on it names
     the control that undoes the refusal rather than the student, because a live region is part of
     the page and "the fields are emptied rather than hidden" would mean nothing beside a spoken
     name. */
  built = false;
  /* A new student, so nothing is being asked about the last one's draft. Closed rather than merely
     forgotten: the dialog is an overlay, and one left up over a flow that has just changed subject
     would be a question about a draft that no longer exists. */
  pending = null;
  closeModal(CONFIRM_ID);
  renderOutreach();
  openModal(MODAL_ID, opener);
  announce(presentationMode()
    ? 'Not while you are projecting. Turn presentation mode off with the screen button in the '
      + 'header and the draft comes back.'
    : 'Drafting an email about ' + fullName(student) + '.');
  return true;
}

/*
  ── THE THREE DOORS, AND THE ONE QUESTION THEY ALL ASK FIRST (WO-5.6) ──

  Each of the three is now a PAIR: a `set…` that decides whether to ask, and an `apply…` that does
  the work. The split is not tidiness — it is the fix. All three used to mutate module state and
  then call buildDraft(), so there was no moment at which the change had been proposed and not yet
  made, and a cancel would have had to put four things back by hand. Now nothing moves until either
  the draft turns out to be untouched or the teacher presses the button, and *cancel* is the absence
  of a call rather than an undo.

  WO-5.8 EXTENDS THIS RATHER THAN INVENTING A SECOND ONE. Several recipients change what "changing
  the recipient" means; what it must not change is where the question is asked, which is here.
*/

/* One line of the dialog's fact list, the shape src/assignments.js's factLine() draws. */
function confirmLine(parent, text) {
  const node = document.createElement('div');
  node.className = 'class-delete-line';
  node.textContent = text;
  parent.append(node);
}

/*
  ASK, IF THERE IS ANYTHING TO LOSE. Returns true when the question was put — the caller's cue to
  stop and change nothing — and false when the draft is untouched and the rebuild may go straight
  through, which is WO-5.6's second Deliverable and the reason this is not a dialog on every tap.

  `change` is `{ kind, value, lead, action }`: the two the confirm needs to apply it, and the two
  sentences a teacher reads. Neither sentence names a student, a guardian or an address — the
  recipient door hands over the chip's POSITION ("Guardian 2") and never the person on the line
  below it — because this panel sits over a modal that presentation mode empties.
*/
function askBeforeRebuild(change, opener) {
  if (!draftEdited()) return false;
  pending = change;
  /* THE SCREEN GOES BACK BEFORE THE QUESTION IS PUT, and this one line is most of "a cancel leaves
     everything as it was". A `<select>` has ALREADY taken the new template by the time its `change`
     event arrives, so a dialog opened over it would be asking about a rebuild while the picker
     behind it claimed to have done one. Repainting from module state — which has not moved — puts
     the tone pill, the recipient chips and the template picker back to what they read before the
     tap. It is also what makes Escape and the ✕ safe to leave to src/modal.js: the screen behind
     them is already correct, so they need no handler here. */
  renderOutreach();
  const lead = document.getElementById(CONFIRM_LEAD_ID);
  if (lead) lead.textContent = change.lead;
  /* WHICH BOXES SHE HAS CHANGED, counted the same way draftEdited() decides, so the panel cannot
     disagree with the test that opened it. Both are listed when both differ: the subject is the
     half that goes missing quietly. */
  const facts = document.getElementById(CONFIRM_FACTS_ID);
  if (facts) {
    facts.textContent = '';
    if (draft.subject !== resolved.subject) confirmLine(facts, 'You have rewritten the subject.');
    if (draft.body !== resolved.body) confirmLine(facts, 'You have rewritten the message.');
  }
  /* The button says what it will do, never *OK* — src/classes.js § "delete, and what it costs". */
  const button = document.getElementById(CONFIRM_BTN_ID);
  if (button) button.textContent = change.action;
  openModal(CONFIRM_ID, opener);
  return true;
}

/*
  ONE SENTENCE FOR ALL THREE DOORS, and its second half is what WO-5.6 changed. Every one of them
  used to end *"Anything you had typed is gone"* — honest reporting of a loss the teacher had not
  been asked about. A rebuild is now either one she agreed to or one that cost her nothing, and the
  line says which; the same sentence for both would leave the silent case sounding like a near miss.
*/
function rebuiltNote(what, replaced) {
  return 'The draft was rebuilt ' + what + (replaced
    ? '. What you had typed was replaced, as you asked.'
    : '. Nothing had been typed into it, so nothing was lost.');
}

export function setOutreachTone(next, opener) {
  if (!templates.isTone(next) || next === tone) return;
  const label = templates.toneLabel(next).toLowerCase();
  /* A TONE TAP IS A REBUILD TOO, and the easiest one to forget: it changes which templates are on
     offer and therefore which one is selected, so the draft is replaced even though nothing named
     a template. It asks on the same terms as the other two, and stays silent on the same terms. */
  if (askBeforeRebuild({ kind: 'tone', value: next,
    lead: 'Switching to ' + label + ' rebuilds this draft from a ' + label + ' template of yours. '
      + 'Planbook keeps no copy of what is in the boxes now, so what you have written here goes.',
    action: 'Rebuild as ' + label }, opener)) return;
  applyTone(next, false);
}

function applyTone(next, replaced) {
  tone = next;
  const doc = getDoc();
  const model = outreachModel();
  const offered = templates.templatesFor(doc, tone, model.audience);
  templateId = offered.length ? offered[0].id : '';
  buildDraft();
  status = rebuiltNote('from a ' + templates.toneLabel(tone).toLowerCase() + ' template', replaced);
  renderOutreach();
  announce(templates.toneLabel(tone) + '.');
}

export function setOutreachRecipient(key, opener) {
  const model = outreachModel();
  const want = String(key || '');
  if (!want || want === (model.recipient ? model.recipient.key : '')) return;
  /* THE POSITION, NEVER THE PERSON — see askBeforeRebuild(). The chip's own label is one of the
     app's five short strings and names nobody; the line under the chips names a guardian and
     carries her address, and that is the half this dialog must never quote. */
  const row = model.recipients.filter((r) => r.key === want)[0] || null;
  const label = row ? row.label : 'that recipient';
  if (askBeforeRebuild({ kind: 'recipient', value: want,
    lead: 'Writing to ' + label + ' instead rebuilds this draft from a template written for them. '
      + 'Planbook keeps no copy of what is in the boxes now, so what you have written here goes.',
    action: 'Rebuild for ' + label }, opener)) return;
  applyRecipient(want, false);
}

function applyRecipient(key, replaced) {
  const doc = getDoc();
  recipientKey = String(key);
  const next = outreachModel();
  /* The template list is filtered by the audience, so a template written for a guardian cannot
     survive a switch to the counselor — it is not on offer any more. Whichever is first for the new
     pair is what the draft is rebuilt from. */
  const offered = templates.templatesFor(doc, tone, next.audience);
  if (!offered.filter((t) => t.id === templateId)[0]) {
    templateId = offered.length ? offered[0].id : '';
  }
  buildDraft();
  /* The STATUS line names the person, where the dialog above named the position. It is drawn inside
     the panel presentation mode empties and is cleared with it, which is the difference. */
  status = rebuiltNote('for ' + (next.recipient
    ? (next.recipient.name || next.recipient.label) : 'that recipient'), replaced);
  renderOutreach();
  announce('Writing to ' + (next.recipient ? (next.recipient.name || next.recipient.label) : '')
    + '.');
}

export function setOutreachTemplate(id, opener) {
  const want = String(id || '');
  if (!want || want === templateId) return;
  /* The template's own name, which is the teacher's writing about her own message and names no
     child — the same reading src/templates-view.js makes when it leaves the list drawn under a
     projector and suppresses only the preview. */
  const record = templates.templateById(getDoc(), want);
  const name = (record && record.name) || 'that template';
  if (askBeforeRebuild({ kind: 'template', value: want,
    lead: 'Rebuilding from “' + name + '” replaces the subject and the message with that '
      + 'template’s. Planbook keeps no copy of what is in the boxes now, so what you have written '
      + 'here goes.',
    action: 'Rebuild from “' + name + '”' }, opener)) return;
  applyTemplate(want, false);
}

function applyTemplate(id, replaced) {
  templateId = String(id);
  buildDraft();
  const model = outreachModel();
  status = rebuiltNote('from ' + (model.templateName || 'that template'), replaced);
  renderOutreach();
  announce(model.templateName + ' is in the draft.');
}

/*
  YES — and `true` is passed through to every status line, because a rebuild she agreed to and a
  rebuild that cost her nothing are two different sentences.
*/
export function confirmOutreachRebuild() {
  const change = pending;
  pending = null;
  closeModal(CONFIRM_ID);
  if (!change) return;
  if (change.kind === 'tone') applyTone(change.value, true);
  else if (change.kind === 'recipient') applyRecipient(change.value, true);
  else if (change.kind === 'template') applyTemplate(change.value, true);
}

/*
  NO. Nothing has been changed, so there is nothing to undo — which is the point of proposing before
  rebuilding rather than rebuilding and offering an undo there is no way to build (src/assignments.js
  's cancelCopy(), the same sentence). The screen was put back at the moment the question was asked,
  so this closes the panel and says so out loud and repaints NOTHING — a paint here would write both
  boxes again for no reason, and writing a field's value while somebody may be in it is the one
  thing renderOutreach()'s `fields: false` exists to avoid.
*/
export function cancelOutreachRebuild() {
  pending = null;
  closeModal(CONFIRM_ID);
  announce('Nothing was rebuilt. The draft is exactly as you left it.');
}

/* A field of the draft, as it is typed. It writes to the DRAFT and never to the document, and it
   repaints everything but the two boxes — so the strip, the link and the length warning follow the
   keystroke and the caret stays where the teacher put it. */
export function editOutreachField(input) {
  if (!input) return;
  const which = input.getAttribute('data-outreach-field');
  if (which !== 'subject' && which !== 'body') return;
  draft[which] = input.value;
  status = '';
  renderOutreach({ fields: false });
}

export function toggleOutreachCopy() {
  copySelf = !copySelf;
  renderOutreach({ fields: false });
  announce(copySelf ? 'This draft will copy you.' : 'This draft will not copy you.');
}

/* ────────────────────────── the handoff (WO-5.4) ──────────────────────────

  THE ONE WRITE IN THIS FLOW, ON THE ONE GESTURE THAT MEANS A MESSAGE LEFT THE APP.

  It is called from the click on `#outreachOpen` and from nowhere else. The browser follows the
  `mailto:` in the same gesture — see this file's header for why nothing here prevents that — so by
  the time the mail app opens, the record is already in `log[]` and the cooldown can read it.

  ── WHAT IT REFUSES, AND WHY IT ASKS THE MODEL RATHER THAN THE MARKUP ──

  A blocked draft's anchor carries no `href`, so on a real page this cannot be reached with anything
  to write. It still asks: `<a>` with no href is a normal element and a click on it is a normal
  click, and "the markup says so" is not the kind of answer this app makes about a disclosure. Both
  ends read the same `outreachModel()` — paintOpen() to decide the `href`, this to decide the write
  — so a state where one says ready and the other does not cannot exist. Presentation mode arrives
  through the same door: the model returns before it has a recipient, `ready` is false, and nothing
  is written about a student whose name is not even on the screen.

  ── WHAT IT WRITES, AND THE ONE FIELD THAT IS A DECISION ──

  The audience, the subject and the body exactly as they stand in the two boxes — what the teacher
  is looking at is what the mail app receives and what the log records, which is the same rule that
  made `mailtoUrl()` read the boxes rather than the resolver's output.

  `ruleId` IS `hitFor(tone)`'s OWN `hit.ruleId`, UNCHANGED. It is the same call `{{grade.delta}}`
  resolves against, so the signal the draft SPEAKS from is the signal the cooldown will silence —
  there is no second opinion about which of a student's rules this message was about. **A draft with
  no hit in its direction writes `''` and nothing is invented to fill it**: the student record's
  door opens this flow for a student nothing has fired for, that message is about no signal anybody
  can name, and src/log.js's reader treats the absence as silencing nothing. Under-firing costs a
  duplicate email; a rule id guessed here would silence a signal nobody ever wrote about.

  ── IT SAYS SO ON SCREEN, AND WHAT IT SAYS IS THE HONEST HALF ──

  The status line reports that the message was handed over and logged, and says in the same breath
  that Planbook cannot tell whether it was sent — WO-5.4's fourth Acceptance line at the moment of
  the act, where src/contact-history.js's note carries it at the moment it is read back. The status
  line lives inside the panel presentation mode empties, so it goes down with everything else.
*/
export function recordHandoff() {
  const model = outreachModel();
  if (!model.open || !model.ready || !model.url || !subject) return null;
  const hit = hitFor(tone === 'praise' ? 'praise' : 'concern');
  const entry = writeContact({
    studentId: subject.studentId,
    audience: model.audience,
    subject: draft.subject,
    body: draft.body,
    ruleId: hit ? hit.ruleId : '',
  });
  if (!entry) return null;
  status = 'Handed to your mail app and logged on ' + (model.name || 'this student')
    + '’s record. Planbook cannot tell whether you send it from there — the log says what you '
    + 'wrote and when.';
  /* `fields: false`, like every other repaint that is not a rebuild: the two boxes hold exactly what
     was just handed over, and writing their values back would move the caret of a teacher who is
     still reading them. */
  renderOutreach({ fields: false });
  announce('Logged. Entries are never edited or deleted.');
  return entry;
}

/* ────────────────────────── the copy (WO-5.7) ──────────────────────────

  THE SECOND DOOR OUT OF A DRAFT, AND IT WRITES NOTHING ANYWHERE.

  Read the block at COPIED_NOTE at the head of this file first — why there is a second door, why
  the refusal is `disabled` rather than a missing attribute, why the acknowledgement is the status
  line's own sentence, and the one open edge (a clipboard already written is beyond presentation
  mode's reach). What is left to say is what happens in this function.

  ── THE `writeText` CALL IS THE FIRST THING PAST THE GATE, AND THAT IS THE TRAPS LINE ──

  `navigator.clipboard.write*` is refused outside a user gesture, and the gesture is the tap this is
  called from. It survives the delegated listener in src/shell.js — a listener on `document` is
  still inside the click's own dispatch — and it does NOT survive an `await`, a `setTimeout` or a
  repaint that happens first. So the order here is fixed: ask the model, take the string it already
  built, hand it over, and only then say so. **A copy that works on the laptop and fails silently on
  the iPad is the default outcome of getting that order wrong**, because Safari is stricter about
  user activation than Chromium and the iPad is the device that decides go-live. Nothing may be
  inserted above the call that is not synchronous, and nothing that can throw belongs there either
  — hence one `try` around the call and none around the rest.

  ── THERE IS NO `execCommand` FALLBACK, AND THAT IS A DECISION ──

  WO-5.7's Traps line does not forbid one; it forbids adding one silently. This adds none, and the
  argument is three parts. The API needs a SECURE CONTEXT and this app has one everywhere it runs —
  `https://planbook.hwgteach.com`, `https://localhost:8443`, and the harness's own `127.0.0.1`,
  which counts as one — so the half of the trap that is about `http://` does not arise. Every
  browser this app supports has had `navigator.clipboard.writeText` for years, including the iPad's
  Safari from 13.4. And a hidden `<textarea>` plus `document.execCommand('copy')` is a deprecated
  API and a polyfill, in a repository whose first architectural rule is that it has none.

  SO WHAT A BROWSER WITHOUT THE API GETS IS A SENTENCE, not a silent no-op and not a second
  mechanism. The control stays live — the only thing that disables it is a blocked draft, so
  `disabled` keeps meaning exactly one thing — and the tap answers in the status line and in
  announce(): the draft is still on screen, still selectable, and the teacher can copy it by hand.
  A refusal that says what happened is the shape WO-4.2 shipped; a button that does nothing at all
  is the shape this app does not.

  ── AND THE PROMISE'S ONLY JOB IS TO REPORT ──

  Everything that could matter has already happened by the time it settles: the string was built
  from the model, the string was handed to the platform. What the `.then` does is write one sentence
  and repaint with `fields: false`, for recordHandoff()'s reason — the two boxes hold exactly what
  was just copied, and writing their values back would move the caret of a teacher still reading
  them. The rejection path is not an error tone: a clipboard the browser would not open is not
  something wrong with the DRAFT, and the block strip is the only thing here that speaks about that.
*/
export function copyDraft() {
  const model = outreachModel();
  /* THE SAME QUESTION paintOpen() ASKED, ASKED AGAIN — recordHandoff()'s rule, and its reason: a
     disabled button is a refusal the browser enforces and "the markup says so" is not the kind of
     answer this app makes about a disclosure. Presentation mode arrives through this same door,
     because the model returns before it has a recipient and `clipboard` is '' with `url`. */
  if (!model.open || !model.ready || !model.clipboard) return false;

  const api = navigator.clipboard;
  if (!api || typeof api.writeText !== 'function') return copyRefused(
    'This browser will not let Planbook reach the clipboard. The draft is still here — select the '
      + 'subject and the message above and copy them yourself.');

  let handed;
  try {
    handed = api.writeText(model.clipboard);
  } catch (e) {
    return copyRefused('The clipboard would not open, so nothing was copied. The draft is still '
      + 'here — select the subject and the message above and copy them yourself.');
  }
  Promise.resolve(handed).then(() => {
    status = COPIED_NOTE;
    renderOutreach({ fields: false });
    /* SPOKEN AS WELL AS DRAWN — WO-5.7's third Acceptance line wants both, and it wants both for
       the reason this file's status line exists at all: the acknowledgement is one short line of
       type under a row of buttons, which is precisely what a screen reader has no reason to be
       looking at. */
    announce('Copied to your clipboard.');
  }, () => {
    copyRefused('The clipboard would not open, so nothing was copied. The draft is still here — '
      + 'select the subject and the message above and copy them yourself.');
  });
  return true;
}

/* WHAT A REFUSED COPY SAYS. One sentence, in the line every other act in this flow reports through,
   and spoken as well — the same pair the success takes, because a teacher who cannot see the status
   line has exactly the same need to know the clipboard is empty as to know it is full. It is NOT
   COPIED_NOTE, so the button's label stays at its resting word: the comparison at the model is the
   whole of that bookkeeping. */
function copyRefused(sentence) {
  status = sentence;
  renderOutreach({ fields: false });
  announce(sentence);
  return false;
}

/* The block strip's one control: to the half of the draft the field is in. It does not select the
   token — the field is the answer to "where do I fix this", and a selection made from here would be
   a caret moved out from under a teacher who was already typing (src/templates-view.js's jumpTo). */
export function jumpTo(where) {
  const node = document.getElementById(where === 'subject' ? SUBJECT_ID : BODY_ID);
  if (node && typeof node.focus === 'function') node.focus({ preventScroll: true });
}
