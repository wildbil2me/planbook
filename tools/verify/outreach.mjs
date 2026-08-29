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
 * Nothing here launches a browser, a server or a document of its own: the entry file owns all three
 * and hands them over on `h`. `tools/README.md` § "Driving a browser over CDP" says where a new
 * check goes.
 */

export async function run(h) {
const { check, skip, send, evalJs, clickSel, KILL_ANIM, waitForBoot, seam } = h;

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
    var chips = Array.prototype.map.call(
      document.querySelectorAll('#outreachRecipients .toggle-btn'), function(b){
        return b.getAttribute('data-outreach-to') + '|' + b.textContent + '|'
          + (b.classList.contains('active') ? 'on' : 'off'); });
    var options = Array.prototype.map.call(
      document.getElementById('outreachTemplate').options, function(o){ return o.textContent; });
    return {
      open: !document.getElementById('outreachModal').classList.contains('hidden'),
      href: link.getAttribute('href'),
      hasHref: link.hasAttribute('href'),
      disabled: link.getAttribute('aria-disabled'),
      head: head ? head.textContent : '',
      reasons: reasons,
      clear: block.classList.contains('clear'),
      chips: chips,
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
  check('WO-5.3 fixture: one class, two students — one with two guardians of whom the SECOND has a '
    + 'name and no email, a counselor, an address of her own and a full `supports` block whose '
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
      THE PICKER IS FIVE PEOPLE AND FOUR AUDIENCES, which is src/outreach.js's whole mapping made
      visible. Guardian 2 is on the list with no address rather than left off it — an absence and a
      bug look identical, and what she must do is block, not disappear.
    */
    check('the audience picker offers every person on this student’s roster entry — both '
      + 'guardians by POSITION, the counselor, the administrator from Settings and the student '
      + 'herself — and the one with no address on file is on the list rather than quietly missing',
      arrived.recipients.length === 5
        && arrived.recipients[0] === 'guardian-0:Guardian 1:has'
        && arrived.recipients[1] === 'guardian-1:Guardian 2:none'
        && arrived.recipients[2] === 'counselor:Counselor:has'
        && arrived.recipients[3] === 'admin:Admin:has'
        && arrived.recipients[4] === 'student:Student:has'
        && arrived.chips.length === 5 && /Wo53Guardian One/.test(arrived.toNote)
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
      ─────────── WO-5.3's SEVENTH ACCEPTANCE LINE, AND IT IS FOUR NUMBERS ───────────

      A concern template and a praise template written for the same audience are offered SEPARATELY.
      The read is `templatesFor(doc, tone, audience)` with BOTH arguments, so:

        praise/guardian   3   the pair's praise half, plus the long one and the refused one
        concern/guardian  1   the pair's concern half — a different record, never handed back above
        concern/counselor 1   written for somebody else and never offered to a guardian
        praise/counselor  0   THE NUMBER THAT CATCHES A TONE-ONLY FILTER, which would answer 3 here

      And the same question asked of the picker on screen, because a collection that hands back the
      right list and a `<select>` that draws the other one are the same bug to a teacher.
    */
    const pairs = await evalJs(`(function(){
      var d = window.planbook.store.getDoc();
      var t = window.planbook.templates;
      var ids = function(list){ return list.map(function(r){ return r.id; }); };
      var pg = t.templatesFor(d, 'praise', 'guardian');
      var cg = t.templatesFor(d, 'concern', 'guardian');
      return { pg: pg.length, cg: cg.length,
        cc: t.templatesFor(d, 'concern', 'counselor').length,
        pc: t.templatesFor(d, 'praise', 'counselor').length,
        anyGuardian: t.templatesFor(d, '', 'guardian').length,
        overlap: ids(pg).filter(function(id){ return ids(cg).indexOf(id) >= 0; }).length }; })()`);
    check('a concern template and a praise template written for the SAME audience are two records '
      + 'and are offered separately — the send flow reads templatesFor(doc, tone, audience) with '
      + 'both arguments, so praise/guardian and concern/guardian hand back different records and '
      + 'praise/counselor hands back NONE, which is the number a tone-only filter would fail '
      + '(Acceptance line 7)',
      pairs.pg === 3 && pairs.cg === 1 && pairs.cc === 1 && pairs.pc === 0
        && pairs.anyGuardian === 4 && pairs.overlap === 0,
      'praise/guardian ' + pairs.pg + ', concern/guardian ' + pairs.cg + ', concern/counselor '
        + pairs.cc + ', praise/counselor ' + pairs.pc + ', any-tone/guardian ' + pairs.anyGuardian
        + ', shared records ' + pairs.overlap);

    const toned = await evalJs(`(function(){
      ${DRAWN}
      var was = drawn().options;
      document.querySelector('#outreachTones [data-outreach-tone="concern"]').click();
      var now = drawn();
      var m = window.planbook.outreachView.outreachModel();
      return { was: was, now: now.options, tone: m.tone, name: m.templateName,
        rebuilt: now.bodyField, status: document.getElementById('outreachStatus').textContent,
        ready: m.ready }; })()`);
    check('and the picker on screen says the same thing: tapping Concern replaces the three praise '
      + 'templates with the one concern template written for the same guardian, and rebuilds the '
      + 'draft from it rather than leaving the old words under a new heading',
      toned.was.length === 3 && toned.now.length === 1 && toned.tone === 'concern'
        && toned.name === 'WO-5.3 concern to a guardian'
        && /pieces of work marked missing/.test(toned.rebuilt) && toned.ready === true
        && /rebuilt/i.test(toned.status),
      JSON.stringify({ was: toned.was, now: toned.now, name: toned.name }));

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
        atKept: to.indexOf('@') > 0 && to.indexOf('%40') === -1 }; })()`);
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
      var ids = window.planbook.store.getDoc().templates.filter(function(t){
        return t.name.indexOf('refused') >= 0; })[0].id;
      pick('outreachTemplate', ids);
      var d = drawn();
      var m = window.planbook.outreachView.outreachModel();
      return { hasHref: d.hasHref, href: d.href, disabled: d.disabled, head: d.head,
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
        && refused.disabled === 'true' && refused.focusable === false,
      JSON.stringify({ href: refused.href, ariaDisabled: refused.disabled,
        focusable: refused.focusable }));
    check('and the strip says why in the RESOLVER’S own words rather than in a second opinion '
      + 'of this screen’s — the token is still in the box exactly as the teacher typed it, and '
      + 'the sentence is the one src/merge-fields.js wrote about accommodation, medical and plan '
      + 'details never leaving the roster',
      refused.clear === false && /cannot be sent/.test(refused.head)
        && refused.reasons.some((r) => /never leave the roster/.test(r))
        && refused.reasons.some((r) => /supports\.medical/.test(r))
        && refused.body.indexOf('{{supports.medical}}') >= 0
        && refused.body.indexOf('Wo53MedicalDetail') === -1,
      refused.head + ' :: ' + (refused.reasons[0] || '').slice(0, 110));

    const fixedUp = await evalJs(`(function(){
      ${TYPE}
      ${DRAWN}
      type('outreachBody', 'I took the field out and wrote the sentence myself.');
      var d = drawn();
      return { hasHref: d.hasHref, clear: d.clear, head: d.head,
        carried: decodeURIComponent((d.href || '').split('body=')[1] || '') }; })()`);
    check('and typing over that field unblocks it — which is the resolver’s own sentence '
      + '("until it is corrected or removed") honoured at the end that can see the correction, and '
      + 'the reason the gate is what is on the page rather than what the resolve found',
      fixedUp.hasHref === true && fixedUp.clear === true
        && fixedUp.carried === 'I took the field out and wrote the sentence myself.',
      fixedUp.head + ' :: link restored = ' + fixedUp.hasHref);

    /* ── a recipient with no address ── */
    const noAddress = await evalJs(`(function(){
      ${DRAWN}
      document.querySelector('[data-outreach-to="guardian-1"]').click();
      var d = drawn();
      var m = window.planbook.outreachView.outreachModel();
      return { hasHref: d.hasHref, head: d.head, reasons: d.reasons, ready: m.ready,
        toNote: d.toNote }; })()`);
    check('and a recipient with no email address blocks the handoff too, in this flow’s own '
      + 'words rather than the resolver’s — it has never heard of a recipient — so the app '
      + 'never opens a mail window with an empty To field',
      noAddress.ready === false && noAddress.hasHref === false
        && noAddress.reasons.some((r) => /no email address on file/.test(r))
        && /Wo53Guardian Two/.test(noAddress.toNote),
      (noAddress.reasons[0] || '').slice(0, 120));

    /* ── the ceiling ── */
    const long = await evalJs(`(function(){
      ${DRAWN}
      document.querySelector('[data-outreach-to="guardian-0"]').click();
      var ids = window.planbook.store.getDoc().templates.filter(function(t){
        return t.name.indexOf('long') >= 0; })[0].id;
      var n = document.getElementById('outreachTemplate');
      n.value = ids;
      n.dispatchEvent(new Event('change', { bubbles: true }));
      var d = drawn();
      var m = window.planbook.outreachView.outreachModel();
      return { shown: d.lengthShown, text: d.lengthText, length: m.length, long: m.long,
        ceiling: window.planbook.outreach.MAILTO_CEILING, hasHref: d.hasHref,
        bodyLength: d.bodyField.length }; })()`);
    check('a body long enough to pass the practical `mailto:` ceiling WARNS BEFORE THE FACT and '
      + 'does not block — the app truncates nothing, the link still carries the whole message, and '
      + 'the warning names the number and the client that cuts there (Acceptance line 2)',
      long.long === true && long.shown === true && long.hasHref === true
        && long.length > long.ceiling && long.ceiling === 2000
        && String(long.text).indexOf(String(long.ceiling)) >= 0
        && /Outlook/.test(long.text) && /does not shorten/.test(long.text),
      long.length + ' encoded characters over a ceiling of ' + long.ceiling + ' (the body itself is '
        + long.bodyLength + '), link still live = ' + long.hasHref);
    check('and the ceiling is measured on the ENCODED URL rather than on what the teacher typed, '
      + 'which is the only number that has anything to do with what gets cut: every line break '
      + 'costs six characters and every em dash nine',
      long.length > long.bodyLength,
      long.length + ' encoded vs ' + long.bodyLength + ' typed');

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
      backOn.formHidden === false && backOn.hasHref === true && backOn.chips === 5
        && backOn.body > 0,
      JSON.stringify(backOn));

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

      WO-5.4 owns the contact log — `log[]` with `kind: "contact"` and the `ruleId` its cooldown keys
      on — and this work order's Out of scope is what keeps it out. `rev` is the store's own witness:
      it moves on every save, so an unchanged `rev` after a whole flow of picking, toggling, typing
      and blocking is a claim no reading of the source can make as cheaply.

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
    check('and the whole flow wrote nothing at all — `rev` has not moved, `log[]` is the length it '
      + 'was and holds no `contact` entry, and `templates[]` is byte-identical. The contact log is '
      + 'WO-5.4’s and this work order stayed inside its Out of scope',
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
      chips, the two fields, the select, the strip's jump and the two actions — plus one that is
      new, the handoff link, which takes `.class-action-btn`'s floor only because § THE SEND FLOW
      makes it inline-flex first. That is exactly the kind of thing a stylesheet review gets wrong,
      so it is measured rather than read.
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
          out.push({ t: e.tagName + '.' + (e.className || ''),
            w: Math.round(r.width * 100) / 100, h: Math.round(r.height * 100) / 100 }); });
      var doc = document.documentElement;
      return { controls: out, under: out.filter(function(m){ return m.h < 44 || m.w < 44; }),
        coarse: matchMedia('(pointer: coarse)').matches,
        sideways: doc.scrollWidth - doc.clientWidth }; })()`);
    check('every control in the send flow measures at least 44px on both axes at 390px under a '
      + 'coarse pointer — including the handoff link, which is an anchor and would have ignored the '
      + 'floor entirely without the `display: inline-flex` in src/shell.css § THE SEND FLOW — '
      + 'and the panel puts the page into no sideways scroll',
      touch.coarse === true && touch.controls.length >= 8 && touch.under.length === 0
        && touch.sideways <= 0,
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
        scores: Object.keys(d.scores || {}).filter(function(k){
          return k.indexOf('a_wo53_') === 0; }).length,
        templates: JSON.stringify(d.templates || []),
        teacher: JSON.stringify(d.teacher || {}),
        mode: window.planbook.supports.presentationMode(),
        overlays: document.querySelectorAll('.modal-overlay:not(.hidden)').length }; })()`);
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
    check('the WO-5.3 fixture came back off the document — the class, both students, nine '
      + 'assignments, ten attendance records and every score bag — `templates[]` and the '
      + 'teacher’s own details were put back exactly as they were found, presentation mode was '
      + 'left OFF, every modal is closed and the page was left on the grid',
      cleaned.classes === 0 && cleaned.students === 0 && cleaned.assignments === 0
        && cleaned.attendance === 0 && cleaned.scores === 0 && cleaned.overlays === 0
        && cleaned.templates === String(plant.hadTemplates)
        && cleaned.teacher === String(plant.hadTeacher) && cleaned.mode === false
        && (await onView()) === 'homeView',
      cleaned.classes + ' class(es), ' + cleaned.students + ' student(s), ' + cleaned.assignments
        + ' assignment(s), ' + cleaned.attendance + ' record(s), ' + cleaned.scores
        + ' score bag(s) left behind; templates put back = '
        + String(cleaned.templates === String(plant.hadTemplates)) + ', teacher put back = '
        + String(cleaned.teacher === String(plant.hadTeacher)) + '; presentation mode = '
        + cleaned.mode);
  }
}
}
