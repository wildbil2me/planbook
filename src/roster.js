/*
  The roster — the students in the open class, the paste box that fills it, and the editor that
  holds a student's contacts.

  SHAPED LIKE src/classes.js, which is the shape src/backup.js and src/year-picker.js follow too:
  a shell feature in its own file, driven by the data-* hooks shell.js routes to it, rendering
  rows with createElement rather than innerHTML, and reporting its refusals into its own dialog
  rather than onto the save chip. The chip means "did a save land"; "that line has no name on it"
  is not a save.

  THE SPLIT THAT MAKES THIS WORK, and the one thing not to undo. A student belongs to the
  DOCUMENT — `doc.students` is a flat array — and a class holds a list of student IDS in
  `cls.roster`. So a student in Period 1 and Period 5 is one record with one set of contacts,
  because there is only ever one place a contact can be written; and taking a student off one
  class's roster is a splice out of a list of ids, which cannot reach the other class or the
  student. Both of those are acceptance lines, and they are true structurally rather than by this
  file remembering to be careful. Anything that copies a student into a class instead of
  referencing one breaks both at once, and does it silently.

  FOUR THINGS THAT WILL LOOK LIKE OMISSIONS AND ARE DECISIONS:

  1. THE PASTE PREVIEW SHOWS THE SPLIT, not a count. `Last, First` and `First Last` both come out
     of real school systems, "Van Dyke, Mary" and "Mary Van Dyke" are both real people, and a
     per-line guess is going to be wrong sometimes. So every line arrives as two editable fields
     with the guess already in them, a warning where the guess was uncertain, and a swap control
     per row and for the whole list. A preview that only said "25 will be added" would be a count
     of how many mistakes are about to commit.

  2. A NAME THAT IS ALREADY IN THE YEAR IS LINKED, NOT COPIED. Re-pasting last week's list must
     not double the roster, and pasting Period 1's list into Period 5 must not make second copies
     of thirty students. So each preview row is one of three things — new, already in the year but
     not in this class, already in this class — and the count line says so in those words.

  3. REMOVE AND DELETE ARE DIFFERENT OPERATIONS, the same way archive and delete are for a class.
     Remove takes a student off this class's roster and leaves the record in the year; delete
     destroys the record. Delete is offered only on a student who is in no class at all, which is
     what makes "wrong class" one cheap tap and "destroy a person's contacts and grades" a
     deliberate one with a dialog that counts what goes.

  4. NOTHING HERE IS SORTED. The roster renders in the order `cls.roster` holds, which is the
     order the teacher pasted or typed. Sorting by surname would be one line and it would also be
     a second opinion about an order she can see — WO-2.1's marking screen is where an order that
     is not hers gets decided, and it can decide it there.

  5. A ROSTER ROW SHOWS A DOT AND NEVER A WORD about what is behind it. Support details — IEP and
     504 plans, medical needs, behavior plans — are the most consequential data in this app if
     they leak, and this list gets projected onto a classroom wall. So the row carries one
     indicator: the same dot, the same shape and the same colour for every student who has
     anything on file, saying only "there is something here". A dot that were amber for a 504 and
     indigo for an IEP would be a legible key on that wall, which is why nothing about it varies.
     The details are one deliberate tap away and arrive in a panel that is shut on every open, and
     whether any of it may be on screen at all is src/supports.js's single question — not a test
     this file makes for itself. See docs/data-model.md § Accommodations.
*/

import { getDoc, update, newId } from './store.js';
import { openModal, closeModal } from './modal.js';
import { announce } from './live-region.js';
import { getSelectedClass, getActiveClasses } from './classes.js';
import {
  ACCOMMODATION_KINDS, accommodationsOf, appliesToText, hasSupports, isKind, isPlan, kindLabel,
  newAccommodation, newSupports, parseAppliesTo, sensitiveValue, setSensitiveText, supportsOf,
  supportsVisible,
} from './supports.js';

const ROSTER_MODAL_ID = 'rosterModal';
const PASTE_MODAL_ID = 'rosterPasteModal';
const STUDENT_MODAL_ID = 'studentModal';
const DELETE_MODAL_ID = 'studentDeleteModal';

const ROSTER_CLASS_NAME_ID = 'rosterClassName';
const ROSTER_COUNT_ID = 'rosterCount';
const ROSTER_LIST_ID = 'rosterList';
const ROSTER_NEW_INPUT_ID = 'rosterNewInput';
const ROSTER_ERROR_ID = 'rosterError';
const ORPHAN_SECTION_ID = 'rosterOrphanSection';
const ORPHAN_LIST_ID = 'rosterOrphanList';

const PASTE_BOX_ID = 'rosterPasteBox';
const PASTE_EDIT_VIEW_ID = 'rosterPasteEdit';
const PASTE_REVIEW_VIEW_ID = 'rosterPasteReview';
const PASTE_LIST_ID = 'rosterPasteList';
const PASTE_COUNT_ID = 'rosterPasteCount';
const PASTE_COMMIT_ID = 'rosterPasteCommitBtn';
const PASTE_ERROR_ID = 'rosterPasteError';

const STUDENT_TITLE_ID = 'studentModalTitle';
const GUARDIAN_LIST_ID = 'guardianList';
const STUDENT_CLASSES_ID = 'studentClasses';

const SUPPORTS_BODY_ID = 'supportsBody';
const SUPPORTS_REVEAL_ID = 'supportsRevealBtn';
const SUPPORTS_HINT_ID = 'supportsHint';
const SUPPORTS_HINT_PRESENTATION_ID = 'supportsHintPresentation';
const SUPPORTS_PLAN_ROW_ID = 'supportsPlanRow';
const ACCOMMODATION_LIST_ID = 'accommodationList';

const DELETE_LEAD_ID = 'studentDeleteLead';
const DELETE_FACTS_ID = 'studentDeleteFacts';
const DELETE_BTN_ID = 'studentDeleteBtn';

/* Which student the editor is open for, and which student the delete confirm counted. Ids
   rather than objects, for the reason src/classes.js gives: the document can be replaced
   underneath this module by a restore or a year switch, and an object held across that is a
   reference to a student who is no longer in any document. */
let editingId = '';
let pendingDeleteId = '';

/* Whether the support panel is open inside the editor that is on screen. It is a fact about this
   dialog and nothing else: it resets to false in openStudentEditor() every single time, it is
   never persisted, and there is no setting for it. "Discreet by default is not a preference
   setting" is the work order's Traps line, and a remembered `true` in localStorage would be
   exactly the preference it forbids — the panel would be open on the wall the morning after the
   one afternoon a teacher left it open. */
let supportsShown = false;

/* The paste preview, and the class it is being pasted into. `pasteRows` is the model the review
   list renders from and the commit reads — the inputs on screen write into it as they are typed,
   which is what lets a row be corrected without the list being re-rendered under the caret. */
let pasteRows = [];
let pasteClassId = '';

/* ────────────────────────────── reading the document ────────────────────────────── */

function studentsIn(doc) { return doc && Array.isArray(doc.students) ? doc.students : []; }

/* Every read of `roster` goes through here. A class object can legitimately arrive without the
   key — from a restored backup written by another build, or from a class this build did not
   create — and a screen that has to check before it iterates is a screen that will eventually
   forget (src/store.js:102-104, src/classes.js:113-117). */
function rosterOf(cls) { return cls && Array.isArray(cls.roster) ? cls.roster : []; }

function findStudent(id) {
  return studentsIn(getDoc()).filter((s) => s.id === id)[0] || null;
}

/* The students on a class's roster, in roster order, with ids that name nobody dropped rather
   than rendered as blanks. A dangling id is reachable: a backup restored from a build that
   deleted a student differently, or a hand-edited file. It matches no student, shows up nowhere,
   and is the harmless failure — the same answer src/classes.js gives for a deleted class id
   sitting in an event. */
function studentsOf(cls) {
  return rosterOf(cls).map((id) => findStudent(id)).filter(Boolean);
}

/* Which classes a student is on the roster of, active ones only: an archived class is off the
   tab bar, and naming it in a row note would be answering a question the teacher did not ask. */
function classesFor(studentId) {
  return getActiveClasses().filter((c) => rosterOf(c).indexOf(studentId) >= 0);
}

/* ────────────────────────────── names ────────────────────────────── */

/* `Last, First` is how a roster reads in every school system the owner has used, so it is how a
   row reads here. The fallbacks matter more than they look: a student typed in as one name, or
   half-typed and left, still has to be a row a teacher can find and finish.

   Exported since WO-2.1, along with fullName() below, and for one reason: the marking screen lists
   the same students and speaks the same names, and a second copy of these eight lines over there
   could be right about a hyphen, a suffix or a half-typed name in a way this one is not. That is
   the second opinion this file's header spends five paragraphs refusing elsewhere. Nothing else is
   exported for src/attendance.js's benefit — it resolves its own roster, in its own order. */
export function rosterName(s) {
  if (!s) return '';
  if (s.last && s.first) return s.last + ', ' + s.first;
  return s.last || s.first || 'Unnamed student';
}

