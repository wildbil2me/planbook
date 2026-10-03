/* points-grade.mjs — a class graded on total points, read off every screen that prints a grade (WO-3.30)
 *
 * The engine half of WO-3.30 is proved in grade-engine.mjs, on plain fixtures handed straight to the
 * seam. This is the other half: the CALLERS. Seven files read a class grade, and the work order's
 * risk sentence is that they have to agree — a screen left on the weighted formula would print a
 * weighted number for a points class beside a detail screen printing the points one. Nothing a
 * teacher can tap puts a class in points mode until WO-3.31, so the mode is planted on the fixture
 * class directly and every screen is then driven for real.
 *
 * Nothing here launches a browser, a server or a document of its own: the entry file owns all three
 * and hands them over on `h`. `tools/README.md` § "Driving a browser over CDP" says where a new check
 * goes.
 */

export async function run(h) {
const { check, skip, evalJs, clickSel, send, KILL_ANIM, INSTALL_WALKER, waitForBoot } = h;

/* ───────── a points class on every screen (WO-3.30) ─────────
 *
 * THE FIXTURE IS grade-engine.mjs's WO-3.30 CLASS, PLUS ONE PIECE FILED UNDER NO CATEGORY, and both
 * choices are what make the agreement check able to fail:
 *
 *   - Its weights total 75. A caller still on the weighted formula therefore draws NO GRADE AT ALL
 *     for this class (weights-unbalanced), so a stray caller is a dash beside a number rather than
 *     two numbers that might happen to round alike.
 *   - The uncategorized piece counts in points mode and nowhere else. Even a caller that somehow
 *     balanced the weights would miss its 18 of 20.
 *
 *   Essays 110/200 (+50 outstanding) · Quizzes 9/10 + one missing 10 · Homework 5/5 + one excused 5
 *   · no category 18/20.
 *   Earned 110 + 9 + 0 + 5 + 18 = 142. Possible 200 + 10 + 10 + 5 + 20 = 245.
 *   Grade 142/245 = 57.959183…% -> "57.96%" by hand. Under the 65% default, so grade-below fires
 *   and the signals list has a row to read it off.
 *
 * FIVE SURFACES AND THE ENGINE, each read the way a teacher sees it: the score grid's frozen grade
 * cell, the grade sheet dialog's total column, the student detail hero, the signals row's own text,
 * and the `{{grade.percent}}` merge field resolved through a real evaluate() pass. The expected
 * string is the literal above, never one surface's answer compared to another's.
 *
 * AND THE BACKUP, because a mode that does not survive backup and restore is a class that quietly
 * goes back to weighted on the iPad: the year's backup text carries the key, parseBackup() hands it
 * back, and the full restore flow puts it on disk. A document with no `gradingMode` anywhere — the
 * shape every earlier build wrote — restores with nothing added.
 */
console.log('\n--- a class graded on total points, on every screen (WO-3.30) ---');
if (!(await evalJs("!!(window.planbook && window.planbook.gradeEngine"
  + " && typeof window.planbook.gradeEngine.classGrade === 'function')"))) {
  skip('a points class on every screen (WO-3.30)', 'window.planbook.gradeEngine.classGrade is not on '
    + 'the page, so there is no engine to plant a points class against');
} else {
  const CLS = 'c_wo330';
  const TERM = 'tm_wo330';
  const S1 = 'wo330-s1', S2 = 'wo330-s2';
  const S1_FIRST = 'Ada', S1_LAST = 'Quillfeather';
  const GRADE = '57.96%';

  /* Into one of this class's screens the way a teacher gets there — home, the class's card, the
     switcher — from wherever the page is. selectClass() picks the class without changing the view,
     so after a reload the page is still on the home screen and the switcher is not drawn. */
  const openScreen = async (screen) => {
    const on = await evalJs(
      "(function(){var e=document.querySelector('main > :not(.hidden)');return e?e.id:'';})()");
    if (on !== 'homeView') {
      const nth = await evalJs(`(function(){
        var all = document.querySelectorAll('[data-view-home]');
        for (var i = 0; i < all.length; i++) {
          var r = all[i].getBoundingClientRect();
          if (r.width > 0 && r.height > 0) return i;
        }
        return -1; })()`);
      if (nth < 0) throw new Error('no visible [data-view-home] to go home by');
      await clickSel('[data-view-home]', nth);
      await new Promise(r => setTimeout(r, 250));
    }
    await clickSel('#homeGrid [data-class-tab="' + CLS + '"]');
    await new Promise(r => setTimeout(r, 250));
    await clickSel('#classView [data-class-screen="' + screen + '"]');
    await new Promise(r => setTimeout(r, 400));
  };

  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  await send('Emulation.setDeviceMetricsOverride',
    { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  await waitForBoot();
  await evalJs(KILL_ANIM);
  await evalJs(INSTALL_WALKER);

  const plant = await evalJs(`(function(){
    var s = window.planbook.store, c = window.planbook.classes;
    var d = s.getDoc();
    if (!d) return { ok:false, why:'no year document is open' };
    var was = c.getSelectedClassId();
    var mode = window.planbook.supports.presentationMode();
    window.planbook.supports.setPresentationMode(false);
    s.update(function(doc){
      if (!Array.isArray(doc.classes)) doc.classes = [];
      if (!Array.isArray(doc.students)) doc.students = [];
      if (!Array.isArray(doc.assignments)) doc.assignments = [];
      if (!doc.scores) doc.scores = {};
      doc.students.push({ id:'${S1}', first:'${S1_FIRST}', last:'${S1_LAST}' },
        { id:'${S2}', first:'Bea', last:'Marchbanks' });
      /* THE MODE IS WRITTEN HERE AND NOWHERE ELSE: no control can write it until WO-3.31. */
      doc.classes.push({ id:'${CLS}', name:'WO-3.30 Points', archived:false, gradingMode:'points',
        roster:['${S1}','${S2}'], letterScale:null,
        terms:[{ id:'${TERM}', label:'WO-3.30 Term', start:'2026-09-01', end:'2026-11-06' }],
        categories:[
          { id:'cat330e', name:'Essays', weight:40 },
          { id:'cat330q', name:'Quizzes', weight:20 },
          { id:'cat330h', name:'Homework', weight:15 }]});
      var add = function(id, cat, name, points, due){
        var a = { id:id, classId:'${CLS}', termId:'${TERM}', name:name, points:points,
          assigned:'2026-09-08', due:due };
        if (cat) a.categoryId = cat;
        doc.assignments.push(a);
      };
      add('a330e1', 'cat330e', 'Personal essay', 200, '2026-09-12');
      add('a330e2', 'cat330e', 'Argument essay', 50, '2026-10-20');   /* outstanding */
      add('a330q1', 'cat330q', 'Vocab quiz 1', 10, '2026-09-14');
      add('a330q2', 'cat330q', 'Vocab quiz 2', 10, '2026-09-21');     /* marked missing */
      add('a330h1', 'cat330h', 'Annotation 1', 5, '2026-09-15');
      add('a330h2', 'cat330h', 'Annotation 2', 5, '2026-09-22');      /* excused */
      add('a330r1', null, 'Reading log', 20, '2026-09-25');           /* NO category */
      doc.scores['a330e1'] = { '${S1}': { v:110 }, '${S2}': { v:190 } };
      doc.scores['a330q1'] = { '${S1}': { v:9 },   '${S2}': { v:10 } };
      doc.scores['a330q2'] = { '${S1}': { v:null, flag:'missing' }, '${S2}': { v:10 } };
      doc.scores['a330h1'] = { '${S1}': { v:5 },   '${S2}': { v:5 } };
      doc.scores['a330h2'] = { '${S1}': { v:null, flag:'excused' }, '${S2}': { v:5 } };
      doc.scores['a330r1'] = { '${S1}': { v:18 },  '${S2}': { v:20 } };
    });
    c.selectClass('${CLS}');
    c.selectTerm('${TERM}');
    var cls = (s.getDoc().classes || []).filter(function(x){ return x.id === '${CLS}'; })[0];
    var w = cls.categories.reduce(function(n, k){ return n + k.weight; }, 0);
    return { ok:true, was: was, mode: mode, weights: w, gradingMode: cls.gradingMode,
      engine: window.planbook.gradeEngine.classGrade(s.getDoc(), cls, '${TERM}', '${S1}') };
  })()`);

  if (!plant.ok) {
    check('the WO-3.30 fixture is real: a points class whose weights total 75, with work under no category',
      false, plant.why);
  } else {
    check('the WO-3.30 fixture is real: a points class whose weights total 75, with a piece filed under '
      + 'no category, and the engine grades it at 142/245',
      plant.gradingMode === 'points' && plant.weights === 75
        && Math.abs(plant.engine.percentage - 57.9591836734694) < 1e-9,
      'mode ' + plant.gradingMode + ', weights ' + plant.weights + ', engine '
        + plant.engine.percentage + ' (' + plant.engine.reason + ')');

    /* ── the score grid ── */
    await openScreen('scores');
    const grid = await evalJs(`(function(){
      var tr = document.querySelector('#scoresBody tr[data-score-row="${S1}"]');
      var num = tr ? tr.querySelector('.scores-grade-num') : null;
      var banner = document.getElementById('scoresNoGrade');
      return { pct: num ? num.textContent : '', cell: tr ? (tr.querySelector('.scores-grade') || {}).textContent : '',
        bannerUp: !!banner && !banner.classList.contains('hidden') }; })()`);

    /* ── the grade sheet, opened through its real button ── */
    await clickSel('#scoresView [data-grades-record]');
    await new Promise(r => setTimeout(r, 300));
    const sheet = await evalJs(`(function(){
      var m = document.getElementById('gradesRecordModal');
      if (!m || m.classList.contains('hidden')) return { up:false, pct:'' };
      var row = Array.prototype.filter.call(m.querySelectorAll('.grades-report-slice tbody tr'),
        function(tr){ var h = tr.querySelector('.grades-report-row-head');
          return h && h.textContent.indexOf('${S1_LAST}') !== -1; })[0];
      return { up:true, pct: row ? (row.querySelector('.grades-report-pct') || {}).textContent || '' : '',
        banner: (m.querySelector('.grade-none') || {}).textContent || '' }; })()`);
    await evalJs("window.planbook.closeModal('gradesRecordModal'); 1");
    await new Promise(r => setTimeout(r, 200));

    /* ── the student detail, through the name on the grid ── */
    await clickSel('#scoresBody [data-student-detail="' + S1 + '"]');
    await new Promise(r => setTimeout(r, 300));
    const detail = await evalJs(`(function(){
      var v = document.getElementById('detailView');
      if (!v || v.classList.contains('hidden')) return { up:false, big:'' };
      var rows = Array.prototype.map.call(v.querySelectorAll('.detail-break tbody tr'), function(tr){
        return Array.prototype.map.call(tr.children, function(c){ return c.textContent; }); });
      var foot = v.querySelectorAll('.detail-break tfoot tr')[0];
      return { up:true, big: (v.querySelector('.detail-grade-big') || {}).textContent || '',
        rows: rows,
        foot: foot ? foot.children[foot.children.length - 1].textContent : '',
        banner: !!v.querySelector('.grade-none') }; })()`);

    /* ── the signals list ── */
    await openScreen('signals');
    const signals = await evalJs(`(function(){
      var row = document.querySelector('#signalsView [data-signal-row="${S1}|${CLS}"]');
      var model = window.planbook.signalsView.signalsModel();
      var mine = ((model.concern || {}).rows || []).filter(function(r){
        return r.key === '${S1}|${CLS}'; })[0];
      return { row: row ? row.textContent : '', modelGrade: mine ? mine.grade : null,
        rules: mine ? mine.hits.map(function(x){ return x.ruleId; }) : [] }; })()`);

    /* ── the merge field, through a real evaluate() pass — the same request shape merge-fields.mjs drafts with ── */
    const merged = await evalJs(`(function(){
      var doc = window.planbook.store.getDoc();
      var cls = (doc.classes || []).filter(function(c){ return c.id === '${CLS}'; })[0];
      var hits = window.planbook.signals.evaluate(doc, cls, '${TERM}');
      var hit = hits.filter(function(x){ return x.studentId === '${S1}' && x.ruleId === 'grade-below'; })[0];
      var out = window.planbook.mergeFields.resolveDraft({ doc: doc, classId: '${CLS}',
        termId: '${TERM}', studentId: '${S1}', hit: hit || null, hits: hits,
        template: { subject: 'S', body: '{{grade.percent}}' } });
      return { body: out.body, blocked: out.blocked }; })()`);

    const rowSays = signals.row.indexOf(GRADE) !== -1;
    const modelSays = typeof signals.modelGrade === 'number'
      && Math.abs(signals.modelGrade - 57.9591836734694) < 1e-9;
    check('WO-3.30: one student in a points class shows the same grade on every screen — the score grid, '
      + 'the grade sheet, student detail, the signals list and {{grade.percent}} all read 142/245 = '
      + GRADE + ' (worked by hand), a figure no caller on the weighted formula could print for a class '
      + 'whose weights total 75',
      grid.pct === GRADE && sheet.up && sheet.pct === GRADE && detail.up && detail.big === GRADE
        && rowSays && modelSays && signals.rules.indexOf('grade-below') !== -1
        && merged.blocked === false && merged.body === GRADE,
      JSON.stringify({ grid: grid.pct, sheet: sheet.pct, detail: detail.big,
        signalsRowCarries: rowSays, signalsModel: signals.modelGrade, signalsRules: signals.rules,
        merge: merged.body, blocked: merged.blocked }));

    /* The refusal belongs to weighted classes only, so neither of the two banners that print it is
       up over a points class at 75 — and the detail breakdown carries the uncategorized work as a
       row of its own, so its printed column still adds up to the printed total. */
    const contribs = (detail.rows || []).map((r) => r[r.length - 1]);
    const cents = contribs.reduce((n, s) => n + Math.round(Number(s) * 100), 0);
    const looseRow = (detail.rows || []).filter((r) => r[0] === 'no category')[0] || null;
    check('WO-3.30: no "weights do not add up" banner over a points class at 75 — not on the grid, not '
      + 'on the sheet, not on the detail — and the detail breakdown draws the uncategorized 18/20 as its '
      + 'own "no category" row, so the contributions column still sums to ' + GRADE,
      !grid.bannerUp && !sheet.banner && !detail.banner && (detail.rows || []).length === 4
        && !!looseRow && looseRow[2] === '18 / 20' && cents === 5796 && detail.foot === GRADE,
      'grid banner ' + grid.bannerUp + ', sheet banner ' + JSON.stringify(sheet.banner)
        + ', detail banner ' + detail.banner + ', rows ' + JSON.stringify(detail.rows)
        + ', column sums to ' + (cents / 100).toFixed(2) + ' under ' + JSON.stringify(detail.foot));

    /* ── the backup: the mode survives the file, and a file with no mode gains none ── */
    const files = await evalJs(`(async function(){
      var b = window.planbook.backup, s = window.planbook.store;
      var built = await b.buildBackup();
      var parsed = b.parseBackup(built.text, built.name).doc;
      var cls = (parsed.classes || []).filter(function(c){ return c.id === '${CLS}'; })[0];
      function content(d){ var x = Object.assign({}, d); delete x.rev; delete x.updatedAt;
        return JSON.stringify(x); }
      /* THE SHAPE EVERY EARLIER BUILD WROTE: this year with the points class taken out, so not one
         class in it carries the key. Stringified and parsed back, exactly as a file on disk is. */
      var older = JSON.parse(built.text);
      older.classes = older.classes.filter(function(c){ return c.id !== '${CLS}'; });
      var olderText = JSON.stringify(older, null, 2);
      var olderBack = b.parseBackup(olderText, 'older.json').doc;
      var fresh = typeof s.newYearDocument === 'function'
        ? JSON.stringify(s.newYearDocument('2031-2032')) : null;
      return { carries: built.text.indexOf('"gradingMode": "points"') !== -1,
        parsedMode: cls ? cls.gradingMode : null,
        parsedSame: content(parsed) === content(JSON.parse(built.text)),
        olderHasKey: olderText.indexOf('gradingMode') !== -1,
        olderSame: content(olderBack) === content(older),
        olderBackHasKey: JSON.stringify(olderBack).indexOf('gradingMode') !== -1,
        freshHasKey: fresh === null ? null : fresh.indexOf('gradingMode') !== -1,
        text: built.text }; })()`);
    check('WO-3.30: a backup with no gradingMode anywhere — the shape every earlier build wrote — parses '
      + 'back byte-identical in content with nothing added, and a new year seeds no gradingMode either',
      files.olderHasKey === false && files.olderSame === true && files.olderBackHasKey === false
        && files.freshHasKey === false,
      JSON.stringify({ olderHasKey: files.olderHasKey, olderSame: files.olderSame,
        olderBackHasKey: files.olderBackHasKey, newYearHasKey: files.freshHasKey }));

    /* The full restore, through the real confirm, and then the disk read raw — the same walk
       backup-restore.mjs takes. It restores this year's own backup over itself, so nothing is lost. */
    await evalJs(`(async function(){
      await window.planbook.backup.restoreFromText(${JSON.stringify(files.text)}, 'Planbook points.json');
      return 1; })()`);
    await clickSel('[data-backup-confirm]');
    await new Promise(r => setTimeout(r, 600));
    const restored = await evalJs(`(async function(){ var s = window.planbook.store;
      var year = s.getDoc().year;
      var stored = await new Promise(function(res, rej){
        var open = indexedDB.open('planbook');
        open.onerror = function(){ rej(open.error); };
        open.onsuccess = function(){ var db = open.result;
          var q = db.transaction('years','readonly').objectStore('years').get(year);
          q.onsuccess = function(){ res(q.result); db.close(); };
          q.onerror = function(){ rej(q.error); }; }; });
      var cls = (stored.classes || []).filter(function(c){ return c.id === '${CLS}'; })[0];
      var mem = (s.getDoc().classes || []).filter(function(c){ return c.id === '${CLS}'; })[0];
      return { storedMode: cls ? cls.gradingMode : null, memoryMode: mem ? mem.gradingMode : null,
        grade: cls ? window.planbook.gradeEngine.classGrade(stored, cls, '${TERM}', '${S1}').percentage : null,
        confirmOpen: !document.getElementById('restoreConfirmModal').classList.contains('hidden') }; })()`);
    check('WO-3.30: a points-mode year round-trips through backup and restore with its mode intact — '
      + 'the file carries "gradingMode": "points", parseBackup() hands it back, and after the real '
      + 'restore the class on disk is still a points class grading at 142/245',
      files.carries && files.parsedMode === 'points' && files.parsedSame
        && restored.storedMode === 'points' && restored.memoryMode === 'points'
        && typeof restored.grade === 'number' && Math.abs(restored.grade - 57.9591836734694) < 1e-9
        && !restored.confirmOpen,
      JSON.stringify({ fileCarries: files.carries, parsedMode: files.parsedMode,
        parsedSame: files.parsedSame, storedMode: restored.storedMode, memoryMode: restored.memoryMode,
        grade: restored.grade, confirmOpen: restored.confirmOpen }));

    /* THE FIXTURE COMES BACK OUT, by id, as grade-detail.mjs's does and for its reason. */
    await evalJs(`(async function(){
      var s = window.planbook.store, c = window.planbook.classes;
      if (!s.getDoc()) return 0;
      s.update(function(doc){
        doc.classes = doc.classes.filter(function(x){ return x.id !== '${CLS}'; });
        doc.students = doc.students.filter(function(x){ return String(x.id).indexOf('wo330-') !== 0; });
        doc.assignments = doc.assignments.filter(function(a){ return a.classId !== '${CLS}'; });
        Object.keys(doc.scores || {}).forEach(function(k){
          if (String(k).indexOf('a330') === 0) delete doc.scores[k]; });
      });
      window.planbook.supports.setPresentationMode(${plant.mode ? 'true' : 'false'});
      var was = ${JSON.stringify(plant.was || '')};
      if (was) c.selectClass(was);
      c.refreshClassBar();
      await s.flush();
      return 1; })()`);
  }

  /* ───────── extra credit in a points class, and a points class in its own words (WO-3.34) ─────────
   *
   * THE DEFECT WO-3.30'S VERIFIER FOUND, AS ITS OWN FIXTURE: a row whose only graded work is worth 0
   * points has earned something over nothing possible, so it has no percentage (n/0) and still adds
   * to the grade. Student detail used to draw it empty on `percentage === null` while its cents went
   * into the total, so the column added up to less than the Overall printed under it.
   *
   * A second class, so the WO-3.30 figures above stay exactly what they were. Tests 50, Projects 50,
   * Bonus 0 — the weights are real and ignored. Projects is EMPTY for everyone, which is what makes
   * the empty-row wording checkable; one piece is filed under no category and is worth 0 points.
   *
   *   Cy:  Tests 15/20, Bonus puzzle 2 (of 0), the loose piece blank.
   *        Earned 17, possible 20 -> 85.00% by hand. Tests counts at 20/20 = 100% and contributes
   *        15/20 = 75.00; Bonus counts at 0/20 = 0% and contributes 2/20 = 10.00. 75.00 + 10.00 = 85.00.
   *        The loose piece has nothing graded, so there is no "no category" row.
   *   Di:  Tests 15/20, the loose piece 2 (of 0), Bonus blank.
   *        The same 85.00%, with the 10.00 on a "no category" row reading "2 / 0", and Bonus empty.
   *
   * A build that draws the extra-credit row empty prints "—" in its last cell, and the column sums
   * to 75.00 under 85.00% — which is the mutation this block was proved against.
   *
   * AND THE WORDS. In a points class nothing on student detail or the assignments screen may say
   * "weight", call uncategorized work counted by nothing, or call a category a percent of the grade.
   * The assignments screen is read with an empty category and an unfiled piece both on it, which
   * are the two notices that said otherwise, and the category picker is driven through its real
   * <select> so the announcement it makes is read too. Then the class is copied through the real
   * Copy button, and the copy is a points class. (The weighted half — a weighted copy writes no
   * key — is in copy-class.mjs, beside the copy it is about.)
   */
  console.log('\n--- extra credit and the wording in a points class (WO-3.34) ---');
  {
    const C4 = 'c_wo334';
    const T4 = 'tm_wo334';
    const CY = 'wo334-s1', DI = 'wo334-s2';
    const HEAD = ['Category', 'Share of points', 'Earned', 'Category %', 'Contributes'];
    const WEIGHT_WORDS = /weight|counts? for nothing|nothing counts|counted by nothing|percent of the grade|redistribut/i;

    const into = async (screen) => {
      const on = await evalJs(
        "(function(){var e=document.querySelector('main > :not(.hidden)');return e?e.id:'';})()");
      if (on !== 'homeView') {
        const nth = await evalJs(`(function(){
          var all = document.querySelectorAll('[data-view-home]');
          for (var i = 0; i < all.length; i++) {
            var r = all[i].getBoundingClientRect();
            if (r.width > 0 && r.height > 0) return i;
          }
          return -1; })()`);
        if (nth < 0) throw new Error('no visible [data-view-home] to go home by');
        await clickSel('[data-view-home]', nth);
        await new Promise(r => setTimeout(r, 250));
      }
      await clickSel('#homeGrid [data-class-tab="' + C4 + '"]');
      await new Promise(r => setTimeout(r, 250));
      await clickSel('#classView [data-class-screen="' + screen + '"]');
      await new Promise(r => setTimeout(r, 400));
    };

    const planted = await evalJs(`(function(){
      var s = window.planbook.store, c = window.planbook.classes;
      var was = c.getSelectedClassId();
      s.update(function(doc){
        doc.students.push({ id:'${CY}', first:'Cy', last:'Ashby' },
          { id:'${DI}', first:'Di', last:'Brantley' });
        /* THE MODE IS PLANTED, as above: no control writes it until WO-3.31. */
        doc.classes.push({ id:'${C4}', name:'WO-3.34 Points', archived:false, gradingMode:'points',
          roster:['${CY}','${DI}'], letterScale:null,
          terms:[{ id:'${T4}', label:'WO-3.34 Term', start:'2026-09-01', end:'2026-11-06' }],
          categories:[
            { id:'cat334t', name:'Tests', weight:50 },
            { id:'cat334p', name:'Projects', weight:50 },
            { id:'cat334b', name:'Bonus', weight:0 }]});
        var add = function(id, cat, name, points){
          var a = { id:id, classId:'${C4}', termId:'${T4}', name:name, points:points,
            assigned:'2026-09-08', due:'2026-09-15' };
          if (cat) a.categoryId = cat;
          doc.assignments.push(a);
        };
        add('a334t1', 'cat334t', 'Unit test', 20);
        add('a334b1', 'cat334b', 'Bonus puzzle', 0);
        add('a334r1', null, 'Reading challenge', 0);    /* NO category, worth 0 */
        doc.scores['a334t1'] = { '${CY}': { v:15 }, '${DI}': { v:15 } };
        doc.scores['a334b1'] = { '${CY}': { v:2 } };
        doc.scores['a334r1'] = { '${DI}': { v:2 } };
      });
      c.selectClass('${C4}');
      c.selectTerm('${T4}');
      var doc = s.getDoc();
      var cls = doc.classes.filter(function(x){ return x.id === '${C4}'; })[0];
      var g = window.planbook.gradeEngine.classGrade;
      return { was: was, cy: g(doc, cls, '${T4}', '${CY}'), di: g(doc, cls, '${T4}', '${DI}') };
    })()`);

    const rowNamed = (rows, name) => (rows || []).filter((r) => r.cells[0] === name)[0] || null;
    const readDetail = async (id) => {
      await into('scores');
      await clickSel('#scoresBody [data-student-detail="' + id + '"]');
      await new Promise(r => setTimeout(r, 300));
      return await evalJs(`(function(){
        var v = document.getElementById('detailView');
        if (!v || v.classList.contains('hidden')) return { up:false };
        var t = v.querySelector('.detail-break');
        var cellsOf = function(tr){ return Array.prototype.map.call(tr.children, function(x){ return x.textContent; }); };
        var foot = t ? t.querySelector('tfoot tr') : null;
        return { up:true,
          head: t ? cellsOf(t.querySelector('thead tr')) : [],
          rows: t ? Array.prototype.map.call(t.querySelectorAll('tbody tr'), function(tr){
            return { empty: tr.classList.contains('empty'), cells: cellsOf(tr) }; }) : [],
          foot: foot ? cellsOf(foot) : [],
          text: (document.getElementById('detailContent') || {}).textContent || '' }; })()`);
    };
    /* The printed column, summed in cents the way a guardian with a pencil would: every cell in the
       last column that is a number. A dash is not a number and adds nothing. */
    const columnCents = (d) => (d.rows || []).reduce((n, r) => {
      const last = r.cells[r.cells.length - 1];
      return /^-?\d+\.\d\d$/.test(last) ? n + Math.round(Number(last) * 100) : n;
    }, 0);

    const cy = await readDetail(CY);
    const cyBonus = rowNamed(cy.rows, 'Bonus');
    check('WO-3.34: in a points class, an extra-credit-only category is drawn as contributing — Bonus '
      + 'reads 0% · 2 / 0 · — · 10.00, and the Contributes column sums to the Overall to the cent: '
      + '75.00 + 10.00 = 85.00 under 85.00% (17/20, by hand)',
      Math.abs(planted.cy.percentage - 85) < 1e-9 && cy.up && !!cyBonus && !cyBonus.empty
        && JSON.stringify(cyBonus.cells) === JSON.stringify(['Bonus', '0%', '2 / 0', '—', '10.00'])
        && columnCents(cy) === 8500 && cy.foot[cy.foot.length - 1] === '85.00%'
        && !rowNamed(cy.rows, 'no category'),
      JSON.stringify({ engine: planted.cy.percentage, rows: cy.rows, foot: cy.foot,
        columnSums: (columnCents(cy) / 100).toFixed(2) }));

    const di = await readDetail(DI);
    const diLoose = rowNamed(di.rows, 'no category');
    check('WO-3.34: the same holds for a "no category" row whose only graded work is extra credit — it '
      + 'reads 0% · 2 / 0 · — · 10.00, and the column sums to 85.00 under 85.00%',
      Math.abs(planted.di.percentage - 85) < 1e-9 && di.up && !!diLoose && !diLoose.empty
        && JSON.stringify(diLoose.cells) === JSON.stringify(['no category', '0%', '2 / 0', '—', '10.00'])
        && columnCents(di) === 8500 && di.foot[di.foot.length - 1] === '85.00%',
      JSON.stringify({ engine: planted.di.percentage, rows: di.rows, foot: di.foot,
        columnSums: (columnCents(di) / 100).toFixed(2) }));

    /* The breakdown in the class's own words: five columns headed by the share rather than a weight,
       the empty category saying it adds nothing rather than that its weight is shared, an Overall
       row with no weights total in it, and not one word of weight anywhere on the page. */
    const cyProjects = rowNamed(cy.rows, 'Projects');
    const diBonus = rowNamed(di.rows, 'Bonus');
    const detailHits = [cy.text, di.text].map((t) => (t.match(WEIGHT_WORDS) || [''])[0]);
    check('WO-3.34: a points class\'s breakdown is headed ' + HEAD.join(' · ') + ', an empty category '
      + 'says it adds no points rather than that its weight is shared, the Overall row carries no '
      + 'weights total, and nothing on student detail says weight, counted-by-nothing or redistributes',
      JSON.stringify(cy.head) === JSON.stringify(HEAD) && JSON.stringify(di.head) === JSON.stringify(HEAD)
        && !!cyProjects && cyProjects.empty && cyProjects.cells[1] === '—'
        && /adds no points/.test(cyProjects.cells[2]) && !!diBonus && diBonus.empty
        && cy.foot.length === 5 && cy.foot[1] === ''
        && detailHits.every((x) => x === ''),
      JSON.stringify({ head: cy.head, projects: cyProjects, foot: cy.foot, wordFound: detailHits }));

    /* ── the assignments screen, with an empty category and an unfiled piece both on it ── */
    await into('assignments');
    const list = await evalJs(`(function(){
      var v = document.getElementById('assignmentsView');
      return { text: v ? v.textContent : '',
        empty: Array.prototype.map.call(v.querySelectorAll('.assign-group-empty'), function(x){ return x.textContent; }),
        orphan: Array.prototype.map.call(v.querySelectorAll('.assign-group-orphan'), function(x){ return x.textContent; }) }; })()`);
    /* And the picker's sentence, both ways. Filing: the loose piece is opened in its real editor and
       filed under Tests through the real <select>. Unfiling cannot be done from that picker — it offers
       "no category" only to a piece already in that state — so the other branch is asked through the
       same function the picker calls, handed a <select> carrying the hook and an empty value. Both
       run after every detail read above, so the grades they move are not ones this block asserts. */
    const said = async () => {
      await new Promise(r => setTimeout(r, 200));
      return await evalJs("(document.querySelector('[aria-live]') || {}).textContent || ''");
    };
    await clickSel('#assignmentsView [data-assignment-edit="a334r1"]');
    await new Promise(r => setTimeout(r, 300));
    /* The editor's picker is part of the same screen: its options carry no weight in a points class. */
    const options = await evalJs(`Array.prototype.map.call(document.querySelectorAll(
      '#assignmentModal [data-assignment-category="a334r1"] option'), function(o){ return o.textContent; })`);
    await evalJs(`(function(){
      var sel = document.querySelector('#assignmentModal [data-assignment-category="a334r1"]');
      sel.value = 'cat334t';
      sel.dispatchEvent(new Event('change', { bubbles: true })); return 1; })()`);
    const saidFiled = await said();
    await evalJs("window.planbook.closeModal('assignmentModal'); 1");
    await evalJs(`(function(){
      var sel = document.createElement('select');
      sel.setAttribute('data-assignment-category', 'a334t1');
      var o = document.createElement('option'); o.value = ''; sel.append(o); sel.value = '';
      window.planbook.assignments.setAssignmentCategory(sel); return 1; })()`);
    const saidLoose = await said();
    const listHit = (list.text.match(WEIGHT_WORDS) || [''])[0];
    check('WO-3.34: in a points class the assignments screen says nothing about weights and does not call '
      + 'unfiled work counted by nothing — the empty category says it adds nothing to either side, the '
      + 'unfiled notice says the grade counts it under "no category", no group head or picker option '
      + 'carries a weight, and the category picker announces the category with no percent of the grade, '
      + 'and an unfiled piece as still counting',
      listHit === '' && list.empty.length === 1
        && JSON.stringify(options) === JSON.stringify(['— choose a category —', 'Tests', 'Projects', 'Bonus']) && /adds nothing to either side/.test(list.empty[0])
        && list.orphan.length === 1 && /the grade counts it under “no category”/.test(list.orphan[0])
        && saidFiled === 'Reading challenge now counts in Tests.'
        && saidLoose === 'Unit test now counts in no category, and in a class graded on total '
          + 'points it still counts toward the grade.'
        && !WEIGHT_WORDS.test(saidFiled) && !WEIGHT_WORDS.test(saidLoose),
      JSON.stringify({ wordFound: listHit, empty: list.empty, orphan: list.orphan, options: options,
        saidFiled: saidFiled, saidLoose: saidLoose }));

    /* ── and the class copied, through the real Copy button ── */
    await clickSel('header [data-class-manage]');
    await new Promise(r => setTimeout(r, 300));
    await clickSel('[data-class-copy="' + C4 + '"]');
    await new Promise(r => setTimeout(r, 250));
    const copied = await evalJs(`(function(){
      var d = window.planbook.store.getDoc();
      var src = d.classes.filter(function(c){ return c.id === '${C4}'; })[0];
      var copy = d.classes[d.classes.indexOf(src) + 1] || null;
      return { name: copy ? copy.name : null, mode: copy ? copy.gradingMode : null,
        engineMode: copy ? window.planbook.gradeEngine.gradingModeOf(copy) : null }; })()`);
    await evalJs("window.planbook.closeModal('classesModal'); 1");
    await new Promise(r => setTimeout(r, 150));
    check('WO-3.34: copying a points class through the real Copy button gives a points class — the copy '
      + 'carries gradingMode "points" and the engine reads it as points',
      copied.name === 'WO-3.34 Points (copy)' && copied.mode === 'points' && copied.engineMode === 'points',
      JSON.stringify(copied));

    /* THE FIXTURE COMES BACK OUT, the copy with it, by id and by name. */
    await evalJs(`(async function(){
      var s = window.planbook.store, c = window.planbook.classes;
      s.update(function(doc){
        doc.classes = doc.classes.filter(function(x){
          return x.id !== '${C4}' && String(x.name).indexOf('WO-3.34 Points') !== 0; });
        doc.students = doc.students.filter(function(x){ return String(x.id).indexOf('wo334-') !== 0; });
        doc.assignments = doc.assignments.filter(function(a){ return a.classId !== '${C4}'; });
        Object.keys(doc.scores || {}).forEach(function(k){
          if (String(k).indexOf('a334') === 0) delete doc.scores[k]; });
      });
      var was = ${JSON.stringify(planted.was || '')};
      if (was) c.selectClass(was);
      c.refreshClassBar();
      await s.flush();
      return 1; })()`);
  }
}
}
