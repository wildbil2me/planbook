/*
  The send flow's model — who a draft can be addressed to, the `mailto:` URL that hands it over to
  the teacher's own mail client (WO-5.3), the same draft as plain text for a clipboard (WO-5.7), and
  the same draft as a Gmail or Outlook compose URL for a teacher whose mail is a browser tab
  (WO-5.12). Since WO-5.14 every one of those takes a LIST of addresses in `to` and in `cc`, and the
  header the non-primary recipients ride in is ruled on here, before the picker that will fill it
  exists — § "which header the non-primary recipients ride in", below.

  ── WHAT THIS FILE IS, AND THE ONE IT IS NOT ──

  It is the MODEL: the list of people this student can be written to, the mapping from one of those
  people onto the audience a template is filed under, the URL, the practical ceiling on that URL's
  length, and the plain-text block WO-5.7 puts on the clipboard. It draws nothing and it navigates
  nowhere — the screen is src/outreach-view.js, the handoff itself is a real link on that screen and
  the clipboard write is that screen's too, because it has to happen inside the tap. The split is
  src/templates.js / src/templates-view.js's and src/log.js / src/log-sheet.js's, for their reason:
  what a recipient IS, what a `mailto:` URL IS and what a pasteable draft IS are questions with one
  answer each, and a harness can ask all three without a browser.

  IT IS NOT A RESOLVER AND IT IS NOT A SECOND OPINION ABOUT ONE. `{{field}}` becomes text in exactly
  one place — src/merge-fields.js — and nothing here reads a token, splits one, or looks anything up
  by one. `tokensLeftIn()` below COUNTS the ones still on the page after a teacher has edited the
  draft; it fetches nothing, and its whole job is to answer the resolver's own sentence, which says
  a draft "cannot be sent until it is corrected or removed".

  ── SENDING MAIL OURSELVES IS OUT OF SCOPE, IN ANY FORM, EVER ──

  WO-5.3's Out of scope line, and it is CLAUDE.md's architecture rather than this work order's
  preference: a mail scope reads "Send email as you" on the consent screen, and the teacher's own
  sent-mail record — which is what a school asks for when it asks — stays intact only if the message
  leaves from her client. So there is no SMTP here, no API, no scope, and no fetch of any kind. What
  this file produces is a STRING — three of them since WO-5.12, and none of them is a message being
  sent. The operating system decides what to do with the first, the teacher pastes the second, and
  the third is an https link to a compose page that the browser opens as an ordinary tab.

  ── A RECIPIENT IS NOT AN AUDIENCE, AND THE TWO LISTS ARE DIFFERENT LENGTHS ──

  WO-5.3's Deliverables ask for "guardian 1 / guardian 2 / counselor / admin". src/templates.js's
  `AUDIENCES` has four values and only one of them is `guardian`. They are not the same list and
  neither is wrong:

      A RECIPIENT is a PERSON WITH AN ADDRESS — this student's first guardian, her second, her
      counselor, the administrator from Settings, the student herself. There are as many guardian
      recipients as the roster holds guardians.

      AN AUDIENCE is the DRAWER A TEMPLATE IS FILED UNDER — who the words were written for. Both
      guardians read the same drawer, because a message written to a guardian reads the same to
      either of them; what makes it personal is `{{guardian.name}}`, and that resolves to the
      guardian the teacher actually picked (src/merge-fields.js's `guardianFor()` takes a chosen
      guardian and says at its own definition that this work order is what hands one over).

  So `audienceOf()` below maps recipient → audience, and **`AUDIENCES` is not widened**. Adding a
  `guardian2` value to that enum would put a second drawer in the template editor that nobody would
  ever file anything in, and would make `templatesFor(doc, tone, 'guardian')` wrong on the day a
  teacher wrote her first template for it.

  ── THE COUNSELOR IS `students[].counselor` AND IS NOT THE CASE MANAGER ──

  Two different people in this schema, and one of them is behind the accommodation fence. The
  counselor is a contact on the roster like a guardian; the case manager lives on the supports block
  with the plan, the medical need and the review date, and CLAUDE.md § Accommodations is the whole
  of why nothing here reads it. **There is no read of a support block anywhere in this file**, and
  the address list below is built out of `guardians[]`, `counselor`, `doc.teacher` and the student's
  own `email` — four names, all of them ordinary contact fields.

  ── AND THERE IS NO WRITER IN THIS FILE ──

  Nothing here imports the store, nothing pushes to a collection, and `newYearDocument()` gained
  nothing for either work order that has touched this file. The document is byte-identical either
  side of a draft, and it stayed that way when WO-5.4 landed: **the contact log is written by the
  SCREEN** — src/outreach-view.js's recordHandoff(), through src/log.js's writeContact() — for the
  reason this file and that one are two files at all. This one answers who a draft can go to and
  what a `mailto:` URL is, and neither question has an answer that involves the document changing.

  **AND SINCE WO-5.7 THAT PARAGRAPH IS ASSERTED RATHER THAN PROMISED.** `tools/wo-sweep.mjs` § 24
  greps this file for a store call, a document mutation and an import of `./store.js`, in § 17's own
  shape and for § 17's own reason: the browser harness proves that today's copy left `rev` where it
  found it, and a grep proves there is nothing in the file that COULD move it on any input. The two
  are not redundant and neither one alone is the claim. The same section reads copyDraft() in
  src/outreach-view.js, because that function is on the copy path and its own file has a writer in
  it — so the boundary is asserted where it actually runs rather than only where it is easy.
*/

