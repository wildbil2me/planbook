/* copy-class.mjs — copying a class, terms and categories only (WO-1.22)
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

export async function run(h) {
const { check, skip, send, evalJs, has, clickSel, KILL_ANIM, waitForBoot, seam } = h;

/*
  ══════════ COPYING A CLASS, TERMS AND CATEGORIES ONLY (WO-1.22) ══════════

  Reloaded first, for the reason every other section that plants a fixture does: a clean DOM with
  every overlay closed, rather than whatever the WO-8.10 section above left the page in.

  Three fixture classes, prefixed `c_wo122_` so nothing here can be mistaken for a class another
  section left behind: an unbalanced source (95%, four terms, four categories, and a roster,
  attendance record, assignment-with-a-score, and both a hall pass in progress and one in history —
  everything the work order's Out-of-scope line says a copy must NOT carry), a balanced source
  (100%, for the other half of acceptance line 8), and an archived class (for the negative half of
  acceptance line 1 — a row nothing else in this run put there).

  WHAT IS NOT HERE AND IS OWED TO A HUMAN: acceptance line 10 in full — whether a seven-action row
  actually WRAPS on a physical iPad rather than merely measuring 44px per control (this file's
  classes-manager sweep, extended for the new button by construction, already covers the 44px
  half), whether Copy is hittable with a thumb, and whether the rename field it opens takes the
  software keyboard. TESTING.md carries that line; nothing below closes it.
*/
console.log('\n--- copying a class, terms and categories only (WO-1.22) ---');
{
  await send('Page.reload');
  await new Promise((r) => setTimeout(r, 600));
  await waitForBoot();
  await evalJs(KILL_ANIM);

  const seam122 = await evalJs("!!(window.planbook && window.planbook.store"
    + " && window.planbook.classes && typeof window.planbook.classes.getSelectedClassId === 'function')");
  if (!seam122) {
    check('the class manager and its window.planbook seam exist to plant a fixture behind',
      false, 'window.planbook.classes is missing');
    skip('the rest of WO-1.22 — the Copy control, the deep copy, the independence of the two '
      + 'arrays, the empty roster, the duplicate naming, the tab bar and home grid, and the '
      + 'weights note',
      'there is no seam to plant a fixture behind or read the result through');
  } else {
    const plant122 = await evalJs(`(function(){
      var s = window.planbook.store;
      var d = s.getDoc();
      if (!d) return { ok:false, why:'no year document is open' };
      s.update(function(doc){
        doc.classes.push({ id:'c_wo122_src', name:'WO-1.22 Copy Source', archived:false,
          terms:[
            { id:'tm_wo122_1', label:'Term A', start:'2026-08-01', end:'2026-10-01' },
            { id:'tm_wo122_2', label:'Term B', start:'2026-10-02', end:'2026-12-01' },
            { id:'tm_wo122_3', label:'Term C', start:'', end:'' },
            { id:'tm_wo122_4', label:'Term D', start:'2027-03-02', end:'2027-06-01' }
          ],
          categories:[
            { id:'k_wo122_1', name:'Tests', weight:40 },
            { id:'k_wo122_2', name:'Quizzes', weight:25 },
            { id:'k_wo122_3', name:'Homework', weight:20 },
            { id:'k_wo122_4', name:'Classwork', weight:10 }
          ],
          letterScale:null, roster:['wo122-s1','wo122-s2'] });
        doc.classes.push({ id:'c_wo122_bal', name:'WO-1.22 Balanced Source', archived:false,
          terms:[{ id:'tm_wo122_bal', label:'Full year', start:'', end:'' }],
          categories:[{ id:'k_wo122_bal', name:'Everything', weight:100 }],
          letterScale:null, roster:[] });
        doc.classes.push({ id:'c_wo122_arch', name:'WO-1.22 Archived', archived:true,
          terms:[{ id:'tm_wo122_arch', label:'Term', start:'', end:'' }],
          categories:[{ id:'k_wo122_arch', name:'Everything', weight:100 }],
          letterScale:null, roster:[] });
        function person(id, last){
          return { id:id, first:'Wo122', last:last, nickname:'', gradYear:'', email:'',
            guardians:[], counselor:{ name:'', email:'' }, notes:'',
            supports:{ plan:'none', caseManager:{ name:'', email:'' }, reviewDate:'',
              accommodations:[], medical:'', behaviorPlan:'' } };
        }
        doc.students.push(person('wo122-s1', 'Ashgrove'));
        doc.students.push(person('wo122-s2', 'Bellweather'));
        doc.attendance.push({ classId:'c_wo122_src', date:'2026-09-15',
          marks:{ 'wo122-s1':{ code:'T' }, 'wo122-s2':{ code:'A' } } });
        doc.assignments.push({ id:'a_wo122', classId:'c_wo122_src', termId:'tm_wo122_1',
          categoryId:'k_wo122_1', name:'WO-1.22 Test', points:100, assigned:'', due:'' });
        doc.scores['a_wo122'] = { 'wo122-s1': { v:90 } };
        doc.openPasses.push({ id:'p_wo122_open', studentId:'wo122-s1', classId:'c_wo122_src',
          type:'bathroom', out:'2026-09-15T09:00:00-04:00' });
        doc.passes.push({ id:'p_wo122_hist', studentId:'wo122-s2', classId:'c_wo122_src',
          type:'nurse', out:'2026-09-14T09:00:00-04:00', back:'2026-09-14T09:10:00-04:00',
          minutes:10, endedBy:'return' });
      });
      var made = s.getDoc();
      return { ok:true,
        classes: made.classes.filter(function(x){ return /^c_wo122_/.test(x.id); }).length,
        students: made.students.filter(function(x){ return /^wo122-/.test(x.id); }).length };
    })()`);
    check('the WO-1.22 fixture planted cleanly — three classes and two students, none of them '
      + 'here before',
      plant122.ok === true && plant122.classes === 3 && plant122.students === 2,
      JSON.stringify(plant122));

    await clickSel('header [data-class-manage]');
    await new Promise((r) => setTimeout(r, 300));

    /* ACCEPTANCE LINE 1 — scoped to the three fixture classes AND asked of the whole panel, so a
       row that failed to render at all (which would make the scoped half vacuously true) cannot
       hide behind it. */
    const rowState = await evalJs(`(function(){
      function info(id){
        return { hasCopy: !!document.querySelector('[data-class-copy="' + id + '"]'),
          hasRestore: !!document.querySelector('[data-class-restore="' + id + '"]') };
      }
      var all = Array.prototype.slice.call(document.querySelectorAll('#classesModal .class-row'));
      var active = all.filter(function(r){ return !r.classList.contains('archived'); });
      var archived = all.filter(function(r){ return r.classList.contains('archived'); });
      return {
        src: info('c_wo122_src'), bal: info('c_wo122_bal'), arch: info('c_wo122_arch'),
        activeCount: active.length,
        activeWithCopy: active.filter(function(r){
          return !!r.querySelector('[data-class-copy]'); }).length,
        archivedCount: archived.length,
        archivedWithCopy: archived.filter(function(r){
          return !!r.querySelector('[data-class-copy]'); }).length
      };
    })()`);
    check('the class manager shows a Copy control on every active class row and on no archived '
      + 'row',
      rowState.src.hasCopy && rowState.bal.hasCopy && !rowState.arch.hasCopy
        && rowState.arch.hasRestore
        && rowState.activeCount > 0 && rowState.activeWithCopy === rowState.activeCount
        && rowState.archivedCount > 0 && rowState.archivedWithCopy === 0,
      JSON.stringify(rowState));

    const order = await evalJs(`(function(){
      var row = document.querySelector('[data-class-copy="c_wo122_src"]').closest('.class-row');
      return Array.prototype.map.call(row.querySelectorAll('.class-row-actions > *'), function(e){
        if (e.hasAttribute('data-class-move-up')) return 'Up';
        if (e.hasAttribute('data-class-move-down')) return 'Down';
        if (e.hasAttribute('data-term-manage')) return 'Terms';
        if (e.hasAttribute('data-category-manage')) return 'Categories';
        if (e.hasAttribute('data-class-copy')) return 'Copy';
        if (e.hasAttribute('data-class-rename')) return 'Rename';
        if (e.hasAttribute('data-class-archive')) return 'Archive';
        return e.textContent;
      });
    })()`);
    check('Copy sits directly after Categories and before Rename on the row — the two things it '
      + 'duplicates',
      JSON.stringify(order)
        === JSON.stringify(['Up', 'Down', 'Terms', 'Categories', 'Copy', 'Rename', 'Archive']),
      JSON.stringify(order));

    /* The open class, set deliberately to the source BEFORE the copy — "the open class does not
       change" is only a claim worth making against a class that was actually open. */
    await evalJs("window.planbook.classes.selectClass('c_wo122_src'); 1");
    const before122 = await evalJs(`(function(){
      var d = window.planbook.store.getDoc();
      return {
        ids: d.classes.map(function(c){ return c.id; }),
        termIds: [].concat.apply([], d.classes.map(function(c){
          return (c.terms || []).map(function(t){ return t.id; }); })),
        catIds: [].concat.apply([], d.classes.map(function(c){
          return (c.categories || []).map(function(k){ return k.id; }); })),
        openClassId: window.planbook.classes.getSelectedClassId()
      };
    })()`);

    await clickSel('[data-class-copy="c_wo122_src"]');
    await new Promise((r) => setTimeout(r, 250));

    const after122 = await evalJs(`(function(){
      var d = window.planbook.store.getDoc();
      var src = d.classes.filter(function(c){ return c.id === 'c_wo122_src'; })[0];
      var idx = d.classes.indexOf(src);
      var copy = d.classes[idx + 1] || null;
      var input = document.querySelector('#classList .rename-input');
      var live = document.querySelector('[aria-live]');
      return {
        ids: d.classes.map(function(c){ return c.id; }),
        idxSrc: idx, copy: copy,
        rename: input ? { value: input.value, focused: input === document.activeElement,
          selStart: input.selectionStart, selEnd: input.selectionEnd } : null,
        liveText: live ? live.textContent : '',
        attendanceRefs: d.attendance.filter(function(r){
          return copy && r.classId === copy.id; }).length,
        assignmentRefs: d.assignments.filter(function(a){
          return copy && a.classId === copy.id; }).length,
        openPassRefs: d.openPasses.filter(function(p){
          return copy && p.classId === copy.id; }).length,
        passRefs: d.passes.filter(function(p){
          return copy && p.classId === copy.id; }).length,
        openClassId: window.planbook.classes.getSelectedClassId(),
        tabIds: Array.prototype.slice.call(document.querySelectorAll('#classTabBar [data-class-tab]'))
          .map(function(b){ return b.getAttribute('data-class-tab'); }),
        homeIds: Array.prototype.slice.call(
          document.querySelectorAll('#homeGrid .class-card .class-card-open'))
          .map(function(b){ return b.getAttribute('data-class-tab'); })
      };
    })()`);
    const copy = after122.copy;

    check('copying a class with four terms and four categories produces exactly one new class, '
      + 'named "… (copy)", sitting directly after its source in the document',
      after122.ids.length === before122.ids.length + 1
        && after122.idxSrc === before122.ids.indexOf('c_wo122_src')
        && !!copy && copy.name === 'WO-1.22 Copy Source (copy)',
      'ids before/after = ' + before122.ids.length + '/' + after122.ids.length
        + ', source at ' + after122.idxSrc + ', copy = ' + JSON.stringify(copy && copy.name));

    const srcTermLabels = ['Term A', 'Term B', 'Term C', 'Term D'];
    const srcTermDates = [['2026-08-01', '2026-10-01'], ['2026-10-02', '2026-12-01'],
      ['', ''], ['2027-03-02', '2027-06-01']];
    const srcCatNames = ['Tests', 'Quizzes', 'Homework', 'Classwork'];
    const srcCatWeights = [40, 25, 20, 10];
    check('its term labels and dates match the source\'s, in order',
      !!copy && copy.terms.length === 4
        && JSON.stringify(copy.terms.map((t) => t.label)) === JSON.stringify(srcTermLabels)
        && JSON.stringify(copy.terms.map((t) => [t.start, t.end])) === JSON.stringify(srcTermDates),
      JSON.stringify(copy && copy.terms));
    check('its category names and weights match the source\'s, in order',
      !!copy && copy.categories.length === 4
        && JSON.stringify(copy.categories.map((k) => k.name)) === JSON.stringify(srcCatNames)
        && JSON.stringify(copy.categories.map((k) => k.weight)) === JSON.stringify(srcCatWeights),
      JSON.stringify(copy && copy.categories));

    const copyTermIds = copy ? copy.terms.map((t) => t.id) : [];
    const copyCatIds = copy ? copy.categories.map((k) => k.id) : [];
    check('every id in the copy is new: its class id, every term id and every category id are '
      + 'absent from the source and from every other class in the document',
      !!copy && before122.ids.indexOf(copy.id) === -1
        && copyTermIds.every((id) => before122.termIds.indexOf(id) === -1)
        && copyCatIds.every((id) => before122.catIds.indexOf(id) === -1)
        && new Set(copyTermIds).size === copyTermIds.length
        && new Set(copyCatIds).size === copyCatIds.length,
      'copy id = ' + (copy && copy.id) + ', term ids = ' + JSON.stringify(copyTermIds)
        + ', category ids = ' + JSON.stringify(copyCatIds));

    check('the copy\'s roster is empty, its letterScale is null and it is not archived, and no '
      + 'attendance record, assignment, score or hall pass in the document refers to it — asserted '
      + 'against a source that has all four (scores are keyed by assignment, and the copy carries '
      + 'zero assignments, so a leaked score is impossible without a leaked assignment)',
      !!copy && copy.roster.length === 0 && copy.letterScale === null && copy.archived === false
        && after122.attendanceRefs === 0 && after122.assignmentRefs === 0
        && after122.openPassRefs === 0 && after122.passRefs === 0,
      JSON.stringify({ roster: copy && copy.roster, letterScale: copy && copy.letterScale,
        archived: copy && copy.archived, attendanceRefs: after122.attendanceRefs,
        assignmentRefs: after122.assignmentRefs, openPassRefs: after122.openPassRefs,
        passRefs: after122.passRefs }));

    check('the open class does not change: it is still the one that was open before the copy',
      after122.openClassId === before122.openClassId && after122.openClassId === 'c_wo122_src',
      'before = ' + before122.openClassId + ', after = ' + after122.openClassId);

    const srcTabIdx = after122.tabIds.indexOf('c_wo122_src');
    const copyTabIdx = copy ? after122.tabIds.indexOf(copy.id) : -1;
    check('the copy is on the class tab bar directly after its source, and in the home grid, '
      + 'without a reload',
      srcTabIdx >= 0 && copyTabIdx === srcTabIdx + 1
        && !!copy && after122.homeIds.indexOf(copy.id) >= 0,
      JSON.stringify({ tabIds: after122.tabIds, homeIds: after122.homeIds, copyId: copy && copy.id }));

    check('the new row lands in the manager with its rename field open and its text selected — '
      + 'the existing startRename() path',
      !!after122.rename && !!copy && after122.rename.value === copy.name && after122.rename.focused
        && after122.rename.selStart === 0 && after122.rename.selEnd === copy.name.length,
      JSON.stringify(after122.rename) + ' against copy name ' + JSON.stringify(copy && copy.name));

    check('announce() says what came across and what did not, naming both counts in one sentence',
      /Copied WO-1\.22 Copy Source to WO-1\.22 Copy Source \(copy\)/.test(after122.liveText)
        && /4 terms/.test(after122.liveText) && /4 categories/.test(after122.liveText)
        && /roster did not come across/.test(after122.liveText),
      JSON.stringify(after122.liveText));

    /* Rename cancelled — copy() already wrote the final name, so cancelling merely returns the row
       to its normal display and does not touch the document. */
    await clickSel('[data-class-rename-cancel]');
    await new Promise((r) => setTimeout(r, 150));

    /* ACCEPTANCE LINE 6, IN FULL — a second copy of the same source, while the first copy's own
       (unedited) name is still on the document exactly as copyClass() wrote it. */
    await clickSel('[data-class-copy="c_wo122_src"]');
    await new Promise((r) => setTimeout(r, 250));
    await clickSel('[data-class-rename-cancel]');
    await new Promise((r) => setTimeout(r, 150));
    const dupe122 = await evalJs(`(function(){
      var d = window.planbook.store.getDoc();
      var wo = d.classes.filter(function(c){
        return c.name.indexOf('WO-1.22 Copy Source') === 0; });
      var allNames = d.classes.map(function(c){ return c.name; });
      return { names: wo.map(function(c){ return c.name; }), count: wo.length,
        uniqueAllNames: new Set(allNames).size === allNames.length };
    })()`);
    check('copying the same class twice produces two classes with different names, and neither '
      + 'name collides with a class already in the document',
      dupe122.count === 3 && dupe122.uniqueAllNames === true
        && dupe122.names.indexOf('WO-1.22 Copy Source') >= 0
        && dupe122.names.indexOf('WO-1.22 Copy Source (copy)') >= 0
        && dupe122.names.indexOf('WO-1.22 Copy Source (copy 2)') >= 0,
      JSON.stringify(dupe122));

    /* ACCEPTANCE LINE 8, ASKED WHILE THE WEIGHTS ARE STILL PRISTINE — the independence edits below
       change a weight on purpose, so the note is read here, before either fixture's total moves. */
    await clickSel('[data-class-copy="c_wo122_bal"]');
    await new Promise((r) => setTimeout(r, 250));
    await clickSel('[data-class-rename-cancel]');
    await new Promise((r) => setTimeout(r, 150));
    const weightsCheck = await evalJs(`(function(){
      var d = window.planbook.store.getDoc();
      function rowWarn(classId){
        var anchor = document.querySelector('[data-term-manage="' + classId + '"]');
        var row = anchor ? anchor.closest('.class-row') : null;
        var w = row ? row.querySelector('.class-row-warn') : null;
        return w ? w.textContent : '';
      }
      function byName(name){ return d.classes.filter(function(c){ return c.name === name; })[0]; }
      var src = d.classes.filter(function(c){ return c.id === 'c_wo122_src'; })[0];
      var bal = d.classes.filter(function(c){ return c.id === 'c_wo122_bal'; })[0];
      var copy1 = byName('WO-1.22 Copy Source (copy)');
      var copy2 = byName('WO-1.22 Copy Source (copy 2)');
      var balCopy = byName('WO-1.22 Balanced Source (copy)');
      return {
        srcWarn: rowWarn(src.id), copy1Warn: copy1 ? rowWarn(copy1.id) : null,
        copy2Warn: copy2 ? rowWarn(copy2.id) : null, balWarn: rowWarn(bal.id),
        balCopyWarn: balCopy ? rowWarn(balCopy.id) : null,
        copy1Found: !!copy1, copy2Found: !!copy2, balCopyFound: !!balCopy,
        copy1Id: copy1 && copy1.id
      };
    })()`);
    check('the copy\'s weights note reads what the source\'s reads: a source at 95% copies to a '
      + 'row saying "weights 95%", and a source that totals 100 copies to a row with no note',
      weightsCheck.copy1Found && weightsCheck.copy2Found && weightsCheck.balCopyFound
        && weightsCheck.srcWarn === 'weights 95%' && weightsCheck.copy1Warn === 'weights 95%'
        && weightsCheck.copy2Warn === 'weights 95%'
        && weightsCheck.balWarn === '' && weightsCheck.balCopyWarn === '',
      JSON.stringify(weightsCheck));

    /* ACCEPTANCE LINE 4 — the check a spread copy would pass every line above and fail here.
       copy1 (the first copy made above) against its source, a term label each way and a category
       weight each way, read off the document immediately after each edit — update() mutates the
       live document synchronously, so there is nothing to wait for between a keystroke and a read. */
    const copy1Id = weightsCheck.copy1Id;
    await clickSel('[data-term-manage="' + copy1Id + '"]');
    await new Promise((r) => setTimeout(r, 200));
    await evalJs('(function(){ var f = document.querySelector('
      + '\'.term-label-input[data-term-id="' + copyTermIds[0] + '"]\'); '
      + 'f.value = "WO-1.22 Copy Term Edited"; '
      + 'f.dispatchEvent(new Event("input", { bubbles: true })); return 1; })()');
    await new Promise((r) => setTimeout(r, 150));
    const termIso1 = await evalJs('(function(){ var d = window.planbook.store.getDoc();'
      + ' function label(cid, tid){ var c = d.classes.filter(function(x){ return x.id === cid; })[0];'
      + '   var t = (c && c.terms || []).filter(function(x){ return x.id === tid; })[0];'
      + '   return t ? t.label : null; }'
      + ' return { copyLabel: label(' + JSON.stringify(copy1Id) + ', ' + JSON.stringify(copyTermIds[0])
      + '), srcLabel: label("c_wo122_src", "tm_wo122_1") }; })()');
    await clickSel('#termsModal [data-modal-close]');
    await new Promise((r) => setTimeout(r, 150));
    await clickSel('[data-term-manage="c_wo122_src"]');
    await new Promise((r) => setTimeout(r, 200));
    await evalJs('(function(){ var f = document.querySelector('
      + '\'.term-label-input[data-term-id="tm_wo122_1"]\'); '
      + 'f.value = "WO-1.22 Source Term Edited"; '
      + 'f.dispatchEvent(new Event("input", { bubbles: true })); return 1; })()');
    await new Promise((r) => setTimeout(r, 150));
    const termIso2 = await evalJs('(function(){ var d = window.planbook.store.getDoc();'
      + ' function label(cid, tid){ var c = d.classes.filter(function(x){ return x.id === cid; })[0];'
      + '   var t = (c && c.terms || []).filter(function(x){ return x.id === tid; })[0];'
      + '   return t ? t.label : null; }'
      + ' return { copyLabel: label(' + JSON.stringify(copy1Id) + ', ' + JSON.stringify(copyTermIds[0])
      + '), srcLabel: label("c_wo122_src", "tm_wo122_1") }; })()');
    await clickSel('#termsModal [data-modal-close]');
    await new Promise((r) => setTimeout(r, 150));

    check('editing a term label IN THE COPY leaves the source\'s unchanged, and editing it IN THE '
      + 'SOURCE leaves the copy\'s unchanged',
      termIso1.copyLabel === 'WO-1.22 Copy Term Edited' && termIso1.srcLabel === 'Term A'
        && termIso2.srcLabel === 'WO-1.22 Source Term Edited'
        && termIso2.copyLabel === 'WO-1.22 Copy Term Edited',
      'after editing the copy: ' + JSON.stringify(termIso1) + '; after editing the source: '
        + JSON.stringify(termIso2));

    await clickSel('[data-category-manage="' + copy1Id + '"]');
    await new Promise((r) => setTimeout(r, 200));
    await evalJs('(function(){ var f = document.querySelector('
      + '\'.category-weight[data-category-id="' + copyCatIds[0] + '"]\'); f.value = "77"; '
      + 'f.dispatchEvent(new Event("input", { bubbles: true })); return 1; })()');
    await new Promise((r) => setTimeout(r, 150));
    const catIso1 = await evalJs('(function(){ var d = window.planbook.store.getDoc();'
      + ' function weight(cid, kid){ var c = d.classes.filter(function(x){ return x.id === cid; })[0];'
      + '   var k = (c && c.categories || []).filter(function(x){ return x.id === kid; })[0];'
      + '   return k ? k.weight : null; }'
      + ' return { copyWeight: weight(' + JSON.stringify(copy1Id) + ', ' + JSON.stringify(copyCatIds[0])
      + '), srcWeight: weight("c_wo122_src", "k_wo122_1") }; })()');
    await clickSel('#categoriesModal [data-modal-close]');
    await new Promise((r) => setTimeout(r, 150));
    await clickSel('[data-category-manage="c_wo122_src"]');
    await new Promise((r) => setTimeout(r, 200));
    await evalJs('(function(){ var f = document.querySelector('
      + '\'.category-weight[data-category-id="k_wo122_1"]\'); f.value = "55"; '
      + 'f.dispatchEvent(new Event("input", { bubbles: true })); return 1; })()');
    await new Promise((r) => setTimeout(r, 150));
    const catIso2 = await evalJs('(function(){ var d = window.planbook.store.getDoc();'
      + ' function weight(cid, kid){ var c = d.classes.filter(function(x){ return x.id === cid; })[0];'
      + '   var k = (c && c.categories || []).filter(function(x){ return x.id === kid; })[0];'
      + '   return k ? k.weight : null; }'
      + ' return { copyWeight: weight(' + JSON.stringify(copy1Id) + ', ' + JSON.stringify(copyCatIds[0])
      + '), srcWeight: weight("c_wo122_src", "k_wo122_1") }; })()');
    await clickSel('#categoriesModal [data-modal-close]');
    await new Promise((r) => setTimeout(r, 150));

    check('editing a category weight IN THE COPY leaves the source\'s unchanged, and editing it '
      + 'IN THE SOURCE leaves the copy\'s unchanged — the check that catches a shared array; a '
      + 'spread copy passes every line above this one',
      catIso1.copyWeight === 77 && catIso1.srcWeight === 40
        && catIso2.srcWeight === 55 && catIso2.copyWeight === 77,
      'after editing the copy: ' + JSON.stringify(catIso1) + '; after editing the source: '
        + JSON.stringify(catIso2));

    await evalJs("window.planbook.closeModal('classesModal'); 1");
  }
}
}
