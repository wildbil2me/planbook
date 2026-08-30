/* contact-log.mjs — the contact log and the history over it (WO-5.4)
 *
 * The second section over the send flow, after `outreach.mjs`, and it is separate from that one for
 * the reason `cooldown-quiet.mjs` is separate from `concern-list.mjs`: the fixture is nothing like
 * it. This one needs a student who trips TWO concern rules, so that "the cooldown keys on
 * `student + rule`" can be proved from a real handoff rather than from a planted record — one rule
 * goes quiet and the other one does not, on the same student, off the same click.
 *
 * WHAT IS ASKED HERE THAT NOTHING ELSE CAN ASK. `outreach.mjs` proves that DRAFTING writes nothing;
 * this proves that the HANDOFF writes exactly one thing, and the two halves together are the
 * re-scoping WO-5.4 owed that section. It is also the only place in the harness where the handoff
 * link is actually pressed.
 *
 * AND SINCE WO-5.9, BOTH BRANCHES OF THE ONE FIELD THAT DECIDES WHETHER A CONTACT SILENCES ANYTHING.
 * `cooldown-quiet.mjs` proves the READER tolerates a contact with no `ruleId`, off a record its own
 * fixture hand-writes; the two checks at the foot of this file prove the WRITER produces one, on a
 * record the app wrote, and then hand that record back to the reader. Each half was tested against a
 * hand-made counterpart for a fortnight and the two had never been introduced.
 *
 * PRESSING IT IS SAFE HERE, AND THE ONE LINE THAT MAKES IT SAFE IS THE HARNESS'S OWN. Following a
 * `mailto:` hands the page to the operating system, which is the thing a harness must never do — so
 * this section installs a capture-phase listener OF ITS OWN that calls preventDefault(), clicks, and
 * takes the listener straight back off. **The app does not call preventDefault and must not**: iOS
 * opens a link more reliably than a scripted navigation, which is why the handoff is an anchor at
 * all (src/outreach-view.js). That the refusal to intercept is the app's own is asserted below by
 * reading both modules, because a behavioural check cannot tell "the app did not prevent it" from
 * "the harness prevented it first".
 *
 * Nothing here launches a browser, a server or a document of its own: the entry file owns all three
 * and hands them over on `h`. `tools/README.md` § "Driving a browser over CDP" says where a new
 * check goes.
 */

