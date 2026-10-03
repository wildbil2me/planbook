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
      /* WO-3.36: every word the screen draws, read rather than grepped — the view's text with the two
         static help paragraphs taken out, plus every title and aria-label on it. The paragraphs are
         the same HTML in every class and name both modes in conditional sentences ("In a class graded
         by weighted categories …", WO-3.34), so they say what a weighted class does without calling
         this one weighted; they are read separately below rather than skipped silently. */
      var view = document.getElementById('scoresView');
      var bare = view.cloneNode(true);
      Array.prototype.forEach.call(bare.querySelectorAll('.scores-hint'), function(p){ p.remove(); });
      var attrs = Array.prototype.map.call(bare.querySelectorAll('[title],[aria-label]'), function(e){
        return (e.getAttribute('title') || '') + ' ' + (e.getAttribute('aria-label') || ''); });
      var hints = Array.prototype.map.call(view.querySelectorAll('.scores-hint'), function(p){ return p.textContent; });
      return { pct: num ? num.textContent : '', cell: tr ? (tr.querySelector('.scores-grade') || {}).textContent : '',
        bannerUp: !!banner && !banner.classList.contains('hidden'),
        words: bare.textContent + ' ' + attrs.join(' '),
        hintWeights: hints.map(function(t){ return (t.match(/[^.]*weight[^.]*/gi) || []).join(' | '); }),
        chips: Array.prototype.map.call(document.querySelectorAll('#scoresHead .cat-chip'), function(c){ return c.textContent; }),
        chipFigures: document.querySelectorAll('#scoresHead .cat-chip b').length,
        summary: (document.getElementById('scoresSummary') || {}).textContent || '' }; })()`);

    /* ── the grade sheet, opened through its real button ── */
    await clickSel('#scoresView [data-grades-record]');
    await new Promise(r => setTimeout(r, 300));
    const sheet = await evalJs(`(function(){
      var m = document.getElementById('gradesRecordModal');
      if (!m || m.classList.contains('hidden')) return { up:false, pct:'' };
      var row = Array.prototype.filter.call(m.querySelectorAll('.grades-report-slice tbody tr'),
        function(tr){ var h = tr.querySelector('.grades-report-row-head');
          return h && h.textContent.indexOf('${S1_LAST}') !== -1; })[0];
      /* WO-3.36: the whole dialog's words, its titles and labels, and the CSV it saves, through the
         same gradesRecord()/gradesCsv() seam the Download button calls. */
      var attrs = Array.prototype.map.call(m.querySelectorAll('[title],[aria-label]'), function(e){
        return (e.getAttribute('title') || '') + ' ' + (e.getAttribute('aria-label') || ''); });
      var colTitles = Array.prototype.map.call(m.querySelectorAll('.grades-report-col'), function(th){ return th.title; });
      var gr = window.planbook.gradesReport;
      return { up:true, pct: row ? (row.querySelector('.grades-report-pct') || {}).textContent || '' : '',
        banner: (m.querySelector('.grade-none') || {}).textContent || '',
        words: m.textContent + ' ' + attrs.join(' '), colTitles: colTitles,
        csv: gr.gradesCsv(gr.gradesRecord()).text }; })()`);
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

    /* ── the score grid and the grade sheet in the class's own words (WO-3.36) ──
     *
     * THIS FIXTURE IS THE ONE THAT CAN FAIL IT: its weights total 75, so a build still speaking
     * weights here prints "Weights total 75%" on the summary line and "Essays 40%" on a column chip.
     * Measured on the rendered page and the saved file, never on the source.
     */
    const WEIGHTISH = /weight/i;
    const CATS = ['Essays', 'Quizzes', 'Homework'];
    const gridHit = (grid.words.match(WEIGHTISH) || [''])[0];
    const sheetHit = (sheet.words.match(WEIGHTISH) || [''])[0];
    const csvHit = (String(sheet.csv || '').match(WEIGHTISH) || [''])[0];
    check('WO-3.36: in a points class no text on the score grid calls the grade weighted or prints a '
      + 'weight — every column chip is the bare category name (or "no category") with no figure in it, '
      + 'the summary line ends "graded on total points" with no weights total, and no word of weight is '
      + 'anywhere in the view\'s text, titles or labels outside the two static help paragraphs',
      gridHit === '' && grid.chipFigures === 0 && grid.chips.length === 7
        && grid.chips.every((c) => CATS.indexOf(c) !== -1 || c === 'no category')
        && grid.chips.filter((c) => c === 'no category').length === 1
        && /graded on total points$/.test(grid.summary.trim())
        && grid.summary.indexOf('Weights total') === -1 && !/%\s*$/.test(grid.summary.trim()),
      JSON.stringify({ wordFound: gridHit, chips: grid.chips, chipFigures: grid.chipFigures,
        summary: grid.summary }));
    /* The two help paragraphs, read rather than skipped: any sentence in them with "weight" in it must
       be one that names the weighted mode or says a points class has none — never one about this
       class as though it were weighted. */
    const hintSentences = (grid.hintWeights || []).join(' | ').split(' | ').filter(Boolean);
    check('WO-3.36: the score grid\'s static help paragraphs mention weights only in sentences about a '
      + 'weighted class or saying a points class has none to balance',
      hintSentences.length > 0 && hintSentences.every((s) => /weighted categories|no\s+weights/.test(s)
        || /until the weights|the weights do/.test(s)),
      JSON.stringify(hintSentences));
    check('WO-3.36: in a points class no text on the grade sheet calls the grade weighted or prints a '
      + 'weight — not in the dialog, its titles or labels, nor the CSV it saves — and no column title '
      + 'carries a percent',
      sheet.up && sheetHit === '' && csvHit === '' && (sheet.colTitles || []).length === 7
        && sheet.colTitles.every((t) => t.indexOf('%') === -1),
      JSON.stringify({ wordFound: sheetHit, csvWordFound: csvHit, colTitles: sheet.colTitles }));

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
   *   Ed (WO-3.35): the Bonus puzzle 2 (of 0) and NOTHING ELSE graded — the unit test blank, the loose
   *        piece blank. Earned 2, possible 0, so there is no grade (n/0) and no row has a share or a
   *        contribution. Before WO-3.35 her Bonus row read "nothing graded in it yet" over a cell
   *        scored 2, and the to-move card said "There is no graded work yet." Both were false.
   *
   * AND THE FILE (WO-3.35). The student CSV is read for all three, straight after each one's screen,
   * through the same detailModel() / studentCsv() seam grade-detail.mjs drives: Cy's and Di's
   * Contributes column must add up to the Overall grade to the cent with the extra-credit row's
   * 10.00 in it, the file must carry the screen's columns and not the weighted ones, and Ed's file
   * must say what her screen says.
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
    const CY = 'wo334-s1', DI = 'wo334-s2', ED = 'wo334-s3';
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
          { id:'${DI}', first:'Di', last:'Brantley' }, { id:'${ED}', first:'Ed', last:'Cordero' });
        /* THE MODE IS PLANTED, as above: no control writes it until WO-3.31. */
        doc.classes.push({ id:'${C4}', name:'WO-3.34 Points', archived:false, gradingMode:'points',
          roster:['${CY}','${DI}','${ED}'], letterScale:null,
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
        doc.scores['a334b1'] = { '${CY}': { v:2 }, '${ED}': { v:2 } };
        doc.scores['a334r1'] = { '${DI}': { v:2 } };
      });
      c.selectClass('${C4}');
      c.selectTerm('${T4}');
      var doc = s.getDoc();
      var cls = doc.classes.filter(function(x){ return x.id === '${C4}'; })[0];
      var g = window.planbook.gradeEngine.classGrade;
      return { was: was, cy: g(doc, cls, '${T4}', '${CY}'), di: g(doc, cls, '${T4}', '${DI}'),
        ed: g(doc, cls, '${T4}', '${ED}') };
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
        /* WO-3.35: the page with its empty rows taken out, the to-move card, the hero's label and the
           file — so a sentence can be looked for everywhere EXCEPT on a row that truly is empty. */
        var bare = document.getElementById('detailContent').cloneNode(true);
        Array.prototype.forEach.call(bare.querySelectorAll('tr.empty'), function(tr){ tr.remove(); });
        /* And the breakdown's footnote, which defines the empty row for every student ("a category
           with nothing graded in it adds nothing to either side") and so says nothing about this one. */
        Array.prototype.forEach.call(bare.querySelectorAll('.detail-break'), function(t){
          var n = t.parentNode.querySelector('.detail-card-note'); if (n) n.remove(); });
        var big = v.querySelector('.detail-grade-big');
        var move = v.querySelector('.detail-move');
        return { up:true,
          bare: bare.textContent,
          move: move ? move.textContent : '',
          heroLabel: big && big.parentNode ? (big.parentNode.getAttribute('aria-label') || '') : '',
          csv: window.planbook.detail.studentCsv(window.planbook.detail.detailModel()).text,
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

    /* ── the student CSV of a points class (WO-3.35) ──
     *
     * Parsed with grade-detail.mjs's deliberately naive reader — quotes and nothing else — so a cell
     * is what a spreadsheet would put in it. The Contributes column is summed the way columnCents()
     * sums the screen's: every cell that is a number, in cents. The Overall grade it is compared to
     * is read out of the file's own "Overall grade" row, not out of the engine.
     */
    const ed = await readDetail(ED);
    const cols = (line) => {
      const out = [];
      let cur = '';
      let q = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (q) {
          if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
          else if (ch === '"') q = false;
          else cur += ch;
        } else if (ch === '"') q = true;
        else if (ch === ',') { out.push(cur); cur = ''; }
        else cur += ch;
      }
      out.push(cur);
      return out;
    };
    const fileOf = (text) => {
      const parsed = String(text || '').replace(/^\uFEFF/, '').split('\r\n').map(cols);
      const at = parsed.findIndex((r) => r[0] === 'Category');
      const after = at === -1 ? [] : parsed.slice(at + 1);
      const body = after.slice(0, after.findIndex((r) => r.length === 1 && r[0] === ''));
      return { head: at === -1 ? [] : parsed[at], rows: body.filter((r) => r[0] !== 'Overall'),
        foot: body.filter((r) => r[0] === 'Overall')[0] || [],
        overall: parsed.filter((r) => r[0] === 'Overall grade')[0] || [] };
    };
    const fileCents = (f) => f.rows.reduce((n, r) => {
      const last = r[r.length - 1];
      return /^-?\d+\.\d\d$/.test(last) ? n + Math.round(Number(last) * 100) : n;
    }, 0);
    const pctCents = (cell) => /^\d+\.\d\d%$/.test(cell || '') ? Math.round(Number(cell.slice(0, -1)) * 100) : null;
    const CSV_HEAD = ['Category', 'Share of points %', 'Earned', 'Possible', 'Category %', 'Contributes'];
    const EMPTY_SAY = 'nothing graded in it yet — it adds no points to either side until something is';
    const BONUS_SAY = 'extra credit — it counts once there is work worth points for it to add to';
    const fCy = fileOf(cy.csv), fDi = fileOf(di.csv), fEd = fileOf(ed.csv);
    const fileRow = (f, name) => f.rows.filter((r) => r[0] === name)[0] || null;

    check('WO-3.35: in a points class the student CSV\'s Contributes column sums to its Overall grade to '
      + 'the cent with the extra-credit category in it — Bonus reads 0 · 2 · 0 · (no %) · 10.00, Tests '
      + '100 · 15 · 20 · 75.00% · 75.00, and 75.00 + 10.00 = 85.00 under an Overall grade of 85.00%',
      JSON.stringify(fileRow(fCy, 'Bonus')) === JSON.stringify(['Bonus', '0', '2', '0', '', '10.00'])
        && JSON.stringify(fileRow(fCy, 'Tests')) === JSON.stringify(['Tests', '100', '15', '20', '75.00%', '75.00'])
        && fCy.overall[1] === '85.00%' && fileCents(fCy) === pctCents(fCy.overall[1])
        && fCy.foot[fCy.foot.length - 1] === '85.00%' && !fileRow(fCy, 'no category'),
      JSON.stringify({ rows: fCy.rows, foot: fCy.foot, overall: fCy.overall,
        columnSums: (fileCents(fCy) / 100).toFixed(2) }));

    check('WO-3.35: and with a "no category" row whose only graded work is extra credit — it reads '
      + 'no category · 0 · 2 · 0 · (no %) · 10.00, and the column sums to 85.00 under 85.00%',
      JSON.stringify(fileRow(fDi, 'no category')) === JSON.stringify(['no category', '0', '2', '0', '', '10.00'])
        && fDi.overall[1] === '85.00%' && fileCents(fDi) === pctCents(fDi.overall[1])
        && fDi.foot[fDi.foot.length - 1] === '85.00%',
      JSON.stringify({ rows: fDi.rows, foot: fDi.foot, overall: fDi.overall,
        columnSums: (fileCents(fDi) / 100).toFixed(2) }));

    const csvWeightHits = [cy.csv, di.csv, ed.csv].map((t) => ['Weight %', 'Counts at %']
      .filter((w) => t.indexOf(w) !== -1).concat((t.match(WEIGHT_WORDS) || []).slice(0, 1)));
    check('WO-3.35: a points-class CSV speaks the mode — its category section is headed '
      + CSV_HEAD.join(' · ') + ', six cells to every row, an empty category carries the screen\'s own '
      + 'sentence, and no file contains Weight %, Counts at %, redistributes or any word of weight',
      [fCy, fDi, fEd].every((f) => JSON.stringify(f.head) === JSON.stringify(CSV_HEAD)
          && f.rows.concat([f.foot]).every((r) => r.length === 6))
        && JSON.stringify(fileRow(fCy, 'Projects')) === JSON.stringify(['Projects', '', '', '', EMPTY_SAY, ''])
        && csvWeightHits.every((h) => h.length === 0),
      JSON.stringify({ head: fCy.head, widths: [fCy, fDi, fEd].map((f) => f.rows.map((r) => r.length)),
        projects: fileRow(fCy, 'Projects'), found: csvWeightHits }));

    /* AND ON SCREEN, THE FILE'S FIGURES ARE THE SCREEN'S — the Contributes cells of every row that has
       one, read off both, in order. */
    const screenCells = (d) => d.rows.filter((r) => !r.empty && r.cells.length === 5).map((r) => r.cells[4]);
    const fileCells = (f) => f.rows.filter((r) => r[5] !== '').map((r) => r[5]);
    check('WO-3.35: the points file carries the screen\'s own Contributes figures, row for row, for both '
      + 'extra-credit fixtures',
      JSON.stringify(screenCells(cy)) === JSON.stringify(fileCells(fCy))
        && JSON.stringify(screenCells(di)) === JSON.stringify(fileCells(fDi))
        && fileCells(fCy).length === 2 && fileCells(fDi).length === 2,
      JSON.stringify({ cy: [screenCells(cy), fileCells(fCy)], di: [screenCells(di), fileCells(fDi)] }));

    /* ED: only extra credit graded. No grade, and nothing anywhere says there is nothing graded —
       except on Tests and Projects, which truly have nothing graded in them, and are read separately
       as the empty rows they are. */
    const NOTHING = /nothing graded|no graded work|nothing is graded|nothing has been graded/i;
    const edBonus = rowNamed(ed.rows, 'Bonus');
    const edFileBonus = fileRow(fEd, 'Bonus');
    const edFileElsewhere = fEd.rows.filter((r) => NOTHING.test(r.join(' '))
      && !(r[2] === '' && r[3] === '' && r[4] === EMPTY_SAY));
    const edFileHead = String(ed.csv).split('\r\n').slice(0, 7).join(' ');
    check('WO-3.35: a points-class student whose only graded work is extra credit is not told, on screen or '
      + 'in the CSV, that nothing is graded — her Bonus row keeps its 2 / 0 and says it is extra credit '
      + 'waiting for work worth points, the to-move card and the hero\'s label say the same, and only the '
      + 'two categories that really are empty say "nothing graded"',
      planted.ed.percentage === null && planted.ed.reason === 'no-graded-work' && ed.up
        && !!edBonus && !edBonus.empty
        && JSON.stringify(edBonus.cells) === JSON.stringify(['Bonus', '—', '2 / 0', BONUS_SAY])
        && rowNamed(ed.rows, 'Tests').empty && rowNamed(ed.rows, 'Projects').empty
        && !NOTHING.test(ed.bare) && !NOTHING.test(ed.move) && !NOTHING.test(ed.heroLabel)
        && /extra credit/.test(ed.move) && /extra credit/.test(ed.heroLabel)
        && JSON.stringify(edFileBonus) === JSON.stringify(['Bonus', '', '2', '0', BONUS_SAY, ''])
        && edFileElsewhere.length === 0 && !NOTHING.test(edFileHead)
        && fEd.overall[1] === '' && fEd.foot[fEd.foot.length - 1] === '',
      JSON.stringify({ engine: { p: planted.ed.percentage, reason: planted.ed.reason, message: planted.ed.message },
        bonus: edBonus, move: ed.move, heroLabel: ed.heroLabel,
        screenSays: (ed.bare.match(NOTHING) || [''])[0], fileBonus: edFileBonus,
        fileElsewhere: edFileElsewhere, overall: fEd.overall }));

    /* ── the quiet list says why there is no grade (WO-3.37) ──
     * Ed is on the signals screen's quiet list — nothing fires for a student with no grade and no
     * absences — and until WO-3.37 her row read "has no graded work yet" over her 2-point puzzle. It
     * is read off signalsModel(), the screen's own model, so the row is the one a teacher sees.
     *
     * AND THE OTHER NULL, which predates points mode: the same class handed to quietMiddle() as a
     * plain WEIGHTED object whose weights total 90 — a copy, never written to the document. Cy has a
     * 15/20 test in it and no grade, because the weights do not add up; the row must say that, in
     * the engine's own sentence, and not that nothing is graded. */
    const quiet337 = await evalJs(`(function(){
      var m = window.planbook.signalsView.signalsModel();
      var mine = m.quiet.rows.filter(function(r){ return r.classId === '${C4}'; });
      var doc = window.planbook.store.getDoc();
      var real = doc.classes.filter(function(x){ return x.id === '${C4}'; })[0];
      var copy = JSON.parse(JSON.stringify(real));
      delete copy.gradingMode;
      copy.categories[1].weight = 40;
      var off = window.planbook.signals.quietMiddle(doc, copy, '${T4}');
      var says = function(rows, id){ var r = rows.filter(function(x){ return x.studentId === id; })[0];
        return r ? r.explanation : null; };
      return { ed: says(mine, '${ED}'), cy: says(mine, '${CY}'), offCy: says(off, '${CY}'),
        offGrade: window.planbook.gradeEngine.classGrade(doc, copy, '${T4}', '${CY}') }; })()`);
    const EC_WHY = ' The only work graded so far is extra credit, so there is no grade yet for it to add to.';
    const UNBAL_WHY = ' The category weights total 90%, so there is no grade yet.';
    check('WO-3.37: on the quiet list, a points-class student whose only graded work is extra credit is '
      + 'not told she has no graded work — her row reads "has no grade" and carries the engine\'s own '
      + 'sentence about extra credit; a classmate with a grade still reads "is at 85.00%"',
      typeof quiet337.ed === 'string'
        && quiet337.ed.indexOf('In WO-3.34 Points, Ed Cordero has no grade and nothing has been written '
          + 'down, said or sent about them ') === 0
        && quiet337.ed.slice(-EC_WHY.length) === EC_WHY && !NOTHING.test(quiet337.ed)
        && typeof quiet337.cy === 'string' && quiet337.cy.indexOf('Cy Ashby is at 85.00% and ') !== -1,
      JSON.stringify({ ed: quiet337.ed, cy: quiet337.cy }));
    check('WO-3.37: and a WEIGHTED class whose weights total 90% — a fault that predates points mode — '
      + 'does not tell a student with a scored test that he has no graded work: the row reads "has no '
      + 'grade" and carries "The category weights total 90%, so there is no grade yet."',
      !!quiet337.offGrade && quiet337.offGrade.reason === 'weights-unbalanced'
        && typeof quiet337.offCy === 'string'
        && quiet337.offCy.indexOf('In WO-3.34 Points, Cy Ashby has no grade and ') === 0
        && quiet337.offCy.slice(-UNBAL_WHY.length) === UNBAL_WHY && !NOTHING.test(quiet337.offCy),
      JSON.stringify({ offCy: quiet337.offCy, reason: quiet337.offGrade && quiet337.offGrade.reason }));

    /* ── the score grid's chip for a 0% category (WO-3.36) ──
     * Bonus carries weight 0. A weighted class draws its chip dashed and grey (`.zero`) because a 0%
     * category counts for nothing there; in a points class its 2-point puzzle counts, so the chip is
     * the plain name like every other one. */
    await into('scores');
    const chips334 = await evalJs(`Array.prototype.map.call(document.querySelectorAll('#scoresHead .cat-chip'),
      function(c){ return { text: c.textContent, cls: c.className }; })`);
    check('WO-3.36: in a points class the score grid draws a 0% category\'s chip as a plain name — "Bonus", '
      + 'not dashed as counting for nothing and carrying no figure — beside Tests and "no category"',
      JSON.stringify(chips334) === JSON.stringify([
        { text: 'Tests', cls: 'cat-chip' }, { text: 'Bonus', cls: 'cat-chip' },
        { text: 'no category', cls: 'cat-chip' }]),
      JSON.stringify(chips334));

    /* ── the assignments screen, with an empty category and an unfiled piece both on it ── */
    await into('assignments');
    /* The unfiled notice's class and its computed colours as well as its words (WO-3.36): red is the
       error state, and "not styled as an error" is a measurement of what is painted. */
    const NOTICE_STYLE = `function(x){ var s = getComputedStyle(x);
        return { cls: x.className, color: s.color, bg: s.backgroundColor, border: s.borderTopColor }; }`;
    const list = await evalJs(`(function(){
      var v = document.getElementById('assignmentsView');
      var style = ${NOTICE_STYLE};
      return { text: v ? v.textContent : '',
        empty: Array.prototype.map.call(v.querySelectorAll('.assign-group-empty'), function(x){ return x.textContent; }),
        emptyStyle: Array.prototype.map.call(v.querySelectorAll('.assign-group-empty'), style),
        orphan: Array.prototype.map.call(v.querySelectorAll('.assign-group-orphan'), function(x){ return x.textContent; }),
        orphanStyle: Array.prototype.map.call(v.querySelectorAll('.assign-group-orphan'), style) }; })()`);
    /* AND THE SAME CLASS WEIGHTED, for one render: the mode key comes off (its weights total 100, so
       it is a balanced weighted class), the list is redrawn, read, and the key goes back on before
       anything below drives the picker. */
    const weightedList = await evalJs(`(async function(){
      var s = window.planbook.store;
      s.update(function(doc){ var c = doc.classes.filter(function(x){ return x.id === '${C4}'; })[0];
        delete c.gradingMode; });
      window.planbook.assignments.renderAssignments();
      var v = document.getElementById('assignmentsView');
      var style = ${NOTICE_STYLE};
      var out = { orphan: Array.prototype.map.call(v.querySelectorAll('.assign-group-orphan'), function(x){ return x.textContent; }),
        orphanStyle: Array.prototype.map.call(v.querySelectorAll('.assign-group-orphan'), style) };
      s.update(function(doc){ var c = doc.classes.filter(function(x){ return x.id === '${C4}'; })[0];
        c.gradingMode = 'points'; });
      window.planbook.assignments.renderAssignments();
      await s.flush();
      return out; })()`);
    const RED = { color: 'rgb(192, 57, 43)', bg: 'rgb(253, 234, 234)', border: 'rgb(231, 76, 60)' };
    const AMBER = { color: 'rgb(138, 109, 26)', bg: 'rgb(255, 248, 230)', border: 'rgb(240, 223, 168)' };
    const paint = (s) => s ? { color: s.color, bg: s.bg, border: s.border } : null;
    const pOrphan = (list.orphanStyle || [])[0];
    const wOrphan = (weightedList.orphanStyle || [])[0];
    check('WO-3.36: the "Not in a category" notice is not drawn as an error in a points class — it is '
      + 'painted in the empty-category notice\'s amber, not red — and in the same class made weighted it '
      + 'is exactly what it always was: class "assign-group-orphan" alone, red, saying nothing counts it',
      !!pOrphan && pOrphan.cls === 'assign-group-orphan counted'
        && JSON.stringify(paint(pOrphan)) === JSON.stringify(AMBER)
        && JSON.stringify(paint(pOrphan)) === JSON.stringify(paint((list.emptyStyle || [])[0]))
        && !!wOrphan && wOrphan.cls === 'assign-group-orphan'
        && JSON.stringify(paint(wOrphan)) === JSON.stringify(RED)
        && /so nothing counts it at all\./.test(weightedList.orphan[0] || ''),
      JSON.stringify({ points: pOrphan, weighted: wOrphan, weightedSays: weightedList.orphan }));
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
