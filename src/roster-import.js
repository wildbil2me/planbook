/*
  The SIS contact import — one class's students, their emails and phones, their advisor and their
  guardians, read out of the file the school system exports per section.

  SHAPED LIKE src/roster.js AND src/classes.js: a feature in its own file, driven by the data-*
  hooks src/shell.js routes to it, rendering rows with createElement rather than innerHTML — a
  guardian's name comes out of a school system and a student called "Bo <b>x</b>" has to be a
  student called "Bo <b>x</b>" — and reporting its refusals into its own dialog rather than onto
  the save chip. The chip means "did a save land"; "that file is not a CSV" is not a save.

  THE IMPORT RUNS ONE WAY, and it is the reason this is a file rather than another thousand lines
  at the foot of src/roster.js. THIS file imports src/roster.js — parseRosterLine(), nameKey(),
  fullName(), renderRoster(), newStudent() and newGuardian(), which is the whole of what the roster
  knows about names and about the shape of a student record. src/roster.js imports THIS file for
  nothing at all, and must not: src/shell.js dispatches the open, exactly as it already dispatches
  data-roster-paste, which is where every other order-of-operations question in this app is
  answered. An import back the other way would close the sixth loop this repo has refused
  (src/shell.js's header, src/classes.js's header, src/categories.js's header, src/views.js's).

  THE PASTE BOX IS NOT EXTENDED AND THAT IS THE POINT. openPaste() takes a textarea of one name per
  line and its whole question is "which half is the surname". This file is eight quoted columns with
  a student's guardians on continuation rows underneath them; one dialog cannot ask both questions
  without becoming two dialogs sharing a modal. So this is a second door beside the first, in the
  same .roster-actions row, and neither touches the other — the paste box is the fallback if this
  import refuses a file at 7am, so nothing here may make it worse.

  WHAT IS NOT IN THE FILE, AND WHY THAT IS A FACT ABOUT THE SOURCE. Accommodations, IEP/504 status,
  medical alerts, behaviour plans and case managers are not in this export and never will be — the
  owner receives those per student through a different channel and enters them on the student's own
  card. So THIS MODULE NEVER WRITES A SINGLE FIELD UNDER `supports`: there is no path from any of
  the eight columns to one, this file imports src/supports.js for nothing, and a student the import
  CREATES gets newSupports()'s defaults by way of newStudent() and nothing else. If the export one
  day grows a column called Notes, Alerts or Flags, mapping it anywhere under that block is a new
  work order and an owner decision — the failure mode is an innocuous-looking column carrying a
  sentence about a seizure protocol into a field this app treats as ordinary. The other half of the
  same property is worth keeping too: because no plan or medical data is ever in this file, a
  contacts CSV sitting in iCloud Drive is not a disclosure, which is exactly the position
  docs/data-model.md § Accommodations takes about what may leave the app.

  SIX THINGS THAT WILL LOOK LIKE OMISSIONS AND ARE DECISIONS. The first four are the owner's, taken
  when this was booked, and they are not re-derivable from the code:

  1. THE ADVISOR IS THE COUNSELOR, AND THE NAME IS FLIPPED. students[].counselor already exists and
     the SIS calls the same person something else. `Smith, Mike` is stored as `Mike Smith`, through
     the same parser the roster uses, because counselor.name is one string that renders into Phase 5
     outreach as it stands and "Smith, Mike" reads wrong in a sentence.

  2. THE (M) AND (H) MARKERS STAY IN THE STRING, VERBATIM. No `type` field, no normalisation, no
     stripping. They are what the teacher reads at a glance, they round-trip exactly, and nothing in
     this app branches on a phone number — outreach is mailto:.

  3. A PHONE CELL HOLDING TWO NUMBERS SPLITS INTO TWO FIELDS, and the same splitter runs over the
     student column and the guardian column. The sample has one number in the student's cell and two
     in the guardian's, but it is ONE export writing both, and a student cell that arrives with two
     numbers next August must not behave differently from a guardian cell that does. A third number
     is appended to phone2 rather than dropped: nothing imported is ever silently lost.

  4. `relation` IS LEFT EMPTY. `Mr.` and `Mrs.` are a title, not a relationship — a Mrs. on a roster
     line is as often a stepmother, an aunt or a grandmother as a mother — and {{guardian.relation}}
     is a Phase 5 merge field, so a wrong guess reaches an email. The honorific stays inside
     guardian.name where it was typed.

  5. COLUMN 1 IS THE GROUPING KEY, NEVER THE ALL-EMPTY ROW. `,,,,,,,` is decoration: reading it as
     the record separator works on the sample and fails on a file whose last student has no trailing
     separator, on a file a teacher trimmed by hand, and on an export with the blank rows suppressed.
     A row with a non-empty column 1 starts a student; a row with column 1 empty and a Parents cell
     adds another guardian to the student above it; an all-empty row means nothing and is skipped.

  6. THE PREVIEW IS NOT A CONFIRMATION STEP. It is the screen where a wrong split is caught, so
     every student arrives as two editable fields with the guess already in them — the paste box's
     rule, for the paste box's reason — with the contacts shown beside them, read-only. The contacts
     are the file; the name is a guess. A row a teacher does not want is toggled off, and that
     student's editor is one tap away afterwards. A dialog that only counted the rows would be
     counting the mistakes about to commit.

  AND THE TWO WRITING RULES, which are what make a re-import safe and are also the owner's. A
  NON-EMPTY IMPORTED VALUE WINS — it overwrites what is on the record, because the file is the SIS's
  answer and the SIS is the official record. AN EMPTY CELL NEVER CLEARS ANYTHING — a column the
  export happened to omit, or a cell nobody filled in, must not delete a phone number the teacher
  typed by hand. The two are not in tension: the second is what stops the first from being a delete
  nobody asked for. NOBODY IS EVER REMOVED FROM ANYTHING either — a student on the roster who is
  absent from the file is untouched, and removal stays the deliberate tap it is in the roster list.
*/

