/*
  Message templates — the records, the two vocabularies they are filed under, and the eight the
  app ships with (WO-5.2).

  ── WHAT THIS FILE IS, AND THE ONE IT IS NOT ──

  It is the MODEL: the shape of a `templates[]` record, the reads a caller makes over the
  collection, the three writers that change it, and the starter texts. It draws nothing. The screen
  is src/templates-view.js, and the split is the one src/calendar.js and src/events.js already make
  — the model owns what a record is and what may be true of one, the panel owns the pixels and the
  order things happen in.

  IT IS ALSO NOT A RESOLVER, and that is a fence rather than a division of labour. `{{field}}` is
  turned into text in exactly one place, src/merge-fields.js, and nothing here reads a token, splits
  one, or looks anything up by one. A template is subject + body as the teacher typed them, carried
  around unopened.

  ── WHY WO-5.3 IS THE REASON THIS IS A MODULE AND NOT PART OF THE SCREEN ──

  The send flow has to ask *which templates are there for this tone and this audience* while
  standing on the signal card, with the editor nowhere on screen. A send flow that imported the
  editor to ask would be importing a screen to read a list. So `templatesFor()` lives here, the
  editor calls the same function to draw its own list, and the two cannot come to disagree about
  what is on offer — which is severityOrder()'s argument in src/signals.js, applied to a much
  smaller question.

  ── THE EIGHT STARTERS ARE SHIPPED TEXT AND NOT DOCUMENT ROWS, AND THAT IS THE OWNER'S RULING ──

  Both tones × each of the four audiences, written out in full (2026-08-28). **None of them is in
  `templates[]` until a teacher saves one**, and nothing seeds the document at first launch:

    · `newYearDocument()` gains nothing. Seeding eight records there would put them in front of
      parseBackup(), which validates a restored file against the shape that function returns — the
      trap src/store.js records against the calendar block — and it would also mean a teacher who
      deleted all eight got them back on the next restore.
    · The list offers them, the editor loads one when it is picked, and SAVING is what writes a
      record. That is the one keystroke between a shipped sentence and a hundred guardians reading
      it in the same words, and the owner's ruling is that the keystroke stays: the editor opens
      empty with the eight in the list, never opened ON one of them.

  Written well they teach what a merge field is faster than help text, which is the other half of
  that ruling and the reason they are filled in rather than named.

  ── EVERY FIELD IN THEM IS ON THE WHITELIST, AND NOT ONE OF THEM IS A SUPPORT FIELD ──

  They are the app's own prose going into a teacher's document, so they are the one place in this
  build where a `{{token}}` is written by us rather than typed by her. src/merge-fields.js would
  refuse an unknown or a refused name and block the draft — a starter that shipped with
  `{{supports.medical}}` in it could never send — but it would still be this app suggesting the
  disclosure, which is the thing CLAUDE.md § Accommodations forbids by construction. So the
  starters use resolvable names only, and `tools/verify/templates.mjs` reconciles every token in
  all eight against mergeFieldNames() rather than against a list written out again here.
*/

import { newId } from './store.js';

/* ────────────────────────────── the two vocabularies ──────────────────────────────

   docs/data-model.md § The document names both, and this is the only place either is written out
   in code. A value from a hand-edited or a later-build document that is not on these lists is not
   coerced into one — see toneOf() and audienceOf() below, which say what happens instead. */

/*
  TONE IS THE WHOLE OF WHY THIS WORK ORDER EXISTS. "A good praise message reads nothing like a good
  concern message — same length, opposite structure", so the two are separate records rather than
  one template with a switch in it, and the send flow asks for one tone at a time.
*/
export const TONES = ['concern', 'praise'];

/* WO-5.3's audience picker, in the order it will offer them: the people a teacher writes to about
   one student, nearest first. `student` is on the list because a message TO the student is the one
   a praise template most often is. */
export const AUDIENCES = ['guardian', 'counselor', 'admin', 'student'];

/* The words a screen prints. A vocabulary becomes a sentence in exactly one place, the arrangement
   src/signals-view.js's AUDIENCE_TEXT takes: a value this build has never heard of falls through
   to the value itself rather than to `undefined`, so a restored document from a later build draws
   a word rather than a hole. */