import { fullName } from './roster.js';

/* ────────────────────────────── the people ──────────────────────────────

   Local and tolerant, the three lines src/merge-fields.js and src/signals.js each keep for
   themselves: a collection missing from a hand-edited or restored file is an empty one, not a
   throw. A send flow that dies takes the teacher's draft with it. */

function arrayOf(value) { return Array.isArray(value) ? value : []; }
function text(value) { return value === null || value === undefined ? '' : String(value); }

/*
  WHICH DRAWER A RECIPIENT'S TEMPLATES COME OUT OF. One line, and it is the whole of the mapping the
  header argues for: every guardian is the `guardian` audience, and the other three recipients name
  their own.

  A recipient whose kind this build does not know falls to `guardian` rather than to `undefined`,
  the arrangement src/templates.js's `toneOf()` takes: a list that quietly went empty is worse than
  a list that offered the wrong drawer, because only one of them is visible.
*/
export function audienceOf(recipient) {
  const kind = text(recipient && recipient.kind);
  if (kind === 'counselor' || kind === 'admin' || kind === 'student') return kind;
  return 'guardian';
}

/*
  EVERY PERSON THIS STUDENT CAN BE WRITTEN TO, in the order WO-5.3's Deliverables name them:
  guardians in roster order, then the counselor, then the administrator, then the student.

  A RECIPIENT WITH NO ADDRESS IS STILL ON THE LIST, AND THAT IS A RULING RATHER THAN AN OVERSIGHT.
  It is drawn, it says what is missing, and it blocks the handoff — because a row that was simply
  left out is a row a teacher reads as "this app cannot write to a counselor", when what is actually
  true is "there is no counselor on this roster". An absence and a bug look identical; the app's own
  phrase, from src/calendar-view.js. The one thing that is never done is opening a mail client with
  an empty To field, which is a blank message a teacher sends to herself by accident.

  A GUARDIAN WITH NEITHER A NAME NOR AN ADDRESS IS NOT A PERSON and is skipped — that is an empty
  row of the roster's own editor rather than somebody with a missing email.

  `student` IS ON THE LIST BECAUSE src/templates.js PUT IT ON `AUDIENCES` and wrote down why at its
  own definition: "a message TO the student is the one a praise template most often is". Four of the
  eight starters are written for her. WO-5.3's Deliverables name four picker options and this is a
  fifth; the alternative was shipping a picker that can never reach two of the app's own eight
  templates, and `templatesFor(doc, tone, 'student')` never being called by anything.
*/
export function recipientsFor(doc, student) {
  const out = [];
  arrayOf(student && student.guardians).forEach((guardian, at) => {
    if (!guardian) return;
    const name = text(guardian.name).trim();
    const email = text(guardian.email).trim();
    if (!name && !email) return;
    out.push({
      key: 'guardian-' + at,
      kind: 'guardian',
      /* The label is the POSITION, never the name — the drawing's chips are short strings and a
         guardian called Bartholomew Featherstonehaugh must not put a modal into sideways scroll at
         390px. Who that is by name is the line under the row, where it can wrap. */
      label: 'Guardian ' + (at + 1),
      name: name,
      email: email,
      /* The record itself, handed to src/merge-fields.js as `request.guardian` so that
         `{{guardian.name}}` resolves to the person the teacher picked rather than to the preferred
         one. That parameter is WO-5.1's, left open for this work order by name. */
      guardian: guardian,
    });
  });

  const counselor = (student && student.counselor) || null;
  out.push({
    key: 'counselor', kind: 'counselor', label: 'Counselor',
    name: text(counselor && counselor.name).trim(),
    email: text(counselor && counselor.email).trim(),
    guardian: null,
  });

  const teacher = (doc && doc.teacher) || null;
  out.push({
    key: 'admin', kind: 'admin', label: 'Admin',
    /* An administrator has an address in Settings and no name anywhere — `teacher.adminEmail` is
       the whole of what this app knows about that person. The address stands in for the name rather
       than a placeholder being invented for it. */
    name: text(teacher && teacher.adminEmail).trim(),
    email: text(teacher && teacher.adminEmail).trim(),
    guardian: null,
  });

  out.push({
    key: 'student', kind: 'student', label: 'Student',
    name: fullName(student),
    email: text(student && student.email).trim(),
    guardian: null,
  });
  return out;
}

