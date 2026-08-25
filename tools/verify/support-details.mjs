/* support-details.mjs — support details, and presentation mode (WO-1.9)
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

import { INSTALL_CLASS_READER } from './classes-terms.mjs';
import { INSTALL_ROSTER_READER } from './roster-contacts.mjs';

export async function run(h) {
const { check, skip, readLocalStore, oursIn, foreignIn, storeDetail, send, evalJs, has, clickSel,
  KILL_ANIM, INSTALL_WALKER, dateResetOn, waitForBoot, seam } = h;

/* ───────────────── support details ─────────────────
 *
 * WO-1.8's five acceptance lines, driven through the real controls the way the section above
 * drives the roster's. Two of them are unlike anything else in this file, and both are unlike it
 * in the same way: they are claims about what is NOT on the screen.
 *
 * That shape is where a vacuous pass hides. "The roster does not show the word IEP" is true of a
 * roster with no students on it, of a roster that failed to render, and of a build where the
 * feature was never wired up — so every absence check below is paired with the presence check that
 * proves the fixture was really there: the same string, in the same document, read back out after
 * a reload. An absence with nothing behind it is not evidence.
 *
 * The third is the dot. A dot that encoded the plan type would still be one dot per student and
 * would still pass any check that counted them, so the dots are compared to EACH OTHER — computed
 * colour, radius, border, size, glyph and label, across three students with three different things
 * on file. That is the only form of this check that can fail.
 */

console.log('\n--- support details ---');

const supportSeam = await evalJs("!!(window.planbook && window.planbook.supports"
  + " && typeof window.planbook.supports.supportsVisible === 'function'"
  + " && typeof window.planbook.roster === 'object')");

