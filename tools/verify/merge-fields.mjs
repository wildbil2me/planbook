/* merge-fields.mjs — the merge-field resolver (WO-5.1)
 *
 * The resolver is a pure function over a document and a draft with NO SCREEN in this work order —
 * the template editor is WO-5.2 and the send flow is WO-5.3 — so, like `signal-engine.mjs` at
 * WO-4.1 and `calendar-derived.mjs` at WO-6.2, this section asks the MODULE through
 * `window.planbook` rather than tapping controls that do not exist. There is one exception and it
 * is the whole of the navigation below: `{{grade.delta}}` has to be compared with the number a
 * praise row actually DRAWS, and that is markup.
 *
 * Nothing here launches a browser, a server or a document of its own: the entry file owns all three
 * and hands them over on `h`. `tools/README.md` § "Driving a browser over CDP" says where a new
 * check goes.
 */

export async function run(h) {
const { check, skip, send, evalJs, clickSel, KILL_ANIM, waitForBoot, seam } = h;

/*
 * ───────── the merge-field resolver (WO-5.1) ─────────
 *
 * TWO STUDENTS, AND THE FIRST OF THEM CARRIES THE THING THAT MUST NEVER TRAVEL.
 *
 *   Probe   has a full `supports` block — plan, case manager, review date, an accommodation with a
 *           detail on it, a medical need, a behavior plan and an attendance clause — and every one
 *           of those fields holds a string that occurs NOWHERE ELSE in this repository. She is also
 *           the student every resolvable field is exercised against: a guardian, a nickname, nine
 *           pieces of work of which one is marked missing, a grade that rose 21.5 points across the
 *           last four, an absence, a tardy and four behavior entries. So the draft that uses the
 *           whole palette is drafted about the student with the plan on file, which is the only
 *           arrangement in which "no merge field resolves accommodation, medical or plan data" is
 *           a claim a search can settle rather than a claim about an empty haystack.
 *   Orphan  has NO guardian on file and is otherwise ordinary. He is WO-5.1's third acceptance
 *           line: `{{guardian.name}}` has nothing to fill it, the token stays on the page as the
 *           teacher typed it, and the draft is not sendable.
 *
 * THE SENSITIVE STRINGS ARE SEARCHED FOR IN THE OUTPUT, NEVER ASSERTED ABSENT BY READING THE CODE.
 * `SECRETS` below is the list, and every containment check searches the resolved subject AND body
 * for all of it — a check that looked only at the fields it expected to be wrong would go green
 * over a seventeenth field somebody added.
 */
console.log('\n--- the merge-field resolver (WO-5.1) ---');
if (!seam) {
  skip('the merge-field resolver (WO-5.1)', 'window.planbook is not on the page, so nothing here '
    + 'can seed a roster, ask the resolver anything, or put the document back');
} else {
  const CLS = 'c_wo51';
  const TERM = 'tm_wo51';
  const PROBE = 's_wo51probe', ORPHAN = 's_wo51orphan';
  const CLASS_NAME = 'WO-5.1 Outreach';
  const TEACHER = 'Wo51Teacher Name';
  /* Surnames and details nothing else in this repository contains — the technique the praise column
     borrows from WO-6.3, for its reason: "did this string travel" becomes a search over what was
     actually produced rather than an inspection of the fields somebody remembered to look at. */
  const PROBE_N = 'Wo51Probe', ORPHAN_N = 'Wo51Orphan';
  const GUARDIAN_N = 'Wo51Guardian Probe';
  /* Every one of these is on the roster and none of them may ever be in a draft. `IEP` is in the
     list even though it is a short, common string, because a resolver that leaked the plan type
     and nothing else would still be the disclosure this work order exists to prevent. */
  const SECRETS = ['Wo51CaseManager', 'Wo51AccommodationDetail', 'Wo51MedicalDetail',
    'Wo51BehaviorPlanDetail', 'Wo51ClauseDetail', '2027-02-11', 'extended-time', 'IEP'];
  /* The behavior entries' bodies. The subject is what `{{behavior.recent}}` may carry; the body is
     what it may not, and it is planted with a string of its own so the difference is searchable. */
  const BODY_SECRET = 'Wo51BodySecret';

  const onView51 = async () => await evalJs(
    "(function(){var e=document.querySelector('main > :not(.hidden)');return e?e.id:'';})()");
  async function goHome51() {
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

  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  await send('Emulation.setDeviceMetricsOverride',
    { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  await waitForBoot();
  await evalJs(KILL_ANIM);

  /* ── the fixture ── */
  const plant51 = await evalJs(`(function(){
    var s = window.planbook.store;
    var d = s.getDoc();
    if (!d) return { ok:false, why:'no year document is open' };
    var hadTeacher = String((d.teacher && d.teacher.name) || '');
    var today = window.planbook.attendance.todayISO();
    var back = function(n){ return window.planbook.calendar.shiftDays(today, -n); };
    var off = (function(){
      var o = -new Date().getTimezoneOffset();
      var p = function(n){ return (n < 10 ? '0' : '') + n; };
      return (o < 0 ? '-' : '+') + p(Math.floor(Math.abs(o) / 60)) + ':' + p(Math.abs(o) % 60);
    })();
    var stamp = function(iso){ return iso + 'T09:00:00' + off; };

    s.update(function(doc){
      if (!Array.isArray(doc.classes)) doc.classes = [];
      if (!Array.isArray(doc.students)) doc.students = [];
      if (!Array.isArray(doc.assignments)) doc.assignments = [];
      if (!Array.isArray(doc.attendance)) doc.attendance = [];
      if (!Array.isArray(doc.log)) doc.log = [];
      if (!doc.teacher || typeof doc.teacher !== 'object') doc.teacher = {};
      doc.teacher.name = '${TEACHER}';

      /* The roster block docs/data-model.md § The document documents, filled in every field that
         § Accommodations fences — because a fixture that left half of them empty would prove the
         resolver refuses the half somebody happened to plant. */
      doc.students.push({ id:'${PROBE}', first:'Ada', last:'${PROBE_N}', nickname:'Addie',
        email:'', phone:'', phone2:'',
        guardians:[{ name:'${GUARDIAN_N}', relation:'Mother', email:'wo51@example.invalid',
          phone:'', phone2:'', language:'en', preferred:true }],
        counselor:{ name:'', email:'' }, notes:'',
        supports:{ plan:'IEP',
          caseManager:{ name:'Wo51CaseManager', email:'wo51case@example.invalid' },
          reviewDate:'2027-02-11',
          accommodations:[{ kind:'extended-time', detail:'Wo51AccommodationDetail',
            appliesTo:['tests'] }],
          medical:'Wo51MedicalDetail', behaviorPlan:'Wo51BehaviorPlanDetail',
          attendanceClause:'Wo51ClauseDetail' } });
      doc.students.push({ id:'${ORPHAN}', first:'Cal', last:'${ORPHAN_N}', nickname:'',
        email:'', phone:'', phone2:'', guardians:[], counselor:{ name:'', email:'' }, notes:'' });

      doc.classes.push({ id:'${CLS}', name:'${CLASS_NAME}', archived:false,
        roster:['${PROBE}','${ORPHAN}'], letterScale:null,
        terms:[{ id:'${TERM}', label:'WO-5.1 Term', start:back(40),
          end:window.planbook.calendar.shiftDays(today, 40) }],
        categories:[{ id:'k_wo51', name:'All work', weight:100 }]});

      for (var n = 1; n <= 9; n++) {
        doc.assignments.push({ id:'a_wo51_' + n, classId:'${CLS}', termId:'${TERM}',
          categoryId:'k_wo51', name:'WO-5.1 Task ' + n, points:100,
          assigned:back(30), due:back(20) });
      }
      if (!doc.scores || typeof doc.scores !== 'object') doc.scores = {};
      var put = function(id, sid, cell){
        doc.scores[id] = doc.scores[id] || {};
        doc.scores[id][sid] = cell;
      };
      /* PROBE: four at 62, one marked MISSING, four at 98. Nine counted rows, so the last four are
         the 98s — the grade is 71.11% with them and 49.60% without, a rise of 21.51 points against
         a default of 8. The missing one is what makes {{missing.count}} and {{missing.list}} both
         answer for the same student the rest of the palette is drafted about. */
      for (var a = 1; a <= 4; a++) put('a_wo51_' + a, '${PROBE}', { v: 62 });
      put('a_wo51_5', '${PROBE}', { v: null, flag: 'missing' });
      for (var b = 6; b <= 9; b++) put('a_wo51_' + b, '${PROBE}', { v: 98 });
      /* ORPHAN: nine flat 80s TO BEGIN WITH. He exists to have no guardian, and everything else
         about him is unremarkable here so that the one field that fails to resolve is the one under
         test rather than one of six — but only as far as the WO-1.33 block below, which writes
         three of these nine under the low-score line to give him sentences of his own. The reading
         that proves the OTHER student's draft did not move is taken before that happens, which is
         why the change is there and not in this plant. */
      for (var c = 1; c <= 9; c++) put('a_wo51_' + c, '${ORPHAN}', { v: 80 });

      /* Ten recorded meetings, every other day. Probe is absent once and late once, which is 90%
         over the term and gives {{attendance.absences}} and {{attendance.tardies}} a number each
         that is neither zero nor the same as the other. A record with an empty marks bag is TAKEN
         (src/attendance.js's stateOf), and a roster member with no stored mark reads present. */
      for (var m = 0; m < 10; m++) {
        var when = back(20 - m * 2);
        var marks = {};
        if (m === 3) marks['${PROBE}'] = { code: 'A' };
        if (m === 6) marks['${PROBE}'] = { code: 'T' };
        doc.attendance.push({ classId:'${CLS}', date:when, marks:marks });
      }

      /* Four behavior entries, newest first when they come back out. The SUBJECT is what
         {{behavior.recent}} may carry and the BODY is what it may not, so every body holds the
         same searchable string and no subject does. The fourth is what makes the cap of three
         falsifiable — three entries and a cap of three are the same output. */
      var subjects = ['Wo51SubjectNewest', 'Wo51SubjectSecond', 'Wo51SubjectThird',
        'Wo51SubjectOldest'];
      for (var e = 0; e < 4; e++) {
        doc.log.push({ id:'l_wo51_' + e, studentId:'${PROBE}', at:stamp(back(e + 1)),
          kind:'behavior', audience:'', subject:subjects[e], body:'${BODY_SECRET} ' + e });
      }
      /* One note to self, which {{behavior.recent}} must never reach: src/log.js's kind filter is
         asked for the behavior kind BY NAME, so a build that widened the read to everything
         written down puts the teacher's own reminder into an email home. (No backtick in this
         comment, and none anywhere between the two that delimit this template literal: a backtick
         inside an embedded comment still ends the string, because nothing in here is parsed as
         JavaScript by the file that holds it.) */
      doc.log.push({ id:'l_wo51_note', studentId:'${PROBE}', at:stamp(back(1)), kind:'note',
        audience:'', subject:'Wo51NoteToSelf', body:'' });
    });
    var now = s.getDoc();
    return { ok:true, hadTeacher:hadTeacher, today:today,
      students:(now.students || []).filter(function(p){
        return String(p.id).indexOf('s_wo51') === 0; }).length,
      assignments:(now.assignments || []).filter(function(a){
        return a.classId === '${CLS}'; }).length,
      meetings:(now.attendance || []).filter(function(r){
        return r.classId === '${CLS}'; }).length,
      behavior:(now.log || []).filter(function(l){
        return String(l.id).indexOf('l_wo51_') === 0 && l.kind === 'behavior'; }).length }; })()`);
  check('WO-5.1 fixture: one class, two students — one carrying a full `supports` block whose '
    + 'every field holds a string that appears nowhere else in this repository — nine assignments, '
    + 'ten recorded meetings and four behavior entries',
    !!plant51 && plant51.ok === true && plant51.students === 2 && plant51.assignments === 9
      && plant51.meetings === 10 && plant51.behavior === 4,
    plant51 && plant51.ok ? plant51.students + ' student(s), ' + plant51.assignments
      + ' assignment(s), ' + plant51.meetings + ' meeting(s), ' + plant51.behavior + ' entr(ies)'
      : JSON.stringify(plant51));

  if (!plant51 || !plant51.ok) {
    skip('the whole of WO-5.1', 'the fixture did not install, so nothing below it could be asked '
      + 'about a student who has a plan on file');
  } else {
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 600));
    await waitForBoot();
    await evalJs(KILL_ANIM);

    /* The page-side helper every check below drafts through. It resolves a template against one
       student, with the hits of a real evaluate() pass behind it, and hands back the text, the
       errors and one flag. Written once here rather than inline in each check, because a check that
       built its own request could quietly stop passing the hits and take `{{signals.list}}` and
       `{{grade.delta}}` with it. */
    const DRAFT = `var draft = function(subject, body, studentId, ruleId){
      var s = window.planbook.store;
      var doc = s.getDoc();
      var cls = (doc.classes || []).filter(function(c){ return c.id === '${CLS}'; })[0];
      var hits = window.planbook.signals.evaluate(doc, cls, '${TERM}');
      var mine = hits.filter(function(x){ return x.studentId === studentId; });
      var hit = ruleId ? mine.filter(function(x){ return x.ruleId === ruleId; })[0] : null;
      return window.planbook.mergeFields.resolveDraft({ doc: doc, classId: '${CLS}',
        termId: '${TERM}', studentId: studentId, hit: hit, hits: hits,
        template: { subject: subject, body: body } });
    };
    var secrets = ${JSON.stringify(SECRETS)};
    var leaks = function(text){
      return secrets.filter(function(w){ return String(text).indexOf(w) >= 0; });
    };`;

    /*
      THE PALETTE IS THE DOCUMENTED TABLE AND NOTHING ELSE.

      Sixteen names, in the order docs/data-model.md § Outreach templates lists them. This is the
      list WO-5.2's field palette prints, which is also the documentation of the refusal list BY
      OMISSION — so a seventeenth entry appearing here is a field a teacher would be invited to use.
      `tools/wo-sweep.mjs` § 20 reconciles the same names against the data model statically, in both
      directions; this half asserts that the shipped function hands them back.
    */
    const palette = await evalJs(`(function(){
      var p = window.planbook.mergeFields.mergeFieldPalette();
      return { names: p.map(function(f){ return f.name; }),
        withAbout: p.filter(function(f){ return f.about && f.about.length > 8; }).length,
        withResolver: p.filter(function(f){ return typeof f.resolve === 'function'; }).length }; })()`);
    check('the palette is exactly the sixteen fields docs/data-model.md tabulates, in that order, '
      + 'each with the sentence WO-5.2 will print beside it — and no resolver rides out on it, so '
      + 'a screen holding the palette cannot resolve a field outside a draft',
      JSON.stringify(palette.names) === JSON.stringify(['student.first', 'student.last',
        'student.nickname', 'guardian.name', 'class.name', 'teacher.name', 'grade.percent',
        'grade.letter', 'grade.delta', 'missing.count', 'missing.list', 'attendance.percent',
        'attendance.absences', 'attendance.tardies', 'signals.list', 'behavior.recent'])
        && palette.withAbout === 16 && palette.withResolver === 0,
      JSON.stringify(palette));

    /*
      THE WHOLE PALETTE, RESOLVED, ABOUT THE STUDENT WITH THE PLAN ON FILE — and this is the check
      the containment claim rests on rather than a warm-up. Sixteen fields, every one of them
      answered, nothing blocked, and NOT ONE of the eight roster strings anywhere in the output.

      A check that only tried `{{supports.medical}}` would prove that one path is shut. This one
      asks what the sixteen OPEN paths actually carry, which is where a leak would come from in the
      build that gets this wrong — a `signals.list` that quoted a rule's input, a `behavior.recent`
      that took the body, a `missing.list` that reached the student record for a name.
    */
    const full = await evalJs(`(function(){
      ${DRAFT}
      var body = window.planbook.mergeFields.mergeFieldNames().map(function(n){
        return n + ' = {{' + n + '}}'; }).join('\\n');
      var out = draft('About {{student.first}} {{student.last}}', body, '${PROBE}', 'grade-rose');
      var all = out.subject + '\\n' + out.body;
      return { blocked: out.blocked, errors: out.errors.map(function(e){
          return e.code + ':' + e.field; }),
        leaks: leaks(all), left: (all.match(/\\{\\{/g) || []).length,
        blanks: (all.match(/= *$/gm) || []).length,
        subject: out.subject, body: out.body }; })()`);
    check('every one of the sixteen fields resolves for a student who has all of them, the draft is '
      + 'not blocked, and no token is left standing — the palette exercised end to end rather than '
      + 'field by field',
      full.blocked === false && full.errors.length === 0 && full.left === 0 && full.blanks === 0
        && full.subject.indexOf('Ada ' + PROBE_N) >= 0,
      JSON.stringify({ errors: full.errors, left: full.left, blanks: full.blanks,
        subject: full.subject }));
    check('and NONE of the eight roster strings reaches that draft — the case manager, the '
      + 'accommodation detail, the medical need, the behavior plan, the attendance clause, the '
      + 'review date, the accommodation kind or the plan type — searched over the whole of the '
      + 'resolved subject and body, about the student who has every one of them on file',
      Array.isArray(full.leaks) && full.leaks.length === 0,
      full.leaks && full.leaks.length ? 'LEAKED: ' + full.leaks.join(', ')
        : 'none of ' + SECRETS.join(', ') + ' in ' + (full.body || '').length + ' characters');

    /*
      WO-1.33 — THE SECOND STUDENT GETS SENTENCES OF HIS OWN, AND THE POINT IS WHAT DOES NOT MOVE.

      Everything above proves what a field resolves TO. ONE check above can notice the filter going
      missing — the joined-string comparison against the engine's own explanations — and all it says
      when it goes red is that two strings differ: no sentence, no student, no leak named. That is
      the hole WO-1.33 fills. A sentence belonging to somebody else has to EXIST, and has to be
      searched for BY NAME, before its absence from her draft means anything; the filter is
      deliberate, is commented as deliberate at src/merge-fields.js, and is all that stands between.

      THE HIT IS PLANTED HERE RATHER THAN IN THE PLANT ABOVE, and that is what makes the middle
      check honest: `beforeDraft` is the sixteen-field draft this fixture produced while he had
      nothing of his own, so "byte-identical" below is a COMPARISON of two readings taken in this
      run rather than an assertion about a build nobody ran.

      HIS SENTENCES CARRY HIS SURNAME, which is the searchable half — the same technique the eight
      roster strings above are searched for by. `Wo51Orphan` occurs in no file the app SERVES — not
      src/, not index.html, not sw.js — so a draft about the OTHER student that holds it could only
      have got it out of the hits this fixture handed the resolver.

      AND THE PREMISE WO-1.33 WAS WRITTEN ON WAS WRONG, WHICH IS WHY `was` IS REPORTED. He fired
      TWO rules before anything was planted — no-missing and attendance-window, off nine clean
      scores and ten meetings he was present at — and no run had ever printed it. The first check's
      detail line prints that list on every run, so the next reader gets a reading and not a claim:
      a fixture's own arithmetic is the last thing to take on trust in a file that exists for that.
    */
    const beforeDraft = { subject: full.subject, body: full.body };
    const his = await evalJs(`(function(){
      ${DRAFT}
      var s = window.planbook.store;
      var hitsOf = function(sid){
        var d = s.getDoc();
        var c = (d.classes || []).filter(function(x){ return x.id === '${CLS}'; })[0];
        return window.planbook.signals.orderHits(
          window.planbook.signals.evaluate(d, c, '${TERM}').filter(function(h){
            return h.studentId === sid; })); };
      var was = hitsOf('${ORPHAN}').map(function(h){ return h.ruleId; });
      /* Three scores under the low-score line, written over the flat 80s the plant left him. NO NEW
         ASSIGNMENT, NO NEW LOG ENTRY, NO NEW ATTENDANCE ROW AND NO NEW SCORE BAG: the teardown at
         the foot counts every one of those, and a hit that arrived as a new row would leave one
         behind on a run that was otherwise fine. Six of his nine scores are untouched, so his grade
         stays above the concern line and this is a run of low scores rather than four rules at
         once — a smaller fixture change says the same thing about the filter. */
      s.update(function(doc){
        for (var n = 7; n <= 9; n++) doc.scores['a_wo51_' + n]['${ORPHAN}'] = { v: 41 };
      });
      var now = hitsOf('${ORPHAN}');
      var out = draft('S', '{{signals.list}}', '${ORPHAN}', null);
      return { was: was, rules: now.map(function(h){ return h.ruleId; }),
        sentences: now.map(function(h){ return h.explanation; }),
        named: now.filter(function(h){
          return String(h.explanation).indexOf('${ORPHAN_N}') >= 0; }).length,
        resolved: out.body, blocked: out.blocked }; })()`);
    check('the second fixture student carries signal hits of HIS OWN, and every sentence names him '
      + '— three scores under the low-score line written over the flat 80s the plant left him, and '
      + 'his own `{{signals.list}}` says them back in the app’s own order. A sentence belonging to '
      + 'somebody else has to exist before its absence from her draft means anything',
      Array.isArray(his.rules) && his.rules.indexOf('low-score-run') >= 0
        && his.sentences.length >= 1 && his.named === his.sentences.length
        && his.blocked === false && his.resolved === his.sentences.join('\n'),
      JSON.stringify({ firedBefore: his.was, firesNow: his.rules }));

    const after = await evalJs(`(function(){
      ${DRAFT}
      var d = window.planbook.store.getDoc();
      var c = (d.classes || []).filter(function(x){ return x.id === '${CLS}'; })[0];
      /* Recomputed page-side rather than quoted in from the reading above: an explanation is
         engine-composed text, and interpolating it into this template literal would put a string
         nobody controls where a backtick would end the program. */
      var his = window.planbook.signals.orderHits(
        window.planbook.signals.evaluate(d, c, '${TERM}').filter(function(h){
          return h.studentId === '${ORPHAN}'; })).map(function(h){ return h.explanation; });
      var body = window.planbook.mergeFields.mergeFieldNames().map(function(n){
        return n + ' = {{' + n + '}}'; }).join('\\n');
      var out = draft('About {{student.first}} {{student.last}}', body, '${PROBE}', 'grade-rose');
      var all = out.subject + '\\n' + out.body;
      var list = draft('S', '{{signals.list}}', '${PROBE}', 'grade-rose');
      return { subject: out.subject, body: out.body, blocked: out.blocked, his: his.length,
        found: his.filter(function(t){ return all.indexOf(t) >= 0; }),
        name: all.indexOf('${ORPHAN_N}') >= 0,
        inList: his.filter(function(t){ return list.body.indexOf(t) >= 0; }).length }; })()`);
    check('and her sixteen-field draft is byte-identical either side of it — subject and body both, '
      + 'against the reading taken while he had nothing — so the second student gaining a hit moved '
      + 'nothing that any check on either side of this line is measuring',
      after.blocked === false && after.subject === beforeDraft.subject
        && after.body === beforeDraft.body,
      after.subject === beforeDraft.subject && after.body === beforeDraft.body
        ? (beforeDraft.subject + beforeDraft.body).length + ' characters, unchanged'
        : 'THE DRAFT MOVED — was ' + JSON.stringify(beforeDraft) + ', now '
          + JSON.stringify({ subject: after.subject, body: after.body }));
    check('and NOT ONE WORD of his sentences reaches her draft — every one of them, and his surname '
      + 'as well, searched for across the WHOLE resolved subject and body of all sixteen fields '
      + 'rather than in `{{signals.list}}` alone, because the leak would arrive through any field '
      + 'that walks hits. `{{signals.list}}`’s `studentId` filter is the only thing standing '
      + 'between the two students, and deleting it turns this red',
      after.his >= 1 && after.found.length === 0 && after.name === false && after.inList === 0,
      after.found.length || after.name
        ? 'LEAKED: ' + (after.found.join(' | ') || 'the surname "' + ORPHAN_N + '"')
        : after.his + ' sentence(s) of his, not one of them and no "' + ORPHAN_N + '" anywhere in '
          + (after.subject + '\n' + after.body).length + ' characters of her draft');

    /*
      ACCEPTANCE LINE 1, AND "VERIFY EVERY PATH IN THE REFUSAL LIST INDIVIDUALLY" TAKEN LITERALLY.

      Six roots, each asked in its own draft and in more than one spelling — bare, under `student.`,
      capitalised, and with a leaf on the end — because the mistake this guards against is a build
      that refuses the exact string somebody wrote a check for and resolves the one beside it. Each
      one must come back `refused-field`, must block, must leave the token on the page as typed, and
      must carry nothing off the roster.
    */
    const refusals = await evalJs(`(function(){
      ${DRAFT}
      var paths = ['supports', 'supports.accommodations', 'student.supports',
        'student.supports.medical', 'SUPPORTS.MEDICAL', 'medical', 'student.medical',
        'behaviorPlan', 'student.supports.behaviorPlan', 'plan', 'student.supports.plan',
        'caseManager', 'supports.caseManager.name', 'reviewDate', 'supports.reviewDate',
        'accommodations', 'supports.attendanceClause'];
      return paths.map(function(p){
        var out = draft('Re {{' + p + '}}', 'Body {{' + p + '}} end', '${PROBE}', 'grade-rose');
        var all = out.subject + ' ' + out.body;
        return { path: p, blocked: out.blocked,
          codes: out.errors.map(function(e){ return e.code; }),
          fields: out.errors.map(function(e){ return e.field; }),
          intact: all.indexOf('{{' + p + '}}') >= 0,
          leaks: leaks(all) }; }); })()`);
    const badRefusal = refusals.filter(r => !(r.blocked === true && r.intact === true
      && r.leaks.length === 0 && r.codes.length === 2
      && r.codes.every(c => c === 'refused-field') && r.fields.every(f => f === r.path)));
    check('every path in WO-5.1’s refusal list is refused INDIVIDUALLY — seventeen spellings across '
      + 'supports, medical, behaviorPlan, plan, caseManager, reviewDate, accommodations and the '
      + 'attendance clause — each raising the NAMED `refused-field` error, each blocking the draft, '
      + 'each leaving its token exactly as the teacher typed it, and none of them carrying a '
      + 'roster string',
      refusals.length === 17 && badRefusal.length === 0,
      badRefusal.length ? 'not refused as specified: ' + JSON.stringify(badRefusal)
        : refusals.length + ' path(s), all `refused-field`, all blocking, all tokens intact, '
          + 'no roster string in any of the ' + (refusals.length * 2) + ' resolved strings');

    /*
      ACCEPTANCE LINE 6 — AN UNKNOWN NAME IS REFUSED, NOT SILENTLY BLANKED — and the four names
      after the typos are the reason `FIELDS` is an ARRAY scanned by `===` rather than an object
      indexed by the token. `{{constructor}}`, `{{toString}}`, `{{__proto__}}` and `{{valueOf}}` all
      find something truthy on any object literal, and a resolver that looked one up would either
      throw or render `[object Object]` into an email. The empty token is here for the same class of
      reason: `''` is a name too, and a build that treated it as "nothing to do" would silently
      delete it.
    */
    const unknowns = await evalJs(`(function(){
      ${DRAFT}
      var names = ['student.email', 'studnet.first', 'grade', 'guardian', 'signals',
        'constructor', 'toString', '__proto__', 'valueOf', ''];
      return names.map(function(n){
        var out = draft('S', 'x {{' + n + '}} y', '${PROBE}', 'grade-rose');
        return { name: n, blocked: out.blocked,
          code: out.errors.length ? out.errors[0].code : '',
          field: out.errors.length ? out.errors[0].field : '(none)',
          intact: out.body.indexOf('{{' + n + '}}') >= 0,
          body: out.body }; }); })()`);
    const badUnknown = unknowns.filter(u => !(u.blocked === true && u.intact === true
      && u.code === 'unknown-field' && u.field === u.name));
    check('an unknown field name is REFUSED and never silently blanked — ten of them, including '
      + 'the four keys that live on every object’s prototype and the empty token, each blocking '
      + 'with `unknown-field` and each left on the page as typed',
      unknowns.length === 10 && badUnknown.length === 0,
      badUnknown.length ? 'not refused as specified: ' + JSON.stringify(badUnknown)
        : unknowns.length + ' name(s), all `unknown-field`, all blocking, all tokens intact');

    /*
      AND THE TWO OUTCOMES ARE NOT THE SAME OUTCOME. WO-5.1 grades the refusal, the unresolved
      guardian and the unknown name on three separate acceptance lines, so a build that answered all
      three with one code would satisfy a reading of the output and could not be asked which of them
      it had done. One draft, three tokens, three distinct codes.
    */
    const codes = await evalJs(`(function(){
      ${DRAFT}
      var out = draft('S', '{{supports.medical}} {{student.email}} {{guardian.name}}',
        '${ORPHAN}', null);
      return { codes: out.errors.map(function(e){ return e.code + ':' + e.field; }),
        blocked: out.blocked, body: out.body }; })()`);
    check('a refusal, an unknown name and an unresolvable field are three outcomes and not one — '
      + 'the same body carries `refused-field`, `unknown-field` and `unresolved-field`, each naming '
      + 'its own token, and all three tokens survive into the text',
      codes.blocked === true
        && JSON.stringify(codes.codes) === JSON.stringify(['refused-field:supports.medical',
          'unknown-field:student.email', 'unresolved-field:guardian.name'])
        && codes.body === '{{supports.medical}} {{student.email}} {{guardian.name}}',
      JSON.stringify(codes));

    /*
      ACCEPTANCE LINE 3 — the student with no guardian on file. The field is REAL, so this is the
      data half of the never-render-blank rule rather than the template half: the error is
      `unresolved-field`, it names the field AND the student, "Dear ," is not what comes out, and
      `blocked` is what WO-5.3 will read before it opens a mail client.
    */
    const noGuardian = await evalJs(`(function(){
      ${DRAFT}
      var out = draft('About {{student.first}}', 'Dear {{guardian.name}},', '${ORPHAN}', null);
      var e = out.errors[0] || {};
      return { blocked: out.blocked, count: out.errors.length, code: e.code, field: e.field,
        where: e.where, studentId: e.studentId, named: String(e.message || '')
          .indexOf('Cal ${ORPHAN_N}') >= 0,
        namesField: String(e.message || '').indexOf('{{guardian.name}}') >= 0,
        body: out.body, subject: out.subject }; })()`);
    check('a student with no guardian on file blocks the draft, naming the missing field and the '
      + 'student — `{{guardian.name}}` stays on the page exactly as typed rather than rendering '
      + '"Dear ,", and the fields that DO resolve around it still resolve',
      noGuardian.blocked === true && noGuardian.count === 1
        && noGuardian.code === 'unresolved-field' && noGuardian.field === 'guardian.name'
        && noGuardian.where === 'body' && noGuardian.studentId === ORPHAN
        && noGuardian.named === true && noGuardian.namesField === true
        && noGuardian.body === 'Dear {{guardian.name}},' && noGuardian.subject === 'About Cal',
      JSON.stringify(noGuardian));

    /*
      ACCEPTANCE LINE 4 — the same student, the same term, and the number the GRADEBOOK prints.

      `gradesRecord()` is src/grades-report.js's own model for the printed class grade sheet and the
      CSV, and its `grade` and `letter` are the strings those two surfaces put on paper. Comparing
      against them rather than against a second call to the engine is the point: a resolver that did
      its own arithmetic would agree with the engine on some fixture and disagree with the sheet the
      teacher is holding, and the email is the copy that is wrong.
    */
    await evalJs(`(function(){ window.planbook.classes.selectClass('${CLS}');
      window.planbook.classes.selectTerm('${TERM}'); return 1; })()`);
    await new Promise(r => setTimeout(r, 250));
    const sheet = await evalJs(`(function(){
      ${DRAFT}
      var record = window.planbook.gradesReport.gradesRecord();
      var row = record ? record.students.filter(function(r){
        return r.id === '${PROBE}'; })[0] : null;
      var out = draft('S', '{{grade.percent}} | {{grade.letter}}', '${PROBE}', 'grade-rose');
      return { classId: record ? record.classId : '', sheetGrade: row ? row.grade : '',
        sheetLetter: row ? row.letter : '', resolved: out.body, blocked: out.blocked }; })()`);
    check('`{{grade.percent}}` and `{{grade.letter}}` are the strings the class grade sheet prints '
      + 'for the same student and term, character for character — taken off gradesRecord() rather '
      + 'than off a second call to the engine, because the sheet is what the teacher is holding',
      sheet.classId === CLS && sheet.blocked === false && !!sheet.sheetGrade && !!sheet.sheetLetter
        && sheet.resolved === sheet.sheetGrade + ' | ' + sheet.sheetLetter,
      JSON.stringify(sheet));

    /*
      ACCEPTANCE LINE 5 — the delta in the email is the delta on the row, read off the ROW.

      The praise column draws `signalFigure(hit).text` big (src/signals-view.js), so this opens the
      screen, finds the student's praise row by its own `data-signal-row` key and reads the number
      out of the markup. A model-to-model comparison would have gone green over a build whose row
      drew one number and whose resolver produced another, which is the only failure this line is
      about.
    */
    /* `selectClass()` above put the class screen up, so the header's own "All classes" tab is
       drawn and `goHome51()` has something visible to click. Guarded anyway: on the home screen
       that tab is not drawn at all, and clicking a hidden `[data-view-home]` is trap 1 at the DOM
       level — the harness measures it at 0x0 and clicks the corner of the page instead. */
    if ((await onView51()) !== 'homeView') await goHome51();
    await clickSel('#homeGrid [data-class-tab="' + CLS + '"]');
    await new Promise(r => setTimeout(r, 250));
    await clickSel('#classView [data-class-screen="signals"]');
    await new Promise(r => setTimeout(r, 400));
    const delta = await evalJs(`(function(){
      ${DRAFT}
      var row = document.querySelector(
        '#signalsPraiseList [data-signal-row="${PROBE}|${CLS}"]');
      var box = row ? row.querySelector('.sig-delta') : null;
      var drawn = box ? String(box.childNodes[0] ? box.childNodes[0].textContent : '') : '';
      var unit = box ? String(box.querySelector('.sig-delta-unit').textContent) : '';
      var out = draft('S', '{{grade.delta}}', '${PROBE}', 'grade-rose');
      return { drawn: drawn, unit: unit, resolved: out.body, blocked: out.blocked,
        onScreen: !!row }; })()`);
    check('`{{grade.delta}}` is the figure the praise row DRAWS for that student, read out of the '
      + 'rendered row rather than asked of the model a second time — the same signed, two-decimal '
      + 'string, against a rise of 21.51 points',
      delta.onScreen === true && delta.blocked === false && delta.unit === 'points'
        && /^\+\d+\.\d\d$/.test(delta.drawn) && delta.resolved === delta.drawn,
      JSON.stringify(delta));

    /*
      AND IT ANSWERS NOTHING AT ALL FOR A RULE WHOSE FIGURE IS NOT IN POINTS. `high-score-run`
      counts SCORES and `behavior-window` counts ENTRIES; a field called `grade.delta` carrying
      either of those numbers is the subtraction PRAISE_RANK exists to prevent, arriving in a
      guardian's inbox. Both come back unresolved and blocking, with the token intact.
    */
    const wrongUnit = await evalJs(`(function(){
      ${DRAFT}
      return ['high-score-run', 'behavior-window'].map(function(r){
        var out = draft('S', 'moved {{grade.delta}}', '${PROBE}', r);
        return { rule: r, blocked: out.blocked, body: out.body,
          code: out.errors.length ? out.errors[0].code : '' }; }); })()`);
    check('`{{grade.delta}}` refuses a signal whose figure is not a change in the GRADE — a run of '
      + 'strong scores counts scores and a behavior window counts entries, and neither number may '
      + 'ride out under that name; both block with the token intact',
      wrongUnit.length === 2 && wrongUnit.every(w => w.blocked === true
        && w.code === 'unresolved-field' && w.body === 'moved {{grade.delta}}'),
      JSON.stringify(wrongUnit));

    /*
      ACCEPTANCE LINE 2 — and the honest form of it, stated here because the line's own wording
      describes something this app does not have.

      THERE IS NO ACCOMMODATION-DERIVED SIGNAL, and there cannot be one: src/signals.js reads no
      support, no plan and no medical need, and WO-4.4 put the one reader of
      `supports.attendanceClause` in src/accommodation-prompt.js precisely so that it did not live
      in the engine. So the strongest available reading of this line is a student who HAS the whole
      block on file and whose signals fire — three of them here, one of which is the behavior rule,
      the only rule in the engine whose input is something a teacher typed.

      The claim is made twice over: the sentences carry none of the eight roster strings and none of
      the behavior bodies, and they are exactly the engine's own explanations in the app's own
      order, joined — so a build that composed its own sentence out of the hits would fail this
      even if the sentence it composed happened to be clean.
    */
    const list = await evalJs(`(function(){
      ${DRAFT}
      var s = window.planbook.store;
      var doc = s.getDoc();
      var cls = (doc.classes || []).filter(function(c){ return c.id === '${CLS}'; })[0];
      var hits = window.planbook.signals.evaluate(doc, cls, '${TERM}');
      var mine = window.planbook.signals.orderHits(hits.filter(function(x){
        return x.studentId === '${PROBE}'; }));
      var out = draft('S', '{{signals.list}}', '${PROBE}', 'grade-rose');
      return { resolved: out.body, blocked: out.blocked,
        expected: mine.map(function(x){ return x.explanation; }).join('\\n'),
        rules: mine.map(function(x){ return x.ruleId; }),
        leaks: leaks(out.body), body: out.body.indexOf('${BODY_SECRET}') >= 0,
        subject: out.body.indexOf('Wo51SubjectNewest') >= 0 }; })()`);
    check('`{{signals.list}}` for a student with a plan, a case manager, a medical need and a '
      + 'behavior plan on file emits no plan reference — and it is the engine’s OWN explanations '
      + 'in the app’s own order, so a build that wrote its own sentence out of the hits fails here '
      + 'whether or not that sentence happened to be clean',
      list.blocked === false && list.rules.length >= 2 && list.rules.indexOf('behavior-window') >= 0
        && list.resolved === list.expected && list.leaks.length === 0
        && list.body === false && list.subject === false,
      list.leaks && list.leaks.length ? 'LEAKED: ' + list.leaks.join(', ')
        : JSON.stringify({ rules: list.rules, matches: list.resolved === list.expected,
          bodyIn: list.body, subjectIn: list.subject }));

    /*
      `{{behavior.recent}}` — THE ONE FIELD WHOSE SOURCE IS FREE TEXT, and the three things this
      build decided about it, each asserted rather than described.

      · The BODY never crosses. It is the long half, and the place a plan reference would actually
        be written; every planted body carries the same searchable string and none of it appears.
      · The KIND is asked for by name, so the note to self — the teacher's own working memory — is
        not in the draft either. A build that read "everything written down" fails on that string.
      · THREE, newest first. Four entries were planted precisely so that a cap of three and no cap
        at all are different outputs; the oldest subject must be absent.
    */
    const recent = await evalJs(`(function(){
      ${DRAFT}
      var out = draft('S', '{{behavior.recent}}', '${PROBE}', 'grade-rose');
      return { body: out.body, blocked: out.blocked,
        lines: out.body.split('\\n').length,
        hasBody: out.body.indexOf('${BODY_SECRET}') >= 0,
        hasNote: out.body.indexOf('Wo51NoteToSelf') >= 0,
        newest: out.body.indexOf('Wo51SubjectNewest') >= 0,
        third: out.body.indexOf('Wo51SubjectThird') >= 0,
        oldest: out.body.indexOf('Wo51SubjectOldest') >= 0,
        dated: /^[A-Z][a-z]+ \\d+, \\d{4} — /.test(out.body) }; })()`);
    check('`{{behavior.recent}}` carries the date and the heading of the three newest BEHAVIOR '
      + 'entries and nothing else — not the body, which is the free-text half a plan reference '
      + 'would be written into; not the note to self, which src/log.js is asked past by name; and '
      + 'not the fourth entry, which is what makes the cap falsifiable',
      recent.blocked === false && recent.lines === 3 && recent.hasBody === false
        && recent.hasNote === false && recent.newest === true && recent.third === true
        && recent.oldest === false && recent.dated === true,
      JSON.stringify(recent));

    /*
      THE COUNTS AND THE LISTS COME OUT OF THE MODULES THAT OWN THEM — WO-5.1's fourth deliverable,
      asserted against those modules' own answers rather than against numbers written into this
      file. `openWork()` decides what "missing" means and src/attendance.js decides which days were
      meetings; a resolver that counted either for itself would agree with a fixture and disagree
      with the registry the first time a day off was authored.
    */
    const numbers = await evalJs(`(function(){
      ${DRAFT}
      var doc = window.planbook.store.getDoc();
      var cls = (doc.classes || []).filter(function(c){ return c.id === '${CLS}'; })[0];
      var term = cls.terms[0];
      var rows = window.planbook.gradeEngine.openWork(doc, cls, '${TERM}', '${PROBE}')
        .filter(function(r){ return r.state === 'missing'; });
      var names = rows.map(function(r){
        return (doc.assignments.filter(function(a){ return a.id === r.id; })[0] || {}).name; });
      var totals = window.planbook.attendance.termTotals('${CLS}', '${PROBE}', term);
      var out = draft('S', '{{missing.count}}|{{missing.list}}|{{attendance.percent}}|'
        + '{{attendance.absences}}|{{attendance.tardies}}', '${PROBE}', 'grade-rose');
      return { resolved: out.body, blocked: out.blocked,
        expected: rows.length + '|' + names.join(', ') + '|'
          + window.planbook.attendance.percentText(totals) + '|' + totals.A + '|' + totals.T,
        meetings: totals.meetings }; })()`);
    check('`{{missing.*}}` and `{{attendance.*}}` are openWork()’s rows and src/attendance.js’s '
      + 'term totals, said in that module’s own words — nothing in the resolver counts a cell, a '
      + 'meeting or a percentage for itself',
      numbers.blocked === false && numbers.meetings === 10
        && numbers.resolved === numbers.expected,
      JSON.stringify(numbers));

    /*
      AND `{{missing.list}}` IS THE ONE THAT REFUSES AN EMPTY ANSWER WHERE `{{missing.count}}` DOES
      NOT. "He is missing: " going home is the never-render-blank rule's own example with a
      different noun in it, and a count of zero is a true sentence. The orphan has nothing marked
      missing, so this is one draft in which one of the pair resolves and the other blocks.
    */
    const emptyList = await evalJs(`(function(){
      ${DRAFT}
      var out = draft('S', 'count {{missing.count}} list {{missing.list}}', '${ORPHAN}', null);
      return { body: out.body, blocked: out.blocked,
        codes: out.errors.map(function(e){ return e.code + ':' + e.field; }) }; })()`);
    check('a count of zero resolves and an empty LIST does not — "he is missing: " is the '
      + 'never-render-blank rule with a different noun in it, so `{{missing.count}}` answers "0" '
      + 'and `{{missing.list}}` blocks with its token intact, in the same draft',
      emptyList.blocked === true && emptyList.body === 'count 0 list {{missing.list}}'
        && JSON.stringify(emptyList.codes)
          === JSON.stringify(['unresolved-field:missing.list']),
      JSON.stringify(emptyList));

    /*
      PRESENTATION MODE CHANGES NOTHING HERE, AND THAT IS A RULING RATHER THAN AN OVERSIGHT —
      recorded as a check because a decision nobody can falsify is a decision the next build
      reverses by accident.

      `logKindVisible()` is the SCREEN's suppression: a projector in a classroom. An email to a
      guardian is not a projector, and a guardian is entitled to what a behavior entry says — it is
      the whole reason `{{behavior.recent}}` is a documented field. A resolver that read through
      `visibleEntriesFor()` would hand a teacher who left the header switch on a draft with its
      behavior paragraph silently gone, or a block whose message says there is nothing on file when
      there is. The obligation that follows lands on WO-5.2: a live preview IS a screen, and it asks
      src/supports.js — the one function, never a second copy — before it draws a resolved body.

      What this asserts is that the resolver's answer is byte-identical in both modes, which is also
      the check that would go red if a later work order decided the other way without saying so.
    */
    const modes = await evalJs(`(function(){
      ${DRAFT}
      var was = window.planbook.supports.presentationMode();
      var body = '{{behavior.recent}}|{{signals.list}}|{{grade.percent}}';
      window.planbook.supports.setPresentationMode(false);
      var off = draft('S', body, '${PROBE}', 'grade-rose');
      window.planbook.supports.setPresentationMode(true);
      var on = draft('S', body, '${PROBE}', 'grade-rose');
      var cardHidden = window.planbook.supports.logKindVisible('behavior');
      window.planbook.supports.setPresentationMode(was);
      return { same: off.body === on.body, blocked: on.blocked || off.blocked,
        cardHidden: cardHidden, restored: window.planbook.supports.presentationMode() === was,
        leaks: leaks(on.body) }; })()`);
    check('presentation mode does not change what a merge field resolves, and that is this work '
      + 'order’s ruling rather than a gap — the mode is the SCREEN’s suppression (a behavior entry '
      + 'is absent from the log card with it on, asserted here) and an email to a guardian is not a '
      + 'projector; WO-5.2’s preview is the screen that owes src/supports.js the question',
      modes.same === true && modes.blocked === false && modes.cardHidden === false
        && modes.restored === true && modes.leaks.length === 0,
      JSON.stringify(modes));

    /*
      RESOLVING WRITES NOTHING. src/merge-fields.js imports no writer, and this is that claim
      measured on the document rather than read off the imports — the same posture WO-4.5 takes
      about the cooldown. `tools/wo-sweep.mjs` § 20 is the other half: the harness proves what
      today's paths wrote, the grep proves there is nothing in the file that could write on any
      input.
    */
    const inert = await evalJs(`(function(){
      ${DRAFT}
      var before = JSON.stringify(window.planbook.store.getDoc());
      draft('{{student.first}}', window.planbook.mergeFields.mergeFieldNames().map(function(n){
        return '{{' + n + '}}'; }).join(' '), '${PROBE}', 'grade-rose');
      draft('S', '{{supports.medical}} {{nope}}', '${ORPHAN}', null);
      var after = JSON.stringify(window.planbook.store.getDoc());
      return { same: before === after, bytes: before.length }; })()`);
    check('the document is byte-identical either side of a resolve — three drafts including a '
      + 'refusal and an unknown name, and not one byte of the year moved',
      inert.same === true && inert.bytes > 0,
      inert.same ? inert.bytes + ' characters, unchanged' : 'THE DOCUMENT MOVED');

    /*
      AND `resolveDraft()` SAYS WHICH HALF OF THE TEMPLATE A PROBLEM IS IN. A subject line is what a
      teacher scans and a body is what she reads, so an error list that could not tell them apart
      would send WO-5.2's editor looking in the wrong field. One error in the subject blocks the
      whole draft on its own, which is the flag WO-5.3 reads before it opens a mail client.
    */
    const where = await evalJs(`(function(){
      ${DRAFT}
      var out = draft('Re {{supports.medical}}', 'Dear {{guardian.name}},', '${PROBE}',
        'grade-rose');
      return { blocked: out.blocked, subject: out.subject, body: out.body,
        pairs: out.errors.map(function(e){ return e.where + '/' + e.code; }) }; })()`);
    check('`resolveDraft()` blocks on a subject-line problem alone and says which half of the '
      + 'template each error is in — the subject keeps its refused token, the body resolves around '
      + 'it, and the flag is the whole of this module’s say in the send',
      where.blocked === true && where.subject === 'Re {{supports.medical}}'
        && where.body === 'Dear ' + GUARDIAN_N + ','
        && JSON.stringify(where.pairs) === JSON.stringify(['subject/refused-field']),
      JSON.stringify(where));
  }

  /* ── and the fixture comes back off ── */
  /* OFF THE SIGNALS SCREEN FIRST, and that is not tidiness: the class being removed is the one that
     screen is drawn from, and a store update under an open view re-renders it. Leaving by the door
     before the room is taken apart is what the WO-4.5 section does at its own foot. */
  if ((await onView51()) !== 'homeView') await goHome51();
  /* The teacher's own name, as it was before the fixture wrote over it, quoted back into the
     page-side code. Escaped rather than trusted: this run's document is whatever the sections above
     left behind, and a name holding an apostrophe would otherwise end the string literal. */
  const HAD = String((plant51 && plant51.hadTeacher) || '').replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'");
  const cleaned51 = await evalJs(`(function(){
    var s = window.planbook.store;
    s.update(function(doc){
      doc.classes = (doc.classes || []).filter(function(c){ return c.id !== '${CLS}'; });
      doc.students = (doc.students || []).filter(function(p){
        return String(p.id).indexOf('s_wo51') !== 0; });
      doc.assignments = (doc.assignments || []).filter(function(a){
        return String(a.id).indexOf('a_wo51_') !== 0; });
      doc.attendance = (doc.attendance || []).filter(function(r){ return r.classId !== '${CLS}'; });
      doc.log = (doc.log || []).filter(function(e){
        return String(e.id).indexOf('l_wo51_') !== 0; });
      if (doc.scores) {
        Object.keys(doc.scores).forEach(function(k){
          if (k.indexOf('a_wo51_') === 0) delete doc.scores[k]; });
      }
      if (doc.teacher) doc.teacher.name = '${HAD}';
    });
    var d = s.getDoc();
    return { classes:(d.classes || []).filter(function(c){ return c.id === '${CLS}'; }).length,
      students:(d.students || []).filter(function(p){
        return String(p.id).indexOf('s_wo51') === 0; }).length,
      assignments:(d.assignments || []).filter(function(a){
        return String(a.id).indexOf('a_wo51_') === 0; }).length,
      attendance:(d.attendance || []).filter(function(r){ return r.classId === '${CLS}'; }).length,
      log:(d.log || []).filter(function(e){
        return String(e.id).indexOf('l_wo51_') === 0; }).length,
      scores: Object.keys(d.scores || {}).filter(function(k){
        return k.indexOf('a_wo51_') === 0; }).length,
      teacher: String((d.teacher && d.teacher.name) || '') }; })()`);
  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  check('the WO-5.1 fixture came back off the document — class, two students, nine assignments, '
    + 'ten attendance records, five log entries and every score bag — the teacher’s own name was '
    + 'put back the way it was found, and the page was left on the grid',
    cleaned51.classes === 0 && cleaned51.students === 0 && cleaned51.assignments === 0
      && cleaned51.attendance === 0 && cleaned51.log === 0 && cleaned51.scores === 0
      && cleaned51.teacher === String((plant51 && plant51.hadTeacher) || '')
      && (await onView51()) === 'homeView',
    cleaned51.classes + ' class(es), ' + cleaned51.students + ' student(s), '
      + cleaned51.assignments + ' assignment(s), ' + cleaned51.attendance + ' record(s), '
      + cleaned51.log + ' log entr(ies) and ' + cleaned51.scores + ' score bag(s) left behind; '
      + 'teacher name = "' + cleaned51.teacher + '" (wanted "'
      + String((plant51 && plant51.hadTeacher) || '') + '")');
}
}
