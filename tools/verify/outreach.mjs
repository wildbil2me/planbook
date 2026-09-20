/* outreach.mjs — the send flow: the audience picker, the draft, and the `mailto:` handoff (WO-5.3)
 *
 * The section drives the real flow through both of its real doors — the signal card and the student
 * record — and asks the model beside it, which is `templates.mjs`'s posture and `concern-list.mjs`'s
 * before it: a check that read everything out of markup would also have to be right about markup,
 * and a check that read everything out of the model would pass over a link nobody drew. Both, every
 * time.
 *
 * WHAT IS ASKED HERE THAT NOTHING ELSE CAN ASK. Six of WO-5.3's seven acceptance lines are claims a
 * headless browser can settle and the seventh is half of one. The URL is the reason this section
 * exists at all: **tapping the handoff hands the page to the operating system**, which is the one
 * thing a harness must never do, so the percent-encoding the Traps line is about can only be read
 * off the `href` the app put in the DOM. That it is a link rather than a scripted navigation is what
 * makes the measurement possible; src/outreach-view.js argues the choice on its own merits and this
 * is the third of them.
 *
 * TWO LINES ARE NOT CLOSED HERE AND CANNOT BE. *"The draft opens in the default mail client on
 * desktop and on iPad"* and *"copy-to-self lands in the teacher's sent folder after sending"* both
 * end outside this app, on hardware with a mail account on it. What is proved below is everything up
 * to that edge — the address, the copy, the subject and the body, byte for byte, in the string the
 * operating system receives — and the rest is a person with a thumb (`TESTING.md` § WO-5.3).
 *
 * WO-5.12 ADDED THE WEBMAIL DOORS TO THIS SAME SECTION, in four places rather than one, because each
 * reads a state the section already builds: five checks after the WO-5.11 line (the Gmail and
 * Outlook `href` shapes with `target`/`rel` on, the `mailto:` with both off, the document
 * byte-identical across the tap), one on the refused draft (no `href` under all three doors), one
 * on the long draft (the warning names no ceiling under Gmail), and two at the foot after every
 * `rev` reading (the handoff pressed under Gmail writes one `contact`; the chips at 390px). The
 * handoff is pressed here for the first time in this file, which is why those two are last.
 *
 * WO-5.14 ADDED SIX CHECKS THAT DRIVE NOTHING ON THE SCREEN, directly after the draftText() edge
 * fixture, because nothing on the screen can address a draft to two people until WO-5.8 builds the
 * picker. The builders take lists in `to` and `cc` now, and the six hand them lists of two and of
 * six through the seam: the literal comma between addresses on all three doors, the blank dropped
 * and the empty header left out, the string refused with a TypeError rather than wrapped, the
 * clipboard's `Name <primary>, other` line, and the 2,000 crossed by addresses alone. Every
 * DOM-read check in this section is byte-identical across that work order, which is its own claim:
 * a one-element list serialises to the string the screen carried before.
 *
 * WO-5.8 ADDED SEVEN AND REWROTE SIX, and the rewrites are the half worth reading. Six of the seven
 * sit in one block directly after the picker is first read, because that is the one moment in this
 * section where the state is known exactly; the seventh runs last, at the foot, after everything
 * that depends on Ada's draft. The fixture gained a THIRD guardian, with an address, so that *two
 * guardians and a counselor* is a thing this section can express — the second keeps her missing
 * address, which is Acceptance line 4's whole case — and the picker is therefore six rows rather
 * than five, in three places.
 *
 * WHAT WAS REWRITTEN, AND WHY IT IS NOT RE-ASSERTION. The addressless recipient is refused at the
 * door now rather than chosen-and-then-blocking, so the check that clicked her chip and read the
 * draft going dead would have been a `.click()` that did nothing passing a check about a block —
 * it reads the refusal instead, and over an EDITED draft, which is a claim the new block cannot
 * make. Three checks that drove `[data-outreach-to]` to change who a draft was WRITTEN to now
 * drive `[data-outreach-primary]`, because row one is a membership toggle and never asks; a
 * `[data-outreach-to]` left standing in front of a `confirmPanel()` would have been asserting a
 * dialog over a control with no reason to raise one. And WO-5.10's projector check gained a second
 * claim for free: the second chip row is drawn AND naming a guardian at the moment the mode goes
 * on, so its emptying is asserted by a check that was already searching the whole modal's text.
 *
 * Nothing here launches a browser, a server or a document of its own: the entry file owns all three
 * and hands them over on `h`. `tools/README.md` § "Driving a browser over CDP" says where a new
 * check goes.
 */