/* Spoken and printed in sentences, where "Probe, Ada" reads as a filing cabinet. */
export function fullName(s) {
  if (!s) return '';
  return (s.first + ' ' + s.last).trim() || 'this student';
}

function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

/* Initials for the row avatar — first name, last name. Written out here rather than shared with
   src/classes.js's version, which reads a class name and splits on dashes: the two answer
   different questions off different shapes, and one function taking a flag would be worse than
   both. Same reasoning as the two caution strips in src/shell.css. */
function initialsOf(s) {
  const a = (s.first || '').trim()[0] || '';
  const b = (s.last || '').trim()[0] || '';
  return (a + b).toUpperCase() || '?';
}

/* The ten avatar colors, picked by summing the characters of the id — stable for the life of the
   student, identical on every device, and stored nowhere. src/classes.js:389 has the same five
   lines for class ids; they are independent color assignments over independent id spaces, and a
   shared helper module for one hash would be a third file to find. */
function avatarClass(id) {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return 'av' + (sum % 10);
}

/* ────────────────────────────── the name parser ────────────────────────────── */

/*
  One pasted line in, a first and a last out, and a warning whenever the answer was a guess.

  Nothing here refuses a line and nothing here throws: every answer lands in an editable field in
  the preview, so being wrong costs the teacher two seconds and being silent about being unsure
  costs her a roster she has to re-check by hand.
*/

/* Suffixes that belong on the surname rather than in the first-name slot. Single letters are
   deliberately NOT in this list: "Smith, Mary V" is a middle initial far more often than it is a
   regnal number, and folding a V onto the surname would be wrong in the common case to be right
   in the rare one. */
const NAME_SUFFIXES = ['jr', 'sr', 'ii', 'iii', 'iv', '2nd', '3rd', '4th'];

/* Surname particles, for the case with no separator to read the split from. "Mary Van Dyke" has
   to come out as Van Dyke, Mary — taking only the last token would file her under D, and the
   work order names this exact case. Matched case-insensitively and only in the middle of a line,
   never as the whole surname: "Anh Le" is Le, Anh. */
const NAME_PARTICLES = ['van', 'von', 'der', 'den', 'de', 'del', 'della', 'di', 'da', 'das',
  'dos', 'du', 'la', 'le', 'lo', 'st', 'st.', 'ter', 'ten', 'bin', 'ibn', 'al', 'abu'];

/* Words that make a line a column heading rather than a person. A pasted range from a
   spreadsheet brings its header with it, and "First Name, Last Name" added as a student is the
   kind of thing nobody notices until report cards. Excluded rather than dropped: the row is
   still shown in the preview, ticked off, saying why. */
const HEADER_WORDS = ['name', 'names', 'last', 'first', 'last name', 'first name', 'surname',
  'student', 'students', 'student name', 'full name'];

function tidy(text) { return String(text == null ? '' : text).replace(/\s+/g, ' ').trim(); }

function isSuffix(word) {
  return NAME_SUFFIXES.indexOf(tidy(word).toLowerCase().replace(/\./g, '')) >= 0;
}

function isParticle(word) {
  return NAME_PARTICLES.indexOf(tidy(word).toLowerCase()) >= 0;
}

/*
  Returns { first, last, warning, isHeader }.

  A comma or a tab is read as the field separator, and the field before it as the surname —
  that is what `Last, First` means and what a two-column paste out of a spreadsheet means. With
  no separator at all the line is read as `First Last`, which is how a person types a name
  without thinking, and it says so in the warning: that is the guess most likely to be wrong.
*/
export function parseRosterLine(line) {
  const raw = String(line == null ? '' : line);
  /* Tab and comma both, because a paste of two spreadsheet columns arrives tab-separated and a
     paste out of a report arrives comma-separated, and a teacher does not know or care which she
     has. Empty fields are dropped after the split, so "Smith,,John" and a trailing tab are the
     same line as "Smith, John". */
  const hadSeparator = /[,\t]/.test(raw);
  const fields = raw.split(/[,\t]/).map(tidy).filter(Boolean);

  if (!fields.length) return { first: '', last: '', warning: 'Nothing on this line', isHeader: false };

  const lower = fields.map((f) => f.toLowerCase());
  if (lower.every((f) => HEADER_WORDS.indexOf(f) >= 0)) {
    return { first: fields[1] || '', last: fields[0], warning: 'Column heading — not added',
      isHeader: true };
  }

  if (hadSeparator && fields.length >= 2) {
    let last = fields[0];
    let first = fields[1];
    let rest = fields.slice(2);
    let warning = '';

    /* "Smith, Jr., Robert" — the suffix landed in the first-name slot and pushed the real first
       name into the overflow. Fold it back onto the surname. */
    if (isSuffix(first) && rest.length) {
      last = last + ' ' + first;
      first = rest.shift();
      warning = 'Suffix folded into the last name';
    }
    /* "Smith, Robert, Jr." — the suffix trailing instead. */
    rest = rest.filter((f) => {
      if (!isSuffix(f)) return true;
      last = last + ' ' + f;
      warning = 'Suffix folded into the last name';
      return false;
    });
    if (rest.length) {
      warning = plural(rest.length, 'extra field', 'extra fields') + ' on this line ignored — '
        + 'check the split';
    }
    return { first: first, last: last, warning: warning, isHeader: false };
  }

  /* One word and nothing else — a mononym, or "Smith," or ", Robert", which all arrive here as a
     single field. Whichever half it is, it is a name, and the preview is where the teacher says
     which. */
  if (fields[0].indexOf(' ') < 0) {
    return { first: '', last: fields[0], warning: 'Only one name on this line — check which half '
      + 'it is', isHeader: false };
  }

  /* Nothing to read the split from, so it is read as First Last: the surname is the last token,
     plus any particles in front of it ("Mary Van Dyke") and any suffix behind it ("Robert Smith
     Jr"). A trailing comma lands here too — "Mary Van Dyke," is one field with a space in it, and
     reading it as a surname because of a stray separator would be worse than useless. */
  const tokens = fields[0].split(' ');
  let suffix = '';
  if (tokens.length > 2 && isSuffix(tokens[tokens.length - 1])) suffix = tokens.pop();
  let last = tokens.pop();
  while (tokens.length > 1 && isParticle(tokens[tokens.length - 1])) {
    last = tokens.pop() + ' ' + last;
  }
  if (suffix) last = last + ' ' + suffix;
  const first = tokens.join(' ');
  let warning = 'Read as “First Last” — check the split';
  if (tokens.length > 1) warning += '; more than one first name here';
  return { first: first, last: last, warning: warning, isHeader: false };
}

/* The key two rows are "the same person" by. Case and spacing only — nothing cleverer, because
   the answer is shown to the teacher as a warning she can override rather than acted on behind
   her back, and a fuzzy match that quietly refused to add a real second J. Smith would be worse
   than one that adds him. */
function nameKey(first, last) {
  return (tidy(last) + '|' + tidy(first)).toLowerCase();
}

/* ────────────────────────────── writing ────────────────────────────── */

/*
  A new student, carrying the shape docs/data-model.md settles, with every collection present and
  empty rather than absent — the reason is at src/store.js:102-104.

  `supports` is written here as of WO-1.8, which is what the note in this place used to say would
  happen: the block is real now, its shape is src/supports.js's newSupports(), and it seeds to a
  plan of `none` and no accommodations. A student who has nothing on file carries an empty block
  rather than no block, so nothing anywhere has to ask whether the key exists before reading it —
  and src/supports.js's supportsOf() repairs the one case that still arrives without it, a record
  restored from a backup written before this work order.
*/
function newStudent(first, last) {
  return {
    id: newId('s'),
    first: first,
    last: last,
    nickname: '',
    gradYear: '',
    email: '',
    guardians: [],
    counselor: { name: '', email: '' },
    notes: '',
    supports: newSupports(),
  };
}

/* `preferred` is what Phase 5's audience picker reads to decide who a message goes to first, so
   the first guardian added is it — a student with one guardian and no preferred flag is a
   student that picker has no answer for. */
function newGuardian(preferred) {
  return { name: '', relation: '', email: '', phone: '', language: 'en', preferred: !!preferred };
}

/* ────────────────────────────── the roster panel ────────────────────────────── */

function showRosterError(message) {
  const el = document.getElementById(ROSTER_ERROR_ID);
  if (!el) return;
  el.textContent = message || '';
  el.classList.toggle('hidden', !message);
  /* Also spoken: it lands in a corner of a dialog a screen-reader user has no reason to move to,
     and there is exactly one aria-live region in this app (src/live-region.js). */
  if (message) announce(message);
}

function actionButton(label, hook, value, extraClass) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'class-action-btn' + (extraClass ? ' ' + extraClass : '');
  btn.setAttribute(hook, value);
  btn.textContent = label;
  return btn;
}

