/*
  The two surfaces over the log — the sheet a teacher writes an entry in, and the card she reads
  them back on (WO-4.4).

  ── TWO TAPS, AND WHAT THAT COSTS THE SHEET ──

  WO-4.4's measure is *two taps from a class roster to a logged entry*, so the quick entries write a
  COMPLETE record on their own: the kind comes from the strip, the subject is the chip's own words,
  the time is now, and the sheet closes. The two fields under them are the work order's "optional
  detail" and are genuinely optional — a teacher who never touches them still has a log. That is why
  this is a sheet of buttons and not a form: a form with a required field is four taps and a
  keyboard, in the ninety seconds while a class is settling.

  THE KIND STRIP COMES BEFORE THE WORDS, and that is a decision rather than a layout. The log is
  append-only, so a wrong kind cannot be fixed later — only annotated — and the kind is what decides
  whether the entry is ever on a projected screen at all. Choosing it first is what makes "this may
  end up on a wall" a decision instead of an accident.

  ── WHAT THIS FILE DOES NOT DECIDE ──

  IT DOES NOT DECIDE WHETHER AN ENTRY MAY BE ON SCREEN. The card asks src/log.js for the entries it
  may draw and draws what it is handed; that module asks src/supports.js, which is the one place in
  the app that answers whether sensitive content is showing. There is no `presentationMode()` test in
  this file and there must never be one — two askers is two answers eventually, and
  tools/wo-sweep.mjs § 5 counts the askers.

  IT DOES NOT DECIDE WHAT A CORRECTION IS. Nothing here edits or deletes: there is no pencil on an
  entry, no strikethrough, no confirm. A correction is an ordinary later entry that says so, which is
  the owner's ruling of 2026-08-20 and src/log.js's header carries it.

  IT OWNS NO NAVIGATION AND CHAINS NOTHING. The card is handed to src/detail.js the way
  src/pass-history.js's studentPassCard() is — two ids in, DOM out, and nothing in src/detail.js
  knows what is inside it. The repaint after a write is src/shell.js's, where every other order of
  operations in this app is stated.

  ── AND THE CARD IS NOT ON PAPER ──

  src/detail.js prints, and this card is the one thing on that screen that must not print: the body
  field says *"Anything you want to remember. Nothing here is sent anywhere."* in the sheet where it
  is typed, and a sheet a guardian carries out of the building is somewhere. src/detail.css's gated
  print block hides `.log-card` outright, and studentCsv() is untouched — the same boundary WO-2.26
  drew around the hall-pass card's own file, for a reason it did not have.
*/

import { closeModal, openModal } from './modal.js';
import { announce } from './live-region.js';
import { getDoc } from './store.js';
/* The model. Everything about the record's shape, the write, and which entries may be drawn lives
   there; this file lays out what it is handed. */
import {
  LOG_KINDS, QUICK_ENTRIES, kindLabelFor, visibleEntriesFor, writeEntry,
} from './log.js';
/* How a student's name reads in a sentence and on a row — src/roster.js's, worn here as
   src/past-due.js and src/accommodation-prompt.js wear it. The import runs one way: nothing in
   src/roster.js knows this file exists. */
import { fullName } from './roster.js';
/* `2026-10-09` → `Oct 9`. The one short-date formatter in the app (WO-3.20), imported rather than
   composed, because a card beside the assignment list spelling a date differently is exactly the
   disagreement that file was created to end. */
import { shortDate } from './date-text.js';

const SHEET_ID = 'logSheetModal';
const SHEET_TITLE_ID = 'logSheetTitle';
const SHEET_KINDS_ID = 'logSheetKinds';
const SHEET_QUICK_ID = 'logSheetQuick';
const SUBJECT_ID = 'logSheetSubject';
const BODY_ID = 'logSheetBody';
const ERROR_ID = 'logSheetError';

/* HOW MANY ENTRIES THE CARD DRAWS BEFORE IT OFFERS THE REST. Four, which is what the drawing shows
   and what fits beside the attendance card without pushing the grade off a tablet screen. The rest
   are one tap away and the tap says how many. */
const FIRST_PAGE = 4;

/* Which student the sheet is open for, and which kind its strip is on. Ids and a string rather than
   objects out of the document, for the reason src/accommodation-prompt.js gives about `painted`: the
   document can be replaced underneath this module by a restore or a year switch, and an object held
   across that is work in a document nobody has open. */
let openFor = '';
let kind = 'behavior';

/* Whether the card is showing everything. A fact about the last ten seconds and not about this
   browser — no preference, nothing in localStorage, and it goes back to false on every paint, which
   is src/accommodation-prompt.js's rule 3 and src/scores.js's about its key legend. */
let showingAll = false;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function studentsIn(doc) { return doc && Array.isArray(doc.students) ? doc.students : []; }

function findStudent(id) {
  return studentsIn(getDoc()).filter((s) => s && s.id === id)[0] || null;
}

function fieldValue(id, value) {
  const node = document.getElementById(id);
  if (node) node.value = value;
}

