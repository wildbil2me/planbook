/*
  The template editor — the list, the editor, the live preview and the field palette (WO-5.2).

  ── THREE COLUMNS, IN THE ORDER OF THE WORK ──

  Pick the template, write it, watch it resolve. design/mockups/outreach.html settles the shape and
  this file lifts it: list · editor · preview, with the palette under the preview, and one column at
  390px in the order list · editor · preview · palette. **The preview is not behind a button** —
  WO-5.2 asks for it so that "a broken field is caught at authoring time rather than at send time",
  and a preview a teacher has to open is a preview she stops opening by the third template.

  ── WHAT THIS FILE IS, AND THE THREE IT IS NOT ──

  It is a RENDERER over src/templates.js, the same split src/signals-view.js makes with
  src/signals.js: that file owns what a record is, which templates exist and what may be true of
  one; this one owns the pixels and the caret.

  IT IS NOT A RESOLVER, AND THAT IS THIS WORK ORDER'S FENCE RATHER THAN A DIVISION OF LABOUR.
  `{{field}}` becomes text in exactly one place — src/merge-fields.js — and the preview below asks
  `resolveDraft()` for a whole draft and draws what comes back. Nothing here splits a token, indexes
  anything by one, or reads a property named after one. The palette is `mergeFieldPalette()`,
  mapped: sixteen names and sixteen sentences, with **no `resolve` on them**, so a screen holding
  the palette cannot resolve a field outside a draft. WO-5.1's own header says why that matters, and
  WO-5.2's Traps line says it again: *if you find yourself wanting `FIELDS[name]`, that is a
  finding, not a workaround.*

  The one place this file reads a `{{` at all is countTokens() below, which COUNTS them so the block
  strip can say "8 fields resolved". It looks nothing up, touches no document, and is arithmetic
  over the teacher's own string.

  IT IS NOT A SECOND OPINION ABOUT WHY A FIELD FAILED. Every sentence in the block strip is the
  `message` src/merge-fields.js built, and the three failures — refused, unknown, unresolved — are
  told apart there by a named `code`. This screen prints what it is handed, in one treatment in the
  body and three sentences in the strip, which is the drawing's ruling: a body that rendered a
  refusal differently from a typo would read as though the refusal were a kind of value.

  IT IS ALSO NOT A WRITER OF ANYTHING BUT `templates[]`. Three update() calls, all of them through
  src/templates.js's three writers, and no other collection is touched by any path in this file.

  ── PRESENTATION MODE IS ASKED HERE, AND IT SUPPRESSES ONE COLUMN RATHER THAN THE SCREEN ──

  docs/data-model.md § Outreach templates: *presentation mode is deliberately not asked in
  src/merge-fields.js — it is the screen's suppression and an email to a guardian is not a
  projector — so the obligation lands on the live preview, which asks src/supports.js before it
  draws a resolved body.* This is that screen and previewModel() is where it is asked.

  IT IS NARROWER THAN src/signals-view.js's REFUSAL, DELIBERATELY, AND THIS IS THE POINT OF
  DEPARTURE. That screen closes outright, because the whole of its content is a ranked list of named
  students in trouble. The whole of THIS screen's content is the teacher's own writing — a template
  names nobody — except for one column: the preview resolves against a real student and draws her
  name, her grade, her missing work and the subjects of her behavior entries. So the preview goes
  and the list, the editor and the palette stay. A teacher can legitimately write a template with
  the projector on; she cannot legitimately resolve one against a child while she does it.

  NOTHING IS RESOLVED WHILE THE MODE IS ON. The refusal is not a filter over a draft that was built
  anyway — src/signals-view.js's rule, and its reason: a draft that exists in memory is a draft a
  later render can draw. previewModel() returns before it calls resolveDraft() at all.

  IT ASKS presentationMode() AND NOT supportsVisible(), which is src/pass-history.js's distinction
  inherited word for word. Both come from src/supports.js, so this is the same switch rather than a
  second copy of it. `supportsVisible()` asks whether a SUPPORT FIELD may be drawn, and there is not
  one on this screen and no path to one: the whitelist has no support name on it, so the resolved
  body cannot carry accommodation, medical or plan data whatever this file does.

  ── WHAT IS HELD HERE, AND WHY NONE OF IT IS REMEMBERED ──

  Six values: which tone the list is filtered to, which template is in the editor, the unsaved draft
  in it, which student the preview resolves against, which field the caret was last in, and the one
  status sentence. Not one of them reaches localStorage — src/signals-view.js's and
  src/calendar-view.js's ruling, and their reason: a remembered filter is a list quietly hiding half
  of what a teacher asked for, set by nobody she can remember. Every arrival opens on *All*, on an
  empty editor, and on the first student the roster offers.

  THE EIGHT STARTERS ARE OFFERED AND NEVER LOADED (the owner, 2026-08-28). The editor opens EMPTY
  with the eight in the list under the teacher's own; picking one fills the editor and saving is
  what writes a record. src/templates.js's header carries the whole ruling.
*/

import { getDoc, update } from './store.js';
import { getActiveClasses, getOpenTermId, getTerms, termName } from './classes.js';
import { fullName } from './roster.js';
import { announce } from './live-region.js';
/* The switch, and only the switch — see this file's header for why it is this accessor and not the
   visibility rule beside it. */
import { presentationMode } from './supports.js';
/* The resolver, and the palette it built for this screen by name. `resolveDraft` is the whole of
   what this file asks of it; `mergeFieldPalette` returns `{ name, about }` with no `resolve` on it
   (WO-5.1). Nothing else from that module is imported, and nothing here indexes by a token. */