import { getDoc, update } from './store.js';
import { openModal, closeModal } from './modal.js';
import { announce } from './live-region.js';
import { getSelectedClass } from './classes.js';
import {
  fullName, nameKey, newGuardian, newStudent, parseRosterLine, renderRoster,
} from './roster.js';

const IMPORT_MODAL_ID = 'rosterImportModal';
const IMPORT_CLASS_NAME_ID = 'rosterImportClassName';
const IMPORT_FILE_ID = 'rosterImportFile';
const IMPORT_ERROR_ID = 'rosterImportError';
const IMPORT_REVIEW_ID = 'rosterImportReview';
const IMPORT_LIST_ID = 'rosterImportList';
const IMPORT_COUNT_ID = 'rosterImportCount';
const IMPORT_COMMIT_ID = 'rosterImportCommitBtn';

/* The eight columns, left to right, named rather than counted at the point of use: `cells[5]` is
   the kind of thing that survives a re-order of the export and quietly imports the advisor's email
   as a guardian's name. */
const COLUMNS = 8;
const COL_NAME = 0;
const COL_EMAIL = 1;
const COL_PHONE = 2;
const COL_ADVISOR = 3;
const COL_ADVISOR_EMAIL = 4;
const COL_PARENT = 5;
const COL_PARENT_PHONE = 6;
const COL_PARENT_EMAIL = 7;

/* A guard against a file that is not this file at all. A real section is twenty-five students at
   about 300 bytes a row; anything past this is a spreadsheet somebody exported whole, or not a
   spreadsheet, and reading megabytes of it into a preview list would take the tab down. Same shape
   and same reasoning as src/backup.js's MAX_FILE_BYTES, at a size this file justifies. */
const MAX_FILE_BYTES = 2 * 1024 * 1024;

/* The preview, and the class it is being imported into. `importRows` is the model the review list
   renders from and the commit reads — the inputs on screen write into it as they are typed, which
   is what lets a split be corrected without the list being re-rendered under the caret. An id
   rather than an object for the class, for the reason src/roster.js gives: the document can be
   replaced underneath this module by a restore or a year switch. */
let importRows = [];
let importClassId = '';
/* Rows the reader could not attach to anybody — a file that opens on a guardian. Kept so the
   preview can say so out loud rather than dropping them in silence. */
let importSkipped = [];

/* ────────────────────────────── reading the document ────────────────────────────── */

function studentsIn(doc) { return doc && Array.isArray(doc.students) ? doc.students : []; }

function rosterOf(cls) { return cls && Array.isArray(cls.roster) ? cls.roster : []; }

function findStudent(id) {
  return studentsIn(getDoc()).filter((s) => s.id === id)[0] || null;
}

function importClass() {
  const doc = getDoc();
  if (!doc || !importClassId) return null;
  return (Array.isArray(doc.classes) ? doc.classes : [])
    .filter((c) => c.id === importClassId)[0] || null;
}

function guardiansOf(student) {
  return student && Array.isArray(student.guardians) ? student.guardians : [];
}

function counselorOf(student) {
  return student && student.counselor && typeof student.counselor === 'object'
    ? student.counselor : { name: '', email: '' };
}

/* Whitespace only, and never the inside of a value. Every cell arrives with whatever spaces a
   spreadsheet put around it, and nothing here may touch what is between them: reformatting a phone
   number is out of scope by name, and `(508) 234-5678 (M)` has to come back out as those exact
   characters. src/roster.js's tidy() collapses runs of whitespace as well, which is right for a
   name it is about to key on and wrong for a value it is about to store. */
function clean(value) { return String(value == null ? '' : value).trim(); }

function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

/* ────────────────────────────── the CSV reader ────────────────────────────── */

