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
const { check, skip, send, evalJs, clickSel, clickVisible, KILL_ANIM, waitForBoot, seam } = h;

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
      /* WO-6.8's three list panels, read row by row: what each row IS (tag, type, class), what it
         SAYS (title with the arrow taken out, the line under it, the figure), whether it carries the
         calendar's arrow, and every hook a tap is routed on. */
      lists: (function(){
        var out = {};
        ['week', 'queue', 'closing'].forEach(function(name){
          var panel = view ? view.querySelector('[data-glance-panel="' + name + '"]') : null;
          if (!panel) { out[name] = null; return; }
          out[name] = {
            head: (panel.querySelector('.panel-title h2') || {}).textContent || '',
            text: (panel.querySelector('.panel-title p') || {}).textContent || '',
            rows: Array.prototype.map.call(panel.querySelectorAll('.gl-list > *'), function(b){
              var t = b.querySelector('.gl-row-title');
              var arrow = t ? t.querySelector('.gl-row-out') : null;
              return { tag: b.tagName, type: b.type || '', cls: b.className,
                title: t ? t.textContent.replace(arrow ? arrow.textContent : '', '') : '',
                out: !!arrow, outHidden: arrow ? arrow.getAttribute('aria-hidden') : '',
                why: (b.querySelector('.gl-row-why') || {}).textContent || '',
                meta: b.querySelector('.gl-row-meta') ? b.querySelector('.gl-row-meta').textContent : null,
                text: b.textContent,
                open: b.getAttribute('data-calendar-open'),
                item: b.hasAttribute('data-calendar-item'),
                kind: b.getAttribute('data-calendar-kind') || '',
                ref: b.getAttribute('data-calendar-ref') || '',
                klass: b.getAttribute('data-calendar-class') || '',
                date: b.getAttribute('data-calendar-date') || '',
                scores: b.getAttribute('data-scores-open'),
                scoresClass: b.getAttribute('data-scores-class') }; }) };
        });
        return out; })(),
      weekKinds: g.weekItems().map(function(i){ return i.kind; }),
      viewText: view ? view.textContent : '',
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
      new RegExp('^Nothing scheduled through [A-Z][a-z]{2}, [A-Z][a-z]{2} ' + dayNum + '$').test(quiet.chips[0] || '')
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
    /* RE-CUT AT WO-6.8. At WO-6.7 this asserted "one panel in the stack … this row draws nothing in its
       place", which was true of a build with no list panels and is exactly what WO-6.8 exists to
       change. The claim that survives is the quiet panel's absence; what stands in its place is now
       the one panel whose reader is non-empty — the queue — and no other, because the week and
       closing-in readers are empty on this day and an empty reader draws no panel. */
    /* RE-CUT AGAIN AT WO-6.4: the hits reader has two hits on this day, so panel 4 — *Who needs you* —
       now stands after the queue, in the page's order. Still no panel for the two empty readers. */
    check('on a busy day the quiet panel is GONE, and what stands in its place is exactly the panels whose '
      + 'readers have something — the queue, then who needs you — and no panel for the empty week or '
      + 'closing-in readers',
      busy67.assignments === 6 && !busy.quiet && busy.panels === 3
        && busy.named.join(',') === 'queue,attention' && busy.week === 0 && busy.closing === 0,
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
      + 'one week item, takes the quiet panel down and puts the week panel up in its place (WO-6.8); '
      + 'the same reminder on day seven is none and '
      + 'the panel is back — the far edge is a reader\'s WINDOW, not a filter of its own',
      atSix.week === 1 && !atSix.quiet && atSix.panels === 2 && atSix.named.join(',') === 'week'
        && atSeven.week === 0 && atSeven.quiet && atSeven.panels === 2 && atSeven.chips.length === 4,
      JSON.stringify({ daySix: { week: atSix.week, quiet: atSix.quiet },
        daySeven: { week: atSeven.week, quiet: atSeven.quiet } }));

    const dueIn = await probe(clearProbe + ev('e_wo67_gd', 'grades-due', plant67.lead));
    const dueOut = await probe(clearProbe + ev('e_wo67_gd2', 'grades-due', plant67.lead + 1));
    /* RE-CUT AT WO-6.8, on the owner's ruling of 2026-09-16 that a grades-due date is under *Closing
       in* and never under *Today and this week*. This check used to assert the opposite half — "on
       both days it is one WEEK item" — which was WO-6.7's reading before the ruling existed. So the
       day one past the lead is now a QUIET day on the default lead of 3 (a deadline four days out is
       inside the week and outside its warning), and that is the day whose first chip used to say
       "Nothing on the calendar" with a deadline sitting on the calendar. The chip now says what the
       week reader actually asked, and this probe is the fixture that reaches that state. */
    check('the closing-in reader reads a grades-due date inside src/calendar.js\'s lead window and '
      + 'not one day past it: on the last day of the lead it is one closing-in item; one day later '
      + 'it is none — and on NEITHER day is it a week item (the owner, 2026-09-16), so the day past '
      + 'the lead is quiet and its first chip claims only that nothing is SCHEDULED, never that the '
      + 'calendar is empty',
      dueIn.closing === 1 && dueIn.closingKinds[0] === 'grades-due' && !dueIn.quiet && dueIn.week === 0
        && dueOut.closing === 0 && dueOut.week === 0
        && (plant67.lead + 1 > 6 || (dueOut.quiet && /^Nothing scheduled through /.test(dueOut.chips[0] || '')
          && !/on the calendar/i.test(dueOut.viewText))),
      JSON.stringify({ inside: { closing: dueIn.closing, kinds: dueIn.closingKinds, week: dueIn.week },
        pastIt: { closing: dueOut.closing, week: dueOut.week, quiet: dueOut.quiet,
          chip: dueOut.chips[0] } }));

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

    /*
     * ───────── the three list panels: today and this week, waiting to be graded, closing in (WO-6.8) ─────────
     *
     * WHAT ONLY A BROWSER CAN SETTLE HERE. That each panel draws ITS reader's array and nothing else —
     * a row per record, no more and no fewer, and the panel absent when the reader is empty — which is
     * a claim about the tree against the readers' own lengths read through the seam in the same
     * breath. That every row is a <button> a thumb can hit, measured on a pointer that is really
     * coarse. That each row lands where the work order says, which is a chain of navigation only a
     * click can walk. That the review COUNT carries no name, date or kind, and is gone from the glass
     * the moment the REAL presentation control is pressed with the page up — the flip list, not the
     * next arrival. And that a day where only a signal is pending draws no quiet panel.
     *
     * THE FIXTURE BUILDS ON THE WO-6.7 CLASS AS THE BLOCK ABOVE LEFT IT: three students (Beth was cut),
     * no assignments, no events, the document quiet. It adds, all anchored to the page's own clock:
     * events on days -2..1 (a trip that began before the window), 0, 6 (untitled, so the kind's own
     * word is the title), 7 (outside) and a grades-due date inside the lead; three assignments due on
     * days -1, 3 and 8, one of them inside the week; a second term on the class whose END is day 5; and
     * a SECOND class of one student with one open assignment, so the queue's head has two cards to be
     * the sum of rather than one.
     */
    console.log('\n--- the glance page: today and this week, waiting to be graded, closing in (WO-6.8) ---');
    const CLS68 = 'c_wo68', TERM68 = 'tm_wo68', EDGE68 = 'tm_wo68edge', ELI68 = 's_wo68eli';
    const lead68 = plant67.lead;
    /* The grades-due date sits on the LAST day of the lead, capped to the week so it is also a day a
       week reader that still carried the kind would have picked up — which is what makes its absence
       from the week panel a claim rather than an accident of the window. */
    const GD68 = Math.min(Math.max(lead68, 0), 6);
    const openClassWas68 = await evalJs("window.planbook.getPref('openClassId')");

    const plant68 = await evalJs(`(function(){
      var s = window.planbook.store, cal = window.planbook.calendar;
      var today = window.planbook.attendance.todayISO();
      var shift = function(n){ return cal.shiftDays(today, n); };
      var ev = function(id, kind, from, to, title){
        return { id:id, date:shift(from), endDate:shift(to), kind:kind, title:title, classIds:[],
          studentId:'', notes:'', seriesId:'' }; };
      s.update(function(doc){
        var cls = (doc.classes || []).filter(function(c){ return c.id === '${CLS}'; })[0];
        cls.terms.push({ id:'${EDGE68}', label:'WO-6.8 Edge term', start:shift(-100), end:shift(5) });
        doc.events.push(ev('e_wo68_trip', 'trip', -2, 1, 'WO-6.8 trip'));
        doc.events.push(ev('e_wo68_rem0', 'reminder', 0, 0, 'WO-6.8 reminder'));
        doc.events.push(ev('e_wo68_conf6', 'conference', 6, 6, ''));
        doc.events.push(ev('e_wo68_rem7', 'reminder', 7, 7, 'WO-6.8 day seven'));
        doc.events.push(ev('e_wo68_gd', 'grades-due', ${GD68}, ${GD68}, 'WO-6.8 grades due'));
        var work = function(id, cid, tid, cat, name, due){
          doc.assignments.push({ id:id, classId:cid, termId:tid, categoryId:cat, name:name, points:10,
            assigned:shift(-10), due:due }); };
        work('a_wo68_dm1', '${CLS}', '${TERM}', 'k_wo67', 'WO-6.8 Due yesterday', shift(-1));
        work('a_wo68_d3', '${CLS}', '${TERM}', 'k_wo67', 'WO-6.8 Due soon', shift(3));
        work('a_wo68_d8', '${CLS}', '${TERM}', 'k_wo67', 'WO-6.8 Due later', shift(8));
        doc.students.push({ id:'${ELI68}', first:'Eli', last:'Wo68Second' });
        doc.classes.push({ id:'${CLS68}', name:'WO-6.8 Second', archived:false, roster:['${ELI68}'],
          letterScale:null, terms:[{ id:'${TERM68}', label:'WO-6.8 Term', start:shift(-40), end:shift(40) }],
          categories:[{ id:'k_wo68', name:'Essays', weight:100 }]});
        work('a_wo68_x', '${CLS68}', '${TERM68}', 'k_wo68', 'WO-6.8 Essay', '');
      });
      return { today: today, days: [-2, 0, 3, 5, 6, 7, 8, ${GD68}].map(shift),
        active: window.planbook.classes.getActiveClasses().map(function(c){ return c.id; }).sort(),
        openTerm: window.planbook.classes.getOpenTermId('${CLS}') }; })()`);
    const day68 = (n) => plant68.days[[-2, 0, 3, 5, 6, 7, 8, GD68].indexOf(n)];
    await rehome67();
    const full68 = await evalJs(PAGE);
    const cards68 = await evalJs(`(function(){
      var sum = 0, each = {};
      Array.prototype.forEach.call(document.querySelectorAll('#homeGrid [data-class-tab]'), function(card){
        Array.prototype.forEach.call(card.querySelectorAll('.class-card-count'), function(chip){
          var m = /^(\\d+) to grade$/.exec(chip.textContent);
          if (m) { sum += Number(m[1]); each[card.getAttribute('data-class-tab')] = chip.textContent; }
        }); });
      return { sum: sum, each: each }; })()`);

    const W = full68.lists.week, Q = full68.lists.queue, C = full68.lists.closing;
    const weekRows = W ? W.rows : [];
    const byTitle = (rows, t) => rows.filter(r => r.title === t)[0] || null;
    const trip68 = byTitle(weekRows, 'WO-6.8 trip'), rem68 = byTitle(weekRows, 'WO-6.8 reminder');
    const conf68 = byTitle(weekRows, 'Conference');
    const due68 = byTitle(weekRows, 'WO-6.8 Due soon due · ' + CLASS_NAME);
    const edge68 = byTitle(weekRows, CLASS_NAME + ' · Term ends');

    /* ── acceptance line 1: the week, its window, and nothing else ── */
    check('the WO-6.8 fixture is real: two active classes, the WO-6.7 class still open on its first term, '
      + 'and the planted days anchored to the page\'s clock',
      full68.view === 'homeView' && plant68.active.join(',') === [CLS, CLS68].sort().join(',')
        && plant68.openTerm === TERM,
      JSON.stringify({ active: plant68.active, openTerm: plant68.openTerm, today: plant68.today,
        lead: lead68, gradesDueOn: GD68 }));
    check('*Today and this week* lists every authored event but the grades-due date and every derived '
      + 'item from today through six days on, and nothing outside it: the trip that began two days ago, '
      + 'today\'s reminder, the day-six conference (untitled, so it reads as its kind), the day-three '
      + 'due date and the day-five term end — five rows for a five-record reader — and not the day-seven '
      + 'reminder, the due dates on days -1 and 8, or the grades-due date inside the week',
      !!W && W.head === 'Today and this week' && weekRows.length === 5 && full68.week === 5
        && full68.weekKinds.join(',') === 'trip,reminder,conference,assignment-due,term-end'
        && !!trip68 && !!rem68 && !!conf68 && !!due68 && !!edge68
        && !weekRows.some(r => /day seven|Due yesterday|Due later|grades due/i.test(r.text))
        && full68.weekKinds.indexOf('grades-due') === -1,
      JSON.stringify({ head: W && W.head, reader: full68.week, kinds: full68.weekKinds,
        rows: weekRows.map(r => r.title + ' | ' + r.why + ' | ' + r.meta) }));
    check('each week row carries its own door: an authored event opens the calendar ON ITS DAY '
      + '(`data-calendar-open` = that event\'s first day, and a trip that began before today names both '
      + 'edges), while the due date and the term edge wear the month grid\'s own chip hooks with the '
      + 'calendar\'s aria-hidden ↗ — and an event row carries no arrow',
      !!trip68 && trip68.open === day68(-2) && !trip68.item && !trip68.out && / – /.test(trip68.meta || '')
        && trip68.why === 'Trip'
        && !!rem68 && rem68.open === day68(0) && !rem68.out
        && !!conf68 && conf68.open === day68(6) && conf68.why === ''
        && !!due68 && due68.item && due68.out && due68.outHidden === 'true' && due68.open === null
        && due68.kind === 'assignment-due' && due68.ref === 'a_wo68_d3' && due68.klass === CLS
        && due68.date === day68(3)
        && !!edge68 && edge68.item && edge68.out && edge68.kind === 'term-end' && edge68.ref === EDGE68
        && edge68.date === day68(5),
      JSON.stringify({ trip: trip68, conference: conf68 && { open: conf68.open, why: conf68.why },
        due: due68 && { kind: due68.kind, ref: due68.ref, out: due68.out },
        edge: edge68 && { kind: edge68.kind, ref: edge68.ref } }));

    /* ── acceptance line 2: the queue, and its head is the cards' sum ── */
    const qRows = Q ? Q.rows : [];
    const essay68 = qRows.filter(r => r.scores === 'a_wo68_x')[0] || null;
    check('*Waiting to be graded* draws one row per assignment with blanks in the open term — the three '
      + 'dated assignments in one class and the essay in the other — and its head count, 4, equals the '
      + 'SUM of the cards\' `N to grade` chips (3 + 1), which is also the queue reader\'s length',
      !!Q && qRows.length === 4 && full68.queue === 4 && Q.head === 'Waiting to be graded · 4'
        && cards68.sum === 4 && cards68.each[CLS] === '3 to grade' && cards68.each[CLS68] === '1 to grade'
        && !!essay68 && essay68.scoresClass === CLS68 && essay68.meta === '1 blank'
        && essay68.title === 'WO-6.8 Essay' && essay68.why === 'WO-6.8 Second · Essays'
        && qRows.filter(r => r.scoresClass === CLS).every(r => r.meta === '3 blanks'),
      JSON.stringify({ head: Q && Q.head, reader: full68.queue, cards: cards68,
        rows: qRows.map(r => r.title + ' | ' + r.why + ' | ' + r.meta + ' -> ' + r.scoresClass + '/' + r.scores) }));

    /* ── acceptance line 3, first half: the grades-due date is under Closing in and names its lead ── */
    const cRows = C ? C.rows : [];
    const gd68 = cRows.filter(r => r.ref === 'e_wo68_gd')[0] || null;
    check('*Closing in* carries the grades-due date as an amber row wearing the month grid\'s own chip '
      + 'hooks (so a tap loads the EVENT), and its head names whose lead time the window is — the one '
      + 'the teacher set for grades — with no second horizon anywhere on the panel',
      !!C && C.head === 'Closing in' && /lead time you set for grades/.test(C.text)
        && /Term edges and reviews use the same window/.test(C.text)
        && !/this month/i.test(C.text + JSON.stringify(cRows))
        && !!gd68 && /\bwarn\b/.test(gd68.cls) && gd68.item && gd68.kind === 'grades-due'
        && gd68.date === day68(GD68) && gd68.title === 'WO-6.8 grades due' && gd68.why === 'Grades due'
        && cRows.length === full68.closing,
      JSON.stringify({ head: C && C.head, text: C && C.text, reader: full68.closing,
        rows: cRows.map(r => r.title + ' | ' + r.cls + ' | ' + r.kind) }));

    /* ── acceptance line 5, on the desktop pass first: every row is a real button ── */
    const allRows68 = weekRows.concat(qRows, cRows);
    check('every row in the three panels is a <button type="button"> wearing .gl-row — no span, no '
      + 'link, no second kind of row',
      allRows68.length === weekRows.length + qRows.length + cRows.length && allRows68.length >= 10
        && allRows68.every(r => r.tag === 'BUTTON' && r.type === 'button' && /\bgl-row\b/.test(r.cls)),
      allRows68.length + ' rows: ' + JSON.stringify(allRows68.map(r => r.tag + '.' + r.cls)));

    /* ── the taps, walked ── */
    const where68 = `(function(){
      var open = document.querySelector('.modal-overlay:not(.hidden)');
      var m = window.planbook.calendarView.calendarModel();
      var focus = document.activeElement;
      return { view: (document.querySelector('main > :not(.hidden)') || {}).id || '',
        modal: open ? open.id : '',
        scale: m.scale, from: m.from, to: m.to, filter: m.classId,
        openClass: window.planbook.classes.getSelectedClassId(),
        eventTitle: (document.getElementById('eventTitle') || {}).value || '',
        assignmentId: (document.querySelector('#assignmentModal [data-assignment-id]') || {})
          .getAttribute ? document.querySelector('#assignmentModal [data-assignment-id]').getAttribute('data-assignment-id') : '',
        focusCell: focus && focus.getAttribute ? focus.getAttribute('data-score-cell') : null,
        col: (function(){
          var th = document.querySelector('#scoresGridWrap [data-score-col="a_wo68_x"]');
          if (!th) return null;
          var r = th.getBoundingClientRect();
          return { left: Math.round(r.left), right: Math.round(r.right), inner: window.innerWidth }; })() }; })()`;
    const closeAll68 = async () => await evalJs(`(function(){
      var open = document.querySelectorAll('.modal-overlay:not(.hidden)');
      Array.prototype.forEach.call(open, function(o){ window.planbook.closeModal(o); });
      return open.length; })()`);

    await clickSel('#homeView [data-glance-panel="week"] [data-calendar-open="' + day68(6) + '"]');
    await new Promise(r => setTimeout(r, 300));
    const toWeek68 = await evalJs(where68);
    await goHome67();
    await clickSel('#homeView [data-glance-panel="week"] [data-calendar-ref="a_wo68_d3"]');
    await new Promise(r => setTimeout(r, 300));
    const toDue68 = await evalJs(where68);
    await closeAll68();
    await goHome67();
    check('the taps land where the work order says: the day-six conference opens the calendar\'s WEEK '
      + 'holding day six, with every class showing; the day-three due date opens that class\'s '
      + 'assignment list with that assignment\'s own editor up',
      toWeek68.view === 'calendarView' && toWeek68.scale === 'week' && toWeek68.filter === ''
        && toWeek68.from <= day68(6) && toWeek68.to >= day68(6)
        && toDue68.view === 'assignmentsView' && toDue68.modal === 'assignmentModal'
        && toDue68.assignmentId === 'a_wo68_d3' && toDue68.openClass === CLS,
      JSON.stringify({ event: { view: toWeek68.view, scale: toWeek68.scale, from: toWeek68.from,
        to: toWeek68.to, day: day68(6) }, due: { view: toDue68.view, modal: toDue68.modal,
        assignment: toDue68.assignmentId, openClass: toDue68.openClass } }));

    await clickSel('#homeView [data-scores-open="a_wo68_x"]');
    await new Promise(r => setTimeout(r, 400));
    const toColumn68 = await evalJs(where68);
    await goHome67();
    await clickSel('#homeView [data-glance-panel="closing"] [data-calendar-ref="e_wo68_gd"]');
    await new Promise(r => setTimeout(r, 300));
    const toEvent68 = await evalJs(where68);
    await closeAll68();
    await goHome67();
    check('a queue row opens that class\'s score grid with that assignment\'s column on screen and the '
      + 'caret in its first cell, the class now the open one; and the grades-due row under *Closing in* '
      + 'taps through to the EVENT — the events panel with that row loaded into its form',
      toColumn68.view === 'scoresView' && toColumn68.openClass === CLS68 && !!toColumn68.col
        && toColumn68.col.left >= 0 && toColumn68.col.right <= toColumn68.col.inner
        && toColumn68.focusCell === 'a_wo68_x'
        && toEvent68.modal === 'eventsModal' && toEvent68.eventTitle === 'WO-6.8 grades due',
      JSON.stringify({ column: { view: toColumn68.view, openClass: toColumn68.openClass,
        col: toColumn68.col, focus: toColumn68.focusCell },
        event: { modal: toEvent68.modal, title: toEvent68.eventTitle } }));

    /* ── acceptance line 3, second half: on EVERY day inside its lead, and not the day after ── */
    const onDays68 = [];
    const lastLead68 = Math.min(Math.max(lead68, 0), 13);
    for (let k = 0; k <= lastLead68 + 1; k++) {
      const at = await probe(`doc.events.forEach(function(e){ if (e.id === 'e_wo68_gd') { e.date = shift(${k}); e.endDate = shift(${k}); } });`);
      const rows = at.lists.closing ? at.lists.closing.rows : [];
      const row = rows.filter(r => r.ref === 'e_wo68_gd')[0] || null;
      const inWeek = (at.lists.week ? at.lists.week.rows : []).some(r => /grades due/i.test(r.text));
      onDays68.push({ k: k, row: !!row, warn: !!row && /\bwarn\b/.test(row.cls), inWeek: inWeek,
        rows: rows.length, reader: at.closing });
    }
    check('a grades-due event appears under *Closing in* — amber — on EVERY day inside its lead time, '
      + 'from the day itself to ' + lastLead68 + ' days ahead, is gone the day after the lead ends, and '
      + 'is never a row under *Today and this week* on any of those days; the panel\'s rows follow the '
      + 'reader\'s length on every one',
      onDays68.length === lastLead68 + 2
        && onDays68.slice(0, lastLead68 + 1).every(d => d.row && d.warn)
        && !onDays68[lastLead68 + 1].row
        && onDays68.every(d => !d.inWeek && d.rows === d.reader),
      JSON.stringify(onDays68));
    /* Back to the planted day for everything below. */
    await probe(`doc.events.forEach(function(e){ if (e.id === 'e_wo68_gd') { e.date = shift(${GD68}); e.endDate = shift(${GD68}); } });`);

    /* ── acceptance line 6: move the readers, and the rows move with them ── */
    const moved68 = await probe(`doc.events = doc.events.filter(function(e){ return e.id !== 'e_wo68_rem0' && e.id !== 'e_wo68_gd'; });
      doc.assignments = doc.assignments.filter(function(a){ return a.id !== 'a_wo68_d8'; });`);
    const lenOf = (list) => list ? list.rows.length : 0;
    check('taking one event, the grades-due date and one assignment out of the fixture moves every '
      + 'reader and every panel TOGETHER — the week reader 5 → 4 and four rows, the queue 4 → 3 with '
      + 'three rows under a head reading 3, and closing in down by one with the panel\'s rows equal '
      + 'to it (absent when it reaches zero)',
      moved68.week === 4 && lenOf(moved68.lists.week) === 4
        && moved68.queue === 3 && lenOf(moved68.lists.queue) === 3
        && moved68.lists.queue && moved68.lists.queue.head === 'Waiting to be graded · 3'
        && moved68.closing === full68.closing - 1 && lenOf(moved68.lists.closing) === moved68.closing
        && (moved68.closing > 0) === !!moved68.lists.closing,
      JSON.stringify({ week: [full68.week, moved68.week, lenOf(moved68.lists.week)],
        queue: [full68.queue, moved68.queue, lenOf(moved68.lists.queue)],
        closing: [full68.closing, moved68.closing, lenOf(moved68.lists.closing)] }));

    /* ── acceptance line 4: the review count, and the projector ── */
    const reviews68 = await probe(`(doc.students || []).forEach(function(p){
        if (p.id === '${CARA}' || p.id === '${DREW}') { p.supports = p.supports || {};
          p.supports.reviewDate = p.id === '${CARA}' ? shift(0) : shift(lead); } });`);
    const rv68 = (reviews68.lists.closing ? reviews68.lists.closing.rows : []).filter(r => /review/.test(r.title))[0] || null;
    check('two reviews inside the lead reach *Closing in* as ONE row reading `2 reviews coming up` — no '
      + 'name, no date, no kind, no figure at the right where a date would go — and it opens the '
      + 'calendar on the month (`data-calendar-open` with no day)',
      !!rv68 && rv68.title === '2 reviews coming up' && rv68.why === 'Who and when are on the calendar.'
        && rv68.meta === null && rv68.open === '' && !rv68.item && !rv68.out
        && !/Wo67|Cara|Drew|IEP|504|plan|medical|accommodation/i.test(rv68.text)
        && !/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/.test(rv68.text)
        && rv68.text.replace(/[^0-9]/g, '') === '2',
      JSON.stringify(rv68));

    /* The REAL control, pressed with the page up and nothing re-arriving — so the review row coming
       off is src/shell.js's flip list redrawing the page, not the next render. */
    const modeWas68 = await evalJs('window.planbook.supports.presentationMode()');
    if (modeWas68) { await clickVisible('[data-presentation-toggle]'); await new Promise(r => setTimeout(r, 200)); }
    await clickVisible('[data-presentation-toggle]');
    await new Promise(r => setTimeout(r, 300));
    const projected68 = await evalJs(PAGE);
    const projMode68 = await evalJs('window.planbook.supports.presentationMode()');
    await clickVisible('[data-presentation-toggle]');
    await new Promise(r => setTimeout(r, 300));
    const unprojected68 = await evalJs(PAGE);
    if (modeWas68) await clickVisible('[data-presentation-toggle]');
    const projRows68 = projected68.lists.closing ? projected68.lists.closing.rows : [];
    const backRows68 = unprojected68.lists.closing ? unprojected68.lists.closing.rows : [];
    check('with presentation mode switched ON through its real control while the page is up, the review '
      + 'row is ABSENT at once — no re-arrival — and no text anywhere under #homeView says anything '
      + 'was hidden or names a review; switched off again, the row is back the same way',
      projMode68 === true && projected68.view === 'homeView'
        && projected68.closingKinds.indexOf('review-count') === -1
        && !projRows68.some(r => /review/i.test(r.text))
        && !/hidden|review/i.test(projected68.viewText)
        && backRows68.some(r => r.title === '2 reviews coming up'),
      JSON.stringify({ mode: projMode68, closingKinds: projected68.closingKinds,
        rows: projRows68.map(r => r.title), after: backRows68.map(r => r.title),
        mentions: (projected68.viewText.match(/[^.]*(hidden|review)[^.]*/i) || [''])[0] }));

    /* ── acceptance line 5: 44px, on a pointer that is really coarse ── */
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
    await send('Emulation.setDeviceMetricsOverride', { width: 1024, height: 768, deviceScaleFactor: 2, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 700));
    await waitForBoot();
    await evalJs(KILL_ANIM);
    const coarse68 = await evalJs("matchMedia('(pointer: coarse)').matches");
    if ((await onView67()) !== 'homeView') await goHome67();
    const sizes68 = await evalJs(`(function(){
      var out = {};
      ['week', 'queue', 'closing'].forEach(function(name){
        var panel = document.querySelector('#homeView [data-glance-panel="' + name + '"]');
        out[name] = panel ? Array.prototype.map.call(panel.querySelectorAll('.gl-list > *'), function(b){
          var r = b.getBoundingClientRect();
          return { tag: b.tagName, h: Math.round(r.height * 100) / 100, w: Math.round(r.width) }; }) : null;
      });
      return out; })()`);
    const flat68 = [].concat(sizes68.week || [], sizes68.queue || [], sizes68.closing || []);
    check('under an emulated coarse pointer every row in all three panels is a <button> measuring at '
      + 'least 44px tall — every row of each, not a sample',
      coarse68 === true && !!sizes68.week && !!sizes68.queue && !!sizes68.closing && flat68.length >= 7
        && flat68.every(b => b.tag === 'BUTTON' && b.h >= 44 && b.w >= 44),
      'coarse = ' + coarse68 + ', ' + JSON.stringify(sizes68));
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 600, deviceScaleFactor: 1, mobile: false });
    await send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 600));
    await waitForBoot();
    await evalJs(KILL_ANIM);
    if ((await onView67()) !== 'homeView') await goHome67();

    /* ── acceptance line 7: ONLY a signal pending, and the quiet panel is not drawn ── */
    /*
      Everything WO-6.8 planted comes off first — events, assignments, the second class and its
      student, the edge term and both review dates — so the week, the queue and closing in are empty.
      Then Ada gets the WO-6.7 busy fixture's shape WITHOUT its two open assignments: three warmups
      marked MISSING and one 90, Cara and Drew excused and 85. `missing` is not a blank, so nothing
      is waiting to be graded, and the one thing pending on the page is Ada's `missing-count` hit.
      WO-6.7's verifier found that no fixture reached this day; a build whose quiet decision forgot
      the signals draws "Nothing needs you today" here.
    */
    const onlyHits68 = await probe(`doc.events = doc.events.filter(function(e){ return String(e.id).indexOf('e_wo68') !== 0; });
      doc.assignments = doc.assignments.filter(function(a){ return String(a.id).indexOf('a_wo68_') !== 0; });
      doc.classes = doc.classes.filter(function(c){ return c.id !== '${CLS68}'; });
      doc.students = doc.students.filter(function(p){ return p.id !== '${ELI68}'; });
      var cls = doc.classes.filter(function(c){ return c.id === '${CLS}'; })[0];
      cls.terms = cls.terms.filter(function(t){ return t.id !== '${EDGE68}'; });
      doc.students.forEach(function(p){ if (p.supports && (p.id === '${CARA}' || p.id === '${DREW}')) p.supports.reviewDate = ''; });
      if (!doc.scores || typeof doc.scores !== 'object') doc.scores = {};
      var back = function(n){ return shift(-n); };
      for (var n = 1; n <= 3; n++) {
        doc.assignments.push({ id:'a_wo68_s' + n, classId:'${CLS}', termId:'${TERM}', categoryId:'k_wo67',
          name:'WO-6.8 Warmup ' + n, points:10, assigned:back(30), due:back(25) });
      }
      doc.assignments.push({ id:'a_wo68_t1', classId:'${CLS}', termId:'${TERM}', categoryId:'k_wo67',
        name:'WO-6.8 Task 1', points:100, assigned:back(30), due:back(20) });
      var put = function(id, sid, cell){ doc.scores[id] = doc.scores[id] || {}; doc.scores[id][sid] = cell; };
      for (var i = 1; i <= 3; i++) {
        put('a_wo68_s' + i, '${ADA}', { v: null, flag: 'missing' });
        put('a_wo68_s' + i, '${CARA}', { v: null, flag: 'excused' });
        put('a_wo68_s' + i, '${DREW}', { v: null, flag: 'excused' });
      }
      put('a_wo68_t1', '${ADA}', { v: 90 });
      put('a_wo68_t1', '${CARA}', { v: 85 });
      put('a_wo68_t1', '${DREW}', { v: 85 });`);
    /* RE-CUT AT WO-6.4. "The stack holds the class grid and nothing else" was true of a build with no
       panel 4, and panel 4 is exactly what stands on this day now. What survives unchanged is the
       claim WO-6.8's seventh line made: none of the three list panels, and NOT the quiet panel. */
    check('a day where ONLY the attention hits are non-empty — nothing scheduled, nothing to grade, '
      + 'nothing closing in, one student flagged — draws the three panels\' states, which is absent, '
      + 'and NOT the quiet panel: the stack holds the class grid and panel 4 (WO-6.4) and nothing else',
      onlyHits68.hits === 1 && onlyHits68.rules.join(',') === '7ada:missing-count'
        && onlyHits68.week === 0 && onlyHits68.queue === 0 && onlyHits68.closing === 0
        && !onlyHits68.quiet && onlyHits68.panels === 2 && onlyHits68.named.join(',') === 'attention'
        && !/Nothing needs you/.test(onlyHits68.viewText),
      JSON.stringify({ hits: onlyHits68.hits, rules: onlyHits68.rules, week: onlyHits68.week,
        queue: onlyHits68.queue, closing: onlyHits68.closing, quiet: onlyHits68.quiet,
        panels: onlyHits68.panels, named: onlyHits68.named }));

    /*
     * ───────── the glance page: who needs you, and the page as a whole (WO-6.4) ─────────
     *
     * WHAT ONLY A BROWSER CAN SETTLE HERE. That the five sections stand in the page's order and that
     * every control in every one of them carries a door — a claim about the tree. That panel 4's rows
     * are the signals screen's rows in the signals screen's order, and that each one lands on THAT
     * student's card over there, in the right column — a chain of navigation only a click can walk,
     * and the column matters because one student is on both lists. That the students drawn plus the
     * `and N more` foot are the cards' own chips, read off the glass rather than recomputed. That the
     * real presentation control, pressed with the page up, takes every name off the page at once and
     * leaves the counts. And that nothing out of a `supports` block reaches the page in either mode.
     *
     * THE FIXTURE BUILDS ON THE STATE THE BLOCK ABOVE LEFT: the WO-6.7 class with Ada flagged for
     * `missing-count`, Cara and Drew quiet. It adds two classes, in this order after it:
     *
     *   WO-6.4 Main    Gus, Ben, then six students on the WO-6.7 missing shape (three warmups marked
     *                  missing, one task at 90, the rest blank — exactly one hit each). Gus has every
     *                  task at 95 and the warmups excused: two praise rules, no concern. Ben has the
     *                  missing warmups and three 85s: `missing-count` AND `grade-rose` — the student
     *                  on BOTH lists. The sixth missing student and Gus's run of strong scores are
     *                  each silenced by a contact two days back, so each column has a cooldown foot.
     *   WO-6.4 Absent  Abe alone, absent at nine recorded meetings: three attendance rules.
     *
     * SO THE RULED ORDER IS NOT THE ROSTER ORDER IN EITHER COLUMN, which is what makes "ranked the way
     * WO-4.2 ranks" a measurement: Abe's class is last and he leads the concern column only because
     * attendance bands first; Gus is ahead of Ben on the roster and behind him in praise only because
     * a climb bands ahead of a count. Eight concern rows is four drawn and `and 4 more`.
     *
     * Plus a reminder today and a grades-due date today, and the blanks the missing shape leaves, so
     * all five sections are on the page at once.
     */
    console.log('\n--- the glance page: who needs you, and the page as a whole (WO-6.4) ---');
    const CLS64 = 'c_wo64', TERM64 = 'tm_wo64', ABS64 = 'c_wo64abs', ABSTERM64 = 'tm_wo64abs';
    const GUS64 = 's_wo64gus', BEN64 = 's_wo64ben', ABE64 = 's_wo64abe';
    const MISS64 = [1, 2, 3, 4, 5, 6].map(n => 's_wo64m' + n);
    const NAMES64 = ['Wo64Gus', 'Wo64Ben', 'Wo64Abe', 'Wo64Miss', 'Wo67Flagged'];
    const modeWas64 = await evalJs('window.planbook.supports.presentationMode()');
    await evalJs('window.planbook.supports.setPresentationMode(false); 1');
    const plant64 = await probe(`
      var back = function(n){ return shift(-n); };
      var stamp = function(iso){
        var o = -new Date().getTimezoneOffset();
        var p = function(n){ return (n < 10 ? '0' : '') + n; };
        return iso + 'T09:00:00' + (o < 0 ? '-' : '+') + p(Math.floor(Math.abs(o) / 60)) + ':' + p(Math.abs(o) % 60); };
      if (!Array.isArray(doc.attendance)) doc.attendance = [];
      if (!Array.isArray(doc.log)) doc.log = [];
      doc.students.push({ id:'${GUS64}', first:'Gus', last:'Wo64Gus' });
      doc.students.push({ id:'${BEN64}', first:'Ben', last:'Wo64Ben' });
      doc.students.push({ id:'${ABE64}', first:'Abe', last:'Wo64Abe' });
      ${JSON.stringify(MISS64)}.forEach(function(id, i){
        doc.students.push({ id:id, first:'M' + (i + 1), last:'Wo64Miss' + (i + 1) }); });
      doc.classes.push({ id:'${CLS64}', name:'WO-6.4 Main', archived:false,
        roster:['${GUS64}', '${BEN64}'].concat(${JSON.stringify(MISS64)}), letterScale:null,
        terms:[{ id:'${TERM64}', label:'WO-6.4 Term', start:shift(-40), end:shift(40) }],
        categories:[{ id:'k_wo64', name:'All work', weight:100 }]});
      doc.classes.push({ id:'${ABS64}', name:'WO-6.4 Absent', archived:false, roster:['${ABE64}'],
        letterScale:null, terms:[{ id:'${ABSTERM64}', label:'WO-6.4 Absent Term', start:shift(-40), end:shift(40) }],
        categories:[{ id:'k_wo64abs', name:'All work', weight:100 }]});
      for (var n = 1; n <= 3; n++) {
        doc.assignments.push({ id:'a_wo64_s' + n, classId:'${CLS64}', termId:'${TERM64}', categoryId:'k_wo64',
          name:'WO-6.4 Warmup ' + n, points:10, assigned:back(30), due:back(25) });
      }
      for (var m = 1; m <= 8; m++) {
        doc.assignments.push({ id:'a_wo64_' + m, classId:'${CLS64}', termId:'${TERM64}', categoryId:'k_wo64',
          name:'WO-6.4 Task ' + m, points:100, assigned:back(30), due:back(20) });
      }
      var put = function(id, sid, cell){ doc.scores[id] = doc.scores[id] || {}; doc.scores[id][sid] = cell; };
      ['${BEN64}'].concat(${JSON.stringify(MISS64)}).forEach(function(sid){
        for (var i = 1; i <= 3; i++) put('a_wo64_s' + i, sid, { v: null, flag: 'missing' }); });
      ${JSON.stringify(MISS64)}.forEach(function(sid){ put('a_wo64_1', sid, { v: 90 }); });
      [1, 2, 3].forEach(function(k){ put('a_wo64_' + k, '${BEN64}', { v: 85 }); });
      for (var g = 1; g <= 3; g++) put('a_wo64_s' + g, '${GUS64}', { v: null, flag: 'excused' });
      for (var t = 1; t <= 8; t++) put('a_wo64_' + t, '${GUS64}', { v: 95 });
      for (var d = 9; d >= 1; d--) {
        var marks = {}; marks['${ABE64}'] = { code: 'A' };
        doc.attendance.push({ classId:'${ABS64}', date:back(d), marks: marks });
      }
      doc.log.push({ id:'l_wo64_m6', studentId:'${MISS64[5]}', at:stamp(back(2)), kind:'contact',
        audience:'guardian', subject:'Missing work', body:'', ruleId:'missing-count' });
      doc.log.push({ id:'l_wo64_gus', studentId:'${GUS64}', at:stamp(back(2)), kind:'contact',
        audience:'guardian', subject:'Great run', body:'', ruleId:'high-score-run' });
      doc.events.push({ id:'e_wo64_rem', date:shift(0), endDate:shift(0), kind:'reminder',
        title:'WO-6.4 reminder', classIds:[], studentId:'', notes:'', seriesId:'' });
      doc.events.push({ id:'e_wo64_gd', date:shift(0), endDate:shift(0), kind:'grades-due',
        title:'WO-6.4 grades due', classIds:[], studentId:'', notes:'', seriesId:'' });`);

    /* The page's attention panel, and the signals screen's own model asked on arrival order, in one
       read — so every ordering claim below compares the glass to that screen's model rather than to a
       ranking typed into this file. */
    const PANEL64 = `(function(){
      var view = document.getElementById('homeView');
      var stack = document.getElementById('glanceStack');
      var panel = view ? view.querySelector('[data-glance-panel="attention"]') : null;
      var sv = window.planbook.signalsView;
      sv.resetSignals('');
      var model = sv.signalsModel();
      var col = function(dir){
        var c = panel ? panel.querySelector('.sig-col.' + dir) : null;
        if (!c) return null;
        var more = c.querySelector('.gl-more');
        var held = c.querySelector('.sig-hidden');
        return {
          head: (c.querySelector('.sig-col-head') || {}).textContent || '',
          rows: Array.prototype.map.call(c.querySelectorAll('.sig-list > *'), function(b){
            return { tag: b.tagName, type: b.type || '', cls: b.className,
              open: b.getAttribute('data-signals-open'), column: b.getAttribute('data-signals-column'),
              key: b.getAttribute('data-signals-key'),
              name: (b.querySelector('.sig-row-name') || {}).textContent || '',
              text: b.textContent,
              shape: Array.prototype.map.call(b.children, function(n){ return n.className; }).join('|') }; }),
          empty: (c.querySelector('.sig-col-empty') || {}).textContent || null,
          more: more ? { text: more.textContent, open: more.getAttribute('data-signals-open'),
            column: more.getAttribute('data-signals-column'), key: more.getAttribute('data-signals-key') } : null,
          held: held ? { text: held.textContent, open: held.getAttribute('data-signals-open'),
            column: held.getAttribute('data-signals-column') } : null };
      };
      var chips = 0, each = {};
      Array.prototype.forEach.call(document.querySelectorAll('#homeGrid [data-class-tab]'), function(card){
        Array.prototype.forEach.call(card.querySelectorAll('.class-card-count'), function(chip){
          var m = /^(\\d+) needs? you$/.exec(chip.textContent);
          if (m) { chips += Number(m[1]); each[card.getAttribute('data-class-tab')] = chip.textContent; } }); });
      return {
        view: (document.querySelector('main > :not(.hidden)') || {}).id || '',
        order: stack ? Array.prototype.map.call(stack.children, function(n){
          return n.getAttribute('data-glance-panel') || (n.querySelector('#homeGrid') ? 'grid' : '?'); }) : [],
        panel: !!panel,
        title: panel ? (panel.querySelector('.panel-title h2') || {}).textContent : '',
        doors: panel ? Array.prototype.map.call(panel.querySelectorAll('.panel-title-actions button'), function(b){
          return b.getAttribute('data-signals-open') + '=' + b.textContent; }) : [],
        quietDoors: view ? view.querySelectorAll('[data-signals-open="quiet"]').length : -1,
        quietPanel: !!document.getElementById('glanceQuiet'),
        shut: panel ? !!panel.querySelector('.gl-shut') : false,
        shutText: panel && panel.querySelector('.gl-shut') ? panel.querySelector('.gl-shut').textContent : '',
        two: panel ? !!panel.querySelector('.sig-two') : false,
        keyed: panel ? panel.querySelectorAll('[data-signals-key]').length : -1,
        concern: col('concern'), praise: col('praise'),
        chips: chips, each: each,
        reading: (function(){ var r = window.planbook.glance.signalReading();
          return { hits: r.hits.length, held: r.suppressed.map(function(x){ return x.hit.direction + ':' + x.hit.ruleId; }).sort(),
            quiet: r.quiet.length }; })(),
        model: { blocked: model.blocked,
          concern: model.concern.rows.map(function(r){ return r.key; }),
          praise: model.praise.rows.map(function(r){ return r.key; }),
          concernHead: 'Concern · ' + model.concern.count + model.concern.note,
          praiseHead: 'Praise · ' + model.praise.count + model.praise.note,
          names: model.all.reduce(function(o, r){ o[r.key] = r.name; return o; }, {}),
          leads: model.concern.rows.map(function(r){ return r.studentId.slice(-4) + ':' + r.lead.ruleId; }),
          praiseLeads: model.praise.rows.map(function(r){ return r.studentId.slice(-4) + ':' + r.lead.ruleId; }),
          quiet: model.quiet.count },
        html: view ? view.outerHTML : '' }; })()`;
    const key64 = (sid, cid) => sid + '|' + cid;
    const p64 = await evalJs(PANEL64);
    const C64 = p64.concern || { rows: [] }, P64 = p64.praise || { rows: [] };

    check('the WO-6.4 fixture is real: the signals screen\'s own model ranks EIGHT concern rows with Abe '
      + 'first on attendance though his class is last, TWO praise rows with Ben\'s climb ahead of Gus '
      + 'though Gus is first on the roster, Ben on both lists, and one hit held by the cooldown in each '
      + 'direction',
      plant64.view === 'homeView' && p64.model.blocked === false
        && p64.model.concern.length === 8 && p64.model.praise.length === 2
        && p64.model.concern[0] === key64(ABE64, ABS64)
        && /^4abe:(absence|attendance)-/.test(p64.model.leads[0])
        && p64.model.praise.join(',') === [key64(BEN64, CLS64), key64(GUS64, CLS64)].join(',')
        && p64.model.concern.indexOf(key64(BEN64, CLS64)) !== -1
        && p64.reading.held.join(',') === 'concern:missing-count,praise:high-score-run',
      JSON.stringify({ concern: p64.model.leads, praise: p64.model.praiseLeads, held: p64.reading.held,
        hits: p64.reading.hits }));

    /* ── acceptance line 1: the five sections, in order, and every control in them is a door ── */
    const doors64 = await evalJs(`(function(){
      var stack = document.getElementById('glanceStack');
      var HOOKS = ['data-class-tab', 'data-calendar-open', 'data-calendar-item', 'data-scores-open', 'data-signals-open'];
      return Array.prototype.map.call(stack.children, function(panel){
        var name = panel.getAttribute('data-glance-panel') || 'grid';
        var shown = Array.prototype.filter.call(panel.querySelectorAll('button'), function(b){
          var r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
        var dead = shown.filter(function(b){
          return !HOOKS.some(function(h){ return b.hasAttribute(h); }); });
        return { name: name, buttons: shown.length,
          dead: dead.map(function(b){ return b.className + ':' + b.textContent.slice(0, 30); }) }; }); })()`);
    const doorsBy = (n) => doors64.filter(d => d.name === n)[0] || { buttons: 0, dead: ['missing'] };
    check('the five sections appear in the page\'s order — the class grid, today and this week, waiting '
      + 'to be graded, who needs you, closing in — and every visible control in every one of them '
      + 'carries a route hook the one click listener handles: a card, a calendar door, a chip, a score '
      + 'column, or a door onto the signals screen',
      p64.order.join(',') === 'grid,week,queue,attention,closing'
        && doors64.every(d => d.dead.length === 0)
        && doorsBy('grid').buttons >= 4 && doorsBy('week').buttons >= 1 && doorsBy('queue').buttons >= 1
        && doorsBy('attention').buttons >= 2 + 6 + 3 && doorsBy('closing').buttons >= 1,
      JSON.stringify({ order: p64.order, doors: doors64 }));

    /* One item from each of the five, walked in the page's order. */
    const land64 = `(function(){
      var open = document.querySelector('.modal-overlay:not(.hidden)');
      return { view: (document.querySelector('main > :not(.hidden)') || {}).id || '',
        modal: open ? open.id : '', openClass: window.planbook.classes.getSelectedClassId() }; })()`;
    const closeAll64 = async () => await evalJs(`(function(){
      var open = document.querySelectorAll('.modal-overlay:not(.hidden)');
      Array.prototype.forEach.call(open, function(o){ window.planbook.closeModal(o); });
      return open.length; })()`);
    const walk64 = {};
    await clickSel('#homeGrid [data-class-tab="' + CLS64 + '"]');
    await new Promise(r => setTimeout(r, 300));
    walk64.grid = await evalJs(land64);
    await closeAll64(); await goHome67();
    await clickSel('#homeView [data-glance-panel="week"] .gl-row');
    await new Promise(r => setTimeout(r, 300));
    walk64.week = await evalJs(land64);
    await closeAll64(); await goHome67();
    await clickSel('#homeView [data-glance-panel="queue"] .gl-row');
    await new Promise(r => setTimeout(r, 400));
    walk64.queue = await evalJs(land64);
    await closeAll64(); await goHome67();
    await clickSel('#homeView [data-glance-panel="attention"] .sig-row');
    await new Promise(r => setTimeout(r, 400));
    walk64.attention = await evalJs(land64);
    await closeAll64(); await goHome67();
    await clickSel('#homeView [data-glance-panel="closing"] .gl-row');
    await new Promise(r => setTimeout(r, 300));
    walk64.closing = await evalJs(land64);
    await closeAll64(); await goHome67();
    check('and one item from each of the five, tapped in the page\'s order, lands where it resolves: the '
      + 'card on its class, the week row on the calendar, the queue row on the score grid, the '
      + 'who-needs-you row on the signals screen with a signal card open, the closing-in row on the '
      + 'events panel',
      walk64.grid.view === 'classView' && walk64.grid.openClass === CLS64
        && walk64.week.view === 'calendarView'
        && walk64.queue.view === 'scoresView'
        && walk64.attention.view === 'signalsView' && walk64.attention.modal === 'signalCardModal'
        && walk64.closing.modal === 'eventsModal',
      JSON.stringify(walk64));

    /* ── acceptance line 2: the rows are that screen's rows, in that screen's order ── */
    await rehome67();
    const q64 = await evalJs(PANEL64);
    const Cq = q64.concern || { rows: [] }, Pq = q64.praise || { rows: [] };
    check('panel 4 draws two columns in src/signals-view.css\'s own classes, headed exactly as the signals '
      + 'screen heads them — `Concern · 8` with the ruled note and `Praise · 2` with the climb note — '
      + 'and each column\'s rows are THAT SCREEN\'S MODEL\'S FIRST FOUR KEYS IN THAT ORDER: four concern '
      + 'rows led by Abe and both praise rows, Ben ahead of Gus; every row a <button type="button"> '
      + 'wearing .sig-row',
      q64.panel && q64.two && q64.title === 'Who needs you'
        && Cq.head === q64.model.concernHead && Pq.head === q64.model.praiseHead
        && Cq.rows.map(r => r.key).join(',') === q64.model.concern.slice(0, 4).join(',')
        && Pq.rows.map(r => r.key).join(',') === q64.model.praise.join(',')
        && Cq.rows.length === 4 && Pq.rows.length === 2
        && Cq.rows.concat(Pq.rows).every(r => r.tag === 'BUTTON' && r.type === 'button'
          && r.cls === 'sig-row' && r.open === 'card'),
      JSON.stringify({ heads: [Cq.head, Pq.head], want: [q64.model.concernHead, q64.model.praiseHead],
        concern: Cq.rows.map(r => r.key), model: q64.model.concern, praise: Pq.rows.map(r => r.key) }));

    const dist64 = new Set(Cq.rows.concat(Pq.rows).map(r => r.key));
    const onBoth64 = Cq.rows.filter(r => Pq.rows.some(p => p.key === r.key)).length;
    const modelBoth64 = q64.model.concern.filter(k => q64.model.praise.indexOf(k) !== -1).length;
    check('the students drawn plus the `and N more` foot equal the sum of the cards\' `N need you` chips, '
      + 'read off the glass: 4 + 2 drawn and `and 4 more` is 10, the chips are 1 + 7 + 1 = 9, and the one '
      + 'difference is Ben — one student on the card and a row in each column, the only student on '
      + 'both lists, drawn in both — so over DISTINCT students the panel and the chips are one number; '
      + 'and a column of four or fewer draws no foot',
      !!Cq.more && Cq.more.text === 'and 4 more›' && Cq.more.open === 'more' && Cq.more.column === 'concern'
        && Cq.more.key === q64.model.concern[4] && !Pq.more
        && q64.each[CLS] === '1 needs you' && q64.each[CLS64] === '7 need you' && q64.each[ABS64] === '1 needs you'
        && Cq.rows.length + Pq.rows.length + 4 === q64.chips + onBoth64
        && onBoth64 === 1 && modelBoth64 === 1 && dist64.has(key64(BEN64, CLS64))
        && dist64.size + (q64.model.concern.length - 4) === q64.chips,
      JSON.stringify({ drawn: [Cq.rows.length, Pq.rows.length], more: Cq.more, praiseMore: Pq.more,
        chips: q64.chips, each: q64.each, onBoth: onBoth64, distinct: dist64.size }));

    /* Every drawn row, tapped, opens THAT student's card on the signals screen — and the column is
       honoured: closing Ben's card from the PRAISE column puts focus back on his praise row. */
    const taps64 = [];
    for (const [dir, rows] of [['concern', Cq.rows], ['praise', Pq.rows]]) {
      for (const r of rows) {
        await goHome67();
        await clickSel('#homeView [data-glance-panel="attention"] .sig-col.' + dir + ' [data-signals-key="' + r.key + '"]');
        await new Promise(res => setTimeout(res, 400));
        const at = await evalJs(`(function(){
          var modal = document.getElementById('signalCardModal');
          var target = window.planbook.signalsView.openCardTarget();
          var out = { view: (document.querySelector('main > :not(.hidden)') || {}).id || '',
            open: !!modal && !modal.classList.contains('hidden'),
            title: (document.getElementById('signalCardTitle') || {}).textContent || '',
            target: target ? target.studentId + '|' + target.classId : '' };
          window.planbook.closeModal(modal);
          var f = document.activeElement;
          out.focusKey = f ? f.getAttribute('data-signal-row') : null;
          out.focusList = f && f.parentNode ? f.parentNode.id : '';
          return out; })()`);
        taps64.push(Object.assign({ dir: dir, key: r.key, want: q64.model.names[r.key] }, at));
      }
    }
    await goHome67();
    check('EVERY student drawn in either column taps through to THAT student\'s signal card on WO-4.2\'s '
      + 'screen — six taps, six cards, each titled with the row\'s own student and targeting her row\'s '
      + 'key — and closing the card returns focus to her row in the column she was tapped in (Ben\'s '
      + 'praise tap to #signalsPraiseList, his concern tap to #signalsList)',
      taps64.length === 6 && taps64.every(t => t.view === 'signalsView' && t.open && t.title === t.want
        && t.target === t.key && t.focusKey === t.key
        && t.focusList === (t.dir === 'praise' ? 'signalsPraiseList' : 'signalsList')),
      JSON.stringify(taps64.map(t => ({ dir: t.dir, key: t.key, title: t.title, want: t.want,
        target: t.target, focus: t.focusList + '/' + t.focusKey }))));

    /* The row on the glance page and the row on the screen, for the same student: same pieces, same words. */
    await clickSel('#homeView [data-glance-panel="attention"] .sig-col.concern [data-signals-key="' + key64(ABE64, ABS64) + '"]');
    await new Promise(r => setTimeout(r, 400));
    const there64 = await evalJs(`(function(){
      window.planbook.closeModal(document.getElementById('signalCardModal'));
      var b = document.querySelector('#signalsList [data-signal-row="${key64(ABE64, ABS64)}"]');
      return b ? { text: b.textContent, shape: Array.prototype.map.call(b.children, function(n){ return n.className; }).join('|') } : null; })()`);
    await goHome67();
    const here64 = Cq.rows[0] || {};
    check('the glance row and the signals screen\'s row for the same student are the same row — the same '
      + 'child elements in the same classes (avatar, name block, figure, chevron) and the same words, '
      + 'Abe\'s attendance sentence and his tags included',
      !!there64 && here64.key === key64(ABE64, ABS64) && here64.shape === there64.shape
        && here64.text === there64.text && /Wo64Abe/.test(here64.text),
      JSON.stringify({ here: { shape: here64.shape, text: here64.text }, there: there64 }));

    /* ── the feet and the header doors ── */
    await clickSel('#homeView [data-glance-panel="attention"] .gl-more');
    await new Promise(r => setTimeout(r, 400));
    const more64 = await evalJs(`(function(){ var f = document.activeElement;
      var r = f ? f.getBoundingClientRect() : null;
      return { view: (document.querySelector('main > :not(.hidden)') || {}).id || '',
        modal: !!document.querySelector('.modal-overlay:not(.hidden)'),
        key: f ? f.getAttribute('data-signal-row') : null, list: f && f.parentNode ? f.parentNode.id : '',
        top: r ? Math.round(r.top) : null, inner: window.innerHeight }; })()`);
    await goHome67();
    await clickSel('#homeView [data-glance-panel="attention"] .sig-col.concern .sig-hidden');
    await new Promise(r => setTimeout(r, 400));
    const heldC64 = await evalJs(`(function(){ var m = window.planbook.signalsView.signalsModel();
      var list = document.getElementById('signalsConcernQuiet');
      return { view: (document.querySelector('main > :not(.hidden)') || {}).id || '',
        expanded: m.concern.expanded, praiseExpanded: m.praise.expanded,
        shown: list ? !list.classList.contains('hidden') && list.children.length : 0,
        focus: document.activeElement ? document.activeElement.id : '' }; })()`);
    await goHome67();
    await clickSel('#homeView [data-glance-panel="attention"] .sig-col.praise .sig-hidden');
    await new Promise(r => setTimeout(r, 400));
    const heldP64 = await evalJs(`(function(){ var m = window.planbook.signalsView.signalsModel();
      var list = document.getElementById('signalsPraiseQuiet');
      return { expanded: m.praise.expanded, concernExpanded: m.concern.expanded,
        shown: list ? !list.classList.contains('hidden') && list.children.length : 0,
        focus: document.activeElement ? document.activeElement.id : '' }; })()`);
    await goHome67();
    await clickSel('#homeView [data-glance-panel="attention"] [data-signals-open="list"]');
    await new Promise(r => setTimeout(r, 400));
    const list64 = await evalJs(`(function(){ var m = window.planbook.signalsView.signalsModel();
      return { view: (document.querySelector('main > :not(.hidden)') || {}).id || '', filter: m.classId,
        sort: m.sort, modal: !!document.querySelector('.modal-overlay:not(.hidden)') }; })()`);
    await goHome67();
    await clickSel('#homeView [data-glance-panel="attention"] [data-signals-open="quiet"]');
    await new Promise(r => setTimeout(r, 400));
    const quiet64 = await evalJs(`(function(){ return { view: (document.querySelector('main > :not(.hidden)') || {}).id || '',
      head: (document.getElementById('signalsQuietHead') || {}).textContent || '',
      focus: document.activeElement ? document.activeElement.id : '' }; })()`);
    await goHome67();
    check('the feet and the header are doors onto that screen, not expansions here: `and 4 more ›` lands '
      + 'with focus on the FIRST row the panel did not draw, in the concern list, scrolled into view; '
      + 'each cooldown foot lands with THAT column\'s suppressed rows open and the other closed, focus '
      + 'on its foot; `The full list` lands on the screen with every class on the ruled order and no card; '
      + 'and `The quiet middle · N` lands on the quiet-middle panel with the same N',
      more64.view === 'signalsView' && !more64.modal && more64.key === q64.model.concern[4]
        && more64.list === 'signalsList' && more64.top >= 0 && more64.top < more64.inner
        && heldC64.view === 'signalsView' && heldC64.expanded === true && heldC64.praiseExpanded === false
        && heldC64.shown === 1 && heldC64.focus === 'signalsConcernHidden'
        && heldP64.expanded === true && heldP64.concernExpanded === false && heldP64.shown === 1
        && heldP64.focus === 'signalsPraiseHidden'
        && list64.view === 'signalsView' && list64.filter === '' && list64.sort === 'ruled' && !list64.modal
        && quiet64.view === 'signalsView' && quiet64.focus === 'signalsQuietHead'
        && q64.doors.indexOf('quiet=' + quiet64.head) !== -1,
      JSON.stringify({ more: more64, heldConcern: heldC64, heldPraise: heldP64, list: list64,
        quiet: quiet64, doors: q64.doors }));
    check('the quiet-middle door has ONE home on this page: panel 4\'s header carries it, the quiet panel '
      + 'is not drawn, and there is exactly one `data-signals-open="quiet"` under #homeView; the two '
      + 'cooldown feet say the signals screen\'s own words with the › of a door',
      q64.quietDoors === 1 && !q64.quietPanel
        && q64.doors.length === 2 && /^quiet=The quiet middle/.test(q64.doors[0])
        && q64.doors[1] === 'list=The full list'
        && !!Cq.held && Cq.held.text === '1 you wrote about recently · show it›' && Cq.held.open === 'held'
        && !!Pq.held && Pq.held.text === '1 you wrote about recently · show it›' && Pq.held.column === 'praise',
      JSON.stringify({ quietDoors: q64.quietDoors, quietPanel: q64.quietPanel, doors: q64.doors,
        feet: [Cq.held, Pq.held] }));

    /* ── acceptance line 5: support data planted on every fixture student, in both modes ── */
    await probe(`doc.students.forEach(function(p){
      if (String(p.id).indexOf('s_wo64') !== 0 && p.id !== '${ADA}') return;
      p.supports = { plan: '504', caseManager: { name: 'Wo64CaseManager', email: 'wo64cm@example.org' },
        reviewDate: p.id === '${ABE64}' ? shift(0) : '',
        accommodations: [{ kind: 'extended-time', detail: 'Wo64AccommodationDetail', appliesTo: [] }],
        medical: 'Wo64MedicalText', behaviorPlan: 'Wo64BehaviorPlanText' }; });`);
    const SUPPORT64 = /Wo64CaseManager|wo64cm@|Wo64AccommodationDetail|Wo64MedicalText|Wo64BehaviorPlanText|Extended time|extended-time|\b504\b|\bIEP\b/;
    const out64 = await evalJs(PANEL64);
    const outReview64 = /1 review coming up/.test(out64.html);

    /* ── acceptance line 4: the REAL control, pressed with the page up ── */
    await clickVisible('[data-presentation-toggle]');
    await new Promise(r => setTimeout(r, 300));
    const on64 = await evalJs(PANEL64);
    const onMode64 = await evalJs('window.planbook.supports.presentationMode()');
    await clickVisible('[data-presentation-toggle]');
    await new Promise(r => setTimeout(r, 300));
    const off64 = await evalJs(PANEL64);
    const offMode64 = await evalJs('window.planbook.supports.presentationMode()');
    const namesIn = (html) => NAMES64.filter(n => html.indexOf(n) !== -1);
    check('with presentation mode switched ON through its real control while the page is up — no '
      + 're-arrival — panel 4 is SHUT: its header and both doors stay, the columns are not in the tree '
      + '(no .sig-two, no keyed row, no foot), no fixture student\'s name is anywhere in #homeView\'s '
      + 'markup, attributes included, and the refusal keeps the counts — `8 students are flagged and 2 '
      + 'are climbing` — while the cards\' chips are unchanged',
      onMode64 === true && on64.view === 'homeView' && on64.panel && on64.shut && !on64.two
        && on64.keyed === 0 && !on64.concern && !on64.praise
        && on64.doors.length === 2 && on64.order.join(',') === 'grid,week,queue,attention,closing'
        && namesIn(on64.html).length === 0
        && /^🔒Not while you are projecting\.8 students are flagged and 2 are climbing\./.test(on64.shutText)
        && on64.chips === q64.chips,
      JSON.stringify({ mode: onMode64, shut: on64.shut, two: on64.two, keyed: on64.keyed,
        text: on64.shutText, names: namesIn(on64.html), chips: on64.chips }));
    check('and switched OFF the same way, the columns are back at once with the same rows',
      offMode64 === false && off64.two && !off64.shut
        && (off64.concern || { rows: [] }).rows.map(r => r.key).join(',') === Cq.rows.map(r => r.key).join(',')
        && (off64.praise || { rows: [] }).rows.length === 2,
      JSON.stringify({ mode: offMode64, two: off64.two, shut: off64.shut }));
    check('with a plan type, an accommodation, medical text, behavior-plan text and a case manager '
      + 'planted on every student on the page, NONE of them is in #homeView\'s markup in presentation '
      + 'mode or out of it; the one supports-derived thing on the page is the review COUNT, present '
      + 'with the mode off and gone with it on',
      !SUPPORT64.test(out64.html) && !SUPPORT64.test(on64.html) && !SUPPORT64.test(off64.html)
        && outReview64 && !/review coming up/.test(on64.html),
      JSON.stringify({ off: (out64.html.match(SUPPORT64) || [null])[0], on: (on64.html.match(SUPPORT64) || [null])[0],
        reviewOff: outReview64, reviewOn: /review coming up/.test(on64.html) }));

    /* ── panel 4's controls on a pointer that is really coarse ── */
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
    await send('Emulation.setDeviceMetricsOverride', { width: 1024, height: 768, deviceScaleFactor: 2, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 700));
    await waitForBoot();
    await evalJs(KILL_ANIM);
    const coarse64 = await evalJs("matchMedia('(pointer: coarse)').matches");
    if ((await onView67()) !== 'homeView') await goHome67();
    const sizes64 = await evalJs(`(function(){
      var panel = document.querySelector('#homeView [data-glance-panel="attention"]');
      return panel ? Array.prototype.map.call(panel.querySelectorAll('button'), function(b){
        var r = b.getBoundingClientRect();
        return { cls: b.className, h: Math.round(r.height * 100) / 100, w: Math.round(r.width) }; }) : null; })()`);
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 600, deviceScaleFactor: 1, mobile: false });
    await send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 600));
    await waitForBoot();
    await evalJs(KILL_ANIM);
    if ((await onView67()) !== 'homeView') await goHome67();
    check('under an emulated coarse pointer every control in panel 4 — the two header doors, six rows, '
      + '`and 4 more` and both cooldown feet — measures at least 44px each way',
      coarse64 === true && Array.isArray(sizes64) && sizes64.length === 2 + 6 + 1 + 2
        && sizes64.every(b => b.h >= 44 && b.w >= 44),
      'coarse = ' + coarse64 + ', ' + JSON.stringify(sizes64));

    await evalJs('window.planbook.supports.setPresentationMode(' + (modeWas64 ? 'true' : 'false') + '); 1');

    /* The open class goes back to what it was before the taps above moved it. */
    await evalJs('window.planbook.setPref(' + JSON.stringify('openClassId') + ', '
      + JSON.stringify(openClassWas68 == null ? '' : openClassWas68) + '); 1');
  }

  /* ── and the fixture comes back off, flag by flag ── */
  const cleaned67 = await evalJs(`(function(){
    var s = window.planbook.store;
    var stash = ${JSON.stringify((plant67 && plant67.stash) || { archived: [], events: [], reviews: [] })};
    s.update(function(doc){
      doc.classes = (doc.classes || []).filter(function(c){ return c.id !== '${CLS}' && c.id !== 'c_wo68'
        && c.id !== 'c_wo64' && c.id !== 'c_wo64abs'; });
      doc.attendance = (doc.attendance || []).filter(function(r){ return r.classId !== 'c_wo64abs'; });
      doc.students = (doc.students || []).filter(function(p){
        return String(p.id).indexOf('s_wo67') !== 0 && String(p.id).indexOf('s_wo68') !== 0
          && String(p.id).indexOf('s_wo64') !== 0; });
      doc.assignments = (doc.assignments || []).filter(function(a){
        return String(a.id).indexOf('a_wo67_') !== 0 && String(a.id).indexOf('a_wo68_') !== 0
          && String(a.id).indexOf('a_wo64_') !== 0; });
      doc.events = (doc.events || []).filter(function(e){
        return String(e.id).indexOf('e_wo67') !== 0 && String(e.id).indexOf('e_wo68') !== 0
          && String(e.id).indexOf('e_wo64') !== 0; });
      doc.log = (doc.log || []).filter(function(e){
        return String(e.id).indexOf('l_wo67') !== 0 && String(e.id).indexOf('l_wo64') !== 0; });
      if (doc.scores) {
        Object.keys(doc.scores).forEach(function(k){
          if (k.indexOf('a_wo67_') === 0 || k.indexOf('a_wo68_') === 0 || k.indexOf('a_wo64_') === 0) delete doc.scores[k]; });
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
      classes:(d.classes || []).filter(function(c){ return c.id === '${CLS}' || c.id === 'c_wo68'
        || c.id === 'c_wo64' || c.id === 'c_wo64abs'; }).length,
      attendance:(d.attendance || []).filter(function(r){ return r.classId === 'c_wo64abs'; }).length,
      students:(d.students || []).filter(function(p){
        return String(p.id).indexOf('s_wo67') === 0 || String(p.id).indexOf('s_wo68') === 0
          || String(p.id).indexOf('s_wo64') === 0; }).length,
      assignments:(d.assignments || []).filter(function(a){
        return String(a.id).indexOf('a_wo67_') === 0 || String(a.id).indexOf('a_wo68_') === 0
          || String(a.id).indexOf('a_wo64_') === 0; }).length,
      ownEvents:(d.events || []).filter(function(e){
        return String(e.id).indexOf('e_wo67') === 0 || String(e.id).indexOf('e_wo68') === 0
          || String(e.id).indexOf('e_wo64') === 0; }).length,
      log:(d.log || []).filter(function(e){
        return String(e.id).indexOf('l_wo67') === 0 || String(e.id).indexOf('l_wo64') === 0; }).length,
      scores: Object.keys(d.scores || {}).filter(function(k){
        return k.indexOf('a_wo67_') === 0 || k.indexOf('a_wo68_') === 0 || k.indexOf('a_wo64_') === 0; }).length,
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
      && cleaned67.attendance === 0
      && cleaned67.ownEvents === 0 && cleaned67.log === 0 && cleaned67.scores === 0
      && cleaned67.stillArchived === 0
      && cleaned67.eventsBack === cleaned67.eventsOwed && cleaned67.reviewsBack === cleaned67.reviewsOwed
      && (await onView67()) === 'homeView',
    JSON.stringify(cleaned67) + ', left on #' + (await onView67()));
}
}