export function recipientByKey(list, key) {
  const want = text(key);
  return arrayOf(list).filter((r) => r && r.key === want)[0] || null;
}

/* ────────────────────────────── the tokens still on the page ──────────────────────────────

   ARITHMETIC OVER A STRING, AND NOT A LOOKUP OF ANY KIND. src/templates-view.js's countTokens()
   applied to the other end of the same rule: it matches `{{…}}`, trims what is inside, and puts the
   names in a list. Nothing is fetched, nothing is indexed by what it finds, and the same name twice
   is one name because src/merge-fields.js dedupes its errors the same way.

   WHY THE SEND FLOW NEEDS IT AT ALL, when the resolver already answered. `resolveDraft()` runs once
   per template-and-recipient choice and hands back `blocked` plus a named error per field — that is
   the answer, and this file does not second-guess it. But the draft is EDITABLE after that, always,
   and the resolver's own error message says the draft "cannot be sent until it is corrected or
   removed". Honouring the *removed* half means reading what is on the page now: a teacher who types
   a guardian's name over `{{guardian.name}}` has fixed the draft, and a send button that stayed
   dead would make the feature useless for exactly the student it was written about.

   The regexp is src/merge-fields.js's TOKEN, copied rather than imported: that constant is private
   to the resolver and exporting it would make a second surface's parsing a thing that file has to
   keep working. Two identical regexps that describe the same three characters are not the "second
   truth" this repo refuses — a resolver and a counter are different jobs. */
const TOKEN = /\{\{([^{}]*)\}\}/g;

export function tokensLeftIn(source) {
  const seen = [];
  text(source).replace(TOKEN, (whole, inner) => {
    const name = String(inner).trim();
    if (seen.indexOf(name) < 0) seen.push(name);
    return whole;
  });
  return seen;
}

/* ────────────────────────────── the URL ──────────────────────────────

   RFC 6068, and the three things in it that go wrong quietly.
*/

/*
  ONE SHAPE ONLY: `to` AND `cc` ARE LISTS, AND A STRING IS REFUSED RATHER THAN WRAPPED (WO-5.14).
  Every builder below takes a draft whose `to` and `cc` are arrays of addresses — one element each
  for the draft the screen builds today, several once WO-5.8's picker exists — and there is
  deliberately no branch that also accepts a bare string "so nothing breaks". A builder that took
  both would be two truths about what a draft is, and the string one is the one that rots: it stays
  green on every one-recipient fixture while the picker hands over a list, and on the day the two
  disagree nothing in this file can say which it meant. So a string is a `TypeError` naming the
  field, and so is anything else that is not an array.

  THAT IS A THROW IN A FILE WHOSE OWN HEADER ARGUES FOR TOLERANCE, and the two are not in tension.
  `arrayOf()` above forgives a collection missing from a hand-edited or restored DOCUMENT, because a
  teacher's file is not this app's to refuse. A draft object is not a document: it is built by
  src/outreach-view.js in exactly two places, and a wrong shape there is a programming error the
  harness drives on every run. The one silent alternative — read a string as no addresses — is a
  `mailto:` with an empty To, which recipientsFor() above says is the one thing never done. An
  ABSENT field (`undefined`, `null`) IS an empty list, because an absent header is a header left
  out, which is the rule mailtoUrl() has kept about `cc` since WO-5.3.

  BLANKS ARE DROPPED, so `['a@x', '']` is one address and `['']` is no header at all: a trailing
  comma in a `to` list is a malformed list, and an empty `cc=` is the header some clients read as a
  recipient called "".
*/
function addressList(value, field) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new TypeError('draft.' + field + ' must be a list of addresses, not ' + typeof value);
  }
  return value.map((a) => text(a).trim()).filter(Boolean);
}