export async function run(h) {
const { check, skip, send, evalJs, clickSel, KILL_ANIM, waitForBoot, seam } = h;

/*
 * ───────── the contact log and the history over it (WO-5.4) ─────────
 *
 * THREE STUDENTS, AND THE SECOND AND THIRD EACH EXIST FOR ONE SENTENCE:
 *
 *   Ada   one guardian with an address, three pieces of work marked missing and two halves of a
 *         hundred — 43.5%, which is under the 65% line — so she trips `grade-below` AND
 *         `missing-count`. She is the whole of Acceptance line 2: a contact about the rule the
 *         draft spoke from silences that rule and leaves the other one on the list.
 *   Ben   on the roster, nothing scored, nothing written and nobody written to. His card's empty
 *         sentence is what Ada's card under a projector is compared against, character for
 *         character — if the two ever differ, the count has arrived by wording instead of by
 *         number (Acceptance line 5).
 *   Cara  Ben plus one guardian with an address, added by WO-5.9 for the one branch of
 *         recordHandoff() nothing had ever driven: a draft for a student NO RULE HAS FIRED FOR,
 *         which writes `ruleId: ''` and must silence nothing. She is a third student rather than
 *         Ben himself because writing a contact for him populates the history his own sentence is
 *         measured on; the block at the foot of this file says so at the point of departure.
 *
 * THE CLASS HAS NO ATTENDANCE RECORDS AT ALL, deliberately, and `cooldown-quiet.mjs` gives the
 * reason: with meetings on the ledger the praise `attendance-window` rule fires at 100% for anyone
 * never marked absent, and the concern row this section opens its draft from would be sharing the
 * card with a praise row nobody planned.
 */
console.log('\n--- the contact log and the history over it (WO-5.4) ---');
if (!seam) {
  skip('the contact log (WO-5.4)', 'window.planbook is not on the page, so nothing here can seed a '
    + 'roster, press a handoff, read what the history drew, or put the document back');
} else {
  const CLS = 'c_wo54';
  const TERM = 'tm_wo54';
  /* CARA IS WO-5.9's AND SHE KEEPS THE `s_wo54` PREFIX ON PURPOSE: the cleanup at the foot of this
     section sweeps students, scores and log entries by that prefix, so a third student named for
     the work order that added her would have to be swept by a second rule that nobody would
     remember to write. The block that uses her says why she is a third student and not Ben. */
  const ADA = 's_wo54ada', BEN = 's_wo54ben', CARA = 's_wo54cara';
  const CLASS_NAME = 'WO-5.4 Contact log';
  const TEACHER = 'Wo54Teacher Name';
  const TEACHER_EMAIL = 'wo54teacher@example.invalid';
  const G1_EMAIL = 'wo54guardian@example.invalid';
  const G2_EMAIL = 'wo59guardian@example.invalid';
  /* Strings nothing else in this repository contains, so "is this on the page" is a search over
     everything that was rendered rather than an inspection of the fields somebody remembered to
     look at — WO-6.3's technique, borrowed here as the two sections above it borrow it. */
  const SUBJECT_MARK = 'Wo54SubjectLine';
  const BODY_MARK = 'Wo54BodyParagraph';
  const SECOND_SUBJECT = 'Wo54SecondSubjectLine';

  const onView = async () => await evalJs(
    "(function(){var e=document.querySelector('main > :not(.hidden)');return e?e.id:'';})()");
  async function goHome() {
    const already = await evalJs(`(function(){ var v = document.getElementById('homeView');
      return !!v && !v.classList.contains('hidden'); })()`);
    if (already) return;
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
  async function openSignals() {
    if ((await onView()) !== 'homeView') await goHome();
    await clickSel('#homeGrid [data-class-tab="' + CLS + '"]');
    await new Promise(r => setTimeout(r, 250));
    await clickSel('#classView [data-class-screen="signals"]');
    await new Promise(r => setTimeout(r, 400));
  }
  /* The one thing that makes pressing the handoff safe — see this file's head. The listener is the
     HARNESS's, it is installed for exactly one click, and `prevented` is reported so a reader can
     see which side stopped the navigation. */
  const PRESS = `var press = function(){
    var link = document.getElementById('outreachOpen');
    var stop = function(e){ e.preventDefault(); };
    window.addEventListener('click', stop, true);
    var had = link.hasAttribute('href');
    var ev = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
    var wentThrough = link.dispatchEvent(ev);
    window.removeEventListener('click', stop, true);
    return { had: had, prevented: !wentThrough, href: link.getAttribute('href') }; };`;

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
    var hadTeacher = JSON.stringify(d.teacher || {});
    var hadTemplates = JSON.stringify(d.templates || []);
    var today = window.planbook.attendance.todayISO();
    var back = function(n){ return window.planbook.calendar.shiftDays(today, -n); };

    s.update(function(doc){
      if (!Array.isArray(doc.classes)) doc.classes = [];
      if (!Array.isArray(doc.students)) doc.students = [];
      if (!Array.isArray(doc.assignments)) doc.assignments = [];
      if (!Array.isArray(doc.log)) doc.log = [];
      doc.teacher = { name:'${TEACHER}', school:'WO-5.4 School', email:'${TEACHER_EMAIL}',
        adminEmail:'', defaultCc:true };

      doc.students.push({ id:'${ADA}', first:'Ada', last:'Wo54Written', nickname:'',
        email:'', phone:'', phone2:'',
        guardians:[{ name:'Wo54Guardian One', relation:'Mother', email:'${G1_EMAIL}',
          phone:'', phone2:'', language:'en', preferred:true }],
        counselor:{ name:'', email:'' }, notes:'' });
      doc.students.push({ id:'${BEN}', first:'Ben', last:'Wo54Never', nickname:'',
        email:'', phone:'', phone2:'', guardians:[], counselor:{ name:'', email:'' }, notes:'' });
      /* THE THIRD STUDENT (WO-5.9): Ben plus one guardian with an address, and nothing else. The
         address is the only thing she has that he does not, because a draft with no addressable
         recipient never becomes ready and the handoff under test cannot be reached. Nothing scored,
         nothing marked and no attendance in the class at all, so no rule fires for her in either
         direction — which is the branch of recordHandoff() nobody has ever walked. */
      doc.students.push({ id:'${CARA}', first:'Cara', last:'Wo59Unflagged', nickname:'',
        email:'', phone:'', phone2:'',
        guardians:[{ name:'Wo59Guardian One', relation:'Mother', email:'${G2_EMAIL}',
          phone:'', phone2:'', language:'en', preferred:true }],
        counselor:{ name:'', email:'' }, notes:'' });

      doc.classes.push({ id:'${CLS}', name:'${CLASS_NAME}', archived:false,
        roster:['${ADA}','${BEN}','${CARA}'], letterScale:null,
        terms:[{ id:'${TERM}', label:'WO-5.4 Term', start:back(40),
          end:window.planbook.calendar.shiftDays(today, 40) }],
        categories:[{ id:'k_wo54', name:'All work', weight:100 }]});

      /* cooldown-quiet.mjs's recipe for a student who trips exactly two concern rules: three small
         pieces marked missing, two big ones at half marks. 43.5% is under the 65% line and three
         missing is the missing threshold, while only two scored cells means the run-of-low-scores
         rule cannot fire and her row is exactly two rules deep. */
      for (var n = 1; n <= 3; n++) {
        doc.assignments.push({ id:'a_wo54_s' + n, classId:'${CLS}', termId:'${TERM}',
          categoryId:'k_wo54', name:'WO-5.4 Warmup ' + n, points:10,
          assigned:back(30), due:back(25) });
      }
      for (var m = 1; m <= 2; m++) {
        doc.assignments.push({ id:'a_wo54_' + m, classId:'${CLS}', termId:'${TERM}',
          categoryId:'k_wo54', name:'WO-5.4 Task ' + m, points:100,
          assigned:back(30), due:back(20) });
      }
      if (!doc.scores || typeof doc.scores !== 'object') doc.scores = {};
      var put = function(id, sid, cell){
        doc.scores[id] = doc.scores[id] || {};
        doc.scores[id][sid] = cell; };
      for (var i = 1; i <= 3; i++) put('a_wo54_s' + i, '${ADA}', { v: null, flag: 'missing' });
      put('a_wo54_1', '${ADA}', { v: 50 });
      put('a_wo54_2', '${ADA}', { v: 50 });

      /* ONE TEMPLATE, WRITTEN THROUGH THE MODEL'S OWN WRITER so the record carries the six fields
         newTemplate() writes. Every merge field in it resolves against this fixture, because what
         is being driven here is the handoff and a blocked draft would never reach it. */
      doc.templates = [];
      window.planbook.templates.addTemplate(doc, {
        name:'WO-5.4 concern to a guardian', tone:'concern', audience:'guardian',
        subject:'${SUBJECT_MARK} \u2014 {{class.name}}',
        body:'Dear {{guardian.name}},\\n\\n${BODY_MARK} about {{student.first}}.\\n\\n'
          + '{{teacher.name}}' });
    });
    var now = s.getDoc();
    return { ok:true, hadTeacher:hadTeacher, hadTemplates:hadTemplates,
      students:(now.students || []).filter(function(p){
        return String(p.id).indexOf('s_wo54') === 0; }).length,
      templates:(now.templates || []).length,
      contacts:(now.log || []).filter(function(e){ return e.kind === 'contact'; }).length }; })()`);
  check('WO-5.4 fixture: one class, three students — one with a guardian who has an address, three '
    + 'pieces of work marked missing and a grade under the line, so she trips TWO concern rules; '
    + 'one with nothing at all, whose empty history is what a projected history is compared '
    + 'against; and one who is that second student plus an address, so a draft about her is ready '
    + 'and no rule has fired (WO-5.9) — and one guardian template every merge field of which '
    + 'resolves',
    !!plant && plant.ok === true && plant.students === 3 && plant.templates === 1
      && plant.contacts === 0,
    plant && plant.ok ? plant.students + ' student(s), ' + plant.templates + ' template(s), '
      + plant.contacts + ' contact(s) in the log to start with' : JSON.stringify(plant));

  if (!plant || !plant.ok) {
    skip('the whole of WO-5.4', 'the fixture did not install, so nothing below it could be handed '
      + 'over, logged, suppressed or read back');
  } else {
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 600));
    await waitForBoot();
    await evalJs(KILL_ANIM);
    await openSignals();

    /* ── the history before there is any ── */
    await clickSel('#signalsList [data-signal-row]');
    await new Promise(r => setTimeout(r, 300));
    const before = await evalJs(`(async function(){
      await window.planbook.store.flush();
      var body = document.getElementById('signalCardBody');
      var box = document.getElementById('signalCardContacts');
      var labels = Array.prototype.map.call(body.querySelectorAll('.modal-section-label'),
        function(e){ return e.textContent; });
      var kids = Array.prototype.slice.call(body.children);
      var target = window.planbook.signalsView.openCardTarget();
      var hits = (target && target.hits) || [];
      var concern = window.planbook.signals.orderHits(hits.filter(function(x){
        return x.direction === 'concern'; }));
      return { there: !!box,
        student: box ? box.getAttribute('data-contact-history') : '',
        labels: labels,
        /* The section's position in the card, read as an index over the card's own children, so
           "above the actions" is a fact about the DOM rather than about the order of two calls. */
        atSection: box ? kids.indexOf(box) : -1,
        atActions: kids.indexOf(body.querySelector('.sig-card-acts')),
        rows: box ? box.querySelectorAll('.log-entry').length : -1,
        empty: box ? (box.querySelector('.attendance-report-empty') || {}).textContent || '' : '',
        rev: window.planbook.store.getDoc().rev,
        hits: hits.map(function(x){ return x.direction + ':' + x.ruleId; }),
        concern: concern.map(function(x){ return x.ruleId; }),
        led: concern.length ? concern[0].ruleId : '',
        other: concern.length > 1 ? concern[1].ruleId : '' }; })()`);
    check('the signal card carries a contact history, above the actions rather than under them, and '
      + 'it is drawn EMPTY for a student nobody has written to — a missing block would read as '
      + '"this build does not show that" rather than as "none"',
      before.there === true && before.student === ADA && before.rows === 0
        && before.atSection > 0 && before.atActions > before.atSection
        && before.labels.indexOf('Who you have written to') >= 0
        && /Nothing to show here yet/.test(before.empty)
        /* TWO CONCERN RULES AND NOT TWO HITS. This fixture's Ada also climbs — her two halves of a
           hundred come after three zeros, so `grade-rose` fires as well — and that is fine and even
           useful: the row the draft is opened from is the concern one, and the praise hit riding
           beside it is what makes "the silenced rule is the one the draft spoke from" a claim with
           something to be wrong about. What this section needs is exactly two CONCERN rules. */
        && before.concern.length === 2 && before.led !== before.other,
      'the card drew ' + JSON.stringify(before.labels) + '; her hits are '
        + JSON.stringify(before.hits) + ', the concern list leads on ' + before.led);

    /* ── the handoff ── */
    await clickSel('#signalCardModal [data-signal-card-draft]');
    await new Promise(r => setTimeout(r, 350));
    const handoff = await evalJs(`(async function(){
      ${PRESS}
      var m = window.planbook.outreachView.outreachModel();
      var subjectField = document.getElementById('outreachSubject').value;
      var bodyField = document.getElementById('outreachBody').value;
      var pressed = press();
      await window.planbook.store.flush();
      var d = window.planbook.store.getDoc();
      var mine = (d.log || []).filter(function(e){
        return String(e.studentId).indexOf('s_wo54') === 0; });
      return { ready: m.ready, tone: m.tone, audience: m.audience,
        pressed: pressed, subjectField: subjectField, bodyField: bodyField,
        rev: d.rev, entries: mine.length,
        entry: mine[0] || null, keys: mine[0] ? Object.keys(mine[0]) : [],
        status: document.getElementById('outreachStatus').textContent,
        stillOpen: !document.getElementById('outreachModal').classList.contains('hidden') }; })()`);
    check('pressing the handoff appends exactly ONE entry, and it is the record docs/data-model.md '
      + '§ log documents — the eight fields in order, `kind: "contact"`, the AUDIENCE the template '
      + 'was filed under, and a local `at` stamp carrying its offset rather than a Z',
      handoff.ready === true && handoff.pressed.had === true && handoff.entries === 1
        && !!handoff.entry && handoff.entry.kind === 'contact'
        && handoff.entry.studentId === ADA && handoff.entry.audience === 'guardian'
        && JSON.stringify(handoff.keys) === JSON.stringify(
          ['id', 'studentId', 'at', 'kind', 'audience', 'subject', 'body', 'ruleId'])
        && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(handoff.entry.at)
        && handoff.rev > before.rev,
      handoff.entries + ' entr(y/ies) written, rev ' + before.rev + ' → ' + handoff.rev
        + ', keys ' + JSON.stringify(handoff.keys)
        + ', at ' + JSON.stringify(handoff.entry && handoff.entry.at));
    check('what it logged is what was handed over: the subject and the body byte for byte out of '
      + 'the two boxes the teacher was looking at, and `ruleId` carrying the engine’s own id for '
      + 'the signal the DRAFT SPOKE FROM — the leading concern hit on the row she tapped, with no '
      + 'mapping and no second vocabulary',
      !!handoff.entry && handoff.entry.subject === handoff.subjectField
        && handoff.entry.body === handoff.bodyField
        && handoff.entry.subject.indexOf(SUBJECT_MARK) === 0
        && handoff.entry.body.indexOf(BODY_MARK) > 0
        && handoff.entry.body.indexOf('{{') === -1
        && handoff.entry.ruleId === before.led && handoff.entry.ruleId !== before.other
        && /Handed to your mail app and logged/.test(handoff.status)
        && /cannot tell whether you send it/.test(handoff.status),
      'logged ruleId ' + JSON.stringify(handoff.entry && handoff.entry.ruleId)
        + ' against the row’s leading concern rule ' + JSON.stringify(before.led)
        + ' and her other rule ' + JSON.stringify(before.other)
        + '; subject matched the box = '
        + String(!!handoff.entry && handoff.entry.subject === handoff.subjectField));

    /*
      AND THE NAVIGATION IS STILL THE BROWSER'S. `prevented` is TRUE above and that is the harness's
      own capture listener, installed for one click and removed after it — see this file's head. So
      the behavioural half cannot answer the question the Traps line actually asks, and the source
      is read instead: no preventDefault anywhere in the handoff's own block in src/shell.js, and
      none anywhere in src/outreach-view.js at all. A build that intercepted the click would log the
      contact and never open the mail app, on the one device that decides go-live.
    */
    const noIntercept = await evalJs(`(async function(){
      /* COMMENTS COME OFF FIRST, and this is the second time in this repository that a prose
         mention has read as code: src/outreach-view.js's header SAYS in as many words that nothing
         calls preventDefault on the handoff, and a flat search over the file found its own promise
         and called it a violation. tools/wo-sweep.mjs § 11 strips comments for the same reason.
         It is a scan and not a regular expression on purpose: this string is a template literal on
         its way to the page, and a comment pattern written with escapes arrives with the escapes
         eaten and the pattern reading as a comment of its own. Block comments only, which is what
         this repository writes and where both of these words appear. */
      var strip = function(t){
        var out = '', i = 0;
        while (i < t.length) {
          var a = t.indexOf('/' + '*', i);
          if (a < 0) { out += t.slice(i); break; }
          out += t.slice(i, a);
          var b = t.indexOf('*' + '/', a + 2);
          if (b < 0) break;
          i = b + 2;
        }
        return out; };
      var shell = strip(await (await fetch('/src/shell.js')).text());
      var view = strip(await (await fetch('/src/outreach-view.js')).text());
      var at = shell.indexOf("closest('[data-outreach-handoff]')");
      var block = at < 0 ? '' : shell.slice(at, at + 400);
      return { found: at >= 0, blockHasPrevent: block.indexOf('preventDefault') >= 0,
        viewHasPrevent: view.indexOf('preventDefault') >= 0,
        blockHasLocation: block.indexOf('location') >= 0,
        viewHasLocation: view.indexOf('window.location') >= 0 }; })()`);
    check('and the app does not intercept the link: the handoff hook in src/shell.js calls no '
      + 'preventDefault and assigns no location, and src/outreach-view.js contains neither anywhere '
      + '— the write rides the click and the browser still follows the `mailto:`. The click above '
      + 'was stopped by a listener this harness installed and removed, because following one hands '
      + 'the page to the operating system',
      noIntercept.found === true && noIntercept.blockHasPrevent === false
        && noIntercept.viewHasPrevent === false && noIntercept.blockHasLocation === false
        && noIntercept.viewHasLocation === false && handoff.pressed.prevented === true,
      'the hook was found = ' + noIntercept.found + '; preventDefault in the block = '
        + noIntercept.blockHasPrevent + ', in the modal module = ' + noIntercept.viewHasPrevent
        + '; the harness prevented the navigation = ' + handoff.pressed.prevented);

    /* ── ACCEPTANCE LINE 1 ── */
    const appeared = await evalJs(`(function(){
      var box = document.getElementById('signalCardContacts');
      var rows = Array.prototype.map.call(box.querySelectorAll('.log-entry'), function(r){
        return { kind: (r.querySelector('.log-entry-kind') || {}).textContent || '',
          subject: (r.querySelector('.log-entry-subject') || {}).textContent || '',
          when: (r.querySelector('.log-entry-when') || {}).textContent || '',
          why: (r.querySelector('.log-entry-body') || {}).textContent || '' }; });
      return { rows: rows, empty: !!box.querySelector('.attendance-report-empty'),
        cardStillOpen:
          !document.getElementById('signalCardModal').classList.contains('hidden') }; })()`);
    check('the contact is in the history IMMEDIATELY — on the card the draft was opened from, with '
      + 'no reload and without the card being rebuilt around it (Acceptance line 1). One row: the '
      + 'audience it went to, the subject, the day, and the rule that prompted it',
      appeared.rows.length === 1 && appeared.empty === false
        && appeared.cardStillOpen === true
        && appeared.rows[0].kind === 'Guardian'
        && appeared.rows[0].subject.indexOf(SUBJECT_MARK) === 0
        && appeared.rows[0].when.length > 0 && appeared.rows[0].why.length > 0,
      JSON.stringify(appeared.rows));

    /* ── ACCEPTANCE LINE 2 ── */
    await evalJs(`(function(){
      document.querySelectorAll('.modal-overlay:not(.hidden) [data-modal-close]').forEach(
        function(b){ b.click(); });
      return 1; })()`);
    await new Promise(r => setTimeout(r, 300));
    const cooled = await evalJs(`(function(){
      var m = window.planbook.signalsView.signalsModel();
      var mine = m.all.filter(function(r){ return r.studentId === '${ADA}'; })[0] || null;
      /* A SUPPRESSED ROW CARRIES ITS STUDENT ON THE HIT, not on the row: src/signals-view.js builds
         it out of the cooldown's hit-plus-dates object and adds a key, a class and a name to it.
         Reading r.studentId here found undefined, matched nothing, and reported the feature broken
         while the foot beside it said 1. (No backticks in here; it is inside a template literal and
         one would close it.) */
      var held = m.concern.suppressed.filter(function(r){
        return r.hit.studentId === '${ADA}'; })[0] || null;
      var list = document.getElementById('signalsList');
      var foot = document.getElementById('signalsConcernHidden');
      var today = window.planbook.attendance.todayISO();
      return { row: mine ? mine.hits.map(function(x){ return x.ruleId; }) : null,
        concern: mine ? mine.hits.filter(function(x){ return x.direction === 'concern'; })
          .map(function(x){ return x.ruleId; }) : [],
        held: held ? { ruleId: held.hit.ruleId, on: held.on, audience: held.audience,
          until: held.until, days: held.days, span: held.span } : null,
        suppressed: m.concern.suppressed.length,
        rowsDrawn: list ? list.querySelectorAll('[data-signal-row]').length : -1,
        footText: foot ? (foot.textContent || '').replace(/\\s+/g, ' ') : '',
        footShown: !!foot && !foot.classList.contains('hidden'),
        today: today, backOn: window.planbook.calendar.shiftDays(today, 14) }; })()`);
    check('the cooldown reads the id that was logged, and suppression FOLLOWS from the handoff '
      + 'alone: the rule the message was about is silenced and the OTHER rule she trips is still on '
      + 'the list, on the same student, off one click (Acceptance line 2). Keyed on the student '
      + 'alone she would have vanished from the screen',
      !!cooled.held && cooled.held.ruleId === before.led
        && !!cooled.row && cooled.row.indexOf(before.led) === -1
        && cooled.row.indexOf(before.other) >= 0
        && cooled.concern.length === 1 && cooled.concern[0] === before.other
        && cooled.suppressed === 1 && cooled.rowsDrawn === 1,
      'her row now holds ' + JSON.stringify(cooled.row) + ' and the cooldown is holding '
        + JSON.stringify(cooled.held && cooled.held.ruleId) + '; '
        + cooled.suppressed + ' suppressed, ' + cooled.rowsDrawn + ' row(s) drawn');
    check('and the suppressed row is COUNTED and says which contact silenced it — the audience out '
      + 'of the entry, the day it went, and the day she comes back, which is the contact’s own date '
      + 'plus the whole fourteen-day span',
      !!cooled.held && cooled.held.on === cooled.today && cooled.held.days === 0
        && cooled.held.audience === 'guardian' && cooled.held.span === 14
        && cooled.held.until === cooled.backOn && cooled.footShown === true
        && /^1 you wrote about recently/.test(cooled.footText),
      JSON.stringify(cooled.held) + ' :: the foot reads ' + JSON.stringify(cooled.footText));

    /* ── the card on the student record ── */
    await goHome();
    await clickSel('#homeGrid [data-class-tab="' + CLS + '"]');
    await new Promise(r => setTimeout(r, 300));
    /* THE REGISTER SEGMENT BY NAME, not whichever screen the class opens on: `openClassScreen` is
       a remembered preference and this section was last standing on the signals list, so the row
       carrying the door would not be drawn. */
    await clickSel('#classView [data-class-screen="class"]');
    await new Promise(r => setTimeout(r, 300));
    await clickSel('#classView [data-student-detail="' + ADA + '"]');
    await new Promise(r => setTimeout(r, 350));
    const card = await evalJs(`(function(){
      var v = document.getElementById('detailView');
      var card = v.querySelector('[data-contact-card]');
      if (!card) return { ok:false, why:'no contact card on the student record' };
      var titles = Array.prototype.map.call(v.querySelectorAll('.detail-card-title'),
        function(e){ return e.textContent; });
      var d = window.planbook.store.getDoc();
      var entry = (d.log || []).filter(function(e){ return e.kind === 'contact'; })[0];
      return { ok:true, view: (document.querySelector('main > :not(.hidden)') || {}).id || '',
        titles: titles,
        title: (card.querySelector('.detail-card-title') || {}).textContent || '',
        rows: card.querySelectorAll('.log-entry').length,
        kinds: Array.prototype.map.call(card.querySelectorAll('.log-entry-kind'),
          function(e){ return e.textContent; }),
        subs: Array.prototype.map.call(card.querySelectorAll('.log-entry-subject'),
          function(e){ return e.textContent; }),
        note: (card.querySelector('.detail-card-note') || {}).textContent || '',
        controls: card.querySelectorAll('button, a, input, select, textarea').length,
        cardText: (card.textContent || '').replace(/\\s+/g, ' '),
        bodyInRecord: (entry && entry.body || '').indexOf('${BODY_MARK}') > 0,
        pageNote: (v.querySelector('.detail-note') || {}).textContent || '',
        modalCopy: (document.getElementById('outreachModal').textContent || '')
          .replace(/\\s+/g, ' ') }; })()`);
    check('the contact history is on the student record too, as the last card in the column, next '
      + 'to what she wrote down rather than inside it — and it adds NO control: this work order '
      + 'puts no button, link or field on any screen, which is why it declares no 44px rule',
      card.ok === true && card.view === 'detailView' && card.rows === 1
        && card.title === 'Who you have written to'
        && card.titles[card.titles.length - 1] === 'Who you have written to'
        && card.titles[card.titles.length - 2] === 'What you have written down'
        && card.controls === 0 && card.kinds[0] === 'Guardian'
        && card.subs[0].indexOf(SUBJECT_MARK) === 0,
      card.ok ? 'the cards down the column are ' + JSON.stringify(card.titles) + '; the card drew '
        + card.rows + ' row(s) and ' + card.controls + ' control(s)' : card.why);
    check('the UI is honest about what "logged" means, in both places it can be read (Acceptance '
      + 'line 4): the note under the card says Planbook records the HANDOFF and cannot tell whether '
      + 'it was sent, and says entries are never edited or deleted — and the send flow says the '
      + 'same thing beside the button that does it',
      /cannot tell whether you sent it/i.test(card.note)
        && /never edited or deleted/i.test(card.note)
        && /not\s+proof of delivery/i.test(card.note)
        && /cannot tell whether you sent it/i.test(card.modalCopy)
        && /not that it was\s+delivered|not that it was delivered/i.test(card.modalCopy),
      JSON.stringify(card.note));
    check('and the BODY of the message is in the record and not on the card — the whole email is '
      + 'kept, backed up and readable by the cooldown, while the card prints one line per contact, '
      + 'because a card holding four full emails beside a guardian is a card nobody reads',
      card.bodyInRecord === true && card.cardText.indexOf(BODY_MARK) === -1
        && card.cardText.indexOf(SUBJECT_MARK) >= 0,
      'the body is in the record = ' + card.bodyInRecord + ', and on the card = '
        + (card.cardText.indexOf(BODY_MARK) >= 0));

    /* ── ACCEPTANCE LINE 3 ── */
    const first = handoff.entry;
    await evalJs(`(function(){
      document.querySelector('#detailActions [data-outreach-draft]').click(); return 1; })()`);
    await new Promise(r => setTimeout(r, 350));
    const second = await evalJs(`(async function(){
      ${PRESS}
      var n = document.getElementById('outreachSubject');
      n.value = '${SECOND_SUBJECT}';
      n.dispatchEvent(new Event('input', { bubbles: true }));
      var pressed = press();
      await window.planbook.store.flush();
      var d = window.planbook.store.getDoc();
      var mine = (d.log || []).filter(function(e){
        return String(e.studentId).indexOf('s_wo54') === 0; });
      return { pressed: pressed, entries: mine.length, rev: d.rev,
        first: mine.filter(function(e){ return e.id === '${first && first.id}'; })[0] || null,
        subjects: mine.map(function(e){ return e.subject; }) }; })()`);
    check('a second handoff APPENDS: the first entry is still in the document byte for byte, the '
      + 'second sits beside it, and nothing was edited or removed (Acceptance line 3). Two messages '
      + 'handed over are two facts, and there is no writer in src/log.js that could do otherwise',
      second.entries === 2 && !!second.first
        && JSON.stringify(second.first) === JSON.stringify(first)
        && second.subjects.filter((s) => s === SECOND_SUBJECT).length === 1,
      'the log went ' + handoff.entries + ' → ' + second.entries + '; the first entry still reads '
        + JSON.stringify(second.first) + ' against ' + JSON.stringify(first));

    /* ── a blocked draft writes nothing ── */
    const blocked = await evalJs(`(async function(){
      ${PRESS}
      var b = document.getElementById('outreachBody');
      b.value = 'Wo54Blocked {{wo54nosuchfield}}';
      b.dispatchEvent(new Event('input', { bubbles: true }));
      var m = window.planbook.outreachView.outreachModel();
      var link = document.getElementById('outreachOpen');
      var pressed = press();
      await window.planbook.store.flush();
      var d = window.planbook.store.getDoc();
      return { ready: m.ready, hasHref: pressed.had, href: pressed.href,
        ariaDisabled: link.getAttribute('aria-disabled'),
        entries: (d.log || []).filter(function(e){
          return String(e.studentId).indexOf('s_wo54') === 0; }).length,
        rev: d.rev }; })()`);
    check('a BLOCKED draft writes nothing when the same gesture is made on it — the anchor has no '
      + '`href`, so it is not a link at all, and the writer asks the model as well rather than '
      + 'trusting the element it was clicked on. The log is the length it was and `rev` has not '
      + 'moved',
      blocked.ready === false && blocked.hasHref === false && blocked.href === null
        && blocked.ariaDisabled === 'true' && blocked.entries === 2
        && blocked.rev === second.rev,
      'ready ' + blocked.ready + ', href ' + JSON.stringify(blocked.href) + ', the log holds '
        + blocked.entries + ' entr(ies), rev ' + second.rev + ' → ' + blocked.rev);

    /* ── ACCEPTANCE LINE 5 ── */
    await evalJs(`(function(){
      document.querySelectorAll('.modal-overlay:not(.hidden) [data-modal-close]').forEach(
        function(b){ b.click(); });
      return 1; })()`);
    await new Promise(r => setTimeout(r, 250));
    const projected = await evalJs(`(function(){
      var s = window.planbook.supports;
      var d = window.planbook.store.getDoc();
      var ch = window.planbook.contactHistory;
      /* Ben's card, with the mode OFF — the sentence a student nobody has written to gets. */
      var benOff = ch.studentContactCard('${BEN}').textContent.replace(/\\s+/g, ' ');
      s.setPresentationMode(true);
      window.planbook.detail.renderDetail();
      var v = document.getElementById('detailView');
      var card = v.querySelector('[data-contact-card]');
      /* Both surfaces, built with the mode ON — the card is on screen and the section is asked for
         directly, because with the projector on the signals screen refuses outright and there is no
         card to open to find out whether the refusal is real. */
      var section = ch.signalContactSection('${ADA}').textContent.replace(/\\s+/g, ' ');
      var adaOn = card ? card.textContent.replace(/\\s+/g, ' ') : '';
      /* WHERE THE WORDS ARE, RATHER THAN WHETHER THEY ARE ANYWHERE AT ALL. Searching
         document.body.innerHTML answers a question nobody asked: the signal card is a CLOSED modal
         and it still holds whatever it last drew, which has been true of that panel since WO-4.2 —
         the student name, her grade and every rule explanation sit in it too. So every container is
         asked separately and reported with whether it is on screen, and what this check refuses is
         the mark surviving anywhere a projector could show it. (No backticks in here; it is inside
         a template literal and one would close it.) */
      var marks = ['${SUBJECT_MARK}', '${SECOND_SUBJECT}', '${BODY_MARK}', '${G1_EMAIL}'];
      /* WHICH mark, not merely whether one — a check that says only "something leaked" sends its
         reader back to the browser to find out what. */
      var found = function(el){
        var html = el ? (el.innerHTML || '') : '';
        return marks.filter(function(m){ return html.indexOf(m) >= 0; }); };
      var has = function(el){ return found(el).length > 0; };
      var showing = [], hiddenHolders = [];
      Array.prototype.forEach.call(
        document.querySelectorAll('main > *, .modal-overlay'), function(el){
          if (!has(el)) return;
          var name = el.id || el.className;
          (el.classList.contains('hidden') ? hiddenHolders : showing).push(name); });
      /* TAKEN WHILE THE MODE IS ON, and that is not a formality: an object literal in the return
         below is evaluated after the two lines that turn the projector off and re-render, so a
         reading written there is a reading of the screen with the contacts legitimately back on it.
         This check failed exactly that way once and reported a leak that was its own timing. */
      var mainMarks = found(document.querySelector('main'));
      var detailMarks = found(document.getElementById('detailView'));
      var handed = window.planbook.log.visibleContactsFor(d, '${ADA}').length;
      s.setPresentationMode(false);
      window.planbook.detail.renderDetail();
      var handedOff = window.planbook.log.visibleContactsFor(d, '${ADA}').length;
      return { card: !!card, rows: card ? card.querySelectorAll('.log-entry').length : -1,
        adaOn: adaOn, benOff: benOff, section: section,
        showing: showing, hiddenHolders: hiddenHolders,
        mainMarks: mainMarks, detailMarks: detailMarks,
        mainShown: mainMarks.length > 0, detailHas: detailMarks.length > 0,
        handed: handed, handedOff: handedOff,
        inDoc: (d.log || []).filter(function(e){ return e.kind === 'contact'; }).length }; })()`);
    check('under a projector the contact history is ABSENT rather than redacted (Acceptance line '
      + '5): the card is still drawn and its rows are not, no subject, body or guardian address '
      + 'is in any container a projector can show, and the model hands back nothing of the two '
      + 'contacts that are in the document — both surfaces, because the section on the signal card '
      + 'reads the same reader and is asked for directly here, there being no card to open while '
      + 'the mode is on',
      projected.card === true && projected.rows === 0 && projected.handed === 0
        && projected.inDoc === 2 && projected.handedOff === 2
        && projected.showing.length === 0 && projected.mainShown === false
        && projected.detailHas === false
        && projected.section.indexOf(SUBJECT_MARK) === -1,
      'the model handed over ' + projected.handed + ' of ' + projected.inDoc
        + ' contacts with the mode on and ' + projected.handedOff + ' with it off; the card drew '
        + projected.rows + ' row(s); containers showing a mark: '
        + JSON.stringify(projected.showing) + '; marks left in <main> '
        + JSON.stringify(projected.mainMarks) + ' and in the student record '
        + JSON.stringify(projected.detailMarks) + '; containers holding one behind .hidden: '
        + JSON.stringify(projected.hiddenHolders));
    check('and the empty sentence is the SAME SENTENCE either way — a student whose every contact '
      + 'is suppressed reads exactly like a student nobody has ever written to, because any wording '
      + 'that could tell them apart is the count arriving by another route. There is no "N hidden" '
      + 'line anywhere on either surface',
      projected.adaOn === projected.benOff && projected.adaOn.length > 0
        && /\d+ hidden|\d+ more|\d+ suppressed/i.test(projected.adaOn) === false,
      'projected: ' + JSON.stringify(projected.adaOn.slice(0, 120)) + '\n      empty:     '
        + JSON.stringify(projected.benOff.slice(0, 120)));

    /*
      AND THE READ SURFACE CANNOT WRITE, ASKED OF THE FILE RATHER THAN DRIVEN — tools/wo-sweep.mjs
      § 17's posture over src/calendar-derived.js, for its reason: driving proves what today's paths
      did, and a grep proves there is nothing in the file that could do otherwise on any input.
      Two claims, and the second is the one this repo keeps having to re-make: there is exactly one
      asker of the presentation-mode rule and this file is not it.
    */
    const readOnly = await evalJs(`(async function(){
      var text = await (await fetch('/src/contact-history.js')).text();
      var code = text.replace(/\\/\\*[\\s\\S]*?\\*\\//g, '\\n').replace(/^\\s*\\/\\/.*$/gm, '');
      var log = await (await fetch('/src/log.js')).text();
      return { update: /[^A-Za-z]update\\s*\\(/.test(code), push: code.indexOf('.push(') >= 0,
        splice: code.indexOf('.splice(') >= 0,
        presentation: code.indexOf('presentationMode') >= 0,
        imports: (code.match(/^import[\\s\\S]*?;/gm) || []).join(' ').replace(/\\s+/g, ' '),
        unfilteredTwin: /export function contactsFor/.test(log) }; })()`);
    check('the history surface is a READER and could not write on any input: no update(), no push, '
      + 'no splice and no store mutation anywhere in src/contact-history.js — and no '
      + 'presentationMode() test either, because suppression arrives as a shorter list from '
      + 'src/log.js and two askers is two answers eventually. Nor is there an unfiltered '
      + '`contactsFor()` exported for a later screen to reach past the rule with',
      readOnly.update === false && readOnly.push === false && readOnly.splice === false
        && readOnly.presentation === false && readOnly.unfilteredTwin === false
        && /visibleContactsFor/.test(readOnly.imports),
      'its imports are ' + JSON.stringify(readOnly.imports.slice(0, 200)));

    /* ── THE HITLESS DRAFT, DRIVEN (WO-5.9) ──

       `recordHandoff()` writes `ruleId: hit ? hit.ruleId : ''`, and nothing above this line has
       ever walked the false branch: both contacts pressed so far are Ada's, and Ada trips two
       concern rules, so `hit` is truthy every time it is read. The consequence of an empty id is
       proved in `cooldown-quiet.mjs` — but off a record that fixture hand-writes, so the READER is
       proved to tolerate absence and the WRITER has never been proved to produce it. These two
       checks introduce the halves to each other, on a record the app itself wrote.

       A THIRD STUDENT RATHER THAN BEN, which is the choice this section's Traps line leaves open.
       Ben's whole job is the empty sentence the check above compares Ada's projected card against
       character for character, and a contact written for him populates his history and reddens that
       check for a reason that looks nothing like the reason. Cara is Ben plus one guardian with an
       address — the only thing a draft needs to become ready — so no rule fires for her in either
       direction and Ben's sentence is still nobody's but his.

       AND IT RUNS LAST ANYWAY, for a second reason the Traps line does not name: three checks above
       count contacts rather than name them — the blocked draft's `entries === 2`, the projector's
       `inDoc === 2` — so a contact written earlier would move numbers that belong to other claims.
       Written here it moves nothing above it, and the cleanup below takes it off with the rest,
       because her id carries the same `s_wo54` prefix every one of those filters is written on.

       THE DOOR IS THE STUDENT RECORD'S, AND IT IS DRIVEN RATHER THAN ASKED. No rule fired, so there
       is no signal card to open: the record's door is the only way in and is itself the thing under
       test. It threw a ReferenceError once (`TESTING.md` § WO-5.3), which a check that called
       openOutreach() through the seam would have walked straight past. */
    await evalJs(`(function(){
      document.querySelectorAll('.modal-overlay:not(.hidden) [data-modal-close]').forEach(
        function(b){ b.click(); });
      return 1; })()`);
    await new Promise(r => setTimeout(r, 200));
    if ((await onView()) !== 'homeView') await goHome();
    await clickSel('#homeGrid [data-class-tab="' + CLS + '"]');
    await new Promise(r => setTimeout(r, 300));
    /* The register segment by name, exactly as the block above does it and for its reason:
       `openClassScreen` is a remembered preference and the row carrying the door is only there. */
    await clickSel('#classView [data-class-screen="class"]');
    await new Promise(r => setTimeout(r, 300));
    await clickSel('#classView [data-student-detail="' + CARA + '"]');
    await new Promise(r => setTimeout(r, 350));
    await evalJs(`(function(){
      document.querySelector('#detailActions [data-outreach-draft]').click(); return 1; })()`);
    await new Promise(r => setTimeout(r, 350));
    const hitless = await evalJs(`(async function(){
      ${PRESS}
      var s = window.planbook.store, v = window.planbook.signalsView;
      var cls = window.planbook.classes.getSelectedClass();
      var termId = (window.planbook.classes.getSelectedTerm() || {}).id || '';
      var rev0 = s.getDoc().rev;
      /* THE PREMISE, MEASURED RATHER THAN ASSUMED. A rule that started firing for a student planted
         to trip none would make every claim under it vacuous and leave the check green, so the
         engine is asked for her hits and the answer is printed either way — WO-1.33's lesson, where
         the "fires no rules" student turned out to fire two. */
      var fired = window.planbook.signals.evaluate(s.getDoc(), cls, termId)
        .filter(function(h){ return h.studentId === '${CARA}'; })
        .map(function(h){ return h.direction + ':' + h.ruleId; });
      var hers = function(m){ return m.all.filter(function(r){
        return r.studentId === '${CARA}'; }).length; };
      var hersHeld = function(m){ return m.concern.suppressed.filter(function(r){
        return r.hit.studentId === '${CARA}'; }).length; };
      var shape = function(m){ return { rows: m.all.length, drawn: m.concern.rows.length,
        held: m.concern.suppressed.length, hers: hers(m), hersHeld: hersHeld(m) }; };
      var before = shape(v.signalsModel());
      var model = window.planbook.outreachView.outreachModel();
      /* A MARK ON THE WINDOW, AND IT IS THE WHOLE OF "WITHOUT A RELOAD" IN THE CHECK AFTER THIS
         ONE. A document that went away and came back carries no property somebody set on it, and
         nothing else here can tell a repaint from a reload — both leave one correct row on the
         card. (No backticks in here; it is inside a template literal and one would close it.) */
      window.__wo59NoReload = 'wo59';
      var pressed = press();
      await s.flush();
      var d = s.getDoc();
      var mine = (d.log || []).filter(function(e){ return e.studentId === '${CARA}'; });
      var entry = mine[0] || null;
      /* THE LOOP CLOSED ON THE APP'S OWN RECORD, and it is asked with the entry's OWN ruleId
         rather than with a string this file chose: an invented id is then handed straight back to
         the function that would silence a rule with it, where a probe for the empty string could
         only re-prove what cooldown-quiet.mjs already proves against a planted record. (No
         backticks in here; it is inside a template literal and one would close it.) */
      var reader = entry
        ? window.planbook.log.lastContactAbout(d, '${CARA}', entry.ruleId,
          window.planbook.attendance.todayISO())
        : 'there was no entry to ask about';
      return { fired: fired, tone: model.tone, ready: model.ready, audience: model.audience,
        pressed: pressed, entries: mine.length, entry: entry,
        hasRuleId: !!entry && Object.prototype.hasOwnProperty.call(entry, 'ruleId'),
        ruleIdType: entry ? typeof entry.ruleId : '',
        reader: reader, before: before, after: shape(v.signalsModel()),
        rev0: rev0, rev: d.rev }; })()`);
    check('a handoff for a student NO RULE HAS FIRED FOR appends exactly one entry, and its '
      + '`ruleId` is the EMPTY STRING — present, a string, and not invented (WO-5.9). The cooldown '
      + 'is then asked about the id the WRITER produced, on the record the APP wrote, and hands '
      + 'back nothing; the concern list is the same list either side of the write. Opened from the '
      + 'student record, because with no signal there is no card to open',
      hitless.fired.length === 0 && hitless.ready === true && hitless.tone === 'concern'
        && hitless.pressed.had === true && hitless.entries === 1 && !!hitless.entry
        && hitless.entry.kind === 'contact' && hitless.entry.studentId === CARA
        && hitless.entry.audience === 'guardian'
        && hitless.hasRuleId === true && hitless.ruleIdType === 'string'
        && hitless.entry.ruleId === '' && hitless.reader === null
        && hitless.before.hers === 0 && hitless.after.hers === 0
        && hitless.after.hersHeld === 0
        && hitless.after.rows === hitless.before.rows
        && hitless.after.drawn === hitless.before.drawn
        && hitless.after.held === hitless.before.held
        /* AND THE LIST IT SUPPRESSED NOTHING ON IS A LIST THAT SUPPRESSES: Ada's leading rule is
           being held back at this very moment, off the two handoffs above. A model holding nothing
           would satisfy every equality on this line and measure nothing at all. */
        && hitless.before.held > 0 && hitless.rev > hitless.rev0,
      'the engine fired ' + JSON.stringify(hitless.fired) + ' for her; ' + hitless.entries
        + ' entr(y/ies) written, ruleId ' + JSON.stringify(hitless.entry && hitless.entry.ruleId)
        + ' (' + hitless.ruleIdType + ', own property = ' + hitless.hasRuleId
        + '), the cooldown reader hands back ' + JSON.stringify(hitless.reader)
        + '; the concern list went ' + JSON.stringify(hitless.before) + ' → '
        + JSON.stringify(hitless.after) + ', rev ' + hitless.rev0 + ' → ' + hitless.rev);
    const onRecord = await evalJs(`(function(){
      var v = document.getElementById('detailView');
      var card = v.querySelector('[data-contact-card]');
      var rows = card ? Array.prototype.map.call(card.querySelectorAll('.log-entry'),
        function(r){ return { kind: (r.querySelector('.log-entry-kind') || {}).textContent || '',
          subject: (r.querySelector('.log-entry-subject') || {}).textContent || '',
          when: (r.querySelector('.log-entry-when') || {}).textContent || '' }; }) : [];
      return { view: (document.querySelector('main > :not(.hidden)') || {}).id || '',
        openFor: window.planbook.detail.openDetailStudentId(),
        card: !!card, rows: rows,
        empty: !!(card && card.querySelector('.attendance-report-empty')),
        stillOpen: !document.getElementById('outreachModal').classList.contains('hidden'),
        sameDocument: window.__wo59NoReload === 'wo59' }; })()`);
    check('and it is on the STUDENT RECORD immediately, with no reload — the other half of '
      + 'Acceptance line 1 (WO-5.9), which was asserted on the signal card and only REACHED on '
      + 'this screen. The page under the draft still carries a mark set before the press, which is '
      + 'what tells a repaint from a reload; the empty sentence is gone and one row stands where '
      + 'it was',
      onRecord.view === 'detailView' && onRecord.openFor === CARA && onRecord.card === true
        && onRecord.rows.length === 1 && onRecord.empty === false
        && onRecord.rows[0].kind === 'Guardian'
        && onRecord.rows[0].subject.indexOf(SUBJECT_MARK) === 0
        && onRecord.rows[0].when.length > 0
        && onRecord.sameDocument === true,
      JSON.stringify(onRecord.rows) + '; the record is open on ' + JSON.stringify(onRecord.openFor)
        + ', the draft is still up = ' + onRecord.stillOpen
        + ', and the window still carries the mark set before the press = '
        + onRecord.sameDocument);

    /* ── and the fixture comes back off ──
       OFF THE SCREEN FIRST, for the reason outreach.mjs and templates.mjs both give: the class
       being removed is the one the screen is drawn from, and a store update under an open view
       re-renders it. THE LOG IS PART OF THE FIXTURE HERE — this section is the only one that makes
       the app write a contact, so it is the only one with contacts to take back out. */
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
          return String(p.id).indexOf('s_wo54') !== 0; });
        doc.assignments = (doc.assignments || []).filter(function(a){
          return String(a.id).indexOf('a_wo54') !== 0; });
        doc.log = (doc.log || []).filter(function(e){
          return String(e.studentId).indexOf('s_wo54') !== 0; });
        doc.templates = JSON.parse(${JSON.stringify(plant.hadTemplates)});
        doc.teacher = JSON.parse(${JSON.stringify(plant.hadTeacher)});
        if (doc.scores) {
          Object.keys(doc.scores).forEach(function(k){
            if (k.indexOf('a_wo54') === 0) delete doc.scores[k]; });
        }
      });
      var d = s.getDoc();
      return { classes:(d.classes || []).filter(function(c){ return c.id === '${CLS}'; }).length,
        students:(d.students || []).filter(function(p){
          return String(p.id).indexOf('s_wo54') === 0; }).length,
        assignments:(d.assignments || []).filter(function(a){
          return String(a.id).indexOf('a_wo54') === 0; }).length,
        log:(d.log || []).filter(function(e){
          return String(e.studentId).indexOf('s_wo54') === 0; }).length,
        scores: Object.keys(d.scores || {}).filter(function(k){
          return k.indexOf('a_wo54') === 0; }).length,
        templates: JSON.stringify(d.templates || []),
        teacher: JSON.stringify(d.teacher || {}),
        mode: window.planbook.supports.presentationMode(),
        overlays: document.querySelectorAll('.modal-overlay:not(.hidden)').length }; })()`);
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
    check('the WO-5.4 fixture came back off the document — the class, all three students, five '
      + 'assignments, every score bag AND all three contacts this section made the app write; '
      + '`templates[]` and the teacher’s own details were put back exactly as they were found, '
      + 'presentation mode was left OFF, every modal is closed and the page was left on the grid',
      cleaned.classes === 0 && cleaned.students === 0 && cleaned.assignments === 0
        && cleaned.log === 0 && cleaned.scores === 0 && cleaned.overlays === 0
        && cleaned.templates === String(plant.hadTemplates)
        && cleaned.teacher === String(plant.hadTeacher) && cleaned.mode === false
        && (await onView()) === 'homeView',
      cleaned.classes + ' class(es), ' + cleaned.students + ' student(s), ' + cleaned.assignments
        + ' assignment(s), ' + cleaned.log + ' log entr(ies), ' + cleaned.scores
        + ' score bag(s) left behind; templates put back = '
        + String(cleaned.templates === String(plant.hadTemplates)) + ', teacher put back = '
        + String(cleaned.teacher === String(plant.hadTeacher)) + '; presentation mode = '
        + cleaned.mode);
  }
}
}