/*
  One row per student. Built with createElement rather than innerHTML, and this is the file where
  that stops being a formality twice over: a student's name is pasted out of a school system, and
  a guardian's name is typed by a teacher reading an email. A student called "Bo <b>x</b>" has to
  be a student called "Bo <b>x</b>".
*/
function studentRow(student, cls) {
  const row = document.createElement('div');
  row.className = 'roster-row';

  const avatar = document.createElement('div');
  avatar.className = 'avatar ' + avatarClass(student.id);
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = initialsOf(student);
  row.append(avatar);

  const name = document.createElement('span');
  name.className = 'roster-row-name';
  name.textContent = rosterName(student) + (student.nickname ? ' “' + student.nickname + '”' : '');
  row.append(name);

  /*
    The support indicator. Present only when there is something on file, identical for every
    student who has anything, and it says nothing about what — see decision 5 in the header.

    It is a button rather than a decorative span because the details have to be reachable from
    here by a deliberate tap, and because a 22px circle with no accessible name is a thing a
    screen reader reads as nothing at all. Its label is deliberately the same generic sentence for
    everyone: "Support details for Ada Probe" discloses that there are some, which the dot already
    does, and no more than that. No `title` beyond the same words, and nothing keyed to the plan.

    supportsVisible() is asked here rather than tested here — with presentation mode on, this dot
    is one of the things that has to go, because on a projected roster the dot IS the disclosure.
    It goes by not being built, not by being painted out: WO-1.9's acceptance is that the data is
    absent from the DOM rather than hidden in it.
  */
  if (supportsVisible() && hasSupports(student)) {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'support-dot';
    dot.setAttribute('data-supports-open', student.id);
    dot.setAttribute('aria-haspopup', 'dialog');
    dot.setAttribute('aria-label', 'Support details for ' + fullName(student));
    dot.title = 'Support details for ' + fullName(student);
    const glyph = document.createElement('span');
    glyph.setAttribute('aria-hidden', 'true');
    glyph.textContent = '•';
    dot.append(glyph);
    row.append(dot);
  }

  /* The other classes this student is on, which is the one fact about a roster row that cannot be
     seen from anywhere else — and the visible proof that a student in two classes is one student
     rather than two rows that happen to match. */
  const others = classesFor(student.id).filter((c) => !cls || c.id !== cls.id);
  const note = document.createElement('span');
  note.className = 'roster-row-note';
  note.textContent = others.length ? 'also in ' + others.map((c) => c.name).join(', ') : '';
  row.append(note);

  const actions = document.createElement('div');
  actions.className = 'roster-row-actions';
  const edit = actionButton('Edit', 'data-student-edit', student.id);
  edit.setAttribute('aria-haspopup', 'dialog');
  edit.setAttribute('aria-label', 'Edit ' + fullName(student));
  actions.append(edit);

  if (cls) {
    const remove = actionButton('Remove', 'data-student-remove', student.id, 'archive');
    remove.setAttribute('aria-label', 'Remove ' + fullName(student) + ' from ' + cls.name);
    actions.append(remove);
  } else {
    /* A student in no class at all. Adding them back to the open class is the common repair, and
       deleting the record is offered only here — see the header comment. */
    const open = getSelectedClass();
    if (open) {
      const add = actionButton('Add to ' + open.name, 'data-student-add-to-class', student.id,
        'restore');
      add.setAttribute('aria-label', 'Add ' + fullName(student) + ' to ' + open.name);
      actions.append(add);
    }
    const del = actionButton('Delete', 'data-student-delete', student.id, 'delete');
    del.setAttribute('aria-haspopup', 'dialog');
    del.setAttribute('aria-label', 'Delete ' + fullName(student) + ' from this school year');
    actions.append(del);
  }

  row.append(actions);
  return row;
}

function emptyLine(text) {
  const el = document.createElement('div');
  el.className = 'roster-empty';
  el.textContent = text;
  return el;
}

export function renderRoster() {
  const doc = getDoc();
  const cls = getSelectedClass();
  const list = document.getElementById(ROSTER_LIST_ID);
  const name = document.getElementById(ROSTER_CLASS_NAME_ID);
  const count = document.getElementById(ROSTER_COUNT_ID);
  if (name) name.textContent = cls ? cls.name : 'no class';
  if (!list) return;

  const onRoster = cls ? studentsOf(cls) : [];
  list.textContent = '';
  if (!doc) {
    list.append(emptyLine('No school year is open, so there is no roster yet.'));
  } else if (!cls) {
    list.append(emptyLine('No class is open. Add a class from the class bar first — a roster '
      + 'belongs to the school year, but it is a class you put students in.'));
  } else if (!onRoster.length) {
    list.append(emptyLine('No students in ' + cls.name + ' yet. Paste your list, or add them one '
      + 'at a time below.'));
  } else {
    onRoster.forEach((s) => list.append(studentRow(s, cls)));
  }

  if (count) {
    const total = studentsIn(doc).length;
    count.textContent = !doc ? ''
      : plural(onRoster.length, 'student', 'students') + (cls ? ' in ' + cls.name : '')
        + ' · ' + plural(total, 'student', 'students') + ' in the school year';
  }

  /* Students who are in no class at all: what a Remove leaves behind, and where a name pasted
     into the wrong class ends up. Hidden until there is one, because a permanently empty section
     is furniture explaining nothing. */
  const orphans = studentsIn(doc).filter((s) => classesFor(s.id).length === 0);
  const section = document.getElementById(ORPHAN_SECTION_ID);
  const orphanList = document.getElementById(ORPHAN_LIST_ID);
  if (section) section.classList.toggle('hidden', orphans.length === 0);
  if (orphanList) {
    orphanList.textContent = '';
    orphans.forEach((s) => orphanList.append(studentRow(s, null)));
  }
}

/* Opened through its own hook rather than data-modal-open, for the reason year-picker.js gives:
   the panel is filled from the document, and a modal that opens and then fills in is a modal
   that flickers. */
export function openRoster(opener) {
  showRosterError('');
  renderRoster();
  const input = document.getElementById(ROSTER_NEW_INPUT_ID);
  if (input) input.value = '';
  openModal(ROSTER_MODAL_ID, opener);
}

/*
  One student, typed into the field rather than pasted. The same parser reads it, so "Van Dyke,
  Mary" and "Mary Van Dyke" both work here too — and the row that appears immediately shows which
  way it was read, which is the single-name version of the preview.
*/
export function createStudentFromForm() {
  const input = document.getElementById(ROSTER_NEW_INPUT_ID);
  if (!input) return;
  const typed = input.value;
  if (!tidy(typed)) {
    showRosterError('Type a name first — “Van Dyke, Mary” or “Mary Van Dyke”, either way round.');
    input.focus();
    return;
  }
  const doc = getDoc();
  if (!doc) {
    showRosterError('There is no school year open, so there is nowhere to put a student yet.');
    return;
  }

  const parsed = parseRosterLine(typed);
  const student = newStudent(parsed.first, parsed.last);
  const cls = getSelectedClass();
  update((d) => {
    studentsIn(d).push(student);
    /* A student with no class open is still a student in this school year — the record is the
       thing that matters, and the roster list is where a class picks them up. */
    if (cls) {
      if (!Array.isArray(cls.roster)) cls.roster = [];
      cls.roster.push(student.id);
    }
  });

  input.value = '';
  showRosterError('');
  renderRoster();
  announce('Added ' + rosterName(student) + (cls ? ' to ' + cls.name : ' to the school year') + '.');
  input.focus();
}

/* Off this class's roster, and nowhere else. The record, its contacts, and every other class it
   is on are untouched — this is a splice out of a list of ids. */
export function removeFromClass(studentId) {
  const cls = getSelectedClass();
  const student = findStudent(studentId);
  if (!cls || !student) return;
  update(() => { cls.roster = rosterOf(cls).filter((id) => id !== studentId); });
  showRosterError('');
  renderRoster();
  const left = classesFor(studentId);
  announce(fullName(student) + ' is off the ' + cls.name + ' roster'
    + (left.length ? ', and still in ' + left.map((c) => c.name).join(', ') + '.'
      : ', and is not in any class now. The record is still in this school year.'));
}

export function addToOpenClass(studentId) {
  const cls = getSelectedClass();
  const student = findStudent(studentId);
  if (!cls || !student) return;
  if (rosterOf(cls).indexOf(studentId) >= 0) return;
  update(() => {
    if (!Array.isArray(cls.roster)) cls.roster = [];
    cls.roster.push(studentId);
  });
  showRosterError('');
  renderRoster();
  announce(fullName(student) + ' is on the ' + cls.name + ' roster.');
}

/* ────────────────────────────── the student editor ────────────────────────────── */

/* The fields this editor is allowed to write, by name. It is an allowlist rather than a
   pass-through because the hook carries a path out of the markup: a value this list does not
   name writes nothing at all, which is what keeps a field added to the document later from
   becoming writable here by an attribute somebody copied. */