/*
  A real one: double-quoted fields, "" as an escaped quote inside them, commas AND newlines inside
  quotes, \r\n and \n both, and a leading BOM stripped.

  It has to be real for a reason nearer than RFC 4180. This app already WRITES CSV with a BOM and
  CRLF endings and quotes any cell holding a comma — recordCsv() and csvCell() in
  src/attendance-report.js — so a reader that choked on either could not read what its own sibling
  produces, and there is an acceptance line about exactly that. And the naive split is not merely
  imprecise here, it is catastrophic: "Smith, Jonathan (John) '28" is ONE cell, and splitting the
  sample's first row on commas gives ten columns and a student called `Jonathan (John) '28`.

  A quote that opens part way through an unquoted cell (`Bob "The Man" Smith`) is malformed under
  the spec, and this reads it the forgiving way — quoting simply starts there — because refusing a
  roster over it at 7am helps nobody and the preview shows what came out either way.
*/
function parseCsv(text) {
  const s = String(text == null ? '' : text).replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s.charAt(i);
    if (quoted) {
      if (ch !== '"') { cell += ch; continue; }
      /* A doubled quote inside a quoted field is one literal quote — the escape csvCell() writes. */
      if (s.charAt(i + 1) === '"') { cell += '"'; i++; continue; }
      quoted = false;
      continue;
    }
    if (ch === '"') { quoted = true; continue; }
    if (ch === ',') { row.push(cell); cell = ''; continue; }
    if (ch === '\r' || ch === '\n') {
      /* CRLF is one ending, not two: consuming the \n here is what keeps a stray \r out of the
         last cell of every row of a file this app wrote itself. */
      if (ch === '\r' && s.charAt(i + 1) === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }
    cell += ch;
  }
  /* The last row, when the file does not end in a newline. A file that DOES end in one leaves both
     of these empty, and pushing a phantom row would put an all-empty row on the end of every file
     this app produces. */
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

/* The reader, exported for tools/verify-shell.mjs and for that reason only — nothing in the app
   calls it from outside this file, which is the same standing parseRosterLine() has in
   src/roster.js. There is one acceptance line this seam is the only honest way to answer: a CSV
   written by recordCsv() in src/attendance-report.js — BOM, CRLF, a cell holding a comma, a doubled
   quote — has to read back with an unmangled first cell and no stray \r, and that file has eight
   columns of attendance rather than eight columns of contacts, so it cannot be put through the
   import itself. A second CSV reader living in the harness could agree with itself perfectly while
   this one mangled every file it was handed. */
export function readCsvRows(text) { return parseCsv(text); }

/* ────────────────────────────── the name cell ────────────────────────────── */

/*
  `Last, First (Nickname) 'YY` — the SIS's shape, taken apart in that order of operations and no
  other. The grad year comes off the end first, then the nickname out of its parentheses, and what
  is LEFT is handed to src/roster.js's parseRosterLine(). That is where `Last, First`, the surname
  particles, the suffixes and the header words are already solved, and it is the one place this
  project has agreed to solve them: a second name parser in a second file is two answers to one
  question, and the one that rots is the one nobody re-reads.

  `'28` stores as `2028`; a four-digit year stores as itself; gradYear stays a STRING, per
  docs/data-model.md. Two digits are read as this century because a roster is a list of people who
  have not graduated yet — the alternative is a rule about pivot years for a field nothing computes
  with.
*/
function parseNameCell(cell) {
  let rest = clean(cell);
  let gradYear = '';
  let nickname = '';

  /* Straight and curly apostrophes both: a name typed into a spreadsheet on a Mac carries the
     curly one and the teacher cannot see the difference. */
  const year = rest.match(/[’']\s*(\d{4}|\d{2})\s*$/);
  if (year) {
    gradYear = year[1].length === 4 ? year[1] : '20' + year[1];
    rest = rest.slice(0, year.index).trim();
  }

  const nick = rest.match(/\(([^)]*)\)/);
  if (nick) {
    nickname = clean(nick[1]);
    rest = (rest.slice(0, nick.index) + ' ' + rest.slice(nick.index + nick[0].length)).trim();
  }

  const parsed = parseRosterLine(rest);
  return {
    first: parsed.first,
    last: parsed.last,
    nickname: nickname,
    gradYear: gradYear,
    warning: parsed.warning,
    isHeader: parsed.isHeader,
  };
}

/* The advisor, who is the counselor — one string, flipped out of `Last, First` by the same parser,
   for decision 1's reason. A cell that is already `First Last` comes back out unchanged, because
   that is what parseRosterLine() does with a line that has no separator in it. */
function personName(cell) {
  const raw = clean(cell);
  if (!raw) return '';
  const parsed = parseRosterLine(raw);
  return (parsed.first + ' ' + parsed.last).trim() || raw;
}

/* ────────────────────────────── the phone splitter ────────────────────────────── */

/*
  One cell in, `phone` and `phone2` out, and the same function over the student's column and the
  guardian's — decision 3. Split on commas, trim each, first to `phone`, second to `phone2`, and
  anything past the second appended to `phone2` after ", " so that a cell with three numbers in it
  loses none of them. The markers are inside the pieces and are never touched.
*/
function splitPhones(cell) {
  const parts = clean(cell).split(',').map((p) => p.trim()).filter(Boolean);
  return { phone: parts[0] || '', phone2: parts.slice(1).join(', ') };
}

/* ────────────────────────────── the file, as a list of students ────────────────────────────── */

/*
  Returns { students, skipped, error }. `error` is a sentence for the dialog's error line and means
  nothing was read at all; every refusal writes nothing, and there is no partial import.

  The header row is detected by asking parseRosterLine() what it thinks of the FIRST non-empty
  row's name cell and reading its isHeader — HEADER_WORDS already contains `student name`, so the
  reuse is exact, and the sample file, which has no header, imports its first student normally.
*/
function readStudents(text) {
  const raw = String(text == null ? '' : text).replace(/^\uFEFF/, '');
  if (!clean(raw)) {
    return { students: [], skipped: [], error: 'That file is empty, so there is nothing to import.' };
  }
  /* A JSON file, named before it is parsed. It is the file most likely to be chosen here by
     mistake — it is the other thing this app hands a teacher — and "no students could be read"
     would send her looking for a fault in a file that is perfectly good and simply belongs
     somewhere else. */
  const head = clean(raw).charAt(0);
  if (head === '{' || head === '[') {
    return { students: [], skipped: [],
      error: 'That looks like a Planbook backup rather than a contact list. A backup is restored '
        + 'from the backup panel in the header, not from here. Nothing has been imported.' };
  }

  const rows = parseCsv(raw);
  const students = [];
  const skipped = [];
  let headerChecked = false;

  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i];
    const line = i + 1;
    /* An all-empty row is decoration and means nothing — decision 5. Checked before the width test
       below, so a hand-trimmed blank line costs nobody an import. */
    if (cells.every((c) => !clean(c))) continue;

    if (cells.length < COLUMNS) {
      return { students: [], skipped: [],
        error: 'Row ' + line + ' of that file has ' + plural(cells.length, 'column', 'columns')
          + ' where the contact export has ' + COLUMNS + '. Nothing has been imported — export the '
          + 'class again, or open the file in a spreadsheet and look at that row.' };
    }

    if (!headerChecked) {
      headerChecked = true;
      if (parseRosterLine(cells[COL_NAME]).isHeader) continue;
    }

    if (clean(cells[COL_NAME])) {
      const parsed = parseNameCell(cells[COL_NAME]);
      const own = splitPhones(cells[COL_PHONE]);
      students.push({
        line: line,
        first: parsed.first,
        last: parsed.last,
        nickname: parsed.nickname,
        gradYear: parsed.gradYear,
        email: clean(cells[COL_EMAIL]),
        phone: own.phone,
        phone2: own.phone2,
        counselor: {
          name: personName(cells[COL_ADVISOR]),
          email: clean(cells[COL_ADVISOR_EMAIL]),
        },
        guardians: [],
        warning: parsed.warning,
        include: true,
        kind: 'new',
        existingId: '',
      });
    }

    /* A guardian — on the student's own row, and on every continuation row under it. */
    const parentName = clean(cells[COL_PARENT]);
    const parentEmail = clean(cells[COL_PARENT_EMAIL]);
    const parentPhone = splitPhones(cells[COL_PARENT_PHONE]);
    if (!parentName && !parentEmail && !parentPhone.phone) continue;

    const owner = students[students.length - 1];
    if (!owner) {
      /* A file that opens on a guardian. Reported rather than dropped in silence and rather than
         thrown on: the teacher has a file with a row nobody can be attached to, and she is the one
         who can see why. */
      skipped.push({ line: line, why: parentName || parentEmail || parentPhone.phone });
      continue;
    }
    owner.guardians.push({
      name: parentName,
      relation: '',                 /* decision 4: never guessed from an honorific */
      email: parentEmail,
      phone: parentPhone.phone,
      phone2: parentPhone.phone2,
    });
  }

  if (!students.length) {
    return { students: [], skipped: skipped,
      error: 'No students could be read out of that file. The contact export carries the student’s '
        + 'name in the first column — if that column is empty on every row, this is not that file. '
        + 'Nothing has been imported.' };
  }
  return { students: students, skipped: skipped, error: '' };
}