export async function run(h) {
/* `PORT` joined at WO-5.7 and it is the only thing in this list that is not about the page: the
   clipboard is a BROWSER-level permission, granted against the harness's own origin rather than
   through the page session, so the check that presses the copy control needs to know what that
   origin is. tools/verify/score-grid.mjs takes it from the same place for the same reason. */
const { check, skip, send, evalJs, clickSel, KILL_ANIM, waitForBoot, seam, PORT } = h;

/*
 * ───────── the send flow (WO-5.3) ─────────
 *
 * ONE CLASS, TWO STUDENTS AND FIVE TEMPLATES, and every part of the fixture is there to make a
 * failure expressible rather than to make a pass look thorough.
 *
 *   Full    two guardians — the first with an address, the SECOND WITH A NAME AND NO ADDRESS, which
 *           is the recipient case that must block rather than open an empty mail window — a
 *           counselor with an address, an address of her own, four scores at 62 lifting to four at
 *           98 (a praise hit, so `{{grade.delta}}` and `{{signals.list}}` both answer), one piece of
 *           missing work, ten recorded meetings, and a complete `supports` block whose every field
 *           holds a string that occurs nowhere else in this repository.
 *   Orphan  nobody to write to at all.
 *
 *   The five templates are the pair WO-5.3's seventh acceptance line is about (a concern one and a
 *   praise one for the same audience), a counselor one that must not appear for a guardian, a body
 *   long enough to pass the `mailto:` ceiling, and one carrying `{{supports.medical}}` — which is
 *   the fence arriving at the last surface before the message leaves the building.
 */
console.log('\n--- the send flow (WO-5.3) ---');
if (!seam) {
  skip('the send flow (WO-5.3)', 'window.planbook is not on the page, so nothing here can seed a '
    + 'roster, ask the flow anything, or put the document back');
} else {
  const CLS = 'c_wo53';
  const TERM = 'tm_wo53';
  const FULL = 's_wo53full', ORPHAN = 's_wo53orphan';
  const CLASS_NAME = 'WO-5.3 Outreach';
  const TEACHER = 'Wo53Teacher Name';
  const TEACHER_EMAIL = 'wo53teacher@example.invalid';
  const ADMIN_EMAIL = 'wo53admin@example.invalid';
  const G1_EMAIL = 'wo53guardian1@example.invalid';
  /* WO-5.8's addition, and it is a THIRD guardian rather than an address put on the second one:
     the second guardian having a name and no email is the whole of Acceptance line 4 and the case
     src/outreach.js was written around. A third with an address is what makes *two guardians and a
     counselor on one draft* — Acceptance line 1, word for word — a thing this fixture can express,
     and it puts the addressless chip BETWEEN two choosable ones, which is a better shape for the
     refusal than an addressless chip at the end of the row. */
  const G3_EMAIL = 'wo53guardian3@example.invalid';
  const COUNSELOR_EMAIL = 'wo53counselor@example.invalid';
  /* Every one of these is on the roster and none of them may ever appear in this modal, in the URL,
     or in the recipient list. The counselor beside them is the point of the first six: a counselor
     and a case manager are two different people in this schema and only one of them is behind the
     fence (src/outreach.js). */
  const SECRETS = ['Wo53CaseManager', 'Wo53CaseEmail', 'Wo53AccommodationDetail',
    'Wo53MedicalDetail', 'Wo53BehaviorPlanDetail', 'Wo53ClauseDetail', '2027-04-11'];

  const onView = async () => await evalJs(
    "(function(){var e=document.querySelector('main > :not(.hidden)');return e?e.id:'';})()");
  async function goHome() {
    const nth = await evalJs(`(function(){
      var all = document.querySelectorAll('[data-view-home]');
      for (var i = 0; i < all.length; i++) {
        var r = all[i].getBoundingClientRect();
        if (r.width > 0 && r.height > 0) return i;
      }
      return -1; })()`);
    if (nth < 0) throw new Error('no visible [data-view-home] on this screen');
    await clickSel('[data-view-home]', nth);
    await new Promise(r => setTimeout(r, 250));
  }
  /* Typing, as the app hears it: the value goes in and an `input` event bubbles to the one delegated
     listener in src/shell.js, which is the same path a keystroke takes. A check that called the
     module directly would prove the module and not the wiring. */
  const TYPE = `var type = function(id, value){
    var n = document.getElementById(id);
    n.value = value;
    n.dispatchEvent(new Event('input', { bubbles: true }));
    return n.value; };
  var pick = function(id, value){
    var n = document.getElementById(id);
    n.value = value;
    n.dispatchEvent(new Event('change', { bubbles: true }));
    return n.value; };`;
  /* What the modal actually DREW, read off the DOM rather than off the model. */
  const DRAWN = `var drawn = function(){
    var link = document.getElementById('outreachOpen');
    var block = document.getElementById('outreachBlock');
    var reasons = [];
    Array.prototype.forEach.call(block.querySelectorAll('.mf-reason'), function(r){
      reasons.push(r.textContent.replace(/\\s+/g, ' ').trim()); });
    var head = block.querySelector('.mf-block-head');
    /* FOUR SEGMENTS SINCE WO-5.8 — key, words, in-the-selection, and whether the chip is one the
       door will refuse. The third used to mean "this is the one the draft is written to"; it means
       "on this message" now, which is what the active class and aria-pressed mean on every other
       toggle-btn row in the app, and who it is WRITTEN to is the second row below.
       (No backticks in here; it is inside a template literal and one would close it.) */
    var chips = Array.prototype.map.call(
      document.querySelectorAll('#outreachRecipients .toggle-btn'), function(b){
        return b.getAttribute('data-outreach-to') + '|' + b.textContent + '|'
          + (b.classList.contains('active') ? 'on' : 'off') + '|'
          + (b.getAttribute('aria-disabled') === 'true' ? 'refused' : 'live'); });
    var primaryRow = document.getElementById('outreachPrimaryRow');
    var primaryChips = Array.prototype.map.call(
      document.querySelectorAll('#outreachPrimary .toggle-btn'), function(b){
        return b.getAttribute('data-outreach-primary') + '|' + b.textContent + '|'
          + (b.classList.contains('active') ? 'on' : 'off'); });
    var options = Array.prototype.map.call(
      document.getElementById('outreachTemplate').options, function(o){ return o.textContent; });
    return {
      open: !document.getElementById('outreachModal').classList.contains('hidden'),
      href: link.getAttribute('href'),
      hasHref: link.hasAttribute('href'),
      target: link.getAttribute('target'),
      rel: link.getAttribute('rel'),
      disabled: link.getAttribute('aria-disabled'),
      head: head ? head.textContent : '',
      reasons: reasons,
      clear: block.classList.contains('clear'),
      chips: chips,
      primaryShown: !primaryRow.classList.contains('hidden'),
      primaryChips: primaryChips,
      primaryNote: document.getElementById('outreachPrimaryNote').textContent,
      status: document.getElementById('outreachStatus').textContent,
      options: options,
      toNote: document.getElementById('outreachRecipientNote').textContent,
      ccLabel: document.getElementById('outreachCc').textContent,
      ccNote: document.getElementById('outreachCcNote').textContent,
      lengthShown: !document.getElementById('outreachLength').classList.contains('hidden'),
      lengthText: document.getElementById('outreachLength').textContent,
      formHidden: document.getElementById('outreachForm').classList.contains('hidden'),
      projecting: !document.getElementById('outreachProjecting').classList.contains('hidden'),
      subjectField: document.getElementById('outreachSubject').value,
      bodyField: document.getElementById('outreachBody').value,
      modalText: document.getElementById('outreachModal').textContent }; };`;

  /*
    WO-5.6 CHANGED WHAT A TEMPLATE PICK OR A RECIPIENT TAP DOES TO AN **EDITED** DRAFT: it asks
    first, and rebuilds nothing until the teacher says so. Two of the checks below drive one of
    those controls over a draft they have just typed into, and until that work order they read the
    rebuilt draft straight back. They still assert exactly what they always asserted; this is the
    tap a teacher now has to make in between.

    IT IS DELIBERATELY NOT SILENT ABOUT IT. It hands back whether the dialog appeared and both
    callers assert that it DID, so a build that stopped asking over an edited draft goes red here
    rather than being absorbed into a helper. That is the whole difference between updating a check
    for a behaviour change and quietly routing around one.
  */
  const AGREE = `var agree = function(act){
    act();
    var o = document.getElementById('outreachConfirmModal');
    var asked = !o.classList.contains('hidden');
    if (asked) document.querySelector('[data-outreach-rebuild-confirm]').click();
    return asked; };`;

  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  await send('Emulation.setDeviceMetricsOverride',
    { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  await waitForBoot();
  await evalJs(KILL_ANIM);

  /* ── the fixture ── */
  const LONG = 'This paragraph exists to pass the ceiling. '.repeat(60);
  const plant = await evalJs(`(function(){
    var s = window.planbook.store;
    var d = s.getDoc();
    if (!d) return { ok:false, why:'no year document is open' };
    var hadTeacher = JSON.stringify(d.teacher || {});
    var hadTemplates = JSON.stringify(d.templates || []);
    var today = window.planbook.attendance.todayISO();
    var back = function(n){ return window.planbook.calendar.shiftDays(today, -n); };

    s.update(function(doc){
      if (!Array.isArray(doc.classes)) doc.classes = [];
      if (!Array.isArray(doc.students)) doc.students = [];
      if (!Array.isArray(doc.assignments)) doc.assignments = [];
      if (!Array.isArray(doc.attendance)) doc.attendance = [];
      if (!Array.isArray(doc.log)) doc.log = [];
      doc.teacher = { name:'${TEACHER}', school:'WO-5.3 School', email:'${TEACHER_EMAIL}',
        adminEmail:'${ADMIN_EMAIL}', defaultCc:true };

      doc.students.push({ id:'${FULL}', first:'Ada', last:'Wo53Full', nickname:'Addie',
        email:'wo53student@example.invalid', phone:'', phone2:'',
        guardians:[
          { name:'Wo53Guardian One', relation:'Mother', email:'${G1_EMAIL}',
            phone:'', phone2:'', language:'en', preferred:true },
          { name:'Wo53Guardian Two', relation:'Father', email:'',
            phone:'', phone2:'', language:'en', preferred:false },
          { name:'Wo53Guardian Three', relation:'Grandmother', email:'${G3_EMAIL}',
            phone:'', phone2:'', language:'en', preferred:false }],
        counselor:{ name:'Wo53Counselor', email:'${COUNSELOR_EMAIL}' }, notes:'',
        supports:{ plan:'IEP',
          caseManager:{ name:'Wo53CaseManager', email:'Wo53CaseEmail@example.invalid' },
          reviewDate:'2027-04-11',
          accommodations:[{ kind:'extended-time', detail:'Wo53AccommodationDetail',
            appliesTo:['tests'] }],
          medical:'Wo53MedicalDetail', behaviorPlan:'Wo53BehaviorPlanDetail',
          attendanceClause:'Wo53ClauseDetail' } });
      doc.students.push({ id:'${ORPHAN}', first:'Cal', last:'Wo53Orphan', nickname:'',
        email:'', phone:'', phone2:'', guardians:[], counselor:{ name:'', email:'' }, notes:'' });

      doc.classes.push({ id:'${CLS}', name:'${CLASS_NAME}', archived:false,
        roster:['${FULL}','${ORPHAN}'], letterScale:null,
        terms:[{ id:'${TERM}', label:'WO-5.3 Term', start:back(40),
          end:window.planbook.calendar.shiftDays(today, 40) }],
        categories:[{ id:'k_wo53', name:'All work', weight:100 }]});

      for (var n = 1; n <= 9; n++) {
        doc.assignments.push({ id:'a_wo53_' + n, classId:'${CLS}', termId:'${TERM}',
          categoryId:'k_wo53', name:'WO-5.3 Task ' + n, points:100,
          assigned:back(30), due:back(20) });
      }
      if (!doc.scores || typeof doc.scores !== 'object') doc.scores = {};
      var put = function(id, sid, cell){
        doc.scores[id] = doc.scores[id] || {};
        doc.scores[id][sid] = cell; };
      /* WO-5.2's shape, for its reason: four at 62, one marked missing, four at 98 — a grade that
         rose 21.5 points, so a praise row exists to open a draft from and both of the fields that
         are read off a signal answer. */
      for (var a = 1; a <= 4; a++) put('a_wo53_' + a, '${FULL}', { v: 62 });
      put('a_wo53_5', '${FULL}', { v: null, flag: 'missing' });
      for (var b = 6; b <= 9; b++) put('a_wo53_' + b, '${FULL}', { v: 98 });
      for (var c = 1; c <= 9; c++) put('a_wo53_' + c, '${ORPHAN}', { v: 80 });

      for (var m = 0; m < 10; m++) {
        doc.attendance.push({ classId:'${CLS}', date:back(20 - m * 2), marks:{} });
      }

      /* FIVE TEMPLATES, WRITTEN THROUGH THE MODEL'S OWN WRITER so that every record carries the six
         fields newTemplate() writes and this fixture cannot drift from the shape a teacher's own
         Save produces. */
      doc.templates = [];
      var t = window.planbook.templates;
      t.addTemplate(doc, { name:'WO-5.3 praise to a guardian', tone:'praise', audience:'guardian',
        subject:'{{class.name}} — good news about {{student.first}} & the term',
        body:'Dear {{guardian.name}},\\n\\n'
          + 'I wanted you to hear something good — {{student.first}}\\u2019s work has moved '
          + '{{grade.delta}} and the grade stands at {{grade.percent}}.\\n\\n'
          + 'Worksheet #3? Finished. Nothing owing but {{missing.count}}.\\n\\n{{teacher.name}}' });
      t.addTemplate(doc, { name:'WO-5.3 concern to a guardian', tone:'concern', audience:'guardian',
        subject:'{{class.name}} — checking in',
        body:'Dear {{guardian.name}},\\n\\nThere are {{missing.count}} pieces of work marked '
          + 'missing.\\n\\n{{teacher.name}}' });
      t.addTemplate(doc, { name:'WO-5.3 to the counselor', tone:'concern', audience:'counselor',
        subject:'{{student.first}} {{student.last}} in {{class.name}}',
        body:'Hello,\\n\\n{{signals.list}}\\n\\n{{teacher.name}}' });
      t.addTemplate(doc, { name:'WO-5.3 a long one', tone:'praise', audience:'guardian',
        subject:'{{class.name}} — a long one',
        body:'Dear {{guardian.name}},\\n\\n${LONG}\\n\\n{{teacher.name}}' });
      t.addTemplate(doc, { name:'WO-5.3 a refused one', tone:'praise', audience:'guardian',
        subject:'{{class.name}}',
        body:'Dear {{guardian.name}},\\n\\nHer plan says {{supports.medical}}.\\n\\n'
          + '{{teacher.name}}' });
    });
    var now = s.getDoc();
    return { ok:true, hadTeacher:hadTeacher, hadTemplates:hadTemplates,
      students:(now.students || []).filter(function(p){
        return String(p.id).indexOf('s_wo53') === 0; }).length,
      templates:(now.templates || []).length,
      log:(now.log || []).length }; })()`);
  check('WO-5.3 fixture: one class, two students — one with THREE guardians of whom the SECOND has '
    + 'a name and no email and the third has one (WO-5.8, so that two guardians and a counselor '
    + 'can be on one draft), a counselor, an address of her own and a full `supports` block whose '
    + 'every field holds a string that appears nowhere else in this repository, one with nobody to '
    + 'write to at all — and five templates written through the model’s own writer',
    !!plant && plant.ok === true && plant.students === 2 && plant.templates === 5,
    plant && plant.ok ? plant.students + ' student(s), ' + plant.templates + ' template(s), '
      + plant.log + ' log entr(ies)' : JSON.stringify(plant));

  if (!plant || !plant.ok) {
    skip('the whole of WO-5.3', 'the fixture did not install, so nothing below it could be asked '
      + 'about a recipient, a draft or a handoff');
  } else {
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 600));
    await waitForBoot();
    await evalJs(KILL_ANIM);

    /* What the document looks like before a single control in this flow is touched. Read again at
       the foot of the section: this flow writes NOTHING, and `rev` is the store's own witness. */
    const before = await evalJs(`(function(){
      var d = window.planbook.store.getDoc();
      return { rev: d.rev, log: (d.log || []).length,
        templates: JSON.stringify(d.templates || []),
        defaultCc: !!(d.teacher && d.teacher.defaultCc) }; })()`);

    /* ── the first door: the signal card ── */
    if ((await onView()) !== 'homeView') await goHome();
    await clickSel('#homeGrid [data-class-tab="' + CLS + '"]');
    await new Promise(r => setTimeout(r, 250));
    await clickSel('#classView [data-class-screen="signals"]');
    await new Promise(r => setTimeout(r, 300));
    /* THE PRAISE COLUMN'S FIRST ROW, named rather than taken from the page's first match: the
       draft opens on the direction of the row that was tapped, so a check that took whichever row
       came first in the DOM would be asserting the tone of a row it had not chosen. */
    await clickSel('#signalsPraiseList [data-signal-row]');
    await new Promise(r => setTimeout(r, 250));
    const cardShape = await evalJs(`(function(){
      var b = document.querySelector('#signalCardModal [data-signal-card-draft]');
      return { there: !!b, disabled: b ? !!b.disabled : null,
        title: b ? (b.getAttribute('title') || '') : '',
        label: b ? b.textContent : '' }; })()`);
    check('the door WO-4.2 drew on the signal card is OPEN — the same button, in the same place, '
      + 'no longer disabled and no longer saying outreach arrives later',
      cardShape.there === true && cardShape.disabled === false && cardShape.title === ''
        && /Draft an email/.test(cardShape.label || ''),
      JSON.stringify(cardShape));

    await clickSel('#signalCardModal [data-signal-card-draft]');
    await new Promise(r => setTimeout(r, 300));
    const arrived = await evalJs(`(function(){
      ${DRAWN}
      var m = window.planbook.outreachView.outreachModel();
      var d = drawn();
      return { open: d.open, cardStillOpen:
          !document.getElementById('signalCardModal').classList.contains('hidden'),
        overlays: document.querySelectorAll('.modal-overlay:not(.hidden)').length,
        name: m.name, className: m.className, tone: m.tone,
        recipient: m.recipient ? m.recipient.key : '', audience: m.audience,
        recipients: m.recipients.map(function(r){ return r.key + ':' + r.label
          + (r.email ? ':has' : ':none'); }),
        templateName: m.templateName, ready: m.ready, ccOn: m.cc.on,
        chips: d.chips, toNote: d.toNote, subjectField: d.subjectField,
        bodyField: d.bodyField, tokensLeft: window.planbook.outreach.tokensLeftIn(
          d.subjectField + ' ' + d.bodyField).length }; })()`);
    check('one tap on that door opens the send flow as a modal OVER the card — both overlays are '
      + 'up, so closing the draft puts the teacher back on the row she was reading — and it opens '
      + 'on the direction of that row, on the first recipient who actually has an address, and on '
      + 'a draft with every merge field already resolved',
      arrived.open === true && arrived.cardStillOpen === true && arrived.overlays === 2
        && arrived.tone === 'praise' && arrived.recipient === 'guardian-0'
        && arrived.audience === 'guardian' && arrived.name === 'Ada Wo53Full'
        && arrived.className === CLASS_NAME && arrived.ready === true
        && arrived.tokensLeft === 0 && arrived.subjectField.indexOf('{{') === -1
        && arrived.bodyField.indexOf('Wo53Guardian One') >= 0,
      JSON.stringify({ open: arrived.open, overlays: arrived.overlays, tone: arrived.tone,
        to: arrived.recipient, ready: arrived.ready, tokens: arrived.tokensLeft,
        subject: arrived.subjectField }));

    /*
      THE PICKER IS SIX PEOPLE AND FOUR AUDIENCES, which is src/outreach.js's whole mapping made
      visible — five until WO-5.8 gave this fixture a third guardian, and the mapping itself has
      not moved: three guardian rows still fold onto the one `guardian` audience, which is why
      `AUDIENCES` was not widened and must not be.

      Guardian 2 is on the list with no address rather than left off it — an absence and a bug look
      identical. What she must DO changed on 2026-09-20 and is asserted further down, at the tap:
      she is refused rather than chosen-and-then-blocking, argued at src/outreach-view.js's
      toggleOutreachRecipient(). What she must not do — vanish — is asserted right here, and that
      half of WO-5.3's ruling is untouched.
    */
    check('the audience picker offers every person on this student’s roster entry — all three '
      + 'guardians by POSITION, the counselor, the administrator from Settings and the student '
      + 'herself — and the one with no address on file is on the list rather than quietly missing',
      arrived.recipients.length === 6
        && arrived.recipients[0] === 'guardian-0:Guardian 1:has'
        && arrived.recipients[1] === 'guardian-1:Guardian 2:none'
        && arrived.recipients[2] === 'guardian-2:Guardian 3:has'
        && arrived.recipients[3] === 'counselor:Counselor:has'
        && arrived.recipients[4] === 'admin:Admin:has'
        && arrived.recipients[5] === 'student:Student:has'
        && arrived.chips.length === 6 && /Wo53Guardian One/.test(arrived.toNote)
        && arrived.toNote.indexOf(G1_EMAIL) >= 0,
      arrived.recipients.join(' · ') + ' :: ' + arrived.toNote);

    /*
      THE FENCE AT THE LAST SURFACE BEFORE THE MESSAGE LEAVES. Searched over everything the modal
      drew — the recipient chips, the line naming the person, the resolved draft and the strip —
      because the case manager sits one field away from the counselor in this schema and an audience
      picker that reached into `supports` for an address is the disclosure this project exists to
      prevent.
    */
    const leak = await evalJs(`(function(){
      ${DRAWN}
      var d = drawn();
      var hay = d.modalText + ' ' + (d.href || '');
      var secrets = ${JSON.stringify(SECRETS)};
      return { found: secrets.filter(function(w){ return hay.indexOf(w) >= 0; }),
        counselorDrawn: hay.indexOf('Wo53Counselor') >= 0 }; })()`);
    check('and nothing from the supports block is anywhere in the modal or in the URL — not the '
      + 'case manager, not his address, not the accommodation, the medical need, the behavior plan, '
      + 'the attendance clause or the review date. The COUNSELOR is a roster contact and is offered; '
      + 'the case manager beside him is not, and there is no path from this flow to one',
      leak.found.length === 0,
      leak.found.length ? 'LEAKED: ' + leak.found.join(', ')
        : 'none of the ' + SECRETS.length + ' planted strings reached the screen or the URL');

    /*
      ─────────── SEVERAL RECIPIENTS, AND ONE OF THEM IS PRIMARY (WO-5.8) ───────────

      SIX CHECKS, DRIVEN THROUGH THE TWO REAL CHIP ROWS AND PUT BACK WHERE THEY WERE FOUND. They
      sit here, immediately after the picker is first read, because this is the one moment in the
      section where the state is known exactly: the flow has just opened on Ada from the signal
      card, on a praise draft to Guardian 1, with nothing typed into it. The last of the six
      restores that state, so everything below reads the draft it always read.

      THE FIXTURE'S THIRD GUARDIAN IS WHAT MAKES ACCEPTANCE LINE 1 EXPRESSIBLE — *two guardians and
      a counselor* — and the second guardian keeps her missing address, so the row a tap must
      refuse sits between two rows a tap must take.

      WHAT IS ASKED HERE THAT THE MODULE CHECKS AT THE FOOT OF THIS FILE CANNOT. WO-5.14 proved the
      three builders carry a list; nothing on the screen could hand them one. These six prove the
      screen now does: that the primary is alone in `to` and the rest join the copy-to-self in
      `cc`, in the picker's order, in the URL the operating system would actually receive.
    */
    const several = await evalJs(`(function(){
      ${DRAWN}
      var was = drawn();
      /* Both taps through the real chips and the one delegated listener in src/shell.js. */
      document.querySelector('[data-outreach-to="guardian-2"]').click();
      document.querySelector('[data-outreach-to="counselor"]').click();
      var d = drawn();
      var m = window.planbook.outreachView.outreachModel();
      var href = d.href || '';
      var q = href.indexOf('?');
      var params = {};
      (q < 0 ? '' : href.slice(q + 1)).split('&').forEach(function(pair){
        var at = pair.indexOf('=');
        if (at > 0) params[pair.slice(0, at)] = pair.slice(at + 1); });
      return { asked: !document.getElementById('outreachConfirmModal')
          .classList.contains('hidden'),
        chosen: m.recipients.filter(function(r){ return r.chosen; }).length,
        primaries: m.recipients.filter(function(r){ return r.primary; }).length,
        recipient: m.recipient ? m.recipient.key : '',
        copies: m.copies.map(function(r){ return r.key + ':' + r.email; }),
        chips: d.chips, primaryShown: d.primaryShown, primaryChips: d.primaryChips,
        primaryNote: d.primaryNote, toNote: d.toNote, status: d.status,
        ready: m.ready, head: d.head, reasons: d.reasons,
        bodySame: d.bodyField === was.bodyField, subjectSame: d.subjectField === was.subjectField,
        to: href.slice('mailto:'.length, q < 0 ? href.length : q), cc: params.cc || '',
        /* THE ADDRESS PARTS ONLY, and that is the difference between a real draft and the
           hand-built ones at the foot of this file. encodeURIComponent turns every comma into
           %2C, and a body that opens "Dear Wo53Guardian One," has one — so a search over the
           whole URL is a search that can never pass here. What RFC 6068 § 2 is about is the
           separator BETWEEN addresses, so that is what is read. */
        pctComma: /%2c/i.test(href.slice('mailto:'.length, q < 0 ? href.length : q)
          + '|' + (params.cc || '')),
        clip: m.clipboard.split('\\n').slice(0, 2) }; })()`);
    check('two guardians and a counselor go on ONE draft — the third guardian and the counselor '
      + 'tapped onto a message already written to the first — with exactly one of the three marked '
      + 'primary, the second chip row appearing because there is now something to ask, and NOT ONE '
      + 'CHARACTER of the subject or the body moving: a recipient joining the Cc rebuilds nothing, '
      + 'because the resolve ran against the primary and the primary has not changed (Acceptance '
      + 'line 1)',
      several.asked === false && several.chosen === 3 && several.primaries === 1
        && several.recipient === 'guardian-0'
        && several.bodySame === true && several.subjectSame === true && several.ready === true
        && several.chips[0] === 'guardian-0|Guardian 1|on|live'
        && several.chips[1] === 'guardian-1|Guardian 2|off|refused'
        && several.chips[2] === 'guardian-2|Guardian 3|on|live'
        && several.chips[3] === 'counselor|Counselor|on|live'
        && several.chips[4] === 'admin|Admin|off|live'
        && several.primaryShown === true
        && several.primaryChips.join(' · ') === 'guardian-0|Guardian 1|on · '
          + 'guardian-2|Guardian 3|off · counselor|Counselor|off',
      'chosen ' + several.chosen + ', primary ' + several.recipient + ', row two = '
        + several.primaryChips.join(' · ') + '; draft untouched = '
        + String(several.bodySame && several.subjectSame));
    /*
      THE SELECTION REACHES THE URL, IN THE HEADER WO-5.14 RULED ON (Acceptance line 3). The
      primary alone in the `to` part; the other two recipients and then the copy-to-self in `cc=`,
      comma-separated with the comma LITERAL — which is the defect that fixture cannot see with one
      address and the reason the `cc` string is compared whole rather than searched. The clipboard
      block is read in the same breath because it is a second serialiser of the same four fields
      and its `Cc:` line is built from the same list: the two doors disagreeing about who is on the
      message is exactly the shape src/outreach.js's one-draft-object rule exists to prevent.
    */
    check('and every chosen recipient reaches the compose URL, in Cc, in the picker’s own order '
      + 'with the teacher’s own copy last: the primary is ALONE in the `to` part, `cc=` carries '
      + 'Guardian 3, the counselor and the teacher joined by literal commas with no %2C anywhere, '
      + 'and the clipboard block’s `To:` and `Cc:` lines say the same thing in the same order. '
      + 'The %2C is looked for in the address parts alone, because a body that opens "Dear '
      + 'Wo53Guardian One," puts one in the URL by construction (Acceptance line 3)',
      several.to === G1_EMAIL
        && several.cc === G3_EMAIL + ',' + COUNSELOR_EMAIL + ',' + TEACHER_EMAIL
        && several.pctComma === false
        && several.clip[0] === 'To: Wo53Guardian One <' + G1_EMAIL + '>'
        && several.clip[1] === 'Cc: ' + G3_EMAIL + ', ' + COUNSELOR_EMAIL + ', ' + TEACHER_EMAIL
        /* AND THE STRIP SAYS WHO IS ON IT BEFORE SHE TAPS, which is the sentence a teacher reads
           in place of reading a URL. */
        && several.reasons.some((r) => /addressed to Wo53Guardian One, copying Wo53Guardian Three and Wo53Counselor, copied to you/.test(r)),
      'to = ' + several.to + ' :: cc = ' + several.cc + ' :: ' + several.clip.join(' / '));

    /*
      THE PRIMARY MOVES AND THE SELECTION DOES NOT (Acceptance lines 1 and 2). Guardian 3 is
      promoted from row two; the other two stay on the message and the demoted primary joins the
      Cc. `{{guardian.name}}` is the whole of Acceptance line 2 and is asserted as a PAIR — the new
      name in the salutation AND the old one gone from the body — because a resolver that appended
      rather than replaced would pass a search for the first alone.
    */
    const promoted = await evalJs(`(function(){
      ${DRAWN}
      document.querySelector('[data-outreach-primary="guardian-2"]').click();
      var d = drawn();
      var m = window.planbook.outreachView.outreachModel();
      var href = d.href || '';
      var q = href.indexOf('?');
      var params = {};
      (q < 0 ? '' : href.slice(q + 1)).split('&').forEach(function(pair){
        var at = pair.indexOf('=');
        if (at > 0) params[pair.slice(0, at)] = pair.slice(at + 1); });
      return { asked: !document.getElementById('outreachConfirmModal')
          .classList.contains('hidden'),
        chosen: m.recipients.filter(function(r){ return r.chosen; }).length,
        primaries: m.recipients.filter(function(r){ return r.primary; }).length,
        recipient: m.recipient ? m.recipient.key : '',
        copies: m.copies.map(function(r){ return r.key + ':' + r.email; }),
        body: d.bodyField, reasons: d.reasons, toNote: d.toNote,
        primaryNote: d.primaryNote, primaryChips: d.primaryChips, status: d.status,
        to: href.slice('mailto:'.length, q < 0 ? href.length : q), cc: params.cc || '',
        ready: m.ready }; })()`);
    check('promoting Guardian 3 in the second row re-resolves every merge field against HER — the '
      + 'salutation reads "Dear Wo53Guardian Three" and the first guardian’s name is gone from the '
      + 'body altogether — while the selection is untouched: all three are still on the message, '
      + 'the demoted primary simply moves into Cc and the To part becomes the new primary’s '
      + 'address alone. And three separate places on the panel say who that is — the line under '
      + 'row one, the line under row two and the block strip (Acceptance lines 1 and 2)',
      promoted.asked === false && promoted.chosen === 3 && promoted.primaries === 1
        && promoted.recipient === 'guardian-2' && promoted.ready === true
        && /Dear Wo53Guardian Three,/.test(promoted.body)
        && promoted.body.indexOf('Wo53Guardian One') < 0
        && promoted.copies.join(' · ') === 'guardian-0:' + G1_EMAIL + ' · counselor:'
          + COUNSELOR_EMAIL
        && promoted.to === G3_EMAIL
        && promoted.cc === G1_EMAIL + ',' + COUNSELOR_EMAIL + ',' + TEACHER_EMAIL
        && promoted.primaryChips.join(' · ') === 'guardian-0|Guardian 1|off · '
          + 'guardian-2|Guardian 3|on · counselor|Counselor|off'
        && promoted.toNote.indexOf('Wo53Guardian Three · ' + G3_EMAIL) === 0
        && /copied to Wo53Guardian One, Wo53Counselor/.test(promoted.toNote)
        && /Addressed to Wo53Guardian Three/.test(promoted.primaryNote)
        && promoted.reasons.some((r) => /addressed to Wo53Guardian Three/.test(r))
        && /rebuilt for Wo53Guardian Three/.test(promoted.status)
        && /nothing was lost/i.test(promoted.status),
      'primary ' + promoted.recipient + ', copies ' + promoted.copies.join(' · ')
        + '; to = ' + promoted.to + ', cc = ' + promoted.cc + '; "'
        + String(promoted.body).slice(0, 34) + '…"');

    /*
      WO-5.6's CONFIRM, AND THE PAIR IS THE POINT (Acceptance line 5). The same edited draft is
      tapped twice: once on a row-one chip, which must go straight through because it changes
      nothing in either box, and once on a row-two chip, which must ask because it rebuilds both.
      A check that only asserted the second half would pass over a build that had put a dialog on
      every tap — which is the thing WO-5.6's own header warns teaches people to dismiss dialogs —
      and one that only asserted the first would pass over a build that had stopped asking at all.

      THE PANEL STILL NAMES NOBODY, checked here as well as at the check further down that owns the
      claim, because this is the first time it can be raised from a row that did not exist when
      that one was written.
    */
    const asking = await evalJs(`(function(){
      ${TYPE}
      ${DRAWN}
      var was = drawn().bodyField;
      var mine = was + ' A sentence I typed myself.';
      type('outreachBody', mine);
      document.querySelector('[data-outreach-to="student"]').click();
      var member = drawn();
      var memberAsked = !document.getElementById('outreachConfirmModal')
        .classList.contains('hidden');
      document.querySelector('[data-outreach-primary="guardian-0"]').click();
      var panel = document.getElementById('outreachConfirmModal');
      var primaryAsked = !panel.classList.contains('hidden');
      var lead = document.getElementById('outreachConfirmLead').textContent;
      var panelText = panel.textContent;
      document.querySelector('[data-outreach-rebuild-cancel]').click();
      var after = drawn();
      var m = window.planbook.outreachView.outreachModel();
      type('outreachBody', was);
      return { memberAsked: memberAsked, memberBody: member.bodyField, mine: mine,
        memberChosen: member.chips.filter(function(c){ return c.indexOf('|on|') >= 0; }).length,
        memberStatus: member.status,
        primaryAsked: primaryAsked, lead: lead, panelText: panelText,
        stillPrimary: m.recipient ? m.recipient.key : '', stillBody: after.bodyField,
        chosenAfter: m.recipients.filter(function(r){ return r.chosen; }).length }; })()`);
    check('changing the recipients obeys WO-5.6’s confirm and adds no second rule of its own — '
      + 'over one edited draft, a row-one tap that puts the student on the Cc goes straight '
      + 'through and leaves both boxes byte-identical, and a row-two tap that would write the '
      + 'message to somebody else ASKS. Cancelling leaves the primary, the selection and the '
      + 'teacher’s own sentence exactly where they were, and the panel quotes the chip’s POSITION '
      + 'and names no student, no guardian and no address (Acceptance line 5)',
      asking.memberAsked === false && asking.memberBody === asking.mine
        && asking.memberChosen === 4 && /untouched/.test(asking.memberStatus)
        && asking.primaryAsked === true && /Guardian 1/.test(asking.lead)
        && asking.stillPrimary === 'guardian-2' && asking.stillBody === asking.mine
        && asking.chosenAfter === 4
        && SECRETS.every((w) => asking.panelText.indexOf(w) < 0)
        && asking.panelText.indexOf('Wo53Guardian') < 0
        && asking.panelText.indexOf('Wo53Counselor') < 0
        && asking.panelText.indexOf('Wo53Full') < 0
        && asking.panelText.indexOf(G1_EMAIL) < 0 && asking.panelText.indexOf(G3_EMAIL) < 0,
      'row one asked = ' + asking.memberAsked + ' (draft intact = '
        + String(asking.memberBody === asking.mine) + '), row two asked = ' + asking.primaryAsked
        + '; lead “' + String(asking.lead).slice(0, 70) + '…”');

    /*
      THE SECOND ROW AT 390px UNDER A COARSE POINTER. The touch pass further down measures every
      control in this modal, but it runs over a draft with ONE recipient on it — which is exactly
      when this row is not drawn, so it would count four chips that were not there and pass. Four
      are on the message at this instant, so the row is real, and it is measured by its own hook
      rather than by a count for the reason that pass gives about WO-5.7's copy control: a floor
      that reached every control except the new one passes a count and fails a thumb.
    */
    await send('Emulation.setDeviceMetricsOverride',
      { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await new Promise(r => setTimeout(r, 300));
    const primaryTouch = await evalJs(`(function(){
      var out = [];
      document.querySelectorAll('#outreachPrimary [data-outreach-primary], '
        + '#outreachRecipients [data-outreach-to]').forEach(function(e){
          var r = e.getBoundingClientRect();
          out.push({ row: e.hasAttribute('data-outreach-primary') ? 'primary' : 'to',
            key: e.getAttribute('data-outreach-primary') || e.getAttribute('data-outreach-to'),
            w: Math.round(r.width * 100) / 100, h: Math.round(r.height * 100) / 100 }); });
      var doc = document.documentElement;
      return { controls: out, under: out.filter(function(m){ return m.h < 44 || m.w < 44; }),
        primaryCount: out.filter(function(m){ return m.row === 'primary'; }).length,
        shown: !document.getElementById('outreachPrimaryRow').classList.contains('hidden'),
        coarse: matchMedia('(pointer: coarse)').matches,
        sideways: doc.scrollWidth - doc.clientWidth }; })()`);
    check('every chip in BOTH recipient rows measures at least 44px on both axes at 390px under a '
      + 'coarse pointer — the six in row one, including the dashed one a tap is refused on, and '
      + 'the four in the row WO-5.8 added, which is drawn here because four people are on this '
      + 'message — and the second row puts the panel into no sideways scroll',
      primaryTouch.coarse === true && primaryTouch.shown === true
        && primaryTouch.primaryCount === 4 && primaryTouch.controls.length === 10
        && primaryTouch.under.length === 0 && primaryTouch.sideways <= 0,
      primaryTouch.controls.length + ' chip(s) measured across the two rows, '
        + primaryTouch.primaryCount + ' of them in the new one, ' + primaryTouch.under.length
        + ' under 44px' + (primaryTouch.under.length
          ? ': ' + JSON.stringify(primaryTouch.under) : '')
        + ', sideways scroll ' + primaryTouch.sideways + 'px');
    await send('Emulation.setDeviceMetricsOverride',
      { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await new Promise(r => setTimeout(r, 200));

    /*
      AND THE BLOCK PUTS THE FLOW BACK WHERE IT FOUND IT, which every block in this section that
      moves state does. The last tap is the one that proves the other half of "exactly one primary
      at all times": the primary's own row-one chip is tapped and REFUSED, because taking her off
      would leave a message written to nobody and would be the one membership tap that had to
      rebuild. That refusal names a POSITION and no person, so it is safe on a line a projector can
      reach — asserted rather than assumed.
    */
    const restored = await evalJs(`(function(){
      ${DRAWN}
      document.querySelector('[data-outreach-primary="guardian-0"]').click();
      var backAsked = !document.getElementById('outreachConfirmModal').classList.contains('hidden');
      document.querySelector('[data-outreach-to="student"]').click();
      document.querySelector('[data-outreach-to="counselor"]').click();
      document.querySelector('[data-outreach-to="guardian-2"]').click();
      var alone = drawn();
      document.querySelector('[data-outreach-to="guardian-0"]').click();
      var d = drawn();
      var m = window.planbook.outreachView.outreachModel();
      var href = d.href || '';
      var q = href.indexOf('?');
      var params = {};
      (q < 0 ? '' : href.slice(q + 1)).split('&').forEach(function(pair){
        var at = pair.indexOf('=');
        if (at > 0) params[pair.slice(0, at)] = pair.slice(at + 1); });
      return { backAsked: backAsked,
        chosen: m.recipients.filter(function(r){ return r.chosen; }).length,
        recipient: m.recipient ? m.recipient.key : '', copies: m.copies.length,
        rowShown: alone.primaryShown, rowChips: alone.primaryChips.length,
        rowNote: alone.primaryNote, status: d.status, toNote: d.toNote,
        body: d.bodyField, ready: m.ready, hasHref: d.hasHref,
        to: href.slice('mailto:'.length, q < 0 ? href.length : q), cc: params.cc || '' }; })()`);
    check('and the block leaves the flow as it found it — written to Guardian 1, nobody else on '
      + 'the message, the second row and its line of type gone because there is nothing left to '
      + 'ask, and `cc=` back to the teacher’s own copy alone. The last tap is on the primary’s own '
      + 'chip and is REFUSED in a sentence that quotes her position and names no person: taking '
      + 'the primary off is the one membership tap that would have had to rebuild, and it is '
      + 'refused rather than made an exception for',
      restored.backAsked === false && restored.chosen === 1 && restored.copies === 0
        && restored.recipient === 'guardian-0' && restored.ready === true
        && restored.hasHref === true && restored.to === G1_EMAIL
        && restored.cc === TEACHER_EMAIL
        && restored.rowShown === false && restored.rowChips === 0 && restored.rowNote === ''
        && /Dear Wo53Guardian One,/.test(restored.body)
        && /^Guardian 1 is who this message is written to/.test(restored.status)
        && restored.status.indexOf('Wo53Guardian') < 0,
      'chosen ' + restored.chosen + ', primary ' + restored.recipient + ', cc = ' + restored.cc
        + '; refusal “' + String(restored.status).slice(0, 90) + '…”');

    /*
      ─────────── WO-5.3's SEVENTH ACCEPTANCE LINE, AS WO-5.13 REVERSED HALF OF IT ───────────

      IT WAS SIX NUMBERS ABOUT ONE CALL AND IT IS NOW TWO CLAIMS ABOUT TWO CALLERS, because on
      2026-09-20 the owner ruled that "all templates should be available regardless of recipient"
      and src/outreach-view.js stopped passing the third argument. What did NOT change is
      src/templates.js, so the two halves are asked of the two different things that hold them:

        THE COLLECTION still files by audience and still answers on it when it is asked — WO-5.2's
        first Acceptance line, unchanged, and the reason `templatesFor()` kept its signature:

          praise/guardian   3   the pair's praise half, plus the long one and the refused one
          concern/guardian  1   the pair's concern half — a different record, never handed back above
          concern/counselor 1   written for somebody else
          praise/counselor  0   THE NUMBER THAT CATCHES A TONE-ONLY COLLECTION, which answers 3 here

        THE SEND FLOW asks the tone and nothing else, which is the reversal itself:

          concern/''        2   BOTH concern templates — including the counselor's, which is the one
                                the old filter withheld from a draft addressed to a guardian
          praise/''         3   and no concern template among them, which is the half that stayed

      A tone-only read is the right answer here and was the WRONG answer one build ago, so the
      numbers alone cannot say which build they came from. The picker check below is what settles
      it: it asks the `<select>` a teacher taps, with the draft addressed to a guardian, and a build
      that had kept the filter draws one row where this one draws two.
    */
    const pairs = await evalJs(`(function(){
      var d = window.planbook.store.getDoc();
      var t = window.planbook.templates;
      var ids = function(list){ return list.map(function(r){ return r.id; }); };
      var pg = t.templatesFor(d, 'praise', 'guardian');
      var cg = t.templatesFor(d, 'concern', 'guardian');
      var cAll = t.templatesFor(d, 'concern', '');
      var pAll = t.templatesFor(d, 'praise', '');
      return { pg: pg.length, cg: cg.length,
        cc: t.templatesFor(d, 'concern', 'counselor').length,
        pc: t.templatesFor(d, 'praise', 'counselor').length,
        anyGuardian: t.templatesFor(d, '', 'guardian').length,
        cAll: cAll.length, pAll: pAll.length,
        toneOverlap: ids(cAll).filter(function(id){ return ids(pAll).indexOf(id) >= 0; }).length,
        overlap: ids(pg).filter(function(id){ return ids(cg).indexOf(id) >= 0; }).length }; })()`);
    check('the COLLECTION still tells a concern template and a praise template for the same '
      + 'audience apart — praise/guardian and concern/guardian hand back different records and '
      + 'praise/counselor hands back NONE (WO-5.2, unchanged) — and the read the SEND FLOW makes '
      + 'since WO-5.13 names the tone and not the audience, so concern/any-audience hands back BOTH '
      + 'concern templates including the counselor’s, with no praise record anywhere in it (Acceptance '
      + 'line 7, as reversed)',
      pairs.pg === 3 && pairs.cg === 1 && pairs.cc === 1 && pairs.pc === 0
        && pairs.anyGuardian === 4 && pairs.overlap === 0
        && pairs.cAll === 2 && pairs.pAll === 3 && pairs.toneOverlap === 0,
      'praise/guardian ' + pairs.pg + ', concern/guardian ' + pairs.cg + ', concern/counselor '
        + pairs.cc + ', praise/counselor ' + pairs.pc + ', any-tone/guardian ' + pairs.anyGuardian
        + ', shared records ' + pairs.overlap + ' :: the send flow’s own read — concern/any '
        + pairs.cAll + ', praise/any ' + pairs.pAll + ', shared across the two tones '
        + pairs.toneOverlap);

    const toned = await evalJs(`(function(){
      ${DRAWN}
      var was = drawn().options;
      document.querySelector('#outreachTones [data-outreach-tone="concern"]').click();
      var now = drawn();
      var m = window.planbook.outreachView.outreachModel();
      return { was: was, now: now.options, tone: m.tone, name: m.templateName,
        to: m.recipient ? m.recipient.key : '', audience: m.audience,
        rebuilt: now.bodyField, status: document.getElementById('outreachStatus').textContent,
        ready: m.ready }; })()`);
    check('and the picker on screen says the same thing, with the draft still addressed to a '
      + 'guardian: tapping Concern replaces the three praise templates with BOTH concern ones — '
      + 'the guardian’s and the counselor’s, which is the row a build that had kept the audience '
      + 'filter cannot draw — no praise template survives the tap, and the draft is rebuilt from '
      + 'the first of them rather than left as the old words under a new heading',
      toned.was.length === 3 && toned.now.length === 2 && toned.tone === 'concern'
        && toned.to === 'guardian-0' && toned.audience === 'guardian'
        && toned.now.indexOf('WO-5.3 to the counselor') >= 0
        && toned.now.every((n) => toned.was.indexOf(n) < 0)
        && toned.name === 'WO-5.3 concern to a guardian'
        && /pieces of work marked missing/.test(toned.rebuilt) && toned.ready === true
        && /rebuilt/i.test(toned.status),
      JSON.stringify({ was: toned.was, now: toned.now, to: toned.to, name: toned.name }));

    /*
      ─────────── THE URL, WHICH IS THE WHOLE OF WHAT THE OPERATING SYSTEM RECEIVES ───────────

      WO-5.3's Traps line names three things to test — an apostrophe, an em dash and a multi-
      paragraph body — and the fixture carries all three plus the two characters that break a
      `mailto:` silently rather than visibly: `&`, which starts a new header, and `#`, which
      truncates everything after it into a fragment.

      THE STRONGEST FORM OF THIS CHECK IS A ROUND TRIP. Decoding the body back out of the URL and
      comparing it to the box on screen — with the CRLF that RFC 6068 asks for put back — is one
      assertion that covers every character rather than a list of the ones somebody thought of.
    */
    await evalJs(`(function(){
      document.querySelector('#outreachTones [data-outreach-tone="praise"]').click();
      return 1; })()`);
    await new Promise(r => setTimeout(r, 150));
    const url = await evalJs(`(function(){
      ${DRAWN}
      var d = drawn();
      var href = d.href || '';
      var q = href.indexOf('?');
      var to = href.slice('mailto:'.length, q < 0 ? href.length : q);
      var params = {};
      (q < 0 ? '' : href.slice(q + 1)).split('&').forEach(function(pair){
        var at = pair.indexOf('=');
        if (at > 0) params[pair.slice(0, at)] = pair.slice(at + 1); });
      var bodyRaw = params.body || '';
      var subjectRaw = params.subject || '';
      var crlf = (bodyRaw.match(/%0D%0A/g) || []).length;
      var bareLf = (bodyRaw.replace(/%0D%0A/g, '').match(/%0A/g) || []).length;
      return { href: href, to: to, keys: Object.keys(params),
        cc: params.cc || '',
        decodedBody: decodeURIComponent(bodyRaw),
        decodedSubject: decodeURIComponent(subjectRaw),
        bodyField: d.bodyField, subjectField: d.subjectField,
        crlf: crlf, bareLf: bareLf,
        rawNewline: /[\\r\\n]/.test(href),
        curly: bodyRaw.indexOf('%E2%80%99') >= 0,
        emDash: subjectRaw.indexOf('%E2%80%94') >= 0,
        ampersand: subjectRaw.indexOf('%26') >= 0 && subjectRaw.indexOf('&') === -1,
        hash: bodyRaw.indexOf('%23') >= 0 && bodyRaw.indexOf('#') === -1,
        question: bodyRaw.indexOf('%3F') >= 0 && bodyRaw.indexOf('?') === -1,
        atKept: to.indexOf('@') > 0 && to.indexOf('%40') === -1,
        hasHref: d.hasHref, target: d.target, rel: d.rel }; })()`);
    check('the handoff link carries a `mailto:` URL addressed to the guardian with the `@` left '
      + 'literal, and the subject and the body ride in it as percent-encoded query parameters',
      /^mailto:/.test(url.href || '') && url.to === G1_EMAIL && url.atKept === true
        && url.keys.indexOf('subject') >= 0 && url.keys.indexOf('body') >= 0,
      (url.href || '').slice(0, 120) + '…');
    check('and it survives the round trip character for character: what decodes out of the URL is '
      + 'exactly what is in the box, with every line break encoded as %0D%0A per RFC 6068 § 5 and '
      + 'not one bare %0A — which is the half of this that goes wrong quietly, because a body that '
      + 'runs three paragraphs into one arrives looking like a message somebody typed badly',
      url.decodedBody === String(url.bodyField).replace(/\r\n|\r|\n/g, '\r\n')
        && url.decodedSubject === url.subjectField
        && url.crlf >= 3 && url.bareLf === 0 && url.rawNewline === false,
      url.crlf + ' CRLF pair(s), ' + url.bareLf + ' bare %0A, round trip = '
        + (url.decodedBody === String(url.bodyField).replace(/\r\n|\r|\n/g, '\r\n')));
    check('and all five characters WO-5.3 names or implies are encoded rather than passed through: '
      + 'the typographic apostrophe, the em dash, the ampersand that would otherwise start a new '
      + 'header, the hash that would truncate the message into a fragment, and the question mark',
      url.curly === true && url.emDash === true && url.ampersand === true && url.hash === true
        && url.question === true,
      JSON.stringify({ apostrophe: url.curly, emDash: url.emDash, ampersand: url.ampersand,
        hash: url.hash, question: url.question }));
    /* WO-5.11, STRUCK 2026-09-12 — THIS CHECK ASSERTS THE ABSENCE OF THE ATTRIBUTE IT WAS
       WRITTEN TO ASSERT. `target="_blank" rel="noopener"` was the obvious repair for a WEB
       `mailto:` handler (Gmail registered in Chrome) navigating the installed PWA's own window to
       Gmail's compose page, and on the laptop it was worse than the defect: Chrome opened a tab
       that sat BLANK on the `mailto:` URL and never reached the handler — from the installed app
       and from a plain tab alike — so the app stayed and no compose ever appeared. The iPad,
       which the work order had budgeted as the reading that could reverse it, passed. The
       attribute came out the same day and src/outreach-view.js's fourth reason at its header
       carries the readings. This line exists because `_blank` is the first thing the next hand
       will reach for on hitting Gmail-in-the-PWA, and a red line naming the reading is cheaper
       than a second afternoon on hardware. It is asserted on the READY draft, the one that is a
       link a click can follow; nothing is asserted on the blocked draft, whose claim is still the
       missing `href` the refused check below makes. The mutation that proves it is the attribute
       put back on the anchor in index.html, and it is the ONLY check in the run that reads
       `target` or `rel`. */
    check('and the ready link carries NO target (WO-5.11, struck): target="_blank" was read on '
      + 'hardware 2026-09-12 and a Chrome mailto: handler left a blank tab on the URL instead of '
      + 'a compose — the attribute came out and this line keeps it out; the readings are at '
      + 'src/outreach-view.js’s header',
      url.hasHref === true && url.target === null && url.rel === null,
      'href present = ' + url.hasHref + ', target = ' + JSON.stringify(url.target)
        + ', rel = ' + JSON.stringify(url.rel));

    /*
      ─────────── WO-5.12: THE WEBMAIL DOORS, AND THE ATTRIBUTE PAIR THAT TRAVELS WITH THE href ───────────

      THE CHECK ABOVE IS BYTE-IDENTICAL TO WHAT WO-5.11 LEFT, AND ITS LAST SENTENCE IS NOW HISTORY
      RATHER THAN FACT: it is no longer the only site in the run that reads `target` or `rel` —
      the checks below read both — but its claim is unchanged and still true, because the draft it
      reads is the `mailto:` one and a `_blank` `mailto:` is still the blank tab that struck that
      work order. What WO-5.12 changed is that the pair is now CONDITIONAL on something the model
      knows: the scheme of the `href`. With *Where does your mail live?* at Gmail or Outlook the
      link is an https compose page and carries `target="_blank" rel="noopener"`; at the default
      it is the `mailto:` and carries neither. Both halves are asserted here, on the same ready
      draft, driven through the real chips — because a build that set the attributes statically
      would pass the Gmail half and fail the check above, and a build that never set them would
      pass the check above and fail this one. The two are one fence read from either side.

      THE PREFERENCE IS DRIVEN THROUGH THE CHIP AND READ BACK THROUGH THE SEAM, so what is proved
      is the wiring and not the module: a tap on `[data-outreach-mail="gmail"]` has to reach
      src/shell.js's hook, src/outreach-view.js's setter, src/prefs.js's writer, and a repaint that
      rebuilt the `href` from the new answer. And the document is read before and after, byte for
      byte, because the Traps line's whole argument is that this is the browser's fact and not the
      teacher's — a preference that reached the year document would sync to the iPad and be wrong
      there by construction.
    */
    const gmail = await evalJs(`(async function(){
      ${DRAWN}
      await window.planbook.store.flush();
      var d0 = window.planbook.store.getDoc();
      var docBefore = JSON.stringify(d0), revBefore = d0.rev;
      var chipsBefore = Array.prototype.map.call(
        document.querySelectorAll('#outreachMail [data-outreach-mail]'), function(b){
          return b.getAttribute('data-outreach-mail') + ':' + b.getAttribute('aria-pressed'); });
      document.querySelector('#outreachMail [data-outreach-mail="gmail"]').click();
      var d = drawn();
      var m = window.planbook.outreachView.outreachModel();
      var href = d.href || '';
      var q = href.indexOf('?');
      var params = {};
      (q < 0 ? '' : href.slice(q + 1)).split('&').forEach(function(pair){
        var at = pair.indexOf('=');
        if (at > 0) params[pair.slice(0, at)] = pair.slice(at + 1); });
      var bodyRaw = params.body || '';
      await window.planbook.store.flush();
      var d1 = window.planbook.store.getDoc();
      return { href: href, hasHref: d.hasHref, target: d.target, rel: d.rel,
        keys: Object.keys(params), to: params.to || '', cc: params.cc || '',
        decodedBody: decodeURIComponent(bodyRaw),
        decodedSubject: decodeURIComponent(params.su || ''),
        bodyField: d.bodyField, subjectField: d.subjectField,
        lf: (bodyRaw.match(/%0A/g) || []).length, cr: (bodyRaw.match(/%0D/g) || []).length,
        hash: bodyRaw.indexOf('%23') >= 0 && bodyRaw.indexOf('#') === -1,
        pref: window.planbook.getPref('mailDoor'),
        stored: localStorage.getItem('planbook_mailDoor'),
        modelMail: m.mail, https: m.https, ready: m.ready,
        chipsBefore: chipsBefore,
        chips: Array.prototype.map.call(
          document.querySelectorAll('#outreachMail [data-outreach-mail]'), function(b){
            return b.getAttribute('data-outreach-mail') + ':' + b.getAttribute('aria-pressed')
              + ':' + (b.classList.contains('active') ? 'on' : 'off'); }),
        note: document.getElementById('outreachMailNote').textContent,
        strip: d.reasons.join(' '),
        ariaLabel: document.getElementById('outreachOpen').getAttribute('aria-label') || '',
        docSame: JSON.stringify(d1) === docBefore, revBefore: revBefore, revAfter: d1.rev }; })()`);
    check('WO-5.12: tapping *Gmail in the browser* rebuilds the ready draft’s href as an https URL '
      + 'on mail.google.com — view=cm, carrying `to`, `su` and `body` — and the anchor now wears '
      + 'target="_blank" and a rel containing noopener; the chip reads pressed, the note and the '
      + 'strip name Gmail and a browser tab, and the preference is `planbook_mailDoor` read back '
      + 'as "gmail" through the seam (Acceptance line 1, first half)',
      /^https:\/\/mail\.google\.com\/mail\/\?view=cm&fs=1&/.test(gmail.href)
        && gmail.hasHref === true && gmail.target === '_blank'
        && /\bnoopener\b/.test(gmail.rel || '')
        && gmail.keys.indexOf('to') >= 0 && gmail.keys.indexOf('su') >= 0
        && gmail.keys.indexOf('body') >= 0 && gmail.to === G1_EMAIL
        && gmail.pref === 'gmail' && gmail.stored === '"gmail"' && gmail.modelMail === 'gmail'
        && gmail.https === true && gmail.ready === true
        && gmail.chipsBefore.join(',') === 'default:true,gmail:false,outlook:false'
        && gmail.chips.join(',') === 'default:false:off,gmail:true:on,outlook:false:off'
        && /Gmail/.test(gmail.note) && /browser tab/.test(gmail.note)
        && /Gmail, in a browser tab/.test(gmail.strip) && /Gmail/.test(gmail.ariaLabel),
      gmail.href.slice(0, 90) + '… target = ' + JSON.stringify(gmail.target) + ', rel = '
        + JSON.stringify(gmail.rel) + ', pref = ' + JSON.stringify(gmail.pref) + ', chips '
        + gmail.chips.join(' '));
    check('and the Gmail body survives its own round trip with LF line breaks — a compose page is '
      + 'a web page and not a mailto: handler, so RFC 6068’s CRLF does not carry (src/outreach.js '
      + '§ the webmail compose URL); the subject rides in `su`, the copy-to-self in `cc`, and the '
      + 'hash is still encoded rather than passed through',
      gmail.decodedBody === String(gmail.bodyField).replace(/\r\n|\r|\n/g, '\n')
        && gmail.decodedSubject === gmail.subjectField && gmail.lf >= 3 && gmail.cr === 0
        && gmail.hash === true && gmail.cc.indexOf(TEACHER_EMAIL) >= 0,
      gmail.lf + ' LF, ' + gmail.cr + ' CR, round trip = '
        + (gmail.decodedBody === String(gmail.bodyField).replace(/\r\n|\r|\n/g, '\n'))
        + ', cc = ' + gmail.cc);
    check('and choosing a door wrote NOTHING to the year document — it is byte-identical either '
      + 'side of the tap and `rev` has not moved, because where this browser’s mail lives is the '
      + 'device’s fact and never the teacher’s (Acceptance line 4, the half a fixture can prove)',
      gmail.docSame === true && gmail.revAfter === gmail.revBefore,
      'document identical = ' + gmail.docSame + ', rev ' + gmail.revBefore + ' → '
        + gmail.revAfter);

    const outlook = await evalJs(`(function(){
      ${DRAWN}
      document.querySelector('#outreachMail [data-outreach-mail="outlook"]').click();
      var d = drawn();
      var m = window.planbook.outreachView.outreachModel();
      var href = d.href || '';
      var q = href.indexOf('?');
      var params = {};
      (q < 0 ? '' : href.slice(q + 1)).split('&').forEach(function(pair){
        var at = pair.indexOf('=');
        if (at > 0) params[pair.slice(0, at)] = pair.slice(at + 1); });
      return { href: href, hasHref: d.hasHref, target: d.target, rel: d.rel,
        keys: Object.keys(params), to: params.to || '',
        decodedBody: decodeURIComponent(params.body || ''),
        decodedSubject: decodeURIComponent(params.subject || ''),
        bodyField: d.bodyField, subjectField: d.subjectField,
        pref: window.planbook.getPref('mailDoor'), modelMail: m.mail, https: m.https,
        note: document.getElementById('outreachMailNote').textContent,
        strip: d.reasons.join(' ') }; })()`);
    check('tapping *Outlook on the web* rebuilds it as an https URL on outlook.office.com — '
      + 'mail/deeplink/compose, carrying `to`, `subject` and `body` — with the same attribute '
      + 'pair on the anchor, the same LF round trip, and the preference read back as "outlook"',
      /^https:\/\/outlook\.office\.com\/mail\/deeplink\/compose\?/.test(outlook.href)
        && outlook.hasHref === true && outlook.target === '_blank'
        && /\bnoopener\b/.test(outlook.rel || '')
        && outlook.keys.indexOf('to') >= 0 && outlook.keys.indexOf('subject') >= 0
        && outlook.keys.indexOf('body') >= 0 && outlook.to === G1_EMAIL
        && outlook.decodedBody === String(outlook.bodyField).replace(/\r\n|\r|\n/g, '\n')
        && outlook.decodedSubject === outlook.subjectField
        && outlook.pref === 'outlook' && outlook.modelMail === 'outlook' && outlook.https === true
        && /Outlook on the web/.test(outlook.note) && /Outlook on the web/.test(outlook.strip),
      outlook.href.slice(0, 90) + '… target = ' + JSON.stringify(outlook.target) + ', rel = '
        + JSON.stringify(outlook.rel) + ', pref = ' + JSON.stringify(outlook.pref));

    const backToDefault = await evalJs(`(function(){
      ${DRAWN}
      document.querySelector('#outreachMail [data-outreach-mail="default"]').click();
      var d = drawn();
      var m = window.planbook.outreachView.outreachModel();
      /* The setter refuses a word that is not one of the three, rather than rounding it to the
         default and writing that: asked directly, because no chip in the markup carries one. */
      var refusedWord = window.planbook.outreachView.setOutreachMailDoor('yahoo');
      var afterRefusal = window.planbook.getPref('mailDoor');
      return { href: d.href || '', hasHref: d.hasHref, target: d.target, rel: d.rel,
        pref: window.planbook.getPref('mailDoor'), modelMail: m.mail, https: m.https,
        note: document.getElementById('outreachMailNote').textContent,
        strip: d.reasons.join(' '),
        chips: Array.prototype.map.call(
          document.querySelectorAll('#outreachMail [data-outreach-mail]'), function(b){
            return b.getAttribute('data-outreach-mail') + ':' + b.getAttribute('aria-pressed'); }),
        refusedWord: refusedWord, afterRefusal: afterRefusal }; })()`);
    check('and tapping *Default mail app* puts the mailto: back with NEITHER attribute on the '
      + 'anchor — the WO-5.11 shape, restored through the control rather than by a reload — with '
      + 'the strip back to "your own mail app", the preference read back as "default", and a word '
      + 'that is not one of the three refused by the setter rather than rounded and written '
      + '(Acceptance line 1, second half)',
      /^mailto:/.test(backToDefault.href) && backToDefault.hasHref === true
        && backToDefault.target === null && backToDefault.rel === null
        && backToDefault.pref === 'default' && backToDefault.modelMail === 'default'
        && backToDefault.https === false && /your own mail app/.test(backToDefault.strip)
        && /this device/.test(backToDefault.note)
        && backToDefault.chips.join(',') === 'default:true,gmail:false,outlook:false'
        && backToDefault.refusedWord === false && backToDefault.afterRefusal === 'default',
      backToDefault.href.slice(0, 40) + '… target = ' + JSON.stringify(backToDefault.target)
        + ', rel = ' + JSON.stringify(backToDefault.rel) + ', pref = '
        + JSON.stringify(backToDefault.pref) + ', "yahoo" refused = '
        + (backToDefault.refusedWord === false));

    /* ── copy to self ── */
    const copy = await evalJs(`(function(){
      ${DRAWN}
      var on = drawn();
      var m1 = window.planbook.outreachView.outreachModel();
      document.querySelector('[data-outreach-copy]').click();
      var off = drawn();
      var m2 = window.planbook.outreachView.outreachModel();
      document.querySelector('[data-outreach-copy]').click();
      var back = drawn();
      var d = window.planbook.store.getDoc();
      return { onHref: on.href, offHref: off.href, backHref: back.href,
        onModel: m1.cc.on, offModel: m2.cc.on,
        onLabel: on.ccLabel, offLabel: off.ccLabel, note: on.ccNote,
        stored: !!(d.teacher && d.teacher.defaultCc) }; })()`);
    check('copy-to-self is ON by default, from `teacher.defaultCc`, and it is a real `cc=` header '
      + 'on the URL rather than a promise — turning it off takes the header off and turning it back '
      + 'on puts it back',
      copy.onModel === true && /[?&]cc=/.test(copy.onHref || '')
        && (copy.onHref || '').indexOf(TEACHER_EMAIL) >= 0
        && copy.offModel === false && !/[?&]cc=/.test(copy.offHref || '')
        && /[?&]cc=/.test(copy.backHref || '') && /Copy me: on/.test(copy.onLabel),
      'on → ' + /cc=/.test(copy.onHref || '') + ', off → ' + /cc=/.test(copy.offHref || '')
        + ', back → ' + /cc=/.test(copy.backHref || ''));
    check('and the per-draft toggle writes NOTHING: `teacher.defaultCc` is still what it was, '
      + 'because a decision about this one message must not change the next forty',
      copy.stored === true && before.defaultCc === true,
      'teacher.defaultCc = ' + copy.stored);

    /* ── editable before sending, always ── */
    const edited = await evalJs(`(function(){
      ${TYPE}
      ${DRAWN}
      var was = drawn();
      type('outreachBody', 'I rewrote this by hand — every word of it.');
      var now = drawn();
      var m = window.planbook.outreachView.outreachModel();
      return { subjectBefore: was.subjectField, subjectAfter: now.subjectField,
        body: m.body, href: now.href,
        carried: decodeURIComponent((now.href || '').split('body=')[1] || ''),
        ready: m.ready }; })()`);
    check('every draft is editable in-app before the handoff, and what the link carries is what is '
      + 'in the box — the URL is rebuilt on the keystroke, and nothing re-resolves behind her: the '
      + 'subject she did not touch is the subject the resolver produced (Acceptance line 4)',
      edited.body === 'I rewrote this by hand — every word of it.'
        && edited.carried === 'I rewrote this by hand — every word of it.'
        && edited.subjectAfter === edited.subjectBefore && edited.ready === true,
      JSON.stringify({ body: edited.body, subjectUnchanged:
        edited.subjectAfter === edited.subjectBefore }));

    /*
      ─────────── A BLOCKED DRAFT CANNOT REACH THE HANDOFF ───────────

      Asked at the surface that matters: not "the model says blocked" but "there is no link". A
      disabled button is a control a teacher can still tab to and a script can still click; an
      anchor with no `href` is not a link at all.
    */
    const refused = await evalJs(`(function(){
      ${TYPE}
      ${DRAWN}
      ${AGREE}
      var ids = window.planbook.store.getDoc().templates.filter(function(t){
        return t.name.indexOf('refused') >= 0; })[0].id;
      /* The check above rewrote the body by hand, so this pick asks before it rebuilds (WO-5.6)
         and the answer is yes. What agree() hands back is asserted below rather than dropped.
         (No backticks in here; it is inside a template literal and one would close it.) */
      var askedFirst = agree(function(){ pick('outreachTemplate', ids); });
      var d = drawn();
      var m = window.planbook.outreachView.outreachModel();
      return { askedFirst: askedFirst,
        hasHref: d.hasHref, href: d.href, disabled: d.disabled, head: d.head,
        clear: d.clear, reasons: d.reasons, body: d.bodyField, ready: m.ready,
        focusable: (function(){
          var link = document.getElementById('outreachOpen');
          link.focus();
          return document.activeElement === link; })() }; })()`);
    check('a draft carrying a refused merge field cannot reach the handoff, and the refusal is '
      + 'STRUCTURAL: the link has no href at all, so it is not clickable, not focusable and carries '
      + 'no address — where a disabled button would still be a control with a URL on it '
      + '(Acceptance line 6)',
      refused.ready === false && refused.hasHref === false && refused.href === null
        && refused.disabled === 'true' && refused.focusable === false
        && refused.askedFirst === true,
      JSON.stringify({ href: refused.href, ariaDisabled: refused.disabled,
        focusable: refused.focusable, askedBeforeRebuilding: refused.askedFirst }));
    check('and the strip says why in the RESOLVER’S own words rather than in a second opinion '
      + 'of this screen’s — the token is still in the box exactly as the teacher typed it, and '
      + 'the sentence is the one src/merge-fields.js wrote about accommodation, medical and plan '
      + 'details never leaving the roster',
      refused.clear === false
        && /^This draft has at least one undefined field · \d+ thing(s)? to fix$/
          .test(refused.head)
        && refused.reasons.some((r) => /never leave the roster/.test(r))
        && refused.reasons.some((r) => /supports\.medical/.test(r))
        && refused.body.indexOf('{{supports.medical}}') >= 0
        && refused.body.indexOf('Wo53MedicalDetail') === -1,
      /* The RESOLVER's row, picked out by name rather than taken as reasons[0]: WO-5.5 put an
         instruction line at the top of the strip, and a detail string that printed whatever was
         first would quote this screen's sentence under a check about the resolver's. */
      refused.head + ' :: '
        + (refused.reasons.filter((r) => /never leave the roster/.test(r))[0] || '').slice(0, 110));
    /* WO-5.5 REWROTE THE HEAD ABOVE AND THIS CHECK IS THE OTHER HALF OF THAT LINE. The head is
       asserted whole — the owner's sentence AND the count after the `·` — because relaxing it to
       a substring is exactly the edit the work order's Traps line forbids, and because the count
       is what makes "at least one" honest when a missing address is on the list beside the field.
       The per-field sentences it sits over are src/merge-fields.js's, unchanged and asserted as
       such by the check above: this work order added a sentence and rewrote a heading. */
    check('and it says what to DO about it, which is the one sentence no resolver can write — '
      + 'every per-field line above is about the TOKEN, and this one is about the box the teacher '
      + 'types in, which is the only thing on the screen she can act on (WO-5.5)',
      refused.reasons.some((r) => /Remove the field or type what it should say over it/.test(r)
        && /unblocks the draft/.test(r)),
      refused.head + ' :: '
        + (refused.reasons.filter((r) => /unblocks the draft/.test(r))[0] || 'NO INSTRUCTION ROW'));

    /* WO-5.12, ON THE BLOCKED DRAFT: the refusal is the same under every door. The draft above is
       blocked by a refused merge field; each chip is tapped in turn and the anchor read after
       each. A build that painted `target` from the preference rather than from the `href` would
       leave a `_blank` on an anchor with no address here, which is the shape this reads for. */
    const blockedDoors = await evalJs(`(function(){
      ${DRAWN}
      var out = [];
      ['gmail', 'outlook', 'default'].forEach(function(door){
        document.querySelector('#outreachMail [data-outreach-mail="' + door + '"]').click();
        var d = drawn();
        var m = window.planbook.outreachView.outreachModel();
        out.push({ door: door, pref: window.planbook.getPref('mailDoor'), ready: m.ready,
          url: m.url, hasHref: d.hasHref, href: d.href, target: d.target, rel: d.rel,
          disabled: d.disabled }); });
      return out; })()`);
    check('a blocked draft has no href under ALL THREE doors — Gmail, Outlook and the default '
      + 'each tapped in turn over the refused draft, and each time the anchor carries no href, no '
      + 'target, no rel and aria-disabled, with the model’s url empty (Acceptance line 2)',
      blockedDoors.length === 3 && blockedDoors.every((r) => r.pref === r.door
        && r.ready === false && r.url === '' && r.hasHref === false && r.href === null
        && r.target === null && r.rel === null && r.disabled === 'true'),
      blockedDoors.map((r) => r.door + ': href ' + JSON.stringify(r.href) + ', target '
        + JSON.stringify(r.target) + ', rel ' + JSON.stringify(r.rel)).join(' · '));

    const fixedUp = await evalJs(`(function(){
      ${TYPE}
      ${DRAWN}
      type('outreachBody', 'I took the field out and wrote the sentence myself.');
      var d = drawn();
      return { hasHref: d.hasHref, clear: d.clear, head: d.head, reasons: d.reasons,
        carried: decodeURIComponent((d.href || '').split('body=')[1] || '') }; })()`);
    check('and typing over that field unblocks it — which is the resolver’s own sentence '
      + '("until it is corrected or removed") honoured at the end that can see the correction, and '
      + 'the reason the gate is what is on the page rather than what the resolve found',
      fixedUp.hasHref === true && fixedUp.clear === true
        && fixedUp.carried === 'I took the field out and wrote the sentence myself.'
        /* AND THE INSTRUCTION GOES WITH THE BLOCK (WO-5.5). Asserted here rather than in a check
           of its own because this is the pair that makes the sentence non-vacuous: a strip that
           printed it unconditionally would pass the check above it and would be telling a teacher
           to fix a draft that has nothing wrong with it. */
        && !fixedUp.reasons.some((r) => /unblocks the draft/.test(r)),
      fixedUp.head + ' :: link restored = ' + fixedUp.hasHref
        + ', instruction row(s) left = '
        + fixedUp.reasons.filter((r) => /unblocks the draft/.test(r)).length);

    /* ── a recipient with no address ──
       REWRITTEN AT WO-5.8, NOT RE-ASSERTED. Until 2026-09-20 this check clicked the addressless
       chip through agree() and read the draft going DEAD: she was choosable and then blocked,
       which src/outreach.js:114 argued for and which was the right answer while the picker held
       exactly one person. With several, that tap means *send this to her too* over a message that
       is finished, so the refusal moved to the door — src/outreach-view.js's
       toggleOutreachRecipient() argues the departure in full. A `.click()` that had been left
       standing would now be a no-op passing a check about a block, which is why this reads the
       refusal instead.

       IT IS DRIVEN OVER AN **EDITED** DRAFT ON PURPOSE, and that is the half the check in the
       WO-5.8 block above cannot make: the check before this one typed a sentence in place of a
       merge field, so a refusal that rebuilt on its way out would take that sentence with it and
       nothing else in this file would notice. */
    const noAddress = await evalJs(`(function(){
      ${DRAWN}
      var was = drawn();
      document.querySelector('[data-outreach-to="guardian-1"]').click();
      var d = drawn();
      var m = window.planbook.outreachView.outreachModel();
      return { asked: !document.getElementById('outreachConfirmModal').classList.contains('hidden'),
        chosen: m.recipients.filter(function(r){ return r.chosen; }).length,
        chip: d.chips[1], recipient: m.recipient ? m.recipient.key : '',
        hasHref: d.hasHref, head: d.head, reasons: d.reasons, ready: m.ready, clear: d.clear,
        bodySame: d.bodyField === was.bodyField, status: d.status, toNote: d.toNote }; })()`);
    check('a recipient with no email address on file CANNOT go on the message — the chip is drawn '
      + 'in her own position and stays a live button, the tap LANDS, and the door refuses it in a '
      + 'sentence that names what is missing. So the app never opens a mail window with an empty '
      + 'To field and never quietly drops somebody the teacher believes she wrote to, which is the '
      + 'third answer and the only forbidden one. The draft she had typed into is byte-identical '
      + 'afterwards: a refusal is not a rebuild (Acceptance line 4)',
      noAddress.asked === false && noAddress.chosen === 1
        && noAddress.recipient === 'guardian-0'
        && noAddress.chip === 'guardian-1|Guardian 2|off|refused'
        && /no email address on file for Wo53Guardian Two/.test(noAddress.status)
        && /cannot go on this message/.test(noAddress.status)
        && noAddress.bodySame === true
        && noAddress.hasHref === true && noAddress.ready === true && noAddress.clear === true,
      'chip = ' + noAddress.chip + ', still ' + noAddress.chosen + ' on the message; draft intact = '
        + noAddress.bodySame + '; “' + String(noAddress.status).slice(0, 110) + '…”');

    /* ── the ceiling ──
       THE TEMPLATE PICK GOES THROUGH agree() SINCE WO-5.8, and the reason is the check directly
       above: the addressless tap used to rebuild the draft on its way past and so left it
       unedited, and it does not rebuild anything any more. The sentence typed two checks up is
       still in the body, so the picker asks — which is WO-5.6 working, not a new behaviour — and
       the answer is yes. What agree() hands back is asserted below rather than dropped. The chip
       tap that used to stand here has gone with it: it was putting the recipient back from
       Guardian 2, and nothing moved it. */
    const long = await evalJs(`(function(){
      ${DRAWN}
      ${AGREE}
      var ids = window.planbook.store.getDoc().templates.filter(function(t){
        return t.name.indexOf('long') >= 0; })[0].id;
      var askedFirst = agree(function(){
        var n = document.getElementById('outreachTemplate');
        n.value = ids;
        n.dispatchEvent(new Event('change', { bubbles: true })); });
      var d = drawn();
      var m = window.planbook.outreachView.outreachModel();
      return { askedFirst: askedFirst,
        shown: d.lengthShown, text: d.lengthText, length: m.length, long: m.long,
        ceiling: window.planbook.outreach.MAILTO_CEILING, hasHref: d.hasHref,
        bodyLength: d.bodyField.length }; })()`);
    check('a body long enough to pass the practical `mailto:` ceiling WARNS BEFORE THE FACT and '
      + 'does not block — the app truncates nothing, the link still carries the whole message, and '
      + 'the warning names the number and the client that cuts there (Acceptance line 2)',
      long.long === true && long.shown === true && long.hasHref === true
        && long.length > long.ceiling && long.ceiling === 2000
        && String(long.text).indexOf(String(long.ceiling)) >= 0
        && /Outlook/.test(long.text) && /does not shorten/.test(long.text)
        /* The draft was still the teacher's own sentence when this pick arrived (WO-5.8's note at
           the fixture above), so the picker asked first and the answer was yes. Asserted rather
           than dropped, which is what the two other agree() sites in this section do. */
        && long.askedFirst === true,
      long.length + ' encoded characters over a ceiling of ' + long.ceiling + ' (the body itself is '
        + long.bodyLength + '), link still live = ' + long.hasHref + ', asked before rebuilding = '
        + long.askedFirst);
    check('and the ceiling is measured on the ENCODED URL rather than on what the teacher typed, '
      + 'which is the only number that has anything to do with what gets cut: every line break '
      + 'costs six characters and every em dash nine',
      long.length > long.bodyLength,
      long.length + ' encoded vs ' + long.bodyLength + ' typed');

    /* WO-5.12: THE WARNING KNOWS WHICH DOOR IS OPEN. MAILTO_CEILING is a `ShellExecute` fact, and
       neither webmail documents a figure — so under Gmail the sentence names NO number and says
       Planbook cannot know, rather than quoting 2,000 at a door it was never measured on
       (src/outreach.js's ceilingFor(), null on purpose). The same long draft, the chip tapped,
       the sentence read, and the default put back so the projector check below reads what it
       always read. */
    const longWebmail = await evalJs(`(function(){
      ${DRAWN}
      document.querySelector('#outreachMail [data-outreach-mail="gmail"]').click();
      var d = drawn();
      var m = window.planbook.outreachView.outreachModel();
      var under = { shown: d.lengthShown, text: d.lengthText, long: m.long, ceiling: m.ceiling,
        https: m.https, hasHref: d.hasHref, length: m.length };
      document.querySelector('#outreachMail [data-outreach-mail="default"]').click();
      var back = drawn();
      var mb = window.planbook.outreachView.outreachModel();
      return { under: under, back: { text: back.lengthText, ceiling: mb.ceiling,
        mailtoCeiling: window.planbook.outreach.ceilingFor('default') } }; })()`);
    check('and under *Gmail in the browser* the same long draft still warns, still does not block, '
      + 'and the sentence names NO ceiling — it says Planbook cannot know where that door cuts, '
      + 'because no figure for a compose URL is documented anywhere and an invented one would be '
      + 'a promise the warning cannot keep; back on the default the 2,000 and Outlook on Windows '
      + 'return',
      longWebmail.under.shown === true && longWebmail.under.long === true
        && longWebmail.under.ceiling === null && longWebmail.under.https === true
        && longWebmail.under.hasHref === true
        && /cannot tell you/.test(longWebmail.under.text)
        && /does not shorten/.test(longWebmail.under.text)
        && !/\b2000\b|\b2,000\b/.test(longWebmail.under.text)
        && !/Outlook on Windows/.test(longWebmail.under.text)
        && String(longWebmail.under.text).indexOf(String(longWebmail.under.length)) >= 0
        && longWebmail.back.ceiling === 2000 && longWebmail.back.mailtoCeiling === 2000
        && /2000/.test(longWebmail.back.text) && /Outlook on Windows/.test(longWebmail.back.text),
      'Gmail: ceiling ' + JSON.stringify(longWebmail.under.ceiling) + ', "'
        + String(longWebmail.under.text).slice(0, 110) + '…"; default: ceiling '
        + longWebmail.back.ceiling);

    /* ── the projector ──
       THE REAL HEADER CONTROL, DISPATCHED RATHER THAN CLICKED AT COORDINATES, and the difference
       matters here in a way it does not elsewhere: a modal is open, and a CDP mouse click at the
       header's coordinates lands on the overlay's own backdrop — which src/modal.js reads as a
       dismissal, so the first run of this section closed the draft instead of projecting it. What
       is being asked is whether flipPresentationMode()'s chain reaches an open send flow, and
       `.click()` on the same button runs the same delegated listener the same way. */
    await evalJs(`(function(){
      document.querySelector('header [data-presentation-toggle]').click(); return 1; })()`);
    await new Promise(r => setTimeout(r, 250));
    const projected = await evalJs(`(function(){
      ${DRAWN}
      var d = drawn();
      var m = window.planbook.outreachView.outreachModel();
      var hay = document.getElementById('outreachModal').textContent;
      return { formHidden: d.formHidden, projecting: d.projecting, hasHref: d.hasHref,
        subjectField: d.subjectField, bodyField: d.bodyField,
        chips: d.chips.length, options: d.options.length, reasons: d.reasons.length,
        notes: (d.toNote + d.ccNote + document.getElementById('outreachTemplateNote').textContent)
          .length,
        blocked: m.blocked, recipients: m.recipients.length, url: m.url,
        name: hay.indexOf('Wo53Full') >= 0 || hay.indexOf('Wo53Guardian') >= 0,
        address: hay.indexOf('${G1_EMAIL}') >= 0 }; })()`);
    check('presentation mode takes the WHOLE flow down rather than one column of it — src/signals-'
      + 'view.js’s refusal rather than the template screen’s, because there is no half of '
      + 'this modal that does not name a child — and the fields are EMPTIED rather than hidden: no '
      + 'student name, no guardian, no address and no URL is left anywhere on the page',
      projected.blocked === true && projected.formHidden === true && projected.projecting === true
        && projected.subjectField === '' && projected.bodyField === '' && projected.chips === 0
        && projected.options === 0 && projected.reasons === 0 && projected.recipients === 0
        && projected.notes === 0
        && projected.url === '' && projected.hasHref === false
        && projected.name === false && projected.address === false,
      JSON.stringify(projected));

    await evalJs(`(function(){
      document.querySelector('header [data-presentation-toggle]').click(); return 1; })()`);
    await new Promise(r => setTimeout(r, 250));
    const backOn = await evalJs(`(function(){
      ${DRAWN}
      var d = drawn();
      return { hasHref: d.hasHref, chips: d.chips.length, body: d.bodyField.length,
        formHidden: d.formHidden }; })()`);
    check('and turning the projector off brings the same draft back, because what the mode '
      + 'suppressed was the drawing rather than the work',
      backOn.formHidden === false && backOn.hasHref === true && backOn.chips === 6
        && backOn.body > 0,
      JSON.stringify(backOn));

    /* ── THE STATUS LINE UNDER THE PROJECTOR (WO-5.10) ──
       THE CHECK ABOVE PASSES FOR AN HONEST REASON AND CANNOT EXPRESS THIS ONE, which is why it is
       left exactly as it was rather than widened. Its fixture reaches the flip with the status line
       holding applyTemplate()'s sentence — *rebuilt from “WO-5.3 long…”* — which names a TEMPLATE,
       and a template is the teacher's own writing about her own message. So `outreachModal`'s text
       carries no guardian's name whatever the status line does with it, and the ordering is what
       decides that: the projector goes on before anything has written a sentence that names a
       person.

       TWO OF THE SENTENCES THIS LINE CAN HOLD DO NAME ONE — applyRecipient()'s *rebuilt for Wo53-
       Guardian Three…* and recordHandoff()'s *logged on Ada…'s record* — so this fixture SWITCHES
       RECIPIENT FIRST and flips second. The sentence is read on the glass BEFORE the flip as well
       as after it: a check that only asserted the empty half would go green on a fixture that had
       quietly stopped writing a status at all, which is this file's own rule about a check that
       cannot express its failure.

       IT TAKES TWO TAPS SINCE WO-5.8 AND IT PAYS FOR A SECOND CLAIM. A recipient is put on the
       message first and written to second, because the two are two controls now — and the second
       row is therefore POPULATED, and its own line of type is naming a guardian, at the moment the
       projector goes on. So `statusOut.name` is asserting the emptying of that row as well as of
       the status line: it searches the whole modal's text, and paintPrimary()'s *Addressed to
       Wo53Guardian Three…* is in it until renderOutreach()'s blocked branch empties it. The row
       and its chip count are read as well, by name, so a red says which of the two broke.

       The recipient is put back afterwards so the rest of the section reads the draft it always
       read — the same courtesy the Gmail ceiling check above pays the mail door. */
    const said = await evalJs(`(function(){
      ${DRAWN}
      document.querySelector('[data-outreach-to="guardian-2"]').click();
      document.querySelector('[data-outreach-primary="guardian-2"]').click();
      var line = document.getElementById('outreachStatus');
      var hay = document.getElementById('outreachModal').textContent;
      var d = drawn();
      return { status: line.textContent, hidden: line.classList.contains('hidden'),
        named: hay.indexOf('Wo53Guardian Three') >= 0,
        rowShown: d.primaryShown, rowChips: d.primaryChips.length,
        rowNamed: hay.indexOf('Addressed to Wo53Guardian Three') >= 0 }; })()`);
    await evalJs(`(function(){
      document.querySelector('header [data-presentation-toggle]').click(); return 1; })()`);
    await new Promise(r => setTimeout(r, 250));
    const statusOut = await evalJs(`(function(){
      ${DRAWN}
      var line = document.getElementById('outreachStatus');
      var hay = document.getElementById('outreachModal').textContent;
      var m = window.planbook.outreachView.outreachModel();
      var d = drawn();
      return { status: line.textContent, hidden: line.classList.contains('hidden'),
        model: m.status, blocked: m.blocked,
        rowShown: d.primaryShown, rowChips: d.primaryChips.length, rowNote: d.primaryNote,
        name: hay.indexOf('Wo53Full') >= 0 || hay.indexOf('Wo53Guardian') >= 0,
        address: hay.indexOf('${G1_EMAIL}') >= 0 || hay.indexOf('${G3_EMAIL}') >= 0 }; })()`);
    check('and the STATUS LINE is emptied with the rest of the panel rather than left in it — a '
      + 'recipient put on the message and written to, the sentence naming that guardian read off '
      + 'the glass with the second chip row drawn and naming her too, and THEN the projector: '
      + 'outreachModel() hands the projected model an empty `status`, so the line the teacher was '
      + 'just reading holds nothing at all, the second row is emptied and hidden, and no '
      + 'guardian’s name is anywhere in the modal’s text, hidden or not. The old fixture flips '
      + 'before any sentence names a person and cannot reach this (WO-5.10, Acceptance line 1)',
      said.named === true && said.hidden === false
        && /Wo53Guardian Three/.test(said.status) && /rebuilt for/.test(said.status)
        && said.rowShown === true && said.rowChips === 2 && said.rowNamed === true
        && statusOut.blocked === true && statusOut.model === '' && statusOut.status === ''
        && statusOut.hidden === true
        && statusOut.rowShown === false && statusOut.rowChips === 0 && statusOut.rowNote === ''
        && statusOut.name === false && statusOut.address === false,
      'before: “' + String(said.status).slice(0, 80) + '…” with ' + said.rowChips
        + ' chip(s) in the second row; projected: ' + JSON.stringify(statusOut));

    /* AND THE FLIP BACK, READ AND NOT ASSERTED. The module variable behind that sentence is flow
       state and the mode does not write to it — nothing does, on a flip: renderOutreach() is handed
       the projector's answer and draws it, and a `status = ''` in there would be a paint writing
       flow state (WO-5.10's Traps line). So the sentence returns with the draft, the chips and the
       boxes, which is the check two above this one saying what the mode suppressed was the DRAWING
       rather than the work. The reading is printed so a later reader can see which behaviour this
       build has rather than infer it; WO-5.10's second Acceptance line asks for the other one and
       is reported open. */
    await evalJs(`(function(){
      document.querySelector('header [data-presentation-toggle]').click(); return 1; })()`);
    await new Promise(r => setTimeout(r, 250));
    const statusBack = await evalJs(`(function(){
      ${DRAWN}
      var line = document.getElementById('outreachStatus');
      var was = { status: line.textContent, hidden: line.classList.contains('hidden') };
      /* Written back to the first guardian, and then the third taken off the message — in that
         order, because the primary is the one recipient a row-one tap refuses to remove
         (src/outreach-view.js's toggleOutreachRecipient()). */
      document.querySelector('[data-outreach-primary="guardian-0"]').click();
      var restored = document.getElementById('outreachStatus').textContent;
      document.querySelector('[data-outreach-to="guardian-2"]').click();
      var d = drawn();
      var m = window.planbook.outreachView.outreachModel();
      return { was: was, restored: restored,
        chosen: m.recipients.filter(function(r){ return r.chosen; }).length,
        recipient: m.recipient ? m.recipient.key : '',
        rowShown: d.primaryShown, chips: d.chips.length }; })()`);
    check('and the fixture puts the recipient back where the rest of this section expects it — the '
      + 'flip cost the flow nothing, so the switch back rebuilds in silence and the line names the '
      + 'first guardian again, and the third guardian comes back off the message so the second row '
      + 'goes away with her',
      /Wo53Guardian One/.test(statusBack.restored)
        && statusBack.chosen === 1 && statusBack.recipient === 'guardian-0'
        && statusBack.rowShown === false && statusBack.chips === 6,
      'status on the way back out = “' + String(statusBack.was.status).slice(0, 80)
        + '” (hidden = ' + statusBack.was.hidden + '); back to ' + statusBack.chosen
        + ' recipient on the message');

    /*
      ─────────── NO GOOGLE SCOPE IS REQUESTED ANYWHERE IN THIS FLOW ───────────

      Acceptance line 5, and it is asked two ways because one of them alone would be weak. The
      modules are FETCHED and read, so a scope string, a `gapi`, an OAuth call or a fetch of any kind
      would be found wherever in them it sat; and the page is asked what it actually loaded, because
      a flow that pulled Google's script in at run time would leave a tag behind and a token in
      src/auth.js.
    */
    const scopes = await evalJs(`(async function(){
      var files = ['/src/outreach.js', '/src/outreach-view.js'];
      var out = [];
      for (var i = 0; i < files.length; i++) {
        var text = await (await fetch(files[i])).text();
        /* Comments and prose stay in the haystack on purpose: a scope named in a comment is a
           scope somebody is thinking about, and this check would rather be re-read than quietly
           narrowed. */
        out.push({ file: files[i],
          hits: (text.match(/gapi|accounts\\.google|googleapis|oauth|access_token|drive\\.file|requestAccessToken|XMLHttpRequest|navigator\\.sendBeacon/gi) || []),
          fetches: (text.match(/\\bfetch\\s*\\(/g) || []).length }); }
      return { files: out,
        googleScripts: Array.prototype.filter.call(document.querySelectorAll('script[src]'),
          function(s){ return /google/i.test(s.src); }).length,
        token: window.planbook.auth.accessToken() }; })()`);
    check('no Google scope is requested anywhere in this flow, and nothing in it can request one: '
      + 'neither module names a scope, an OAuth call or an endpoint, neither contains a fetch of '
      + 'any kind, no Google script was ever pulled into the page, and there is no token — the '
      + 'handoff is a `mailto:` link and the operating system does the rest (Acceptance line 5)',
      scopes.files.every((f) => f.hits.length === 0 && f.fetches === 0)
        && scopes.googleScripts === 0 && !scopes.token,
      scopes.files.map((f) => f.file + ': ' + f.hits.length + ' hit(s), ' + f.fetches + ' fetch(es)')
        .join(' · ') + '; google scripts on the page = ' + scopes.googleScripts);

    /*
      ─────────── AND NOTHING IN THE FLOW WROTE TO THE DOCUMENT ───────────

      **RE-SCOPED AT WO-5.4, WITH EVERY CONJUNCT KEPT.** This block was written when the send flow
      wrote nothing at all; that work order gave it one write, on the handoff, and this check is now
      the half that says DRAFTING still writes nothing — picking, toggling, typing, blocking, the
      projector cycle. Nothing above this line clicks the handoff (it is focused, never pressed:
      following a `mailto:` hands the page to the operating system), so the same three readings are
      still the right ones and they still have to be zero. The other half — that the handoff writes
      exactly one entry — is proved in `verify/contact-log.mjs`, where a click can be made safely.
      Relaxing anything here to accommodate the new write would have been the check edited down to
      fit, which is the defect this directory exists to catch.

      `rev` is the store's own witness: it moves on every save, so an unchanged `rev` after a whole
      flow of picking, toggling, typing and blocking is a claim no reading of the source can make as
      cheaply.

      FLUSHED FIRST, AND THE MUTATION ROUND IS WHY. `rev` advances inside save(), which update()
      only SCHEDULES — `DEBOUNCE_MS` is 800ms — so reading it straight after the flow cannot see a
      write made in the last 800ms of that flow, and the last control touched above is the copy-to-
      self toggle. A no-op `update()` planted in toggleOutreachCopy sat through this check unnoticed
      (WO-5.3's mutation round, re-run 2026-08-28 after the dispatch that owed it died mid-round).
      flush() settles the pending save rather than waiting the timer out, which is the same idiom
      verify/assignments.mjs uses: a clean document finds nothing dirty and returns without moving
      `rev`, so the check still reads exactly what it says it reads — and a writer anywhere in the
      flow now moves it, including one in the final 800ms.
    */
    const after = await evalJs(`(async function(){
      await window.planbook.store.flush();
      var d = window.planbook.store.getDoc();
      return { rev: d.rev, log: (d.log || []).length,
        templates: JSON.stringify(d.templates || []),
        contacts: (d.log || []).filter(function(e){ return e.kind === 'contact'; }).length }; })()`);
    check('and DRAFTING wrote nothing at all — `rev` has not moved across picking, toggling, typing '
      + 'and blocking, `log[]` is the length it was and holds no `contact` entry, and `templates[]` '
      + 'is byte-identical. WO-5.4 writes on the HANDOFF and on nothing else, and nothing above this '
      + 'line pressed it',
      after.rev === before.rev && after.log === before.log && after.contacts === 0
        && after.templates === before.templates,
      'rev ' + before.rev + ' → ' + after.rev + ', log ' + before.log + ' → ' + after.log
        + ', contact entries ' + after.contacts);

    const stored = await evalJs(`(function(){
      var out = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        var v = String(localStorage.getItem(k));
        /* NOT the bare fixture prefix: planbook_openClassId legitimately holds c_wo53, which is
           a UI preference about which class is open and not a draft. What is looked for is the
           draft itself — a recipient, a template, a message, a toggle or an address. (No backticks
           in here; it is inside a template literal and one would close it.) */
        if (/mailto|outreach|recipient|guardian|subject|body|example\.invalid/i.test(k + ' ' + v)) {
          out.push(k);
        }
      }
      return out; })()`);
    check('and nothing about a draft reached localStorage — not the recipient, not the template, '
      + 'not the message and not the copy-me toggle. UI preferences only, and a draft is not one',
      stored.length === 0,
      stored.length ? JSON.stringify(stored) : 'no planbook_ key mentions a draft or a recipient');

    /*
      ─────────── THE TOUCH PASS, AT 390px UNDER A COARSE POINTER ───────────

      Measured here rather than in tools/verify/touch-targets.mjs's view loop for the reason that
      file gives about the template editor: this is a MODAL over two different screens and that loop
      walks views in <main>. Every control in it is a component src/shell.css already owns — the
      chips, the two fields, the select, the strip's jump and the actions — plus one that is
      new, the handoff link, which takes `.class-action-btn`'s floor only because § THE SEND FLOW
      makes it inline-flex first. That is exactly the kind of thing a stylesheet review gets wrong,
      so it is measured rather than read.

      **AND WO-5.7's COPY CONTROL IS MEASURED HERE RATHER THAN IN ITS OWN BLOCK FURTHER DOWN**, for
      the reason this whole pass is one reading: it stands in the same `.modal-actions` row as the
      handoff, so what a third control costs is a property of the ROW and not of the button. That
      cost is real — `.class-action-btn` is `white-space: nowrap`, and three of them at 390px are
      wider than the panel — which is why `#outreachModal .modal-actions` gained a `flex-wrap` and
      why the sideways-scroll conjunct below is the half of this check that WO-5.7 could break. The
      floor itself comes from `#outreachModal .class-action-btn` in the coarse block, scoped to this
      panel rather than written as a bare class: every action button in the app wears that class,
      and a 44px MIN-WIDTH on all of them would silently widen the reorder arrows on eleven screens.
    */
    await send('Emulation.setDeviceMetricsOverride',
      { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await new Promise(r => setTimeout(r, 300));
    const touch = await evalJs(`(function(){
      var out = [];
      document.querySelectorAll('#outreachModal button, #outreachModal input, '
        + '#outreachModal select, #outreachModal textarea, #outreachModal a[href]')
        .forEach(function(e){
          var r = e.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) return;
          if (getComputedStyle(e).display === 'none') return;
          out.push({ t: e.tagName + '.' + (e.className || ''), id: e.id || '',
            w: Math.round(r.width * 100) / 100, h: Math.round(r.height * 100) / 100 }); });
      var doc = document.documentElement;
      return { controls: out, under: out.filter(function(m){ return m.h < 44 || m.w < 44; }),
        coarse: matchMedia('(pointer: coarse)').matches,
        sideways: doc.scrollWidth - doc.clientWidth }; })()`);
    check('every control in the send flow measures at least 44px on both axes at 390px under a '
      + 'coarse pointer — including the handoff link, which is an anchor and would have ignored the '
      + 'floor entirely without the `display: inline-flex` in src/shell.css § THE SEND FLOW, and '
      + 'including WO-5.7’s copy control beside it — and the panel puts the page into no sideways '
      + 'scroll, which is the conjunct a third button in the actions row is what threatens',
      touch.coarse === true && touch.controls.length >= 9 && touch.under.length === 0
        && touch.sideways <= 0
        /* NAMED, NOT COUNTED. A floor that reached eight of nine controls and missed the new one
           would pass a count and fail a teacher, so the control this work order added is asserted
           to be IN the measured set by its own id — the vacuity guard this file's own header is
           about, applied to the one control the count cannot distinguish. */
        && touch.controls.some((m) => m.id === 'outreachCopy'),
      touch.controls.length + ' control(s) measured, ' + touch.under.length + ' under 44px'
        + (touch.under.length ? ': ' + JSON.stringify(touch.under) : '') + ', sideways scroll '
        + touch.sideways + 'px');
    await send('Emulation.setDeviceMetricsOverride',
      { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await new Promise(r => setTimeout(r, 200));

    /* ── the second door: the student record ──
       Reached the way a teacher reaches it from here: the card's own *Open their grades*, which
       closes the card and lands on the record for the same student. */
    await evalJs(`(function(){
      document.querySelectorAll('.modal-overlay:not(.hidden) [data-modal-close]').forEach(
        function(b){ b.click(); });
      return 1; })()`);
    await new Promise(r => setTimeout(r, 250));
    await clickSel('#signalsPraiseList [data-signal-row]');
    await new Promise(r => setTimeout(r, 250));
    await clickSel('#signalCardModal [data-signal-card-detail]');
    await new Promise(r => setTimeout(r, 350));
    const secondDoor = await evalJs(`(function(){
      ${DRAWN}
      var b = document.querySelector('#detailActions [data-outreach-draft]');
      if (!b) return { there:false };
      b.click();
      var d = drawn();
      var m = window.planbook.outreachView.outreachModel();
      return { there:true, view: (function(){
          var e = document.querySelector('main > :not(.hidden)'); return e ? e.id : ''; })(),
        open: d.open, overlays: document.querySelectorAll('.modal-overlay:not(.hidden)').length,
        name: m.name, tone: m.tone, ready: m.ready, hasHref: d.hasHref,
        signals: m.body.indexOf('{{') }; })()`);
    check('the second door is the student record’s action row, and it opens the same flow for '
      + 'the student on screen — one modal over the record, the signals collected once at the tap, '
      + 'and a draft that resolves',
      secondDoor.there === true && secondDoor.view === 'detailView' && secondDoor.open === true
        && secondDoor.overlays === 1 && secondDoor.name === 'Ada Wo53Full'
        && secondDoor.ready === true && secondDoor.hasHref === true
        && secondDoor.signals === -1,
      JSON.stringify(secondDoor));

    /*
      AND THE OTHER ORDER, WHICH IS THE ONE THAT COULD BE FAKED. Everything above turns the
      projector on over a draft that was already resolved; this opens the flow with the mode
      ALREADY ON, from the one door that can do it — the student record does not refuse the way
      the concern list does — and then turns the mode off. If the draft were built at open time and
      merely not drawn, it would be a resolved draft sitting in memory for a later render, which is
      the thing src/signals-view.js's rule forbids and the thing "nothing is resolved at all" has to
      mean.
    */
    await evalJs(`(function(){
      document.querySelectorAll('.modal-overlay:not(.hidden) [data-modal-close]').forEach(
        function(b){ b.click(); });
      document.querySelector('header [data-presentation-toggle]').click();
      return 1; })()`);
    await new Promise(r => setTimeout(r, 250));
    const projectedFirst = await evalJs(`(function(){
      ${DRAWN}
      document.querySelector('#detailActions [data-outreach-draft]').click();
      var shut = drawn();
      var m1 = window.planbook.outreachView.outreachModel();
      document.querySelector('header [data-presentation-toggle]').click();
      var open = drawn();
      var m2 = window.planbook.outreachView.outreachModel();
      return { openedShut: shut.open, formHidden: shut.formHidden, projecting: shut.projecting,
        subjectWhileOn: shut.subjectField, bodyWhileOn: shut.bodyField, hrefWhileOn: shut.hasHref,
        blocked: m1.blocked,
        formAfter: open.formHidden, hrefAfter: open.hasHref, bodyAfter: open.bodyField.length,
        tokensAfter: window.planbook.outreach.tokensLeftIn(open.bodyField).length,
        readyAfter: m2.ready }; })()`);
    check('and opening the flow with the projector ALREADY ON resolves nothing rather than '
      + 'resolving quietly and drawing nothing — the modal opens on the refusal with both boxes '
      + 'empty and no link, and it is turning the mode off that builds the draft. A draft that '
      + 'existed in memory would be a draft a later render could draw',
      projectedFirst.openedShut === true && projectedFirst.blocked === true
        && projectedFirst.formHidden === true && projectedFirst.projecting === true
        && projectedFirst.subjectWhileOn === '' && projectedFirst.bodyWhileOn === ''
        && projectedFirst.hrefWhileOn === false
        && projectedFirst.formAfter === false && projectedFirst.hrefAfter === true
        && projectedFirst.bodyAfter > 0 && projectedFirst.tokensAfter === 0
        && projectedFirst.readyAfter === true,
      JSON.stringify(projectedFirst));

    /*
      ─────────── A DRAFT SURVIVES A CHANGE OF MIND (WO-5.6) ───────────

      WO-5.3 settled WHEN the draft is resolved and left one question open: what happens to work
      already done. Until 2026-08-29 the answer was that it went, silently, with a status line
      afterwards saying so — which is the loss reported rather than prevented. These checks are
      about the panel that now stands in the way, and every one of them is driven through the real
      controls in the real order, because the failure this work order exists to prevent is a rebuild
      the teacher never agreed to and only the wiring can produce one.

      THE FIXTURE IS THE ONE ABOVE and the flow is already open on the student record's door, on a
      resolved praise draft to Guardian 1. Nothing is re-seeded: what these checks want is a draft
      with words in it, and the draft on screen is one.

      `rev` IS READ AGAIN AT THE FOOT OF THIS BLOCK. The section already proves WO-5.3's flow wrote
      nothing, but every control below is either new or re-cut, and a confirm dialog is exactly the
      kind of place a save gets added by accident.
    */
    const beforeMind = await evalJs(`(async function(){
      await window.planbook.store.flush();
      var d = window.planbook.store.getDoc();
      return { rev: d.rev, log: (d.log || []).length,
        templates: JSON.stringify(d.templates || []) }; })()`);

    /* The confirm panel, read off the DOM. Its two filled elements are the lead and the fact list,
       and the fact list is what settles the Traps line about the two boxes. */
    const CONFIRM = `var confirmPanel = function(){
      var o = document.getElementById('outreachConfirmModal');
      var facts = [];
      Array.prototype.forEach.call(o.querySelectorAll('.class-delete-line'), function(n){
        facts.push(n.textContent.replace(/\\s+/g, ' ').trim()); });
      return { open: !o.classList.contains('hidden'),
        lead: document.getElementById('outreachConfirmLead').textContent,
        facts: facts,
        action: document.getElementById('outreachConfirmBtn').textContent,
        text: o.textContent.replace(/\\s+/g, ' ').trim() }; };`;
    const MINE = 'I wrote this paragraph myself and I would like to keep it.';

    /*
      ACCEPTANCE LINE 1, FIRST HALF. Type in the body, then change the template. What is asserted is
      not only that a dialog appeared but that NOTHING ELSE DID: the model still holds the old
      template, the body still holds the typed words, and — the one that would go wrong quietly —
      the `<select>` has been put back. A `<select>` takes its new value before the `change` event
      is delivered, so a flow that asked without repainting would leave the picker claiming a
      rebuild that had not happened, and the screen and the draft would disagree about which
      template the body in front of her came from.
    */
    const asked = await evalJs(`(function(){
      ${TYPE}
      ${DRAWN}
      ${CONFIRM}
      var before = window.planbook.outreachView.outreachModel();
      var target = window.planbook.store.getDoc().templates.filter(function(t){
        return t.name.indexOf('a long one') >= 0; })[0];
      type('outreachBody', ${JSON.stringify(MINE)});
      pick('outreachTemplate', target.id);
      var c = confirmPanel();
      var d = drawn();
      var m = window.planbook.outreachView.outreachModel();
      return { wasTemplate: before.templateId, wasName: before.templateName, wantId: target.id,
        wantName: target.name, confirmOpen: c.open, lead: c.lead, facts: c.facts, action: c.action,
        overlays: document.querySelectorAll('.modal-overlay:not(.hidden)').length,
        bodyField: d.bodyField, modelBody: m.body, modelTemplate: m.templateId,
        selectValue: document.getElementById('outreachTemplate').value,
        focusInPanel: document.getElementById('outreachConfirmModal').contains(
          document.activeElement) }; })()`);
    check('typing in the body and then changing the template ASKS before it rebuilds — and while '
      + 'the question is up nothing has moved: the model still holds the old template, the body '
      + 'still holds the typed words, and the `<select>` has been put back to the template the '
      + 'draft actually came from, which is the half that goes wrong quietly because a select '
      + 'takes its new value before the `change` event is delivered (Acceptance line 1)',
      asked.confirmOpen === true && asked.overlays === 2 && asked.bodyField === MINE
        && asked.modelBody === MINE && asked.modelTemplate === asked.wasTemplate
        && asked.selectValue === asked.wasTemplate && asked.focusInPanel === true,
      JSON.stringify({ open: asked.confirmOpen, overlays: asked.overlays,
        select: asked.selectValue === asked.wasTemplate ? 'put back' : asked.selectValue,
        model: asked.modelTemplate === asked.wasTemplate ? 'unchanged' : asked.modelTemplate }));
    check('and the panel names the change and lists WHICH BOX she has written in — the message and '
      + 'not the subject, because only one of them differs from what the resolver produced — with '
      + 'a confirm button that says what it will rebuild rather than OK, which is src/classes.js’s '
      + 'ruling about a question a tired teacher answers yes to',
      asked.facts.length === 1 && /rewritten the message/i.test(asked.facts[0])
        && !asked.facts.some((f) => /subject/i.test(f))
        && asked.action.indexOf(asked.wantName) >= 0 && !/^OK$/i.test(asked.action)
        && asked.lead.indexOf(asked.wantName) >= 0 && /goes/.test(asked.lead),
      JSON.stringify({ facts: asked.facts, action: asked.action }));

    /*
      ACCEPTANCE LINE 1, SECOND HALF. Cancel, and read everything again: the text, the model and the
      three controls. "Exactly as it was" is asserted character for character against the string
      that was typed, not against a length or a prefix.
    */
    const cancelled = await evalJs(`(function(){
      ${DRAWN}
      ${CONFIRM}
      document.querySelector('[data-outreach-rebuild-cancel]').click();
      var c = confirmPanel();
      var d = drawn();
      var m = window.planbook.outreachView.outreachModel();
      return { confirmOpen: c.open,
        overlays: document.querySelectorAll('.modal-overlay:not(.hidden)').length,
        bodyField: d.bodyField, subjectField: d.subjectField, modelBody: m.body,
        templateName: m.templateName, templateId: m.templateId, tone: m.tone,
        to: m.recipient ? m.recipient.key : '',
        selectValue: document.getElementById('outreachTemplate').value,
        hasHref: d.hasHref }; })()`);
    check('cancelling leaves the typed text EXACTLY as it was, character for character, and leaves '
      + 'the tone, the recipient and the template picker reading what they read before the tap — '
      + 'there is no undo here because nothing was done: the change was held as a proposal and the '
      + 'cancel is the absence of a call (Acceptance line 1)',
      cancelled.confirmOpen === false && cancelled.overlays === 1
        && cancelled.bodyField === MINE && cancelled.modelBody === MINE
        && cancelled.templateId === asked.wasTemplate
        && cancelled.templateName === asked.wasName
        && cancelled.selectValue === asked.wasTemplate
        && cancelled.tone === 'praise' && cancelled.to === 'guardian-0'
        && cancelled.hasHref === true,
      JSON.stringify({ body: cancelled.bodyField === MINE ? 'exactly as typed' : cancelled.bodyField,
        template: cancelled.templateName, tone: cancelled.tone, to: cancelled.to }));

    /*
      ACCEPTANCE LINE 2. The same tap again, and this time the button in the panel. What comes back
      has to be the NEW template's text rather than anything of hers, and the status line has to say
      the replacement happened at her word — the sentence that used to read "Anything you had typed
      is gone" on every rebuild, agreed or not.
    */
    const confirmed = await evalJs(`(function(){
      ${TYPE}
      ${DRAWN}
      ${CONFIRM}
      var target = window.planbook.store.getDoc().templates.filter(function(t){
        return t.name.indexOf('a long one') >= 0; })[0];
      pick('outreachTemplate', target.id);
      var asking = confirmPanel().open;
      document.querySelector('[data-outreach-rebuild-confirm]').click();
      var c = confirmPanel();
      var d = drawn();
      var m = window.planbook.outreachView.outreachModel();
      return { asking: asking, confirmOpen: c.open, wantId: target.id, wantName: target.name,
        templateId: m.templateId, templateName: m.templateName,
        bodyField: d.bodyField, keptMine: d.bodyField.indexOf(${JSON.stringify(MINE)}) >= 0,
        fromTemplate: d.bodyField.indexOf('This paragraph exists to pass the ceiling') >= 0,
        selectValue: document.getElementById('outreachTemplate').value,
        status: document.getElementById('outreachStatus').textContent,
        tokensLeft: window.planbook.outreach.tokensLeftIn(
          d.subjectField + ' ' + d.bodyField).length }; })()`);
    check('confirming rebuilds the draft from the new template exactly as it did before this work '
      + 'order — the body is the new template resolved, not one word of hers survives, the picker '
      + 'and the model agree on which template it came from, and the status line says the '
      + 'replacement happened at her word rather than reporting a loss she was never asked about '
      + '(Acceptance line 2)',
      confirmed.asking === true && confirmed.confirmOpen === false
        && confirmed.templateId === confirmed.wantId && confirmed.selectValue === confirmed.wantId
        && confirmed.keptMine === false && confirmed.fromTemplate === true
        && confirmed.tokensLeft === 0 && /rebuilt/i.test(confirmed.status)
        && /as you asked/i.test(confirmed.status),
      JSON.stringify({ template: confirmed.templateName, mineGone: !confirmed.keptMine,
        status: confirmed.status }));

    /*
      ACCEPTANCE LINE 3, AND IT IS THE HALF THAT IS AS DELIBERATE AS THE OTHER. An untouched draft
      rebuilds in silence on ALL THREE controls, because a confirm on every tap of a tone pill while
      nothing has been typed is a dialog that teaches people to dismiss dialogs. Each step is
      asserted to have actually REBUILT as well as to have stayed quiet — a control that had
      silently done nothing would pass a check that only counted dialogs.

      The tone step is the one worth naming: it changes which templates are on offer and therefore
      which one is selected, so it replaces the draft without anything having named a template.

      AND THE RECIPIENT STEP IS THE ONE WO-5.13 CHANGED. It used to swap the template as well —
      the list was filtered by the audience, so the guardian's concern template fell off it on the
      tap and the counselor's took its place — which made "three different templates, three
      different bodies" the natural thing to assert. Since 2026-09-20 the list does not move, so
      the teacher's chosen message SURVIVES the switch and is re-resolved for the new person: two
      bodies across the three steps, not three, and the third step's evidence that it really did
      rebuild is its own status sentence rather than a body that changed. That is asserted here as
      an equality (`steps[2].template === steps[1].template`) rather than by naming the record
      twice, because the claim is survival and not identity — a build that re-selected the same
      template for some other reason would be a different thing saying the same words.
    */
    const silent = await evalJs(`(function(){
      ${TYPE}
      ${DRAWN}
      ${CONFIRM}
      var steps = [];
      var step = function(name){
        var c = confirmPanel();
        var m = window.planbook.outreachView.outreachModel();
        steps.push({ name: name, asked: c.open, tone: m.tone,
          to: m.recipient ? m.recipient.key : '', template: m.templateName,
          body: drawn().bodyField.slice(0, 30),
          status: document.getElementById('outreachStatus').textContent }); };
      var praise = window.planbook.store.getDoc().templates.filter(function(t){
        return t.name.indexOf('praise to a guardian') >= 0; })[0];
      pick('outreachTemplate', praise.id); step('template');
      document.querySelector('#outreachTones [data-outreach-tone="concern"]').click(); step('tone');
      /* TWO TAPS FOR THE THIRD STEP SINCE WO-5.8, and only the second of them is a rebuild. Row
         one puts the counselor ON the message and is not a step at all — it changes neither box,
         which is the claim the WO-5.8 block above owns. Row two writes the draft to him, which is
         what this check has always been about, and it must still go through in silence. */
      document.querySelector('[data-outreach-to="counselor"]').click();
      document.querySelector('[data-outreach-primary="counselor"]').click(); step('recipient');
      return { steps: steps }; })()`);
    check('an untouched draft rebuilds with NO PROMPT AT ALL on all three controls — the template '
      + 'picker, the tone pill and the recipient chip — and each of the three really did rebuild. '
      + 'The tone tap is the one that hides here, because it changes which templates are on offer '
      + 'and so replaces the draft without anything having named a template; the recipient tap no '
      + 'longer does (WO-5.13), so the teacher’s concern template SURVIVES the switch to the '
      + 'counselor and is re-resolved for him — two bodies across the three steps, and the third '
      + 'rebuild is witnessed by its own status line (Acceptance line 3)',
      silent.steps.length === 3 && silent.steps.every((s) => s.asked === false)
        && silent.steps[0].template === 'WO-5.3 praise to a guardian'
        && silent.steps[1].template === 'WO-5.3 concern to a guardian'
        && silent.steps[2].template === silent.steps[1].template
        && silent.steps[1].tone === 'concern' && silent.steps[2].to === 'counselor'
        && silent.steps[0].body !== silent.steps[1].body
        && silent.steps[2].body === silent.steps[1].body
        && /rebuilt from a concern template/i.test(silent.steps[1].status)
        && /rebuilt for /i.test(silent.steps[2].status)
        && silent.steps.every((s) => /nothing was lost/i.test(s.status)),
      silent.steps.map((s) => s.name + ': asked=' + s.asked + ' → ' + s.template).join(' · '));

    /*
      ACCEPTANCE LINE 4, ASSERTED AS A PAIR SO IT CANNOT PASS VACUOUSLY. The same control is tapped
      twice over the same draft: once with a single stray character in the body, and once with that
      character removed again. The first must ask and the second must not — a check that only did
      the second half would pass over a flow that had stopped asking altogether.

      This is what makes the test a COMPARISON rather than a keystroke flag: a flag set on the first
      keypress stays set through the delete, and the second tap would ask about a draft that is
      byte-for-byte the one the resolver produced.
    */
    const roundTrip = await evalJs(`(function(){
      ${TYPE}
      ${DRAWN}
      ${CONFIRM}
      var was = drawn().bodyField;
      type('outreachBody', was + 'z');
      /* ROW TWO SINCE WO-5.8 — the control that changes who the draft is WRITTEN to, which is the
         one this check has always been driving. Row one is a membership toggle and never asks, so
         a data-outreach-to chip left standing here would be asserting a confirm over a control
         that has no reason to raise one. The first guardian is still on the message (the step
         above only moved the primary to the counselor), so this chip is there to tap.
         (No backticks in here; it is inside a template literal and a PAIR of them closes and
         reopens it, which is a ReferenceError at run time and not a syntax error at parse time.) */
      document.querySelector('[data-outreach-primary="guardian-0"]').click();
      var withZ = confirmPanel();
      document.querySelector('[data-outreach-rebuild-cancel]').click();
      var mid = window.planbook.outreachView.outreachModel();
      type('outreachBody', was);
      document.querySelector('[data-outreach-primary="guardian-0"]').click();
      var without = confirmPanel();
      var m = window.planbook.outreachView.outreachModel();
      return { withZ: withZ.open, panelText: withZ.text, panelLead: withZ.lead,
        cancelledTo: mid.recipient ? mid.recipient.key : '',
        withoutZ: without.open, to: m.recipient ? m.recipient.key : '',
        template: m.templateName }; })()`);
    check('a character typed and removed again counts as UNTOUCHED — the same recipient chip asks '
      + 'while one stray "z" is in the body and goes straight through once it is gone, which is '
      + 'only true because the test is a comparison against what the resolver produced and not a '
      + 'flag set on the first keypress (Acceptance line 4)',
      roundTrip.withZ === true && roundTrip.cancelledTo === 'counselor'
        && roundTrip.withoutZ === false && roundTrip.to === 'guardian-0'
        && roundTrip.template === 'WO-5.3 concern to a guardian',
      'with the stray character the chip asked = ' + roundTrip.withZ + ', with it removed = '
        + roundTrip.withoutZ + '; the cancel left the recipient on ' + roundTrip.cancelledTo);
    /*
      AND THE PANEL NAMES NOBODY. The recipient case is the one with something to lose: the chips
      are positions but the line under them names a guardian and carries her address, and this
      dialog can be on the glass when a projector goes on. It quotes the POSITION and never the
      person — searched over the whole overlay's text, against the same planted strings the leak
      check above uses plus the student's name, her guardian's name and the address itself.
    */
    check('and no sentence in that panel names a student, a guardian or an address — it says '
      + '"Guardian 1", which is the chip’s own position and one of the app’s five short strings, '
      + 'where the line under the chips names the person. This panel opens over a modal that '
      + 'presentation mode empties, so a name in it would be a name left on the glass',
      /Guardian 1/.test(roundTrip.panelLead)
        && SECRETS.every((w) => roundTrip.panelText.indexOf(w) < 0)
        && roundTrip.panelText.indexOf('Wo53Full') < 0
        && roundTrip.panelText.indexOf('Wo53Guardian') < 0
        && roundTrip.panelText.indexOf(G1_EMAIL) < 0
        && roundTrip.panelText.indexOf('Ada') < 0,
      roundTrip.panelLead.slice(0, 130));

    /*
      THE TRAPS LINE, AND IT IS THE SAME BUG ONE FIELD FURTHER ALONG. The subject and the body are
      two boxes and either can be edited; a confirm that watched only the body would lose a
      rewritten subject silently, which is this work order's own failure wearing a different hat.
      So: rewrite the SUBJECT, leave the body alone, and tap a tone pill.
    */
    const subjectOnly = await evalJs(`(function(){
      ${TYPE}
      ${DRAWN}
      ${CONFIRM}
      var wasSubject = drawn().subjectField;
      var wasBody = drawn().bodyField;
      var mine = 'A subject line I rewrote by hand';
      type('outreachSubject', mine);
      document.querySelector('#outreachTones [data-outreach-tone="praise"]').click();
      var c = confirmPanel();
      var m1 = window.planbook.outreachView.outreachModel();
      document.querySelector('[data-outreach-rebuild-cancel]').click();
      var d = drawn();
      var m2 = window.planbook.outreachView.outreachModel();
      type('outreachSubject', wasSubject);
      return { asked: c.open, facts: c.facts, tone: m1.tone, toneAfter: m2.tone,
        subjectAfter: d.subjectField, mine: mine,
        bodyUnchanged: d.bodyField === wasBody }; })()`);
    check('a rewritten SUBJECT over an untouched body still asks, and the panel lists the subject '
      + 'and only the subject — a confirm that watched one box would lose the other one silently, '
      + 'which is this work order’s own failure one field along. Cancelling leaves the rewritten '
      + 'subject and the tone pill both exactly where they were',
      subjectOnly.asked === true && subjectOnly.facts.length === 1
        && /rewritten the subject/i.test(subjectOnly.facts[0])
        && !subjectOnly.facts.some((f) => /message/i.test(f))
        && subjectOnly.tone === 'concern' && subjectOnly.toneAfter === 'concern'
        && subjectOnly.subjectAfter === subjectOnly.mine
        && subjectOnly.bodyUnchanged === true,
      JSON.stringify({ asked: subjectOnly.asked, facts: subjectOnly.facts,
        tone: subjectOnly.toneAfter }));

    /*
      AND THE ASK GOES DOWN WITH THE FORM. Presentation mode takes this whole flow down, and a
      dialog stacked over it would otherwise sit on the glass over a panel that had just emptied
      itself — the shape of the disclosure WO-5.3's own mutation round found in this file. Driven
      through the real header control with `.click()`, for the reason the projector checks above
      are: a coordinate click at those coordinates lands on an overlay's backdrop.
    */
    await evalJs(`(function(){
      var n = document.getElementById('outreachBody');
      n.value = n.value + ' and one more sentence.';
      n.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('#outreachTones [data-outreach-tone="praise"]').click();
      return 1; })()`);
    await new Promise(r => setTimeout(r, 150));
    await evalJs(`(function(){
      document.querySelector('header [data-presentation-toggle]').click(); return 1; })()`);
    await new Promise(r => setTimeout(r, 250));
    const projectedOverAsk = await evalJs(`(function(){
      ${DRAWN}
      ${CONFIRM}
      var c = confirmPanel();
      var d = drawn();
      return { confirmOpen: c.open, formHidden: d.formHidden, projecting: d.projecting,
        overlays: document.querySelectorAll('.modal-overlay:not(.hidden)').length,
        subjectField: d.subjectField, bodyField: d.bodyField }; })()`);
    check('turning the projector on while the ask is up CLOSES the ask as well as emptying the '
      + 'form — a dialog stacked over a panel that has just emptied itself is the one thing on this '
      + 'screen presentation mode could otherwise leave on the glass',
      projectedOverAsk.confirmOpen === false && projectedOverAsk.formHidden === true
        && projectedOverAsk.projecting === true && projectedOverAsk.overlays === 1
        && projectedOverAsk.subjectField === '' && projectedOverAsk.bodyField === '',
      JSON.stringify(projectedOverAsk));
    await evalJs(`(function(){
      document.querySelector('header [data-presentation-toggle]').click(); return 1; })()`);
    await new Promise(r => setTimeout(r, 250));

    /*
      THE TOUCH PASS FOR THE NEW PANEL, at 390px under a coarse pointer and measured rather than
      read off the stylesheet. Every control in it is a component src/shell.css already owns — two
      `.class-action-btn`s and the `.modal-close` — which is the reason this work order added no CSS
      at all; that is a claim worth measuring rather than asserting, because a floor inherited by
      sitting inside a shared selector is exactly the kind of thing a stylesheet review gets wrong.
    */
    /* THE TONE TAPPED HERE IS THE ONE THE FLOW IS NOT ALREADY ON, and that is not a detail: every
       one of the three doors returns early when the value it is handed is the value it already
       holds, so a tap on the current tone raises nothing and this pass would measure an empty
       panel — 0 controls, 0 of them under 44px, green from a distance. The flow is on *concern*
       here, so the pill is *praise*. `open` is asserted below for the same reason. */
    await evalJs(`(function(){
      var n = document.getElementById('outreachBody');
      n.value = 'typed, so that the panel below has something to ask about';
      n.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('#outreachTones [data-outreach-tone="praise"]').click();
      return 1; })()`);
    await new Promise(r => setTimeout(r, 150));
    await send('Emulation.setDeviceMetricsOverride',
      { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await new Promise(r => setTimeout(r, 300));
    const confirmTouch = await evalJs(`(function(){
      var out = [];
      document.querySelectorAll('#outreachConfirmModal button, #outreachConfirmModal a[href]')
        .forEach(function(e){
          var r = e.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) return;
          if (getComputedStyle(e).display === 'none') return;
          out.push({ t: e.tagName + '.' + (e.className || ''),
            w: Math.round(r.width * 100) / 100, h: Math.round(r.height * 100) / 100 }); });
      var doc = document.documentElement;
      return { open: !document.getElementById('outreachConfirmModal').classList.contains('hidden'),
        controls: out, under: out.filter(function(m){ return m.h < 44 || m.w < 44; }),
        coarse: matchMedia('(pointer: coarse)').matches,
        sideways: doc.scrollWidth - doc.clientWidth }; })()`);
    check('every control in the rebuild confirm measures at least 44px on both axes at 390px under '
      + 'a coarse pointer — the two actions and the ✕ — and the panel puts the page into no '
      + 'sideways scroll. This work order added no stylesheet rule of any kind: the floor is the '
      + 'one `.class-action-btn` and `.modal-close` already carry, which is a claim to measure '
      + 'rather than one to read',
      confirmTouch.coarse === true && confirmTouch.open === true
        && confirmTouch.controls.length >= 3 && confirmTouch.under.length === 0
        && confirmTouch.sideways <= 0,
      confirmTouch.controls.length + ' control(s) measured, ' + confirmTouch.under.length
        + ' under 44px' + (confirmTouch.under.length ? ': ' + JSON.stringify(confirmTouch.under) : '')
        + ', sideways scroll ' + confirmTouch.sideways + 'px');
    await send('Emulation.setDeviceMetricsOverride',
      { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await new Promise(r => setTimeout(r, 200));
    await evalJs(`(function(){
      document.querySelector('[data-outreach-rebuild-cancel]').click(); return 1; })()`);
    await new Promise(r => setTimeout(r, 150));

    /*
      ACCEPTANCE LINE 5. The whole of the above — typing, asking, cancelling, confirming, three
      silent rebuilds, a projector cycle and a touch pass — and `rev` has not moved. **Still true
      after WO-5.4**, and for the reason the block further up this file gives: a rebuild is not a
      handoff, and the one control that writes is not pressed anywhere in this section. Flushed
      first,
      for the reason the check further up this file gives at length: update() only SCHEDULES a save
      and `rev` advances 800ms later, so a read taken straight after the last control cannot see a
      write made by it.
    */
    const afterMind = await evalJs(`(async function(){
      await window.planbook.store.flush();
      var d = window.planbook.store.getDoc();
      return { rev: d.rev, log: (d.log || []).length,
        templates: JSON.stringify(d.templates || []),
        contacts: (d.log || []).filter(function(e){ return e.kind === 'contact'; }).length }; })()`);
    check('and nothing in the change-of-mind flow wrote to the document either — `rev` has not '
      + 'moved across the asking, the cancelling, the confirming, three silent rebuilds and a '
      + 'projector cycle, `log[]` is the length it was and holds no `contact`, and `templates[]` is '
      + 'byte-identical. A confirm dialog is exactly the kind of place a save gets added by accident '
      + '(Acceptance line 5), and WO-5.4’s one write is on the handoff rather than on a rebuild',
      afterMind.rev === beforeMind.rev && afterMind.log === beforeMind.log
        && afterMind.contacts === 0 && afterMind.templates === beforeMind.templates,
      'rev ' + beforeMind.rev + ' → ' + afterMind.rev + ', log ' + beforeMind.log + ' → '
        + afterMind.log + ', contact entries ' + afterMind.contacts);

    /*
      ─────────── THE SECOND DOOR OUT OF A DRAFT (WO-5.7) ───────────

      `mailto:` opens the machine's DEFAULT mail client, and a teacher whose real mail is Gmail in a
      browser tab has no default worth opening. The copy control hands her the same draft as plain
      text, and it costs no permission at all — which is why it is a feature rather than a
      workaround for the mail scope CLAUDE.md's architecture table forbids.

      IT RIDES THE WO-5.3 FIXTURE rather than planting a second one, because it is the same draft
      through a second control: the same class, the same student, the same guardian and the same
      addresses, so a block of text that named somebody else would be visible against everything
      already asserted above. What it plants is a SUBJECT and a BODY of its own, typed through the
      real `input` listener, because Acceptance line 1 is about paragraph breaks and none of the
      five fixture templates has a body this file can predict character for character.

      **THE ONE THING THIS SECTION CANNOT ASK IS THE ONE THE TRAPS LINE IS ABOUT.**
      `navigator.clipboard.writeText` is refused outside a user gesture — that is the rule that bites
      on iOS, where a copy fired from after an `await` fails silently and passes on the laptop. This
      run grants `clipboardReadWrite` at the browser level (score-grid.mjs's own note: without it
      writeText rejects on a page the harness serves), and a granted permission is exactly what makes
      the activation requirement stop applying. So a click here would pass whether or not the call
      sits inside the gesture. The claim is carried in two other places instead, and neither of them
      is this file: `tools/wo-sweep.mjs` § 24 asserts that nothing asynchronous sits between the gate
      and the call inside copyDraft(), which is the property the rule is actually about, and the tap
      itself is a 👤 line on hardware (`TESTING.md` § WO-5.7). Saying so here rather than letting a
      green click imply it is the difference between this section and a vacuous one.
    */
    const COPY_SUBJECT = 'WO-5.7 — the subject line, #3 and all';
    const COPY_BODY = 'Dear Wo53Guardian One,\n\nTwo paragraphs, an em dash — and a # in '
      + '"worksheet #3".\n\nThird paragraph, after a blank line.';
    /* WHAT THE CLIPBOARD MUST HOLD, BUILT OUT OF LITERALS AND NOT OUT OF THE MODEL. Every name and
       address in it is a fixture constant asserted independently below, so this is not the app's
       own answer handed back to it — a model that had picked the wrong recipient would fail the
       comparison rather than move the target. LF between every line, and nowhere a `\r`. */
    const COPY_WANT = 'To: Wo53Guardian One <' + G1_EMAIL + '>\n'
      + 'Cc: ' + TEACHER_EMAIL + '\n'
      + 'Subject: ' + COPY_SUBJECT + '\n'
      + '\n' + COPY_BODY;

    const beforeCopy = await evalJs(`(async function(){
      await window.planbook.store.flush();
      var d = window.planbook.store.getDoc();
      return { rev: d.rev, log: (d.log || []).length,
        templates: JSON.stringify(d.templates || []),
        contacts: (d.log || []).filter(function(e){ return e.kind === 'contact'; }).length }; })()`);

    /* ── the state this block needs, driven through the real controls ──
       The draft is put back to ONE recipient, the first guardian, through the chips a teacher taps
       and through agree(), because the draft above has been typed into and WO-5.6's confirm stands
       between an edited draft and a rebuild. *Copy me* is turned ON if a check further up left it
       off, so the `Cc:` line is a fact of this run rather than an inheritance. Then the two boxes
       are typed, which rebuilds nothing: WO-5.3's own rule.

       TWO CHIPS SINCE WO-5.8 AND THE ORDER IS FIXED. The counselor is still on the message from
       the silent-rebuild block above, and `COPY_WANT` below says the `Cc:` line is the teacher's
       own address and nothing else — so he has to come off, and the primary has to be moved back
       to the first guardian FIRST, because a row-one tap refuses to take the primary off the
       message (src/outreach-view.js's toggleOutreachRecipient()). Only the first of the two is a
       rebuild, so only the first goes through agree(). */
    await evalJs(`(function(){
      ${AGREE}
      agree(function(){
        document.querySelector('#outreachPrimary [data-outreach-primary="guardian-0"]').click(); });
      document.querySelector('#outreachRecipients [data-outreach-to="counselor"]').click();
      var m = window.planbook.outreachView.outreachModel();
      if (!m.cc.on) document.getElementById('outreachCc').click();
      return 1; })()`);
    await new Promise(r => setTimeout(r, 200));
    await evalJs(`(function(){
      var s = document.getElementById('outreachSubject');
      s.value = ${JSON.stringify(COPY_SUBJECT)};
      s.dispatchEvent(new Event('input', { bubbles: true }));
      var b = document.getElementById('outreachBody');
      b.value = ${JSON.stringify(COPY_BODY)};
      b.dispatchEvent(new Event('input', { bubbles: true }));
      return 1; })()`);
    await new Promise(r => setTimeout(r, 200));

    const copyLive = await evalJs(`(function(){
      ${DRAWN}
      var d = drawn();
      var m = window.planbook.outreachView.outreachModel();
      var b = document.getElementById('outreachCopy');
      return { modalOpen: d.open, ready: m.ready, reasons: m.reasons.length,
        there: !!b, disabled: b ? !!b.disabled : null, label: b ? b.textContent : '',
        aria: b ? (b.getAttribute('aria-label') || '') : '',
        beside: !!(b && b.parentNode
          && b.parentNode.querySelector('#outreachOpen')
          && b.parentNode.classList.contains('modal-actions')),
        copied: m.copied, clipboardLength: m.clipboard.length,
        recipientKey: m.recipient ? m.recipient.key : '',
        recipientName: m.recipient ? m.recipient.name : '',
        recipientEmail: m.recipient ? m.recipient.email : '',
        ccOn: m.cc.on, ccEmail: m.cc.email, hasHref: d.hasHref }; })()`);
    check('the copy control is drawn BESIDE the handoff in the same actions row, live on a ready '
      + 'draft, saying what it will do and not yet saying it has done it — and the draft under it '
      + 'is the one this block planted, addressed to the first guardian, the one with an address',
      copyLive.modalOpen === true && copyLive.ready === true && copyLive.reasons === 0
        && copyLive.there === true && copyLive.disabled === false && copyLive.beside === true
        && copyLive.label === 'Copy the draft' && copyLive.copied === false
        && copyLive.clipboardLength > 0 && copyLive.hasHref === true
        && copyLive.recipientKey === 'guardian-0'
        && copyLive.recipientName === 'Wo53Guardian One'
        && copyLive.recipientEmail === G1_EMAIL
        && copyLive.ccOn === true && copyLive.ccEmail === TEACHER_EMAIL,
      JSON.stringify(copyLive));

    /*
      ACCEPTANCE LINE 1, ASSERTED CHARACTER FOR CHARACTER AND NOT BY SUBSTRING. A check that looked
      for the subject somewhere in the block would pass over headers run together, a missing blank
      line, and the CRLF this work order's Traps line is about — which is the failure WO-5.3's
      mutation round found at the other door: invisible on screen, and a mangled paragraph in a real
      compose window. So the whole string is compared, and the two things a `\r` would do to it —
      show up at all, or double a break — are reported separately so a red names which.

      AND THE TWO DOORS ARE COMPARED WITH EACH OTHER, which is the cheapest proof that this is a
      second SERIALISER rather than a second draft: at this instant the `mailto:` URL carries the em
      dash as `%E2%80%94` and the `#` as `%23`, because both would otherwise break a URL, and the
      clipboard carries both as themselves, because nothing about a clipboard is a URL. One of those
      being true of the other string is the shape of the defect.
    */
    const copyText = await evalJs(`(function(){
      var m = window.planbook.outreachView.outreachModel();
      var t = m.clipboard;
      return { text: t, cr: (t.match(/\\r/g) || []).length,
        blankLines: (t.match(/\\n\\n/g) || []).length,
        emDash: t.indexOf('—') >= 0, hash: t.indexOf('#3') >= 0,
        url: m.url, urlEmDash: m.url.indexOf('%E2%80%94') >= 0,
        urlHash: m.url.indexOf('%23') >= 0, urlCrLf: m.url.indexOf('%0D%0A') >= 0 }; })()`);
    check('the copied text carries the recipient, the `Cc:`, the subject and the body — in that '
      + 'order, headers first, one blank line between them and the message — and its paragraph '
      + 'breaks are LF with not one `\\r` anywhere in it. Compared character for character against '
      + 'a string built from fixture literals, and compared with the `mailto:` URL built from the '
      + 'same draft at the same instant, which percent-encodes the em dash and the `#` and breaks '
      + 'its lines with `%0D%0A` — the two encodings are opposite on purpose (src/outreach.js)',
      copyText.text === COPY_WANT && copyText.cr === 0 && copyText.blankLines === 3
        && copyText.emDash === true && copyText.hash === true
        && copyText.urlEmDash === true && copyText.urlHash === true && copyText.urlCrLf === true,
      copyText.cr + ' carriage return(s), ' + copyText.blankLines + ' blank line(s), matches the '
        + 'expected block = ' + String(copyText.text === COPY_WANT) + '; URL encodes the em dash = '
        + copyText.urlEmDash + ', the # = ' + copyText.urlHash + ', CRLF = ' + copyText.urlCrLf
        + (copyText.text === COPY_WANT ? '' : ' :: got ' + JSON.stringify(copyText.text)));

    /*
      THE NORMALISATIONS, ASKED OF THE MODULE DIRECTLY, because the screen cannot produce the input
      they are for. A `<textarea>`'s IDL `value` normalises every newline to LF before anything in
      this app sees it, so a CR cannot be typed into the draft at all — but a template restored from
      a hand-edited backup carries whatever is in the file, and that is the path draftText() has to
      survive. Three claims: a CRLF and a lone CR in the body both become one LF; a break inside a
      header is folded to a single space, because a header is one line by definition and a
      `Subject:` carrying a break stops the block being readable as headers-then-message; and an
      administrator — who has an address and no name anywhere in this schema — is written once
      rather than as `admin@school <admin@school>`.
    */
    const copyEdges = await evalJs(`(function(){
      var f = window.planbook.outreach.draftText;
      /* to and cc are LISTS since WO-5.14 — one element here, because these four claims are about
         the body, the header fold and the admin row, not about several addresses; the block after
         this one is where the lists are more than one long. (No backticks in here; it is inside a
         template literal and one would close it.) */
      return {
        crlf: f({ to:['a@b.test'], subject:'S', body:'one\\r\\ntwo\\rthree\\nfour' }),
        folded: f({ to:['a@b.test'], name:'Gr\\nace Hopper', subject:'two\\nlines', body:'b' }),
        admin: f({ to:['${ADMIN_EMAIL}'], name:'${ADMIN_EMAIL}', subject:'S', body:'b' }),
        noCc: f({ to:['a@b.test'], cc:[], subject:'S', body:'b' }).indexOf('Cc:') >= 0 }; })()`);
    check('draftText() folds every line ending in the BODY to LF — a CRLF and a lone CR alike — '
      + 'folds a break inside a header onto the one line a header is, writes an administrator’s '
      + 'address once rather than as its own display name, and leaves an empty `Cc:` out '
      + 'altogether, which is mailtoUrl()’s rule about an empty header kept at the second door',
      copyEdges.crlf === 'To: a@b.test\nSubject: S\n\none\ntwo\nthree\nfour'
        && copyEdges.folded === 'To: Gr ace Hopper <a@b.test>\nSubject: two lines\n\nb'
        && copyEdges.admin === 'To: ' + ADMIN_EMAIL + '\nSubject: S\n\nb'
        && copyEdges.noCc === false,
      JSON.stringify(copyEdges));

    /*
      ─────────── WO-5.14: THE THREE DOORS TAKE A LIST, ASKED OF THE MODULE DIRECTLY ───────────

      NOTHING ON THE SCREEN CAN PRODUCE A DRAFT WITH TWO RECIPIENTS YET — the picker is WO-5.8 —
      so every claim here is made against the builders with a hand-built draft, in the shape the
      four claims above already use. That is the work order's own design ("it lands invisibly"):
      the view passes one-element lists, every DOM-read check in this section stays byte-identical,
      and the multi-address behaviour is proved where it lives. `wo-sweep.mjs` § 24 is what makes
      that honest — the module imports no store and mutates nothing, so a draft object is the whole
      of its input.

      THE ADDRESSES ARE FIXTURE LITERALS AND THE URLS ARE TAKEN APART BY THE SAME SPLIT THE CHECKS
      ABOVE USE, so a wrong join lands in the `to` part where a check can name it. The one
      character these fixtures are about is the comma: RFC 6068's list separator, which must arrive
      LITERAL between addresses and must never arrive as `%2C` — that is the shape of the defect
      the deliverable names (encode the joined string, restore only the `@`), and a fixture with
      one address cannot see it. The `+` in the second address is there so that the encoding still
      demonstrably RUNS per address: `%2B` inside, a bare `,` between.
    */
    const LIST_TO = ['wo514primary@example.invalid', 'wo514second+tag@example.invalid'];
    const LIST_CC = [COUNSELOR_EMAIL, TEACHER_EMAIL];
    const listed = await evalJs(`(function(){
      var o = window.planbook.outreach;
      var to = ${JSON.stringify(LIST_TO)}, cc = ${JSON.stringify(LIST_CC)};
      var draft = { to: to, cc: cc, subject: 'S & #3', body: 'one\\ntwo\\n\\nthree' };
      var take = function(href, scheme){
        var q = href.indexOf('?');
        var params = {};
        (q < 0 ? '' : href.slice(q + 1)).split('&').forEach(function(pair){
          var at = pair.indexOf('=');
          if (at > 0) params[pair.slice(0, at)] = pair.slice(at + 1); });
        var toPart = scheme === 'mailto' ? href.slice('mailto:'.length, q < 0 ? href.length : q)
          : (params.to || '');
        return { href: href, to: toPart, cc: params.cc || '', keys: Object.keys(params),
          toList: toPart.split(',').map(decodeURIComponent),
          ccList: (params.cc || '').split(',').map(decodeURIComponent),
          pctComma: href.indexOf('%2C') >= 0 || href.indexOf('%2c') >= 0,
          pctAt: href.indexOf('%40') >= 0,
          body: params.body || '' }; };
      return { mailto: take(o.mailtoUrl(draft), 'mailto'),
        gmail: take(o.composeUrl(draft, 'gmail'), 'https'),
        outlook: take(o.composeUrl(draft, 'outlook'), 'https') }; })()`);
    check('WO-5.14: mailtoUrl() carries TWO addresses in the `to` part and two in `cc=`, each '
      + 'percent-encoded on its own and joined by a LITERAL comma — the `+` in the second address '
      + 'arrives as %2B, no %2C appears anywhere in the URL, every `@` is literal, and each part '
      + 'decodes back to the fixture list address for address (RFC 6068 § 2, `addr-spec *("," '
      + 'addr-spec)`); the body is still CRLF, because the split with the compose doors is not '
      + 'this work order’s to collapse',
      /^mailto:/.test(listed.mailto.href) && listed.mailto.pctComma === false
        && listed.mailto.pctAt === false
        && listed.mailto.to === 'wo514primary@example.invalid,wo514second%2Btag@example.invalid'
        && listed.mailto.cc === COUNSELOR_EMAIL + ',' + TEACHER_EMAIL
        && JSON.stringify(listed.mailto.toList) === JSON.stringify(LIST_TO)
        && JSON.stringify(listed.mailto.ccList) === JSON.stringify(LIST_CC)
        && listed.mailto.body.indexOf('%0D%0A') >= 0
        && listed.mailto.body.replace(/%0D%0A/g, '').indexOf('%0A') < 0,
      'to = ' + listed.mailto.to + ', cc = ' + listed.mailto.cc + ', %2C present = '
        + listed.mailto.pctComma);
    check('and both compose doors carry the same two lists in `to=` and `cc=`, the same literal '
      + 'comma between and the same %2B inside, decoding to the same addresses — with the body '
      + 'LF at both, so the list changed nothing about the line-break split either way',
      /^https:\/\/mail\.google\.com\//.test(listed.gmail.href)
        && /^https:\/\/outlook\.office\.com\//.test(listed.outlook.href)
        && listed.gmail.to === listed.mailto.to && listed.outlook.to === listed.mailto.to
        && listed.gmail.cc === listed.mailto.cc && listed.outlook.cc === listed.mailto.cc
        && listed.gmail.pctComma === false && listed.outlook.pctComma === false
        && listed.gmail.pctAt === false && listed.outlook.pctAt === false
        && JSON.stringify(listed.gmail.toList) === JSON.stringify(LIST_TO)
        && JSON.stringify(listed.outlook.ccList) === JSON.stringify(LIST_CC)
        && listed.gmail.keys.indexOf('su') >= 0 && listed.outlook.keys.indexOf('subject') >= 0
        && listed.gmail.body.indexOf('%0A') >= 0 && listed.gmail.body.indexOf('%0D') < 0
        && listed.outlook.body.indexOf('%0A') >= 0 && listed.outlook.body.indexOf('%0D') < 0,
      'gmail to = ' + listed.gmail.to + '; outlook cc = ' + listed.outlook.cc);

    /* THE EMPTY-HEADER RULE, PER ELEMENT NOW. A blank inside a list is dropped rather than joined
       as a trailing comma, a list of blanks is no header at all, and an ABSENT `cc` is the same
       as an empty one — mailtoUrl()'s rule since WO-5.3, kept at all three doors. */
    const blanks = await evalJs(`(function(){
      var o = window.planbook.outreach;
      var d = { to: ['a@b.test', '', '   '], cc: ['', ' '], subject: 'S', body: 'b' };
      var absent = { to: ['a@b.test'], subject: 'S', body: 'b' };
      return {
        mailto: o.mailtoUrl(d), gmail: o.composeUrl(d, 'gmail'), outlook: o.composeUrl(d, 'outlook'),
        absentMailto: o.mailtoUrl(absent), absentGmail: o.composeUrl(absent, 'gmail'),
        text: o.draftText({ to: ['a@b.test', ''], cc: [' '], subject: 'S', body: 'b' }) }; })()`);
    check('a blank inside a list is dropped and a list of blanks is no header: `to` of one address '
      + 'and two blanks is `mailto:a@b.test` with no trailing comma, `cc` of two blanks puts no '
      + '`cc=` on any of the three doors, an absent `cc` is the same as an empty one, and the '
      + 'clipboard block writes no `Cc:` line for it either',
      blanks.mailto === 'mailto:a@b.test?subject=S&body=b'
        && /[?&]to=a@b\.test&/.test(blanks.gmail) && !/[?&]cc=/.test(blanks.gmail)
        && /\?to=a@b\.test&/.test(blanks.outlook) && !/[?&]cc=/.test(blanks.outlook)
        && blanks.absentMailto === 'mailto:a@b.test?subject=S&body=b'
        && !/[?&]cc=/.test(blanks.absentGmail)
        && blanks.text === 'To: a@b.test\nSubject: S\n\nb',
      JSON.stringify({ mailto: blanks.mailto, text: blanks.text }));

    /* ONE SHAPE ONLY. The Traps line forbids a builder that accepts a string as well "so nothing
       breaks", and the only way to assert an absence of tolerance is to hand it the string and
       require the refusal: every builder, both fields, a TypeError that names the field, and no
       URL or block produced. A builder that quietly wrapped the string would return a perfectly
       good one-address URL here, which is exactly why the check reads the throw and not the
       output. */
    const stringRefused = await evalJs(`(function(){
      var o = window.planbook.outreach;
      var doors = { mailto: function(d){ return o.mailtoUrl(d); },
        gmail: function(d){ return o.composeUrl(d, 'gmail'); },
        outlook: function(d){ return o.composeUrl(d, 'outlook'); },
        text: function(d){ return o.draftText(d); } };
      var out = {};
      Object.keys(doors).forEach(function(k){
        var asTo = null, asCc = null, wrapped = [];
        try { wrapped.push(doors[k]({ to: 'a@b.test', cc: [], subject: 'S', body: 'b' })); }
        catch (e) { asTo = e.name + ': ' + e.message; }
        try { wrapped.push(doors[k]({ to: ['a@b.test'], cc: 'c@d.test', subject: 'S', body: 'b' })); }
        catch (e) { asCc = e.name + ': ' + e.message; }
        out[k] = { asTo: asTo, asCc: asCc, wrapped: wrapped.length }; });
      return out; })()`);
    check('and a STRING handed to any of the four builders is refused rather than quietly wrapped '
      + '— a TypeError naming `draft.to` or `draft.cc`, from mailtoUrl(), both compose doors and '
      + 'draftText(), and not one URL or block produced (the Traps line: one shape only)',
      ['mailto', 'gmail', 'outlook', 'text'].every((k) => stringRefused[k]
        && /^TypeError: draft\.to must be a list/.test(stringRefused[k].asTo || '')
        && /^TypeError: draft\.cc must be a list/.test(stringRefused[k].asCc || '')
        && stringRefused[k].wrapped === 0),
      JSON.stringify(stringRefused));

    /* THE CLIPBOARD BLOCK: the name is the PRIMARY's and nobody else's, further To addresses ride
       bare after her, and `Cc:` is the list comma-joined. The admin row — an address standing in
       for a name — is asserted with a second address beside it, because that is the case where
       `admin@school <admin@school>, other` would read as a mistake twice over. */
    const listedText = await evalJs(`(function(){
      var f = window.planbook.outreach.draftText;
      return {
        named: f({ to: ${JSON.stringify(LIST_TO)}, name: 'Jane Okafor', cc: ${JSON.stringify(LIST_CC)},
          subject: 'S', body: 'b' }),
        admin: f({ to: ['${ADMIN_EMAIL}', 'x@y.test'], name: '${ADMIN_EMAIL}', cc: [],
          subject: 'S', body: 'b' }) }; })()`);
    check('draftText() writes `Name <primary>` for the first address only, the second To address '
      + 'bare after a comma, and `Cc:` as the comma-joined list; an administrator with a second '
      + 'address beside her is written `admin, other` and never as her own display name',
      listedText.named === 'To: Jane Okafor <' + LIST_TO[0] + '>, ' + LIST_TO[1] + '\n'
          + 'Cc: ' + LIST_CC.join(', ') + '\nSubject: S\n\nb'
        && listedText.admin === 'To: ' + ADMIN_EMAIL + ', x@y.test\nSubject: S\n\nb',
      JSON.stringify(listedText));

    /* THE CEILING COUNTS THE ADDRESSES, BY CONSTRUCTION AND NOT BY A SECOND COUNT. The claim is
       that overCeiling() reads the whole URL and the URL now contains every address — so the
       fixture is a body that fits under 2,000 encoded on its own and crosses it ONLY when six long
       addresses are added, and the long URL is asserted to still carry all six, because "warns
       rather than truncates" is the half of the line that must not move. ceilingFor() is read for
       the two webmail doors in the same breath: the count is correct on the one door that has a
       ceiling, and the other two still have none (the third Traps line). */
    const ceilingList = await evalJs(`(function(){
      var o = window.planbook.outreach;
      var body = '';
      while (body.length < 1400) body += 'A sentence of ordinary length about the term. ';
      var more = [];
      for (var i = 0; i < 6; i++) {
        more.push('wo514.a.long.guardian.address.number.' + i + '@a.long.district.domain.example.invalid'); }
      var alone = o.mailtoUrl({ to: ['p@example.invalid'], cc: [], subject: 'S', body: body });
      var crowd = o.mailtoUrl({ to: ['p@example.invalid', more[0], more[1]], cc: more.slice(2),
        subject: 'S', body: body });
      var crowdGmail = o.composeUrl({ to: ['p@example.invalid', more[0], more[1]], cc: more.slice(2),
        subject: 'S', body: body }, 'gmail');
      return { aloneLength: alone.length, aloneOver: o.overCeiling(alone),
        crowdLength: crowd.length, crowdOver: o.overCeiling(crowd),
        carried: more.filter(function(a){ return crowd.indexOf(a) >= 0; }).length,
        carriedGmail: more.filter(function(a){ return crowdGmail.indexOf(a) >= 0; }).length,
        ceiling: o.MAILTO_CEILING, forDefault: o.ceilingFor('default'),
        forGmail: o.ceilingFor('gmail'), forOutlook: o.ceilingFor('outlook') }; })()`);
    check('the ceiling counts every address on the wire: a body that is under 2,000 encoded with '
      + 'one recipient is OVER it with six long addresses in `to` and `cc` and nothing else '
      + 'changed, overCeiling() says so, the long URL still carries all six on the mailto: and on '
      + 'the Gmail door (nothing truncates), and ceilingFor() is still 2000 for the default door '
      + 'and null for both webmail doors',
      ceilingList.aloneOver === false && ceilingList.aloneLength < ceilingList.ceiling
        && ceilingList.crowdOver === true && ceilingList.crowdLength > ceilingList.ceiling
        && ceilingList.carried === 6 && ceilingList.carriedGmail === 6
        && ceilingList.ceiling === 2000 && ceilingList.forDefault === 2000
        && ceilingList.forGmail === null && ceilingList.forOutlook === null,
      ceilingList.aloneLength + ' alone → ' + ceilingList.crowdLength + ' with six addresses, over = '
        + ceilingList.crowdOver + ', carried ' + ceilingList.carried + '/6, ceilingFor gmail = '
        + JSON.stringify(ceilingList.forGmail));

    /*
      AND THE TAP ACTUALLY WRITES IT. Two readings, because one alone is weak. The spy WRAPS the
      real writeText rather than replacing it — it records the argument and hands the call straight
      on — so the platform still receives the string and the check still learns exactly what the app
      handed over, which a read-back alone cannot tell from a lucky earlier write. The read-back is
      the other half: it proves the platform took it. It is normalised before comparison because the
      line ending on the far side of a clipboard is the PLATFORM's — Chromium writes CRLF onto the
      Windows clipboard itself — and the app's contribution is the string asserted above, not what
      Windows does with it afterwards.

      The permission is granted at the browser level, without the page session, exactly as
      score-grid.mjs does it and for its reason: the harness's origin is a secure context because it
      is 127.0.0.1, and without the grant writeText rejects.
    */
    let copyPerm = 'not asked';
    try {
      await send('Browser.grantPermissions',
        { origin: 'http://127.0.0.1:' + PORT,
          permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'] }, false);
      copyPerm = 'granted';
    } catch (e) { copyPerm = 'refused: ' + e.message; }
    await evalJs(`(function(){
      window.__wo57 = { calls: [] };
      var c = navigator.clipboard;
      window.__wo57real = c.writeText;
      c.writeText = function(text){
        window.__wo57.calls.push(String(text));
        return window.__wo57real.call(c, text); };
      return 1; })()`);
    await clickSel('#outreachCopy');
    await new Promise(r => setTimeout(r, 400));
    const copyDone = await evalJs(`(async function(){
      var read = '';
      var err = '';
      try { read = await navigator.clipboard.readText(); } catch (e) { err = e.name + ': ' + e.message; }
      var calls = window.__wo57.calls;
      navigator.clipboard.writeText = window.__wo57real;
      return { calls: calls.length, handed: calls[0] || '', read: read, err: err,
        readNormalised: String(read).replace(/\\r\\n/g, '\\n') }; })()`);
    check('tapping it hands exactly that block to `navigator.clipboard.writeText`, ONCE, and the '
      + 'platform takes it — the clipboard reads back the same text, normalised for the line ending '
      + 'the operating system puts on its own clipboard. The spy wraps the real call rather than '
      + 'standing in for it, so a read-back cannot be satisfied by an earlier write',
      copyPerm === 'granted' && copyDone.calls === 1 && copyDone.handed === COPY_WANT
        && copyDone.err === '' && copyDone.readNormalised === COPY_WANT,
      'clipboard ' + copyPerm + ', ' + copyDone.calls + ' call(s), handed matches = '
        + String(copyDone.handed === COPY_WANT) + ', read back matches = '
        + String(copyDone.readNormalised === COPY_WANT)
        + (copyDone.err ? ', readText ' + copyDone.err : ''));

    /*
      ACCEPTANCE LINE 3. It says it worked, in both channels, and the control stops looking
      identical to the control that has not been pressed — WO-5.7's third Deliverable in as many
      words: *a copy button that looks identical before and after is a button people press four
      times*. The live region is read as well as the status line, because the acknowledgement is one
      short line of type under a row of buttons, which is exactly what a screen reader has no reason
      to be looking at.

      AND THE ACKNOWLEDGEMENT NAMES NOBODY, which is asserted rather than assumed: the status line
      lives inside the panel presentation mode empties, and a sentence about a copy has no reason to
      carry a student, a guardian or an address even there.
    */
    const copySaid = await evalJs(`(function(){
      var line = document.getElementById('outreachStatus');
      var b = document.getElementById('outreachCopy');
      var m = window.planbook.outreachView.outreachModel();
      var said = (document.getElementById('srLive') || {}).textContent || '';
      var hay = line.textContent + ' ' + b.textContent + ' ' + (b.getAttribute('aria-label') || '')
        + ' ' + said;
      return { status: line.textContent, hidden: line.classList.contains('hidden'),
        label: b.textContent, aria: b.getAttribute('aria-label') || '', said: said,
        copied: m.copied,
        names: /Wo53Full|Wo53Guardian|Ada|Addie|example\\.invalid/.test(hay) }; })()`);
    check('the teacher is told the copy happened — the status line under the actions says so and is '
      + 'no longer hidden, the button’s own label has moved off *Copy the draft*, and `announce()` '
      + 'put a sentence in the live region for a reader who is not looking at that line. None of '
      + 'the three names a student, a guardian or an address',
      copySaid.copied === true && copySaid.hidden === false
        && copySaid.status.indexOf('Copied') === 0 && copySaid.label === 'Copied'
        && /copied/i.test(copySaid.said) && copySaid.aria.indexOf('Copied') === 0
        && copySaid.names === false,
      JSON.stringify(copySaid));

    /*
      ACCEPTANCE LINE 2, FIRST HALF: A BLOCKED DRAFT COPIES NOTHING. The draft is blocked the way a
      teacher blocks one — by typing a merge field into the body that nothing will ever fill — which
      is the state the block strip is about and the state the handoff refuses by having no `href`.

      THE REFUSAL IS ASKED THREE WAYS, because a button is not a link and the mechanism had to be
      re-decided. The model has nothing to copy (`clipboard` is '' exactly as `url` is). The control
      is `disabled`, which is the structural equivalent of the link's missing `href`: a click
      dispatched at a disabled button does not fire a `click` event at all, so the delegated
      listener is never reached — and that is asserted by dispatching one and watching the spy stay
      empty. And copyDraft() is called DIRECTLY, past the markup altogether, because "the markup
      says so" is not the kind of answer this app makes about a disclosure — recordHandoff()'s own
      posture, and the reason both ends read one outreachModel().
    */
    await evalJs(`(function(){
      var b = document.getElementById('outreachBody');
      b.value = 'Dear {{guardian.nickname}}, this draft is blocked.';
      b.dispatchEvent(new Event('input', { bubbles: true }));
      return 1; })()`);
    await new Promise(r => setTimeout(r, 200));
    const copyBlocked = await evalJs(`(function(){
      window.__wo57.calls = [];
      var real = navigator.clipboard.writeText;
      navigator.clipboard.writeText = function(t){ window.__wo57.calls.push(String(t));
        return Promise.resolve(); };
      var b = document.getElementById('outreachCopy');
      b.click();
      var direct = window.planbook.outreachView.copyDraft();
      navigator.clipboard.writeText = real;
      var m = window.planbook.outreachView.outreachModel();
      var link = document.getElementById('outreachOpen');
      return { ready: m.ready, reasons: m.reasons.length, clipboard: m.clipboard,
        disabled: !!b.disabled, label: b.textContent, calls: window.__wo57.calls.length,
        direct: direct, hasHref: link.hasAttribute('href') }; })()`);
    check('a blocked draft cannot be copied, and the refusal is structural rather than a control '
      + 'declining: the model has nothing to copy, the button is `disabled` so a click dispatched '
      + 'at it raises no event at all, and copyDraft() called directly — past the markup — still '
      + 'refuses, because it asks the same model the handoff link asks. The link beside it has lost '
      + 'its `href` in the same paint',
      copyBlocked.ready === false && copyBlocked.reasons > 0 && copyBlocked.clipboard === ''
        && copyBlocked.disabled === true && copyBlocked.calls === 0 && copyBlocked.direct === false
        && copyBlocked.hasHref === false && copyBlocked.label === 'Copy the draft',
      JSON.stringify(copyBlocked));

    /*
      ACCEPTANCE LINE 2, SECOND HALF: PRESENTATION MODE TAKES THE CONTROL DOWN WITH THE REST OF THE
      FLOW. The draft is put back to a READY one first, and the copy is pressed again, so that the
      projector is switched on over a flow that has something to copy and has just copied it —
      otherwise this would be the check above wearing a projector's clothes.

      WHAT IS ASSERTED IS THE SAME POSTURE THE REST OF THE PANEL TAKES: the model returns before it
      has a recipient, so `clipboard` is '' beside `url`; the control is disabled rather than merely
      undrawn, because `display: none` is not a refusal any more than it is a redaction; and the
      label is back at its resting word, because *Copied* left standing over an emptied panel is the
      flow reporting on a draft nothing on screen admits to.

      THE OPEN EDGE IS NOT ASSERTED BECAUSE IT CANNOT BE FIXED: a draft copied a minute before the
      projector went on is still on the operating system's clipboard, and nothing in a browser can
      reach in and take it back. src/outreach-view.js writes that down at its own point of
      departure rather than implying the mode covers it.
    */
    await evalJs(`(function(){
      var b = document.getElementById('outreachBody');
      b.value = ${JSON.stringify(COPY_BODY)};
      b.dispatchEvent(new Event('input', { bubbles: true }));
      return 1; })()`);
    await new Promise(r => setTimeout(r, 200));
    await clickSel('#outreachCopy');
    await new Promise(r => setTimeout(r, 350));
    await evalJs(`(function(){
      document.querySelector('header [data-presentation-toggle]').click(); return 1; })()`);
    await new Promise(r => setTimeout(r, 300));
    const copyProjected = await evalJs(`(function(){
      var b = document.getElementById('outreachCopy');
      var m = window.planbook.outreachView.outreachModel();
      var hay = document.getElementById('outreachModal').textContent;
      return { blocked: m.blocked, clipboard: m.clipboard, copied: m.copied,
        disabled: !!b.disabled, label: b.textContent,
        direct: window.planbook.outreachView.copyDraft(),
        formHidden: document.getElementById('outreachForm').classList.contains('hidden'),
        names: hay.indexOf('Wo53Full') >= 0 || hay.indexOf('Wo53Guardian') >= 0
          || hay.indexOf('${G1_EMAIL}') >= 0 }; })()`);
    check('presentation mode disables the copy with the rest of the flow — the model has nothing to '
      + 'copy, the control is `disabled` rather than merely undrawn, its label is back at its '
      + 'resting word rather than still reading *Copied* over an emptied panel, and copyDraft() '
      + 'called directly refuses. No student, guardian or address is left anywhere in the modal',
      copyProjected.blocked === true && copyProjected.clipboard === ''
        && copyProjected.copied === false && copyProjected.disabled === true
        && copyProjected.label === 'Copy the draft' && copyProjected.direct === false
        && copyProjected.formHidden === true && copyProjected.names === false,
      JSON.stringify(copyProjected));
    await evalJs(`(function(){
      document.querySelector('header [data-presentation-toggle]').click(); return 1; })()`);
    await new Promise(r => setTimeout(r, 300));

    /*
      ACCEPTANCE LINE 4. Two real copies, a blocked one, a refused one, a projector cycle and a
      dozen keystrokes, and the document has not moved. **This is the half a fixture can prove**;
      the other half is tools/wo-sweep.mjs § 24, which proves there is nothing in src/outreach.js
      that COULD write on any input and nothing inside copyDraft() that reaches a writer — § 17's
      division of labour, applied to the second door.

      FLUSHED FIRST, for the reason every `rev` reading in this file carries: update() only
      SCHEDULES a save and `rev` advances 800ms later, so a reading taken straight after the last
      control cannot see a write made by it. `log[]` is counted as well as `rev`, because WO-5.4
      gave this flow one writer and a copy is not it: Planbook cannot tell whether a copied string
      was ever pasted anywhere, and a `contact` entry written on a copy would be the app recording
      an outreach that may never have happened — which src/log.js's append-only rule makes
      impossible to take back.
    */
    const afterCopy = await evalJs(`(async function(){
      await window.planbook.store.flush();
      var d = window.planbook.store.getDoc();
      var leaked = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        var v = String(localStorage.getItem(k));
        if (/clipboard|Copied|WO-5\\.7|worksheet|example\\.invalid/i.test(k + ' ' + v)) leaked.push(k);
      }
      return { rev: d.rev, log: (d.log || []).length,
        templates: JSON.stringify(d.templates || []),
        contacts: (d.log || []).filter(function(e){ return e.kind === 'contact'; }).length,
        leaked: leaked }; })()`);
    check('and copying wrote NOTHING to the document — `rev` has not moved across two real copies, '
      + 'a blocked one, a refusal, a projector cycle and every keystroke between them, `log[]` is '
      + 'the length it was and still holds no `contact`, `templates[]` is byte-identical, and no '
      + '`planbook_` key mentions the clipboard, the copied draft or an address. The handoff writes '
      + 'one entry and the copy writes none, which is the difference between a message that left '
      + 'the building and a string on a clipboard',
      afterCopy.rev === beforeCopy.rev && afterCopy.log === beforeCopy.log
        && afterCopy.contacts === 0 && afterCopy.templates === beforeCopy.templates
        && afterCopy.leaked.length === 0,
      'rev ' + beforeCopy.rev + ' → ' + afterCopy.rev + ', log ' + beforeCopy.log + ' → '
        + afterCopy.log + ', contact entries ' + afterCopy.contacts + ', localStorage '
        + (afterCopy.leaked.length ? JSON.stringify(afterCopy.leaked) : 'mentions none of it'));

    /*
      ─────────── WO-5.12: A WEBMAIL CLICK IS LOGGED EXACTLY AS A mailto: CLICK ───────────

      BELOW EVERY `rev` READING IN THIS FILE ON PURPOSE. The two checks above and the one at
      "DRAFTING wrote nothing" all rest on nothing above them having pressed the handoff, and this
      is the first press in the section — so it sits at the foot, after the last of them, on the
      same ready draft the copy block planted. The press is tools/verify/contact-log.mjs's: a
      capture-phase listener installed for exactly one click stops the navigation, so the page is
      not handed to a compose tab, and `prevented` is reported so a reader can see which side
      stopped it. What is asserted is that the anchor under the press was the https one, wearing
      `_blank`, and that src/shell.js's hook wrote ONE `contact` — the listener never reads the
      `href`, so a webmail handoff is a handoff, and the status line names the door.
    */
    const webmailPress = await evalJs(`(async function(){
      ${DRAWN}
      document.querySelector('#outreachMail [data-outreach-mail="gmail"]').click();
      await window.planbook.store.flush();
      var d0 = window.planbook.store.getDoc();
      var logBefore = (d0.log || []).length;
      var mine = function(doc){ return (doc.log || []).filter(function(e){
        return String(e.studentId).indexOf('s_wo53') === 0; }); };
      var mineBefore = mine(d0).length;
      var m = window.planbook.outreachView.outreachModel();
      var link = document.getElementById('outreachOpen');
      var under = { href: link.getAttribute('href'), target: link.getAttribute('target'),
        rel: link.getAttribute('rel') };
      var stop = function(e){ e.preventDefault(); };
      window.addEventListener('click', stop, true);
      var ev = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
      var wentThrough = link.dispatchEvent(ev);
      window.removeEventListener('click', stop, true);
      await window.planbook.store.flush();
      var d1 = window.planbook.store.getDoc();
      var entries = mine(d1);
      var e = entries[entries.length - 1] || null;
      return { ready: m.ready, https: m.https, under: under, prevented: !wentThrough,
        logBefore: logBefore, logAfter: (d1.log || []).length,
        mineBefore: mineBefore, mineAfter: entries.length,
        kind: e ? e.kind : '', audience: e ? e.audience : '',
        subjectLogged: e ? e.subject === m.subject : false,
        bodyLogged: e ? e.body === m.body : false,
        status: document.getElementById('outreachStatus').textContent,
        stillOpen: !document.getElementById('outreachModal').classList.contains('hidden'),
        pref: window.planbook.getPref('mailDoor') }; })()`);
    check('pressing the handoff under *Gmail in the browser* appends exactly ONE `contact` entry '
      + '— the anchor under the press was the https compose URL wearing target="_blank", the '
      + 'hook never read it, the subject and body logged are the ones in the two boxes, the '
      + 'status line says it was handed to Gmail, and the modal is still open on the draft '
      + '(Acceptance line 3)',
      webmailPress.ready === true && webmailPress.https === true
        && /^https:\/\/mail\.google\.com\//.test(webmailPress.under.href || '')
        && webmailPress.under.target === '_blank' && webmailPress.prevented === true
        && webmailPress.logAfter === webmailPress.logBefore + 1
        && webmailPress.mineAfter === webmailPress.mineBefore + 1
        && webmailPress.kind === 'contact' && webmailPress.audience === 'guardian'
        && webmailPress.subjectLogged === true && webmailPress.bodyLogged === true
        && /Handed to Gmail and logged/.test(webmailPress.status)
        && webmailPress.stillOpen === true && webmailPress.pref === 'gmail',
      'log ' + webmailPress.logBefore + ' → ' + webmailPress.logAfter + ', kind '
        + JSON.stringify(webmailPress.kind) + ', href under the press '
        + String(webmailPress.under.href || '').slice(0, 45) + '…, target '
        + JSON.stringify(webmailPress.under.target) + ', status "'
        + String(webmailPress.status).slice(0, 40) + '…"');

    /* THE THREE CHIPS AT 390px UNDER A COARSE POINTER, named rather than left to the count in the
       touch pass above — which measured them too, as three more `button`s in the modal, but a
       floor that reached every control except the three this work order added would pass a count
       and fail a thumb. Then the preference is put back to the default, so the section leaves the
       browser as it found it and the iPad's shape — a `mailto:`, no target — is what every later
       section reads. */
    await send('Emulation.setDeviceMetricsOverride',
      { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await new Promise(r => setTimeout(r, 300));
    const chipTouch = await evalJs(`(function(){
      var out = [];
      document.querySelectorAll('#outreachMail [data-outreach-mail]').forEach(function(e){
        var r = e.getBoundingClientRect();
        out.push({ door: e.getAttribute('data-outreach-mail'),
          w: Math.round(r.width * 100) / 100, h: Math.round(r.height * 100) / 100 }); });
      document.querySelector('#outreachMail [data-outreach-mail="default"]').click();
      var link = document.getElementById('outreachOpen');
      return { chips: out, under: out.filter(function(m){ return m.h < 44 || m.w < 44; }),
        coarse: matchMedia('(pointer: coarse)').matches,
        pref: window.planbook.getPref('mailDoor'),
        href: link.getAttribute('href') || '', target: link.getAttribute('target'),
        rel: link.getAttribute('rel') }; })()`);
    check('the three *Where does your mail live?* chips each measure at least 44px on both axes at '
      + '390px under a coarse pointer, and the preference is put back to the default — the link is '
      + 'a mailto: with no target and no rel again, which is the shape every section after this '
      + 'one reads',
      chipTouch.coarse === true && chipTouch.chips.length === 3 && chipTouch.under.length === 0
        && chipTouch.pref === 'default' && /^mailto:/.test(chipTouch.href)
        && chipTouch.target === null && chipTouch.rel === null,
      chipTouch.chips.map((m) => m.door + ' ' + m.w + '×' + m.h).join(', ')
        + '; pref back to ' + JSON.stringify(chipTouch.pref));
    await send('Emulation.setDeviceMetricsOverride',
      { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await new Promise(r => setTimeout(r, 200));

    /*
      ─────────── AND THE BLOCK THAT SURVIVED THE REFUSAL MOVING (WO-5.8) ───────────

      THIS CHECK EXISTS BECAUSE WO-5.8 COULD HAVE DELETED A CHECK'S SUBJECT WITHOUT DELETING THE
      CHECK. `outreachModel()` still builds a `reasons` entry of `kind: 'recipient'` for a draft
      whose recipient has no address, and until 2026-09-20 the only thing in this file that reached
      it was the tap on Guardian 2's chip — which is now refused at the door, so that path is gone.
      The entry is not dead: a student with nobody addressable on her roster entry OPENS on
      somebody with no address, because openOutreach() takes the first recipient with an email and
      falls back to the first row when there is none. Cal has no guardians, no counselor address
      and no address of her own; the administrator's is the teacher's own Settings field and is
      cleaned off with the fixture. So the draft opens BLOCKED, in this flow's own words rather
      than the resolver's — it has never heard of a recipient — and the app still never opens a
      mail window with an empty To field.

      IT IS OPENED THROUGH openOutreach() RATHER THAN THROUGH A DOOR, and that is the one thing in
      this section that skips wiring. Both doors are driven and asserted above — the signal card
      and the student record, each in its own check — and Cal has no signal, so the card cannot
      reach her and the record would cost this section a four-hop navigation away from the modal
      every check above it left open. What is read afterwards is the DOM and the model, which is
      what this block is about.

      THE ADMINISTRATOR'S ADDRESS COMES OFF THE FIXTURE FIRST, and without that this check would
      quietly assert nothing: `teacher.adminEmail` is set for the whole section, so Cal's *Admin*
      row HAS an address, openOutreach() would seed the draft on it and the draft would be ready.
      Blanking it is the state the reason is about — nobody on this roster entry and no
      administrator either — and it is a write to the FIXTURE rather than by the flow, which is why
      it is safe here and only here: it is after the last `rev` reading in this section, and the
      cleanup below puts the whole `teacher` block back as it was found regardless. It runs last,
      after every reading that depends on Ada's draft, and the cleanup closes what it opens.
    */
    const nobody = await evalJs(`(function(){
      ${DRAWN}
      window.planbook.store.update(function(doc){ doc.teacher.adminEmail = ''; });
      window.planbook.outreachView.openOutreach(
        { studentId: '${ORPHAN}', classId: '${CLS}', termId: '${TERM}', hits: [] });
      var d = drawn();
      var m = window.planbook.outreachView.outreachModel();
      return { open: d.open, name: m.name,
        chips: d.chips, primaryShown: d.primaryShown,
        chosen: m.recipients.filter(function(r){ return r.chosen; }).length,
        recipient: m.recipient ? m.recipient.key : '', ready: m.ready,
        hasHref: d.hasHref, clear: d.clear, reasons: d.reasons,
        kinds: m.reasons.map(function(r){ return r.kind; }) }; })()`);
    check('and a student with nobody addressable on her roster entry still opens BLOCKED, with '
      + 'this flow’s own sentence about a recipient rather than the resolver’s — every chip in the '
      + 'row is drawn and every one of them is refused, the draft opens on one of them anyway '
      + 'because a message has to be written to somebody, and there is no href. That is the '
      + '`kind: "recipient"` reason still doing its job after WO-5.8 moved the addressless tap to '
      + 'the door: the rule that the app never opens a mail window with an empty To field is '
      + 'unchanged, and it is asserted on the path that can still reach it',
      nobody.open === true && nobody.name === 'Cal Wo53Orphan'
        && nobody.chosen === 1 && nobody.recipient === 'counselor'
        && nobody.chips.length === 3
        && nobody.chips.every((c) => /\|refused$/.test(c))
        && nobody.primaryShown === false
        && nobody.ready === false && nobody.hasHref === false && nobody.clear === false
        && nobody.kinds.indexOf('recipient') >= 0
        && nobody.reasons.some((r) => /no email address on file for counselor/i.test(r)),
      'chips ' + nobody.chips.join(' · ') + '; ready = ' + nobody.ready + ', reasons '
        + JSON.stringify(nobody.kinds));

    /* ── and the fixture comes back off ──
       OFF THE SCREEN FIRST, for the reason templates.mjs leaves its own screen before it takes its
       class apart: the class being removed is the one the screen behind this modal is drawn from,
       and a store update under an open view re-renders it. */
    await evalJs(`(function(){
      document.querySelectorAll('.modal-overlay:not(.hidden) [data-modal-close]').forEach(
        function(b){ b.click(); });
      return 1; })()`);
    await new Promise(r => setTimeout(r, 200));
    if ((await onView()) !== 'homeView') await goHome();
    const cleaned = await evalJs(`(function(){
      var s = window.planbook.store;
      s.update(function(doc){
        doc.classes = (doc.classes || []).filter(function(c){ return c.id !== '${CLS}'; });
        doc.students = (doc.students || []).filter(function(p){
          return String(p.id).indexOf('s_wo53') !== 0; });
        doc.assignments = (doc.assignments || []).filter(function(a){
          return String(a.id).indexOf('a_wo53_') !== 0; });
        doc.attendance = (doc.attendance || []).filter(function(r){ return r.classId !== '${CLS}'; });
        /* The one contact WO-5.12's webmail press made the app write (verify/contact-log.mjs
           takes its own off the same way). The fixture's students go with it, so an entry left
           here would be one about a student who no longer exists. */
        doc.log = (doc.log || []).filter(function(e){
          return String(e.studentId).indexOf('s_wo53') !== 0; });
        doc.templates = JSON.parse(${JSON.stringify(plant.hadTemplates)});
        doc.teacher = JSON.parse(${JSON.stringify(plant.hadTeacher)});
        if (doc.scores) {
          Object.keys(doc.scores).forEach(function(k){
            if (k.indexOf('a_wo53_') === 0) delete doc.scores[k]; });
        }
      });
      var d = s.getDoc();
      return { classes:(d.classes || []).filter(function(c){ return c.id === '${CLS}'; }).length,
        students:(d.students || []).filter(function(p){
          return String(p.id).indexOf('s_wo53') === 0; }).length,
        assignments:(d.assignments || []).filter(function(a){
          return String(a.id).indexOf('a_wo53_') === 0; }).length,
        attendance:(d.attendance || []).filter(function(r){ return r.classId === '${CLS}'; }).length,
        log:(d.log || []).filter(function(e){
          return String(e.studentId).indexOf('s_wo53') === 0; }).length,
        scores: Object.keys(d.scores || {}).filter(function(k){
          return k.indexOf('a_wo53_') === 0; }).length,
        templates: JSON.stringify(d.templates || []),
        teacher: JSON.stringify(d.teacher || {}),
        mode: window.planbook.supports.presentationMode(),
        mailDoor: window.planbook.getPref('mailDoor'),
        overlays: document.querySelectorAll('.modal-overlay:not(.hidden)').length }; })()`);
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
    check('the WO-5.3 fixture came back off the document — the class, both students, nine '
      + 'assignments, ten attendance records, every score bag and the one contact WO-5.12’s '
      + 'webmail press wrote — `templates[]` and the teacher’s own details were put back exactly '
      + 'as they were found, presentation mode was left OFF, the mail door is back at the '
      + 'default, every modal is closed and the page was left on the grid',
      cleaned.classes === 0 && cleaned.students === 0 && cleaned.assignments === 0
        && cleaned.attendance === 0 && cleaned.log === 0 && cleaned.scores === 0
        && cleaned.overlays === 0
        && cleaned.templates === String(plant.hadTemplates)
        && cleaned.teacher === String(plant.hadTeacher) && cleaned.mode === false
        && cleaned.mailDoor === 'default'
        && (await onView()) === 'homeView',
      cleaned.classes + ' class(es), ' + cleaned.students + ' student(s), ' + cleaned.assignments
        + ' assignment(s), ' + cleaned.attendance + ' record(s), ' + cleaned.log
        + ' log entr(ies), ' + cleaned.scores
        + ' score bag(s) left behind; templates put back = '
        + String(cleaned.templates === String(plant.hadTemplates)) + ', teacher put back = '
        + String(cleaned.teacher === String(plant.hadTeacher)) + '; presentation mode = '
        + cleaned.mode);
  }
}
}