const TONE_LABEL = { concern: 'Concern', praise: 'Praise' };
const AUDIENCE_LABEL = { guardian: 'Guardian', counselor: 'Counselor', admin: 'Admin',
  student: 'Student' };

export function toneLabel(tone) { return TONE_LABEL[tone] || String(tone || ''); }
export function audienceLabel(audience) {
  return AUDIENCE_LABEL[audience] || String(audience || '');
}

export function isTone(tone) { return TONES.indexOf(tone) >= 0; }
export function isAudience(audience) { return AUDIENCES.indexOf(audience) >= 0; }

/* What a record is filed under when its own value is not one this build knows. It falls to the
   FIRST entry rather than being dropped: a template with an unreadable tone is still a template the
   teacher typed, and a list that silently omitted it would be a list she cannot find her own work
   in. The value in the document is left exactly as it is — nothing here rewrites a record it merely
   read. */
function toneOf(record) { return isTone(record && record.tone) ? record.tone : TONES[0]; }
function audienceOf(record) {
  return isAudience(record && record.audience) ? record.audience : AUDIENCES[0];
}

/* ────────────────────────────── the record ────────────────────────────── */

/*
  SIX FIELDS, AND newTemplate() WRITES EVERY ONE OF THEM ON EVERY RECORD — src/calendar.js's
  newEvent() rule, for its reason: one shape means no reader has to ask which build, or which
  surface, wrote a row.

  The id is opaque and generated, like every other id in this document. Nothing anywhere derives
  meaning from it, and a starter's `key` below is deliberately NOT an id for that reason.
*/
export function newTemplate(fields) {
  const f = fields || {};
  return {
    id: newId('t'),
    name: String(f.name == null ? '' : f.name).trim(),
    audience: isAudience(f.audience) ? f.audience : AUDIENCES[0],
    tone: isTone(f.tone) ? f.tone : TONES[0],
    /* Subject and body are kept EXACTLY as typed, including the leading and trailing whitespace of
       the body: a template ending in a blank line before the signature is a teacher's own spacing,
       and trimming it would rewrite her message every time she saved it. The name is trimmed
       because it is a label rather than content. */
    subject: String(f.subject == null ? '' : f.subject),
    body: String(f.body == null ? '' : f.body),
  };
}

/* ────────────────────────────── reading the collection ──────────────────────────────

   Local and tolerant, the three lines src/signals.js and src/merge-fields.js each keep for
   themselves: a collection missing from a hand-edited or restored file is an empty one, not a
   throw. */

export function templatesIn(doc) {
  return doc && Array.isArray(doc.templates) ? doc.templates.filter(Boolean) : [];
}

export function templateById(doc, id) {
  const want = String(id || '');
  if (!want) return null;
  return templatesIn(doc).filter((t) => t.id === want)[0] || null;
}

/*
  THE SEND-TIME QUESTION, AND IT IS THE FIRST ACCEPTANCE LINE OF THIS WORK ORDER.

  *A concern template and a praise template can exist for the same audience and are offered
  separately.* Both halves are here: nothing in the writers below is unique on audience, and this
  read is filtered on BOTH — so `templatesFor(doc, 'praise', 'guardian')` can never hand back the
  concern template a teacher wrote for the same recipient, whatever order they were written in.

  An audience of '' means every audience of that tone, which is the editor's own list rather than a
  send-time question. A tone of '' means every template, which is what the *All* filter on the list
  asks for. The two defaults are separate on purpose: WO-5.3 always names a tone.

  ROSTER ORDER IS DOCUMENT ORDER and nothing here sorts. The teacher's own list is in the order she
  wrote it in, and a list that re-sorted itself alphabetically would move a template out from under
  a thumb the first time she renamed one.
*/
export function templatesFor(doc, tone, audience) {
  const wantTone = String(tone || '');
  const wantAudience = String(audience || '');
  return templatesIn(doc).filter((t) => {
    if (wantTone && toneOf(t) !== wantTone) return false;
    if (wantAudience && audienceOf(t) !== wantAudience) return false;
    return true;
  });
}

/* How many templates exist for each tone, for a head that says what is in the list. Counted here
   rather than by the screen filtering twice, so the number and the list cannot disagree. */
export function templateCounts(doc) {
  const all = templatesIn(doc);
  return {
    all: all.length,
    concern: all.filter((t) => toneOf(t) === 'concern').length,
    praise: all.filter((t) => toneOf(t) === 'praise').length,
  };
}