/* ────────────────────────────── matching ────────────────────────────── */

/*
  Which student in the YEAR this row is, which is deliberately not "which student in this class":
  a student taught in two sections is one record with one set of contacts, and that is the split
  src/roster.js opens by refusing to undo. So every row is one of four things, three of them in the
  paste box's own words:

    new   — nobody in this school year has that name; a student record is created.
    link  — already in this school year and not in this class; the EXISTING student is put on this
            class's roster and their contacts are updated on the one record both classes see.
    here  — already on this class's roster. Included by DEFAULT, unlike the paste box's `here`, and
            that is the whole feature: re-importing a corrected file is how a teacher fixes a phone
            number for twenty-five students at once. The two writing rules are what make that safe,
            rather than the tick being off.
    twice — the same name is on an earlier row of this same file. Off by default; merging two rows
            into one student behind the teacher's back is a guess, and she can see both rows.
*/
function settle(row, index) {
  const key = nameKey(row.first, row.last);
  if (!key.replace('|', '')) return { kind: 'blank', existingId: '' };
  const earlier = importRows.slice(0, index).some((r) => nameKey(r.first, r.last) === key);
  if (earlier) return { kind: 'twice', existingId: '' };
  const cls = importClass();
  const match = studentsIn(getDoc()).filter((s) => nameKey(s.first, s.last) === key)[0];
  if (!match) return { kind: 'new', existingId: '' };
  if (cls && rosterOf(cls).indexOf(match.id) >= 0) return { kind: 'here', existingId: match.id };
  return { kind: 'link', existingId: match.id };
}

/*
  Which guardian card on the record an imported guardian IS: email first, then name, both trimmed
  and case-folded. A match merges into that card; a non-match appends a new one. Without it,
  importing an updated file stacks four copies of one mother — which is the failure a teacher finds
  in Phase 5, addressed to all four.

  Email first because it is the field the SIS is authoritative about and the one a teacher never
  retypes; name second because a guardian whose address has changed is the case the email match
  cannot see, and re-adding her would be exactly the stacking this exists to stop.
*/
function matchGuardian(existing, imported) {
  const email = clean(imported.email).toLowerCase();
  const name = clean(imported.name).toLowerCase();
  let found = null;
  if (email) {
    found = existing.filter((g) => clean(g.email).toLowerCase() === email)[0] || null;
  }
  if (!found && name) {
    found = existing.filter((g) => clean(g.name).toLowerCase() === name)[0] || null;
  }
  return found;
}

