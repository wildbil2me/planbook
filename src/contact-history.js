/*
  Contact history — who this teacher has written to about one student, on the two screens that ask
  (WO-5.4).

  ── WHY THIS IS A SECOND CARD AND NOT A WIDER READER ──

  The decision src/log.js's LOG_KINDS reserved for this work order, made here. Folding `contact`
  into that array would have put an email's subject line onto the card headed *"What you have
  written down"* — under a footer that promises the teacher *"None of this is printed, exported or
  put in a draft"*, which is a sentence about her own notes and would become false the moment a
  message she actually sent appeared beneath it. So the two lists never meet: visibleEntriesFor()
  hands back exactly behaviour and note, as it always did, and this file reads visibleContactsFor()
  and nothing else.

  It is also a different question. The log card answers *"what have I noticed about this child"*;
  this one answers *"what have I already said, to whom, and about which signal"* — which is the
  question a teacher asks with a guardian on the phone, and the question the cooldown answers for
  her one screen over. Two questions, two cards, side by side on the same record.

  ── WHAT A ROW SHOWS, AND THE ONE THING IT DELIBERATELY DOES NOT ──

  The audience, the subject, the day, and the signal that prompted it. **Not the body.** The record
  carries the whole message — WO-5.4's first Deliverable, and the backup carries it too — but a card
  holding four full emails is a card nobody reads, and the message itself is already in the
  teacher's own sent mail, which is the entire reason *Copy me* exists in the send flow. One line
  per contact is what makes a term's outreach readable at a glance. A later work order that wants
  the text on screen wants a disclosure, not a wrapper: it would be putting a paragraph naming a
  child onto a screen a guardian may be sitting in front of, and that is an argument to have on
  purpose.

  THERE IS NO *SHOW OLDER* CONTROL, unlike the log card next to it, and that follows from the line
  above rather than from taste: one-line rows do not need paging, and a control that hid outreach
  behind a tap would hide exactly the thing this card exists to make obvious. **This work order adds
  no control to any screen**, which is why it adds no stylesheet rule and no coarse-pointer line —
  every class here is one src/detail.css already owns.

  ── AND IT DECIDES NOTHING ABOUT PRESENTATION MODE ──

  Same arrangement as src/log-sheet.js, in as many words: there is no presentationMode() test in
  this file and there must never be one. src/log.js hands back a SHORTER LIST, because
  src/supports.js's logKindVisible() rounds a `contact` toward hiding — so a projected screen shows
  no contact at all, and this file could not count what it was never given. The empty sentence below
  is therefore the same sentence in both modes, deliberately: a student with nothing on file and a
  student whose every contact is suppressed must read identically, or the count arrives by wording
  instead of by number. tools/wo-sweep.mjs § 5 counts the askers.

  ── WHAT THIS FILE IS NOT ──

  IT IS NOT A WRITER. Nothing here imports the store, nothing calls update(), and the document is
  byte-identical either side of a paint. The one writer of a `contact` is src/log.js's
  writeContact(), called from src/outreach-view.js on the handoff — the same split src/log-sheet.js
  makes with the sheet it draws.

  IT OWNS NO NAVIGATION AND CHAINS NOTHING. Both surfaces are handed DOM and nothing else, the way
  src/pass-history.js's studentPassCard() and src/log-sheet.js's studentLogCard() are; src/shell.js
  owns the order things happen in and the repaint after a write.
*/

import { getDoc } from './store.js';
/* The reader, and the whole of what this file asks of the model: one student's contacts, newest
   first, with whatever may not be on screen already taken out. */
import { visibleContactsFor } from './log.js';
/* What a rule is CALLED, out of the engine's own settings table — the same call the signal card
   makes for the same string. A second list of rule names here would be a second thing to keep in
   step with SIGNAL_SETTINGS, and the first disagreement would be a card saying a teacher wrote
   home about something the list never fired for. */
import { ruleText } from './signals.js';
/* The word for an audience, out of the module that owns the enum (src/templates.js's AUDIENCES).
   The send flow files a draft under one of four drawers and this prints the drawer, so the chip on
   this card and the picker in the modal cannot come to say different things. */