/*
  ADDRESSES. Percent-encoded like everything else and then the `@` is put back, because RFC 6068's
  grammar for the `to` part and for a `cc` header value is a bare addr-spec — `local@domain` with
  the `@` literal. `encodeURIComponent` escapes it to `%40`, which every modern client decodes and
  which older Windows handlers have historically mangled. The encoding still runs, so a space, a
  comma or a stray `?` in a field a teacher typed cannot break the URL apart; only the one character
  the grammar wants literal is restored.

  A LIST IS ENCODED ONE ADDRESS AT A TIME AND JOINED AFTER, AND THE ORDER OF THOSE TWO STEPS IS THE
  WHOLE OF IT (WO-5.14). RFC 6068 § 2 gives `to = addr-spec *("," addr-spec)`: several addresses in
  one header are separated by a comma the grammar wants LITERAL, exactly as it wants the `@`.
  Encoding a comma-joined string and restoring only the `@` hands back `a@x%2Cb@y`, which a client
  reads as ONE address with a `%2C` in the middle of it — so the map runs first and the join runs on
  what it produced. Nothing restores a `%2C` the way the `@` is restored, because a comma INSIDE an
  address a teacher typed is precisely the character that must not survive as a separator. Both
  compose pages take the same comma-separated list in `to=` and `cc=` and are handed the same
  string; an empty list is the empty string, and every caller leaves that header out before it
  gets here.
*/
function encodeAddresses(list) {
  return list.map((a) => encodeURIComponent(a).replace(/%40/g, '@')).join(',');
}

/*
  THE BODY, AND THE LINE BREAK IS THE PART THAT GOES WRONG QUIETLY. RFC 6068 § 5: a line break in a
  body must be encoded as `%0D%0A`. A `<textarea>` hands back `\n` on every platform, so the text is
  normalised to CRLF FIRST and encoded after — encoding a bare `\n` produces `%0A`, which Apple Mail
  and Gmail accept and which some Windows handlers run together into one paragraph. Getting it wrong
  produces a mangled email a teacher sends without noticing, which is WO-5.3's Traps line.

  Everything else is `encodeURIComponent` and nothing else. It is the right function rather than
  `encodeURI` for the reason the two exist: this is one COMPONENT of a URL, and the characters that
  must not survive it are exactly `&`, `?` and `#` — an unencoded `#` in a body truncates the message
  at that character with no error anywhere, and it is the character a teacher types when she writes
  "#3 on the worksheet".

  An apostrophe (`'`) and the typographic one (`’`) are both handled and neither is special:
  `encodeURIComponent` leaves the ASCII one alone, which RFC 6068 permits, and turns the curly one
  into `%E2%80%99`. An em dash becomes `%E2%80%94`. Both are in the eight starter templates.
*/
function encodeField(value) {
  return encodeURIComponent(text(value).replace(/\r\n|\r|\n/g, '\r\n'));
}

/*
  ──────────── WHICH HEADER THE NON-PRIMARY RECIPIENTS RIDE IN (WO-5.14) ────────────

  **Cc.** The primary is alone in To; every other recipient of the same message — the second
  guardian, the counselor, the teacher's own copy — rides in Cc; and there is no Bcc anywhere in
  this file, which is a choice and not an omission. WO-5.8's picker is built to this and does not
  re-open it. The argument is a disclosure one — who, among the people on one message, can see
  whose address — and it is made here rather than in the picker because this is the file in which a
  header is a header: the three serialisers below are the only code that ever writes `cc=` or
  `Cc:`, and a ruling kept beside the thing it governs is one a later reader can disagree with on
  its own terms.

  WHAT EACH HEADER DISCLOSES. To and Cc are both visible to everyone on the message, so between
  those two nothing is hidden and the difference is what the header SAYS: To says "this is written
  to you", Cc says "you were told too". Bcc is the only header that hides anything, and what it
  hides is asymmetric — the Bcc'd person sees who the message was To, and the To person never
  learns the Bcc'd one exists.

  WHOSE ADDRESS IS ACTUALLY AT STAKE. A guardian and a counselor are not peers, but the address
  each would see is not a secret from the other. A counselor's or an administrator's address is a
  school address: institutional, in the directory, the address a guardian is meant to be able to
  write to. A guardian's address is on the roster because the school already holds it, so a
  counselor reading it off a Cc line learns nothing the school did not have. The one pair for whom
  a shared line CAN be a disclosure is two guardians of one student who are not one household — a
  separated parent, a guardian with an order in place — and that is not a question a header
  answers. It is the question of whether those two belong on ONE message at all, which is the
  teacher's judgment per message and the picker's to leave with her: a message that must not join
  two people is two messages, which is what this flow has done since WO-5.3. Bcc would make that
  mistake invisible rather than impossible — the second guardian still reads the first's address
  off the To line — and would hide it from the teacher's own sent-mail record as well.

  WHY NOT BCC, EVEN SO. This is a message about a child, and the primary is usually her parent. A
  copy to the counselor is worth sending precisely because the guardian should know the counselor
  is in the loop, and the counselor should know the guardian was told — "these people were told
  too" is what a counselor copy is FOR. Bcc'ing a counselor on a note home is a teacher quietly
  telling a third party about a family's business under a header the family cannot see, which is
  its own kind of dishonesty on a message about somebody's child. It is honest either way round:
  a copy that should not be seen is a separate message written to the counselor, and a copy that
  should be seen is a Cc.

  WHY NOT SEVERAL IN TO. The body is written to ONE person — every merge field resolves against
  the primary and the salutation names her, which is WO-5.8's second Acceptance line — so a To line
  naming three people over a "Dear Ms Okafor" is a message whose header disagrees with its own
  first line. Cc is the header whose meaning matches the text.

  WHAT THIS DOES TO THE CODE: NOTHING A BUILDER CAN SEE. `to` is a list below because RFC 6068's
  `to` is a list, and `cc` is a list because a header is; WHICH addresses go in which is decided by
  whoever builds the draft — src/outreach-view.js, one primary and the copy-to-self today — and the
  three serialisers carry what they are handed. That is deliberate: a reader who reverses this
  ruling changes two lines in the view and touches no encoder. A `bcc` would be a third list field
  carried through all three builders under the same empty-header rule, and nothing here needs one.
*/