/* ────────────────────────────── what a row would write ────────────────────────────── */

/*
  ONE ANSWER, TWO USES. The preview's summary line and the commit both need to know exactly what a
  row would do to the document, and two functions computing that would be two functions to keep in
  step — the summary would say "changes 1" while the commit wrote two. So this returns the list of
  operations; the summary counts them and the commit carries them out.

  Both writing rules live here and nowhere else. A non-empty imported value wins; an empty cell is
  not a value and produces no operation at all, so it can neither clear a field nor be counted as a
  change. A value identical to what is already stored produces no operation either — not for safety
  but for honesty twice over: "changes 1" has to mean one field is about to read differently, and
  re-importing an unchanged file must not move `rev` (docs/sync.md) for writes that are copies of
  what is already there.

  THE NAME IS NEVER WRITTEN ONTO AN EXISTING RECORD. It is the key the match was made on, so it is
  already equal but for case and spacing, and the teacher's spelling of her own student's name beats
  the export's.
*/
function writesFor(row) {
  const student = row.existingId ? findStudent(row.existingId) : null;
  const ops = [];

  const field = (key, value) => {
    const next = clean(value);
    if (!next) return;
    const now = student ? clean(student[key]) : '';
    if (now === next) return;
    ops.push({ kind: 'field', key: key, from: now, to: next });
  };
  field('nickname', row.nickname);
  field('gradYear', row.gradYear);
  field('email', row.email);
  field('phone', row.phone);
  field('phone2', row.phone2);

  const counselor = counselorOf(student);
  ['name', 'email'].forEach((key) => {
    const next = clean(row.counselor[key]);
    if (!next) return;
    const now = clean(counselor[key]);
    if (now === next) return;
    ops.push({ kind: 'counselor', key: key, from: now, to: next });
  });

  /* Matched against the record AND against the guardians earlier rows of this same file have
     already claimed, so a file naming one guardian twice does not add her twice. The copies below
     are local — the real write is in the commit. */
  const existing = guardiansOf(student).map((g) => ({ name: g.name, email: g.email }));
  row.guardians.forEach((imported) => {
    const found = matchGuardian(existing, imported);
    if (!found) {
      existing.push({ name: imported.name, email: imported.email });
      ops.push({ kind: 'guardian-add', guardian: imported });
      return;
    }
    const stored = matchGuardian(guardiansOf(student), imported) || {};
    const changes = [];
    ['name', 'email', 'phone', 'phone2'].forEach((key) => {
      const next = clean(imported[key]);
      if (!next) return;
      if (clean(stored[key]) === next) return;
      changes.push({ key: key, to: next });
    });
    if (changes.length) ops.push({ kind: 'guardian-edit', guardian: imported, changes: changes });
  });

  return ops;
}

/* The summary line under a row's name fields: what the teacher is agreeing to, in the words the
   count line uses. A row that would write nothing says so — "already up to date" is the sentence a
   re-import of an unchanged file is covered in, and that is the point of it. */
function summaryText(row) {
  const ops = writesFor(row);
  const fills = ops.filter((o) => (o.kind === 'field' || o.kind === 'counselor') && !o.from).length;
  const changes = ops.filter((o) => (o.kind === 'field' || o.kind === 'counselor') && o.from).length;
  const added = ops.filter((o) => o.kind === 'guardian-add').length;
  const edited = ops.filter((o) => o.kind === 'guardian-edit').length;
  const parts = [];
  if (fills) parts.push('fills ' + plural(fills, 'field', 'fields'));
  if (changes) parts.push('changes ' + changes);
  if (added) parts.push('adds ' + plural(added, 'guardian', 'guardians'));
  if (edited) parts.push('updates ' + plural(edited, 'guardian', 'guardians'));
  if (!parts.length) return 'already up to date';
  return parts.join(' · ');
}

/* ────────────────────────────── the dialog ────────────────────────────── */

function showImportError(message) {
  const el = document.getElementById(IMPORT_ERROR_ID);
  if (!el) return;
  el.textContent = message || '';
  el.classList.toggle('hidden', !message);
  /* Also spoken: it lands in a corner of a dialog a screen-reader user has no reason to move to,
     and there is exactly one aria-live region in this app (src/live-region.js). */
  if (message) announce(message);
}

function showReview(on) {
  const el = document.getElementById(IMPORT_REVIEW_ID);
  if (el) el.classList.toggle('hidden', !on);
}

/*
  Opened through its own hook rather than data-modal-open, for the reason src/year-picker.js gives:
  the panel is filled from the document, and a modal that opens and then fills in is a modal that
  flickers.
*/
export function openImport(opener) {
  const cls = getSelectedClass();
  importClassId = cls ? cls.id : '';
  importRows = [];
  importSkipped = [];
  showImportError('');
  showReview(false);
  const list = document.getElementById(IMPORT_LIST_ID);
  if (list) list.textContent = '';
  const name = document.getElementById(IMPORT_CLASS_NAME_ID);
  if (name) name.textContent = cls ? cls.name : 'this school year';
  /* Cleared on the way IN as well as after every read: a file left on the input by a previous open
     would sit there naming a file this dialog has not read. src/backup.js clears it in both places
     for the same reason. */
  const input = document.getElementById(IMPORT_FILE_ID);
  if (input) input.value = '';
  openModal(IMPORT_MODAL_ID, opener);
}

