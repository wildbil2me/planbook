/* roster-contacts.mjs — roster & contacts
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { INSTALL_CLASS_READER } from './classes-terms.mjs';

/* Three page-side readers, for the reason window.__cls exists: one round trip per check, and the
   reads cannot drift apart between them. Re-installed after every reload, like the walker. */
export const INSTALL_ROSTER_READER = `(function(){
  function pair(s){ return s ? [s.last, s.first] : null; }
  window.__ros = function(){
    var doc = window.planbook.store.getDoc();
    var openId = window.planbook.classes.getSelectedClassId();
    var open = doc.classes.filter(function(c){ return c.id === openId; })[0] || null;
    function byId(id){ return doc.students.filter(function(s){ return s.id === id; })[0] || null; }
    var rows = Array.prototype.slice.call(document.querySelectorAll('#rosterList .roster-row'));
    var orphans = Array.prototype.slice.call(document.querySelectorAll('#rosterOrphanList .roster-row'));
    function controls(r){
      return { name: (r.querySelector('.roster-row-name')||{}).textContent,
               edit: !!r.querySelector('[data-student-edit]'),
               remove: !!r.querySelector('[data-student-remove]'),
               add: !!r.querySelector('[data-student-add-to-class]'),
               del: !!r.querySelector('[data-student-delete]') };
    }
    return {
      students: doc.students.length,
      docPairs: doc.students.map(pair),
      openClass: open ? open.id : '',
      openName: open ? open.name : '',
      tabNames: Array.prototype.slice.call(
        document.querySelectorAll('#classTabBar [data-class-tab]')).map(function(b){ return b.textContent; }),
      rosterIds: open ? (open.roster || []).slice() : [],
      rosterPairs: open ? (open.roster || []).map(function(id){ return pair(byId(id)); }) : [],
      rowNames: rows.map(function(r){ return (r.querySelector('.roster-row-name')||{}).textContent; }),
      rowNotes: rows.map(function(r){ return (r.querySelector('.roster-row-note')||{}).textContent; }),
      rowControls: rows.map(controls),
      /* A student's name is pasted out of a school system, so the same claim src/classes.js makes
         about a class name has to hold here: rendered as text, never as markup. */
      injectedInList: document.querySelectorAll('#rosterList b, #rosterList i, #rosterList script').length,
      countLine: (document.getElementById('rosterCount')||{}).textContent,
      orphanHidden: document.getElementById('rosterOrphanSection').classList.contains('hidden'),
      orphanControls: orphans.map(controls),
      rosterError: (document.getElementById('rosterError')||{}).textContent,
      teacher: JSON.parse(JSON.stringify(doc.teacher || {})),
      ccPressed: (document.getElementById('teacherCcBtn')||{}).getAttribute
        ? document.getElementById('teacherCcBtn').getAttribute('aria-pressed') : '',
      ccHint: (document.getElementById('teacherCcState')||{}).textContent,
      rev: doc.rev
    };
  };
  /* The preview, read off the fields on screen rather than out of src/roster.js's model — the
     Traps line is about what the teacher can SEE before she commits, and a model she cannot see
     proves nothing about that. */
  window.__preview = function(){
    var rows = Array.prototype.slice.call(document.querySelectorAll('#rosterPasteList .paste-row'));
    var btn = document.getElementById('rosterPasteCommitBtn') || {};
    return {
      rows: rows.length,
      pairs: rows.map(function(r){ var f = r.querySelectorAll('.paste-input');
        return [f[0] ? f[0].value : null, f[1] ? f[1].value : null]; }),
      include: rows.map(function(r){ var t = r.querySelector('[data-paste-include]');
        return t ? t.getAttribute('aria-pressed') === 'true' : null; }),
      labels: rows.map(function(r){ var t = r.querySelector('[data-paste-include]');
        return t ? t.textContent : ''; }),
      notes: rows.map(function(r){ return (r.querySelector('.paste-row-note')||{}).textContent; }),
      warn: rows.map(function(r){ return r.classList.contains('warn'); }),
      count: (document.getElementById('rosterPasteCount')||{}).textContent,
      commitText: btn.textContent || '', commitDisabled: !!btn.disabled
    };
  };
  window.__student = function(id){
    var doc = window.planbook.store.getDoc();
    var s = doc.students.filter(function(x){ return x.id === id; })[0];
    if (!s) return null;
    return { id: s.id, first: s.first, last: s.last, nickname: s.nickname, gradYear: s.gradYear,
             email: s.email, phone: s.phone, phone2: s.phone2, notes: s.notes,
             guardians: (s.guardians || []).map(function(g){
               return { name:g.name, relation:g.relation, email:g.email, phone:g.phone,
                        phone2:g.phone2, language:g.language, preferred:!!g.preferred }; }),
             counselor: { name: (s.counselor||{}).name, email: (s.counselor||{}).email },
             inClasses: doc.classes.filter(function(c){ return (c.roster||[]).indexOf(s.id) >= 0; })
               .map(function(c){ return c.id; }),
             /* Enumerated rather than sampled. It began as WO-1.7's Out of scope line — no
                supports stub before the work order that owns the shape — and at WO-1.8 it is the
                other half of the same claim: the block is there now, spelled the one way
                docs/data-model.md spells it, and nothing else has crept into the record. */
             keys: Object.keys(s).sort() };
  };
  return 1; })()`;