/*
  ONE DRAFT AS A `mailto:` URL. `to` and `cc` are lists of addresses, `subject` and `body` are the
  teacher's own text as it stands in the box in front of her.

  A HEADER WITH NOTHING IN IT IS LEFT OUT ALTOGETHER rather than sent empty: `?cc=&subject=…` is a
  legal URL that some clients read as a recipient called "" and others as a header they should
  ignore, and there is no reason to find out which.
*/
export function mailtoUrl(draft) {
  const d = draft || {};
  const parts = [];
  const to = addressList(d.to, 'to');
  const cc = addressList(d.cc, 'cc');
  const subject = text(d.subject);
  const body = text(d.body);
  if (cc.length) parts.push('cc=' + encodeAddresses(cc));
  if (subject) parts.push('subject=' + encodeField(subject));
  if (body) parts.push('body=' + encodeField(body));
  return 'mailto:' + encodeAddresses(to) + (parts.length ? '?' + parts.join('&') : '');
}

/*
  ────────────────────────── HOW LONG A `mailto:` CAN BE ──────────────────────────

  **2,000 characters of assembled URL, and the number is the Windows desktop rather than the iPad.**
  WO-5.3's Acceptance asks for the practical ceiling to be found and documented, and the honest
  finding is that there is no single answer — this is the tightest of several, reasoned from the
  documented limits rather than measured on every client a teacher might have:

    · **Windows, any browser, any handler: ~2,048.** A `mailto:` is handed to the shell, and
      `ShellExecute` caps what it will carry at 2,083 characters; Internet Explorer's address bar
      carried the same figure for the same reason, and Outlook's own handler has cut at about 2,048
      for two decades. Past it the message arrives TRUNCATED, with no error and no gap — which is
      why this is a warning before the fact rather than a check afterwards.
    · **macOS and iOS Mail: several thousand at least.** Neither documents a limit and neither is
      the binding constraint; a draft that fits the figure above fits these comfortably.
    · **Chrome and Edge pass the URL through to the OS handler**, so the browser is not the ceiling
      on any platform — the handler is.

  So 2,000 leaves a little headroom under the tightest documented figure and is the number this app
  warns at. It is measured on the ENCODED URL, which is the string the operating system actually
  receives: a body of plain ASCII is close to its own length, but every line break costs six
  characters (`%0D%0A`) and every em dash costs nine, so a 1,400-character message with paragraphs
  in it can be over this line. Counting the teacher's typing instead would report a number that has
  nothing to do with what gets cut. And since WO-5.14 the addresses are in the same budget: every
  recipient in `to` and `cc` is in the string the shell receives, so a draft that fits with one
  guardian can be over the line with two and the counselor, and it is overCeiling() — measured on
  the whole URL, not on the body — that says so. Nothing is recounted; the URL contains every
  address, so the count is right by construction.

  **NOTHING HERE TRUNCATES ANYTHING.** The whole URL is handed over whatever its length; the warning
  says what some clients will do with it and leaves the decision where every other decision in this
  flow sits, which is with the teacher reading the draft. Silent truncation is the failure mode
  WO-5.3's Acceptance line is written against, and an app that trimmed the body to fit would be
  committing it on purpose.
*/
export const MAILTO_CEILING = 2000;