import { audienceLabel } from './templates.js';
/* `2026-10-09` → `Oct 9`. The one short-date formatter in the app (WO-3.20), worn here exactly as
   the log card next to this one wears it. */
import { shortDate } from './date-text.js';

/* The id the signal card's section carries, so a contact written from that card can be redrawn
   into it without rebuilding the card around it — see refreshContactSection(). */
const CARD_SECTION_ID = 'signalCardContacts';

/*
  WHAT THE HISTORY IS CALLED, ONCE. It heads the card on the student record and the section on the
  signal card, and it is one string because they are one list read in two places — a heading that
  drifted would be the same evidence looking like two features.

  IT SAYS *WRITTEN TO* AND NOT *SENT*, and that is this work order's fourth Acceptance line arriving
  in the title rather than only in the small print. Planbook hands a draft to a mail app and cannot
  watch what happens next; "written to" is true of every row here, where "sent" would be a claim the
  app is in no position to make.
*/
const HISTORY_TITLE = 'Who you have written to';

/*
  THE EMPTY SENTENCE, ONCE, AND IT IS ABOUT THE CARD RATHER THAN ABOUT THE RECORD.

  src/log-sheet.js's ruling, inherited rather than re-made: any wording that could tell "nothing has
  been written" apart from "everything here is suppressed" would be the count arriving by another
  route. So it describes what this card shows and is true either way.
*/
const HISTORY_EMPTY = 'Nothing to show here yet — a message you hand to your mail app from a signal '
  + 'card or from this record appears here, newest first.';

/*
  WHAT "LOGGED" MEANS, IN THE PLACE THE HISTORY IS READ (Acceptance line 4).

  **The honest-copy half of the Deliverable, and the choice is deliberate.** The other half offered a
  *drafted → sent* pair with a control to mark one sent; that control is a SECOND WRITE TO AN ENTRY
  THAT ALREADY EXISTS, which the append-only rule forbids outright, and as a second ENTRY it would
  put two records in the log for one message — doubling what the cooldown reads and inviting the
  teacher to believe the app knows something it cannot know. `mailto:` returns nothing. The app never
  learns whether she pressed send, and no button on this card can make that true.
*/
const HISTORY_NOTE = 'Newest first. Planbook records the moment you handed a message to your mail '
  + 'app — it cannot tell whether you sent it from there, so this is what you wrote and when, not '
  + 'proof of delivery. Entries are never edited or deleted.';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/*
  ONE CONTACT. The audience chip, the subject, the day — and the rule that prompted it underneath.

  THE CHIP IS THE NEUTRAL ONE. `.log-entry-kind` without the `behavior` modifier, which src/detail.css
  reserves for the one kind that carries a colour, because a message home is a thing the teacher did
  and not a finding about a child.

  A CONTACT WITH NO RULE PRINTS NO LINE, rather than a line saying so. A draft opened from the
  student record about a student nothing has fired for is about no signal, `ruleId` is `''`, and the
  honest rendering of "about no particular signal" is silence — the same posture src/log.js takes
  when it lets that contact silence nothing.

  Built with createElement rather than innerHTML for src/log-sheet.js's reason one card up: every
  string on the row is something a teacher typed.
*/
function contactRow(entry) {
  const row = el('div', 'log-entry');
  const top = el('div', 'log-entry-top');
  top.append(el('span', 'log-entry-kind', audienceLabel(entry.audience) || 'Contact'));
  /* A SUBJECT LINE THAT IS EMPTY IS STILL A MESSAGE THAT WENT OUT — src/log.js's writeContact()
     records it where writeEntry() would refuse it, so the card needs a stand-in rather than a blank
     first line. */
  top.append(el('span', 'log-entry-subject', entry.subject || 'No subject line'));
  top.append(el('span', 'log-entry-when', shortDate(String(entry.at || '').slice(0, 10))));
  row.append(top);
  const why = ruleText(entry.ruleId);
  if (why) row.append(el('div', 'log-entry-body', why));
  return row;
}

/* The list, or the empty sentence — the one shape both surfaces draw, so they cannot come to
   disagree about what an empty history looks like. */