import { resolveDraft, mergeFieldPalette } from './merge-fields.js';
/* The strip's shared words (WO-5.5). src/outreach-view.js imports the same constant from the same
   place, which is the whole of the Traps line's "change it once": the two heads were separate
   literals that happened to agree until one of them was rewritten. `FIELD_FIX_SENTENCE` is
   deliberately NOT imported here — paintBlock() below says why. */
import { UNDEFINED_FIELD_HEAD, blockHead } from './block-strip.js';
/* The engine, for the two fields that are read off a signal rather than off the document —
   `{{grade.delta}}` and `{{signals.list}}`. A draft at send time is opened FROM a signal row, so a
   preview that passed no hits would show a teacher two unresolvable fields on a template that is
   about to work perfectly. `orderHits` is the engine's own ranking, asked rather than re-decided,
   for the reason severityOrder() lives there. */
import { evaluate, orderHits } from './signals.js';
import * as templates from './templates.js';

const LIST_ID = 'templatesList';
const STARTERS_ID = 'templatesStarters';
const STARTERS_HEAD_ID = 'templatesStartersHead';
const MINE_EMPTY_ID = 'templatesMineEmpty';
const TONE_ID = 'templatesTones';
const NAME_ID = 'templateName';
const TONE_SELECT_ID = 'templateTone';
const AUDIENCE_ID = 'templateAudience';
const SUBJECT_ID = 'templateSubject';
const BODY_ID = 'templateBody';
const EDITOR_STATE_ID = 'templateEditorState';
const STATUS_ID = 'templateStatus';
const DUPLICATE_ID = 'templateDuplicate';
const DELETE_ID = 'templateDelete';
const PALETTE_ID = 'templatesPalette';
const STUDENT_ID = 'templatePreviewStudent';
const STUDENT_ROW_ID = 'templatePreviewStudentRow';
const DRAFT_ID = 'templatePreviewDraft';
const SUBJECT_OUT_ID = 'templatePreviewSubject';
const BODY_OUT_ID = 'templatePreviewBody';
const BLOCK_ID = 'templatePreviewBlock';
const PREVIEW_EMPTY_ID = 'templatePreviewEmpty';
const PREVIEW_BLOCKED_ID = 'templatePreviewBlocked';

/* ── THE VIEW STATE ── */

/* '' is *All*, which is what every arrival opens on: the question "which of my templates says
   this" does not know its own tone yet (design/mockups/proposed-phase5.css § TEMPLATE LIST). */
let toneFilter = '';

/* Which saved record the editor is on. '' means a new one — the state the screen opens in. */
let editingId = '';

/* What is in the editor RIGHT NOW, saved or not. It is a separate object from the record on
   purpose: this screen has a Save button (the drawing's), so a teacher who types four lines and
   changes her mind closes nothing and loses nothing that was in the document. Every other editor
   in this app writes as you type; this one does not, because a template is prose rather than a
   field, and because the preview beside it makes the unsaved state legible in a way a term date's
   never is. */
let draft = emptyDraft();

/* Which starter, if any, the draft was picked up from — for the one sentence under the editor that
   says so. It is not stored on the record: a saved template is the teacher's, whatever it started
   as, and a record that remembered its ancestry would be a record something later could group by. */
let startedFrom = '';

/* `classId|studentId` — the preview's subject. A pair rather than a student id, because a resolved
   draft needs a class and a term as well as a name: the same student in two sections has two
   grades, two attendance records and two conversations (src/signals-view.js's collect() says the
   same thing about a row). */
let previewKey = '';

/* Where the caret was last, so a palette chip can insert at it. `field` is 'subject' or 'body' and
   nothing else; `at` is a selection offset. Written by noteCaret() out of the focusin listener in
   src/shell.js, which is the same seam the score grid's flag bar uses and for the same reason: iOS
   does not focus a button when you tap it, so document.activeElement at the moment of a chip tap is
   <body> on the iPad and the chip on a laptop, and neither is the answer. */
let caret = { field: 'body', at: 0 };

/* One sentence under the editor's actions — saved, deleted, or what is stopping a save. Not an
   error banner: it is the same line in both tones, so the eye has one place to go back to, which is
   what src/backup.js's status line does one panel over. */
let status = { text: '', tone: '' };

function emptyDraft() {
  return { name: '', tone: templates.TONES[0], audience: templates.AUDIENCES[0],
    subject: '', body: '' };
}

/* ────────────────────────────── the model ──────────────────────────────

   THE WHOLE OF WHAT IS ON SCREEN, AS DATA, WITH NO DOM IN IT — the build-it / hand-it-over split
   src/signals-view.js's signalsModel(), src/calendar-view.js's calendarModel() and src/detail.js's
   detailModel() all make. Every decision about which rows are in the list, what the editor holds
   and what the preview resolved is made once, here, and tools/verify/templates.mjs can assert it
   without a check that also has to be right about markup — and then reads the DOM as well, so a
   model that is right about a preview nobody drew still fails. */

