/* glance-quiet.mjs — the glance page's stack, its readers, and the quiet day (WO-6.7)
 *
 * The first section over the glance page, and it is separate from `ungraded-count.mjs` and
 * `cooldown-quiet.mjs` — the two sections that already read the card's chips — for the reason those
 * two are separate from each other: the fixture is nothing like theirs. A quiet day needs a
 * document with NOTHING pending across every active class, which no earlier section's residue can
 * be trusted to leave behind, so this one puts every other class away for the length of its run and
 * builds the day it wants from one class of its own. Nothing here launches a browser, a server or a
 * document of its own: the entry file owns all three and hands them over on `h`. `tools/README.md`
 * § "Driving a browser over CDP" says where a new check goes.
 */

export async function run(h) {
const { check, skip, send, evalJs, clickSel, KILL_ANIM, waitForBoot, seam } = h;

/*
 * ───────── the glance page: the stack, the readers and the quiet day (WO-6.7) ─────────
 *
 * WHAT ONLY A BROWSER CAN SETTLE HERE. Three things. That the quiet panel is ONE panel and the other
 * four are ABSENT from the tree rather than hidden in it — a claim about what exists, which a
 * stylesheet review reads as identical either way. That the card's two chips and the readers'
 * lengths are ONE number, and move together when a student is cut — the whole of the Traps line,
 * and the one claim a build whose readers recomputed would pass on every quiet day and fail on the
 * first busy one. And that the door lands on the concern list SCROLLED to the quiet-middle panel,
 * with the same N on it — a claim about scroll geometry and focus that no model can answer.
 *
 * THE FIXTURE IS BUILT IN TWO STATES FROM ONE CLASS. Quiet first: four students, a dated term with
 * both edges far outside every window, no assignments, no attendance, no events — so every reader
 * answers [] and the quiet middle is all four. Then busy: two students each trip exactly ONE rule
 * (three missing marks over one scored task, so the whole graded history IS the four-assignment
 * window and the grade-rose rule has no `before` to fire from — the shape cooldown-quiet.mjs's Ben
 * and Cal do NOT have, which is why they carry two hits apiece and these two carry one), and two
 * assignments carry open cells, one of them open for ONE student only. That last arrangement is what makes "cutting a
 * student moves all three" a real test: taking Beth off the roster takes a hit, a `to grade` and a
 * `need you` with her, and a build that counted any of the three some other way keeps one of them.
 *
 * EVERY OTHER ACTIVE CLASS IS ARCHIVED FOR THE LENGTH OF THE SECTION, and every event and review
 * date the readers' windows would see is lifted out and put back afterwards at its own index. The
 * alternative — a quiet check that asserted "whatever is pending is pending" — is the vacuous pass
 * tools/README.md's two rules are about. The restore is asserted at the foot, flag by flag.
 */
console.log('\n--- the glance page: the stack, the readers and the quiet day (WO-6.7) ---');
if (!seam) {
  skip('the glance page: the stack, the readers and the quiet day (WO-6.7)', 'window.planbook is '
    + 'not on the page, so nothing here can put the other classes away, read a reader, or put the '
    + 'document back');
} else {
  const CLS = 'c_wo67';
  const TERM = 'tm_wo67';
  const ADA = 's_wo67ada', BETH = 's_wo67beth', CARA = 's_wo67cara', DREW = 's_wo67drew';
  /* Surnames nothing else in this repository contains, so "no student is named in what a reader
     hands back" is a search rather than an inspection of the fields somebody remembered to look at. */
  const ADA_N = 'Wo67Flagged', BETH_N = 'Wo67Cut', CARA_N = 'Wo67Quiet', DREW_N = 'Wo67Quieter';
  const CLASS_NAME = 'WO-6.7 Quiet';

  const onView67 = async () => await evalJs(
    "(function(){var e=document.querySelector('main > :not(.hidden)');return e?e.id:'';})()");
  async function goHome67() {
    /* Already there is not an error: the home view carries no visible [data-view-home] of its own. */
    if ((await onView67()) === 'homeView') return;
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
  /* The home screen redrawn from the document the way a teacher gets it redrawn — by arriving. A
     mutation through the seam repaints nothing on its own, exactly as typing into a dialog does
     not, so every state below is read after a walk off the grid and back onto it. */
  async function rehome67() {
    if ((await onView67()) === 'homeView') {
      await clickSel('#homeView [data-calendar-open]');
      await new Promise(r => setTimeout(r, 200));
    }
    await goHome67();
  }
  /* The page, as data and as DOM, in one read. */
  const PAGE = `(function(){
    var g = window.planbook.glance;
    var view = document.getElementById('homeView');
    var stack = document.getElementById('glanceStack');
    var quiet = document.getElementById('glanceQuiet');
    var door = quiet ? quiet.querySelector('[data-signals-open]') : null;
    var open = document.querySelector('#homeGrid [data-class-tab="${CLS}"]');
    var chips = open ? open.querySelectorAll('.class-card-signals .class-card-count') : [];
    var hits = g.attentionHits();
    var seen = {}; hits.forEach(function(x){ seen[x.studentId] = true; });
    return {
      view: (document.querySelector('main > :not(.hidden)') || {}).id || '',
      stackInView: !!stack && !!view && stack.parentNode === view,
      stackClass: stack ? stack.className : '',
      firstIsGrid: !!stack && !!stack.firstElementChild
        && stack.firstElementChild.classList.contains('panel')
        && !!stack.firstElementChild.querySelector('#homeGrid')
        && !!stack.firstElementChild.querySelector('#homeEmpty'),
      panels: view ? view.querySelectorAll('.panel').length : -1,
      named: view ? Array.prototype.map.call(view.querySelectorAll('[data-glance-panel]'),
        function(n){ return n.getAttribute('data-glance-panel'); }) : [],
      rows: view ? view.querySelectorAll('.gl-list, .gl-row, .gl-more, .gl-shut, .sig-two, .sig-col').length : -1,
      quiet: !!quiet,
      quietIsSecond: !!quiet && !!stack && stack.children[1] === quiet && stack.children.length === 2,
      lead: quiet ? (quiet.querySelector('.gl-quiet-lead') || {}).textContent : '',
      chips: quiet ? Array.prototype.map.call(quiet.querySelectorAll('.gl-quiet-chip'),
        function(n){ return n.textContent; }) : [],
      door: door ? { text: door.textContent, tag: door.tagName, type: door.type,
        cls: door.className, landing: door.getAttribute('data-signals-open') } : null,
      card: open ? Array.prototype.map.call(chips, function(n){ return n.textContent; }) : null,
      cardShape: open ? Array.prototype.map.call(open.children, function(n){ return String(n.className).split(' ')[0]; }) : null,
      state: open ? (open.querySelector('.class-card-state') || {}).textContent : '',
      week: g.weekItems().length, queue: g.queueRows().length, hits: hits.length,
      rules: hits.map(function(x){ return x.studentId.slice(-4) + ':' + x.ruleId; }).sort(),
      students: Object.keys(seen).length, closing: g.closingIn().length,
      quietRows: g.quietMiddleRows().length,
      closingKinds: g.closingIn().map(function(i){ return i.kind; }),
      closingText: JSON.stringify(g.closingIn()),
      queueOpen: g.queueRows().map(function(r){ return r.assignmentId + ':' + r.open; }).sort(),
    }; })()`;

  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  /* A SHORT VIEWPORT ON PURPOSE. The door's landing is a scroll, and a page that fits in the window
     has nothing to scroll — so the claim "scrolled to the quiet panel" would pass vacuously at 900px
     on a fixture this small. 600 is enough to put the concern list's foot below the fold. */
  await send('Emulation.setDeviceMetricsOverride',
    { width: 1280, height: 600, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  await waitForBoot();
  await evalJs(KILL_ANIM);

  /* ── the rest of the document, put away, and the quiet fixture planted ── */
  const plant67 = await evalJs(`(function(){
    var s = window.planbook.store, cal = window.planbook.calendar;
    var d = s.getDoc();
    if (!d) return { ok:false, why:'no year document is open' };
    var today = window.planbook.attendance.todayISO();
    var shift = function(n){ return cal.shiftDays(today, n); };
    var lead = cal.leadDaysOf(d);
    /* Everything either reader window can see: the week is six days on, the deadline window is the
       lead time, and an event is pulled if any day of its range touches the wider of the two. */
    var far = shift(Math.max(6, lead));
    var stash = { archived: [], events: [], reviews: [] };
    s.update(function(doc){
      if (!Array.isArray(doc.classes)) doc.classes = [];
      if (!Array.isArray(doc.students)) doc.students = [];
      if (!Array.isArray(doc.events)) doc.events = [];
      doc.classes.forEach(function(c){
        if (!c || !c.id || c.archived || c.id === '${CLS}') return;
        stash.archived.push({ id: c.id, was: c.archived });
        c.archived = true;
      });
      for (var i = doc.events.length - 1; i >= 0; i--) {
        var e = doc.events[i];
        if (!e || !cal.isDate(e.date)) continue;
        var end = cal.isDate(e.endDate) && e.endDate > e.date ? e.endDate : e.date;
        if (e.date <= far && end >= today) { stash.events.push({ at: i, event: e }); doc.events.splice(i, 1); }
      }
      doc.students.forEach(function(p){
        var on = p && p.supports && typeof p.supports.reviewDate === 'string' ? p.supports.reviewDate : '';
        if (on && on >= today && on <= far) { stash.reviews.push({ id: p.id, was: on }); p.supports.reviewDate = ''; }
      });
      doc.students.push({ id:'${ADA}', first:'Ada', last:'${ADA_N}' });
      doc.students.push({ id:'${BETH}', first:'Beth', last:'${BETH_N}' });
      doc.students.push({ id:'${CARA}', first:'Cara', last:'${CARA_N}' });
      doc.students.push({ id:'${DREW}', first:'Drew', last:'${DREW_N}' });
      /* A DATED term with both edges forty days out, so neither edge is inside the week or the
         lead window — a term edge inside either would be a pending item, correctly, and the day
         would not be quiet. */
      doc.classes.push({ id:'${CLS}', name:'${CLASS_NAME}', archived:false,
        roster:['${ADA}','${BETH}','${CARA}','${DREW}'], letterScale:null,
        terms:[{ id:'${TERM}', label:'WO-6.7 Term', start:shift(-40), end:shift(40) }],
        categories:[{ id:'k_wo67', name:'All work', weight:100 }]});
    });
    /* The events are re-inserted in ASCENDING index order at the foot, so they are stored that way.
       THE STASH GOES BACK TO NODE with this result rather than living on the window object: this
       section reloads the page once, and a stash kept page-side would not survive it — which would
       leave every other class archived for the rest of the run. No backticks in this comment. */
    stash.events.reverse();
    return { ok:true, today:today, lead:lead, stash:stash,
      archived: stash.archived.length, events: stash.events.length, reviews: stash.reviews.length,
      active: window.planbook.classes.getActiveClasses().map(function(c){ return c.id; }),
      openTerm: window.planbook.classes.getOpenTermId('${CLS}') }; })()`);

  if (!plant67 || !plant67.ok) {
    check('the WO-6.7 fixture is real: every other class put away, the readers\' windows emptied, '
      + 'and one quiet class of four planted', false, (plant67 && plant67.why) || 'the plant did not run');
  } else {
    check('the WO-6.7 fixture is real: every other class put away, the readers\' windows emptied, '
      + 'and one quiet class of four planted with a term whose edges are outside both windows',
      plant67.active.length === 1 && plant67.active[0] === CLS && plant67.openTerm === TERM,
      plant67.archived + ' class(es) archived for the run, ' + plant67.events + ' event(s) and '
        + plant67.reviews + ' review date(s) lifted out; active = ' + JSON.stringify(plant67.active)
        + '; open term = ' + plant67.openTerm + '; lead = ' + plant67.lead);

    /* ── acceptance line 1, the structural half: the stack, with the grid as panel 1 ── */
    await rehome67();
    const quiet = await evalJs(PAGE);
    check('#homeView holds the .gl-stack and the class grid is its first panel — the same .panel, '
      + 'holding #homeGrid and #homeEmpty, with the card drawn in its shipped shape: one button '
      + 'carrying head, state line and signals slot, in that order',
      quiet.stackInView && quiet.stackClass === 'gl-stack' && quiet.firstIsGrid
        && Array.isArray(quiet.cardShape)
        && quiet.cardShape.join('|') === 'class-card-head|class-card-state|class-card-signals'
        && /Not taken yet/.test(quiet.state),
      JSON.stringify({ stack: quiet.stackClass, first: quiet.firstIsGrid, card: quiet.cardShape,
        state: quiet.state }));

    /* ── acceptance line 2: one quiet panel, four chips, and nothing else in the tree ── */
    check('a day with nothing pending renders ONE quiet panel under the grid — the stack holds '
      + 'exactly two panels and the quiet one is the second — with four warrant chips on it',
      quiet.quiet && quiet.quietIsSecond && quiet.panels === 2 && quiet.chips.length === 4
        && quiet.lead === 'Nothing needs you today.',
      JSON.stringify({ panels: quiet.panels, chips: quiet.chips, lead: quiet.lead }));
    check('and the DOM holds NO panel for the week, the queue, the hits or what is closing in — '
      + 'no named panel but the quiet one, and not one list, row, foot, shut wrapper or column '
      + 'anywhere under #homeView: absent, not hidden',
      quiet.named.length === 1 && quiet.named[0] === 'quiet' && quiet.rows === 0,
      'named panels = ' + JSON.stringify(quiet.named) + ', list/row/foot/shut/column elements = '
        + quiet.rows);
    /* The chips carry the readers' figures and the engine's own settings, and nothing else. The
       date on the first is today plus six, formatted by src/date-text.js; the lead on the fourth is
       leadDaysOf() read back through the seam rather than assumed to be the default. */
    const weekEnd = await evalJs('window.planbook.calendar.shiftDays(window.planbook.attendance.todayISO(), 6)');
    const dayNum = String(Number(String(weekEnd).slice(8, 10)));
    check('the four chips say what was looked at, in the order the missing panels would have '
      + 'appeared: the calendar through today plus six, the queue over 1 class, four students both '
      + 'directions, and no deadline inside the lead time the document actually holds',
      new RegExp('^Nothing on the calendar through [A-Z][a-z]{2}, [A-Z][a-z]{2} ' + dayNum + '$').test(quiet.chips[0] || '')
        && quiet.chips[1] === 'Nothing to grade in 1 class'
        && quiet.chips[2] === '4 students checked, both directions'
        && quiet.chips[3] === (plant67.lead === 0 ? 'No deadline today'
          : 'No deadline inside its ' + plant67.lead + '-day warning'),
      JSON.stringify(quiet.chips) + ' (week ends ' + weekEnd + ', lead ' + plant67.lead + ')');

    /* ── acceptance line 3, the quiet half: five readers, four of them empty ── */
    check('src/glance.js exports one reader per source and on the quiet day all four answer an '
      + 'empty array — week, queue, hits, closing in — while the quiet-middle reader answers all '
      + 'four students',
      quiet.week === 0 && quiet.queue === 0 && quiet.hits === 0 && quiet.closing === 0
        && quiet.quietRows === 4,
      JSON.stringify({ week: quiet.week, queue: quiet.queue, hits: quiet.hits,
        closing: quiet.closing, quietMiddle: quiet.quietRows }));

    /* ── acceptance line 5: the door, and where it lands ── */
    check('the quiet-middle door is on the quiet panel: a <button type="button"> wearing '
      + '.class-action-btn as shipped, carrying data-signals-open="quiet", reading '
      + '`The quiet middle · 4` — the quiet-middle reader\'s own length',
      !!quiet.door && quiet.door.tag === 'BUTTON' && quiet.door.type === 'button'
        && /\bclass-action-btn\b/.test(quiet.door.cls) && quiet.door.landing === 'quiet'
        && quiet.door.text === 'The quiet middle · 4',
      JSON.stringify(quiet.door));

    await clickSel('#glanceQuiet [data-signals-open]');
    await new Promise(r => setTimeout(r, 400));
    const landed = await evalJs(`(function(){
      var panel = document.getElementById('signalsQuiet');
      var head = document.getElementById('signalsQuietHead');
      var r = panel ? panel.getBoundingClientRect() : null;
      var model = window.planbook.signalsView.signalsModel();
      var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      return {
        view: (document.querySelector('main > :not(.hidden)') || {}).id || '',
        head: head ? head.textContent : '',
        headN: model.quiet.count,
        filter: model.classId, rule: model.ruleId, sort: model.sort,
        panelHidden: panel ? panel.classList.contains('hidden') : null,
        top: r ? Math.round(r.top) : null,
        bottom: r ? Math.round(r.bottom) : null,
        inner: window.innerHeight,
        scrollY: Math.round(window.scrollY), maxScroll: Math.round(maxScroll),
        focused: document.activeElement ? document.activeElement.id : '',
        openView: window.planbook.getPref('openView') }; })()`);
    check('tapping it lands on WO-4.2\'s screen with every class showing, on the ruled order with '
      + 'no rule filter, and `The quiet middle · N` on that screen\'s own head carries the same 4 '
      + 'the door carried',
      landed.view === 'signalsView' && landed.filter === '' && landed.rule === '' && landed.sort === 'ruled'
        && landed.head === 'The quiet middle · 4' && landed.headN === 4 && landed.panelHidden === false,
      JSON.stringify({ view: landed.view, head: landed.head, filter: landed.filter, rule: landed.rule,
        sort: landed.sort }));
    check('and the screen arrives SCROLLED to the quiet-middle panel — its top at the top of a '
      + 'viewport the page overflows, or as far down as the page can go — with focus on its heading, '
      + 'and the view written down as `class` so a reload cannot land here',
      landed.maxScroll > 0 && landed.scrollY > 0
        && (landed.top <= 1 || landed.scrollY >= landed.maxScroll - 1)
        && landed.top < landed.inner && landed.bottom > 0
        && landed.focused === 'signalsQuietHead' && landed.openView === 'class',
      JSON.stringify({ top: landed.top, bottom: landed.bottom, inner: landed.inner,
        scrollY: landed.scrollY, maxScroll: landed.maxScroll, focused: landed.focused,
        openView: landed.openView }));

    /* ── acceptance line 3, the busy half: the card, the chips and the readers are one number ── */
    /*
      TWO STUDENTS TRIP ONE RULE EACH, TWO ASSIGNMENTS CARRY OPEN CELLS, and every score below is
      there to keep it at exactly that. Ada and Beth: three ten-point warmups marked MISSING and ONE
      90 on a hundred-point task — 69% with the zeros, over the 65% line; one score, so no run of
      anything; four counted rows against the eight `no-missing` asks for; and, the part that took a
      red run to learn, a graded history of exactly FOUR, which is the whole of the grade-rose
      window — so `before` is a grade over nothing, null, and the rule does not fire. (cooldown-
      quiet.mjs's Ben and Cal carry three 85s after their three zeros, which leaves two zeros
      outside the window, a `before` of 0%, and a rise of 77 points: two hits each, and that
      section counts eight hits over four students for exactly that reason.) Cara and Drew: warmups
      EXCUSED (out of the grade, in none of openWork()'s states, so neither a hit nor a blank) and
      one 85 — nothing fires in either direction, and nothing is open.

      THE TWO OPEN ASSIGNMENTS. `u1` is blank for everyone. `u2` is blank for Beth alone and EXCUSED
      for the other three — excused rather than scored, because a fourth score would change the
      shape above. So the queue is two, and cutting Beth makes it one: the arrangement the
      acceptance line's "moves all three" needs, since a queue of two blank-for-everyone assignments
      would not move when a student left.
    */
    await goHome67();
    const busy67 = await evalJs(`(function(){
      var s = window.planbook.store, cal = window.planbook.calendar;
      var today = window.planbook.attendance.todayISO();
      var back = function(n){ return cal.shiftDays(today, -n); };
      s.update(function(doc){
        if (!Array.isArray(doc.assignments)) doc.assignments = [];
        if (!doc.scores || typeof doc.scores !== 'object') doc.scores = {};
        for (var n = 1; n <= 3; n++) {
          doc.assignments.push({ id:'a_wo67_s' + n, classId:'${CLS}', termId:'${TERM}',
            categoryId:'k_wo67', name:'WO-6.7 Warmup ' + n, points:10,
            assigned:back(30), due:back(25) });
        }
        doc.assignments.push({ id:'a_wo67_t1', classId:'${CLS}', termId:'${TERM}',
          categoryId:'k_wo67', name:'WO-6.7 Task 1', points:100,
          assigned:back(30), due:back(20) });
        doc.assignments.push({ id:'a_wo67_u1', classId:'${CLS}', termId:'${TERM}',
          categoryId:'k_wo67', name:'WO-6.7 Open for all', points:100, assigned:back(10), due:'' });
        doc.assignments.push({ id:'a_wo67_u2', classId:'${CLS}', termId:'${TERM}',
          categoryId:'k_wo67', name:'WO-6.7 Open for one', points:100, assigned:back(10), due:'' });
        var put = function(id, sid, cell){
          doc.scores[id] = doc.scores[id] || {};
          doc.scores[id][sid] = cell;
        };
        ['${ADA}', '${BETH}'].forEach(function(sid){
          for (var i = 1; i <= 3; i++) put('a_wo67_s' + i, sid, { v: null, flag: 'missing' });
        });
        ['${CARA}', '${DREW}'].forEach(function(sid){
          for (var i = 1; i <= 3; i++) put('a_wo67_s' + i, sid, { v: null, flag: 'excused' });
        });
        put('a_wo67_t1', '${ADA}', { v: 90 });
        put('a_wo67_t1', '${BETH}', { v: 90 });
        put('a_wo67_t1', '${CARA}', { v: 85 });
        put('a_wo67_t1', '${DREW}', { v: 85 });
        ['${ADA}', '${CARA}', '${DREW}'].forEach(function(sid){
          put('a_wo67_u2', sid, { v: null, flag: 'excused' });
        });
      });
      return { assignments: s.getDoc().assignments.filter(function(a){
        return String(a.id).indexOf('a_wo67_') === 0; }).length }; })()`);
    await rehome67();
    const busy = await evalJs(PAGE);
    check('on a busy day the quiet panel is GONE — one panel in the stack, no named panel at all — '
      + 'and this row draws nothing in its place',
      busy67.assignments === 6 && !busy.quiet && busy.panels === 1 && busy.named.length === 0 && busy.rows === 0,
      JSON.stringify({ planted: busy67.assignments, quiet: busy.quiet, panels: busy.panels, named: busy.named }));
    check('the card\'s `2 to grade`, the card\'s `2 need you` and the readers\' lengths AGREE: the '
      + 'queue reader hands back two rows (one per assignment, one of them open for one student '
      + 'only), the hits reader hands back two hits over two students — `missing-count` once each, '
      + 'and no second rule — and the quiet middle is the other two',
      Array.isArray(busy.card) && busy.card.join('|') === '2 to grade|2 need you'
        && busy.queue === 2 && busy.hits === 2 && busy.students === 2 && busy.quietRows === 2
        && busy.rules.join(',') === '7ada:missing-count,beth:missing-count'
        && busy.queueOpen.join(',') === 'a_wo67_u1:4,a_wo67_u2:1',
      JSON.stringify({ card: busy.card, queue: busy.queue, open: busy.queueOpen, hits: busy.hits,
        rules: busy.rules, students: busy.students, quietMiddle: busy.quietRows }));

    /* ── and cutting a student moves all three ── */
    await goHome67();
    await evalJs(`(function(){
      window.planbook.store.update(function(doc){
        var c = (doc.classes || []).filter(function(x){ return x.id === '${CLS}'; })[0];
        if (c) c.roster = c.roster.filter(function(id){ return id !== '${BETH}'; });
        doc.students = (doc.students || []).filter(function(p){ return p.id !== '${BETH}'; });
      }); return 1; })()`);
    await rehome67();
    const cut = await evalJs(PAGE);
    check('cutting a student from the fixture moves ALL THREE together — `1 to grade`, `1 needs '
      + 'you`, and the queue and hits readers each down to one — with the quiet middle unmoved, '
      + 'because she was on neither list',
      Array.isArray(cut.card) && cut.card.join('|') === '1 to grade|1 needs you'
        && cut.queue === 1 && cut.hits === 1 && cut.students === 1 && cut.quietRows === 2
        && cut.queueOpen.join(',') === 'a_wo67_u1:3' && !cut.quiet,
      JSON.stringify({ card: cut.card, queue: cut.queue, open: cut.queueOpen, hits: cut.hits,
        rules: cut.rules, students: cut.students, quietMiddle: cut.quietRows }));

    /* ── and the hits reader is POST-cooldown, exactly as the card is ── */
    /* A contact about Ada's one rule, two days ago, in the shape WO-5.4's handoff writes. The card
       loses its `need you` chip entirely — zero draws nothing — the hits reader answers [], and the
       quiet middle does NOT gain her: she was flagged, and the cooldown silences rather than clears. */
    await goHome67();
    await evalJs(`(function(){ var s = window.planbook.store, cal = window.planbook.calendar;
      var today = window.planbook.attendance.todayISO();
      var off = (function(){
        var o = -new Date().getTimezoneOffset();
        var p = function(n){ return (n < 10 ? '0' : '') + n; };
        return (o < 0 ? '-' : '+') + p(Math.floor(Math.abs(o) / 60)) + ':' + p(Math.abs(o) % 60);
      })();
      s.update(function(doc){
        if (!Array.isArray(doc.log)) doc.log = [];
        doc.log.push({ id:'l_wo67_a', studentId:'${ADA}', at:cal.shiftDays(today, -2) + 'T09:00:00' + off,
          kind:'contact', audience:'guardian', subject:'Missing work', body:'', ruleId:'missing-count' });
      }); return 1; })()`);
    await rehome67();
    const cooled = await evalJs(PAGE);
    check('the hits reader is post-cooldown exactly as the card is: a contact about the one rule Ada trips '
      + 'two days ago takes her off both — the card draws `1 to grade` and no `need you` chip at all, '
      + 'the reader answers no hit — while the queue is unmoved and the quiet middle does not gain '
      + 'her, because silenced is not the same as clear',
      Array.isArray(cooled.card) && cooled.card.join('|') === '1 to grade'
        && cooled.hits === 0 && cooled.queue === 1 && cooled.quietRows === 2 && !cooled.quiet,
      JSON.stringify({ card: cooled.card, hits: cooled.hits, queue: cooled.queue,
        quietMiddle: cooled.quietRows, quietPanel: cooled.quiet }));
    await evalJs(`(function(){ window.planbook.store.update(function(doc){
      doc.log = (doc.log || []).filter(function(e){ return String(e.id).indexOf('l_wo67') !== 0; });
    }); return 1; })()`);

    /* ── the two windows, and the decision reacting to each array in turn ── */
    /* Back to quiet, three students now, so that each probe below is the ONLY thing pending. */
    await goHome67();
    await evalJs(`(function(){
      window.planbook.store.update(function(doc){
        doc.assignments = (doc.assignments || []).filter(function(a){
          return String(a.id).indexOf('a_wo67_') !== 0; });
        Object.keys(doc.scores || {}).forEach(function(k){
          if (k.indexOf('a_wo67_') === 0) delete doc.scores[k]; });
      }); return 1; })()`);
    const probe = async (setup) => {
      await goHome67();
      await evalJs(`(function(){ var s = window.planbook.store, cal = window.planbook.calendar;
        var today = window.planbook.attendance.todayISO();
        var lead = cal.leadDaysOf(s.getDoc());
        var shift = function(n){ return cal.shiftDays(today, n); };
        s.update(function(doc){ ${setup} });
        return 1; })()`);
      await rehome67();
      return await evalJs(PAGE);
    };
    const clearProbe = `doc.events = (doc.events || []).filter(function(e){ return String(e.id).indexOf('e_wo67') !== 0; });
      (doc.students || []).forEach(function(p){ if (p.id === '${CARA}' && p.supports) p.supports.reviewDate = ''; });`;
    const ev = (id, kind, offset) => `doc.events.push({ id:'${id}', date:shift(${offset}), endDate:shift(${offset}),
      kind:'${kind}', title:'WO-6.7 ${kind}', classIds:[], studentId:'', notes:'', seriesId:'' });`;

    const atSix = await probe(clearProbe + ev('e_wo67_r6', 'reminder', 6));
    const atSeven = await probe(clearProbe + ev('e_wo67_r7', 'reminder', 7));
    check('the week reader reads today through six days on and not seven: a reminder on day six is '
      + 'one week item and takes the quiet panel down; the same reminder on day seven is none and '
      + 'the panel is back — the far edge is a reader\'s WINDOW, not a filter of its own',
      atSix.week === 1 && !atSix.quiet && atSix.panels === 1
        && atSeven.week === 0 && atSeven.quiet && atSeven.panels === 2 && atSeven.chips.length === 4,
      JSON.stringify({ daySix: { week: atSix.week, quiet: atSix.quiet },
        daySeven: { week: atSeven.week, quiet: atSeven.quiet } }));

    const dueIn = await probe(clearProbe + ev('e_wo67_gd', 'grades-due', plant67.lead));
    const dueOut = await probe(clearProbe + ev('e_wo67_gd2', 'grades-due', plant67.lead + 1));
    check('the closing-in reader reads a grades-due date inside src/calendar.js\'s lead window and '
      + 'not one day past it: on the last day of the lead it is one closing-in item; one day later '
      + 'it is none — and on both days it is one WEEK item, because a grades-due date is on the '
      + 'calendar whether or not its warning has started',
      dueIn.closing === 1 && dueIn.closingKinds[0] === 'grades-due' && !dueIn.quiet
        && dueOut.closing === 0 && (plant67.lead + 1 > 6 || (dueOut.week === 1 && !dueOut.quiet)),
      JSON.stringify({ inside: { closing: dueIn.closing, kinds: dueIn.closingKinds, week: dueIn.week },
        pastIt: { closing: dueOut.closing, week: dueOut.week, quiet: dueOut.quiet } }));

    const review = await probe(clearProbe
      + `(doc.students || []).forEach(function(p){ if (p.id === '${CARA}') { p.supports = p.supports || {}; p.supports.reviewDate = shift(lead); } });`);
    check('a review date inside the lead window reaches the closing-in reader as ONE record carrying '
      + 'a COUNT — kind `review-count`, count 1 — and no name, no student id and no date of its own '
      + 'anywhere in what the reader hands back; the quiet panel is down on its account alone',
      review.closing === 1 && review.closingKinds[0] === 'review-count'
        && /"count":1/.test(review.closingText)
        && !/Wo67|studentId|Cara|reviewDate/.test(review.closingText)
        && review.week === 0 && review.queue === 0 && review.hits === 0 && !review.quiet,
      review.closingText + ' · week ' + review.week + ', queue ' + review.queue + ', hits ' + review.hits);

    /* ── and under a projector the quiet panel draws exactly as otherwise ── */
    /* The same review date is still on Cara. reviewDatesIn() answers [] while the mode is on, so
       the closing-in reader answers [] with no test of its own, the day is quiet, and the panel is
       drawn — four chips, and the door carrying the engine's own 3, because quietMiddle() is not
       the screen and does not refuse. src/glance.js asks presentationMode() nowhere. */
    await goHome67();
    const modeWas = await evalJs('window.planbook.supports.presentationMode()');
    await evalJs('window.planbook.supports.setPresentationMode(true); 1');
    await rehome67();
    const projected = await evalJs(PAGE);
    await evalJs('window.planbook.supports.setPresentationMode(' + (modeWas ? 'true' : 'false') + '); 1');
    check('with presentation mode on and the same review date on file, the closing-in reader answers '
      + 'nothing — inherited from reviewDatesIn(), with no asker of presentationMode() in '
      + 'src/glance.js — so the day reads quiet and the panel draws exactly as otherwise: four '
      + 'chips, and `The quiet middle · 3` on the door',
      projected.closing === 0 && projected.quiet && projected.chips.length === 4
        && projected.chips[2] === '3 students checked, both directions'
        && !!projected.door && projected.door.text === 'The quiet middle · 3',
      JSON.stringify({ closing: projected.closing, quiet: projected.quiet, chips: projected.chips,
        door: projected.door && projected.door.text }));

    /* ── acceptance line 6: no view was added, and a reload lands here ── */
    /* The review date comes off first, so the day is quiet again with the mode off. */
    const cleared = await probe(clearProbe);
    await goHome67();
    const before = await evalJs(`(function(){ return {
      view: (document.querySelector('main > :not(.hidden)') || {}).id || '',
      openView: window.planbook.getPref('openView'),
      views: document.querySelectorAll('main > [id$="View"]').length }; })()`);
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 600));
    await waitForBoot();
    await evalJs(KILL_ANIM);
    const after = await evalJs(`(function(){ return {
      view: (document.querySelector('main > :not(.hidden)') || {}).id || '',
      quiet: !!document.getElementById('glanceQuiet'),
      panels: document.querySelectorAll('#homeView .panel').length }; })()`);
    check('the page adds no view: standing on the grid writes `home` to planbook_openView, <main> '
      + 'holds the same eight views it held before this work order, and a reload lands back on '
      + '#homeView with the quiet panel redrawn from the document on arrival',
      cleared.quiet && before.view === 'homeView' && before.openView === 'home' && before.views === 8
        && after.view === 'homeView' && after.quiet && after.panels === 2,
      JSON.stringify({ before: before, after: after }));
  }

  /* ── and the fixture comes back off, flag by flag ── */
  const cleaned67 = await evalJs(`(function(){
    var s = window.planbook.store;
    var stash = ${JSON.stringify((plant67 && plant67.stash) || { archived: [], events: [], reviews: [] })};
    s.update(function(doc){
      doc.classes = (doc.classes || []).filter(function(c){ return c.id !== '${CLS}'; });
      doc.students = (doc.students || []).filter(function(p){
        return String(p.id).indexOf('s_wo67') !== 0; });
      doc.assignments = (doc.assignments || []).filter(function(a){
        return String(a.id).indexOf('a_wo67_') !== 0; });
      doc.events = (doc.events || []).filter(function(e){
        return String(e.id).indexOf('e_wo67') !== 0; });
      doc.log = (doc.log || []).filter(function(e){
        return String(e.id).indexOf('l_wo67') !== 0; });
      if (doc.scores) {
        Object.keys(doc.scores).forEach(function(k){
          if (k.indexOf('a_wo67_') === 0) delete doc.scores[k]; });
      }
      stash.archived.forEach(function(a){
        var c = doc.classes.filter(function(x){ return x.id === a.id; })[0];
        if (!c) return;
        if (a.was === undefined) delete c.archived; else c.archived = a.was;
      });
      stash.events.forEach(function(e){ doc.events.splice(e.at, 0, e.event); });
      stash.reviews.forEach(function(r){
        var p = doc.students.filter(function(x){ return x.id === r.id; })[0];
        if (p && p.supports) p.supports.reviewDate = r.was;
      });
    });
    var d = s.getDoc();
    var out = {
      classes:(d.classes || []).filter(function(c){ return c.id === '${CLS}'; }).length,
      students:(d.students || []).filter(function(p){
        return String(p.id).indexOf('s_wo67') === 0; }).length,
      assignments:(d.assignments || []).filter(function(a){
        return String(a.id).indexOf('a_wo67_') === 0; }).length,
      ownEvents:(d.events || []).filter(function(e){
        return String(e.id).indexOf('e_wo67') === 0; }).length,
      log:(d.log || []).filter(function(e){
        return String(e.id).indexOf('l_wo67') === 0; }).length,
      scores: Object.keys(d.scores || {}).filter(function(k){
        return k.indexOf('a_wo67_') === 0; }).length,
      stillArchived: stash.archived.filter(function(a){
        var c = (d.classes || []).filter(function(x){ return x.id === a.id; })[0];
        return c && c.archived; }).length,
      eventsBack: stash.events.filter(function(e){
        return ((d.events || [])[e.at] || {}).id === e.event.id; }).length,
      eventsOwed: stash.events.length,
      reviewsBack: stash.reviews.filter(function(r){
        var p = (d.students || []).filter(function(x){ return x.id === r.id; })[0];
        return p && p.supports && p.supports.reviewDate === r.was; }).length,
      reviewsOwed: stash.reviews.length };
    return out; })()`);
  if ((await onView67()) !== 'homeView') await goHome67();
  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  check('the WO-6.7 fixture came back off the document — class, students, assignments, events, the '
    + 'one contact and every score bag — every class it archived is active again with the flag it had, every event '
    + 'it lifted out is back at its own index, every review date it blanked is restored, and the '
    + 'page was left on the grid',
    cleaned67.classes === 0 && cleaned67.students === 0 && cleaned67.assignments === 0
      && cleaned67.ownEvents === 0 && cleaned67.log === 0 && cleaned67.scores === 0
      && cleaned67.stillArchived === 0
      && cleaned67.eventsBack === cleaned67.eventsOwed && cleaned67.reviewsBack === cleaned67.reviewsOwed
      && (await onView67()) === 'homeView',
    JSON.stringify(cleaned67) + ', left on #' + (await onView67()));
}
}