const STUDENT_FIELDS = ['first', 'last', 'nickname', 'gradYear', 'email', 'notes'];
const GUARDIAN_FIELDS = ['name', 'relation', 'email', 'phone', 'language'];
const COUNSELOR_FIELDS = ['name', 'email'];
/* The support block's own three allowlists, and they are separate from the ones above rather than
   folded into them for a reason worth the extra line: an attribute copied off a support field onto
   an ordinary one, or the reverse, then writes nothing instead of writing into the wrong half of a
   student's record. `plan` and `kind` are on neither list — both are enumerated, so both are
   written by their own function against src/supports.js's list rather than from a typed value. */
const SUPPORT_FIELDS = ['reviewDate', 'medical', 'behaviorPlan'];
const CASE_MANAGER_FIELDS = ['name', 'email'];
const ACCOMMODATION_FIELDS = ['detail', 'appliesTo'];

function guardiansOf(student) {
  return student && Array.isArray(student.guardians) ? student.guardians : [];
}

function counselorOf(student) {
  if (!student) return null;
  if (!student.counselor || typeof student.counselor !== 'object') student.counselor = { name: '', email: '' };
  return student.counselor;
}

function fieldValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value == null ? '' : value;
}

/* One guardian, repeatable. The card is rebuilt only when a guardian is added, removed, or made
   preferred — never while one is being typed into, which would take the caret with it. */
function guardianCard(guardian, index, student) {
  const card = document.createElement('div');
  card.className = 'guardian-card';

  const head = document.createElement('div');
  head.className = 'guardian-head';

  const label = document.createElement('span');
  label.className = 'guardian-label';
  label.textContent = guardian.name ? guardian.name : 'Guardian ' + (index + 1);
  head.append(label);

  const preferred = document.createElement('button');
  preferred.type = 'button';
  preferred.className = 'toggle-btn' + (guardian.preferred ? ' active' : '');
  preferred.setAttribute('data-guardian-preferred', String(index));
  preferred.setAttribute('aria-pressed', guardian.preferred ? 'true' : 'false');
  preferred.setAttribute('aria-label', 'Contact this guardian first about '
    + fullName(student));
  preferred.textContent = 'Contact first';
  head.append(preferred);

  const remove = actionButton('Remove', 'data-guardian-remove', String(index), 'delete');
  remove.setAttribute('aria-label', 'Remove guardian ' + (index + 1) + ' from '
    + fullName(student));
  head.append(remove);
  card.append(head);

  const grid = document.createElement('div');
  grid.className = 'student-grid';
  grid.append(
    guardianField('Name', 'name', index, guardian.name, 'text'),
    guardianField('Relation', 'relation', index, guardian.relation, 'text'),
    guardianField('Email', 'email', index, guardian.email, 'email'),
    guardianField('Phone', 'phone', index, guardian.phone, 'tel'),
    guardianField('Language', 'language', index, guardian.language, 'text')
  );
  card.append(grid);
  return card;
}

function guardianField(caption, field, index, value, type) {
  const wrap = document.createElement('label');
  wrap.className = 'student-field';

  const label = document.createElement('span');
  label.className = 'student-label';
  label.textContent = caption;
  wrap.append(label);

  const input = document.createElement('input');
  input.className = 'student-input';
  input.type = type || 'text';
  input.value = typeof value === 'string' ? value : '';
  input.setAttribute('data-student-field', 'guardian.' + field);
  input.setAttribute('data-guardian-index', String(index));
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('aria-label', caption + ' — guardian ' + (index + 1));
  if (field === 'relation') input.placeholder = 'Mother, Father, Grandmother…';
  if (field === 'language') input.placeholder = 'en';
  wrap.append(input);
  return wrap;
}

function renderGuardians(student) {
  const list = document.getElementById(GUARDIAN_LIST_ID);
  if (!list) return;
  list.textContent = '';
  const guardians = guardiansOf(student);
  if (!guardians.length) {
    list.append(emptyLine('No guardians yet. Add the one you would email first.'));
    return;
  }
  guardians.forEach((g, i) => list.append(guardianCard(g, i, student)));
}

/*
  Which classes this student is in, as a row of on/off buttons — and the whole of "move a student
  between classes": turn the new one on, turn the old one off, and the student record never moves
  because there was never a copy of it to move.

  Buttons rather than checkboxes, for the reason the year picker's rows are buttons: a checkbox is
  16px of target that no amount of padding makes bigger, and these have to be reachable with a
  thumb. Archived classes are not listed — an archived class is off the tab bar, and putting a
  student into one from here would be filing them somewhere the teacher cannot see.
*/
function renderStudentClasses(student) {
  const box = document.getElementById(STUDENT_CLASSES_ID);
  if (!box) return;
  box.textContent = '';
  const classes = getActiveClasses();
  if (!classes.length) {
    box.append(emptyLine('There are no classes yet, so there is nowhere to put this student.'));
    return;
  }
  classes.forEach((cls) => {
    const on = rosterOf(cls).indexOf(student.id) >= 0;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toggle-btn' + (on ? ' active' : '');
    btn.setAttribute('data-student-class', cls.id);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.textContent = cls.name;
    box.append(btn);
  });
}

/* ────────────────────────────── support details ──────────────────────────────
   IEP and 504 plans, a case manager, a review date, accommodations, medical needs and behavior
   plans. The shape, the two enumerated lists and the one visibility question all live in
   src/supports.js; what is here is the editor for them.

   Every string below that comes out of `supports` reaches the page through sensitiveValue() or
   setSensitiveText(), and the panel is only openable when supportsVisible() says so. Those three
   are one switch (src/supports.js), and presentation mode is the hand on it. Nothing in this
   section decides for itself whether it may be on screen — a screen that decides for itself is a
   screen presentation mode does not reach. */

/* One accommodation, repeatable, and the same card the guardians editor already solved: a head
   with a caption and a Remove, then a grid of fields. Rebuilt only when a row is added or removed
   or its kind is picked — never while one is being typed into, which would take the caret with
   it. */
function accommodationCard(accommodation, index, student) {
  const card = document.createElement('div');
  card.className = 'accommodation-card';

  const head = document.createElement('div');
  head.className = 'accommodation-head';

  /* The label is the kind's own words, which is support data, so it goes through the choke point
     rather than onto the element directly. A row with no kind picked yet reads as its number. */
  const label = document.createElement('span');
  label.className = 'accommodation-label';
  setSensitiveText(label, kindLabel(accommodation.kind) || 'Accommodation ' + (index + 1));
  head.append(label);

  const remove = actionButton('Remove', 'data-accommodation-remove', String(index), 'delete');
  remove.setAttribute('aria-label', 'Remove accommodation ' + (index + 1) + ' from '
    + fullName(student));
  head.append(remove);
  card.append(head);

  const grid = document.createElement('div');
  grid.className = 'student-grid';
  grid.append(
    kindField(accommodation, index),
    accommodationField('Detail', 'detail', index, accommodation.detail,
      '1.5× on tests and quizzes'),
    accommodationField('Applies to', 'appliesTo', index, appliesToText(accommodation.appliesTo),
      'tests, quizzes — empty means everything')
  );
  card.append(grid);
  return card;
}

/*
  The kind picker. A native <select> rather than a row of twelve buttons: twelve toggles is a wall
  on a phone, and a select is the one control iPadOS gives its own wheel to. It is the only control
  in this editor NOT hooked to `data-student-field`, and that is deliberate — a <select> is read on
  `change` (src/shell.js), and carrying the field hook as well would have the `input` listener
  write the same value a second time and move `rev` twice for one tap.

  The empty first option is what a new row holds, and it says "Choose one" rather than naming an
  accommodation nobody has chosen. src/supports.js's newAccommodation() explains why.
*/
function kindField(accommodation, index) {
  const wrap = document.createElement('label');
  wrap.className = 'student-field';

  const label = document.createElement('span');
  label.className = 'student-label';
  label.textContent = 'Kind';
  wrap.append(label);

  const select = document.createElement('select');
  select.className = 'student-select';
  select.setAttribute('data-support-kind', '');
  select.setAttribute('data-accommodation-index', String(index));
  select.setAttribute('aria-label', 'Kind — accommodation ' + (index + 1));

  const blank = document.createElement('option');
  blank.value = '';
  blank.textContent = 'Choose one…';
  select.append(blank);
  ACCOMMODATION_KINDS.forEach((kind) => {
    const option = document.createElement('option');
    option.value = kind.value;
    option.textContent = kind.label;
    select.append(option);
  });
  select.value = sensitiveValue(isKind(accommodation.kind) ? accommodation.kind : '');
  wrap.append(select);
  return wrap;
}

function accommodationField(caption, field, index, value, placeholder) {
  const wrap = document.createElement('label');
  wrap.className = 'student-field';

  const label = document.createElement('span');
  label.className = 'student-label';
  label.textContent = caption;
  wrap.append(label);

  const input = document.createElement('input');
  input.className = 'student-input';
  input.type = 'text';
  input.value = sensitiveValue(value);
  input.setAttribute('data-student-field', 'accommodation.' + field);
  input.setAttribute('data-accommodation-index', String(index));
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('aria-label', caption + ' — accommodation ' + (index + 1));
  input.placeholder = placeholder || '';
  wrap.append(input);
  return wrap;
}