export function overCeiling(url) {
  return text(url).length > MAILTO_CEILING;
}

/*
  ──────────────── THE SAME DRAFT AS A WEBMAIL COMPOSE URL (WO-5.12) ────────────────

  THE THIRD DOOR, AND IT IS THE ONE THAT MAKES THE FIRST DOOR HONEST ABOUT WHO IT IS FOR. `mailto:`
  was only ever the right door for a teacher with a desktop mail client, and at a Google Workspace
  school most teachers' mail is Gmail in a browser tab. WO-5.11 found what a `mailto:` does there:
  with Gmail registered as Chrome's handler, a same-window link navigates the installed PWA to
  Gmail's bare compose page and loses the app, and a `_blank` link opens a tab that sits blank on the
  URL and never reaches the handler at all (src/outreach-view.js's header, fourth reason). The app
  cannot see a browser's protocol-handler table, so it cannot even say what happened. What it CAN do
  is stop asking the handler: both webmails have a plain https compose URL, and an https link with
  `target="_blank"` from an installed PWA opens an ordinary browser tab, reliably — it is how the
  About modal's two document links already work.

      Gmail     https://mail.google.com/mail/?view=cm&fs=1&to=…&cc=…&su=…&body=…
      Outlook   https://outlook.office.com/mail/deeplink/compose?to=…&cc=…&subject=…&body=…

  WHICH DOOR IS A FACT ABOUT THE BROWSER, NOT ABOUT THE TEACHER AND NOT ABOUT THE DRAFT, and it is
  handed in as `mail` rather than read here: src/prefs.js's `mailDoor` says at its own definition
  why it is a `planbook_` key and not a field in the document (the owner's laptop is Gmail and the
  owner's iPad is Mail — one synced answer is wrong on one of them by construction), and this file
  reads no preference for the reason it reads no store. mailDoorOf() below is the whole of the
  vocabulary: three strings, and anything else is the default.

  IT READS THE SAME DRAFT OBJECT mailtoUrl() READS, so the doors cannot disagree about what is in
  the message, and it keeps mailtoUrl()'s rule about an empty header — left out, never sent as
  `cc=` — for that function's reason. What differs is the encoding, and the line break is again the
  whole of it:

    · **THE LINE BREAK IS LF HERE, AND THAT IS THE QUESTION RE-ASKED RATHER THAN INHERITED.**
      encodeField() normalises to CRLF because RFC 6068 § 5 says a `mailto:` body's break arrives
      as `%0D%0A`, and that is a rule about the `mailto:` scheme. This is not a `mailto:`. It is a
      query string on an https URL that a WEB PAGE decodes and drops into its own compose box —
      the same kind of destination a `<textarea>` is, and a textarea's convention is LF on every
      platform. A CRLF handed to a page that is expecting text can arrive as a break plus a bare
      `\r`, which is exactly the doubled-paragraph shape draftText() records for the clipboard, one
      door over. So the body is normalised to LF here as deliberately as it is normalised to CRLF
      in encodeField(), and the two are two answers to two questions rather than one of them being
      the other's oversight. WO-5.12's laptop reading — *paragraph breaks intact* — is the reading
      that checks this ruling on the one webmail the owner has.
    · **Everything else is `encodeURIComponent`**, for encodeField()'s reason: `&`, `?` and `#`
      are the characters that must not survive into a query component, and `#3 on the worksheet`
      is a thing a teacher types.
    · **The address keeps its `@` literal**, through encodeAddresses(), because both compose pages
      accept either form and the readable one is the one a teacher can check in the address bar.
      Several addresses are the same comma-separated list the `mailto:` carries (WO-5.14): both
      compose pages read `to=a@x,b@y` as two recipients, and one string for three doors is one
      fewer thing for the doors to disagree about.

  THERE IS NO KNOWN CEILING, AND THE WARNING SAYS SO RATHER THAN INVENTING ONE. MAILTO_CEILING is
  `ShellExecute`'s documented limit on a string the operating system is handed, and a browser
  following an https link hands nothing to the operating system: Chrome carries a URL of about two
  megabytes. What is not documented anywhere is what Gmail or Outlook does with a compose URL whose
  `body=` runs to many thousands of characters — Gmail has been observed to drop very long bodies
  silently, and neither site publishes a figure. So ceilingFor() answers `null` for a webmail door,
  and src/outreach-view.js draws a sentence that says Planbook cannot know where this door cuts,
  rather than a number nobody measured. The warning still appears at MAILTO_CEILING's 2,000, as a
  conservative trigger and not as a claim: a draft short enough for the tightest documented mail
  handler is a draft nothing is known to cut, and one over it is one worth a glance either way.

  WHAT THIS DOES TO THE PRIVACY POLICY IS THE PART WO-5.12 PUT BEFORE THE CODE. A `mailto:` hands
  the draft to the operating system; this hands it, in the URL, to a page on `mail.google.com` or
  `outlook.office.com` — the same site the message is about to be sent from, on the teacher's own
  tap and on no other, but a change to what the data-flow statement says all the same. `privacy.html`
  § *What leaves your device* and `docs/FERPA.md`'s twin were rewritten in the same sitting, word
  for word, before this function existed; change what this function does and change them first.

  NO `window.open()`, NO handler detection, NO Google script. What this file produces is a STRING,
  and the anchor in index.html is the mechanism — the same anchor, with `target` and `rel` set by
  paintOpen() when and only when the string starts with `https:`.
*/

