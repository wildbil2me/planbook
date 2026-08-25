/* contacts-import.mjs — importing a class's contacts from the SIS CSV (WO-1.23)
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

export async function run(h) {
const { check, skip, send, evalJs, has, clickSel, KILL_ANIM, waitForBoot, seam } = h;

/*
  ══════════ IMPORTING A CLASS'S CONTACTS FROM THE SIS CSV (WO-1.23) ══════════

  Reloaded first, for the reason every other section that plants a fixture does: a clean DOM with
  every overlay closed, rather than whatever the section above left the page in.

  DRIVEN THROUGH THE FILE INPUT, NOT THROUGH A SEAM. A page cannot be handed a File by a script —
  but it can be handed a DataTransfer holding one, which is exactly what the Files picker delivers,
  so everything from the `change` event inward is the real path including the read, the refusals and
  the clear. The one seam this section uses is readCsvRows(), and it is used once, for the acceptance
  line about reading back what src/attendance-report.js writes: that file is eight columns of
  attendance rather than eight columns of contacts, so the importer would rightly refuse it, and a
  second CSV reader living here could agree with itself while the app's mangled every file it saw.

  THE FIXTURE IS THE WORK ORDER'S OWN SIX ROWS, character for character, including the all-empty
  spacer rows and the two surnames that differ by one trailing letter. That near-miss is not an
  artifact of anonymising: `Smith` and `Smitha` are the case a matcher gets wrong, and every
  expected value below is written out rather than computed, because a check that derived the answer
  from the same parser it is checking would agree with itself no matter what the parser did.

  WHAT IS NOT HERE AND IS OWED TO A HUMAN: the 👤 line in full — whether the input opens Files on
  iPadOS and a .csv in iCloud Drive is selectable, whether the preview scrolls and its toggles are
  thumb-hittable on glass, and whether a REAL section's export imports with the right number of
  students. The 44px half of the second of those is measured in the touch section above; the rest
  needs the device. And the browser's own "the same file fires `change` twice" behaviour cannot be
  proved by a script that dispatches the event itself — what is asserted below is the mechanism that
  makes it true, which is that the input's value is cleared after every read.
*/
console.log('\n--- importing contacts from the SIS CSV (WO-1.23) ---');
{
  await send('Page.reload');
  await new Promise((r) => setTimeout(r, 600));
  await waitForBoot();
  await evalJs(KILL_ANIM);

  const seam123 = await evalJs("!!(window.planbook && window.planbook.store"
    + " && window.planbook.classes && window.planbook.supports && window.planbook.rosterImport"
    + " && typeof window.planbook.rosterImport.readCsvRows === 'function')");
  if (!seam123) {
    check('the contact import and its window.planbook seam exist to drive a file through',
      false, 'window.planbook.rosterImport is missing — it is kept deliberately for this file to '
        + 'read through, so its absence is a defect and not a stage of the build');
    skip('the rest of WO-1.23 — the six sample rows, the mapping, the re-import, the guardian '
      + 'match, the two writing rules, the supports block, the refusals and the preview',
      'there is no seam to plant a fixture behind or read the result through');
  } else {
    /* The six rows, verbatim. `\u2019`-free and `'`-carrying, exactly as the export writes them. */
    const SIS = [
      '"Smith, Jonathan (John) \'28",SmithJo28@hwg.com,(508)123-4567 (H),"Smith, Mike",'
        + 'SmithMi28@hwg.com,Mr. Tom Smith,"(508) 234-5678 (M), (508) 345-6789 (H)",'
        + 'SmithTom@aol.edu',
      ',,,,,Mrs. Nina Smith,"(508) 456-7890 (M), (508) 567-8901 (H)",SmithNina@aol.edu',
      ',,,,,,,',
      '"Smitha, Jonathan (John) \'28",SmithaJo28@hwg.com,(508)123-4567 (H),"Smitha, Mike",'
        + 'SmithaMi28@hwg.com,Mr. Tom Smitha,"(508) 234-5678 (M), (508) 345-6789 (H)",'
        + 'SmithaTom@aol.edu',
      ',,,,,Mrs. Nina Smitha,"(508) 456-7890 (M), (508) 567-8901 (H)",SmithaNina@aol.edu',
      ',,,,,,,',
    ].join('\n') + '\n';

    const ALICE_NO_PHONE = '"Third, Alice (Ali) \'27",alice@hwg.com,,"Ochoa, Rea",rea@hwg.com,'
      + 'Mrs. Bee Third,(508) 222-3333 (M),bee@example.com\n';
    const ALICE_PHONE = ALICE_NO_PHONE.replace('alice@hwg.com,,', 'alice@hwg.com,(508) 444-5555 (H),');

    const plant123 = await evalJs(`(function(){
      var s = window.planbook.store;
      if (!s.getDoc()) return { ok:false, why:'no year document is open' };
      s.update(function(doc){
        ['a', 'b', 'c', 'd'].forEach(function(k){
          doc.classes.push({ id:'c_wo123_' + k, name:'WO-1.23 Class ' + k.toUpperCase(),
            archived:false, terms:[], categories:[], letterScale:null, roster:[] });
        });
        /* One student already in the school year and in ANOTHER class, carrying a hand-typed phone
           the file will not name and a support block the file cannot reach. She is acceptance
           lines 8, 9 and 10 in one person. */
        doc.students.push({ id:'s_wo123_alice', first:'Alice', last:'Third', nickname:'',
          gradYear:'', email:'', phone:'555-0100 (typed by hand)', phone2:'', guardians:[],
          counselor:{ name:'', email:'' }, notes:'',
          supports:{ plan:'IEP', caseManager:{ name:'Dr. Reyes', email:'reyes@example.edu' },
            reviewDate:'2027-02-11',
            accommodations:[
              { kind:'extended-time', detail:'1.5x on tests and quizzes', appliesTo:['tests','quizzes'] },
              { kind:'separate-setting', detail:'quiet room', appliesTo:[] }],
            medical:'peanut allergy - epi-pen in the nurse office',
            behaviorPlan:'check in at the door, two-minute break on request' } });
        doc.classes.filter(function(c){ return c.id === 'c_wo123_b'; })[0].roster.push('s_wo123_alice');
      });
      var d = s.getDoc();
      return { ok:true,
        classes: d.classes.filter(function(c){ return /^c_wo123_/.test(c.id); }).length,
        alice: !!d.students.filter(function(x){ return x.id === 's_wo123_alice'; })[0] };
    })()`);
    check('the WO-1.23 fixture planted cleanly — four empty classes and one student who is in '
      + 'another class, with a hand-typed phone and a full support block',
      plant123.ok === true && plant123.classes === 4 && plant123.alice === true,
      JSON.stringify(plant123));

    /* Alice's support block as it stands BEFORE any import touches her record — the thing
       acceptance line 9 compares against, lifted rather than described. */
    const aliceSupportsBefore = await evalJs(
      "JSON.stringify((window.planbook.store.getDoc().students.filter(function(s){"
      + " return s.id === 's_wo123_alice'; })[0] || {}).supports)");

    const closeAll123 = () => evalJs("(function(){ ['rosterImportModal','rosterPasteModal',"
      + "'studentDeleteModal','studentModal','rosterModal','teacherModal','classesModal',"
      + "'backupModal','yearModal','aboutModal'].forEach(function(m){"
      + " window.planbook.closeModal(m); }); return 1; })()");

    /* The real path in: pick the class, open the roster panel from the header, open the import
       from the panel's own second button. */
    const openImportOn = async (classId) => {
      await closeAll123();
      await evalJs('window.planbook.classes.selectClass(' + JSON.stringify(classId) + ');1');
      await clickSel('header [data-roster-manage]');
      await new Promise((r) => setTimeout(r, 200));
      await clickSel('#rosterModal [data-roster-import]');
      await new Promise((r) => setTimeout(r, 150));
    };

    /*
      One file, through the input. The panel is blanked first and then WAITED ON rather than slept
      after: a fixed sleep before a measurement is a race that hides defects (tools/README.md, trap
      5), and blanking is what makes "the preview came back" an observable rather than a reading of
      whatever the previous feed left on screen.
    */
    const feed = (text, name) => evalJs(`(async function(){
      var input = document.getElementById('rosterImportFile');
      var list = document.getElementById('rosterImportList');
      var review = document.getElementById('rosterImportReview');
      var err = document.getElementById('rosterImportError');
      list.textContent = '';
      review.classList.add('hidden');
      err.textContent = '';
      var d = new DataTransfer();
      d.items.add(new File([${JSON.stringify(text)}], ${JSON.stringify(name || 'contacts.csv')},
        { type:'text/csv' }));
      input.files = d.files;
      input.dispatchEvent(new Event('change', { bubbles:true }));
      for (var i = 0; i < 120; i++) {
        var drawn = !review.classList.contains('hidden')
          && list.querySelectorAll('.paste-row').length > 0;
        var refused = review.classList.contains('hidden') && err.textContent;
        if (drawn || refused) break;
        await new Promise(function(r){ setTimeout(r, 25); });
      }
      await new Promise(function(r){ setTimeout(r, 40); });
      var rows = Array.prototype.slice.call(list.querySelectorAll('.paste-row'));
      var btn = document.getElementById('rosterImportCommitBtn') || {};
      return {
        rows: rows.length,
        pairs: rows.map(function(r){ var f = r.querySelectorAll('.paste-input');
          return [f[0] ? f[0].value : null, f[1] ? f[1].value : null]; }),
        meta: rows.map(function(r){ return (r.querySelector('.import-meta')||{}).textContent; }),
        notes: rows.map(function(r){ return (r.querySelector('.paste-row-note')||{}).textContent; }),
        summaries: rows.map(function(r){ return (r.querySelector('.import-summary')||{}).textContent; }),
        contacts: rows.map(function(r){
          return Array.prototype.map.call(r.querySelectorAll('.import-contact-line'),
            function(l){ return l.textContent; }); }),
        include: rows.map(function(r){ var t = r.querySelector('[data-import-include]');
          return t ? t.getAttribute('aria-pressed') === 'true' : null; }),
        labels: rows.map(function(r){ var t = r.querySelector('[data-import-include]');
          return t ? t.textContent : ''; }),
        injected: list.querySelectorAll('b, i, script').length,
        count: (document.getElementById('rosterImportCount')||{}).textContent,
        error: err.textContent,
        errorShown: !err.classList.contains('hidden'),
        reviewShown: !review.classList.contains('hidden'),
        commit: btn.textContent || '', commitDisabled: !!btn.disabled,
        cleared: input.value === ''
      }; })()`);

    /* Flushed before every read of `rev`, for tools/README.md trap 6's reason: the store debounces,
       so a rev read before the write lands is a rev from before the edit. */
    const snap = () => evalJs(`(async function(){
      await window.planbook.store.flush();
      var d = window.planbook.store.getDoc();
      return { rev: d.rev, students: d.students.length,
        rosters: d.classes.map(function(c){ return c.id + ':' + (c.roster || []).join('|'); }) };
    })()`);

    const studentBy = (last, first) => evalJs(`(function(){
      var d = window.planbook.store.getDoc();
      var s = d.students.filter(function(x){
        return x.last === ${JSON.stringify(last)} && x.first === ${JSON.stringify(first)}; })[0];
      return s ? JSON.parse(JSON.stringify(s)) : null; })()`);

    /* ── acceptance 1–5, 9b: the six rows into an empty class ── */

    const before123 = await snap();
    await openImportOn('c_wo123_a');
    const read = await feed(SIS, 'Period 1 contacts.csv');
    check('the six sample rows preview as exactly TWO students — the all-empty row adds nobody, '
      + 'the two continuation rows are guardians rather than people, and the two surnames that '
      + 'differ by one letter stay two people',
      read.rows === 2
        && JSON.stringify(read.pairs) === JSON.stringify([['Smith', 'Jonathan'],
          ['Smitha', 'Jonathan']])
        && read.count === '2 new students — out of 2 students in the file.'
        && read.commit === 'Import 2 students' && read.commitDisabled === false
        && read.injected === 0,
      read.rows + ' row(s): ' + JSON.stringify(read.pairs) + ' · ' + JSON.stringify(read.count));
    check('and the preview shows the nickname, the grad year and every contact the file carries, '
      + 'before anything is written',
      /John/.test(read.meta[0]) && /2028/.test(read.meta[0])
        && read.contacts[0].length === 4
        && read.contacts[0][0] === 'SmithJo28@hwg.com · (508)123-4567 (H)'
        && read.contacts[0][1] === 'Counselor: Mike Smith · SmithMi28@hwg.com'
        && read.contacts[0][2] === 'Mr. Tom Smith · (508) 234-5678 (M) · (508) 345-6789 (H) · '
          + 'SmithTom@aol.edu'
        && read.contacts[0][3] === 'Mrs. Nina Smith · (508) 456-7890 (M) · (508) 567-8901 (H) · '
          + 'SmithNina@aol.edu'
        && /adds 2 guardians/.test(read.summaries[0]),
      JSON.stringify(read.meta[0]) + ' :: ' + JSON.stringify(read.contacts[0])
        + ' :: ' + JSON.stringify(read.summaries[0]));

    await clickSel('[data-roster-import-commit]');
    await new Promise((r) => setTimeout(r, 250));
    const after123 = await snap();
    const smith = await studentBy('Smith', 'Jonathan');
    const smitha = await studentBy('Smitha', 'Jonathan');
    check('committing produces exactly two students and no third',
      after123.students === before123.students + 2 && !!smith && !!smitha
        && smith.id !== smitha.id,
      'students in the year ' + before123.students + ' -> ' + after123.students);
    check('"Smith, Jonathan (John) \'28" lands as first Jonathan, last Smith, nickname John, '
      + 'gradYear "2028" (a string), email SmithJo28@hwg.com, phone "(508)123-4567 (H)" — the '
      + 'marker included',
      !!smith && smith.first === 'Jonathan' && smith.last === 'Smith' && smith.nickname === 'John'
        && smith.gradYear === '2028' && typeof smith.gradYear === 'string'
        && smith.email === 'SmithJo28@hwg.com' && smith.phone === '(508)123-4567 (H)'
        && smith.phone2 === '',
      JSON.stringify(smith && { first: smith.first, last: smith.last, nickname: smith.nickname,
        gradYear: smith.gradYear, email: smith.email, phone: smith.phone, phone2: smith.phone2 }));
    check('the advisor lands on the counselor with the name FLIPPED — "Mike Smith", not '
      + '"Smith, Mike" — and the advisor email beside it',
      !!smith && smith.counselor.name === 'Mike Smith'
        && smith.counselor.email === 'SmithMi28@hwg.com',
      JSON.stringify(smith && smith.counselor));
    check('both guardians are there, in file order, with the second phone number in phone2, every '
      + '(M)/(H) marker verbatim, and every relation left EMPTY',
      !!smith && smith.guardians.length === 2
        && JSON.stringify(smith.guardians.map((g) => [g.name, g.phone, g.phone2, g.email,
          g.relation]))
          === JSON.stringify([
            ['Mr. Tom Smith', '(508) 234-5678 (M)', '(508) 345-6789 (H)', 'SmithTom@aol.edu', ''],
            ['Mrs. Nina Smith', '(508) 456-7890 (M)', '(508) 567-8901 (H)', 'SmithNina@aol.edu', '']]),
      JSON.stringify(smith && smith.guardians));
    check('the first imported guardian is the one to contact first, and only she is',
      !!smith && smith.guardians[0].preferred === true && smith.guardians[1].preferred === false,
      JSON.stringify(smith && smith.guardians.map((g) => g.preferred)));
    const rosterA = after123.rosters.filter((r) => r.indexOf('c_wo123_a:') === 0)[0] || '';
    const otherRostersMoved = after123.rosters.filter((r, i) =>
      r.indexOf('c_wo123_a:') !== 0 && r !== before123.rosters[i]);
    check('both students are on the open class\'s roster and in doc.students, and no other '
      + 'class\'s roster changed',
      !!smith && !!smitha
        && rosterA === 'c_wo123_a:' + smith.id + '|' + smitha.id
        && otherRostersMoved.length === 0,
      JSON.stringify(rosterA) + ' :: rosters that moved elsewhere = '
        + JSON.stringify(otherRostersMoved));
    const freshSupports = await evalJs(
      'JSON.stringify(window.planbook.supports.newSupports())');
    check('a student the import CREATES gets newSupports()\'s defaults and nothing else — there is '
      + 'no path from any of the eight columns to a support field',
      !!smith && !!smitha && JSON.stringify(smith.supports) === freshSupports
        && JSON.stringify(smitha.supports) === freshSupports,
      'newSupports() = ' + freshSupports + ' :: imported = ' + JSON.stringify(smith && smith.supports));

    /* ── acceptance 6: the same file again ── */

    const beforeAgain = await snap();
    await openImportOn('c_wo123_a');
    const again123 = await feed(SIS, 'Period 1 contacts.csv');
    check('re-reading the same file says both students are already in this class and that there '
      + 'is nothing to write',
      again123.rows === 2
        && again123.notes.every((n) => /Already in this class/.test(n))
        && again123.summaries.every((s) => s === 'already up to date')
        && again123.count === '0 new students · 2 students already in this class, updated — out '
          + 'of 2 students in the file.',
      JSON.stringify(again123.count) + ' :: ' + JSON.stringify(again123.summaries));
    await clickSel('[data-roster-import-commit]');
    await new Promise((r) => setTimeout(r, 250));
    const afterAgain = await snap();
    const smithAgain = await studentBy('Smith', 'Jonathan');
    check('and importing it a second time changes NOTHING: two students, two guardians each, no '
      + 'duplicate card, preferred still where it was, and `rev` has not moved',
      afterAgain.students === beforeAgain.students && afterAgain.rev === beforeAgain.rev
        && JSON.stringify(afterAgain.rosters) === JSON.stringify(beforeAgain.rosters)
        && !!smithAgain && smithAgain.guardians.length === 2
        && smithAgain.guardians[0].preferred === true
        && smithAgain.guardians[1].preferred === false,
      'students ' + beforeAgain.students + ' -> ' + afterAgain.students + ', rev '
        + beforeAgain.rev + ' -> ' + afterAgain.rev + ', guardians = '
        + (smithAgain ? smithAgain.guardians.length : 'no record'));

    /* ── acceptance 7: a guardian matched on name, then on email ── */

    await openImportOn('c_wo123_a');
    await feed(SIS.replace('SmithTom@aol.edu', 'TomSmith@newmail.com'), 'Period 1 contacts.csv');
    await clickSel('[data-roster-import-commit]');
    await new Promise((r) => setTimeout(r, 250));
    const emailMoved = await studentBy('Smith', 'Jonathan');
    check('a file whose parent email has changed updates THAT guardian in place rather than adding '
      + 'a third — matched on the name where the email is not the same',
      !!emailMoved && emailMoved.guardians.length === 2
        && emailMoved.guardians[0].name === 'Mr. Tom Smith'
        && emailMoved.guardians[0].email === 'TomSmith@newmail.com'
        && emailMoved.guardians[1].email === 'SmithNina@aol.edu',
      JSON.stringify(emailMoved && emailMoved.guardians.map((g) => [g.name, g.email])));

    await openImportOn('c_wo123_a');
    await feed(SIS.replace('SmithTom@aol.edu', 'TomSmith@newmail.com')
      .replace('Mr. Tom Smith', 'Mr. Thomas Smith'), 'Period 1 contacts.csv');
    await clickSel('[data-roster-import-commit]');
    await new Promise((r) => setTimeout(r, 250));
    const nameMoved = await studentBy('Smith', 'Jonathan');
    check('and a file whose parent NAME has changed updates that guardian in place too — matched '
      + 'on the email where the email is the same',
      !!nameMoved && nameMoved.guardians.length === 2
        && nameMoved.guardians[0].name === 'Mr. Thomas Smith'
        && nameMoved.guardians[0].email === 'TomSmith@newmail.com'
        && nameMoved.guardians[0].preferred === true,
      JSON.stringify(nameMoved && nameMoved.guardians.map((g) => [g.name, g.email])));

    /* ── acceptance 8, 9, 10: the student who is already in the year, in another class ── */

    const beforeAlice = await snap();
    await openImportOn('c_wo123_a');
    const aliceRead = await feed(ALICE_NO_PHONE, 'Period 1 contacts.csv');
    check('a student already in this school year and in another class previews as a LINK rather '
      + 'than as a new student',
      aliceRead.rows === 1 && /Already in this school year/.test(aliceRead.notes[0])
        && aliceRead.count === '0 new students · 1 student already in this school year, added to '
          + 'WO-1.23 Class A — out of 1 student in the file.',
      JSON.stringify(aliceRead.count) + ' :: ' + JSON.stringify(aliceRead.notes[0]));
    await clickSel('[data-roster-import-commit]');
    await new Promise((r) => setTimeout(r, 250));
    const afterAlice = await snap();
    const alice1 = await studentBy('Third', 'Alice');
    check('she is LINKED into the open class rather than copied: doc.students gains no record, and '
      + 'the contacts land on the one record both classes see',
      afterAlice.students === beforeAlice.students
        && !!alice1 && alice1.id === 's_wo123_alice'
        && afterAlice.rosters.some((r) => r.indexOf('c_wo123_a:') === 0
          && r.indexOf('s_wo123_alice') >= 0)
        && afterAlice.rosters.some((r) => r === 'c_wo123_b:s_wo123_alice')
        && alice1.email === 'alice@hwg.com' && alice1.nickname === 'Ali'
        && alice1.gradYear === '2027' && alice1.counselor.name === 'Rea Ochoa',
      'students ' + beforeAlice.students + ' -> ' + afterAlice.students + ' :: '
        + JSON.stringify(afterAlice.rosters.filter((r) => /^c_wo123_[ab]:/.test(r))));
    check('an EMPTY cell never clears anything: the phone she was given by hand is still there '
      + 'after an import whose phone column is empty',
      !!alice1 && alice1.phone === '555-0100 (typed by hand)',
      JSON.stringify(alice1 && alice1.phone));

    await openImportOn('c_wo123_a');
    await feed(ALICE_PHONE, 'Period 1 contacts.csv');
    await clickSel('[data-roster-import-commit]');
    await new Promise((r) => setTimeout(r, 250));
    const alice2 = await studentBy('Third', 'Alice');
    check('and a NON-EMPTY imported value wins: the same student with a different phone in the '
      + 'file gets the file\'s',
      !!alice2 && alice2.phone === '(508) 444-5555 (H)',
      JSON.stringify(alice2 && alice2.phone));
    check('IMPORTING OVER A STUDENT WITH AN IEP, TWO ACCOMMODATIONS, MEDICAL TEXT, A BEHAVIOUR '
      + 'PLAN AND A CASE MANAGER LEAVES THAT SUPPORT BLOCK IDENTICAL, FIELD FOR FIELD — twice '
      + 'over, across two imports that both wrote to her record',
      !!alice2 && JSON.stringify(alice2.supports) === aliceSupportsBefore,
      'before = ' + aliceSupportsBefore + '\n      after  = '
        + JSON.stringify(alice2 && alice2.supports));

    /* ── acceptance 11: the header row ── */

    await openImportOn('c_wo123_c');
    const headed = await feed('Student Name,Student Email,Student Phone,Advisor,Advisor Email,'
      + 'Parents,Parent Phone,Parent Email\n' + SIS, 'Period 1 with header.csv');
    check('a file with a "Student Name,Student Email,…" header row imports the same two students, '
      + 'and the heading is not one of them',
      headed.rows === 2
        && JSON.stringify(headed.pairs) === JSON.stringify([['Smith', 'Jonathan'],
          ['Smitha', 'Jonathan']]),
      headed.rows + ' row(s): ' + JSON.stringify(headed.pairs));
    await clickSel('[data-roster-import-commit]');
    await new Promise((r) => setTimeout(r, 250));
    const afterHeader = await snap();
    check('and committing it links those two into the second class without creating a third '
      + 'record — the sample file, which has no header, imported its first student rather than '
      + 'swallowing it',
      afterHeader.students === afterAlice.students
        && afterHeader.rosters.some((r) => r === 'c_wo123_c:' + smith.id + '|' + smitha.id),
      'students = ' + afterHeader.students + ' :: '
        + JSON.stringify(afterHeader.rosters.filter((r) => /^c_wo123_c:/.test(r))));

    /* ── acceptance 12: what this app's own writer produces, read back ── */

    const roundTrip = await evalJs(`(function(){
      /* A record built here rather than taken off the open class: what is being asserted is the
         READER against the WRITER's conventions — the BOM, the CRLF, a cell holding a comma and a
         cell holding a doubled quote — and a record with those characters in it is one this run's
         document does not happen to contain. */
      var f = window.planbook.attendanceReport.recordCsv({
        className: 'Period 2, Honors', termLabel: 'Q1', dates: ['2026-09-09'],
        students: [{ last: 'Sm"ith', first: 'Jo, nathan',
          totals: { meetings: 1, percent: null }, marks: { '2026-09-09': 'T' } }] });
      var rows = window.planbook.rosterImport.readCsvRows(f.text);
      return { bom: f.text.charCodeAt(0) === 0xFEFF, crlf: f.text.indexOf('\\r\\n') > 0,
        firstCell: rows[0] ? rows[0][0] : null,
        lastCellOfFirstRow: rows[0] ? rows[0][rows[0].length - 1] : null,
        secondRow: rows[1] || null,
        anyStrayCr: rows.some(function(r){ return r.some(function(c){
          return String(c).indexOf('\\r') >= 0; }); }),
        rows: rows.length }; })()`);
    check('a CSV written by recordCsv() — BOM, CRLF, a quoted cell holding a comma, a doubled '
      + 'quote — reads back with an unmangled first cell, no stray \\r, and each quoted cell whole',
      roundTrip.bom === true && roundTrip.crlf === true
        && roundTrip.firstCell === 'Last Name'
        && roundTrip.anyStrayCr === false
        && !!roundTrip.secondRow && roundTrip.secondRow[0] === 'Sm"ith'
        && roundTrip.secondRow[1] === 'Jo, nathan'
        && roundTrip.rows === 2,
      JSON.stringify(roundTrip));

    /* ── acceptance 13: three numbers in one cell ── */

    await openImportOn('c_wo123_d');
    await feed('"Triple, Tina \'29",tina@hwg.com,,,,Ms. Trip Triple,'
      + '"(508) 111-1111 (M), (508) 222-2222 (H), (508) 333-3333 (W)",trip@example.com\n',
      'Triple.csv');
    await clickSel('[data-roster-import-commit]');
    await new Promise((r) => setTimeout(r, 250));
    const tina = await studentBy('Triple', 'Tina');
    check('a parent phone cell holding THREE numbers keeps all three — two in phone and phone2, '
      + 'the third appended to phone2 rather than dropped',
      !!tina && tina.guardians.length === 1
        && tina.guardians[0].phone === '(508) 111-1111 (M)'
        && tina.guardians[0].phone2 === '(508) 222-2222 (H), (508) 333-3333 (W)',
      JSON.stringify(tina && tina.guardians[0]));

    /* ── acceptance 14: the three refusals, none of which may write ── */

    const beforeRefusals = await snap();
    await openImportOn('c_wo123_d');
    const orphan = await feed(',,,,,Mrs. Lost Parent,(508) 000-0000 (M),lost@example.com\n' + SIS,
      'Opens on a guardian.csv');
    const badFile = await feed('{"schemaVersion":1,"year":"2026-2027","students":[]}',
      'Planbook backup.json');
    const emptyFile = await feed('   \n\n', 'Empty.csv');
    const shortRow = await feed('"Short, Sam \'28",sam@hwg.com,,\n', 'Short.csv');
    const afterRefusals = await snap();
    check('a continuation row before any student row is reported as skipped and says why, and the '
      + 'students under it still import',
      orphan.rows === 2 && orphan.errorShown === true
        && /Row 1/.test(orphan.error) && /nobody to attach it to/.test(orphan.error),
      orphan.rows + ' row(s) previewed :: ' + JSON.stringify(orphan.error));
    check('a file that is not a contact CSV, an empty file, and a row with fewer columns than the '
      + 'export has are each refused with a sentence on the dialog\'s own error line, and none of '
      + 'them draws a preview',
      badFile.reviewShown === false && /backup/.test(badFile.error)
        && emptyFile.reviewShown === false && /empty/.test(emptyFile.error)
        && shortRow.reviewShown === false && /column/.test(shortRow.error)
        && /Nothing has been imported/.test(shortRow.error),
      [badFile.error, emptyFile.error, shortRow.error].map((e) => JSON.stringify(e)).join('\n      '));
    check('and every one of those refusals left the document exactly where it was — same `rev`, '
      + 'same students, same rosters; there is no partial import',
      afterRefusals.rev === beforeRefusals.rev
        && afterRefusals.students === beforeRefusals.students
        && JSON.stringify(afterRefusals.rosters) === JSON.stringify(beforeRefusals.rosters),
      'rev ' + beforeRefusals.rev + ' -> ' + afterRefusals.rev + ', students '
        + beforeRefusals.students + ' -> ' + afterRefusals.students);
    check('and the input is cleared after every read, refusals included — which is what makes '
      + 'choosing the same file twice fire `change` a second time after a fix in the spreadsheet',
      orphan.cleared && badFile.cleared && emptyFile.cleared && shortRow.cleared,
      JSON.stringify({ orphan: orphan.cleared, notCsv: badFile.cleared,
        empty: emptyFile.cleared, shortRow: shortRow.cleared }));

    /* ── acceptance 15 and 16: the preview is where a wrong split is caught ── */

    const TWO_NEW = '"Alpha, Ann \'28",ann@hwg.com,,,,Mr. Al Alpha,(508) 121-2121 (M),al@example.com\n'
      + '"Beta, Bob \'28",bob@hwg.com,,,,Mrs. Bea Beta,(508) 343-4343 (M),bea@example.com\n';
    const beforeEdit = await snap();
    await openImportOn('c_wo123_d');
    const twice1 = await feed(TWO_NEW, 'Two new.csv');
    await clickSel('#rosterImportList [data-import-include="0"]');
    const toggled = await evalJs(`(function(){
      var t = document.querySelector('#rosterImportList [data-import-include="0"]');
      return { label: t.textContent, pressed: t.getAttribute('aria-pressed'),
        count: (document.getElementById('rosterImportCount')||{}).textContent,
        commit: (document.getElementById('rosterImportCommitBtn')||{}).textContent }; })()`);
    const twice2 = await feed(TWO_NEW, 'Two new.csv');
    check('choosing the SAME file again re-reads it and rebuilds the preview from the file rather '
      + 'than from what was left on screen — the row skipped a moment ago is back to Import',
      twice1.rows === 2 && toggled.label === 'Skip' && toggled.pressed === 'false'
        && twice2.rows === 2 && twice2.include.every((v) => v === true)
        && twice2.labels.every((l) => l === 'Import')
        && twice1.cleared && twice2.cleared,
      'first read ' + twice1.rows + ' row(s), toggled to ' + JSON.stringify(toggled.label)
        + ', second read ' + twice2.rows + ' row(s) with include = '
        + JSON.stringify(twice2.include));

    await evalJs(`(function(){
      var row = document.querySelectorAll('#rosterImportList .paste-row')[0];
      var f = row.querySelectorAll('.paste-input');
      f[0].value = 'Alphabet';
      f[0].dispatchEvent(new Event('input', { bubbles: true }));
      return 1; })()`);
    await clickSel('#rosterImportList [data-import-include="1"]');
    const edited = await evalJs(`(function(){
      var btn = document.getElementById('rosterImportCommitBtn');
      return { commit: btn.textContent, disabled: !!btn.disabled,
        count: (document.getElementById('rosterImportCount')||{}).textContent }; })()`);
    await clickSel('[data-roster-import-commit]');
    await new Promise((r) => setTimeout(r, 250));
    const afterEdit = await snap();
    const alphabet = await studentBy('Alphabet', 'Ann');
    const beta = await studentBy('Beta', 'Bob');
    check('the name fields are editable and the EDIT is what gets committed, and a row toggled off '
      + 'writes nothing at all',
      edited.commit === 'Import 1 student' && edited.disabled === false
        && afterEdit.students === beforeEdit.students + 1
        && !!alphabet && alphabet.email === 'ann@hwg.com'
        && alphabet.guardians.length === 1
        && beta === null,
      'commit read ' + JSON.stringify(edited.commit) + '; students '
        + beforeEdit.students + ' -> ' + afterEdit.students + '; the edited row is '
        + JSON.stringify(alphabet && [alphabet.last, alphabet.first])
        + ' and the skipped row is ' + JSON.stringify(beta));

    /* ── acceptance 17: the editor shows and saves what the importer writes ── */

    await closeAll123();
    await evalJs("window.planbook.classes.selectClass('c_wo123_a');1");
    await clickSel('header [data-roster-manage]');
    await new Promise((r) => setTimeout(r, 200));
    await clickSel('#rosterList .roster-row:nth-child(1) [data-student-edit]');
    await new Promise((r) => setTimeout(r, 200));
    const shown = await evalJs(`(function(){
      var g = document.querySelector('#guardianList .guardian-card');
      function val(sel, root){ var e = (root || document).querySelector(sel); return e ? e.value : null; }
      return {
        phone: val('#studentPhone'), phone2: val('#studentPhone2'),
        guardianPhone: val('[data-student-field="guardian.phone"]', g),
        guardianPhone2: val('[data-student-field="guardian.phone2"]', g)
      }; })()`);
    await evalJs(`(function(){
      function set(sel, v){ var e = document.querySelector(sel); e.value = v;
        e.dispatchEvent(new Event('input', { bubbles: true })); }
      set('#studentPhone2', '(508) 999-8888 (W)');
      set('#guardianList .guardian-card [data-student-field="guardian.phone2"]',
        '(508) 777-6666 (W)');
      return 1; })()`);
    await new Promise((r) => setTimeout(r, 200));
    const typed = await studentBy('Smith', 'Jonathan');
    check('the student editor shows the imported phone numbers and saves both of them, and the '
      + 'guardian card shows and saves the second one — a field the importer can write and the '
      + 'editor cannot show is a field the teacher cannot correct',
      shown.phone === '(508)123-4567 (H)' && shown.phone2 === ''
        && shown.guardianPhone === '(508) 234-5678 (M)'
        && shown.guardianPhone2 === '(508) 345-6789 (H)'
        && !!typed && typed.phone2 === '(508) 999-8888 (W)'
        && typed.guardians[0].phone2 === '(508) 777-6666 (W)',
      'as opened: ' + JSON.stringify(shown) + ' :: after typing: '
        + JSON.stringify(typed && [typed.phone2, typed.guardians[0].phone2]));

    await closeAll123();
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  }
}
}
