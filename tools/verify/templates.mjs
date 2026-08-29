/* templates.mjs — message templates: the list, the editor, the palette and the live preview (WO-5.2)
 *
 * The section drives the real screen through the real door — the fourth icon in the header — and
 * asks the model beside it, the way `calendar-drawn.mjs` and `concern-list.mjs` do: a check that
 * read everything out of markup would also have to be right about markup, and a check that read
 * everything out of the model would pass over a preview nobody drew. Both, every time.
 *
 * WHAT IS ASKED HERE THAT NOTHING ELSE CAN ASK. The four acceptance lines of WO-5.2 are one claim
 * about a COLLECTION (a concern template and a praise template exist for the same audience and are
 * offered separately), one about a RENDERING (an unresolved field is visible, exactly as the send
 * flow will show it), one about a LIST (the palette contains no refused path) and one about a FILE
 * (templates survive a backup round trip). Only the third is a thing to look at; the other three
 * are answered by asking the app what it hands back and by putting a document through
 * buildBackup() and the real restore.
 *
 * Nothing here launches a browser, a server or a document of its own: the entry file owns all three
 * and hands them over on `h`. `tools/README.md` § "Driving a browser over CDP" says where a new
 * check goes.
 */

export async function run(h) {
const { check, skip, send, evalJs, clickSel, KILL_ANIM, waitForBoot, seam } = h;

/*
 * ───────── message templates (WO-5.2) ─────────
 *
 * TWO STUDENTS, AND THE FIRST OF THEM CARRIES THE THING THAT MUST NEVER TRAVEL — the same shape
 * `merge-fields.mjs` uses at WO-5.1, and for the same reason: the draft that exercises the whole
 * palette is drafted about the student who has a plan on file, so "nothing from the supports block
 * reaches this screen" is a search over what was actually drawn rather than a claim about an empty
 * haystack.
 *
 *   Full    guardian, nickname, nine pieces of work of which one is marked missing and whose last
 *           four lift the grade 21.5 points, ten recorded meetings with one absence and one tardy,
 *           and a complete `supports` block whose every field holds a string that occurs nowhere
 *           else in this repository.
 *   Orphan  no guardian on file and nothing else remarkable. He is the unresolved case: a template
 *           that reads perfectly against the first student on the roster is blocked for him, and
 *           nothing about the template is wrong.
 */
console.log('\n--- message templates (WO-5.2) ---');
if (!seam) {
  skip('message templates (WO-5.2)', 'window.planbook is not on the page, so nothing here can seed '
    + 'a roster, ask the editor anything, or put the document back');
} else {
  const CLS = 'c_wo52';
  const TERM = 'tm_wo52';
  const FULL = 's_wo52full', ORPHAN = 's_wo52orphan';
  const CLASS_NAME = 'WO-5.2 Outreach';
  const TEACHER = 'Wo52Teacher Name';
  const FULL_N = 'Wo52Full', ORPHAN_N = 'Wo52Orphan';
  const GUARDIAN_N = 'Wo52Guardian Full';
  /* Every one of these is on the roster and none of them may ever be drawn on this screen. The
     first six are unique to this fixture; `IEP` and `extended-time` are searched over the DRAFT
     only, because the palette's own fence says the words "IEP and 504 details" out loud on purpose
     — that sentence is the disclosure control, and a search that could not tell it from a leak
     would be a check nobody could keep. */
  const SECRETS = ['Wo52CaseManager', 'Wo52AccommodationDetail', 'Wo52MedicalDetail',
    'Wo52BehaviorPlanDetail', 'Wo52ClauseDetail', '2027-03-09'];
  const DRAFT_SECRETS = SECRETS.concat(['extended-time', 'IEP']);

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
  /* The door a teacher uses, and the only one there is. */
  async function openTemplates() {
    await clickSel('header [data-templates-open]');
    await new Promise(r => setTimeout(r, 300));
  }
  /* Typing, as the app hears it: the value goes in and an `input` event bubbles to the one
     delegated listener in src/shell.js, which is the same path a keystroke takes. A check that
     called the module directly would prove the module and not the wiring. */
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
  /* What the preview column actually DREW, read off the DOM. */
  const DRAWN = `var drawn = function(){
    var body = document.getElementById('templatePreviewBody');
    var subject = document.getElementById('templatePreviewSubject');
    var block = document.getElementById('templatePreviewBlock');
    var draft = document.getElementById('templatePreviewDraft');
    var toks = [];
    Array.prototype.forEach.call(body.querySelectorAll('.mf-token'), function(t){
      toks.push(t.textContent); });
    Array.prototype.forEach.call(subject.querySelectorAll('.mf-token'), function(t){
      toks.push(t.textContent); });
    var reasons = [];
    Array.prototype.forEach.call(block.querySelectorAll('.mf-reason'), function(r){
      reasons.push(r.textContent.replace(/\\s+/g, ' ').trim()); });
    var head = block.querySelector('.mf-block-head');
    return { subject: subject.textContent, body: body.textContent, tokens: toks,
      head: head ? head.textContent : '', reasons: reasons,
      clear: block.classList.contains('clear'),
      blockShown: !block.classList.contains('hidden'),
      draftShown: !draft.classList.contains('hidden'),
      refused: !document.getElementById('templatePreviewBlocked').classList.contains('hidden'),
      screen: document.getElementById('templatesView').textContent }; };`;

  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  await send('Emulation.setDeviceMetricsOverride',
    { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  await waitForBoot();
  await evalJs(KILL_ANIM);

  /* ── the fixture ── */
  const plant = await evalJs(`(function(){
    var s = window.planbook.store;
    var d = s.getDoc();
    if (!d) return { ok:false, why:'no year document is open' };
    var hadTeacher = String((d.teacher && d.teacher.name) || '');
    var hadTemplates = JSON.stringify(d.templates || []);
    var today = window.planbook.attendance.todayISO();
    var back = function(n){ return window.planbook.calendar.shiftDays(today, -n); };

    s.update(function(doc){
      if (!Array.isArray(doc.classes)) doc.classes = [];
      if (!Array.isArray(doc.students)) doc.students = [];
      if (!Array.isArray(doc.assignments)) doc.assignments = [];
      if (!Array.isArray(doc.attendance)) doc.attendance = [];
      if (!Array.isArray(doc.templates)) doc.templates = [];
      if (!doc.teacher || typeof doc.teacher !== 'object') doc.teacher = {};
      doc.teacher.name = '${TEACHER}';

      doc.students.push({ id:'${FULL}', first:'Ada', last:'${FULL_N}', nickname:'Addie',
        email:'', phone:'', phone2:'',
        guardians:[{ name:'${GUARDIAN_N}', relation:'Mother', email:'wo52@example.invalid',
          phone:'', phone2:'', language:'en', preferred:true }],
        counselor:{ name:'', email:'' }, notes:'',
        supports:{ plan:'IEP',
          caseManager:{ name:'Wo52CaseManager', email:'wo52case@example.invalid' },
          reviewDate:'2027-03-09',
          accommodations:[{ kind:'extended-time', detail:'Wo52AccommodationDetail',
            appliesTo:['tests'] }],
          medical:'Wo52MedicalDetail', behaviorPlan:'Wo52BehaviorPlanDetail',
          attendanceClause:'Wo52ClauseDetail' } });
      doc.students.push({ id:'${ORPHAN}', first:'Cal', last:'${ORPHAN_N}', nickname:'',
        email:'', phone:'', phone2:'', guardians:[], counselor:{ name:'', email:'' }, notes:'' });

      doc.classes.push({ id:'${CLS}', name:'${CLASS_NAME}', archived:false,
        roster:['${FULL}','${ORPHAN}'], letterScale:null,
        terms:[{ id:'${TERM}', label:'WO-5.2 Term', start:back(40),
          end:window.planbook.calendar.shiftDays(today, 40) }],
        categories:[{ id:'k_wo52', name:'All work', weight:100 }]});

      for (var n = 1; n <= 9; n++) {
        doc.assignments.push({ id:'a_wo52_' + n, classId:'${CLS}', termId:'${TERM}',
          categoryId:'k_wo52', name:'WO-5.2 Task ' + n, points:100,
          assigned:back(30), due:back(20) });
      }
      if (!doc.scores || typeof doc.scores !== 'object') doc.scores = {};
      var put = function(id, sid, cell){
        doc.scores[id] = doc.scores[id] || {};
        doc.scores[id][sid] = cell;
      };
      /* Four at 62, one marked MISSING, four at 98 — the WO-5.1 shape, which produces a grade that
         rose 21.5 points (a praise hit, so grade.delta and signals.list both answer) and one piece
         of missing work (so missing.count and missing.list both answer for the same student). */
      for (var a = 1; a <= 4; a++) put('a_wo52_' + a, '${FULL}', { v: 62 });
      put('a_wo52_5', '${FULL}', { v: null, flag: 'missing' });
      for (var b = 6; b <= 9; b++) put('a_wo52_' + b, '${FULL}', { v: 98 });
      for (var c = 1; c <= 9; c++) put('a_wo52_' + c, '${ORPHAN}', { v: 80 });

      for (var m = 0; m < 10; m++) {
        var when = back(20 - m * 2);
        var marks = {};
        if (m === 3) marks['${FULL}'] = { code: 'A' };
        if (m === 6) marks['${FULL}'] = { code: 'T' };
        doc.attendance.push({ classId:'${CLS}', date:when, marks:marks });
      }
      /* Every template this run makes is its own; anything already in the document is set aside so
         that "the editor opens with an empty list" is a claim about THIS document rather than about
         a lucky one, and put back at the end. */
      doc.templates = [];
    });
    var now = s.getDoc();
    return { ok:true, hadTeacher:hadTeacher, hadTemplates:hadTemplates,
      students:(now.students || []).filter(function(p){
        return String(p.id).indexOf('s_wo52') === 0; }).length,
      assignments:(now.assignments || []).filter(function(a){
        return a.classId === '${CLS}'; }).length,
      meetings:(now.attendance || []).filter(function(r){
        return r.classId === '${CLS}'; }).length,
      templates:(now.templates || []).length }; })()`);
  check('WO-5.2 fixture: one class, two students — one with a guardian and a full `supports` block '
    + 'whose every field holds a string that appears nowhere else in this repository, one with no '
    + 'guardian at all — nine assignments, ten recorded meetings and an empty template list',
    !!plant && plant.ok === true && plant.students === 2 && plant.assignments === 9
      && plant.meetings === 10 && plant.templates === 0,
    plant && plant.ok ? plant.students + ' student(s), ' + plant.assignments + ' assignment(s), '
      + plant.meetings + ' meeting(s), ' + plant.templates + ' template(s)' : JSON.stringify(plant));

  if (!plant || !plant.ok) {
    skip('the whole of WO-5.2', 'the fixture did not install, so nothing below it could be asked '
      + 'about a template, a preview or a backup');
  } else {
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 600));
    await waitForBoot();
    await evalJs(KILL_ANIM);

    /* ── the door ── */
    await openTemplates();
    const arrived = await evalJs(`(function(){
      var m = window.planbook.templatesView.templatesModel();
      var v = document.querySelector('main > :not(.hidden)');
      return { view: v ? v.id : '', tone: m.tone, mine: m.mine.length,
        starters: m.starters.length, isNew: m.editing.isNew,
        name: m.editing.name, subject: m.editing.subject, body: m.editing.body,
        nameField: document.getElementById('templateName').value,
        bodyField: document.getElementById('templateBody').value,
        stored: window.planbook.store.getDoc().templates.length,
        rows: document.querySelectorAll('#templatesList .tpl-item').length,
        starterRows: document.querySelectorAll('#templatesStarters .tpl-item').length,
        emptyShown: !document.getElementById('templatesMineEmpty').classList.contains('hidden'),
        nav: document.querySelectorAll('#templatesView [data-class-screen]').length }; })()`);
    check('the header icon opens the template editor as a view in <main>, and it opens EMPTY with '
      + 'the eight starters in the list — nothing is auto-loaded into the editor and nothing is '
      + 'written into `templates[]` by arriving (the owner’s ruling of 2026-08-28)',
      arrived.view === 'templatesView' && arrived.isNew === true && arrived.name === ''
        && arrived.subject === '' && arrived.body === '' && arrived.nameField === ''
        && arrived.bodyField === '' && arrived.stored === 0 && arrived.mine === 0
        && arrived.rows === 0 && arrived.starters === 8 && arrived.starterRows === 8
        && arrived.emptyShown === true && arrived.tone === '',
      JSON.stringify(arrived));
    check('and it is not a class screen: the switcher draws no segment on it, which is what keeps '
      + 'a template from reading as a property of one class',
      arrived.nav === 0, arrived.nav + ' [data-class-screen] control(s) on this view');

    /*
      THE EIGHT, AND EVERY TOKEN IN THEM.

      Both tones for each of the four audiences is what the owner ruled and what the send flow will
      offer; the second half is the one that matters more. These are the app's own prose going into
      a teacher's document, so a `{{token}}` in one of them was written by us rather than typed by
      her — and it is reconciled against mergeFieldNames() rather than against a list written out
      again here, which is what makes a starter that named a support field a RED RUN rather than a
      draft that merely refuses to send.
    */
    const starters = await evalJs(`(function(){
      var t = window.planbook.templates;
      var all = t.starterTemplates();
      var names = window.planbook.mergeFields.mergeFieldNames();
      var pairs = all.map(function(s){ return s.tone + '/' + s.audience; }).sort();
      var tokens = [];
      all.forEach(function(s){
        (s.subject + ' ' + s.body).replace(/\\{\\{([^{}]*)\\}\\}/g, function(w, inner){
          var n = String(inner).trim();
          if (tokens.indexOf(n) < 0) tokens.push(n);
          return w; });
      });
      return { count: all.length, pairs: pairs, tokens: tokens.sort(),
        off: tokens.filter(function(n){ return names.indexOf(n) < 0; }),
        unnamed: all.filter(function(s){ return !s.name || !s.subject || !s.body; }).length,
        fresh: t.starterTemplates()[0] !== all[0] }; })()`);
    check('eight starters ship filled in — both tones for each of the four audiences, every one of '
      + 'them with a name, a subject and a body, and a fresh copy handed out on every call',
      starters.count === 8 && starters.unnamed === 0 && starters.fresh === true
        && JSON.stringify(starters.pairs) === JSON.stringify(['concern/admin',
          'concern/counselor', 'concern/guardian', 'concern/student', 'praise/admin',
          'praise/counselor', 'praise/guardian', 'praise/student']),
      JSON.stringify({ count: starters.count, pairs: starters.pairs }));
    check('and every merge field named in all eight is on the resolver’s own whitelist — the '
      + 'shipped prose is reconciled against mergeFieldNames(), so a starter that named a support '
      + 'field would be a red run here rather than a draft a teacher finds refuses to send',
      starters.off.length === 0 && starters.tokens.length >= 8,
      starters.tokens.length + ' distinct token(s): ' + starters.tokens.join(', ')
        + (starters.off.length ? ' :: OFF THE WHITELIST: ' + starters.off.join(', ') : ''));

    /*
      THE PALETTE CONTAINS NO REFUSED PATH — WO-5.2's third acceptance line, asked of what is
      DRAWN rather than of what mergeFieldPalette() returns. The list function is WO-5.1's and is
      already reconciled against docs/data-model.md by tools/wo-sweep.mjs § 20 in both directions;
      what this work order adds is a screen, and a screen is where a seventeenth chip would appear.
    */
    const palette = await evalJs(`(function(){
      var names = window.planbook.mergeFields.mergeFieldNames();
      var chips = Array.prototype.map.call(
        document.querySelectorAll('#templatesPalette .tpl-chip'), function(c){
          return String(c.getAttribute('data-template-insert')); });
      var codes = Array.prototype.map.call(
        document.querySelectorAll('#templatesPalette .tpl-chip code'), function(c){
          return c.textContent; });
      var withAbout = document.querySelectorAll('#templatesPalette .tpl-chip-about').length;
      var bad = /supports?|accommodation|medical|behaviou?rplan|\\bplan\\b|casemanager|reviewdate|attendanceclause/i;
      return { chips: chips, drawn: chips.length, codes: codes, withAbout: withAbout,
        refused: chips.filter(function(n){ return bad.test(n); }),
        matches: JSON.stringify(chips) === JSON.stringify(names),
        fence: document.querySelector('.tpl-palette-fence').textContent.replace(/\\s+/g, ' ').trim()
      }; })()`);
    check('the field palette draws exactly the sixteen resolvable names, in the documented order, '
      + 'each with the sentence WO-5.1 wrote for it — and NOT ONE of them reads as a path into a '
      + 'support block (Acceptance line 3)',
      palette.drawn === 16 && palette.matches === true && palette.withAbout === 16
        && palette.refused.length === 0,
      palette.drawn + ' chip(s), whitelist match = ' + palette.matches
        + (palette.refused.length ? ' :: REFUSED PATH ON THE PALETTE: ' + palette.refused.join(', ')
          : '') + '; ' + palette.codes.slice(0, 3).join(' '));
    check('and the palette says the rule out loud rather than documenting it by omission — the '
      + 'fence names accommodations, IEP and 504 details, medical needs, behavior plans, the case '
      + 'manager and the review date as things that cannot be merged',
      /accommodation/i.test(palette.fence) && /medical/i.test(palette.fence)
        && /behavior plan/i.test(palette.fence) && /case manager/i.test(palette.fence)
        && /review date/i.test(palette.fence) && /cannot be added to it/i.test(palette.fence),
      palette.fence.slice(0, 120));

    /* ── a chip inserts at the caret ── */
    const inserted = await evalJs(`(function(){
      ${TYPE}
      type('templateBody', 'Dear ,\\nthanks.');
      var b = document.getElementById('templateBody');
      b.focus();
      b.setSelectionRange(5, 5);
      b.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      document.querySelector('#templatesPalette [data-template-insert="guardian.name"]').click();
      var m = window.planbook.templatesView.templatesModel();
      return { field: b.value, model: m.editing.body, at: b.selectionStart }; })()`);
    check('a palette chip drops its field in AT THE CURSOR rather than at the end — the caret is '
      + 'remembered from the focusin listener, because by the time a chip’s click arrives the field '
      + 'is no longer the active element on either platform',
      inserted.field === 'Dear {{guardian.name}},\nthanks.'
        && inserted.model === inserted.field && inserted.at === 22,
      JSON.stringify(inserted));

    /*
      ACCEPTANCE LINE 1 — a concern template and a praise template for the SAME audience, offered
      separately. Both are written through the real controls, and what is asked afterwards is the
      question WO-5.3 will ask from the signal card: `templatesFor(doc, tone, audience)`.
    */
    const saved = await evalJs(`(function(){
      ${TYPE}
      var out = [];
      var write = function(name, tone, audience, subject, body){
        document.querySelector('[data-template-new]').click();
        type('templateName', name);
        pick('templateTone', tone);
        pick('templateAudience', audience);
        type('templateSubject', subject);
        type('templateBody', body);
        document.querySelector('[data-template-save]').click();
        out.push(window.planbook.templatesView.templatesModel().editing.id);
      };
      write('WO-5.2 concern to a guardian', 'concern', 'guardian',
        '{{class.name}} — about {{student.first}}',
        'Dear {{guardian.name}},\\n\\n{{student.first}} has {{missing.count}} missing: '
          + '{{missing.list}}. The grade is {{grade.percent}} ({{grade.letter}}).\\n\\n'
          + '{{teacher.name}}');
      write('WO-5.2 praise to a guardian', 'praise', 'guardian',
        'Good news about {{student.first}}',
        'Dear {{guardian.name}},\\n\\n{{student.first}} has moved {{grade.delta}}.\\n\\n'
          + '{{signals.list}}\\n\\n{{teacher.name}}');
      var doc = window.planbook.store.getDoc();
      var t = window.planbook.templates;
      var concern = t.templatesFor(doc, 'concern', 'guardian');
      var praise = t.templatesFor(doc, 'praise', 'guardian');
      return { ids: out, stored: doc.templates.length,
        concern: concern.map(function(r){ return r.id + '/' + r.name; }),
        praise: praise.map(function(r){ return r.id + '/' + r.name; }),
        bothAudience: t.templatesFor(doc, '', 'guardian').length,
        concernElsewhere: t.templatesFor(doc, 'concern', 'admin').length,
        counts: t.templateCounts(doc),
        rows: document.querySelectorAll('#templatesList .tpl-item').length }; })()`);
    check('a concern template and a praise template exist for the SAME audience, and templatesFor() '
      + 'offers them separately — one each by tone, two when the tone is not named, and neither of '
      + 'them offered for an audience they were not written for (Acceptance line 1)',
      saved.stored === 2 && saved.concern.length === 1 && saved.praise.length === 1
        && saved.concern[0] !== saved.praise[0] && saved.bothAudience === 2
        && saved.concernElsewhere === 0 && saved.rows === 2
        && saved.counts.concern === 1 && saved.counts.praise === 1,
      JSON.stringify({ concern: saved.concern, praise: saved.praise,
        bothAudience: saved.bothAudience, elsewhere: saved.concernElsewhere, rows: saved.rows }));

    /* And the same pair through the tone filter a teacher actually taps. */
    const filtered = await evalJs(`(function(){
      var read = function(){ return Array.prototype.map.call(
        document.querySelectorAll('#templatesList .tpl-item .tpl-item-name'), function(n){
          return n.textContent; }); };
      var out = { all: read().length };
      document.querySelector('[data-templates-tone="concern"]').click();
      out.concern = read();
      out.concernStarters = document.querySelectorAll('#templatesStarters .tpl-item').length;
      document.querySelector('[data-templates-tone="praise"]').click();
      out.praise = read();
      document.querySelector('[data-templates-tone=""]').click();
      out.back = read().length;
      return out; })()`);
    check('the tone switch narrows the list to one tone and back again, and it narrows the eight '
      + 'starters with it — a filter rather than a mode',
      filtered.all === 2 && filtered.concern.length === 1 && filtered.praise.length === 1
        && filtered.concern[0] !== filtered.praise[0] && filtered.concernStarters === 4
        && filtered.back === 2,
      JSON.stringify(filtered));

    /*
      ACCEPTANCE LINE 2 — the live preview shows unresolved fields visibly, EXACTLY as the send flow
      will.

      "Exactly" is the part a screenshot cannot settle, so it is asked as an identity: what the
      column draws is character for character what src/merge-fields.js's resolveDraft() returned for
      the same request, and the fields that did not resolve are the teacher's own tokens still
      standing in it. WO-5.3 renders the same string out of the same call, so a preview that agreed
      with the resolver here cannot disagree with the send flow there.
    */
    const unresolved = await evalJs(`(function(){
      ${DRAWN}
      var pickStudent = function(id){
        var s = document.getElementById('templatePreviewStudent');
        s.value = '${CLS}|' + id;
        s.dispatchEvent(new Event('change', { bubbles: true }));
        return s.value; };
      /* The concern template, previewed against the student with NO GUARDIAN on file. */
      document.querySelector('#templatesList .tpl-item').click();
      pickStudent('${ORPHAN}');
      var m = window.planbook.templatesView.templatesModel();
      var d = drawn();
      /* The same request, asked of the resolver directly. If these two strings differ, the screen
         is showing something the send flow will not. */
      var doc = window.planbook.store.getDoc();
      var cls = doc.classes.filter(function(c){ return c.id === '${CLS}'; })[0];
      var hits = window.planbook.signals.evaluate(doc, cls, '${TERM}');
      var mine = hits.filter(function(x){ return x.studentId === '${ORPHAN}'; });
      var direct = window.planbook.mergeFields.resolveDraft({ doc: doc, classId: '${CLS}',
        termId: '${TERM}', studentId: '${ORPHAN}', hits: hits,
        hit: mine.filter(function(x){ return x.direction === 'concern'; })[0] || null,
        template: { subject: m.editing.subject, body: m.editing.body } });
      return { drawn: d, model: { subject: m.preview.subject, body: m.preview.body,
          blocked: m.preview.draftBlocked, name: m.preview.name,
          errors: m.preview.errors.map(function(e){ return e.code + ':' + e.field; }) },
        direct: { subject: direct.subject, body: direct.body, blocked: direct.blocked } }; })()`);
    check('a field with nothing behind it for THIS student is drawn as the teacher’s own token, '
      + 'intact and marked, and what the column draws is character for character what '
      + 'resolveDraft() returned — the same call WO-5.3 renders from (Acceptance line 2)',
      unresolved.drawn.body === unresolved.direct.body
        && unresolved.drawn.subject === unresolved.direct.subject
        && unresolved.model.body === unresolved.direct.body
        && unresolved.drawn.tokens.indexOf('{{guardian.name}}') >= 0
        && unresolved.drawn.body.indexOf('{{guardian.name}}') >= 0
        && unresolved.direct.blocked === true,
      'tokens drawn = ' + JSON.stringify(unresolved.drawn.tokens)
        + '; errors = ' + JSON.stringify(unresolved.model.errors));
    check('and the block strip says the draft cannot be sent, names the field and names the STUDENT '
      + '— a field can be fine for one student and empty for the next, and a strip that did not '
      + 'name her would send a teacher looking in the template for a fault that is not there',
      unresolved.drawn.blockShown === true && unresolved.drawn.clear === false
        && /cannot be sent/i.test(unresolved.drawn.head)
        && unresolved.drawn.reasons.some(r => r.indexOf('{{guardian.name}}') >= 0
          && r.indexOf(ORPHAN_N) >= 0),
      unresolved.drawn.head + ' :: ' + JSON.stringify(unresolved.drawn.reasons));

    /*
      THE OTHER TWO FAILURES, IN THE SAME TREATMENT — a refused path and a typo. The body tells them
      apart in no way at all, which is the drawing's ruling: a body that rendered a refusal
      differently from a typo would read as though the refusal were a kind of value. The STRIP is
      the layer that explains, and it says two different things.

      AND THE STUDENT UNDER IT IS THE ONE WITH THE PLAN ON FILE, so "nothing sensitive was drawn" is
      a search over what the screen actually holds.
    */
    const refused = await evalJs(`(function(){
      ${TYPE}
      ${DRAWN}
      document.querySelector('[data-template-new]').click();
      type('templateName', 'WO-5.2 broken');
      type('templateSubject', 'About {{studnet.first}}');
      type('templateBody', 'Her plan says {{student.supports.accommodations}} and '
        + '{{supports.medical}}.\\n\\nRegards {{teacher.name}}');
      var s = document.getElementById('templatePreviewStudent');
      s.value = '${CLS}|${FULL}';
      s.dispatchEvent(new Event('change', { bubbles: true }));
      var m = window.planbook.templatesView.templatesModel();
      var d = drawn();
      var secrets = ${JSON.stringify(DRAFT_SECRETS)};
      var wide = ${JSON.stringify(SECRETS)};
      return { drawn: d, codes: m.preview.errors.map(function(e){ return e.code; }).sort(),
        inDraft: secrets.filter(function(w){
          return (d.subject + ' ' + d.body).indexOf(w) >= 0; }),
        inScreen: wide.filter(function(w){ return d.screen.indexOf(w) >= 0; }) }; })()`);
    check('a refused path and an unknown name are handed back INTACT in the body, in the same '
      + 'treatment as an unresolvable field and as each other — three failures, one rendering, told '
      + 'apart by a named code and never by the shape of the output',
      refused.drawn.tokens.indexOf('{{student.supports.accommodations}}') >= 0
        && refused.drawn.tokens.indexOf('{{supports.medical}}') >= 0
        && refused.drawn.tokens.indexOf('{{studnet.first}}') >= 0
        && JSON.stringify(refused.codes) === JSON.stringify(['refused-field', 'refused-field',
          'unknown-field']),
      JSON.stringify(refused.drawn.tokens) + ' :: ' + JSON.stringify(refused.codes));
    check('and NOTHING off the roster reached the preview: neither the accommodation, the medical '
      + 'need, the behavior plan, the attendance clause, the case manager, the review date, the '
      + 'accommodation kind nor the plan type is anywhere in the drawn draft — searched over a '
      + 'template that asks for them, about the student who has all of them on file',
      refused.inDraft.length === 0 && refused.inScreen.length === 0,
      refused.inDraft.length || refused.inScreen.length
        ? 'LEAKED into the draft: ' + refused.inDraft.join(', ') + '; into the screen: '
          + refused.inScreen.join(', ')
        : 'none of the eight strings is in the draft, and none of the six unique ones is anywhere '
          + 'on the screen');
    check('the strip explains the two differently even though the body does not — the refusal says '
      + 'the rule, the typo says to check the spelling',
      refused.drawn.reasons.some(r => /never leave the roster|cannot be made into one/i.test(r))
        && refused.drawn.reasons.some(r => /is not a merge field\./i.test(r)),
      JSON.stringify(refused.drawn.reasons));

    /* ── the strip is permanent, and green when nothing is wrong ── */
    const clear = await evalJs(`(function(){
      ${DRAWN}
      /* The starter Planbook ships for a guardian, previewed against the student every one of its
         fields answers for. It is opened through its own row, which is also the whole of "a starter
         is offered and never loaded": this is the tap that fills the editor. */
      var row = document.querySelector('#templatesStarters [data-template-starter="concern-guardian"]');
      row.click();
      var s = document.getElementById('templatePreviewStudent');
      s.value = '${CLS}|${FULL}';
      s.dispatchEvent(new Event('change', { bubbles: true }));
      var m = window.planbook.templatesView.templatesModel();
      var d = drawn();
      return { drawn: d, fields: m.preview.fields, resolved: m.preview.resolved,
        blocked: m.preview.draftBlocked, isNew: m.editing.isNew,
        stored: window.planbook.store.getDoc().templates.length,
        name: m.editing.name }; })()`);
    check('the block strip is PERMANENT and goes green when nothing is wrong — it says how many '
      + 'fields resolved rather than disappearing, because a strip that appears only on failure is '
      + 'read as an error banner and one that is always there is a report (the owner, 2026-08-28)',
      clear.drawn.blockShown === true && clear.drawn.clear === true
        && clear.blocked === false && clear.drawn.tokens.length === 0
        && /Nothing blocked/i.test(clear.drawn.head)
        && clear.resolved === clear.fields && clear.fields >= 6,
      clear.drawn.head + ' :: ' + clear.fields + ' field(s) named, ' + clear.resolved + ' resolved, '
        + clear.drawn.tokens.length + ' token(s) left standing');
    check('and opening one of the eight fills the editor WITHOUT writing anything — it is an '
      + 'unsaved draft until a Save, which is the one keystroke between a shipped sentence and a '
      + 'hundred guardians reading it in the same words',
      clear.isNew === true && clear.stored === 2 && clear.name.length > 0,
      'editor holds "' + clear.name + '", ' + clear.stored + ' template(s) in the document');

    /*
      PRESENTATION MODE TAKES THE PREVIEW AND LEAVES THE REST — the obligation
      docs/data-model.md § Outreach templates puts on this screen, and the departure from
      #signalsView's outright refusal. Driven through the real header control, because that is what
      a teacher reaches for, and because a check that flipped the preference would prove the module
      and not the chain in src/shell.js that redraws what is already on the glass.
    */
    await clickSel('#presentationBtn');
    await new Promise(r => setTimeout(r, 300));
    const projected = await evalJs(`(function(){
      ${DRAWN}
      var m = window.planbook.templatesView.templatesModel();
      var d = drawn();
      return { drawn: d, on: window.planbook.supports.presentationMode(),
        blocked: m.preview.blocked, subject: m.preview.subject, body: m.preview.body,
        editor: document.getElementById('templateBody').value.length,
        chips: document.querySelectorAll('#templatesPalette .tpl-chip').length,
        rows: document.querySelectorAll('#templatesList .tpl-item').length,
        namedOnScreen: d.screen.indexOf('${FULL_N}') >= 0,
        picker: !document.getElementById('templatePreviewStudentRow').classList.contains('hidden')
      }; })()`);
    check('presentation mode takes the PREVIEW off the screen and leaves the list, the editor and '
      + 'the palette working — nothing is resolved at all while it is on, the student is not named '
      + 'anywhere on the screen, and the refusal says which control brings it back',
      projected.on === true && projected.blocked === true && projected.subject === ''
        && projected.body === '' && projected.drawn.draftShown === false
        && projected.drawn.blockShown === false && projected.drawn.refused === true
        && projected.picker === false && projected.namedOnScreen === false
        && projected.chips === 16 && projected.rows === 2 && projected.editor > 0,
      JSON.stringify({ blocked: projected.blocked, draftShown: projected.drawn.draftShown,
        refusalShown: projected.drawn.refused, named: projected.namedOnScreen,
        chips: projected.chips, rows: projected.rows, editorChars: projected.editor }));
    await clickSel('#presentationBtn');
    await new Promise(r => setTimeout(r, 300));
    const back = await evalJs(`(function(){
      ${DRAWN}
      var d = drawn();
      return { on: window.planbook.supports.presentationMode(), draftShown: d.draftShown,
        refused: d.refused, blockShown: d.blockShown }; })()`);
    check('and turning it off brings the preview straight back, on the same screen and with no '
      + 'reload — the flip is chained in src/shell.js rather than waiting for the next render',
      back.on === false && back.draftShown === true && back.refused === false
        && back.blockShown === true,
      JSON.stringify(back));

    /*
      ACCEPTANCE LINE 4 — templates survive a backup round trip.

      Two halves, and the second is the one the line actually asks for. First the FILE: the document
      is built into a backup exactly as the download button builds it, and read back through the
      same parseBackup() a restore validates with — which is the check that would go red if
      `templates[]` were ever left out of the shape newYearDocument() returns. Then the RESTORE
      itself, through restoreFromText() and the real confirm button, which is where a collection
      that is written but never read comes back empty.
    */
    const roundTrip = await evalJs(`(async function(){
      var b = window.planbook.backup;
      var before = JSON.stringify(window.planbook.store.getDoc().templates);
      var file = await b.buildBackup();
      var parsed = b.parseBackup(file.text, file.name);
      return { before: before, inFile: JSON.stringify(parsed.doc.templates),
        text: file.text, name: file.name,
        counted: (file.text.match(/"tone"/g) || []).length }; })()`);
    check('a backup written by the download path carries the templates, and parseBackup() reads '
      + 'them back byte for byte — the validator that refuses a file whose shape does not match '
      + 'newYearDocument() accepts this one with both records in it',
      roundTrip.before === roundTrip.inFile && roundTrip.counted === 2
        && roundTrip.before.indexOf('WO-5.2 praise to a guardian') >= 0,
      roundTrip.counted + ' tone field(s) in the file; identical = '
        + String(roundTrip.before === roundTrip.inFile));

    const restored = await evalJs(`(async function(){
      await window.planbook.backup.restoreFromText(${JSON.stringify(roundTrip.text)},
        ${JSON.stringify(roundTrip.name)});
      return 1; })()`);
    await new Promise(r => setTimeout(r, 300));
    await clickSel('[data-backup-confirm]');
    await new Promise(r => setTimeout(r, 800));
    for (let pass = 0; pass < 3; pass++) {
      await evalJs("(function(){var o=document.querySelector('.modal-overlay:not(.hidden)');"
        + "if(!o) return 0; var b=o.querySelector('[data-modal-close]'); if(b) b.click();"
        + "return 1;})()");
      await new Promise(r => setTimeout(r, 200));
    }
    await openTemplates();
    const afterRestore = await evalJs(`(function(){
      var doc = window.planbook.store.getDoc();
      var t = window.planbook.templates;
      return { stored: JSON.stringify(doc.templates),
        concern: t.templatesFor(doc, 'concern', 'guardian').length,
        praise: t.templatesFor(doc, 'praise', 'guardian').length,
        rows: document.querySelectorAll('#templatesList .tpl-item').length,
        view: (document.querySelector('main > :not(.hidden)') || {}).id }; })()`);
    check('and a REAL restore — restoreFromText() and the confirm button a teacher taps — brings '
      + 'both templates back, still offered separately by tone, and the list on screen draws them '
      + '(Acceptance line 4)',
      afterRestore.stored === roundTrip.before && afterRestore.concern === 1
        && afterRestore.praise === 1 && afterRestore.rows === 2
        && afterRestore.view === 'templatesView',
      afterRestore.rows + ' row(s) drawn; identical to before the round trip = '
        + String(afterRestore.stored === roundTrip.before)
        + String(restored === 1 ? '' : ' (restoreFromText returned ' + restored + ')'));

    /* ── delete, and the list follows ── */
    const deleted = await evalJs(`(function(){
      document.querySelector('#templatesList .tpl-item').click();
      var was = window.planbook.templatesView.templatesModel().editing.id;
      document.querySelector('[data-template-delete]').click();
      var m = window.planbook.templatesView.templatesModel();
      return { was: was, stored: window.planbook.store.getDoc().templates.length,
        rows: document.querySelectorAll('#templatesList .tpl-item').length,
        isNew: m.editing.isNew, body: m.editing.body,
        deleteShown: !document.getElementById('templateDelete').classList.contains('hidden') };
    })()`);
    check('deleting the open template takes it out of the document and out of the list, and leaves '
      + 'the editor empty with no Delete on it — there is nothing open to delete',
      deleted.stored === 1 && deleted.rows === 1 && deleted.isNew === true
        && deleted.body === '' && deleted.deleteShown === false,
      JSON.stringify(deleted));

    /* ── and every control on it under a thumb ──
       44px, not 28: the month chip's departure is the owner's ruling for ONE control and explicitly
       not a precedent (CLAUDE.md § Conventions). Every control this screen adds is new, so every
       one of them gets the full floor. This is also the measurement
       tools/verify/touch-targets.mjs's VIEW_PLAN points at by name: `byHand` is a pointer to
       coverage and never a way out of one. */
    await send('Emulation.setDeviceMetricsOverride',
      { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await new Promise(r => setTimeout(r, 400));
    const thumb = await evalJs(`(function(){
      var v = document.getElementById('templatesView');
      var d = document.documentElement;
      var nodes = Array.prototype.slice.call(v.querySelectorAll('button, select, textarea, input'));
      var small = [];
      nodes.forEach(function(n){
        var r = n.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return;
        if (getComputedStyle(n).display === 'none') return;
        if (r.height < 44) small.push({ t:(n.textContent || n.id || '').trim().slice(0,24),
          w:Math.round(r.width), h:Math.round(r.height) });
      });
      /* The stacking order at 390px is a decision rather than a fallback: list · editor · preview ·
         palette, with the preview above the palette because the palette is a reference a teacher
         consults and the preview is the thing she is watching while she types. Read as the order the
         four columns actually sit in down the page. */
      var top = function(id){ return Math.round(document.getElementById(id).getBoundingClientRect().top); };
      return { coarse: matchMedia('(pointer: coarse)').matches,
        measured: nodes.length, small: small,
        order: [['list', top('templatesList')], ['editor', top('templateBody')],
          ['preview', top('templatePreviewBlock')], ['palette', top('templatesPalette')]],
        docScroll: d.scrollWidth, docClient: d.clientWidth }; })()`);
    check('every control on the template editor clears 44px high at 390px under a coarse pointer, '
      + 'and the page does not scroll sideways — no control here takes the month chip’s 28px '
      + 'departure, which is one control’s ruling and not a precedent',
      thumb.coarse === true && thumb.measured >= 8 && thumb.small.length === 0
        && thumb.docScroll <= thumb.docClient + 1,
      thumb.measured + ' control(s) measured, under 44 = ' + JSON.stringify(thumb.small)
        + '; document ' + thumb.docScroll + ' in ' + thumb.docClient);
    check('and at 390px the one column runs list · editor · preview · palette — the drawn stacking '
      + 'order, with the preview above the reference rather than below it',
      thumb.order[0][1] < thumb.order[1][1] && thumb.order[1][1] < thumb.order[2][1]
        && thumb.order[2][1] < thumb.order[3][1],
      thumb.order.map(o => o[0] + '@' + o[1]).join(' · '));
    await send('Emulation.setDeviceMetricsOverride',
      { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await new Promise(r => setTimeout(r, 300));

    /* ── nothing about this screen reached localStorage ──
       The tone filter, the open template, the draft and the previewed student are facts about this
       minute. A remembered preview student would be a named student's grade on the glass at the
       next launch, which is the arrival nobody made. */
    const stored = await evalJs(`(function(){
      var out = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        var v = localStorage.getItem(k) || '';
        if (/template|tpl|${FULL}|${ORPHAN}|WO-5\\.2/i.test(k + ' ' + v)) out.push(k + '=' + v.slice(0, 80));
      }
      return out; })()`);
    check('nothing about this screen is in localStorage — not the tone filter, not the open '
      + 'template, not the draft in the editor and not the student the preview was resolved '
      + 'against; the year document is where a template lives',
      stored.length === 0,
      stored.length ? JSON.stringify(stored) : 'no planbook_ key mentions a template or a student');

    /* ── and the fixture comes back off ──
       OFF THE SCREEN FIRST, for the reason merge-fields.mjs leaves the signals list before it takes
       its class apart: the class being removed is the one this screen's preview is drawn from, and
       a store update under an open view re-renders it. */
    if ((await onView()) !== 'homeView') await goHome();
    const HAD = String((plant && plant.hadTeacher) || '').replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'");
    const cleaned = await evalJs(`(function(){
      var s = window.planbook.store;
      s.update(function(doc){
        doc.classes = (doc.classes || []).filter(function(c){ return c.id !== '${CLS}'; });
        doc.students = (doc.students || []).filter(function(p){
          return String(p.id).indexOf('s_wo52') !== 0; });
        doc.assignments = (doc.assignments || []).filter(function(a){
          return String(a.id).indexOf('a_wo52_') !== 0; });
        doc.attendance = (doc.attendance || []).filter(function(r){ return r.classId !== '${CLS}'; });
        /* Whatever was in the collection before this section ran, put back exactly — the
           fixture emptied it so that "the editor opens with an empty list" was a claim about THIS
           document rather than about a lucky one. */
        doc.templates = JSON.parse(${JSON.stringify(plant.hadTemplates)});
        if (doc.scores) {
          Object.keys(doc.scores).forEach(function(k){
            if (k.indexOf('a_wo52_') === 0) delete doc.scores[k]; });
        }
        if (doc.teacher) doc.teacher.name = '${HAD}';
      });
      var d = s.getDoc();
      return { classes:(d.classes || []).filter(function(c){ return c.id === '${CLS}'; }).length,
        students:(d.students || []).filter(function(p){
          return String(p.id).indexOf('s_wo52') === 0; }).length,
        assignments:(d.assignments || []).filter(function(a){
          return String(a.id).indexOf('a_wo52_') === 0; }).length,
        attendance:(d.attendance || []).filter(function(r){ return r.classId === '${CLS}'; }).length,
        templates: JSON.stringify(d.templates || []),
        scores: Object.keys(d.scores || {}).filter(function(k){
          return k.indexOf('a_wo52_') === 0; }).length,
        mode: window.planbook.supports.presentationMode(),
        teacher: String((d.teacher && d.teacher.name) || '') }; })()`);
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
    check('the WO-5.2 fixture came back off the document — class, two students, nine assignments, '
      + 'ten attendance records, every score bag and both templates — the teacher’s own name was '
      + 'put back, presentation mode was left OFF, and the page was left on the grid',
      cleaned.classes === 0 && cleaned.students === 0 && cleaned.assignments === 0
        && cleaned.attendance === 0 && cleaned.scores === 0
        && cleaned.templates === String(plant.hadTemplates) && cleaned.mode === false
        && cleaned.teacher === String((plant && plant.hadTeacher) || '')
        && (await onView()) === 'homeView',
      cleaned.classes + ' class(es), ' + cleaned.students + ' student(s), ' + cleaned.assignments
        + ' assignment(s), ' + cleaned.attendance + ' record(s), ' + cleaned.scores
        + ' score bag(s) left behind, and `templates[]` put back the way it was found ('
        + String(cleaned.templates === String(plant.hadTemplates)) + '); presentation mode = '
        + cleaned.mode + '; teacher name = "' + cleaned.teacher + '"');
  }
}
}