function historyList(entries, emptyClass) {
  if (!entries.length) return el('p', emptyClass, HISTORY_EMPTY);
  const list = el('div', 'log-list');
  entries.forEach((entry) => list.append(contactRow(entry)));
  return list;
}

/*
  THE CARD ON THE STUDENT RECORD, newest first, as another `.detail-card` beside the log card.

  IT WEARS `.log-card` AND THAT IS THE PRINT GATE, not a leftover. src/detail.css hides that class
  on paper — WO-4.4's departure from "what prints is what is on screen" — and this card belongs
  behind the same rule for a related reason: a record sheet a guardian carries out of the building
  is not the place to list what her child's teacher has written to a counselor and an administrator
  about. Nothing was added to the print block, because both cards are the same claim.

  The CSV is untouched for the same reason and by the same means: studentCsv() names its columns and
  none of them is a log entry.
*/
export function studentContactCard(studentId) {
  const card = el('div', 'detail-card log-card');
  /* TWO CARDS ON THIS SCREEN NOW WEAR `.log-card`, so nothing may identify either of them by that
     class alone. This attribute is what tells them apart — for tools/verify/log-entries.mjs, which
     reads WO-4.4's card off the same screen, and for anything later that has to. It is NOT a
     delegated hook: nothing in src/shell.js calls closest() on it, and there is no control on this
     card to hook. */
  card.setAttribute('data-contact-card', '');
  card.append(el('div', 'detail-card-title', HISTORY_TITLE));
  const entries = visibleContactsFor(getDoc(), studentId);
  card.append(historyList(entries, 'attendance-report-empty'));
  card.append(el('p', 'detail-card-note', HISTORY_NOTE));
  return card;
}

/*
  THE SAME LIST ON THE SIGNAL CARD, above the actions — read what you have already said before you
  write again, which is the order the card is meant to be read in and the reason it is not at the
  foot.

  IT IS THE WHOLE STUDENT'S HISTORY AND NOT THIS RULE'S. The card carries every rule she tripped in
  both directions (src/signals-view.js), so narrowing this to one of them would be a section that
  disagreed with the card it is inside — and "have I already written home about her this month" is
  the question a teacher is actually asking with the draft button under her thumb. The rule that
  prompted each contact is on its own row, which is where the narrower question is answered.

  The note under it is the card's own shorter one: the modal it opens into says the same thing at
  more length, and a paragraph on a card that is already three sections deep is a paragraph nobody
  reads.
*/
export function signalContactSection(studentId) {
  const box = el('div', '');
  box.id = CARD_SECTION_ID;
  box.setAttribute('data-contact-history', String(studentId || ''));
  box.append(el('div', 'modal-section-label', HISTORY_TITLE));
  box.append(historyList(visibleContactsFor(getDoc(), studentId), 'attendance-report-empty'));
  /* The one-line version of the note under the card on the record, wearing the hero's own muted
     sub-line class rather than a new one: this work order adds no stylesheet rule, and
     `.sig-card-thresh` beside it would be a class whose NAME says threshold on a line that is not
     about one. */
  box.append(el('p', 'sig-card-sub', 'Handed to your mail app — Planbook cannot tell whether you '
    + 'sent it from there.'));
  return box;
}

/*
  REDRAW THAT SECTION IN PLACE, and only that section (WO-5.4).

  **THE CARD AROUND IT IS NOT REBUILT, AND THAT IS THE POINT.** A contact written from this card
  silences the row it was drawn from — that is the cooldown working, and this work order's second
  Acceptance line — so by the time the write returns, `signalsModel().all` may hold no row for this
  student at all and openSignalCard() would have nothing to draw. Rebuilding the card would empty it
  the instant the feature worked. This finds the section by its id and replaces its list, so the
  hero, the rules and the actions are exactly as the teacher left them.

  It returns whether it found anything, so src/shell.js's chain does not have to guess whether a
  card was open.
*/
export function refreshContactSection() {
  const box = document.getElementById(CARD_SECTION_ID);
  if (!box) return false;
  const studentId = box.getAttribute('data-contact-history') || '';
  const list = box.querySelector('.log-list, .attendance-report-empty');
  if (!list) return false;
  list.replaceWith(historyList(visibleContactsFor(getDoc(), studentId), 'attendance-report-empty'));
  return true;
}