/*
  HOW MANY DISTINCT FIELDS A TEMPLATE NAMES. Counted off the teacher's own subject and body, so the
  block strip can say "8 fields resolved" — which is this number minus the fields that failed.

  THIS IS NOT A LOOKUP AND IT IS NOT A RESOLVER. It matches `{{…}}` and puts the names in a set;
  nothing is fetched, nothing is indexed by what it finds, and the same name twice is one field
  because src/merge-fields.js dedupes its errors the same way — a body that says
  `{{guardian.name}}` in the greeting and again in the closing line is one missing guardian.
*/
function countTokens(text) {
  const seen = [];
  String(text == null ? '' : text).replace(/\{\{([^{}]*)\}\}/g, (whole, inner) => {
    const name = String(inner).trim();
    if (seen.indexOf(name) < 0) seen.push(name);
    return whole;
  });
  return seen;
}

/* Every student the preview can be resolved against, one row per student per class — the pair the
   preview needs, built from the same active-class list every other cross-class screen walks. A
   class with no roster contributes nothing rather than an empty group. */
function previewChoices(doc) {
  const out = [];
  getActiveClasses().forEach((cls) => {
    const roster = Array.isArray(cls.roster) ? cls.roster : [];
    roster.forEach((studentId) => {
      const student = (doc && Array.isArray(doc.students) ? doc.students : [])
        .filter((s) => s && s.id === studentId)[0];
      if (!student) return;
      out.push({
        key: cls.id + '|' + student.id,
        classId: cls.id,
        studentId: student.id,
        className: cls.name,
        name: fullName(student),
      });
    });
  });
  return out;
}

/*
  THE PREVIEW, RESOLVED — one template, one student, one class, one term.

  THE HITS ARE PASSED AND NEVER SYNTHESISED. `{{grade.delta}}` reads the signal the draft was opened
  from and `{{signals.list}}` speaks from the pass, so this runs the real evaluator over the
  previewed class and hands the result over. The hit chosen is the first one in the ENGINE's order
  whose direction matches the template's TONE — a praise template previews against her praise row,
  a concern template against her concern row — which is what a send from the signal card will hand
  over, and a preview that guessed differently would be a rehearsal of a different draft.

  A STUDENT WITH NO HIT IN THAT DIRECTION GETS NO HIT, and `{{grade.delta}}` then does not resolve
  and the draft is blocked. That is the honest answer rather than a defect: at send time there is
  always a row behind the draft, and a preview that invented one would be hiding the one field a
  teacher most needs to see fail.
*/
function previewModel(doc, record) {
  const blocked = presentationMode();
  const choices = previewChoices(doc);
  const chosen = choices.filter((c) => c.key === previewKey)[0] || choices[0] || null;
  /* Distinct across both halves: a field named in the subject and again in the body is one field,
     which is how src/merge-fields.js counts a failure and therefore the only way this number and
     the strip's can agree. */
  const named = countTokens(record.subject);
  countTokens(record.body).forEach((name) => { if (named.indexOf(name) < 0) named.push(name); });
  const base = {
    students: choices,
    key: chosen ? chosen.key : '',
    name: chosen ? chosen.name : '',
    className: chosen ? chosen.className : '',
    termLabel: '',
    subject: '',
    body: '',
    errors: [],
    draftBlocked: false,
    fields: named.length,
    resolved: 0,
  };
  /* NOTHING IS RESOLVED WHILE THE PROJECTOR IS ON. Returned before resolveDraft() is reached, not
     filtered out of what it produced — see this file's header. */
  if (blocked || !chosen || !doc) {
    return Object.assign(base, { blocked: blocked, hasStudent: !!chosen });
  }

  const cls = getActiveClasses().filter((c) => c.id === chosen.classId)[0] || null;
  const termId = cls ? getOpenTermId(cls.id) : '';
  const term = cls ? getTerms(cls.id).filter((t) => t.id === termId)[0] : null;
  const hits = cls ? evaluate(doc, cls, termId) : [];
  const mine = orderHits(hits.filter((h) => h.studentId === chosen.studentId));
  const direction = record.tone === 'praise' ? 'praise' : 'concern';
  const hit = mine.filter((h) => h.direction === direction)[0] || null;

  const out = resolveDraft({
    doc: doc,
    classId: chosen.classId,
    termId: termId,
    studentId: chosen.studentId,
    hit: hit,
    hits: hits,
    template: { subject: record.subject, body: record.body },
  });
  /* Distinct FIELDS that failed, which is what the count is about: the errors are already deduped
     by code and name, and the same name failing in the subject and again in the body is one field
     the teacher has to fix. */
  const failed = [];
  out.errors.forEach((e) => { if (failed.indexOf(e.field) < 0) failed.push(e.field); });
  return Object.assign(base, {
    blocked: false,
    hasStudent: true,
    termLabel: termName(term),
    subject: out.subject,
    body: out.body,
    errors: out.errors,
    draftBlocked: out.blocked,
    resolved: Math.max(0, base.fields - failed.length),
  });
}

export function templatesModel() {
  const doc = getDoc();
  const mine = templates.templatesFor(doc, toneFilter, '');
  const starters = templates.starterTemplates()
    .filter((s) => !toneFilter || s.tone === toneFilter);
  const editing = {
    id: editingId,
    isNew: !editingId,
    from: startedFrom,
    name: draft.name,
    tone: draft.tone,
    audience: draft.audience,
    subject: draft.subject,
    body: draft.body,
  };
  return {
    tone: toneFilter,
    counts: templates.templateCounts(doc),
    mine: mine.map((t) => ({ id: t.id, name: t.name, tone: t.tone, audience: t.audience,
      active: t.id === editingId })),
    starters: starters.map((s) => ({ key: s.key, name: s.name, tone: s.tone,
      audience: s.audience, active: startedFrom === s.key && !editingId })),
    editing: editing,
    /* THE PALETTE IS WO-5.1's, MAPPED AND NOT REBUILT. Sixteen names, sixteen sentences, no
       resolver — and no filtering of any kind here, because the whitelist is the fence and a second
       filter over it would be this screen holding an opinion about which fields are safe. */
    palette: mergeFieldPalette(),
    preview: previewModel(doc, editing),
    status: status,
  };
}