/*
  The file input, which is the path an iPad actually takes — a tablet has a Files picker and no
  drag. CLEARING THE VALUE AFTERWARDS is what makes choosing the SAME file twice fire `change` a
  second time, which is precisely what a teacher does after fixing a refusal in the spreadsheet.
  Lifted from src/backup.js's handleChosenFile(), including the clear-on-both-arms shape: a read
  that threw has to leave the input as re-choosable as one that succeeded.
*/
export function handleChosenFile(input) {
  if (!input) return;
  const file = input.files && input.files[0];
  const clear = () => { input.value = ''; };
  readFile(file).then(clear, clear);
}

async function readFile(file) {
  if (!file) return false;
  if (file.size > MAX_FILE_BYTES) {
    showImportError('“' + file.name + '” is ' + Math.round(file.size / (1024 * 1024)) + ' MB, '
      + 'which is far larger than a class contact list ever is, so Planbook has not tried to read '
      + 'it. Nothing has been imported.');
    return false;
  }
  let text;
  try {
    text = await file.text();
  } catch (e) {
    showImportError('“' + file.name + '” could not be read from this device ('
      + String(e.message || e) + '). Nothing has been imported.');
    return false;
  }
  return previewText(text);
}

/*
  The same path with the file already read. Every refusal below lands on the dialog's own error
  line, says what to do, and leaves the document at the same `rev` — nothing here writes anything at
  all, which is why a refusal cannot be partial.
*/
function previewText(text) {
  if (!getDoc()) {
    showImportError('There is no school year open, so there is nowhere to put a roster yet.');
    return false;
  }
  const read = readStudents(text);
  if (read.error) {
    importRows = [];
    importSkipped = [];
    showReview(false);
    const list = document.getElementById(IMPORT_LIST_ID);
    if (list) list.textContent = '';
    showImportError(read.error);
    return false;
  }

  importRows = read.students;
  importSkipped = read.skipped;
  /* Parsed first, settled second, because settle() reads the rows before the one it is settling —
     the same name twice in one file is a repeat, and it can only be seen once the whole list
     exists. Same order, and the same reason, as previewPaste(). */
  importRows.forEach((row, i) => {
    const settled = settle(row, i);
    row.kind = settled.kind;
    row.existingId = settled.existingId;
    row.include = settled.kind !== 'twice' && settled.kind !== 'blank';
  });

  showImportError(skippedSentence());
  showReview(true);
  renderImportReview();
  announce(plural(importRows.length, 'student', 'students') + ' read. Check the names before '
    + 'importing them.');
  return true;
}

/* A file that opens on a guardian, said out loud. It is not a refusal — the students under it
   import normally — so it goes onto the error line as a sentence about what was left out, which is
   where a teacher is already looking for a reason. */
function skippedSentence() {
  if (!importSkipped.length) return '';
  const rows = importSkipped.map((s) => s.line).join(', ');
  return importSkipped.length === 1
    ? 'Row ' + rows + ' holds a contact with no student name above it, so there is nobody to attach '
      + 'it to. It has been left out; everything else is below.'
    : 'Rows ' + rows + ' hold contacts with no student name above them, so there is nobody to '
      + 'attach them to. They have been left out; everything else is below.';
}

const DISPOSITION_NOTES = {
  new: '',
  link: 'Already in this school year — will be added to this class, not duplicated',
  here: 'Already in this class — contacts updated in place',
  twice: 'The same name is on an earlier row of this file',
  blank: 'No name on this row',
};

function rowNote(row) {
  const note = DISPOSITION_NOTES[row.kind] || '';
  if (note && row.warning) return row.warning + ' · ' + note;
  return note || row.warning || '';
}

/* Amber for a row that will not do what the file said, or where the split was a guess. `link` and
   `here` are neither — they are the feature working — and colouring them would make an import into
   a class that is already on the roster read as twenty-five problems. */
function isWarnRow(row) {
  return !!row.warning || row.kind === 'twice' || row.kind === 'blank';
}

/*
  One row. It wears the paste preview's own classes — .paste-row, .paste-fields, .paste-input,
  .paste-row-note — and that is a lift rather than an accident: it IS that row, with the same two
  editable name fields, the same include toggle and the same amber, so the two dialogs measure and
  read identically. The class names keep the paste box's word because renaming them would edit the
  markup of the paste path, and this work order may not touch it.
*/
function importRowEl(row, index) {
  const el = document.createElement('div');
  el.className = 'paste-row' + (isWarnRow(row) ? ' warn' : '');

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'toggle-btn' + (row.include ? ' active' : '');
  toggle.setAttribute('data-import-include', String(index));
  toggle.setAttribute('aria-pressed', row.include ? 'true' : 'false');
  toggle.setAttribute('aria-label', 'Import ' + fullName(row) + ' — row ' + (index + 1));
  toggle.textContent = row.include ? 'Import' : 'Skip';
  el.append(toggle);

  const fields = document.createElement('div');
  fields.className = 'paste-fields';
  fields.append(importInput('Last', 'last', index, row.last),
    importInput('First', 'first', index, row.first));
  el.append(fields);

  /* The nickname and the grad year, shown rather than editable: they came out of the same cell as
     the name, so a teacher reading the split has to be able to see where the rest of it went. */
  const meta = document.createElement('span');
  meta.className = 'import-meta';
  const bits = [];
  if (row.nickname) bits.push('“' + row.nickname + '”');
  if (row.gradYear) bits.push('class of ' + row.gradYear);
  meta.textContent = bits.join(' · ');
  el.append(meta);

  const note = document.createElement('span');
  note.className = 'paste-row-note';
  note.textContent = rowNote(row);
  el.append(note);

  /* The contacts, read-only — the name is the guess and these are the file. A row a teacher does
     not want is toggled off, and that student's editor is one tap away afterwards. */
  const contacts = document.createElement('div');
  contacts.className = 'import-contacts';
  contactLines(row).forEach((line) => {
    const lineEl = document.createElement('div');
    lineEl.className = 'import-contact-line';
    lineEl.textContent = line;
    contacts.append(lineEl);
  });
  el.append(contacts);

  const summary = document.createElement('span');
  summary.className = 'import-summary';
  summary.textContent = summaryText(row);
  el.append(summary);
  return el;
}