function renderAccommodations(student) {
  const list = document.getElementById(ACCOMMODATION_LIST_ID);
  if (!list) return;
  list.textContent = '';
  if (!supportsVisible()) return;
  const rows = accommodationsOf(supportsOf(student));
  if (!rows.length) {
    list.append(emptyLine('No accommodations recorded. Add the ones you have to implement.'));
    return;
  }
  rows.forEach((a, i) => list.append(accommodationCard(a, i, student)));
}

/* May a support field be on this screen, right now: the app-wide rule from src/supports.js and the
   local one about this dialog, in one place so that no renderer below asks half the question. */
function supportsOnScreen() {
  return supportsVisible() && supportsShown;
}

/* The four plan buttons, updated in place rather than by re-rendering, the same way the preferred
   guardian's are: one plan, not several, and `aria-pressed` moves with the fill because a visually
   active button that still reads "not pressed" is the standard way this component goes wrong.

   None of them is pressed while the panel is shut. A `.active` fill and an `aria-pressed="true"`
   sitting inside a `display: none` block would still be the student's plan status, readable from
   the accessibility tree and out of the DOM — which is the disclosure with the painting turned
   off rather than no disclosure. */
function renderPlanRow(student) {
  const row = document.getElementById(SUPPORTS_PLAN_ROW_ID);
  if (!row) return;
  const plan = supportsOnScreen() ? supportsOf(student).plan : '';
  row.querySelectorAll('[data-support-plan]').forEach((btn) => {
    const on = btn.getAttribute('data-support-plan') === plan;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', btn.textContent.trim() + ' — plan on file for '
      + fullName(student));
  });
}

/*
  Fill, or deliberately un-fill. When the support panel is shut, or when presentation mode has said
  no, every field here is emptied rather than left holding its value behind a
  `display: none` — a hidden element is still an element that a find-in-page, a screenshot tool or
  the accessibility tree can reach, and "it is not painted" is not the same claim as "it is not
  there". The document is untouched either way; this only ever writes into the DOM.
*/
function renderSupportFields(student) {
  const supports = supportsOf(student);
  const show = supportsOnScreen();
  const value = (v) => (show ? sensitiveValue(v) : '');
  const manager = supports.caseManager || {};

  fieldValue('supportsCaseManagerName', value(manager.name));
  fieldValue('supportsCaseManagerEmail', value(manager.email));
  fieldValue('supportsReviewDate', value(supports.reviewDate));
  fieldValue('supportsMedical', value(supports.medical));
  fieldValue('supportsBehaviorPlan', value(supports.behaviorPlan));

  renderPlanRow(student);
  if (show) renderAccommodations(student);
  else {
    const list = document.getElementById(ACCOMMODATION_LIST_ID);
    if (list) list.textContent = '';
  }
}

/* The panel's own state: shut, open, or — while presentation mode is on — not openable at all.

   The hint above the button swaps with the third of those, and that is not politeness. A greyed-out
   button over an empty panel is what a teacher meets in sixth period after turning presentation
   mode on in first, and "her accommodations are gone" is the reasonable reading of it. Both
   sentences are written out in index.html; what happens here is choosing which one is on screen,
   from the same one question every other line in this section asks. */
function renderSupportsPanel(student) {
  const body = document.getElementById(SUPPORTS_BODY_ID);
  const button = document.getElementById(SUPPORTS_REVEAL_ID);
  const hint = document.getElementById(SUPPORTS_HINT_ID);
  const presentationHint = document.getElementById(SUPPORTS_HINT_PRESENTATION_ID);
  const allowed = supportsVisible();
  const show = supportsOnScreen();
  if (body) body.classList.toggle('hidden', !show);
  if (hint) hint.classList.toggle('hidden', !allowed);
  if (presentationHint) presentationHint.classList.toggle('hidden', allowed);
  if (button) {
    button.disabled = !allowed;
    button.setAttribute('aria-expanded', show ? 'true' : 'false');
    button.textContent = show ? 'Hide support details' : 'Show support details';
  }
  renderSupportFields(student);
}

/*
  EVERYTHING ON SCREEN THAT CAN CARRY SUPPORT DATA, REDRAWN. Called from src/shell.js when
  presentation mode is flipped, and from nowhere else.

  Suppression that only applied to the next render would leave the roster the teacher is looking at
  covered in indicator dots until something else happened to redraw it — and she flipped the switch
  because she is about to plug in the projector, so the screen already in front of her is exactly
  the one that has to go quiet. This function is the answer to "and what about what is already on
  the glass"; whether any of it MAY be shown is still src/supports.js's question and is asked, not
  re-decided, in every renderer below.

  The reveal state is dropped rather than remembered across the flip. A panel that sprang back open
  the moment presentation mode came off would be putting a student's plan on screen without the
  deliberate tap docs/data-model.md § Accommodations rule 1 asks for — and the teacher coming out of
  presentation mode is a teacher who has just finished projecting.
*/
export function refreshSupportSurfaces() {
  if (!supportsVisible()) supportsShown = false;
  const student = findStudent(editingId);
  if (student) renderSupportsPanel(student);
  /* The list behind the dialog, whose dots are a disclosure of their own — the row is the wall. */
  renderRoster();
}

/* Open, or shut again. Announced because the whole point of the control is that the screen just
   changed in a way that matters, and a teacher who cannot see the screen is the one who most needs
   telling. What is announced is that they are showing — never a word of what they say. */
export function toggleSupports() {
  const student = findStudent(editingId);
  if (!student || !supportsVisible()) return;
  supportsShown = !supportsShown;
  renderSupportsPanel(student);
  const body = document.getElementById(SUPPORTS_BODY_ID);
  if (supportsShown && body) body.scrollIntoView({ block: 'nearest' });
  announce(supportsShown
    ? 'Support details for ' + fullName(student) + ' are now on screen.'
    : 'Support details are hidden again.');
}

/* The plan, from the enumerated list and from nowhere else. */
export function setPlan(planValue) {
  const student = findStudent(editingId);
  if (!student || !isPlan(planValue) || !supportsVisible()) return;
  const supports = supportsOf(student);
  const had = hasSupports(student);
  update(() => { supports.plan = planValue; });
  renderPlanRow(student);
  refreshSupportDot(student, had);
}

/* The kind of one accommodation, read on `change` — see kindField(). An unknown value writes
   nothing rather than being stored: the <option> list is built from src/supports.js, so a value
   that is not on it did not come from a teacher. */
export function editAccommodationKind(select) {
  const student = findStudent(editingId);
  if (!student || !supportsVisible()) return;
  const index = Number(select.getAttribute('data-accommodation-index'));
  const row = accommodationsOf(supportsOf(student))[index];
  if (!row) return;
  const chosen = select.value;
  if (chosen !== '' && !isKind(chosen)) return;
  const had = hasSupports(student);
  update(() => { row.kind = chosen; });
  /* The card's caption is the kind's own words, so it follows — and only the caption, because
     rebuilding the card would replace the two text fields beside this picker. */
  const card = select.closest('.accommodation-card');
  const label = card && card.querySelector('.accommodation-label');
  if (label) setSensitiveText(label, kindLabel(chosen) || 'Accommodation ' + (index + 1));
  refreshSupportDot(student, had);
}

export function addAccommodation() {
  const student = findStudent(editingId);
  if (!student || !supportsVisible()) return;
  const supports = supportsOf(student);
  update(() => {
    if (!Array.isArray(supports.accommodations)) supports.accommodations = [];
    supports.accommodations.push(newAccommodation());
  });
  renderAccommodations(student);
  announce('Added accommodation ' + accommodationsOf(supports).length + ' for '
    + fullName(student) + '.');
}

export function removeAccommodation(indexValue) {
  const student = findStudent(editingId);
  const index = Number(indexValue);
  if (!student || !supportsVisible()) return;
  const supports = supportsOf(student);
  if (!accommodationsOf(supports)[index]) return;
  const had = hasSupports(student);
  update(() => {
    supports.accommodations = accommodationsOf(supports).filter((a, i) => i !== index);
  });
  renderAccommodations(student);
  refreshSupportDot(student, had);
  /* The announcement counts rather than naming what went. "Removed extended time from Ada Probe"
     is the sentence that reads back the accommodation out loud, in a room. */
  announce('Removed accommodation ' + (index + 1) + ' from ' + fullName(student) + '.');
}

/*
  Clearing the review date on iPadOS. Identical quirk, identical fix and identical reasoning to
  src/classes.js's termDateCommitted() — the date popover keeps its own selection, so a cleared
  field cannot be re-set to the value it just held until the element is thrown away. Read that
  comment; it is not repeated here.

  Cloned rather than rebuilt from a template, because unlike a term date this field is real markup
  in index.html: a clone carries every attribute and hook it was authored with, and the value
  PROPERTY — the thing the picker set — is what a clone does not carry, which is exactly the state
  being discarded.
*/
export function supportDateCommitted(input) {
  const student = findStudent(editingId);
  if (!student || input.value || !supportsVisible()) return;
  const supports = supportsOf(student);
  const had = hasSupports(student);
  /* Conditional for the same reason the term version is: not saving the document over an identical
     copy of itself, and not moving `rev` for a date that was already empty (docs/sync.md). */
  if (supports.reviewDate) update(() => { supports.reviewDate = ''; });
  const fresh = input.cloneNode(true);
  fresh.value = '';
  input.replaceWith(fresh);
  refreshSupportDot(student, had);
}