/* ────────────────────────────── drawing it ────────────────────────────── */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

/*
  ONE ROW IN THE LIST, and both kinds go through this — the teacher's own templates and the eight
  the app ships with. One function means one row shape, so a starter cannot come to look like a
  saved template or the other way round; what tells them apart is the word on the row and the hook
  it carries, never its shape.
*/
function listRow(row, isStarter) {
  const button = el('button', 'tpl-item' + (row.active ? ' active' : ''));
  button.type = 'button';
  button.setAttribute(isStarter ? 'data-template-starter' : 'data-template-pick',
    isStarter ? row.key : row.id);
  button.append(el('span', 'tpl-item-name', row.name || 'Untitled template'));

  const meta = el('span', 'tpl-item-meta');
  const dot = el('span', 'tpl-tone-dot ' + (row.tone === 'praise' ? 'praise' : 'concern'));
  dot.setAttribute('aria-hidden', 'true');
  meta.append(dot);
  meta.append(document.createTextNode(templates.toneLabel(row.tone)));
  meta.append(el('span', 'tpl-audience', templates.audienceLabel(row.audience)));
  button.append(meta);

  /* The whole row said in one string: a screen reader reading the pieces in document order gets
     "Missing work — first contact Concern GUARDIAN", and which list it is in is the part that
     decides what a tap does. */
  button.setAttribute('aria-label', (row.name || 'Untitled template') + ' — '
    + templates.toneLabel(row.tone).toLowerCase() + ', to a '
    + templates.audienceLabel(row.audience).toLowerCase() + '. '
    + (isStarter ? 'A starter Planbook ships with; opening it fills the editor and saving makes it '
      + 'yours.' : 'Opens it in the editor.'));
  return button;
}