/* What the file says about this student, in the order the columns come in. Every one of these is a
   string out of a school system, and every one reaches the page as textContent. */
function contactLines(row) {
  const lines = [];
  const own = [row.email, row.phone, row.phone2].filter(Boolean);
  if (own.length) lines.push(own.join(' · '));
  if (row.counselor.name || row.counselor.email) {
    lines.push('Counselor: ' + [row.counselor.name, row.counselor.email].filter(Boolean).join(' · '));
  }
  row.guardians.forEach((g) => {
    lines.push([g.name, g.phone, g.phone2, g.email].filter(Boolean).join(' · '));
  });
  if (!lines.length) lines.push('No contacts on this row');
  return lines;
}

function importInput(caption, field, index, value) {
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
  input.setAttribute('data-import-field', field);
  input.setAttribute('data-import-index', String(index));
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('aria-label', caption + ' — row ' + (index + 1));
  wrap.append(input);
  return wrap;
}

function renderImportReview() {
  const list = document.getElementById(IMPORT_LIST_ID);
  if (!list) return;
  list.textContent = '';
  importRows.forEach((row, i) => list.append(importRowEl(row, i)));
  refreshImportCount();
}

/* The count line, in the three words the dispositions use rather than in one number — the paste
   box's rule and its reason: "18 will be imported" beside a list where four of them are links and
   three are already here is a sentence that hides exactly what the teacher came to check. */
function refreshImportCount() {
  const el = document.getElementById(IMPORT_COUNT_ID);
  const button = document.getElementById(IMPORT_COMMIT_ID);
  const included = importRows.filter((r) => r.include);
  const fresh = included.filter((r) => r.kind === 'new').length;
  const linked = included.filter((r) => r.kind === 'link').length;
  const here = included.filter((r) => r.kind === 'here').length;
  const cls = importClass();

  if (el) {
    const parts = [];
    parts.push(plural(fresh, 'new student', 'new students'));
    if (linked) {
      parts.push(plural(linked, 'student', 'students') + ' already in this school year, added to '
        + (cls ? cls.name : 'this class'));
    }
    if (here) parts.push(plural(here, 'student', 'students') + ' already in this class, updated');
    el.textContent = parts.join(' · ') + ' — out of '
      + plural(importRows.length, 'student', 'students') + ' in the file.';
  }
  if (button) {
    button.disabled = included.length === 0;
    button.textContent = included.length
      ? 'Import ' + plural(included.length, 'student', 'students')
      : 'Nothing to import';
  }
}

/* Typed into a preview field. The row is not re-rendered — that would replace the input under the
   caret — but its note, its summary and its Import/Skip state are, because editing a name is what
   changes whether that name is already in the year. */
export function editImportField(input) {
  const index = Number(input.getAttribute('data-import-index'));
  const field = input.getAttribute('data-import-field');
  const row = importRows[index];
  if (!row || (field !== 'first' && field !== 'last')) return;
  row[field] = input.value;
  /* The parser's own warning belonged to the cell as exported. Once the teacher has corrected the
     row it is her split, and leaving "read as First Last" under it would be telling her the thing
     she just fixed is still a guess. */
  row.warning = '';
  refreshRow(index);
  refreshImportCount();
}

function refreshRow(index) {
  const row = importRows[index];
  if (!row) return;
  const was = row.kind;
  const settled = settle(row, index);
  row.kind = settled.kind;
  row.existingId = settled.existingId;
  /* The default follows the disposition, and a disposition that has not changed leaves the
     teacher's own choice alone — src/roster.js's refreshRow() rule, for its reason: without it,
     ticking a repeated row and then fixing a typo in it would silently untick itself. */
  if (row.kind !== was) row.include = row.kind !== 'twice' && row.kind !== 'blank';

  const el = document.querySelectorAll('#' + IMPORT_LIST_ID + ' .paste-row')[index];
  if (!el) return;
  const note = el.querySelector('.paste-row-note');
  if (note) note.textContent = rowNote(row);
  const summary = el.querySelector('.import-summary');
  if (summary) summary.textContent = summaryText(row);
  const toggle = el.querySelector('[data-import-include]');
  if (toggle) {
    toggle.classList.toggle('active', !!row.include);
    toggle.setAttribute('aria-pressed', row.include ? 'true' : 'false');
    toggle.textContent = row.include ? 'Import' : 'Skip';
  }
  el.classList.toggle('warn', isWarnRow(row));
}