/* The roster behind the dialog carries the dot, so an edit that turns "nothing on file" into
   "something on file" — or back — has to reach it. Re-rendered only when the ANSWER changed, not
   on every keystroke into a medical note: the roster is 25 rows and rebuilding it per character
   would be work nobody asked for, and the dot looks identical either way. */
function refreshSupportDot(student, had) {
  if (hasSupports(student) !== had) renderRoster();
}

function renderStudentEditor() {
  const student = findStudent(editingId);
  const title = document.getElementById(STUDENT_TITLE_ID);
  if (title) title.textContent = student ? rosterName(student) : 'Student';
  if (!student) return;

  fieldValue('studentFirst', student.first);
  fieldValue('studentLast', student.last);
  fieldValue('studentNickname', student.nickname);
  fieldValue('studentGradYear', student.gradYear);
  fieldValue('studentEmail', student.email);
  fieldValue('studentNotes', student.notes);
  const counselor = counselorOf(student);
  fieldValue('studentCounselorName', counselor.name);
  fieldValue('studentCounselorEmail', counselor.email);

  renderGuardians(student);
  renderStudentClasses(student);
  renderSupportsPanel(student);
}

/*
  `reveal` is true only when the roster row's support dot was the thing that was tapped — that tap
  IS the deliberate one the data model's rule 1 asks for, so making the teacher tap a second time
  inside the dialog would be ceremony rather than protection. Every other way into this editor
  (Edit, the orphan list, the console) opens with the panel shut, and it is shut again the next
  time the dialog opens however it was left.
*/
export function openStudentEditor(studentId, opener, reveal) {
  if (!findStudent(studentId)) return;
  editingId = studentId;
  supportsShown = !!reveal && supportsVisible();
  renderStudentEditor();
  openModal(STUDENT_MODAL_ID, opener);
}

/*
  A field being typed. Called from shell.js's `input` listener, so it fires per keystroke and the
  store's debounce is what turns that into one save (src/store.js).

  The editor is NOT re-rendered — replacing the input the teacher is typing into would take the
  caret with it — but the panel underneath is, so the roster row behind this dialog carries the
  name as it is corrected.
*/
export function editStudentField(input) {
  const student = findStudent(editingId);
  if (!student) return;
  const path = input.getAttribute('data-student-field');
  if (!path) return;

  if (STUDENT_FIELDS.indexOf(path) >= 0) {
    const value = input.value;
    update(() => { student[path] = value; });
    if (path === 'first' || path === 'last' || path === 'nickname') {
      const title = document.getElementById(STUDENT_TITLE_ID);
      if (title) title.textContent = rosterName(student);
      renderRoster();
    }
    return;
  }

  if (path.indexOf('guardian.') === 0) {
    const field = path.slice('guardian.'.length);
    const index = Number(input.getAttribute('data-guardian-index'));
    const guardian = guardiansOf(student)[index];
    if (!guardian || GUARDIAN_FIELDS.indexOf(field) < 0) return;
    const value = input.value;
    update(() => { guardian[field] = value; });
    return;
  }

  if (path.indexOf('counselor.') === 0) {
    const field = path.slice('counselor.'.length);
    if (COUNSELOR_FIELDS.indexOf(field) < 0) return;
    const counselor = counselorOf(student);
    const value = input.value;
    update(() => { counselor[field] = value; });
    return;
  }

  /* The support block's three paths. Each one refuses while support data is suppressed rather than
     trusting that the fields cannot be reached: presentation mode hides the panel, and a hidden
     panel is still in the DOM. A write from one would store the emptied field over the real
     value. */
  if (path.indexOf('supports.') === 0) {
    const field = path.slice('supports.'.length);
    if (SUPPORT_FIELDS.indexOf(field) < 0 || !supportsVisible()) return;
    const supports = supportsOf(student);
    const had = hasSupports(student);
    const value = input.value;
    update(() => { supports[field] = value; });
    refreshSupportDot(student, had);
    return;
  }

  if (path.indexOf('caseManager.') === 0) {
    const field = path.slice('caseManager.'.length);
    if (CASE_MANAGER_FIELDS.indexOf(field) < 0 || !supportsVisible()) return;
    const supports = supportsOf(student);
    const had = hasSupports(student);
    const value = input.value;
    update(() => { supports.caseManager[field] = value; });
    refreshSupportDot(student, had);
    return;
  }

  if (path.indexOf('accommodation.') === 0) {
    const field = path.slice('accommodation.'.length);
    if (ACCOMMODATION_FIELDS.indexOf(field) < 0 || !supportsVisible()) return;
    const index = Number(input.getAttribute('data-accommodation-index'));
    const row = accommodationsOf(supportsOf(student))[index];
    if (!row) return;
    const had = hasSupports(student);
    const value = input.value;
    /* `appliesTo` is an array in the document and a comma-separated line in the field — the split
       is src/supports.js's, and it happens on the way in rather than on the way out so the caret
       is never chased by a re-rendered field. Empty stays an empty array, which is the data
       model's "applies to everything". */
    update(() => { row[field] = field === 'appliesTo' ? parseAppliesTo(value) : value; });
    refreshSupportDot(student, had);
  }
}

export function addGuardian() {
  const student = findStudent(editingId);
  if (!student) return;
  update(() => {
    if (!Array.isArray(student.guardians)) student.guardians = [];
    student.guardians.push(newGuardian(student.guardians.length === 0));
  });
  renderGuardians(student);
  announce('Added guardian ' + guardiansOf(student).length + ' for ' + fullName(student) + '.');
}

export function removeGuardian(indexValue) {
  const student = findStudent(editingId);
  const index = Number(indexValue);
  if (!student || !guardiansOf(student)[index]) return;
  const gone = guardiansOf(student)[index];
  update(() => { student.guardians = guardiansOf(student).filter((g, i) => i !== index); });
  /* The preferred one can have just been removed, and a student with guardians and none of them
     preferred is a student Phase 5's picker has no answer for. The first one takes it back. */
  const left = guardiansOf(student);
  if (left.length && !left.some((g) => g.preferred)) update(() => { left[0].preferred = true; });
  renderGuardians(student);
  announce('Removed ' + (gone.name || 'guardian ' + (index + 1)) + ' from ' + fullName(student) + '.');
}

/* One preferred guardian, not several: the flag answers "who does this go to first", and two
   answers is no answer. The buttons are updated in place rather than by re-rendering the cards,
   so a half-typed phone number three fields away survives the tap. */