function paintList(model) {
  const host = document.getElementById(LIST_ID);
  if (host) {
    host.textContent = '';
    model.mine.forEach((row) => host.append(listRow(row, false)));
  }
  const empty = document.getElementById(MINE_EMPTY_ID);
  if (empty) empty.classList.toggle('hidden', model.mine.length > 0);

  const starters = document.getElementById(STARTERS_ID);
  if (starters) {
    starters.textContent = '';
    model.starters.forEach((row) => starters.append(listRow(row, true)));
  }
  const head = document.getElementById(STARTERS_HEAD_ID);
  if (head) head.classList.toggle('hidden', model.starters.length === 0);

  const tones = document.getElementById(TONE_ID);
  if (tones) {
    tones.querySelectorAll('[data-templates-tone]').forEach((button) => {
      const on = (button.getAttribute('data-templates-tone') || '') === model.tone;
      button.classList.toggle('active', on);
      button.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }
}

/*
  THE EDITOR'S FIELDS, WRITTEN ONLY WHEN THE EDITOR CHANGED UNDER THE TEACHER.

  `fields` is false on a keystroke repaint, and that is the rule src/categories.js and
  src/letter-scale.js both keep: replacing the value of an input while somebody is typing into it
  moves the caret to the end, and on iPadOS it can close the software keyboard. So a keystroke
  repaints the preview and the status line and leaves the five controls alone; loading a template,
  starting a new one and saving are what re-fill them.
*/
function paintEditor(model, fields) {
  const set = (id, value) => {
    const node = document.getElementById(id);
    if (node && fields) node.value = value;
  };
  set(NAME_ID, model.editing.name);
  set(TONE_SELECT_ID, model.editing.tone);
  set(AUDIENCE_ID, model.editing.audience);
  set(SUBJECT_ID, model.editing.subject);
  set(BODY_ID, model.editing.body);

  /* What the editor is about to do, in words rather than left to be inferred from whether a field
     filled itself in — src/events.js's paintEditingState() rule, and its reason.

     THE STARTER LINE SAYS WHAT THE SEND FLOW WILL NOT OFFER (WO-5.5), and that is the sentence
     this screen was missing rather than a longer way of saying the old one. "Saving makes it
     yours" is true and answers a question about ownership nobody was asking. The question a
     teacher actually arrives with is the one src/outreach-view.js answers with an empty picker:
     she reads a starter, likes it, goes to write a message, and cannot find it. WO-5.2's ruling —
     the eight ship as TEXT and a Save is what makes one a record — is right, and its SILENCE was
     the bug. It is said here, at the moment the question arises, because a rule a teacher meets
     as an empty picker two screens later is a rule she experiences as a fault. */
  const state = document.getElementById(EDITOR_STATE_ID);
  if (state) {
    state.textContent = model.editing.isNew
      ? (model.editing.from
        ? 'Starting from one of Planbook’s templates. It is not on offer when you write a message '
          + 'until you save it — change anything in it first, then save to make it yours.'
        : 'A new template. It is not in your list until you save it.')
      : 'Editing a saved template. Changes are not stored until you save them.';
  }

  const duplicate = document.getElementById(DUPLICATE_ID);
  if (duplicate) duplicate.classList.toggle('hidden', model.editing.isNew);
  const remove = document.getElementById(DELETE_ID);
  if (remove) remove.classList.toggle('hidden', model.editing.isNew);

  const line = document.getElementById(STATUS_ID);
  if (line) {
    line.textContent = model.status.text;
    line.classList.toggle('hidden', !model.status.text);
    line.classList.toggle('error', model.status.tone === 'error');
  }
}

/*
  THE PALETTE. One chip per field, in the documented order, each carrying the name it inserts and
  the sentence WO-5.1 wrote for it — `about` lives on the resolver's own list rather than here,
  because the palette IS the documentation of the refusal list and a second list of descriptions
  over here could describe a field the resolver does not have.
*/
function paintPalette(model) {
  const host = document.getElementById(PALETTE_ID);
  if (!host) return;
  host.textContent = '';
  model.palette.forEach((field) => {
    const chip = el('button', 'tpl-chip');
    chip.type = 'button';
    chip.setAttribute('data-template-insert', field.name);
    chip.append(el('code', '', '{{' + field.name + '}}'));
    chip.append(el('span', 'tpl-chip-about', field.about));
    chip.setAttribute('aria-label', 'Insert ' + field.name + ' — ' + field.about);
    host.append(chip);
  });
}

/*
  A RESOLVED BODY, WITH THE FIELDS THAT DID NOT RESOLVE STILL VISIBLE IN IT.

  ONE TREATMENT FOR ALL THREE FAILURES, which is design/mockups/proposed-phase5.css § UNRESOLVED's
  ruling and now src/shell.css's rule: the token as the teacher typed it, braces and all, on a
  background that says it did not become anything. Never blanked, never dropped, never replaced with
  a placeholder that could read as prose — a body that came back reading clean is a body she could
  send.

  WHAT IS WRAPPED IS WHATEVER `{{…}}` SURVIVED THE RESOLVE, and that is the resolver's contract
  rather than a judgement made here: a field that resolved is gone from the string. So this cannot
  disagree with the block strip below it, and it needs to know nothing about which of the three
  failures it is looking at.
*/
function paintResolved(node, text) {
  if (!node) return;
  node.textContent = '';
  const source = String(text == null ? '' : text);
  let at = 0;
  source.replace(/\{\{[^{}]*\}\}/g, (token, index) => {
    if (index > at) node.append(document.createTextNode(source.slice(at, index)));
    node.append(el('span', 'mf-token', token));
    at = index + token.length;
    return token;
  });
  if (at < source.length) node.append(document.createTextNode(source.slice(at)));
}

/*
  THE BLOCK STRIP, AND IT IS PERMANENT (the owner, 2026-08-28).

  Green when nothing is wrong, amber when something is. A strip that appeared only on failure would
  be read as an error banner; one that is always there is a report — and WO-5.3 reads the same
  `blocked` flag off the same call to decide whether its send button is live, so the two surfaces
  say one thing. The cost is one line of chrome at 390px, accepted when the row was cut.

  IT NAMES THE STUDENT IN EVERY LINE, which is the drawing's own argument: a field can be fine for
  one student and empty for the next, and a message that says only "guardian.name did not resolve"
  sends its reader looking in the template for a fault that is not there. The sentence is
  src/merge-fields.js's, which already carries the name.

  ITS HEAD IS SHARED WITH THE SEND FLOW AND ITS INSTRUCTION IS NOT (WO-5.5), and the second half of
  that is a ruling rather than a half-finished import. `UNDEFINED_FIELD_HEAD` comes from
  src/block-strip.js because a heading changed on one screen and not the other is this phase's own
  "two askers" defect — the work order says change it once, and one constant is the only shape in
  which it cannot drift back apart. **`FIELD_FIX_SENTENCE` stays off this screen** because it is
  advice about a BOX and the two boxes are not the same thing: the send flow's holds one message to
  one person, so "remove the field or type what it should say over it" costs her nothing but this
  draft. Here it would mean editing the TEMPLATE every later draft is cut from — so a teacher whose
  one previewed student has no guardian on file would be told, by the app, to strip
  `{{guardian.name}}` out of a template that works for the other twenty-nine. The resolver's own
  sentence is the honest one on this screen: it says there is nothing to put there, which points at
  the roster rather than at the template. WO-5.5's Why-it-exists locates the second defect "in the
  send flow" in as many words, and this is that scope kept rather than widened by half a sentence.
*/
function paintBlock(model) {
  const host = document.getElementById(BLOCK_ID);
  if (!host) return;
  const preview = model.preview;
  host.textContent = '';
  host.classList.toggle('hidden', preview.blocked || !preview.hasStudent);
  if (preview.blocked || !preview.hasStudent) return;
  host.classList.toggle('clear', !preview.draftBlocked);

  const count = preview.errors.length;
  host.append(el('div', 'mf-block-head', preview.draftBlocked
    ? blockHead(UNDEFINED_FIELD_HEAD, count, 'field did not resolve', 'fields did not resolve')
    /* The sentence is this screen's and the shape is not — see src/block-strip.js's header for
       where that line is drawn. The words are the ones that were here before WO-5.5. */
    : blockHead('Nothing blocked', preview.resolved, 'field resolved', 'fields resolved')));

  if (!preview.draftBlocked) {
    host.append(el('div', 'mf-reason', preview.fields
      ? 'Every field in this template has a value for ' + preview.name + '.'
      : 'This template has no merge fields in it yet — every word of it would go out the same to '
        + 'everybody.'));
    return;
  }
  preview.errors.forEach((error) => {
    const row = el('div', 'mf-reason');
    row.append(el('code', '', '{{' + error.field + '}}'));
    row.append(el('span', '', error.message));
    /* The one control on the row, and it goes to the half of the template the field is in —
       `where` is the resolver's own answer. The drawing also draws a Roster door on a missing
       guardian; that one is not built here, because `where` is what src/merge-fields.js hands back
       and a jump to the roster would be this screen deciding on its own which fault belongs to
       which record. */
    const jump = el('button', 'mf-jump', error.where === 'subject' ? 'Subject' : 'Body');
    jump.type = 'button';
    jump.setAttribute('data-template-jump', error.where === 'subject' ? 'subject' : 'body');
    jump.setAttribute('aria-label', 'Go to the ' + (error.where === 'subject' ? 'subject' : 'body')
      + ' and fix ' + error.field);
    row.append(jump);
    host.append(row);
  });
}

function paintPreview(model) {
  const preview = model.preview;

  const picker = document.getElementById(STUDENT_ID);
  if (picker) {
    /* Rebuilt from the document on every paint, so a class archived or a student removed behind
       this screen cannot leave an option pointing at somebody who is not there. The chosen value is
       re-applied after the rebuild rather than trusted to survive it.

       AND IT IS EMPTY WHILE THE PROJECTOR IS ON, rather than merely hidden with the row. This is
       src/supports.js's sensitiveValue() rule applied one control over, in its own words: an element
       with `display: none` is still an element a screenshot tool, a find-in-page or an accessibility
       tree can reach, and a list of every student on every roster is not a thing to leave sitting in
       a hidden control on a screen that is facing a room. */
    const wanted = preview.blocked ? []
      : preview.students.map((row) => row.key + '|' + row.name + ' · ' + row.className);
    const there = Array.prototype.map.call(picker.options, (o) => o.value + '|' + o.textContent);
    /* REBUILT ONLY WHEN THE LIST ACTUALLY CHANGED, because this paint runs on every keystroke: on
       iPadOS a <select> that is replaced while its wheel is open loses the wheel, and a teacher who
       tapped the picker and then had it close under her would blame the app rather than the
       repaint. Same rule src/categories.js keeps about an input under a caret, one control over. */
    if (JSON.stringify(wanted) !== JSON.stringify(there)) {
      picker.textContent = '';
      wanted.forEach((row, at) => {
        const option = document.createElement('option');
        option.value = preview.students[at].key;
        option.textContent = preview.students[at].name + ' · ' + preview.students[at].className;
        picker.append(option);
      });
    }
    if (!preview.blocked) picker.value = preview.key;
  }
  const row = document.getElementById(STUDENT_ROW_ID);
  if (row) row.classList.toggle('hidden', preview.blocked || !preview.hasStudent);

  const draftBox = document.getElementById(DRAFT_ID);
  if (draftBox) draftBox.classList.toggle('hidden', preview.blocked || !preview.hasStudent);
  if (!preview.blocked && preview.hasStudent) {
    paintResolved(document.getElementById(SUBJECT_OUT_ID), preview.subject);
    paintResolved(document.getElementById(BODY_OUT_ID), preview.body);
  } else {
    const subject = document.getElementById(SUBJECT_OUT_ID);
    if (subject) subject.textContent = '';
    const body = document.getElementById(BODY_OUT_ID);
    if (body) body.textContent = '';
  }

  const empty = document.getElementById(PREVIEW_EMPTY_ID);
  if (empty) empty.classList.toggle('hidden', preview.blocked || preview.hasStudent);
  const refused = document.getElementById(PREVIEW_BLOCKED_ID);
  if (refused) refused.classList.toggle('hidden', !preview.blocked);

  paintBlock(model);
}

/*
  Paint the screen from the open document. Called on every arrival and from the chains in
  src/shell.js that can change what is on it — a score, a mark, a class, a term, the projector
  switch. Not subscribed to the store, for the reason src/home.js gives about the cards: a
  subscriber fires on every save, and redrawing a screen while a teacher is typing into it is how a
  caret gets taken out from under her.
*/
export function renderTemplates(opts) {
  const host = document.getElementById(LIST_ID);
  if (!host) return;
  const model = templatesModel();
  paintList(model);
  paintEditor(model, !opts || opts.fields !== false);
  paintPalette(model);
  paintPreview(model);
}

/* ────────────────────────────── the controls ──────────────────────────────

   Every one of these ends in a render and, where something happened that a screen-reader user
   cannot see, a spoken sentence. Three of them write; the rest change what is on screen, which is a
   fact about this browser and this minute. */

/*
  ARRIVAL. Called by src/shell.js when this becomes the view in <main>, and not on a repaint — the
  same split src/calendar-view.js's resetCalendar() and src/signals-view.js's resetSignals() make,
  for their reason: a teacher who has just filtered to praise must not be put back on *All* because
  something behind her redrew the screen.

  EVERY ARRIVAL OPENS ON AN EMPTY EDITOR. That is the owner's ruling about the starters arriving in
  the one place it can be enforced: there is no state anywhere that could re-open the screen on a
  shipped sentence, because nothing remembers one.
*/
export function resetTemplates() {
  toneFilter = '';
  editingId = '';
  draft = emptyDraft();
  startedFrom = '';
  status = { text: '', tone: '' };
  caret = { field: 'body', at: 0 };
  /* The preview's student is recomputed rather than kept, like everything else on this arrival —
     but it survives a repaint, so a teacher who picked the fourth student and then typed for ten
     minutes is still previewing against her. */
  previewKey = '';
}

export function setTemplatesTone(tone) {
  toneFilter = tone === 'concern' || tone === 'praise' ? tone : '';
  renderTemplates({ fields: false });
  announce(toneFilter ? templates.toneLabel(toneFilter) + ' templates only.'
    : 'Every template.');
}

/* Load a saved record into the editor. The draft is a COPY: everything typed after this is
   unsaved, and the record in the document is untouched until Save. */
export function openTemplate(id) {
  const record = templates.templateById(getDoc(), id);
  if (!record) return false;
  editingId = record.id;
  startedFrom = '';
  draft = { name: record.name, tone: record.tone, audience: record.audience,
    subject: record.subject, body: record.body };
  status = { text: '', tone: '' };
  renderTemplates();
  /* THE CARET IS NOT MOVED HERE, AND THAT IS A DECISION ABOUT AN iPAD RATHER THAN AN OMISSION.
     Focusing a field raises the software keyboard, which on a phone covers the preview this screen
     exists for — and a teacher who taps a template in the list has said "show me this one", not "I
     am about to type". *New template* below is the one arrival where she IS, and it is the only one
     that takes focus. */
  announce('Editing ' + (record.name || 'that template') + '.');
  return true;
}

/*
  Load one of the eight into the editor as a NEW template. `editingId` stays empty, which is the
  whole of "a starter is offered and never loaded": what is on screen is an unsaved draft, and the
  record is written by a Save like any other.
*/
export function openStarter(key) {
  const starter = templates.starterByKey(key);
  if (!starter) return false;
  editingId = '';
  startedFrom = starter.key;
  draft = { name: starter.name, tone: starter.tone, audience: starter.audience,
    subject: starter.subject, body: starter.body };
  status = { text: '', tone: '' };
  renderTemplates();
  /* No focus, for openTemplate()'s reason above. The announcement carries WO-5.5's sentence too:
     the line under the editor is where it is written, and a teacher on a screen reader hears this
     at the moment she opens the starter rather than only if she goes looking for that line. Both
     say the same thing, because two surfaces saying different halves of one rule is the shape of
     defect this work order exists to close. */
  announce(starter.name + ' is in the editor. It is not on offer when you write a message until '
    + 'you save it — change it and save it to make it yours.');
  return true;
}

export function newTemplateDraft() {
  editingId = '';
  startedFrom = '';
  draft = emptyDraft();
  status = { text: '', tone: '' };
  renderTemplates();
  focusField(NAME_ID);
  announce('A new template. Give it a name, write it, and save it.');
}

/* A field of the editor, as it is typed. It writes to the DRAFT and never to the document — the
   header says why this editor has a Save button where the rest of the app does not — and it
   repaints the preview and nothing else, so the caret stays where the teacher put it. */
export function editTemplateField(input) {
  if (!input) return;
  const which = input.getAttribute('data-template-field');
  if (which !== 'name' && which !== 'subject' && which !== 'body') return;
  draft[which] = input.value;
  if (which !== 'name') noteCaret(input);
  renderTemplates({ fields: false });
}

/* The two <select>s, read on `change` for the reason every other <select> in this app is: a select
   commits on change, and hooking `input` as well would do the work twice for one tap. */
export function setTemplateMeta(select) {
  if (!select) return;
  const which = select.getAttribute('data-template-meta');
  if (which === 'tone' && templates.isTone(select.value)) draft.tone = select.value;
  else if (which === 'audience' && templates.isAudience(select.value)) draft.audience = select.value;
  else return;
  renderTemplates({ fields: false });
  announce(which === 'tone' ? templates.toneLabel(draft.tone) + '.'
    : 'To a ' + templates.audienceLabel(draft.audience).toLowerCase() + '.');
}

/* Where the caret is, remembered as it moves. src/shell.js's focusin listener is the seam — see
   the note at `caret` for why this cannot be read at the moment a chip is tapped. */
export function noteCaret(input) {
  if (!input) return;
  const which = input.getAttribute('data-template-field');
  if (which !== 'subject' && which !== 'body') return;
  const at = typeof input.selectionStart === 'number' ? input.selectionStart
    : String(input.value || '').length;
  caret = { field: which, at: at };
}

/*
  A PALETTE CHIP, INSERTED AT THE CARET — the drawing's gesture, shipped as drawn.

  THE READING THAT WOULD SETTLE IT ON A PHONE WAS WAIVED AND NOT TAKEN (the owner, 2026-08-28).
  design/mockups/outreach.html's last caption asks in bold for a thumb on a real tablet: on a phone
  the keyboard is up, the palette is below the fold, and tapping a chip may close the field it is
  meant to type into. The alternative in hand is a palette that opens as a sheet over the keyboard.
  Neither has been measured, the owner ruled the column ships as drawn, and this comment is where
  that gap is recorded rather than quietly closed.
*/
export function insertField(name) {
  const field = caret.field === 'subject' ? 'subject' : 'body';
  const id = field === 'subject' ? SUBJECT_ID : BODY_ID;
  const node = document.getElementById(id);
  const token = '{{' + String(name || '') + '}}';
  const current = String(draft[field] == null ? '' : draft[field]);
  const at = Math.max(0, Math.min(caret.at, current.length));
  draft[field] = current.slice(0, at) + token + current.slice(at);
  caret = { field: field, at: at + token.length };
  if (node) {
    node.value = draft[field];
    if (typeof node.focus === 'function') node.focus({ preventScroll: true });
    if (typeof node.setSelectionRange === 'function') {
      node.setSelectionRange(caret.at, caret.at);
    }
  }
  renderTemplates({ fields: false });
  announce(token + ' put in the ' + field + '.');
}

/* The block strip's one control: to the half of the template the field is in. It does not select
   the token — the field is the answer to "where do I fix this", and a selection made from here
   would be a caret moved out from under a teacher who was already typing. */
export function jumpTo(where) {
  focusField(where === 'subject' ? SUBJECT_ID : BODY_ID);
}

function focusField(id) {
  const node = document.getElementById(id);
  if (node && typeof node.focus === 'function') node.focus({ preventScroll: true });
}

/* Which student the preview resolves against. Nothing is written and nothing is remembered: it is a
   fact about this minute, like the concern list's class filter. */
export function setPreviewStudent(value) {
  previewKey = String(value || '');
  renderTemplates({ fields: false });
  const model = templatesModel();
  announce(model.preview.name ? 'Previewing against ' + model.preview.name + '.' : 'No student.');
}

/*
  *ANOTHER STUDENT* — the drawing's own control, and it steps to the next one on the list rather
  than to a random one. A template that reads perfectly against the first student on the roster is
  blocked for the fourth, so what this buys is walking the roster quickly; a random pick would make
  "have I tried them all" unanswerable.
*/
export function nextPreviewStudent() {
  const choices = previewChoices(getDoc());
  if (!choices.length) return;
  const at = choices.map((c) => c.key).indexOf(previewKey);
  const next = choices[(at + 1 + choices.length) % choices.length];
  setPreviewStudent(next.key);
}

/* ────────────────────────────── the three writers ────────────────────────────── */

/*
  SAVE. Adds a record when the editor is on a new template, and replaces the fields of the open one
  when it is not.

  THE ONE REFUSAL IS A NAME. A template with no name is a row in a list that says nothing, and the
  send flow offers these by name — so the save stops and the status line says so, rather than
  writing "Untitled template" on the teacher's behalf. Nothing else is required: an empty body is a
  template somebody is halfway through writing, and refusing that would be this screen deciding when
  she is finished.
*/
export function saveTemplate() {
  const doc = getDoc();
  if (!doc) {
    status = { text: 'There is no school year open, so there is nowhere to put a template yet.',
      tone: 'error' };
    renderTemplates({ fields: false });
    return false;
  }
  if (!String(draft.name || '').trim()) {
    status = { text: 'Give the template a name first — the send flow offers these by name.',
      tone: 'error' };
    renderTemplates({ fields: false });
    focusField(NAME_ID);
    announce('That template needs a name before it can be saved.');
    return false;
  }
  const fields = { name: draft.name, tone: draft.tone, audience: draft.audience,
    subject: draft.subject, body: draft.body };
  let saved = null;
  if (editingId) {
    update((d) => { saved = templates.updateTemplate(d, editingId, fields); });
  } else {
    update((d) => { saved = templates.addTemplate(d, fields); });
    if (saved) editingId = saved.id;
  }
  if (!saved) {
    status = { text: 'That template could not be saved.', tone: 'error' };
    renderTemplates({ fields: false });
    return false;
  }
  startedFrom = '';
  draft = { name: saved.name, tone: saved.tone, audience: saved.audience,
    subject: saved.subject, body: saved.body };
  status = { text: 'Saved. It is offered for ' + templates.toneLabel(saved.tone).toLowerCase()
    + ' messages to a ' + templates.audienceLabel(saved.audience).toLowerCase() + '.', tone: '' };
  renderTemplates();
  announce((saved.name || 'That template') + ' is saved.');
  return true;
}

/*
  DUPLICATE — the drawing's second action, and the shortest path to the pair this work order's first
  acceptance line is about: the same words to the same audience in the other tone is one tap and one
  rewrite, rather than a retype. It writes immediately and opens the copy, because a duplicate that
  waited for a Save would leave two identical unsaved drafts and one of them would be lost.
*/
export function duplicateTemplate() {
  const doc = getDoc();
  const record = templates.templateById(doc, editingId);
  if (!record) return false;
  let copy = null;
  update((d) => {
    copy = templates.addTemplate(d, {
      name: record.name + ' (copy)', tone: record.tone, audience: record.audience,
      subject: record.subject, body: record.body,
    });
  });
  if (!copy) return false;
  editingId = copy.id;
  startedFrom = '';
  draft = { name: copy.name, tone: copy.tone, audience: copy.audience,
    subject: copy.subject, body: copy.body };
  status = { text: 'Copied. Change the tone or the audience and save it again.', tone: '' };
  renderTemplates();
  focusField(NAME_ID);
  announce(copy.name + ' is in the editor.');
  return true;
}

/*
  DELETE, with no confirm — src/templates.js's removeTemplate() carries the argument, which is
  src/events.js's test applied rather than re-argued: a template destroys nothing on the way out and
  putting it back costs one Save. It is drawn only while a SAVED template is open, so there is no
  version of this that throws away an unsaved draft without warning; leaving one of those is what
  *New template* and picking another row do, and both say so in the status line.
*/
export function deleteTemplate() {
  const record = templates.templateById(getDoc(), editingId);
  if (!record) return false;
  const said = record.name || 'That template';
  update((d) => { templates.removeTemplate(d, record.id); });
  editingId = '';
  startedFrom = '';
  draft = emptyDraft();
  status = { text: said + ' is gone. The editor is empty.', tone: '' };
  renderTemplates();
  announce(said + ' is deleted.');
  return true;
}