export function toggleImportRow(indexValue) {
  const index = Number(indexValue);
  const row = importRows[index];
  if (!row) return;
  row.include = !row.include;
  const el = document.querySelectorAll('#' + IMPORT_LIST_ID + ' .paste-row')[index];
  const toggle = el && el.querySelector('[data-import-include]');
  if (toggle) {
    toggle.classList.toggle('active', row.include);
    toggle.setAttribute('aria-pressed', row.include ? 'true' : 'false');
    toggle.textContent = row.include ? 'Import' : 'Skip';
  }
  refreshImportCount();
}

/* ────────────────────────────── the commit ────────────────────────────── */

/*
  One update() for the whole list, so twenty-five students are one save and one rev (src/store.js)
  rather than twenty-five of each — and so a file that would write nothing at all moves `rev` not at
  all, which is what makes re-importing an unchanged file a true no-op rather than a save of the
  document over an identical copy of itself.

  NOBODY IS EVER REMOVED FROM ANYTHING, and `supports` is not reachable from any line below.
*/
export function commitImport() {
  const doc = getDoc();
  const cls = importClass();
  const included = importRows.filter((r) => r.include);
  if (!doc || !included.length) return;

  /* Computed before the write, because writesFor() compares the file against the record and the
     record is what is about to change. */
  const plans = included.map((row) => ({ row: row, ops: writesFor(row) }));
  const work = plans.filter((plan) => plan.ops.length || plan.row.kind !== 'here');
  if (!work.length) {
    importRows = [];
    importSkipped = [];
    closeModal(IMPORT_MODAL_ID);
    announce('Every student in that file is already on this roster with these contacts, so nothing '
      + 'changed.');
    return;
  }

  let created = 0;
  let linked = 0;
  let updated = 0;

  update((d) => {
    if (cls && !Array.isArray(cls.roster)) cls.roster = [];
    plans.forEach((plan) => {
      const row = plan.row;
      let student = row.existingId
        ? studentsIn(d).filter((s) => s.id === row.existingId)[0] : null;
      if (!student) {
        /* newStudent() rather than an object literal written here: the shape of a student record
           has one writer (src/roster.js), and it is what seeds `supports` to newSupports()'s
           defaults — which is the whole of what this import ever does to that block. */
        student = newStudent(row.first, row.last);
        studentsIn(d).push(student);
        created += 1;
      } else if (plan.ops.length) {
        updated += 1;
      }
      if (cls && rosterOf(cls).indexOf(student.id) < 0) {
        cls.roster.push(student.id);
        if (row.kind === 'link') linked += 1;
      }

      /* The guardians this row is about, whether it added them or matched them — the candidates for
         the `preferred` flag below, and nobody else's. */
      const mine = [];
      plan.ops.forEach((op) => {
        if (op.kind === 'field') { student[op.key] = op.to; return; }
        if (op.kind === 'counselor') {
          if (!student.counselor || typeof student.counselor !== 'object') {
            student.counselor = { name: '', email: '' };
          }
          student.counselor[op.key] = op.to;
          return;
        }
        if (!Array.isArray(student.guardians)) student.guardians = [];
        if (op.kind === 'guardian-add') {
          const guardian = newGuardian(false);
          guardian.name = op.guardian.name;
          guardian.email = op.guardian.email;
          guardian.phone = op.guardian.phone;
          guardian.phone2 = op.guardian.phone2;
          /* `relation` and `language` stay at newGuardian()'s defaults — decision 4, and the export
             carries no language column at all. */
          student.guardians.push(guardian);
          mine.push(guardian);
          return;
        }
        const found = matchGuardian(student.guardians, op.guardian);
        if (!found) return;
        op.changes.forEach((change) => { found[change.key] = change.to; });
        mine.push(found);
      });
      /* A guardian this row matched but had nothing to change on is still one of this row's own. */
      row.guardians.forEach((imported) => {
        const found = matchGuardian(guardiansOf(student), imported);
        if (found && mine.indexOf(found) < 0) mine.push(found);
      });

      /* `preferred` is what Phase 5's audience picker reads to decide who a message goes to first,
         so an import must never silently re-point it: the first imported guardian takes it ONLY
         when the student has nobody flagged. A student with guardians and none preferred is a
         student that picker has no answer for, which is the case this repairs. */
      const guardians = guardiansOf(student);
      if (guardians.length && !guardians.some((g) => g.preferred) && mine.length) {
        mine[0].preferred = true;
      }
    });
  });

  importRows = [];
  importSkipped = [];
  closeModal(IMPORT_MODAL_ID);
  renderRoster();
  /* Both counts, in one sentence, because a screen-reader user cannot see twenty-five rows
     appear — and "added" and "updated" are two different things to have just done. The total is
     the rows committed rather than the three counts summed: a student who was already in the year
     is both linked and updated, and a sentence whose total is bigger than its list is a sentence
     nobody trusts twice. */
  announce('Imported ' + plural(plans.length, 'student', 'students')
    + (cls ? ' into ' + cls.name : '') + ' — ' + plural(created, 'student', 'students')
    + ' added, ' + plural(updated, 'student', 'students') + ' updated'
    + (linked ? ', ' + plural(linked, 'student', 'students')
      + ' already in this school year put onto the roster' : '') + '.');
}