export function setPreferredGuardian(indexValue) {
  const student = findStudent(editingId);
  const index = Number(indexValue);
  const guardians = guardiansOf(student);
  if (!student || !guardians[index]) return;
  update(() => { guardians.forEach((g, i) => { g.preferred = (i === index); }); });

  document.querySelectorAll('#' + GUARDIAN_LIST_ID + ' [data-guardian-preferred]').forEach((btn) => {
    const on = Number(btn.getAttribute('data-guardian-preferred')) === index;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  announce((guardians[index].name || 'Guardian ' + (index + 1)) + ' is who Planbook contacts '
    + 'first about ' + fullName(student) + '.');
}

/* Membership, from the editor. The class holds the id; the student is not touched at all — which
   is why moving a student between two classes cannot lose their contacts, and why a student can
   be in both at once without anything being copied. */
export function toggleStudentClass(classId) {
  const student = findStudent(editingId);
  const cls = getActiveClasses().filter((c) => c.id === classId)[0];
  if (!student || !cls) return;
  const on = rosterOf(cls).indexOf(student.id) >= 0;
  update(() => {
    if (on) cls.roster = rosterOf(cls).filter((id) => id !== student.id);
    else {
      if (!Array.isArray(cls.roster)) cls.roster = [];
      cls.roster.push(student.id);
    }
  });
  renderStudentClasses(student);
  renderRoster();
  announce(fullName(student) + (on ? ' is off ' : ' is on ') + cls.name + '.');
}

/* ────────────────────────────── delete, and what it costs ────────────────────────────── */

/*
  Everything a delete would destroy, counted off the open document rather than estimated — the
  same reasoning as src/classes.js's delete confirm. "Delete Ada Probe?" is a question a tired
  teacher answers yes to; "her guardian and counselor contacts, 41 attendance marks and 18 scores"
  is one she reads.
*/
function deletionCounts(doc, student) {
  const marks = (Array.isArray(doc.attendance) ? doc.attendance : [])
    .filter((r) => r.marks && Object.prototype.hasOwnProperty.call(r.marks, student.id)).length;
  const scores = Object.keys(doc.scores || {}).reduce((n, assignmentId) => {
    const column = doc.scores[assignmentId];
    return n + (column && Object.prototype.hasOwnProperty.call(column, student.id) ? 1 : 0);
  }, 0);
  const contacts = guardiansOf(student).length
    + ((student.counselor && (student.counselor.name || student.counselor.email)) ? 1 : 0);
  return { marks: marks, scores: scores, contacts: contacts };
}

function factLine(parent, text) {
  const el = document.createElement('div');
  el.className = 'student-delete-line';
  el.textContent = text;
  parent.append(el);
}

export function openStudentDeleteConfirm(studentId, opener) {
  const doc = getDoc();
  const student = findStudent(studentId);
  if (!doc || !student) return;
  /* Set here and read only by confirmStudentDelete(), which only the button inside the dialog
     calls — so a value left behind by a teacher who closed the dialog with the ✕ can do nothing
     on its own, and the next open replaces it. Same shape as src/classes.js's pendingDeleteId. */
  pendingDeleteId = studentId;

  const counts = deletionCounts(doc, student);
  const lead = document.getElementById(DELETE_LEAD_ID);
  if (lead) {
    lead.textContent = 'Deleting ' + fullName(student) + ' removes the student from this school '
      + 'year entirely. This cannot be undone, and a backup file is the only way back. If the '
      + 'student has only left one of your classes, leaving them here costs nothing.';
  }

  const facts = document.getElementById(DELETE_FACTS_ID);
  if (facts) {
    facts.textContent = '';
    if (counts.contacts) {
      factLine(facts, plural(counts.contacts, 'contact', 'contacts') + ' — guardian and '
        + 'counselor details');
    }
    if (counts.marks) factLine(facts, plural(counts.marks, 'attendance mark', 'attendance marks'));
    if (counts.scores) factLine(facts, plural(counts.scores, 'score', 'scores'));
    if (!counts.contacts && !counts.marks && !counts.scores) {
      factLine(facts, 'Nothing has been recorded for this student yet — no contacts, no '
        + 'attendance, no grades.');
    }
  }

  const button = document.getElementById(DELETE_BTN_ID);
  if (button) button.textContent = 'Delete ' + fullName(student);

  openModal(DELETE_MODAL_ID, opener);
}

/*
  Yes. The only line in this module that destroys anything.

  What it deliberately leaves alone: ATTENDANCE MARKS AND SCORES belonging to this student. A mark
  is a key inside a record that belongs to a class and a date, and a score is a key inside a column
  that belongs to an assignment — rewriting every one of those to prune a name is a whole-document
  edit run for tidiness, and the failure mode if it goes wrong is a class's attendance losing a day.
  A key that matches no student matches nothing and shows up nowhere, which is the harmless
  failure and the same answer src/classes.js gives for a deleted class id sitting in an event.
*/
export function confirmStudentDelete() {
  const doc = getDoc();
  const student = findStudent(pendingDeleteId);
  pendingDeleteId = '';
  if (!doc || !student) { closeModal(DELETE_MODAL_ID); return; }

  const name = fullName(student);
  update((d) => {
    /* Off every roster as well as out of the array, archived classes included — this is the one
       operation that is allowed to reach a class the teacher cannot see, because leaving an id
       behind there would restore a student who no longer exists the moment it is unarchived. */
    (Array.isArray(d.classes) ? d.classes : []).forEach((c) => {
      if (Array.isArray(c.roster)) c.roster = c.roster.filter((id) => id !== student.id);
    });
    d.students = studentsIn(d).filter((s) => s.id !== student.id);
  });

  closeModal(DELETE_MODAL_ID);
  if (editingId === student.id) {
    editingId = '';
    closeModal(STUDENT_MODAL_ID);
  }
  renderRoster();
  announce('Deleted ' + name + ' from the school year.');
}

/* No. Nothing has been written, so there is nothing to undo — which is the point of counting
   before the dialog rather than after it. */
export function cancelStudentDelete() {
  pendingDeleteId = '';
  closeModal(DELETE_MODAL_ID);
  announce('Nothing was deleted.');
}

/* ────────────────────────────── the paste box ────────────────────────────── */

function showPasteError(message) {
  const el = document.getElementById(PASTE_ERROR_ID);
  if (!el) return;
  el.textContent = message || '';
  el.classList.toggle('hidden', !message);
  if (message) announce(message);
}

function showPasteView(which) {
  const edit = document.getElementById(PASTE_EDIT_VIEW_ID);
  const review = document.getElementById(PASTE_REVIEW_VIEW_ID);
  if (edit) edit.classList.toggle('hidden', which !== 'edit');
  if (review) review.classList.toggle('hidden', which !== 'review');
}

export function openPaste(opener) {
  const cls = getSelectedClass();
  pasteClassId = cls ? cls.id : '';
  pasteRows = [];
  showPasteError('');
  showPasteView('edit');
  const box = document.getElementById(PASTE_BOX_ID);
  if (box) box.value = '';
  const target = document.getElementById('rosterPasteClassName');
  if (target) target.textContent = cls ? cls.name : 'this school year';
  openModal(PASTE_MODAL_ID, opener);
}

function pasteClass() {
  const doc = getDoc();
  if (!doc || !pasteClassId) return null;
  return (Array.isArray(doc.classes) ? doc.classes : [])
    .filter((c) => c.id === pasteClassId)[0] || null;
}

/*
  What each row will do when the list is committed, recomputed on every edit because the teacher
  editing a name is exactly what changes the answer.

    new   — nobody in this school year has that name; a student record is created.
    link  — that name is already in the school year but not in this class; the EXISTING student is
            put on this class's roster. No second record, no second set of contacts.
    here  — that name is already on this class's roster. Off by default, which is what makes
            re-pasting last week's list a no-op instead of a doubled roster.
    twice — the same name is on an earlier line of this same paste, which is what a list pasted
            into the box two times looks like.
    blank — nothing on the row to add.

  A `here` or `twice` row that the teacher ticks anyway creates a second student, because two
  people can share a name and she is the one who knows. The row says so.
*/
function settle(row, index) {
  const key = nameKey(row.first, row.last);
  if (!key.replace('|', '')) return { kind: 'blank', existingId: '' };
  const earlier = pasteRows.slice(0, index)
    .some((r) => nameKey(r.first, r.last) === key);
  if (earlier) return { kind: 'twice', existingId: '' };
  const cls = pasteClass();
  const match = studentsIn(getDoc()).filter((s) => nameKey(s.first, s.last) === key)[0];
  if (!match) return { kind: 'new', existingId: '' };
  if (cls && rosterOf(cls).indexOf(match.id) >= 0) return { kind: 'here', existingId: match.id };
  return { kind: 'link', existingId: match.id };
}

const DISPOSITION_NOTES = {
  new: '',
  link: 'Already in this school year — will be added to this class, not duplicated',
  here: 'Already in this class — tick only to add a second student with this name',
  twice: 'The same name is on an earlier line of this paste',
  blank: 'No name on this row',
};

/* A row's disposition after an edit, and the one rule about the tick that goes with it: the
   default follows the disposition, and a disposition that has not changed leaves the teacher's
   own choice alone. Without that, ticking "add a second student with this name" and then fixing a
   typo in it would silently untick itself. */
function refreshRow(index) {
  const row = pasteRows[index];
  const was = row.kind;
  const settled = settle(row, index);
  row.kind = settled.kind;
  row.existingId = settled.existingId;
  if (row.kind !== was) row.include = !row.isHeader && (row.kind === 'new' || row.kind === 'link');

  const el = document.querySelectorAll('#' + PASTE_LIST_ID + ' .paste-row')[index];
  if (el) {
    const note = el.querySelector('.paste-row-note');
    if (note) note.textContent = rowNote(row);
    const toggle = el.querySelector('[data-paste-include]');
    if (toggle) {
      toggle.classList.toggle('active', !!row.include);
      toggle.setAttribute('aria-pressed', row.include ? 'true' : 'false');
      toggle.textContent = row.include ? 'Add' : 'Skip';
    }
    el.classList.toggle('warn', isWarnRow(row));
  }
}

function rowNote(row) {
  const note = DISPOSITION_NOTES[row.kind] || '';
  if (note && row.warning) return row.warning + ' · ' + note;
  return note || row.warning || '';
}

/* Amber is for a row that will not do what the line said, or where the split was a guess. A
   `link` row is neither — it is the feature working — and colouring it would make a paste of one
   class's list into another read as twenty-five problems. */
function isWarnRow(row) {
  return !!row.warning || row.kind === 'here' || row.kind === 'twice' || row.kind === 'blank';
}

function pasteInput(caption, field, index, value) {
  const wrap = document.createElement('label');
  wrap.className = 'paste-field';

  const label = document.createElement('span');
  label.className = 'student-label';
  label.textContent = caption;
  wrap.append(label);

  const input = document.createElement('input');
  input.className = 'paste-input';
  input.type = 'text';
  input.value = value || '';
  input.setAttribute('data-paste-field', field);
  input.setAttribute('data-paste-index', String(index));
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('aria-label', caption + ' — row ' + (index + 1));
  wrap.append(input);
  return wrap;
}

function pasteRowEl(row, index) {
  const el = document.createElement('div');
  el.className = 'paste-row' + (isWarnRow(row) ? ' warn' : '');

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'toggle-btn' + (row.include ? ' active' : '');
  toggle.setAttribute('data-paste-include', String(index));
  toggle.setAttribute('aria-pressed', row.include ? 'true' : 'false');
  toggle.setAttribute('aria-label', 'Add row ' + (index + 1) + ' to the roster');
  toggle.textContent = row.include ? 'Add' : 'Skip';
  el.append(toggle);

  const fields = document.createElement('div');
  fields.className = 'paste-fields';
  fields.append(pasteInput('Last', 'last', index, row.last),
    pasteInput('First', 'first', index, row.first));
  el.append(fields);

  /* The per-row swap, which is the whole answer to a wrong guess: two taps, on the row where it
     is wrong, before anything is written. The label is the glyph rather than the word because the
     row is already three controls wide on a phone. */
  const swap = document.createElement('button');
  swap.type = 'button';
  swap.className = 'class-action-btn move';
  swap.setAttribute('data-paste-swap', String(index));
  swap.setAttribute('aria-label', 'Swap first and last name on row ' + (index + 1));
  swap.textContent = '⇄';
  el.append(swap);

  const note = document.createElement('span');
  note.className = 'paste-row-note';
  note.textContent = rowNote(row);
  el.append(note);
  return el;
}

function renderPasteReview() {
  const list = document.getElementById(PASTE_LIST_ID);
  if (!list) return;
  list.textContent = '';
  pasteRows.forEach((row, i) => list.append(pasteRowEl(row, i)));
  refreshPasteCount();
}

/* The count line, and it counts in the three words the dispositions use rather than in one
   number: "18 will be added" beside a list where four of them are links and three are already
   there is a sentence that hides exactly what the teacher came here to check. */
function refreshPasteCount() {
  const el = document.getElementById(PASTE_COUNT_ID);
  const button = document.getElementById(PASTE_COMMIT_ID);
  const included = pasteRows.filter((r) => r.include);
  const fresh = included.filter((r) => r.kind !== 'link').length;
  const linked = included.filter((r) => r.kind === 'link').length;
  const here = pasteRows.filter((r) => r.kind === 'here' && !r.include).length;
  const twice = pasteRows.filter((r) => r.kind === 'twice' && !r.include).length;
  const cls = pasteClass();

  if (el) {
    const parts = [];
    parts.push(plural(fresh, 'new student', 'new students'));
    if (linked) {
      parts.push(plural(linked, 'student', 'students') + ' already in this school year, added to '
        + (cls ? cls.name : 'this class'));
    }
    if (here) parts.push(plural(here, 'name', 'names') + ' already in this class, skipped');
    if (twice) parts.push(plural(twice, 'repeated line', 'repeated lines') + ', skipped');
    el.textContent = parts.join(' · ') + ' — out of ' + plural(pasteRows.length, 'line', 'lines') + '.';
  }
  if (button) {
    button.disabled = included.length === 0;
    button.textContent = included.length
      ? 'Add ' + plural(included.length, 'student', 'students')
      : 'Nothing to add';
  }
}

export function previewPaste() {
  const box = document.getElementById(PASTE_BOX_ID);
  if (!box) return;
  /* A trailing blank line is what a copy out of a spreadsheet always has, and a blank line in the
     middle is what a copy out of two ranges has. Both are dropped here rather than shown as empty
     rows the teacher has to untick. */
  const lines = String(box.value || '').split('\n').map((l) => l.replace(/\s+$/, ''))
    .filter((l) => tidy(l).length > 0);
  if (!lines.length) {
    showPasteError('There are no names in the box yet. Paste your list, one student per line.');
    box.focus();
    return;
  }
  if (!getDoc()) {
    showPasteError('There is no school year open, so there is nowhere to put a roster yet.');
    return;
  }

  /* Parsed first, settled second, because settle() reads the rows before the one it is settling —
     the same name twice in one paste is a repeat, and it can only be seen once the whole list
     exists. */
  pasteRows = lines.map((line) => {
    const parsed = parseRosterLine(line);
    return {
      first: parsed.first, last: parsed.last, warning: parsed.warning,
      isHeader: parsed.isHeader, include: true, kind: 'new', existingId: '',
    };
  });
  pasteRows.forEach((row, i) => {
    const settled = settle(row, i);
    row.kind = settled.kind;
    row.existingId = settled.existingId;
    row.include = !row.isHeader && (row.kind === 'new' || row.kind === 'link');
  });

  showPasteError('');
  showPasteView('review');
  renderPasteReview();
  announce(plural(pasteRows.length, 'line', 'lines') + ' read. Check the split before adding them.');
}

export function backToPasteEdit() {
  showPasteView('edit');
  showPasteError('');
  const box = document.getElementById(PASTE_BOX_ID);
  if (box) box.focus();
}

/* Typed into a preview field. The row is not re-rendered — that would replace the input under the
   caret — but its note and its Add/Skip state are, because editing a name is what changes whether
   that name is already in the year. */
export function editPasteField(input) {
  const index = Number(input.getAttribute('data-paste-index'));
  const field = input.getAttribute('data-paste-field');
  const row = pasteRows[index];
  if (!row || (field !== 'first' && field !== 'last')) return;
  row[field] = input.value;
  /* The parser's own warning belonged to the line as pasted. Once the teacher has corrected the
     row it is her split, and leaving "read as First Last" under it would be telling her the thing
     she just fixed is still a guess. */
  row.warning = '';
  refreshRow(index);
  refreshPasteCount();
}

export function togglePasteRow(indexValue) {
  const index = Number(indexValue);
  const row = pasteRows[index];
  if (!row) return;
  row.include = !row.include;
  const el = document.querySelectorAll('#' + PASTE_LIST_ID + ' .paste-row')[index];
  const toggle = el && el.querySelector('[data-paste-include]');
  if (toggle) {
    toggle.classList.toggle('active', row.include);
    toggle.setAttribute('aria-pressed', row.include ? 'true' : 'false');
    toggle.textContent = row.include ? 'Add' : 'Skip';
  }
  refreshPasteCount();
}

/* One row, the wrong way round. */
export function swapPasteRow(indexValue) {
  const index = Number(indexValue);
  const row = pasteRows[index];
  if (!row) return;
  const was = row.first;
  row.first = row.last;
  row.last = was;
  row.warning = '';
  const el = document.querySelectorAll('#' + PASTE_LIST_ID + ' .paste-row')[index];
  if (el) {
    const inputs = el.querySelectorAll('.paste-input');
    if (inputs[0]) inputs[0].value = row.last;
    if (inputs[1]) inputs[1].value = row.first;
  }
  refreshRow(index);
  refreshPasteCount();
  announce('Row ' + (index + 1) + ' is now ' + rosterName(row) + '.');
}

/*
  Every row, the wrong way round — which is what a paste from a system that writes `First Last`
  in a single column looks like once the preview shows it. One tap beats twenty-five, and it is
  the reason the preview shows the split at all.
*/
export function swapAllPasteRows() {
  if (!pasteRows.length) return;
  pasteRows.forEach((row) => {
    const was = row.first;
    row.first = row.last;
    row.last = was;
    row.warning = '';
  });
  pasteRows.forEach((row, i) => {
    const settled = settle(row, i);
    row.kind = settled.kind;
    row.existingId = settled.existingId;
    row.include = !row.isHeader && (row.kind === 'new' || row.kind === 'link');
  });
  renderPasteReview();
  announce('First and last names swapped on every row.');
}

/*
  Commit. One update() for the whole list, so twenty-five students are one save and one rev
  (src/store.js) rather than twenty-five of each.
*/
export function commitPaste() {
  const doc = getDoc();
  const cls = pasteClass();
  const included = pasteRows.filter((r) => r.include);
  if (!doc || !included.length) return;

  let created = 0;
  let linked = 0;
  update((d) => {
    if (cls && !Array.isArray(cls.roster)) cls.roster = [];
    included.forEach((row) => {
      if (row.kind === 'link' && row.existingId) {
        if (cls && rosterOf(cls).indexOf(row.existingId) < 0) {
          cls.roster.push(row.existingId);
          linked += 1;
        }
        return;
      }
      const student = newStudent(tidy(row.first), tidy(row.last));
      studentsIn(d).push(student);
      if (cls) cls.roster.push(student.id);
      created += 1;
    });
  });

  pasteRows = [];
  closeModal(PASTE_MODAL_ID);
  renderRoster();
  announce('Added ' + plural(created, 'student', 'students')
    + (linked ? ', and put ' + plural(linked, 'student', 'students')
      + ' who were already in this school year onto the roster' : '')
    + (cls ? ' — ' + cls.name + ' now has ' + plural(rosterOf(cls).length, 'student', 'students')
      : '') + '.');
}