/* ────────────────────────────── the writers ──────────────────────────────

   Three, and each one takes the document and mutates it — the shape src/calendar.js's addEvent(),
   updateEvent() and removeEvent() take. The caller wraps them in the store's update(), which is
   what makes src/templates-view.js the only file that knows this collection is saved at all.

   NONE OF THEM TOUCHES ANY OTHER COLLECTION. A template names no student, no class and no term, so
   there is nothing for a delete to cascade into: `{{class.name}}` resolves per draft at send time,
   from the class the draft was opened from. */

export function addTemplate(d, fields) {
  if (!d) return null;
  const record = newTemplate(fields);
  if (!Array.isArray(d.templates)) d.templates = [];
  d.templates.push(record);
  return record;
}

/*
  EDITING ONE IN PLACE. The id is not editable through here — it is the document's own — and every
  other field is replaced only when the caller names it, so a save that carries three fields does
  not blank the other two.
*/
export function updateTemplate(d, id, changes) {
  const record = templateById(d, id);
  if (!record || !changes) return null;
  const has = (k) => Object.prototype.hasOwnProperty.call(changes, k);
  if (has('name')) record.name = String(changes.name == null ? '' : changes.name).trim();
  if (has('subject')) record.subject = String(changes.subject == null ? '' : changes.subject);
  if (has('body')) record.body = String(changes.body == null ? '' : changes.body);
  if (has('tone') && isTone(changes.tone)) record.tone = changes.tone;
  if (has('audience') && isAudience(changes.audience)) record.audience = changes.audience;
  return record;
}

/*
  REMOVING ONE, and there is no confirm anywhere on this route — src/events.js's test applied
  rather than re-argued: a template is a line the teacher typed, it destroys nothing on the way out,
  and putting it back costs one Save. The class manager uses the same test to decide that archiving
  needs no dialog and deleting a term of attendance does.
*/
export function removeTemplate(d, id) {
  const want = String(id || '');
  if (!d || !Array.isArray(d.templates) || !want) return false;
  const before = d.templates.length;
  d.templates = d.templates.filter((t) => !t || t.id !== want);
  return d.templates.length < before;
}

/* ────────────────────────────── the eight the app ships with ──────────────────────────────

   Read the header before changing one of these. They are shipped TEXT, offered in the list and
   written into a document only by a Save, and every `{{token}}` in them is a name
   src/merge-fields.js resolves.

   `key` is not an id and never becomes one: a starter that is saved gets a fresh `t_…` from
   newTemplate() like anything else, so two teachers who both start from *Missing work — first
   contact* hold two unrelated records and either may edit hers to say anything.

   THE VOICE IS THE SUITE'S — friendly-utilitarian, sentence case, no exclamation marks, nothing a
   teacher would be embarrassed to have read aloud at a conference. The concern half says what was
   observed and offers a conversation; the praise half says what changed and who did it. Neither
   half opens with an apology and neither closes with a threat. */

