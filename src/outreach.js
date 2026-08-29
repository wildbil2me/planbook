/*
  The send flow's model — who a draft can be addressed to, and the `mailto:` URL that hands it
  over to the teacher's own mail client (WO-5.3).

  ── WHAT THIS FILE IS, AND THE ONE IT IS NOT ──

  It is the MODEL: the list of people this student can be written to, the mapping from one of those
  people onto the audience a template is filed under, the URL, and the practical ceiling on that
  URL's length. It draws nothing and it navigates nowhere — the screen is src/outreach-view.js and
  the handoff itself is a real link on that screen. The split is src/templates.js / src/templates-
  view.js's and src/log.js / src/log-sheet.js's, for their reason: what a recipient IS and what a
  `mailto:` URL IS are questions with one answer, and a harness can ask them without a browser.

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
  this file produces is a STRING. The operating system decides what to do with it.

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
  ADDRESSES. Percent-encoded like everything else and then the `@` is put back, because RFC 6068's
  grammar for the `to` part and for a `cc` header value is a bare addr-spec — `local@domain` with
  the `@` literal. `encodeURIComponent` escapes it to `%40`, which every modern client decodes and
  which older Windows handlers have historically mangled. The encoding still runs, so a space, a
  comma or a stray `?` in a field a teacher typed cannot break the URL apart; only the one character
  the grammar wants literal is restored.
*/
function encodeAddress(address) {
  return encodeURIComponent(text(address).trim()).replace(/%40/g, '@');
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
  ONE DRAFT AS A `mailto:` URL. `to` and `cc` are addresses, `subject` and `body` are the teacher's
  own text as it stands in the box in front of her.

  A HEADER WITH NOTHING IN IT IS LEFT OUT ALTOGETHER rather than sent empty: `?cc=&subject=…` is a
  legal URL that some clients read as a recipient called "" and others as a header they should
  ignore, and there is no reason to find out which.
*/
export function mailtoUrl(draft) {
  const d = draft || {};
  const parts = [];
  const cc = text(d.cc).trim();
  const subject = text(d.subject);
  const body = text(d.body);
  if (cc) parts.push('cc=' + encodeAddress(cc));
  if (subject) parts.push('subject=' + encodeField(subject));
  if (body) parts.push('body=' + encodeField(body));
  return 'mailto:' + encodeAddress(d.to) + (parts.length ? '?' + parts.join('&') : '');
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
  nothing to do with what gets cut.

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