function showError(message) {
  const node = document.getElementById(ERROR_ID);
  if (!node) return;
  node.textContent = message || '';
  node.classList.toggle('hidden', !message);
  /* Also spoken: it lands in a corner of a dialog a screen-reader user has no reason to move to,
     and there is exactly one aria-live region in this app (src/live-region.js). */
  if (message) announce(message);
}

/* ────────────────────────────── the sheet ────────────────────────────── */

/*
  THE KIND STRIP AND THE SIX CHIPS ARE BUILT HERE RATHER THAN WRITTEN INTO index.html, and that is
  the back door staying open. The six ship fixed (the owner, 2026-08-20) and a per-teacher list later
  is a settings block and a picker — which is a change to what QUICK_ENTRIES holds and to nothing
  else, because the markup is already a loop over it.

  **THE CHIP CARRIES ITS SUBJECT AND NEVER A CODE.** `data-log-quick="Off task"` is the words that
  land in the record, so a written entry is indistinguishable from a typed one the moment it lands.
  An index or an id here would be the one thing that turns the custom list into a migration.
*/
function renderSheet() {
  const student = findStudent(openFor);
  const title = document.getElementById(SHEET_TITLE_ID);
  if (title) title.textContent = student ? fullName(student) : 'No student';

  const kinds = document.getElementById(SHEET_KINDS_ID);
  if (kinds) {
    kinds.textContent = '';
    LOG_KINDS.forEach((entry) => {
      const btn = el('button', 'log-kind' + (entry.value === kind ? ' active' : ''), entry.label);
      btn.type = 'button';
      btn.setAttribute('data-log-kind', entry.value);
      btn.setAttribute('aria-pressed', entry.value === kind ? 'true' : 'false');
      kinds.append(btn);
    });
  }

  const quick = document.getElementById(SHEET_QUICK_ID);
  if (quick) {
    quick.textContent = '';
    QUICK_ENTRIES.forEach((entry) => {
      const btn = el('button', 'log-quick');
      btn.type = 'button';
      btn.setAttribute('data-log-quick', entry.subject);
      const mark = el('span', 'log-quick-mark', entry.mark);
      mark.setAttribute('aria-hidden', 'true');
      btn.append(mark);
      btn.append(document.createTextNode(entry.subject));
      /* The accessible name is the words and the student, because a screen-reader user tabbing six
         chips in a dialog hears six subjects with nothing tying them to whose record they land in. */
      btn.setAttribute('aria-label', entry.subject
        + (student ? ' — write this down about ' + fullName(student) : ''));
      quick.append(btn);
    });
  }
}

/*
  THE DOOR FROM THE ROSTER ROW. Tap one of two.

  The kind resets to `behavior` on every open rather than remembering the last one, and that is the
  same call src/roster.js's support panel makes about arriving collapsed: a strip that remembered
  would put the teacher one unnoticed tap from filing a conduct entry as a private note, or the
  reverse — and the reverse is the one that ends up on a wall.
*/
export function openLogSheet(studentId, opener) {
  if (!findStudent(studentId)) return;
  openFor = studentId;
  kind = 'behavior';
  showError('');
  fieldValue(SUBJECT_ID, '');
  fieldValue(BODY_ID, '');
  renderSheet();
  openModal(SHEET_ID, opener);
}

export function setLogKind(value) {
  if (!LOG_KINDS.some((k) => k.value === value)) return;
  kind = value;
  showError('');
  renderSheet();
}

/*
  TAP TWO. The chip's words are the subject, the strip is the kind, the time is now — and the entry
  is written before the sheet has finished closing.

  THE DETAIL FIELD RIDES ALONG IF SHE TYPED IN IT. Dropping it would be this dialog silently
  discarding something a teacher wrote; the subject FIELD is the one the chip overrides, because the
  chip is a subject and there cannot be two. Returns the entry so src/shell.js knows whether to
  redraw anything.
*/
export function writeQuick(subject) {
  const body = document.getElementById(BODY_ID);
  const entry = writeEntry(openFor, kind, subject, body ? body.value : '');
  if (!entry) return null;
  finish(entry);
  return entry;
}

/* The other path: the subject she typed, with her own detail under it. A subject that is empty after
   trimming is refused in the dialog rather than written as a blank row — src/roster.js's rule about
   where a refusal belongs, and the reason this sheet has an error line at all. */
export function writeTyped() {
  const subject = document.getElementById(SUBJECT_ID);
  const body = document.getElementById(BODY_ID);
  const entry = writeEntry(openFor, kind, subject ? subject.value : '', body ? body.value : '');
  if (!entry) {
    showError('Give the entry a few words first — that line is what you will read back in six '
      + 'weeks. Or tap one of the entries above, which writes itself.');
    return null;
  }
  finish(entry);
  return entry;
}