/* The three doors, in the order the chips are drawn, with the words on them. */
export const MAIL_DOORS = [
  { id: 'default', label: 'Default mail app', name: 'your mail app' },
  { id: 'gmail', label: 'Gmail in the browser', name: 'Gmail' },
  { id: 'outlook', label: 'Outlook on the web', name: 'Outlook on the web' },
];

/* A stored preference read back as one of the three ids. Anything that is not 'gmail' or
   'outlook' — an absent key, an older build's value, a hand-edited string — is the `mailto:`. */
export function mailDoorOf(value) {
  const id = text(value);
  return MAIL_DOORS.some((d) => d.id === id) ? id : 'default';
}

/* The door's own words, for a sentence on screen: "Gmail", "Outlook on the web", "your mail app". */
export function mailDoorName(mail) {
  const id = mailDoorOf(mail);
  return MAIL_DOORS.filter((d) => d.id === id)[0].name;
}

/* A compose field: LF, then `encodeURIComponent` — see the block above for why not CRLF. */
function encodeComposeField(value) {
  return encodeURIComponent(text(value).replace(/\r\n|\r|\n/g, '\n'));
}

/*
  ONE DRAFT AS A WEBMAIL COMPOSE URL, for `mail` = 'gmail' or 'outlook'. Handed 'default' or anything
  else it answers the `mailto:` — so a caller that always calls this gets the right door for every
  preference, and there is no value of `mail` for which the draft has no URL.
*/
export function composeUrl(draft, mail) {
  const id = mailDoorOf(mail);
  if (id === 'default') return mailtoUrl(draft);
  const d = draft || {};
  const to = addressList(d.to, 'to');
  const cc = addressList(d.cc, 'cc');
  const subject = text(d.subject);
  const body = text(d.body);
  const parts = ['to=' + encodeAddresses(to)];
  if (id === 'gmail') {
    if (cc.length) parts.push('cc=' + encodeAddresses(cc));
    if (subject) parts.push('su=' + encodeComposeField(subject));
    if (body) parts.push('body=' + encodeComposeField(body));
    return 'https://mail.google.com/mail/?view=cm&fs=1&' + parts.join('&');
  }
  if (cc.length) parts.push('cc=' + encodeAddresses(cc));
  if (subject) parts.push('subject=' + encodeComposeField(subject));
  if (body) parts.push('body=' + encodeComposeField(body));
  return 'https://outlook.office.com/mail/deeplink/compose?' + parts.join('&');
}

/* How long a URL through this door may be before some client cuts it: MAILTO_CEILING for the
   `mailto:`, and `null` — "Planbook cannot know" — for a webmail compose page. See the block above
   for why null is the honest answer and not a placeholder for a number still to be found. */
export function ceilingFor(mail) {
  return mailDoorOf(mail) === 'default' ? MAILTO_CEILING : null;
}