const STARTERS = [
  {
    key: 'concern-guardian', tone: 'concern', audience: 'guardian',
    name: 'Missing work — first contact',
    subject: '{{class.name}} — checking in about {{student.first}}',
    body: 'Dear {{guardian.name}},\n\n'
      + 'I wanted to reach out about {{student.first}}’s work in {{class.name}}. There are '
      + '{{missing.count}} assignments marked missing at the moment: {{missing.list}}.\n\n'
      + 'The grade for this quarter is {{grade.percent}} ({{grade.letter}}). Nothing here is a '
      + 'crisis — I would rather mention it now than in December.\n\n'
      + 'If it would help to talk, I am free most afternoons.\n\n{{teacher.name}}',
  },
  {
    key: 'concern-counselor', tone: 'concern', audience: 'counselor',
    name: 'Attendance — counselor referral',
    subject: '{{student.first}} {{student.last}} — attendance in {{class.name}}',
    body: 'Hello,\n\n'
      + 'I am writing about {{student.first}} {{student.last}} in {{class.name}}. Attendance this '
      + 'term is {{attendance.percent}} — {{attendance.absences}} absences and '
      + '{{attendance.tardies}} times late across the meetings I have recorded.\n\n'
      + 'What the class record shows:\n\n{{signals.list}}\n\n'
      + 'Tell me if you would rather make the first call home; I have not made it yet.\n\n'
      + '{{teacher.name}}',
  },
  {
    key: 'concern-admin', tone: 'concern', audience: 'admin',
    name: 'Concern — a note for the record',
    subject: '{{class.name}} — {{student.first}} {{student.last}}',
    body: 'Hello,\n\n'
      + 'A short note for the record about {{student.first}} {{student.last}} in '
      + '{{class.name}}.\n\n{{signals.list}}\n\n'
      + 'The grade stands at {{grade.percent}} ({{grade.letter}}), with {{missing.count}} pieces of '
      + 'work marked missing. I am in touch with home and will say so if that changes.\n\n'
      + '{{teacher.name}}',
  },
  {
    key: 'concern-student', tone: 'concern', audience: 'student',
    name: 'Let us get you caught up',
    subject: 'Catching up in {{class.name}}',
    body: 'Hi {{student.first}},\n\n'
      + 'You have {{missing.count}} assignments marked missing in {{class.name}}: '
      + '{{missing.list}}. Your grade is {{grade.percent}} at the moment, and finishing those is '
      + 'the fastest thing you can do about it.\n\n'
      + 'Find me before or after class and we will make a plan for the week.\n\n{{teacher.name}}',
  },
  {
    key: 'praise-guardian', tone: 'praise', audience: 'guardian',
    name: 'Turned it around',
    subject: 'Good news about {{student.first}} in {{class.name}}',
    body: 'Dear {{guardian.name}},\n\n'
      + 'I wanted you to hear something good. {{student.first}}’s work in {{class.name}} has '
      + 'moved {{grade.delta}}, and the grade now stands at {{grade.percent}} '
      + '({{grade.letter}}).\n\n{{signals.list}}\n\n'
      + 'Please pass on how pleased I am — it is a real change, and it was {{student.first}}’s '
      + 'own doing.\n\n{{teacher.name}}',
  },
  {
    key: 'praise-counselor', tone: 'praise', audience: 'counselor',
    name: 'Good news, for once',
    subject: '{{student.first}} {{student.last}} — good news from {{class.name}}',
    body: 'Hello,\n\n'
      + 'A good-news note rather than a concern one, about {{student.first}} {{student.last}} in '
      + '{{class.name}}.\n\n{{signals.list}}\n\n'
      + 'The grade has moved {{grade.delta}} and stands at {{grade.percent}}. If you are seeing '
      + '{{student.first}} this week, it is worth naming.\n\n{{teacher.name}}',
  },
  {
    key: 'praise-admin', tone: 'praise', audience: 'admin',
    name: 'Worth passing along',
    subject: '{{class.name}} — {{student.first}} {{student.last}}',
    body: 'Hello,\n\n'
      + 'Passing something good along about {{student.first}} {{student.last}} in '
      + '{{class.name}}.\n\n{{signals.list}}\n\n'
      + 'The grade has moved {{grade.delta}} this term, to {{grade.percent}} ({{grade.letter}}). '
      + 'Not every note about a student has to be a concern.\n\n{{teacher.name}}',
  },
  {
    key: 'praise-student', tone: 'praise', audience: 'student',
    name: 'A strong stretch — well done',
    subject: 'Nice work in {{class.name}}',
    body: 'Hi {{student.first}},\n\n'
      + 'I wanted to say well done.\n\n{{signals.list}}\n\n'
      + 'Your grade in {{class.name}} is {{grade.percent}} ({{grade.letter}}) and it has moved '
      + '{{grade.delta}}. Keep it going — this is the stretch that makes the rest of the term '
      + 'easier.\n\n{{teacher.name}}',
  },
];

/*
  A FRESH COPY EACH CALL, for mergeFieldPalette()'s reason: a caller that sorted, spliced or edited
  what it was handed would be editing the shipped text for every screen after it. The objects
  are rebuilt rather than spread, so a nested value could not be shared even if one were added.
*/
export function starterTemplates() {
  return STARTERS.map((s) => ({
    key: s.key, name: s.name, tone: s.tone, audience: s.audience,
    subject: s.subject, body: s.body,
  }));
}

export function starterByKey(key) {
  const want = String(key || '');
  return starterTemplates().filter((s) => s.key === want)[0] || null;
}