/*
  WHAT IS ANNOUNCED IS THAT SOMETHING WAS WRITTEN, AND NEVER WHAT IT SAYS. "Phone out during the
  quiz — Ada Probe" read aloud is the entry read out in the room it was written in;
  src/roster.js's toggleSupports() and src/presentation.js make the same distinction, and this is
  the fourth instance of it.
*/
function finish(entry) {
  const student = findStudent(entry.studentId);
  closeModal(SHEET_ID);
  announce('Written down for ' + (student ? fullName(student) : 'this student')
    + '. Entries are never edited or deleted — write another if this one needs correcting.');
}

/* Which student the sheet is open for. Exported for tools/verify-shell.mjs through the seam, and
   for nothing in the app: every caller in here already has the id it passed in. */
export function logSheetStudent() { return openFor; }

/* ────────────────────────────── the card ────────────────────────────── */

/* Shown or hidden by the one control on the card, and reset by every paint — see `showingAll`. */
export function toggleLogEntries() {
  showingAll = !showingAll;
  return showingAll;
}

/*
  THE LOG ON THE STUDENT RECORD, newest first, as another `.detail-card` on WO-3.7's screen.

  **WHAT PRESENTATION MODE DOES TO IT, AND WHAT IT DELIBERATELY DOES NOT.** The card is handed
  visibleEntriesFor(), so a behavior entry with the mode on is ABSENT from the list this function
  ever sees — not redacted, not counted, not summarised. There is no "2 hidden" line anywhere below,
  because a count is the disclosure: a card that says four things were written down about this child
  has told a room of thirty the thing it was hiding. Notes to self STAY (the owner, 2026-08-20):
  they are the teacher's working memory, and suppressing them costs her the half of the card that has
  nothing to do with conduct.

  **THE EMPTY SENTENCE IS THE SAME SENTENCE IN BOTH MODES, AND THAT IS THE WHOLE OF THE
  SUPPRESSION WORKING.** A student with nothing on file and a student whose every entry is a
  suppressed behavior note read identically here, deliberately: any wording that could tell the two
  apart — "nothing yet" against "nothing to show" — would be the count arriving by another route. So
  the sentence is about the CARD rather than about the record, and it is true of both.

  The title carries no number for the same reason, which is also what the drawing shows.
*/
export function studentLogCard(studentId) {
  const card = el('div', 'detail-card log-card');
  card.append(el('div', 'detail-card-title', 'What you have written down'));

  const entries = visibleEntriesFor(getDoc(), studentId);
  if (!entries.length) {
    card.append(el('p', 'attendance-report-empty',
      'Nothing to show here yet — what you write down from a class roster appears on this card, '
        + 'newest first.'));
    return card;
  }

  const list = el('div', 'log-list');
  const shown = showingAll ? entries : entries.slice(0, FIRST_PAGE);
  shown.forEach((entry) => list.append(entryRow(entry)));

  if (entries.length > FIRST_PAGE) {
    const more = el('button', 'log-more', showingAll
      ? 'Show fewer'
      : (entries.length - FIRST_PAGE) + ' older '
        + (entries.length - FIRST_PAGE === 1 ? 'entry' : 'entries') + ' →');
    more.type = 'button';
    more.setAttribute('data-log-more', '');
    more.setAttribute('aria-expanded', showingAll ? 'true' : 'false');
    list.append(more);
  }
  card.append(list);

  /* WHAT THIS LIST IS, AND THE TWO PROMISES UNDER IT. The append-only sentence is here as well as in
     the sheet because this is where a teacher reads an entry she now disagrees with, and it is the
     moment she reaches for a delete that does not exist. The second is the same promise
     src/backup.js's panel makes about the file it writes. */
  card.append(el('p', 'detail-card-note',
    'Newest first. Entries are never edited or deleted — if one is wrong, write another that says '
      + 'so, because the log is what you wrote down at the time. None of this is printed, exported '
      + 'or put in a draft.'));
  return card;
}

/*
  ONE ENTRY. The kind chip, the subject, the day — and the body underneath when there is one.

  Built with createElement rather than innerHTML, and this is a file where that is not a formality:
  every string on the row is something a teacher typed, and a note reading "watch the <b>lab</b>
  bench" has to be a note reading "watch the <b>lab</b> bench".

  THE DAY AND NOT THE TIME. `at` carries the minute (docs/data-model.md) and the card prints
  `Oct 9`, because the question a teacher asks at a conference is which week this was, and a column
  of timestamps is a column to read past. The minute is in the record for anything that ever needs
  it.
*/
function entryRow(entry) {
  const row = el('div', 'log-entry');
  const top = el('div', 'log-entry-top');
  top.append(el('span', 'log-entry-kind' + (entry.kind === 'behavior' ? ' behavior' : ''),
    kindLabelFor(entry.kind)));
  top.append(el('span', 'log-entry-subject', entry.subject));
  top.append(el('span', 'log-entry-when', shortDate(String(entry.at || '').slice(0, 10))));
  row.append(top);
  if (entry.body) row.append(el('div', 'log-entry-body', entry.body));
  return row;
}