/*
  ────────────────────── THE SAME DRAFT AS PLAIN TEXT (WO-5.7) ──────────────────────

  THE SECOND HONEST DOOR OUT OF A DRAFT, and it is a second SERIALISER of the four fields above
  rather than a second draft. `mailto:` opens the machine's DEFAULT mail client, and a teacher whose
  real mail is Gmail in a browser tab has no default worth opening: she can see a finished message
  on screen and no way to get it into the window she actually writes email in. Handing her the text
  costs no permission at all, which is the whole argument — between "open your desktop client" and
  "grant us your mailbox" there is a third option and this is it. The header above still governs:
  what this file produces is a STRING, and somebody else decides what to do with it.

  IT READS THE SAME DRAFT OBJECT `mailtoUrl()` READS, so the two doors cannot come to disagree about
  what is in the message. What differs is the encoding, and none of the differences is cosmetic:

    · **The line break is `\n` here and `\r\n` there, and that is the point of departure.** RFC 6068
      § 5 requires a body's break to arrive as `%0D%0A`, which is why encodeField() normalises to
      CRLF *before* encoding. The clipboard's `text/plain` flavour takes the opposite convention: the
      Clipboard API is handed LF and the platform layer puts its own ending back — Chromium writes
      CRLF onto the Windows clipboard itself. Handing it CRLF as well is how a bare `\r` reaches a
      compose window that draws it as a second break, which is **WO-5.3's mangled-paragraph defect
      arriving through the other door**. So a draft is normalised to LF here exactly as deliberately
      as it is normalised to CRLF there, and neither normalisation is the other one's oversight.
    · **Nothing is percent-encoded**, because nothing is being put in a URL. The `#` in "#3 on the
      worksheet" truncates a `mailto:` at that character with no error anywhere; here it is four
      characters of a teacher's sentence and is left alone.
    · **There is no ceiling.** MAILTO_CEILING is `ShellExecute`'s limit on a string the operating
      system is handed, and a clipboard is not handed to it. Nothing about this string is measured,
      warned about or cut.

  WHAT IT PUTS IN, AND THE ONE HEADER THAT IS CONDITIONAL. The recipient, the subject and the body,
  in the order a compose window asks for them, with a blank line between the headers and the message
  — that blank line is what makes the block read as a message rather than as three fields run
  together. `Cc:` appears only when the list has somebody in it, which is the rule mailtoUrl()
  already keeps about an empty header and for its reason. A recipient with a name gets
  `Name <address>`, the form a To field parses when the whole line is pasted into it; a recipient
  whose "name" IS the address gets the address once, because `admin@school <admin@school>` is this
  app's own admin row (src/outreach.js's recipientsFor(), where an administrator has an address and
  no name anywhere) read back as a mistake.

  THE NAME BELONGS TO THE PRIMARY AND TO NOBODY ELSE ON THE LINE (WO-5.14). `to` and `cc` are lists
  here as they are at the other two doors, and `name` stays ONE string, because the primary is one
  person — the one the merge fields resolved against and the one the salutation names. So
  `Name <address>` is written for the FIRST address in `to` only, and any further To addresses ride
  bare after it, comma-separated, which is the form a compose window's To field parses when the
  line is pasted in whole. A name per address would mean a list of names beside a list of
  addresses and the two drifting apart by one position, and the screen has no second name to give
  in any case: it draws the primary's under the chips and nobody else's. Which addresses are in
  `cc` at all is the ruling above mailtoUrl(), and it is not re-decided here.

  A HEADER IS ONE LINE BY DEFINITION, so a line break inside the recipient or the subject is folded
  to a space. Neither box can produce one by typing — the subject is an `<input>` — but a template
  restored from a hand-edited backup can, and a `Subject:` carrying a break stops the block being
  readable as headers-then-message for every reader after it. The BODY is never folded: its breaks
  are the whole of what Acceptance line 1 is about.

  WHAT IT CANNOT PUT IN. Four fields is the whole of what it is handed. There is no document here,
  no student, no roster and no support block — so accommodation, medical and plan data is out of
  reach of the clipboard by construction, at exactly the distance it is out of reach of the URL.
*/

/* A header value, folded onto the one line a header is. Runs of whitespace that already contained a
   break collapse to a single space, so "line one\n\nline two" is not "line one  line two". */
function oneLine(value) {
  return text(value).replace(/\s*(?:\r\n|\r|\n)\s*/g, ' ').trim();
}

export function draftText(draft) {
  const d = draft || {};
  const to = addressList(d.to, 'to').map(oneLine);
  const name = oneLine(d.name);
  const cc = addressList(d.cc, 'cc').map(oneLine);
  const primary = to[0] || '';
  const lines = [];
  /* The primary with her name, then the rest of `to` bare — see the section header. */
  const first = name && primary && name !== primary ? name + ' <' + primary + '>' : (name || primary);
  lines.push('To: ' + [first].concat(to.slice(1)).filter(Boolean).join(', '));
  if (cc.length) lines.push('Cc: ' + cc.join(', '));
  lines.push('Subject: ' + oneLine(d.subject));
  /* The blank line, and then the message exactly as it stands in the box — LF, and nothing else
     touched. See this section's header for why that is the opposite of encodeField()'s answer. */
  lines.push('');
  return lines.join('\n') + '\n' + text(d.body).replace(/\r\n|\r|\n/g, '\n');
}