if (!supportSeam) {
  skip('support details: the block round-trips, the roster stays quiet, and the dot says nothing',
    'no window.planbook.supports seam on the page — it is kept deliberately for this file to read through, so its absence is a defect and not a stage of the build; see the window.planbook block at the foot of src/shell.js');
} else {
  /* Three page-side readers, re-installed after every reload like the walker: the document's own
     copy of a support block, everything the editor panel is showing, and every dot on the roster
     with the computed style a projector would actually paint. */
  const INSTALL_SUPPORT_READER = `(function(){
    window.__sup = function(id){
      var doc = window.planbook.store.getDoc();
      var s = doc.students.filter(function(x){ return x.id === id; })[0];
      if (!s) return null;
      return { keys: Object.keys(s).sort(),
               supports: s.supports ? JSON.parse(JSON.stringify(s.supports)) : null,
               dot: window.planbook.supports.hasSupports(s) };
    };
    window.__panel = function(){
      var body = document.getElementById('supportsBody');
      var btn = document.getElementById('supportsRevealBtn');
      function val(id){ var e = document.getElementById(id); return e ? e.value : null; }
      function all(sel){ return Array.prototype.map.call(
        document.querySelectorAll('#accommodationList ' + sel), function(e){ return e.value; }); }
      var pressed = document.querySelectorAll('#supportsPlanRow [aria-pressed="true"]');
      return {
        hidden: !!body && body.classList.contains('hidden'),
        expanded: btn ? btn.getAttribute('aria-expanded') : null,
        label: btn ? btn.textContent.replace(/\\s+/g, ' ').trim() : null,
        plan: Array.prototype.map.call(pressed, function(b){
          return b.getAttribute('data-support-plan'); }),
        caseName: val('supportsCaseManagerName'), caseEmail: val('supportsCaseManagerEmail'),
        reviewDate: val('supportsReviewDate'),
        medical: val('supportsMedical'), behaviorPlan: val('supportsBehaviorPlan'),
        cards: document.querySelectorAll('#accommodationList .accommodation-card').length,
        kinds: all('[data-support-kind]'),
        details: all('[data-student-field="accommodation.detail"]'),
        applies: all('[data-student-field="accommodation.appliesTo"]'),
        /* The whole dialog as a reader would hear it, so an absence claim covers rendered text and
           not only the fields this reader happens to name. */
        text: (document.getElementById('studentModal') || { textContent: '' })
          .textContent.replace(/\\s+/g, ' ')
      };
    };
    window.__dots = function(){
      var out = [];
      Array.prototype.forEach.call(document.querySelectorAll('#rosterList [data-supports-open]'),
        function(d){
          var cs = getComputedStyle(d), box = d.getBoundingClientRect();
          out.push({ id: d.getAttribute('data-supports-open'),
                     text: d.textContent, cls: d.className,
                     label: d.getAttribute('aria-label'), title: d.getAttribute('title'),
                     look: [cs.backgroundColor, cs.color, cs.borderTopColor, cs.borderTopWidth,
                            cs.borderTopLeftRadius, cs.fontSize,
                            Math.round(box.width) + 'x' + Math.round(box.height)].join(' | ') });
        });
      return out;
    };
    window.__rosterText = function(){
      var m = document.getElementById('rosterModal');
      return { rows: document.querySelectorAll('#rosterList .roster-row').length,
               dots: document.querySelectorAll('#rosterList [data-supports-open]').length,
               text: (m ? m.textContent : '').replace(/\\s+/g, ' ') };
    };
    return 1; })()`;
  await evalJs(INSTALL_SUPPORT_READER);

  const closeAllSupport = () => evalJs("(function(){ ['studentDeleteModal','studentModal',"
    + "'rosterPasteModal','rosterModal','teacherModal','classesModal','backupModal','yearModal',"
    + "'aboutModal'].forEach(function(m){ window.planbook.closeModal(m); }); return 1; })()");
  /* Found rather than assumed, exactly as the touch section does it: the section above leaves the
     open class wherever its last check left it, and an empty roster would make every absence check
     below true for the wrong reason. */
  const openFullestRoster = async () => {
    await closeAllSupport();
    const fullest = await evalJs(`(function(){
      var doc = window.planbook.store.getDoc();
      var tabs = Array.prototype.slice.call(
        document.querySelectorAll('#classTabBar [data-class-tab]'));
      var best = -1, n = -1;
      tabs.forEach(function(t, i){
        var c = doc.classes.filter(function(x){
          return x.id === t.getAttribute('data-class-tab'); })[0];
        var len = c && c.roster ? c.roster.length : 0;
        if (len > n) { n = len; best = i; }
      });
      return { tab: best, students: n }; })()`);
    if (fullest.tab >= 0) await clickSel('[data-class-tab]', fullest.tab);
    await clickSel('header [data-roster-manage]');
    return fullest;
  };
  const typeField = (id, text) => evalJs('(function(){ var e = document.getElementById('
    + JSON.stringify(id) + '); if (!e) return 0; e.value = ' + JSON.stringify(text)
    + '; e.dispatchEvent(new Event("input", { bubbles: true })); return 1; })()');

  /*
    The fixture. Three students with three different things on file, because acceptance line 3 is
    about the dots DIFFERING and one student cannot differ from anybody. Every value is a phrase
    that appears nowhere else in the app, so searching a screen for it cannot match furniture:
    "Peanut" is not a word in any copy in this repo, and neither is "Ramirez" or "1.5x on tests".
  */
  const CASE_NAME = 'K. Ramirez';
  const CASE_EMAIL = 'k.ramirez@example.edu';
  const REVIEW_DATE = '2027-02-11';
  const DETAIL_ONE = '1.5x on tests and quizzes';
  const DETAIL_TWO = 'Noise-cancelling headphones';
  const MEDICAL = 'Peanut allergy, EpiPen in the office';
  const BEHAVIOR = 'Check in at the door, two-minute break on request';
  const MEDICAL_TWO = 'Type 1 diabetes, tests before lunch';
  /*
    Two needle lists, and the difference between them is the whole reason this is not one.

    A STUDENT'S support data is every phrase above plus the rendered name of an accommodation kind.
    None of it may appear on a list view, in the editor before the panel is opened, or in
    localStorage — searched case-sensitively, so a surname like "Ellen" cannot be mistaken for the
    plan value "ELL".

    The plan words themselves — IEP, 504, ELL — are on the LIST-VIEW needle list only. Inside the
    editor they are the four buttons that name the options, present in the markup whether or not
    any of them is chosen, and a check that called that furniture a leak would be a check that can
    only pass by deleting the picker. What proves the student's plan is not on screen there is that
    none of those four reads as pressed, which the panel reader above reports.
  */
  const VALUE_NEEDLES = [CASE_NAME, CASE_EMAIL, REVIEW_DATE, DETAIL_ONE, DETAIL_TWO, MEDICAL,
    BEHAVIOR, MEDICAL_TWO, 'Extended time', 'extended-time', 'Something else'];
  const PLAN_NEEDLES = ['IEP', '504', 'ELL'];
  const NEEDLES = [...VALUE_NEEDLES, ...PLAN_NEEDLES];
  const foundIn = (text) => NEEDLES.filter(n => text.indexOf(n) >= 0);
  const foundValueIn = (text) => VALUE_NEEDLES.filter(n => text.indexOf(n) >= 0);
  /*
    A third matcher, for a JSON dump of localStorage only — where the plan words need a word
    boundary and everywhere else they must not have one.

    '504' is three digits and every epoch-millisecond stamp we write is thirteen of them.
    `planbook_lastBackupAt` held {"2026-2027":1786195504308,…} on 2026-08-08 and turned the storage
    check red about the clock, on the one check whose subject is accommodation data reaching
    storage. A control that goes red for a reason the reader learns to dismiss is worse than no
    control, because the dismissal is what survives.

    The boundary cannot hide a real leak here: anything written to localStorage arrives in this
    string as JSON, where a plan value is delimited — "504", "plan":"504", "has a 504 plan". It is
    NOT applied to `foundIn`, which reads DOM text: innerText runs adjacent nodes together, so a
    real leak can land as "504Smith" with no boundary at all, and a boundary there would be a way
    to miss one. Substring on screen, boundary in the store.
  */
  const foundInStore = (text) => [
    ...foundValueIn(text),
    ...PLAN_NEEDLES.filter(n => new RegExp(`\\b${n}\\b`).test(text)),
  ];

  const before = await openFullestRoster();
  const ids = await evalJs("(function(){ var doc = window.planbook.store.getDoc();"
    + " var open = window.planbook.classes.getSelectedClassId();"
    + " var c = doc.classes.filter(function(x){ return x.id === open; })[0];"
    + " return (c && c.roster ? c.roster : []).slice(0, 3); })()");

  if (!ids || ids.length < 3) {
    check('support details: a roster with three students to put support details on',
      false, 'the open class arrived with ' + (ids ? ids.length : 0)
        + ' students, so nothing below was driven');
    /* Announced rather than silently absent. WO-1.9's checks are driven against the fixture this
       section builds, so a fixture that never arrived takes them with it — and a suite that
       quietly shrinks still prints green (tools/README.md). */
    skip('presentation mode: the toggle, the suppression, and what survives a reload',
      'the support-details fixture never arrived, so there was nothing to suppress');
  } else {
    /* ── acceptance 1: every field in the block is editable, through the real controls ── */

    await clickSel('#rosterList .roster-row:nth-child(1) [data-student-edit]');
    const shutOnOpen = await evalJs('window.__panel()');
    check('the support panel is shut when the editor opens by the ordinary route, showing nothing',
      shutOnOpen.hidden === true && shutOnOpen.expanded === 'false'
        && shutOnOpen.label === 'Show support details'
        && shutOnOpen.plan.length === 0 && shutOnOpen.cards === 0
        && [shutOnOpen.caseName, shutOnOpen.caseEmail, shutOnOpen.reviewDate,
          shutOnOpen.medical, shutOnOpen.behaviorPlan].every(v => v === ''),
      'hidden = ' + shutOnOpen.hidden + ', plan buttons pressed = ' + shutOnOpen.plan.length
        + ', accommodation cards = ' + shutOnOpen.cards);

    await clickSel('[data-supports-reveal]');
    /* The four plan buttons are real markup in index.html and the four plan values live in
       src/supports.js, which is two lists that have to agree — and when they stop agreeing the
       symptom is a button that does nothing, because setPlan() refuses a value isPlan() does not
       know. Compared rather than trusted, in the order the data model writes them. */
    const planButtons = await evalJs(`(function(){
      return { markup: Array.prototype.map.call(
                 document.querySelectorAll('#supportsPlanRow [data-support-plan]'),
                 function(b){ return b.getAttribute('data-support-plan'); }),
               module: window.planbook.supports.PLANS.map(function(p){ return p.value; }) }; })()`);
    check('the plan buttons in the markup are exactly the plan values src/supports.js enumerates',
      JSON.stringify(planButtons.markup) === JSON.stringify(planButtons.module)
        && JSON.stringify(planButtons.module) === JSON.stringify(['none', 'IEP', '504', 'ELL']),
      'markup ' + JSON.stringify(planButtons.markup) + ' · module '
        + JSON.stringify(planButtons.module));
    await clickSel('#supportsPlanRow [data-support-plan="IEP"]');
    await typeField('supportsCaseManagerName', CASE_NAME);
    await typeField('supportsCaseManagerEmail', CASE_EMAIL);
    await typeField('supportsReviewDate', REVIEW_DATE);
    await typeField('supportsMedical', MEDICAL);
    await typeField('supportsBehaviorPlan', BEHAVIOR);
    await clickSel('[data-accommodation-add]');
    await clickSel('[data-accommodation-add]');
    /* The kind picker commits on `change`, which is what a <select> does and why src/shell.js
       routes it from the change listener rather than from the input one. */
    await evalJs(`(function(){
      var sel = document.querySelectorAll('#accommodationList [data-support-kind]');
      function pick(i, v){ sel[i].value = v;
        sel[i].dispatchEvent(new Event('change', { bubbles: true })); }
      pick(0, 'extended-time'); pick(1, 'other');
      var d = document.querySelectorAll('#accommodationList [data-student-field="accommodation.detail"]');
      var a = document.querySelectorAll('#accommodationList [data-student-field="accommodation.appliesTo"]');
      function set(e, v){ e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }
      set(d[0], ${JSON.stringify(DETAIL_ONE)}); set(a[0], 'tests, quizzes');
      set(d[1], ${JSON.stringify(DETAIL_TWO)});
      return 1; })()`);
    await new Promise(r => setTimeout(r, 200));

    const filled = await evalJs('window.__panel()');
    const stored = await evalJs('window.__sup(' + JSON.stringify(ids[0]) + ')');
    check('every field in the supports block is editable from the panel and lands in the document',
      !!stored && !!stored.supports
        && stored.supports.plan === 'IEP'
        && stored.supports.caseManager.name === CASE_NAME
        && stored.supports.caseManager.email === CASE_EMAIL
        && stored.supports.reviewDate === REVIEW_DATE
        && stored.supports.medical === MEDICAL
        && stored.supports.behaviorPlan === BEHAVIOR
        && stored.supports.accommodations.length === 2
        && stored.supports.accommodations[0].kind === 'extended-time'
        && stored.supports.accommodations[0].detail === DETAIL_ONE
        && filled.plan.length === 1 && filled.plan[0] === 'IEP' && filled.cards === 2,
      stored && stored.supports
        ? 'plan ' + stored.supports.plan + ', ' + stored.supports.accommodations.length
          + ' accommodation(s), case manager, review date, medical and behavior plan all stored'
        : 'no supports block on the student the editor was open on');
    check('`appliesTo` is an array of the words typed, and an empty one means everything',
      !!stored && Array.isArray(stored.supports.accommodations[0].appliesTo)
        && JSON.stringify(stored.supports.accommodations[0].appliesTo)
          === JSON.stringify(['tests', 'quizzes'])
        && Array.isArray(stored.supports.accommodations[1].appliesTo)
        && stored.supports.accommodations[1].appliesTo.length === 0,
      stored && stored.supports
        ? JSON.stringify(stored.supports.accommodations.map(a => a.appliesTo))
        : 'no supports block to read');
    check('and the record still carries exactly the keys the data model gives a student',
      !!stored && JSON.stringify(stored.keys) === JSON.stringify(['counselor', 'email', 'first',
        'gradYear', 'guardians', 'id', 'last', 'nickname', 'notes', 'phone', 'phone2', 'supports']),
      stored ? JSON.stringify(stored.keys) : 'no student');

    /* Two more students, so the dots have something to differ by if they are going to. */
    await evalJs("window.planbook.closeModal('studentModal');1");
    await clickSel('#rosterList .roster-row:nth-child(2) [data-student-edit]');
    await clickSel('[data-supports-reveal]');
    await clickSel('#supportsPlanRow [data-support-plan="504"]');
    await evalJs("window.planbook.closeModal('studentModal');1");
    await clickSel('#rosterList .roster-row:nth-child(3) [data-student-edit]');
    await clickSel('[data-supports-reveal]');
    await typeField('supportsMedical', MEDICAL_TWO);
    await new Promise(r => setTimeout(r, 200));
    await evalJs("window.planbook.closeModal('studentModal');1");

    /* ── acceptance 4: reviewDate is stored and readable, through a save and a reload ── */

    await closeAllSupport();
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 600));
    const supportReboot = await waitForBoot();
    await evalJs(KILL_ANIM);
    await evalJs(INSTALL_WALKER);
    await evalJs(INSTALL_CLASS_READER);
    await evalJs(INSTALL_ROSTER_READER);
    await evalJs(INSTALL_SUPPORT_READER);
    const reloadedSupport = await evalJs('window.__sup(' + JSON.stringify(ids[0]) + ')');
    check('the whole supports block comes back out of IndexedDB after a save and a reload',
      supportReboot && !!reloadedSupport && !!reloadedSupport.supports
        && JSON.stringify(reloadedSupport.supports) === JSON.stringify(stored.supports),
      supportReboot
        ? (reloadedSupport && reloadedSupport.supports
          ? 'identical to what was written, field for field'
          : 'the student came back without a supports block')
        : 'the loading screen never came down');
    check('reviewDate is stored and readable whether or not anything consumes it yet',
      !!reloadedSupport && reloadedSupport.supports
        && reloadedSupport.supports.reviewDate === REVIEW_DATE,
      reloadedSupport && reloadedSupport.supports
        ? 'reviewDate = ' + JSON.stringify(reloadedSupport.supports.reviewDate)
          + ' — no calendar reads it; WO-6.1 owns that'
        : 'no supports block to read');

    /* ── acceptance 2: no list view shows any of it without a deliberate tap ── */

    await openFullestRoster();
    const list = await evalJs('window.__rosterText()');
    check('the roster list shows a dot for each student who has something on file, and nothing else',
      list.rows >= 3 && list.dots === 3 && foundIn(list.text).length === 0,
      list.rows + ' rows, ' + list.dots + ' dot(s), leaked: '
        + JSON.stringify(foundIn(list.text)));

    await clickSel('#rosterList .roster-row:nth-child(1) [data-student-edit]');
    const editorShut = await evalJs('window.__panel()');
    check('and opening the editor by Edit shows no plan, no accommodation, no medical, no behavior text',
      editorShut.hidden === true && editorShut.plan.length === 0 && editorShut.cards === 0
        && [editorShut.caseName, editorShut.caseEmail, editorShut.reviewDate, editorShut.medical,
          editorShut.behaviorPlan].every(v => v === '')
        && foundValueIn(editorShut.text).length === 0,
      'panel hidden = ' + editorShut.hidden + ', no plan button pressed, leaked into the dialog: '
        + JSON.stringify(foundValueIn(editorShut.text)));

    await clickSel('[data-supports-reveal]');
    const editorOpen = await evalJs('window.__panel()');
    check('one deliberate tap on that panel is what puts them on screen — and it really is them',
      editorOpen.hidden === false && editorOpen.expanded === 'true'
        && editorOpen.label === 'Hide support details'
        && JSON.stringify(editorOpen.plan) === JSON.stringify(['IEP'])
        && editorOpen.caseName === CASE_NAME && editorOpen.caseEmail === CASE_EMAIL
        && editorOpen.reviewDate === REVIEW_DATE && editorOpen.medical === MEDICAL
        && editorOpen.behaviorPlan === BEHAVIOR
        && editorOpen.cards === 2
        && JSON.stringify(editorOpen.kinds) === JSON.stringify(['extended-time', 'other'])
        && editorOpen.details[0] === DETAIL_ONE && editorOpen.applies[0] === 'tests, quizzes',
      'plan ' + JSON.stringify(editorOpen.plan) + ', cards ' + editorOpen.cards
        + ', kinds ' + JSON.stringify(editorOpen.kinds));

    /* The Review date, read while the panel is genuinely revealed — the same two facts the check
       above asserts, `hidden` false and `aria-expanded` true, because a computed style taken off
       this field with the panel shut would be a green answer about a field nobody could see
       (WO-2.24). Nothing below reads or prints the field's value: the id and the computed
       properties are all that leave the page. */
    const reviewReset = await dateResetOn('#supportsReviewDate', 1,
      "(function(){ var body = document.getElementById('supportsBody'),"
      + " btn = document.getElementById('supportsRevealBtn');"
      + " return !!body && body.classList.contains('hidden') === false"
      + " && !!btn && btn.getAttribute('aria-expanded') === 'true'"
      + " && !document.getElementById('studentModal').classList.contains('hidden'); })()",
      'the support panel is revealed on an open student editor');
    check('the plan Review date carries the shared date reset as a live computed style too — the fifth field in the app that has no copy of that rule of its own, so deleting src/shell.css\'s one line turns this red; what it does not touch is the height the field is drawn at, which this engine gets right whether the rule is there or not and which only the device can settle',
      reviewReset.ok, reviewReset.detail);
    await clickSel('[data-supports-reveal]');
    const editorShutAgain = await evalJs('window.__panel()');
    check('and tapping it again takes them back off, fields emptied rather than merely unpainted',
      editorShutAgain.hidden === true && editorShutAgain.plan.length === 0
        && editorShutAgain.cards === 0
        && [editorShutAgain.caseName, editorShutAgain.medical, editorShutAgain.behaviorPlan]
          .every(v => v === ''),
      'hidden = ' + editorShutAgain.hidden + ', cards = ' + editorShutAgain.cards);

    await evalJs("window.planbook.closeModal('studentModal');1");
    await clickSel('#rosterList .roster-row:nth-child(1) [data-supports-open]');
    const viaDot = await evalJs('window.__panel()');
    check('the dot is that deliberate tap: it opens the editor with the panel already showing',
      viaDot.hidden === false && viaDot.expanded === 'true'
        && JSON.stringify(viaDot.plan) === JSON.stringify(['IEP'])
        && viaDot.medical === MEDICAL,
      'panel hidden = ' + viaDot.hidden + ', plan = ' + JSON.stringify(viaDot.plan));
    await evalJs("window.planbook.closeModal('studentModal');1");
    const reopened = await evalJs("(function(){ window.planbook.roster.openStudentEditor("
      + JSON.stringify(ids[0]) + "); return window.__panel(); })()");
    check('and the next open is shut again — it is not a setting that stays where it was left',
      reopened.hidden === true && reopened.expanded === 'false' && reopened.plan.length === 0,
      'hidden = ' + reopened.hidden + ', expanded = ' + reopened.expanded);
    await evalJs("window.planbook.closeModal('studentModal');1");

    /* ── acceptance 3: the dot encodes nothing ── */

    /*
      The pointer is parked somewhere harmless first, and that is not housekeeping — it is what
      this check found on its first run. The last thing clicked above was row 1's dot, so the
      cursor was still resting on it: getComputedStyle returned that dot's `:hover` rule and the
      other two returned their resting one, and the run reported three dots that did not match.
      Which is exactly what a plan-coded dot would look like. A check whose failure mode is
      indistinguishable from the defect it exists for has to rule the artifact out rather than
      tolerate it, so the mouse goes to the corner instead of the hover properties coming out of
      the comparison — dropping background and border colour would leave this measuring almost
      nothing, which is the whole subject of tools/README.md's CDP section.
    */
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 2, y: 2 });
    await new Promise(r => setTimeout(r, 100));
    const dots = await evalJs('window.__dots()');
    const looks = [...new Set(dots.map(d => d.look))];
    const glyphs = [...new Set(dots.map(d => d.text))];
    const classes = [...new Set(dots.map(d => d.cls))];
    check('three students with three different things on file get three identical dots',
      dots.length === 3 && looks.length === 1 && glyphs.length === 1 && classes.length === 1,
      dots.length + ' dot(s); distinct looks = ' + JSON.stringify(looks)
        + '; distinct glyphs = ' + JSON.stringify(glyphs));
    /* The label is the other half of the dot. A dot that said nothing and was announced as "IEP"
       would be a disclosure to the room the moment VoiceOver is on. */
    const PLAN_WORDS = /IEP|504|ELL|accommodat|medical|behavio|allerg|diabet/i;
    check('and neither its label nor its tooltip names a plan, a need, or an accommodation',
      dots.length === 3 && dots.every(d => d.label && d.title
        && d.label === d.title
        && /^Support details for /.test(d.label)
        && !PLAN_WORDS.test(d.label.replace(/^Support details for /, ''))),
      JSON.stringify(dots.map(d => d.label)));
    /* The row with nothing on file has no dot at all, which is what makes the dot mean anything —
       and is also the reason presentation mode has to be able to take it away (WO-1.9). */
    const bare = await evalJs("(function(){ var rows = document.querySelectorAll("
      + "'#rosterList .roster-row'); var n = 0;"
      + " Array.prototype.forEach.call(rows, function(r){"
      + "   if (!r.querySelector('[data-supports-open]')) n++; }); return n; })()");
    check('a student with nothing on file carries no indicator at all',
      bare === list.rows - 3, bare + ' of ' + list.rows + ' rows have no dot');

    /* ── acceptance 5: the backup names what it holds, and holds it ── */

    await closeAllSupport();
    await clickSel('header [data-backup-panel]');
    await new Promise(r => setTimeout(r, 300));
    const notice = await evalJs("(function(){ var m = document.getElementById('backupModal');"
      + " return { open: !!m && !m.classList.contains('hidden'),"
      + " text: (m ? m.textContent : '').replace(/\\s+/g, ' ') }; })()");
    check('the backup panel names accommodation, IEP/504, medical and behavior-plan data as being in the file',
      notice.open && /accommodation/i.test(notice.text) && /\bIEP\b/.test(notice.text)
        && /\b504\b/.test(notice.text) && /medical/i.test(notice.text)
        && /behavio(u)?r plan/i.test(notice.text),
      notice.open
        ? (notice.text.match(/It also contains[^.]*\./) || ['no "It also contains" sentence'])[0]
        : 'the backup panel did not open');
    /* And the claim is true. A notice that named data the file did not carry would be the same
       defect the other way round: the teacher would keep a backup she believed was complete. */
    const inFile = await evalJs(`(async function(){
      var f = await window.planbook.backup.buildBackup();
      var doc = JSON.parse(f.text);
      var s = doc.students.filter(function(x){ return x.id === ${JSON.stringify(ids[0])}; })[0] || {};
      var sup = s.supports || {};
      return { plan: sup.plan, medical: sup.medical, behaviorPlan: sup.behaviorPlan,
               reviewDate: sup.reviewDate,
               caseManager: (sup.caseManager || {}).name,
               accommodations: (sup.accommodations || []).length }; })()`);
    check('and the file really does carry them, so the notice is a fact rather than a promise',
      inFile.plan === 'IEP' && inFile.medical === MEDICAL && inFile.behaviorPlan === BEHAVIOR
        && inFile.reviewDate === REVIEW_DATE && inFile.caseManager === CASE_NAME
        && inFile.accommodations === 2,
      'plan ' + JSON.stringify(inFile.plan) + ', ' + inFile.accommodations
        + ' accommodation(s), medical and behavior plan present in the downloaded JSON');
    await closeAllSupport();

    /* Nothing sensitive may reach localStorage, which is where a "remember the panel was open"
       preference would have gone if anyone had written one. Read out of the browser rather than
       out of prefs.js, because what is being asserted is what is in the browser. */
    const supportLocal = await readLocalStore(evalJs, 400);
    const supportBlob = JSON.stringify(supportLocal);
    check('no support detail, and no memory of the panel being open, reached localStorage, and every key present is ours',
      oursIn(supportLocal).length > 0
        && foreignIn(supportLocal).length === 0
        && foundInStore(supportBlob).length === 0
        && !/supports|accommodat|reveal/i.test(supportBlob),
      storeDetail(supportLocal));

    /* ───────────────── WO-1.9: presentation mode ─────────────────
     *
     * Driven here, inside the support-details section, and sharing its fixture on purpose: what
     * presentation mode has to suppress is three students with an IEP, a 504, two accommodations,
     * a case manager, a review date, a medical note and a behavior plan, all of it already in the
     * document above. A second fixture would be a second thing to keep in step, and — worse — a
     * fixture built after the switch was thrown could be empty for the wrong reason and every
     * absence check below would pass over nothing.
     *
     * Four things these checks are shaped to be able to fail:
     *
     *   1. ABSENT, NOT HIDDEN. The claim is not that support data stops being painted, it is that
     *      it stops being in the page — `display: none` is still reachable by a screenshot tool,
     *      a find-in-page and the accessibility tree. So the sweep is over the WHOLE document's
     *      text plus the value of every input, select and textarea in it, hidden ones included,
     *      and it runs with dialogs open rather than closed.
     *   2. WHAT IS ALREADY ON SCREEN. The roster panel is left open across the flip and is never
     *      reopened, because suppression that only reaches the next render leaves the screen the
     *      teacher is looking at exactly as it was — which is the screen she flipped the switch
     *      for.
     *   3. AN ABSENCE WITH NOTHING BEHIND IT IS NOT EVIDENCE. The mode is turned back off at the
     *      end and the same data is required to come back. Without that, a build that had simply
     *      lost the fixture would report a clean pass.
     *   4. THE STATE IS VISIBLE. Measured rather than asserted: the button's own computed fill is
     *      read off in both states and required to differ and to be the solid white the header's
     *      active grammar uses. The pointer is parked first — trap 7 in tools/README.md, found by
     *      the dots check above, and this check would have walked into it the same way.
     */

    console.log('\n--- presentation mode ---');

    /* One page-side reader for the mode, re-installed after the reload below like every other. It
       reads the CHROME and the SWITCH, never the preference name twice: the harness asks the app
       what it thinks the mode is, so a check cannot agree with itself and disagree with the app. */
    const INSTALL_PRESENTATION_READER = `(function(){
      window.__pres = function(){
        var b = document.getElementById('presentationBtn');
        var strip = document.getElementById('presentationStrip');
        var box = b ? b.getBoundingClientRect() : null;
        var cs = b ? getComputedStyle(b) : null;
        return {
          hasButton: !!b,
          inHeader: !!(b && b.closest('header')),
          hook: b ? b.hasAttribute('data-presentation-toggle') : false,
          pressed: b ? b.getAttribute('aria-pressed') : null,
          label: b ? b.getAttribute('aria-label') : null,
          title: b ? b.getAttribute('title') : null,
          look: cs ? [cs.backgroundColor, cs.color, cs.borderTopColor].join(' | ') : null,
          size: box ? Math.round(box.width) + 'x' + Math.round(box.height) : null,
          stripShown: !!(strip && !strip.classList.contains('hidden')),
          stripText: strip ? strip.textContent.replace(/\\s+/g, ' ').trim() : null,
          stripHasOff: !!(strip && strip.querySelector('[data-presentation-toggle]')),
          visible: window.planbook.supports.supportsVisible(),
          stored: localStorage.getItem('planbook_presentationMode')
        };
      };
      /* The absence claim, over the whole document rather than over the elements this harness
         happens to know the names of — including every hidden one, which is the entire point. */
      window.__leak = function(){
        var vals = Array.prototype.map.call(
          document.querySelectorAll('input, textarea, select'), function(e){ return e.value; });
        return { text: document.documentElement.textContent.replace(/\\s+/g, ' '),
                 values: vals.join(' | '),
                 dots: document.querySelectorAll('[data-supports-open]').length };
      };
      return 1; })()`;
    await evalJs(INSTALL_PRESENTATION_READER);

    /* Park the pointer before every read of the button's fill. The last thing clicked is otherwise
       sitting under the cursor and measures its :hover rule, which is how a colour comparison
       reports a difference that is not there — or hides one that is. */
    const park = async () => {
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 2, y: 2 });
      await new Promise(r => setTimeout(r, 100));
    };

    /* Every dialog down first, and that is not tidiness: a `.modal-overlay` is fixed at inset 0
       over the whole viewport, so a click aimed at the header while one is open lands on the scrim
       and is a backdrop dismissal instead. The classes-manager block further down hits the same
       thing and says so. It is also true of the app — a teacher cannot reach the header toggle
       without closing the dialog she is in — which is exactly why the redraw checks below matter
       for the screens Phase 2 puts in <main> rather than in a modal. */
    await closeAllSupport();
    await park();
    const modeOff = await evalJs('window.__pres()');
    check('presentation mode ships off, and its toggle is a header control with a state to read',
      modeOff.hasButton && modeOff.inHeader && modeOff.hook
        && modeOff.pressed === 'false' && modeOff.visible === true
        && modeOff.stripShown === false
        && !!modeOff.label && modeOff.label === modeOff.title,
      'in header = ' + modeOff.inHeader + ', aria-pressed = ' + modeOff.pressed
        + ', strip shown = ' + modeOff.stripShown);

    /* The flip, through the real header button with a real mouse. */
    await clickSel('header [data-presentation-toggle]');
    await park();
    const modeOn = await evalJs('window.__pres()');
    check('one tap on it turns every support field in the app off at the one switch',
      modeOn.pressed === 'true' && modeOn.visible === false,
      'aria-pressed = ' + modeOn.pressed + ', supportsVisible() = ' + modeOn.visible);
    check('the toggle says so without being hunted for: a different fill, a changed label, and a strip',
      modeOn.look !== modeOff.look && modeOn.look.indexOf('rgb(255, 255, 255)') === 0
        && modeOn.label !== modeOff.label && modeOn.label === modeOn.title
        && modeOn.stripShown === true && modeOn.stripHasOff === true
        && /Presentation mode is on/.test(modeOn.stripText),
      'off = ' + modeOff.look + ' · on = ' + modeOn.look + ' · strip: '
        + (modeOn.stripText || '').slice(0, 80));

    /* A roster opened while the mode is already on. */
    await openFullestRoster();
    const rosterUnderMode = await evalJs('window.__rosterText()');
    check('a roster opened while it is on arrives with no indicator dots and no support text',
      rosterUnderMode.rows >= 3 && rosterUnderMode.dots === 0
        && foundIn(rosterUnderMode.text).length === 0,
      rosterUnderMode.rows + ' rows, ' + rosterUnderMode.dots + ' dot(s), leaked: '
        + JSON.stringify(foundIn(rosterUnderMode.text)));

    /*
      AND THE SCREEN THAT IS ALREADY ON THE GLASS, flipped both ways with the panel never reopened.

      Driven with element.click() rather than a mouse, for the reason the closeAllSupport() above
      gives: the roster panel has to STAY open for this check to mean anything, and while it is
      open no physical click can reach the header at all. What el.click() skips is the browser's
      hit testing, which the real tap above already proved; what it goes through is the same
      delegated listener in src/shell.js that a thumb goes through, which is the path under test.
    */
    const flipFromHeader = () => evalJs(
      "document.querySelector('header [data-presentation-toggle]').click(); 1");
    await flipFromHeader();
    await new Promise(r => setTimeout(r, 200));
    const rosterLit = await evalJs('window.__rosterText()');
    check('flipping it off redraws the roster that is already open — the dots come back, no reopen',
      rosterLit.rows === rosterUnderMode.rows && rosterLit.dots === 3,
      rosterLit.rows + ' rows, ' + rosterLit.dots + ' dot(s) back on a panel nobody reopened');
    await flipFromHeader();
    await new Promise(r => setTimeout(r, 200));
    const rosterAfter = await evalJs('window.__rosterText()');
    check('and flipping it on takes them off the screen she is looking at, without a reopen',
      rosterAfter.rows === rosterUnderMode.rows && rosterAfter.dots === 0
        && foundIn(rosterAfter.text).length === 0,
      rosterAfter.rows + ' rows still listed, ' + rosterAfter.dots + ' dot(s), leaked: '
        + JSON.stringify(foundIn(rosterAfter.text)));

    /* The editor, opened the only way left — the dot it used to be reachable by is gone. */
    await clickSel('#rosterList .roster-row:nth-child(1) [data-student-edit]');
    const panelUnderMode = await evalJs('window.__panel()');
    const revealState = await evalJs(`(function(){
      var b = document.getElementById('supportsRevealBtn');
      var hint = document.getElementById('supportsHint');
      var alt = document.getElementById('supportsHintPresentation');
      return { disabled: !!(b && b.disabled),
               ordinaryHintShown: !!(hint && !hint.classList.contains('hidden')),
               modeHintShown: !!(alt && !alt.classList.contains('hidden')),
               modeHint: alt ? alt.textContent.replace(/\\s+/g, ' ').trim() : null }; })()`);
    check('the support panel cannot be opened at all, and says why rather than looking broken',
      panelUnderMode.hidden === true && panelUnderMode.plan.length === 0
        && panelUnderMode.cards === 0
        && [panelUnderMode.caseName, panelUnderMode.caseEmail, panelUnderMode.reviewDate,
          panelUnderMode.medical, panelUnderMode.behaviorPlan].every(v => v === '')
        && revealState.disabled === true
        && revealState.modeHintShown === true && revealState.ordinaryHintShown === false
        && /nothing has been deleted/i.test(revealState.modeHint || ''),
      'reveal disabled = ' + revealState.disabled + ', mode hint shown = '
        + revealState.modeHintShown + ' :: ' + (revealState.modeHint || '').slice(0, 60));
    /* And tapping it anyway does nothing — the control is refused in the module, not only greyed
       out in the stylesheet. A disabled attribute is one line away from being removed by a later
       work order's CSS, and the refusal has to survive that. */
    await evalJs("document.getElementById('supportsRevealBtn').removeAttribute('disabled');"
      + "window.planbook.roster.toggleSupports(); 1");
    const forced = await evalJs('window.__panel()');
    check('and forcing the control open anyway still shows nothing — the refusal is in the module',
      forced.hidden === true && forced.plan.length === 0 && forced.cards === 0
        && forced.medical === '' && forced.behaviorPlan === '',
      'panel hidden = ' + forced.hidden + ', cards = ' + forced.cards);

    /* THE ABSENCE CLAIM, over the whole document with the editor open. */
    const leak = await evalJs('window.__leak()');
    check('none of it is anywhere in the DOM — not hidden in it, absent from it',
      foundValueIn(leak.text).length === 0 && foundValueIn(leak.values).length === 0
        && leak.dots === 0,
      'document text leaked: ' + JSON.stringify(foundValueIn(leak.text))
        + ' · control values leaked: ' + JSON.stringify(foundValueIn(leak.values))
        + ' · indicator dots anywhere on the page: ' + leak.dots);

    /* A SCREEN WRITTEN AFTER THIS WORK ORDER inherits the suppression, and this is the form of
       that claim a harness can actually falsify: the two funnels every renderer hands its strings
       to are driven directly, with no screen involved. A screen that uses them is suppressed
       whether or not its author knew presentation mode existed — which is the whole reason the
       rule lives at the render helper rather than in a conditional per screen. */
    const funnels = await evalJs(`(function(){
      var s = window.planbook.supports;
      var el = document.createElement('span');
      s.setSensitiveText(el, ${JSON.stringify(MEDICAL)});
      return { value: s.sensitiveValue(${JSON.stringify(CASE_NAME)}),
               text: el.textContent,
               visible: s.supportsVisible() }; })()`);
    check('a screen built later inherits it: both render funnels return nothing while the mode is on',
      funnels.visible === false && funnels.value === '' && funnels.text === '',
      'sensitiveValue() = ' + JSON.stringify(funnels.value)
        + ', setSensitiveText() wrote ' + JSON.stringify(funnels.text));

    /* ── acceptance 3: it survives a reload and an app relaunch ── */

    await closeAllSupport();
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 600));
    const modeReboot = await waitForBoot();
    await evalJs(KILL_ANIM);
    await evalJs(INSTALL_WALKER);
    await evalJs(INSTALL_CLASS_READER);
    await evalJs(INSTALL_ROSTER_READER);
    await evalJs(INSTALL_SUPPORT_READER);
    await evalJs(INSTALL_PRESENTATION_READER);
    await park();
    const afterReload = await evalJs('window.__pres()');
    check('it survives a reload: the mode, the pressed toggle, and the strip all come back on',
      modeReboot && afterReload.visible === false && afterReload.pressed === 'true'
        && afterReload.stripShown === true && afterReload.stored === 'true',
      modeReboot
        ? 'supportsVisible() = ' + afterReload.visible + ', aria-pressed = ' + afterReload.pressed
          + ', planbook_presentationMode = ' + afterReload.stored
        : 'the loading screen never came down');
    await openFullestRoster();
    const rosterReloaded = await evalJs('window.__rosterText()');
    check('and the roster comes back up already quiet, rather than quiet only after a redraw',
      rosterReloaded.rows >= 3 && rosterReloaded.dots === 0
        && foundIn(rosterReloaded.text).length === 0,
      rosterReloaded.rows + ' rows, ' + rosterReloaded.dots + ' dot(s), leaked: '
        + JSON.stringify(foundIn(rosterReloaded.text)));

    /* ── and back off again, which is what makes every absence above evidence ── */

    /* Through the strip's own "Turn it off", with a real mouse — so the second of the two controls
       that carry the hook is driven the way a teacher drives it, and not only the header one.
       Dialogs down first, for the scrim reason above. */
    await closeAllSupport();
    await clickSel('#presentationStrip [data-presentation-toggle]');
    await park();
    const modeBackOff = await evalJs('window.__pres()');
    await openFullestRoster();
    const rosterBack = await evalJs('window.__rosterText()');
    check('the strip\'s own control turns it back off, and every dot returns',
      modeBackOff.visible === true && modeBackOff.pressed === 'false'
        && modeBackOff.stripShown === false && modeBackOff.stored === 'false'
        && rosterBack.dots === 3,
      'supportsVisible() = ' + modeBackOff.visible + ', dots back = ' + rosterBack.dots);
    await clickSel('#rosterList .roster-row:nth-child(1) [data-supports-open]');
    const restored = await evalJs('window.__panel()');
    check('and the data behind the absence was never touched — it is all still on the student',
      restored.hidden === false && JSON.stringify(restored.plan) === JSON.stringify(['IEP'])
        && restored.medical === MEDICAL && restored.behaviorPlan === BEHAVIOR
        && restored.caseName === CASE_NAME && restored.reviewDate === REVIEW_DATE
        && restored.cards === 2,
      'plan ' + JSON.stringify(restored.plan) + ', ' + restored.cards
        + ' accommodation card(s), medical and behavior plan back exactly as they were');
    await evalJs("window.planbook.closeModal('studentModal');1");

    /* The preference is a switch position and nothing else. `planbook_presentationMode` is the one
       key WO-1.9 adds, and what it may hold is `true` or `false` — anything longer is somebody
       having stored a state instead of a state's name. */
    const modePref = await evalJs("localStorage.getItem('planbook_presentationMode')");
    check('the preference it persists is a bare boolean, not a state carried in localStorage',
      modePref === 'true' || modePref === 'false',
      'planbook_presentationMode = ' + JSON.stringify(modePref));
  }

  await closeAllSupport();
  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  /* The open class is left where the roster section left it, for the reason that section gives:
     the overflow sweep at the bottom measures the term nav of whatever is open. */
  if (before && before.tab !== 1) await clickSel('[data-class-tab]', 1);
}
}
