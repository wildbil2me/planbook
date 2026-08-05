/*
  The teacher's own details — name, school, email, the administrator she copies, and whether
  outreach copies her by default.

  WHY THIS IS ITS OWN FILE rather than a corner of src/roster.js. src/README.md says one concern
  per file, named for the thing it owns, and this is the only thing in the app that is about the
  person using it rather than about a student. The work order that adds it also adds the roster,
  which is why they arrive together — but they share no state, no dialog and no read, and the
  reason src/classes.js keeps two concerns in one file (terms are only answerable after classes)
  does not apply here at all.

  WHAT IT IS FOR, which is what makes these five fields worth a screen before there is any
  outreach to send. Phase 5 drafts every message through `mailto:` (CLAUDE.md — a mail scope
  reads "send email as you", and no scope means nothing to fear on the consent screen). A draft
  has to be signed by somebody and copied to somebody, and the teacher typing her own name into
  the bottom of forty emails is how a feature stops being used. `adminEmail` and `defaultCc` are
  what the audience picker reads when a message needs to go up the building as well as home.

  THE LIMIT OF WHAT LIVES HERE. Settings that are about the gradebook rather than the teacher —
  the letter scale, the signal thresholds — belong to the work orders that use them and want
  their own home. This file holds `doc.teacher` and nothing else. It writes into the year
  document rather than into localStorage on purpose: a name is not a UI preference, it survives a
  device change, and src/prefs.js refuses undeclared keys precisely so this cannot drift there.
*/

import { getDoc, update } from './store.js';
import { openModal } from './modal.js';
import { announce } from './live-region.js';

const MODAL_ID = 'teacherModal';
const CC_BTN_ID = 'teacherCcBtn';
const HINT_ID = 'teacherCcState';

/* The fields this screen may write, by name — an allowlist rather than a pass-through, for the
   same reason src/roster.js keeps one: the hook carries the field name out of the markup, and a
   value this list does not name writes nothing at all. */
const TEACHER_FIELDS = ['name', 'school', 'email', 'adminEmail'];

/* Every read of `teacher` goes through here. A document can arrive without the key — a restored
   backup from another build — and a screen that has to check before it reads is a screen that
   will eventually forget (src/store.js:102-104). */
function teacherOf(doc) {
  if (!doc) return null;
  if (!doc.teacher || typeof doc.teacher !== 'object') {
    doc.teacher = { name: '', school: '', email: '', adminEmail: '', defaultCc: true };
  }
  return doc.teacher;
}

function fieldValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value == null ? '' : value;
}

function renderCc(teacher) {
  const btn = document.getElementById(CC_BTN_ID);
  const hint = document.getElementById(HINT_ID);
  const on = !!teacher.defaultCc;
  if (btn) {
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.textContent = on ? 'Copy me: on' : 'Copy me: off';
  }
  /* The state said in words as well as in a pressed button. A toggle whose only tell is a fill
     colour is a toggle that gets read wrong at 7:40 in the morning, and this one decides whether
     the teacher has her own copy of what went home. */
  if (hint) {
    hint.textContent = on
      ? 'Every draft will be addressed with you copied in, so you keep your own record of it.'
      : 'Drafts will not copy you. Your sent-mail folder still holds anything you actually send.';
  }
}

export function openTeacherSettings(opener) {
  const teacher = teacherOf(getDoc());
  if (!teacher) return;
  /* Filled before the panel opens, for the reason src/year-picker.js gives: a modal that opens
     and then fills in is a modal that flickers. */
  fieldValue('teacherName', teacher.name);
  fieldValue('teacherSchool', teacher.school);
  fieldValue('teacherEmail', teacher.email);
  fieldValue('teacherAdminEmail', teacher.adminEmail);
  renderCc(teacher);
  openModal(MODAL_ID, opener);
}

/* A field being typed. Called from shell.js's `input` listener, so it fires per keystroke and the
   store's debounce is what turns that into one save (src/store.js). Nothing is re-rendered —
   replacing the input the teacher is typing into would take the caret with it. */
export function editTeacherField(input) {
  const teacher = teacherOf(getDoc());
  const field = input.getAttribute('data-teacher-field');
  if (!teacher || TEACHER_FIELDS.indexOf(field) < 0) return;
  const value = input.value;
  update(() => { teacher[field] = value; });
}

export function toggleDefaultCc() {
  const teacher = teacherOf(getDoc());
  if (!teacher) return;
  update(() => { teacher.defaultCc = !teacher.defaultCc; });
  renderCc(teacher);
  announce(teacher.defaultCc
    ? 'Outreach drafts will copy you.'
    : 'Outreach drafts will not copy you.');
}