export async function run(h) {
const { ROOT, check, skip, readLocalStore, oursIn, foreignIn, storeDetail, send, evalJs, has,
  clickSel, KILL_ANIM, INSTALL_WALKER, waitForBoot, seam } = h;

/* index.html, read here since WO-1.26. The strapline check below used to reach the
   module-scope `const html` in the safe-area section four thousand lines above it — the
   exact reach the split ends. Same file, same read, one screen away from its one use. */
const html = await fs.readFile(path.join(ROOT, 'index.html'), 'utf8');

/* ───────────────── roster & contacts ─────────────────
 *
 * The five acceptance lines of WO-1.7, each driven through the real controls rather than through
 * src/roster.js's exports. The parser is exported on `window.planbook.roster` and this section
 * deliberately never calls it: a check that asked parseRosterLine() what it thought of a line
 * would agree with itself perfectly while the paste box wrote something else. Everything below
 * types into the box a teacher types into, reads the split out of the fields she reads it out of,
 * and then compares BOTH against the document — which is what "the preview matched" means.
 */

console.log('\n--- roster & contacts ---');

/* Flushed, then reloaded, for the reason the classes section gives at length (tools/README.md,
   trap 6) and for one that belongs to this feature: every screen here is filled from the document
   when its dialog opens, so a roster that renders only because the module still holds what it just
   wrote is a roster that is empty on the teacher's next launch. */
await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
await send('Page.reload');
await new Promise(r => setTimeout(r, 600));
const rosterBooted = await waitForBoot();
await evalJs(KILL_ANIM);
await evalJs(INSTALL_WALKER);


const rosterSeam = await evalJs("!!(window.planbook && window.planbook.roster"
  + " && typeof window.planbook.roster.parseRosterLine === 'function')");

if (!rosterBooted || !rosterSeam) {
  skip('roster & contacts: paste, duplicates, one student in two classes, remove, contacts round-trip',
    rosterBooted ? 'no window.planbook.roster seam on the page — it is kept deliberately for this file to read through, so its absence is a defect and not a stage of the build; see the window.planbook block at the foot of src/shell.js'
      : 'the app did not boot before this section');
} else {
  await evalJs(INSTALL_ROSTER_READER);
  const closeAll = () => evalJs("(function(){ ['studentDeleteModal','studentModal',"
    + "'rosterPasteModal','rosterModal','teacherModal','classesModal','aboutModal']"
    + ".forEach(function(m){ window.planbook.closeModal(m); }); return 1; })()");
  const openRosterOn = async (tab) => {
    await closeAll();
    await clickSel('[data-class-tab]', tab);
    await clickSel('header [data-roster-manage]');
    return evalJs('window.__ros()');
  };

  /*
    The fixture, and every line of it is a shape a real paste arrives in. `Last, First` with and
    without stray whitespace, two spreadsheet columns separated by a tab, `First Last` with nothing
    to read the split from, a surname made of particles, two spellings of a suffix, and the column
    heading a copied range brings along with it. The expected split beside each line is written out
    rather than computed, because a check that derived the answer from the same parser it is
    checking would agree with itself no matter what the parser did.
  */
  const PASTE_LINES = [
    ['Last Name\tFirst Name', null, null],
    ['Van Dyke, Mary', 'Van Dyke', 'Mary'],
    ['Okonkwo, Chidi', 'Okonkwo', 'Chidi'],
    ['  Nakamura ,  Yuki  ', 'Nakamura', 'Yuki'],
    ["O'Brien, Siobhan", "O'Brien", 'Siobhan'],
    ['Álvarez, José', 'Álvarez', 'José'],
    ['Washington, Dee Dee', 'Washington', 'Dee Dee'],
    ['Delgado, Robert, Jr.', 'Delgado Jr.', 'Robert'],
    ['Chen, Wei-Lin', 'Chen', 'Wei-Lin'],
    ['de la Cruz, Ana', 'de la Cruz', 'Ana'],
    ['Park, Min', 'Park', 'Min'],
    ['Ito\tHaruki', 'Ito', 'Haruki'],
    ['Bauer\t\tGreta', 'Bauer', 'Greta'],
    ['Novak\tPetra  ', 'Novak', 'Petra'],
    ['Marcus Aurelio', 'Aurelio', 'Marcus'],
    ['Jonas Van Der Berg', 'Van Der Berg', 'Jonas'],
    ['Anh Le', 'Le', 'Anh'],
    ['Robert Smith Jr', 'Smith Jr', 'Robert'],
    ['Grace Hopper', 'Hopper', 'Grace'],
    ['Ada Lovelace', 'Lovelace', 'Ada'],
    ['Katherine Johnson', 'Johnson', 'Katherine'],
    ['Bo <b>x</b>, Mae', 'Bo <b>x</b>', 'Mae'],
    ['Curie, Marie', 'Curie', 'Marie'],
    ['Franklin, Rosalind', 'Franklin', 'Rosalind'],
    ['Tharp, Marie', 'Tharp', 'Marie'],
    ['Ochoa, Ellen', 'Ochoa', 'Ellen'],
  ];
  const EXPECTED = PASTE_LINES.slice(1).map(l => [l[1], l[2]]);
  /* A blank line in the middle is what a copy out of two ranges looks like, and the two at the end
     are what every copy out of a spreadsheet looks like. All three have to disappear rather than
     arrive as empty rows the teacher unticks one at a time. */
  const PASTE_TEXT = [
    ...PASTE_LINES.slice(0, 6).map(l => l[0]), '',
    ...PASTE_LINES.slice(6).map(l => l[0]), '', '',
  ].join('\n');
  const typeInto = (id, text) => evalJs('(function(){ var e = document.getElementById('
    + JSON.stringify(id) + '); e.value = ' + JSON.stringify(text)
    + '; e.dispatchEvent(new Event("input", { bubbles: true })); return 1; })()');

  const start = await openRosterOn(0);
  check('the roster opens on the class that is open, empty, with the class-less students listed apart',
    start.tabNames.length >= 2 && start.openName === start.tabNames[0]
      && start.rosterIds.length === 0
      && start.rowNames.length === 0 && start.orphanHidden === false
      && start.orphanControls.length === start.students
      && start.orphanControls.every(c => c.add && c.del && !c.remove),
    'open class = ' + JSON.stringify(start.openName) + ', on its roster = '
      + start.rosterIds.length + ', in the year and in no class = ' + start.orphanControls.length);

  /* ── acceptance 1: 25 names, split correctly, and the preview matched ── */

  await clickSel('#rosterModal [data-roster-paste]');
  await typeInto('rosterPasteBox', PASTE_TEXT);
  await clickSel('[data-roster-preview]');
  const preview = await evalJs('window.__preview()');
  const previewPairs = preview.pairs.slice(1);
  check('26 pasted lines preview as 26 rows, each split into a first and a last you can see and edit',
    preview.rows === 26 && JSON.stringify(previewPairs) === JSON.stringify(EXPECTED),
    preview.rows === 26
      ? 'every row matched the expected split'
      : previewPairs.length + ' name rows; first mismatch = ' + JSON.stringify(
          previewPairs.find((p, i) => JSON.stringify(p) !== JSON.stringify(EXPECTED[i])) || null));
  check('the blank lines are gone and the column heading is ticked off rather than added',
    preview.include[0] === false && preview.labels[0] === 'Skip'
      && /Column heading/.test(preview.notes[0]) && preview.warn[0] === true
      && preview.include.slice(1).every(v => v === true),
    JSON.stringify(preview.pairs[0]) + ' — ' + JSON.stringify(preview.notes[0]));
  check('and the preview says how many will be added, out of how many lines',
    preview.count === '25 new students — out of 26 lines.'
      && preview.commitText === 'Add 25 students' && preview.commitDisabled === false,
    JSON.stringify(preview.count) + ' · button ' + JSON.stringify(preview.commitText));

  await clickSel('[data-roster-commit]');
  const pasted = await evalJs('window.__ros()');
  check('committing adds exactly 25 students to this class, split exactly as the preview showed',
    pasted.students === start.students + 25 && pasted.rosterIds.length === 25
      && JSON.stringify(pasted.rosterPairs) === JSON.stringify(previewPairs)
      && pasted.rowNames.length === 25,
    'students in the year ' + start.students + ' -> ' + pasted.students + ', on this roster '
      + pasted.rosterIds.length + ', document split === preview split');
  check('a pasted name carrying markup stays those characters — createElement, never innerHTML',
    pasted.rowNames.indexOf('Bo <b>x</b>, Mae') >= 0 && pasted.injectedInList === 0,
    'elements injected into the roster list = ' + pasted.injectedInList);

  /* ── the Traps line: the split is a guess, and the preview is where it gets caught ── */

  await clickSel('#rosterModal [data-roster-paste]');
  await typeInto('rosterPasteBox', 'Fitzgerald Ellen\nBhatt Priya\n');
  await clickSel('[data-roster-preview]');
  const guessed = await evalJs('window.__preview()');
  check('a line with no separator is read as First Last, shown split, and flagged as a guess',
    JSON.stringify(guessed.pairs) === JSON.stringify([['Ellen', 'Fitzgerald'], ['Priya', 'Bhatt']])
      && guessed.warn.every(w => w === true)
      && guessed.notes.every(n => /Read as .First Last./.test(n) && /check the split/.test(n)),
    JSON.stringify(guessed.pairs) + ' — ' + JSON.stringify(guessed.notes[0]));
  await clickSel('[data-paste-swap-all]');
  const swappedAll = await evalJs('window.__preview()');
  check('one tap puts every row the other way round, in the fields on screen',
    JSON.stringify(swappedAll.pairs) === JSON.stringify([['Fitzgerald', 'Ellen'], ['Bhatt', 'Priya']])
      && swappedAll.warn.every(w => w === false)
      && swappedAll.include.every(v => v === true),
    JSON.stringify(swappedAll.pairs));
  await clickSel('[data-paste-swap]', 1);
  const swappedOne = await evalJs('window.__preview()');
  check('and the per-row swap moves that row and only that row',
    JSON.stringify(swappedOne.pairs) === JSON.stringify([['Fitzgerald', 'Ellen'], ['Priya', 'Bhatt']]),
    JSON.stringify(swappedOne.pairs));
  await clickSel('[data-paste-swap]', 1);
  await clickSel('[data-roster-commit]');
  const corrected = await evalJs('window.__ros()');
  check('and the corrected split is what gets written, not the guess',
    corrected.rosterIds.length === 27
      && JSON.stringify(corrected.rosterPairs.slice(25))
        === JSON.stringify([['Fitzgerald', 'Ellen'], ['Bhatt', 'Priya']]),
    JSON.stringify(corrected.rosterPairs.slice(25)));

  /* ── acceptance 2: the same list again ── */

  await clickSel('#rosterModal [data-roster-paste]');
  await typeInto('rosterPasteBox', PASTE_TEXT);
  await clickSel('[data-roster-preview]');
  const again = await evalJs('window.__preview()');
  check('re-pasting the same list warns on every line instead of silently doubling the roster',
    again.rows === 26 && again.include.every(v => v === false)
      && again.labels.slice(1).every(l => l === 'Skip')
      && again.notes.slice(1).every(n => /Already in this class/.test(n))
      && again.warn.slice(1).every(w => w === true)
      && again.count === '0 new students · 25 names already in this class, skipped — out of 26 lines.',
    JSON.stringify(again.count));
  check('and the Add control refuses rather than being live and doubling it',
    again.commitDisabled === true && again.commitText === 'Nothing to add',
    'button ' + JSON.stringify(again.commitText) + ', disabled = ' + again.commitDisabled);
  /* Clicked anyway: a disabled button fires no click, so this is the same gesture a teacher who
     did not read the count line makes, and the counts below are what she gets for it. */
  await clickSel('[data-roster-commit]');
  await evalJs("window.planbook.closeModal('rosterPasteModal');1");
  const afterRepaste = await evalJs('window.__ros()');
  check('so a second paste of the same 25 names writes nothing at all',
    afterRepaste.students === corrected.students && afterRepaste.rosterIds.length === 27,
    'students in the year = ' + afterRepaste.students + ', on this roster = '
      + afterRepaste.rosterIds.length);

  /* ── acceptance 3: one student, two classes, one set of contacts ── */

  const maryId = afterRepaste.rosterIds[0];
  await clickSel('#rosterList .roster-row:nth-child(1) [data-student-edit]');
  await evalJs(`(function(){
    function set(id, v){ var e = document.getElementById(id); e.value = v;
      e.dispatchEvent(new Event('input', { bubbles: true })); }
    set('studentNickname', 'Mimi');
    set('studentGradYear', '2029');
    set('studentEmail', 'mary.vandyke@student.example.edu');
    set('studentCounselorName', 'R. Ochoa');
    set('studentCounselorEmail', 'r.ochoa@example.edu');
    return 1; })()`);
  await clickSel('#studentModal [data-guardian-add]');
  await evalJs(`(function(){ var list = document.getElementById('guardianList');
    function set(field, v){
      var e = list.querySelector('[data-student-field="guardian.' + field + '"]');
      e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }
    set('name', 'Elena Van Dyke'); set('relation', 'Mother');
    set('email', 'elena.vandyke@example.com'); set('phone', '555-0142'); set('language', 'es');
    return 1; })()`);
  await new Promise(r => setTimeout(r, 200));
  /* The second class, turned on from the editor — which is the whole of "move a student between
     classes": the class takes the id, and the record is not touched at all. */
  await clickSel('#studentClasses [data-student-class]', 1);
  const twoClasses = await evalJs('window.__student(' + JSON.stringify(maryId) + ')');
  const afterJoin = await evalJs('window.__ros()');
  check('a student put into a second class is still one record, with one set of contacts',
    !!twoClasses && twoClasses.inClasses.length === 2
      && afterJoin.students === afterRepaste.students
      && afterJoin.docPairs.filter(p => p[0] === 'Van Dyke' && p[1] === 'Mary').length === 1
      && twoClasses.guardians.length === 1
      && twoClasses.guardians[0].email === 'elena.vandyke@example.com'
      && twoClasses.guardians[0].preferred === true
      && twoClasses.counselor.email === 'r.ochoa@example.edu',
    /* Reported rather than dereferenced. A mutation that copies the student instead of referencing
       her makes this read null, and a check that throws on a defect is a check that took the run
       down instead of naming it. */
    twoClasses
      ? 'in ' + twoClasses.inClasses.length + ' classes, ' + afterJoin.students
        + ' students in the year, ' + twoClasses.guardians.length + ' guardian(s)'
      : 'the student the editor was open on is no longer in the document');
  /* The whole record, enumerated rather than sampled: twelve keys and no thirteenth. `supports` is
     WO-1.8's and is now one of them; the check that used to assert its ABSENCE is the same check,
     which is why it is worth spelling every key out rather than testing for the one in question.
     `phone` and `phone2` are WO-1.23's, on the student as well as on the guardian for the reason
     newStudent() gives — and this line is where a field that arrives by accident is caught. */
  check('and the record carries exactly the fields the data model gives a student, supports included',
    JSON.stringify(twoClasses.keys) === JSON.stringify(['counselor', 'email', 'first', 'gradYear',
      'guardians', 'id', 'last', 'nickname', 'notes', 'phone', 'phone2', 'supports']),
    JSON.stringify(twoClasses.keys));

  const otherClass = await openRosterOn(1);
  check('and the other class shows the same record on its roster rather than a copy of her',
    otherClass.rosterIds.length === 1 && otherClass.rosterIds[0] === maryId
      && /Van Dyke, Mary/.test(otherClass.rowNames[0]) && /Mimi/.test(otherClass.rowNames[0])
      && /^also in /.test(otherClass.rowNotes[0]),
    JSON.stringify(otherClass.rowNames[0]) + ' · ' + JSON.stringify(otherClass.rowNotes[0]));

  /* ── acceptance 4: off one roster, and nowhere else ── */

  await clickSel('#rosterList .roster-row:nth-child(1) [data-student-remove]');
  const afterRemove = await evalJs('window.__ros()');
  const survivor = await evalJs('window.__student(' + JSON.stringify(maryId) + ')');
  check('removing her from this class takes her off this roster and touches nothing else',
    afterRemove.rosterIds.length === 0 && !!survivor && survivor.inClasses.length === 1
      && afterRemove.students === afterJoin.students
      && survivor.email === 'mary.vandyke@student.example.edu'
      && survivor.guardians.length === 1
      && survivor.guardians[0].email === 'elena.vandyke@example.com'
      && survivor.counselor.email === 'r.ochoa@example.edu',
    survivor
      ? 'on this roster now = ' + afterRemove.rosterIds.length + ', still in '
        + survivor.inClasses.length + ' class, contacts intact'
      : 'REMOVE DESTROYED THE RECORD: she is off this roster and out of the school year');
  const backOnFirst = await openRosterOn(0);
  check('and the class she is still in has her, and all 27, exactly as before',
    backOnFirst.rosterIds.length === 27 && backOnFirst.rosterIds[0] === maryId
      && JSON.stringify(backOnFirst.rosterPairs) === JSON.stringify(afterRepaste.rosterPairs),
    backOnFirst.rosterIds.length + ' on the roster, in the order they were pasted');

  /* ── the teacher's own details, which are the other half of this work order's deliverables ── */

  await closeAll();
  await clickSel('header [data-teacher-panel]');
  await evalJs(`(function(){
    function set(id, v){ var e = document.getElementById(id); e.value = v;
      e.dispatchEvent(new Event('input', { bubbles: true })); }
    set('teacherName', 'Ms Toomey'); set('teacherSchool', 'Probe High School');
    set('teacherEmail', 'toomey@example.edu'); set('teacherAdminEmail', 'dean@example.edu');
    return 1; })()`);
  await new Promise(r => setTimeout(r, 200));
  await clickSel('[data-teacher-cc]');
  const teacherOff = await evalJs('window.__ros()');
  check('the teacher\'s five details are written to the year document, the cc flag included',
    teacherOff.teacher.name === 'Ms Toomey' && teacherOff.teacher.school === 'Probe High School'
      && teacherOff.teacher.email === 'toomey@example.edu'
      && teacherOff.teacher.adminEmail === 'dean@example.edu'
      && teacherOff.teacher.defaultCc === false && teacherOff.ccPressed === 'false'
      && /will not copy you/.test(teacherOff.ccHint),
    JSON.stringify(teacherOff.teacher));
  await clickSel('[data-teacher-cc]');
  const teacherOn = await evalJs('window.__ros()');
  check('and the cc toggle says which way it is in words, not only in a fill colour',
    teacherOn.teacher.defaultCc === true && teacherOn.ccPressed === 'true'
      && /copied in/.test(teacherOn.ccHint),
    JSON.stringify(teacherOn.ccHint));

  /*
    WO-1.10's "Header: … teacher name", driven through the field she types it into rather than
    through src/teacher.js — the panel is a modal and the header shows above and behind it, so the
    line has to follow the keystrokes and not the next reload.

    The second half is the one worth having: clearing the name has to put the app's strapline back,
    and the strapline is NOT written out in src/teacher.js — it captures whatever index.html shipped
    in that element. So the expected string is read out of index.html here too. Two copies of a
    sentence is how a header ends up saying something the markup does not, and this is the check
    that would notice.

    The name is put back before moving on, so the document leaves this block exactly as the checks
    above found it.
  */
  const strapline = (html.match(/<p id="headerSubtitle">([^<]*)<\/p>/) || [])[1];
  const named = await evalJs("(document.getElementById('headerSubtitle')||{}).textContent");
  await evalJs(`(function(){ var e = document.getElementById('teacherName'); e.value = '';
    e.dispatchEvent(new Event('input', { bubbles: true })); return 1; })()`);
  await new Promise(r => setTimeout(r, 150));
  const unnamed = await evalJs("(document.getElementById('headerSubtitle')||{}).textContent");
  await evalJs(`(function(){ var e = document.getElementById('teacherName'); e.value = 'Ms Toomey';
    e.dispatchEvent(new Event('input', { bubbles: true })); return 1; })()`);
  await new Promise(r => setTimeout(r, 150));
  const renamed = await evalJs('window.__ros()');
  check('the header says whose planbook it is as she types her name, and says the strapline when she has not',
    named === 'Ms Toomey · Probe High School'
      && !!strapline && unnamed.trim() === strapline.trim()
      && renamed.teacher.name === 'Ms Toomey',
    'named = ' + JSON.stringify(named) + ' · cleared = ' + JSON.stringify(unnamed)
      + ' · index.html ships ' + JSON.stringify(strapline));

  /* Neither a student's contacts nor the teacher's own name is a UI preference, and src/prefs.js
     is the only door to localStorage precisely so this stays true. Read out of the browser rather
     than out of prefs.js, because what is being asserted is what is in the browser. */
  const localKeys = await readLocalStore(evalJs, 300);
  const localBlob = JSON.stringify(localKeys);
  check('nothing a teacher typed about herself or a student reached localStorage, and every key present is ours',
    oursIn(localKeys).length > 0
      && foreignIn(localKeys).length === 0
      && !/Van Dyke|Mimi|elena\.vandyke|r\.ochoa|Ms Toomey|Probe High/.test(localBlob),
    storeDetail(localKeys));

  /* ── acceptance 5: through a save and a reload ── */

  await closeAll();
  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  const rosterReboot = await waitForBoot();
  await evalJs(KILL_ANIM);
  await evalJs(INSTALL_WALKER);
  await evalJs(INSTALL_CLASS_READER);
  await evalJs(INSTALL_ROSTER_READER);
  const reloaded = await evalJs('window.__student(' + JSON.stringify(maryId) + ')');
  check('the student, guardian and counselor emails all come back after a save and a reload',
    rosterReboot && !!reloaded && reloaded.email === 'mary.vandyke@student.example.edu'
      && reloaded.guardians.length === 1
      && reloaded.guardians[0].email === 'elena.vandyke@example.com'
      && reloaded.guardians[0].name === 'Elena Van Dyke'
      && reloaded.guardians[0].relation === 'Mother'
      && reloaded.guardians[0].phone === '555-0142'
      && reloaded.guardians[0].language === 'es'
      && reloaded.guardians[0].preferred === true
      && reloaded.counselor.name === 'R. Ochoa'
      && reloaded.counselor.email === 'r.ochoa@example.edu'
      && reloaded.nickname === 'Mimi' && reloaded.gradYear === '2029',
    rosterReboot ? 'student, guardian and counselor addresses all present out of IndexedDB'
      : 'the loading screen never came down');
  const reloadedRoster = await openRosterOn(0);
  check('and so does the whole roster, in its pasted order, with the teacher\'s details',
    reloadedRoster.rosterIds.length === 27
      && JSON.stringify(reloadedRoster.rosterPairs) === JSON.stringify(backOnFirst.rosterPairs)
      && reloadedRoster.teacher.name === 'Ms Toomey'
      && reloadedRoster.teacher.adminEmail === 'dean@example.edu'
      && reloadedRoster.teacher.defaultCc === true,
    reloadedRoster.rosterIds.length + ' students back on the roster, teacher = '
      + JSON.stringify(reloadedRoster.teacher.name));

  /* The recovery path carries contacts too, which is the half of acceptance 5 that a reload cannot
     answer: IndexedDB is what iOS evicts, and the file is what survives it. Built rather than
     restored — the swap has its own checks further up, and this one is about what is in the file. */
  const inBackup = await evalJs(`(async function(){
    var f = await window.planbook.backup.buildBackup();
    var doc = JSON.parse(f.text);
    var mary = doc.students.filter(function(s){ return s.id === ${JSON.stringify(maryId)}; })[0] || {};
    return { students: doc.students.length,
             email: mary.email,
             guardian: ((mary.guardians || [])[0] || {}).email,
             counselor: (mary.counselor || {}).email,
             teacher: (doc.teacher || {}).email }; })()`);
  check('and the backup file carries the students, their contacts and the teacher\'s address',
    inBackup.students === reloadedRoster.students
      && inBackup.email === 'mary.vandyke@student.example.edu'
      && inBackup.guardian === 'elena.vandyke@example.com'
      && inBackup.counselor === 'r.ochoa@example.edu'
      && inBackup.teacher === 'toomey@example.edu',
    inBackup.students + ' students in the file, all three addresses present');

  /* ── remove and delete are different operations ── */

  /*
    Gated on the fixture this arc drives, rather than clicking into it and hoping. Everything below
    taps a specific row and then a specific orphan by id, and clickSel THROWS when it finds nothing
    — so a defect upstream that shortened the roster would end the run here instead of reporting,
    taking the touch and overflow sections with it. That is a harness bug wearing an app defect's
    clothes, which is the whole subject of tools/README.md's CDP section. A missing fixture is one
    honest failure, and the run goes on.
  */
  const priyaId = reloadedRoster.rosterIds[26];
  /* Gated on the RENDERED rows as well as on the stored ids, because those two can disagree and
     the arc below taps rows. A roster id naming a student who is no longer in the document renders
     as nothing at all — src/roster.js calls that the harmless failure and it is — so a defect that
     destroyed a record while leaving its id on a roster leaves 27 ids and 26 rows, and a gate that
     counted only ids would wave the arc through into a row that is not there. */
  if (reloadedRoster.rosterIds.length !== 27 || reloadedRoster.rowNames.length !== 27 || !priyaId) {
    check('remove leaves the record, delete destroys it, and the confirm counts what goes',
      false, 'this arc needs the 27-name roster the checks above build; it arrived with '
        + reloadedRoster.rosterIds.length + ' ids and ' + reloadedRoster.rowNames.length
        + ' rows, so it was not driven');
  } else {
  await clickSel('#rosterList .roster-row:nth-child(27) [data-student-remove]');
  const orphaned = await evalJs('window.__ros()');
  check('a student removed from her only class lands in "Not in any class" rather than being deleted',
    orphaned.rosterIds.length === 26 && orphaned.students === reloadedRoster.students
      && orphaned.orphanHidden === false
      && orphaned.orphanControls.some(c => c.name === 'Bhatt, Priya' && c.add && c.del && !c.remove)
      && orphaned.rowControls.every(c => c.remove && !c.del),
    'on the roster ' + orphaned.rosterIds.length + ', in the year ' + orphaned.students
      + ', class-less ' + orphaned.orphanControls.length
      + ' — Delete is offered there and nowhere else');

  /* Mary, who has contacts, so the confirm has something to count. Removed first because Delete is
     only offered on a student who is in no class at all — which is the safety this design buys:
     "wrong class" is one cheap tap and "destroy a person's contacts" is a deliberate one. */
  await clickSel('#rosterList .roster-row:nth-child(1) [data-student-remove]');
  await clickSel('#rosterOrphanList [data-student-delete="' + maryId + '"]');
  const confirmText = await evalJs(`(function(){ var m = document.getElementById('studentDeleteModal');
    return { open: !!m && !m.classList.contains('hidden'),
             lead: (document.getElementById('studentDeleteLead')||{}).textContent,
             facts: (document.getElementById('studentDeleteFacts')||{}).textContent.replace(/\\s+/g,' '),
             button: (document.getElementById('studentDeleteBtn')||{}).textContent }; })()`);
  check('the delete confirm names the student and counts the contacts it would destroy',
    confirmText.open && /Mary Van Dyke/.test(confirmText.lead)
      && /cannot be undone/.test(confirmText.lead)
      && /2 contacts — guardian and counselor details/.test(confirmText.facts)
      && confirmText.button === 'Delete Mary Van Dyke',
    confirmText.facts.slice(0, 160));
  const beforeCancelStudent = await evalJs(
    '(async function(){ await window.planbook.store.flush(); return window.__ros(); })()');
  await clickSel('[data-student-delete-cancel]');
  const afterCancelStudent = await evalJs(
    '(async function(){ await window.planbook.store.flush(); return window.__ros(); })()');
  const cancelled = await evalJs('window.__student(' + JSON.stringify(maryId) + ')');
  check('cancelling it writes nothing — she and her contacts are exactly as they were',
    afterCancelStudent.students === beforeCancelStudent.students
      && afterCancelStudent.rev === beforeCancelStudent.rev
      && !!cancelled && cancelled.guardians.length === 1
      && cancelled.counselor.email === 'r.ochoa@example.edu',
    'students ' + afterCancelStudent.students + ', rev ' + beforeCancelStudent.rev + ' -> '
      + afterCancelStudent.rev + ' (nothing written, so rev cannot move)');
  /* Back onto the roster she goes, which is the repair that "Not in any class" exists for. */
  await clickSel('#rosterOrphanList [data-student-add-to-class="' + maryId + '"]');

  await clickSel('#rosterOrphanList [data-student-delete="' + priyaId + '"]');
  await clickSel('[data-student-delete-confirm]');
  await new Promise(r => setTimeout(r, 300));
  const deletedStudent = await evalJs('window.__ros()');
  check('confirming it destroys that one record and leaves every other student alone',
    deletedStudent.students === beforeCancelStudent.students - 1
      && (await evalJs('window.__student(' + JSON.stringify(priyaId) + ')')) === null
      && deletedStudent.rosterIds.length === 26
      && deletedStudent.rosterIds.indexOf(maryId) === 25,
    'students in the year ' + beforeCancelStudent.students + ' -> ' + deletedStudent.students
      + ', on the roster ' + deletedStudent.rosterIds.length);
  }

  /* The open class is put back where the classes section left it. The overflow section at the
     bottom measures the tab strip AND the term nav of whatever is open, and the class this section
     works in is the one the backup section restored — which has no terms at all, so leaving it
     open would quietly halve what that sweep measures without failing anything. */
  await closeAll();
  await clickSel('[data-class-tab]', 1);
  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
}
}
