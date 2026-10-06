/* copy-class.mjs — copying a class, terms and categories only (WO-1.22)
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 *
 * Since WO-3.48 (2026-10-05) the file holds the OTHER copy too: one assignment into several classes
 * in one dialog, in its own block at the foot. It plants five classes of its own, reloads at its head
 * and its foot, takes them back out, and hands the page back at 1280x900 with touch off — the state
 * print-sheets.mjs set and this section received.
 */

import { measureIn } from './touch-targets.mjs';

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
      /* THE OPEN PASS WENT OUT TWO MINUTES AGO, BY THE CLOCK, AND NOT AT A WRITTEN-DOWN HOUR. It read
         out:'2026-09-15T09:00:00-04:00' until 2026-09-15, and on that date exactly it became a pass
         676 minutes overdue the moment the class was opened: src/attendance.js announced it, the live
         region held that sentence instead of the copy's, and the announce() check below went red
         on a build in which nothing about copying a class had changed. Every day before it the stamp
         was in the FUTURE and alerted nothing, which is why it was green for a fortnight. Two minutes
         is under the five the first alert level wants, so the card draws and nothing fires. Written
         in the app's own local-offset shape (src/passes.js), the way cooldown-quiet.mjs stamps its
         log entries. Found by WO-6.7's first run, 2026-09-15 — the one-date collision WO-1.44 added
         --today to reproduce. No backticks in this comment. */
      var outAt = (function(){
        var t = new Date(Date.now() - 2 * 60000);
        var p = function(n){ return (n < 10 ? '0' : '') + n; };
        var o = -t.getTimezoneOffset();
        var off = (o < 0 ? '-' : '+') + p(Math.floor(Math.abs(o) / 60)) + ':' + p(Math.abs(o) % 60);
        return t.getFullYear() + '-' + p(t.getMonth() + 1) + '-' + p(t.getDate()) + 'T'
          + p(t.getHours()) + ':' + p(t.getMinutes()) + ':' + p(t.getSeconds()) + off;
      })();
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
          type:'bathroom', out:outAt });
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

    /* WO-3.34: the copy carries how its source is graded, and a weighted source — this one has no
       `gradingMode` key, which is what weighted IS — writes no key onto its copy. An absent key is
       the default, and a "weighted" seeded here would be the seeded default the data model refuses.
       The points half is in points-grade.mjs, beside the points fixture it copies. The copy came back
       through JSON, so an absent key is absent here too rather than undefined-and-present. */
    check('WO-3.34: copying a weighted class writes no gradingMode key onto the copy',
      !!copy && !Object.prototype.hasOwnProperty.call(copy, 'gradingMode'),
      JSON.stringify(copy && Object.keys(copy)));

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

/*
  ══════════ ONE ASSIGNMENT INTO SEVERAL CLASSES IN ONE DIALOG (WO-3.48) ══════════

  Here rather than in verify/assignments.mjs, beside the class copy, because this block needs a
  fixture that file cannot build out of the classes the run happens to leave: four target classes
  whose differences are the whole of the claim — one with a category of the source's name under
  another id (and in a different case, with spaces, because the match trims and folds case), one
  with categories but none of that name, one with no categories at all, and one with no terms. Its
  five classes are prefixed `c_wo348_`, and all of them come back out at the foot.

  WHAT IS DRIVEN, ALL THROUGH THE CONTROLS A TEACHER TOUCHES: a row's Duplicate, the class pills, each
  row's two selects and its date field, the confirm, Cancel, the close button, Escape, the editor's
  + New assignment, its name field, its Copy into other classes…, and its Cancel. The window.planbook
  seam plants the fixture, reads the document, and archives the other classes for the one-class case.

  WHAT IS NOT HERE AND IS OWED TO A HUMAN: WO-3.48's last Acceptance line — three sections, three
  different due dates, read on each class's own list on a real iPad after a force-quit. The coarse
  pass below measures every control in the open dialog and that the rows stack without a sideways
  scroll at portrait-iPad width; it cannot hold a native date picker or a select wheel.
*/
console.log('\n--- one assignment into several classes in one dialog (WO-3.48) ---');
{
  const { INSTALL_WALKER } = h;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const flush = () => evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  const SRC = 'c_wo348_src', P2 = 'c_wo348_p2', P4 = 'c_wo348_p4', P6 = 'c_wo348_p6',
    P5 = 'c_wo348_p5';
  const NAMES = { [SRC]: 'WO-3.48 English I P1', [P2]: 'WO-3.48 English I P2',
    [P4]: 'WO-3.48 English I P4', [P6]: 'WO-3.48 English I P6', [P5]: 'WO-3.48 English I P5' };
  const ESSAY = 'a348_essay', BLANK = 'a348_blank';
  const SRC_ESSAYS = 'k348_src_essays', P2_ESSAYS = 'k348_p2_essays';

  await flush();
  await send('Emulation.setDeviceMetricsOverride',
    { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await send('Page.reload');
  await sleep(600);
  await waitForBoot();
  await evalJs(KILL_ANIM);
  await evalJs(INSTALL_WALKER);

  const plant348 = await evalJs(`(async function(){
    var s = window.planbook.store, c = window.planbook.classes;
    if (!s || !c || !s.getDoc()) return { ok:false, why:'no seam or no open year' };
    s.update(function(doc){
      if (!Array.isArray(doc.assignments)) doc.assignments = [];
      if (!doc.scores) doc.scores = {};
      doc.students.push({ id:'wo348-s1', first:'Odette', last:'Ashby' });
      function cls(id, name, terms, cats, roster){
        doc.classes.push({ id:id, name:name, archived:false, letterScale:null, roster:roster || [],
          terms:terms, categories:cats });
      }
      cls('${SRC}', ${JSON.stringify(NAMES[SRC])},
        [{ id:'tm348_src', label:'Q1', start:'', end:'' }],
        [{ id:'${SRC_ESSAYS}', name:'Essays', weight:60 }, { id:'k348_src_quiz', name:'Quizzes', weight:40 }],
        ['wo348-s1']);
      /* Essays SECOND and spelt differently: a match by position, or by exact string, would miss it. */
      cls('${P2}', ${JSON.stringify(NAMES[P2])},
        [{ id:'tm348_p2a', label:'Q1', start:'', end:'' }, { id:'tm348_p2b', label:'Q2', start:'', end:'' }],
        [{ id:'k348_p2_quiz', name:'Quizzes', weight:30 }, { id:'${P2_ESSAYS}', name:' essays ', weight:70 }]);
      cls('${P4}', ${JSON.stringify(NAMES[P4])},
        [{ id:'tm348_p4', label:'Q1', start:'', end:'' }],
        [{ id:'k348_p4_hw', name:'Homework', weight:100 }]);
      cls('${P6}', ${JSON.stringify(NAMES[P6])},
        [{ id:'tm348_p6', label:'Q1', start:'', end:'' }], []);
      cls('${P5}', ${JSON.stringify(NAMES[P5])}, [],
        [{ id:'k348_p5_essays', name:'Essays', weight:100 }]);
      doc.assignments.push({ id:'${ESSAY}', classId:'${SRC}', termId:'tm348_src',
        categoryId:'${SRC_ESSAYS}', name:'WO-3.48 Essay 2', points:50,
        assigned:'2026-09-28', due:'2026-10-02' });
      doc.assignments.push({ id:'${BLANK}', classId:'${SRC}', termId:'tm348_src',
        categoryId:'k348_src_quiz', name:'WO-3.48 Quiz 1', points:10,
        assigned:'2026-09-29', due:'' });
      doc.scores['${ESSAY}'] = { 'wo348-s1': { v:44 } };
    });
    c.selectClass('${SRC}'); c.selectTerm('tm348_src'); c.refreshClassBar();
    await s.flush();
    return { ok:true, classes: s.getDoc().classes.filter(function(x){ return /^c_wo348_/.test(x.id); }).length };
  })()`);
  check('WO-3.48: the fixture planted cleanly — a source and four targets that differ in exactly the '
    + 'ways the dialog has to speak to',
    plant348.ok === true && plant348.classes === 5, JSON.stringify(plant348));

  /* Onto the source class's assignment list through its home card and the switcher. */
  const toSourceList = async () => {
    const nth = await evalJs(`(function(){ var all = document.querySelectorAll('[data-view-home]');
      for (var i = 0; i < all.length; i++) { var r = all[i].getBoundingClientRect();
        if (r.width > 0 && r.height > 0) return i; } return -1; })()`);
    if (nth >= 0) { await clickSel('[data-view-home]', nth); await sleep(250); }
    await clickSel('#homeGrid [data-class-tab="' + SRC + '"]');
    await sleep(250);
    await clickSel('#classView [data-class-screen="assignments"]');
    await sleep(250);
  };
  await toSourceList();

  /* Everything a check below reads off the dialog, in one round trip: the pills, every row's two
     selects (value AND the option actually displayed), its due field and its own note, the global
     note, and the confirm. */
  const READ348 = `(function(){
    var modal = document.getElementById('assignmentCopyModal');
    var pills = Array.prototype.map.call(document.querySelectorAll('#assignmentCopyClasses [data-assignment-copy-class]'),
      function(p){ return { id: p.getAttribute('data-assignment-copy-class'), pressed: p.getAttribute('aria-pressed'),
        active: p.classList.contains('active') }; });
    function shown(sel){ if (!sel || sel.selectedIndex < 0) return null; return sel.options[sel.selectedIndex].value; }
    var rows = Array.prototype.map.call(document.querySelectorAll('#assignmentCopyFields [data-assignment-copy-row]'),
      function(r){
        var id = r.getAttribute('data-assignment-copy-row');
        var term = r.querySelector('[data-assignment-copy-term]');
        var cat = r.querySelector('[data-assignment-copy-category]');
        var due = r.querySelector('[data-assignment-copy-due]');
        var note = r.querySelector('[data-assignment-copy-row-note]');
        return { id: id, head: (r.querySelector('.assign-copy-target-head') || {}).textContent,
          termHook: term ? term.getAttribute('data-assignment-copy-term') : null,
          term: term ? term.value : null, termShown: shown(term), termDisabled: term ? term.disabled : null,
          cat: cat ? cat.value : null, catShown: shown(cat), catDisabled: cat ? cat.disabled : null,
          catLabel: cat && cat.selectedIndex >= 0 ? cat.options[cat.selectedIndex].textContent : null,
          due: due ? due.value : null, note: note ? note.textContent.replace(/\\s+/g, ' ') : '' };
      });
    var btn = document.getElementById('assignmentCopyBtn');
    return { open: !!modal && !modal.classList.contains('hidden'),
      editorOpen: !document.getElementById('assignmentModal').classList.contains('hidden'),
      title: (document.getElementById('assignmentCopyTitle') || {}).textContent,
      lead: (document.getElementById('assignmentCopyLead') || {}).textContent.replace(/\\s+/g, ' '),
      note: (document.getElementById('assignmentCopyNote') || {}).textContent.replace(/\\s+/g, ' '),
      name: (document.querySelector('[data-assignment-copy-name]') || {}).value,
      pills: pills, rows: rows,
      button: btn ? btn.textContent : null, disabled: btn ? btn.disabled : null };
  })()`;
  const DOC348 = `(function(){ var d = window.planbook.store.getDoc();
    return { rev: d.rev,
      assignments: d.assignments.map(function(a){ return JSON.parse(JSON.stringify(a)); }),
      scoreKeys: Object.keys(d.scores || {}), essayScores: JSON.stringify((d.scores || {})['${ESSAY}']) }; })()`;
  const pick = async (sel, value, ev) => {
    await evalJs(`(function(){ var s = document.querySelector(${JSON.stringify(sel)}); if (!s) return 0;
      s.value = ${JSON.stringify(String(value))};
      s.dispatchEvent(new Event(${JSON.stringify(ev || 'change')}, { bubbles: true })); return 1; })()`);
    await sleep(150);
  };
  const tick = async (id) => { await clickSel('#assignmentCopyClasses [data-assignment-copy-class="' + id + '"]'); };
  const liveSays = async (re) => {
    let said = '';
    for (let i = 0; i < 20; i++) {
      said = await evalJs("(document.getElementById('srLive') || {}).textContent || ''");
      if (re.test(said)) break;
      await sleep(50);
    }
    return said;
  };
  const rowOf = (st, id) => st.rows.filter((r) => r.id === id)[0] || null;
  const closeIfOpen348 = () => evalJs("['assignmentCopyModal','assignmentModal']"
    + ".forEach(function(m){ window.planbook.closeModal(m); }); 1");

  /* ── NO PRE-SELECTION, FROM DUPLICATE ── */
  const docBefore348 = await evalJs(DOC348);
  await clickSel('#assignmentsView [data-assignment-duplicate="' + ESSAY + '"]');
  await sleep(150);
  const opened = await evalJs(READ348);
  check('WO-3.48: Duplicate opens with no class ticked — every pill reads aria-pressed="false" — no row, '
    + 'and the confirm disabled; the source\'s own class is still offered, for a second copy beside it',
    opened.open && opened.pills.length >= 5
      && opened.pills.every((p) => p.pressed === 'false' && !p.active)
      && opened.pills.some((p) => p.id === SRC)
      && opened.rows.length === 0 && opened.disabled === true
      && opened.title === 'Duplicate this assignment',
    JSON.stringify({ pills: opened.pills.length, pressed: opened.pills.filter((p) => p.pressed !== 'false'),
      rows: opened.rows.length, disabled: opened.disabled, title: opened.title }));

  /* ── THREE TICKS, AND WHAT EACH ROW PROPOSES ──
     Ticked in the order P6, P2, P4 on purpose: a single "current term" the last tick overwrote would
     leave P2 and P6 showing P4's term, which neither class has — so each would fall to its placeholder
     and the per-row check below goes red. */
  await tick(P6); await tick(P2); await tick(P4);
  const three = await evalJs(READ348);
  const r2 = rowOf(three, P2), r4 = rowOf(three, P4), r6 = rowOf(three, P6);
  const pillOrder = three.pills.map((p) => p.id).filter((id) => [P2, P4, P6].indexOf(id) >= 0);
  check('WO-3.48: three ticks make three rows — one per class, headed by its name, in the order the pills '
    + 'are drawn rather than the order they were tapped — and the three pills read aria-pressed="true"',
    three.rows.length === 3 && JSON.stringify(three.rows.map((r) => r.id)) === JSON.stringify(pillOrder)
      && !!r2 && r2.head === NAMES[P2] && !!r4 && r4.head === NAMES[P4] && !!r6 && r6.head === NAMES[P6]
      && three.pills.filter((p) => p.pressed === 'true').map((p) => p.id).sort().join()
        === [P2, P4, P6].sort().join(),
    JSON.stringify({ rows: three.rows.map((r) => r.id), pills: pillOrder }));
  check('WO-3.48: every row\'s selects show the value that will be written — P2 its first term and its own '
    + 'id for the matched " essays ", P4 its own term and the "choose a category" placeholder (no match), '
    + 'P6 its own term and a disabled "no categories" select — each selected option equal to its proposal',
    !!r2 && r2.termHook === P2 && r2.term === 'tm348_p2a' && r2.termShown === 'tm348_p2a'
      && r2.cat === P2_ESSAYS && r2.catShown === P2_ESSAYS
      && !!r4 && r4.term === 'tm348_p4' && r4.termShown === 'tm348_p4'
      && r4.cat === '' && r4.catShown === '' && /choose a category/i.test(r4.catLabel || '')
      && r4.catDisabled === false
      && !!r6 && r6.term === 'tm348_p6' && r6.termShown === 'tm348_p6'
      && r6.cat === '' && r6.catShown === '' && r6.catDisabled === true
      && /has no categories/.test(r6.catLabel || ''),
    JSON.stringify([r2, r4, r6].map((r) => r && { id: r.id, term: r.term, termShown: r.termShown,
      cat: r.cat, catShown: r.catShown, catLabel: r.catLabel })));
  check('WO-3.48: each row says its own fallback before the tap — P4 that nothing there is called "Essays", '
    + 'P6 that it has no categories — and the matched P2 says nothing',
    !!r2 && r2.note === ''
      && !!r4 && /Nothing in WO-3\.48 English I P4 is called “Essays”/.test(r4.note)
      && /never carried across/.test(r4.note)
      && !!r6 && /WO-3\.48 English I P6 has no grading categories yet/.test(r6.note),
    JSON.stringify({ p2: r2 && r2.note, p4: r4 && r4.note.slice(0, 80), p6: r6 && r6.note.slice(0, 80) }));
  check('WO-3.48: every row\'s due date starts on the source\'s (2026-10-02), the name is one field above '
    + 'them, and the confirm names the count — "Copy into 3 classes"',
    three.rows.every((r) => r.due === '2026-10-02') && three.name === 'WO-3.48 Essay 2'
      && three.button === 'Copy into 3 classes' && three.disabled === false,
    JSON.stringify({ dues: three.rows.map((r) => r.due), name: three.name, button: three.button }));
  check('WO-3.48: the dates note no longer says the dates come across as they are — it says the assigned '
    + 'date does, each due date starts on the source\'s, and nothing re-dates a copy to today',
    !/come across as they are/.test(three.note)
      && /assigned date comes across as it is/.test(three.note)
      && /Each due date starts on this assignment’s/.test(three.note)
      && /nothing re-dates a copy to today/.test(three.note),
    JSON.stringify(three.note));

  /* ── ONE ROW'S EDITS STAY IN THAT ROW ── P2's term moved to Q2, P4's due typed (input), P6's due
     picked (change). Nothing else may move, and nothing reaches the document. */
  await pick('[data-assignment-copy-term="' + P2 + '"]', 'tm348_p2b', 'change');
  await pick('[data-assignment-copy-due="' + P4 + '"]', '2026-10-06', 'input');
  await pick('[data-assignment-copy-due="' + P6 + '"]', '2026-10-08', 'change');
  const edited = await evalJs(READ348);
  const e2 = rowOf(edited, P2), e4 = rowOf(edited, P4), e6 = rowOf(edited, P6);
  check('WO-3.48: changing one row changes only that row — P2\'s term to Q2 leaves P4\'s and P6\'s terms, and '
    + 'P4\'s and P6\'s due dates leave P2\'s on the source\'s; every category stays where it was',
    !!e2 && e2.term === 'tm348_p2b' && e2.termShown === 'tm348_p2b' && e2.due === '2026-10-02'
      && e2.cat === P2_ESSAYS
      && !!e4 && e4.term === 'tm348_p4' && e4.due === '2026-10-06' && e4.cat === ''
      && !!e6 && e6.term === 'tm348_p6' && e6.due === '2026-10-08' && e6.cat === '',
    JSON.stringify([e2, e4, e6].map((r) => r && { id: r.id, term: r.term, cat: r.cat, due: r.due })));

  /* ── A CLASS WITH NO TERMS: SHOWN, SAYS WHY, AND BLOCKS THE CONFIRM ── */
  await tick(P5);
  const withP5 = await evalJs(READ348);
  const r5 = rowOf(withP5, P5);
  check('WO-3.48: a ticked class with no terms is shown as a row, says it has no terms and to untick it, '
    + 'shows a disabled term select holding nothing, and the confirm is disabled',
    withP5.rows.length === 4 && !!r5 && r5.term === '' && r5.termDisabled === true
      && /WO-3\.48 English I P5 has no terms/.test(r5.note) && /untick it/.test(r5.note)
      && withP5.disabled === true && withP5.button === 'Copy into 4 classes',
    JSON.stringify({ row: r5, disabled: withP5.disabled, button: withP5.button }));
  /* A press on the disabled confirm, through the real pointer, then the document read after a flush. */
  await clickSel('#assignmentCopyBtn');
  await flush();
  const afterRefused = await evalJs(DOC348);
  const stillOpen = await evalJs(READ348);
  check('WO-3.48: pressing the confirm while a no-terms class is ticked writes nothing — no copy for any '
    + 'row, `rev` unmoved after a flush — and leaves the dialog open on all four rows',
    afterRefused.rev === docBefore348.rev
      && afterRefused.assignments.length === docBefore348.assignments.length
      && stillOpen.open && stillOpen.rows.length === 4,
    'rev ' + docBefore348.rev + ' -> ' + afterRefused.rev + ', assignments '
      + docBefore348.assignments.length + ' -> ' + afterRefused.assignments.length);

  /* ── UNTICKING TAKES THE ROW AWAY ── */
  await tick(P5);
  const unticked = await evalJs(READ348);
  check('WO-3.48: unticking a class removes its row and its pill reads aria-pressed="false"; the other '
    + 'three rows keep every edit made to them, and the confirm is back to "Copy into 3 classes"',
    unticked.rows.length === 3 && !rowOf(unticked, P5)
      && unticked.pills.filter((p) => p.id === P5)[0].pressed === 'false'
      && rowOf(unticked, P2).term === 'tm348_p2b' && rowOf(unticked, P4).due === '2026-10-06'
      && rowOf(unticked, P6).due === '2026-10-08'
      && unticked.button === 'Copy into 3 classes' && unticked.disabled === false,
    JSON.stringify({ rows: unticked.rows.map((r) => r.id), button: unticked.button }));

  /* ── THE WRITE ── */
  await clickSel('#assignmentCopyBtn');
  const said348 = await liveSays(/^Copied /);
  await flush();
  const afterCopy = await evalJs(DOC348);
  const beforeIds = docBefore348.assignments.map((a) => a.id);
  const made = afterCopy.assignments.filter((a) => beforeIds.indexOf(a.id) === -1);
  const madeIn = (id) => made.filter((a) => a.classId === id)[0] || null;
  const m2 = madeIn(P2), m4 = madeIn(P4), m6 = madeIn(P6);
  const closed348 = await evalJs(READ348);
  check('WO-3.48: confirming writes exactly three assignments — each a new id, its own class\'s classId and '
    + 'termId, no scores entry, and the due date its row showed (P2 2026-10-02 in Q2, P4 2026-10-06, P6 '
    + '2026-10-08) — and none for the class that was unticked',
    made.length === 3 && !!m2 && !!m4 && !!m6
      && new Set(made.map((a) => a.id)).size === 3 && made.every((a) => a.id !== ESSAY)
      && m2.termId === 'tm348_p2b' && m4.termId === 'tm348_p4' && m6.termId === 'tm348_p6'
      && m2.due === '2026-10-02' && m4.due === '2026-10-06' && m6.due === '2026-10-08'
      && made.every((a) => afterCopy.scoreKeys.indexOf(a.id) === -1)
      && made.every((a) => a.classId !== P5)
      && afterCopy.essayScores === docBefore348.essayScores
      && !closed348.open,
    JSON.stringify(made.map((a) => ({ id: a.id, classId: a.classId, termId: a.termId, due: a.due }))));
  check('WO-3.48: the copy into P2 is filed under P2\'s OWN id for "Essays", P4\'s and P6\'s under no '
    + 'category, and no copy carries the source\'s categoryId into another class',
    !!m2 && m2.categoryId === P2_ESSAYS && !!m4 && m4.categoryId === '' && !!m6 && m6.categoryId === ''
      && made.every((a) => a.categoryId !== SRC_ESSAYS),
    JSON.stringify(made.map((a) => ({ classId: a.classId, categoryId: a.categoryId }))));
  check('WO-3.48: each copy carries the source\'s assigned date and points and the one name, holds exactly '
    + 'the eight fields an assignment has (nothing spread from the source), and the source is untouched',
    made.every((a) => a.assigned === '2026-09-28' && a.points === 50 && a.name === 'WO-3.48 Essay 2'
      && Object.keys(a).sort().join() === 'assigned,categoryId,classId,due,id,name,points,termId')
      && JSON.stringify(afterCopy.assignments.filter((a) => a.id === ESSAY))
        === JSON.stringify(docBefore348.assignments.filter((a) => a.id === ESSAY)),
    JSON.stringify(made.map((a) => Object.keys(a).sort().join())));
  check('WO-3.48: the three copies are one save — `rev` moved by exactly one across the confirm',
    afterCopy.rev === docBefore348.rev + 1, 'rev ' + docBefore348.rev + ' -> ' + afterCopy.rev);
  check('WO-3.48: it announces once, naming the classes: "Copied WO-3.48 Essay 2 into P2, P4 and P6 with no '
    + 'scores on them."',
    said348 === 'Copied WO-3.48 Essay 2 into ' + NAMES[P2] + ', ' + NAMES[P4] + ' and ' + NAMES[P6]
      + ' with no scores on them.',
    JSON.stringify(said348));

  /* ── A BLANK SOURCE DUE STAYS BLANK IN EVERY ROW ── */
  await clickSel('#assignmentsView [data-assignment-duplicate="' + BLANK + '"]');
  await sleep(150);
  await tick(P2); await tick(P4); await tick(SRC);
  const blank = await evalJs(READ348);
  const bs = rowOf(blank, SRC);
  check('WO-3.48: duplicating an assignment with no due date starts every row blank, and the note says it '
    + 'has none rather than promising a date; ticking its own class keeps its own term and category',
    blank.rows.length === 3 && blank.rows.every((r) => r.due === '')
      && /has no due date/.test(blank.note) && !/come across as they are/.test(blank.note)
      && !!bs && bs.term === 'tm348_src' && bs.cat === 'k348_src_quiz' && bs.catShown === 'k348_src_quiz',
    JSON.stringify({ dues: blank.rows.map((r) => r.due), note: blank.note.slice(0, 90), own: bs && [bs.term, bs.cat] }));

  /* ── CANCEL, CLOSE AND ESCAPE WRITE NOTHING ── each one after a tick and an edited due date, each
     read after a flush, because update() only schedules a save (WO-5.3's harness). */
  const docPreDismiss = await evalJs(DOC348);
  const dismissals = [];
  for (const how of ['Cancel', 'Close', 'Escape']) {
    await closeIfOpen348();
    await clickSel('#assignmentsView [data-assignment-duplicate="' + ESSAY + '"]');
    await sleep(150);
    const fresh = await evalJs(READ348);
    await tick(P2);
    await pick('[data-assignment-copy-due="' + P2 + '"]', '2026-11-11', 'input');
    if (how === 'Cancel') await clickSel('[data-assignment-copy-cancel]');
    else if (how === 'Close') await clickSel('#assignmentCopyModal [data-modal-close]');
    else {
      await evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); 1");
      await sleep(150);
    }
    await flush();
    const after = await evalJs(DOC348);
    const st = await evalJs(READ348);
    dismissals.push({ how, freshTicked: fresh.pills.filter((p) => p.pressed === 'true').length,
      rev: after.rev, count: after.assignments.length, open: st.open });
  }
  check('WO-3.48: Cancel, the close button and Escape each write nothing — `rev` and the assignment count '
    + 'unmoved after a flush — and each reopening starts with nothing ticked',
    dismissals.length === 3
      && dismissals.every((d) => d.rev === docPreDismiss.rev && d.count === docPreDismiss.assignments.length
        && d.open === false && d.freshTicked === 0),
    JSON.stringify(dismissals) + ' against rev ' + docPreDismiss.rev);


  /* ── THE CREATE DOOR ── */
  await closeIfOpen348();
  await clickSel('#assignmentsView [data-assignment-new]');
  await sleep(150);
  const doorShown = await evalJs(`(function(){ var b = document.getElementById('assignmentCopyDoor');
    return { exists: !!b, hidden: b ? b.classList.contains('hidden') : null,
      w: b ? b.getBoundingClientRect().width : 0, text: b ? b.textContent : '',
      editorOpen: !document.getElementById('assignmentModal').classList.contains('hidden'),
      cancelShown: !document.getElementById('assignmentCreateCancel').classList.contains('hidden') }; })()`);
  await evalJs(`(function(){ var f = document.querySelector('#assignmentFields [data-assignment-field="name"]');
    f.value = 'WO-3.48 Essay 3'; f.dispatchEvent(new Event('input', { bubbles: true })); return 1; })()`);
  await sleep(150);
  const createdId = await evalJs(`(function(){ var d = window.planbook.store.getDoc();
    var a = d.assignments.filter(function(x){ return x.classId === '${SRC}' && x.name === 'WO-3.48 Essay 3'; });
    return a.length === 1 ? a[0].id : ''; })()`);
  await clickSel('#assignmentCopyDoor');
  await sleep(150);
  const fromCreate = await evalJs(READ348);
  check('WO-3.48: during a create, with other active classes, the editor shows "Copy into other classes…" '
    + 'beside Done, alongside Cancel',
    doorShown.exists && doorShown.hidden === false && doorShown.w > 0 && doorShown.editorOpen
      && doorShown.cancelShown && doorShown.text === 'Copy into other classes…',
    JSON.stringify(doorShown));
  check('WO-3.48: the create door closes the editor and opens the dialog on the NEW assignment — its name, '
    + 'a lead saying each copy is separate and does not follow later changes — with nothing ticked and '
    + 'the source\'s own class not offered',
    !!createdId && fromCreate.open && !fromCreate.editorOpen
      && fromCreate.title === 'Copy into other classes'
      && fromCreate.name === 'WO-3.48 Essay 3' && /“WO-3\.48 Essay 3”/.test(fromCreate.lead)
      && /separate assignment/.test(fromCreate.lead) && /does not change the copies/.test(fromCreate.lead)
      && fromCreate.pills.length >= 4 && fromCreate.pills.every((p) => p.id !== SRC)
      && fromCreate.pills.every((p) => p.pressed === 'false') && fromCreate.rows.length === 0
      && fromCreate.disabled === true,
    JSON.stringify({ createdId, title: fromCreate.title, name: fromCreate.name,
      pills: fromCreate.pills.map((p) => p.id), lead: fromCreate.lead.slice(0, 120) }));
  await tick(P2);
  await clickSel('#assignmentCopyBtn');
  await flush();
  const createCopy = await evalJs(`(function(){ var d = window.planbook.store.getDoc();
    return { src: d.assignments.filter(function(a){ return a.id === ${JSON.stringify(createdId)}; }).length,
      p2: d.assignments.filter(function(a){ return a.classId === '${P2}' && a.name === 'WO-3.48 Essay 3'; })
        .map(function(a){ return { id: a.id, categoryId: a.categoryId, termId: a.termId }; }) }; })()`);
  check('WO-3.48: confirming from the create door copies the new assignment into the class ticked and keeps '
    + 'the new assignment itself — closing the editor through the door is not its Cancel',
    createCopy.src === 1 && createCopy.p2.length === 1 && createCopy.p2[0].id !== createdId
      && createCopy.p2[0].categoryId === P2_ESSAYS && createCopy.p2[0].termId === 'tm348_p2a',
    JSON.stringify(createCopy));
  await clickSel('#assignmentsView [data-assignment-edit="' + ESSAY + '"]');
  await sleep(150);
  const onEdit = await evalJs(`(function(){ var b = document.getElementById('assignmentCopyDoor');
    return { editorOpen: !document.getElementById('assignmentModal').classList.contains('hidden'),
      hidden: b ? b.classList.contains('hidden') : null, w: b ? b.getBoundingClientRect().width : -1 }; })()`);
  check('WO-3.48: opening an existing row through Edit does not show "Copy into other classes…"',
    onEdit.editorOpen && onEdit.hidden === true && onEdit.w === 0, JSON.stringify(onEdit));
  await closeIfOpen348();

  /* ── ONE ACTIVE CLASS: NO DOOR ── every other active class is put away for one create, through the
     seam, and put back exactly as it was. */
  const parked = await evalJs(`(function(){ var s = window.planbook.store; var ids = [];
    s.update(function(doc){ doc.classes.forEach(function(c){
      if (c.id !== '${SRC}' && !c.archived) { c.archived = true; ids.push(c.id); } }); });
    window.planbook.classes.refreshClassBar(); return ids; })()`);
  await clickSel('#assignmentsView [data-assignment-new]');
  await sleep(150);
  const lone = await evalJs(`(function(){ var b = document.getElementById('assignmentCopyDoor');
    return { active: window.planbook.classes.getActiveClasses().length,
      editorOpen: !document.getElementById('assignmentModal').classList.contains('hidden'),
      cancelShown: !document.getElementById('assignmentCreateCancel').classList.contains('hidden'),
      hidden: b ? b.classList.contains('hidden') : null }; })()`);
  await clickSel('[data-assignment-create-cancel]');
  await evalJs(`(function(){ var s = window.planbook.store; var ids = ${JSON.stringify(parked)};
    s.update(function(doc){ doc.classes.forEach(function(c){ if (ids.indexOf(c.id) >= 0) c.archived = false; }); });
    window.planbook.classes.refreshClassBar(); return 1; })()`);
  check('WO-3.48: with one active class, a create shows Cancel and no "Copy into other classes…"',
    parked.length >= 4 && lone.active === 1 && lone.editorOpen && lone.cancelShown && lone.hidden === true,
    JSON.stringify({ parked: parked.length, lone }));

  /* ── THE COARSE PASS, AT PORTRAIT-IPAD WIDTH ── */
  await flush();
  await send('Emulation.setDeviceMetricsOverride',
    { width: 768, height: 1024, deviceScaleFactor: 2, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Page.reload');
  await sleep(700);
  await waitForBoot();
  await evalJs(KILL_ANIM);
  await evalJs(INSTALL_WALKER);
  const coarse348 = await evalJs("matchMedia('(pointer: coarse)').matches && innerWidth === 768");
  await evalJs("window.planbook.classes.selectClass('" + SRC + "'); 1");
  await toSourceList();
  await clickSel('#assignmentsView [data-assignment-duplicate="' + ESSAY + '"]');
  await sleep(150);
  await tick(P2); await tick(P4); await tick(P6);
  const touch348 = await evalJs(measureIn('#assignmentCopyModal'));
  const under348 = touch348.filter((m) => m.h < 44 || m.w < 44);
  const layout348 = await evalJs(`(function(){
    var panel = document.querySelector('#assignmentCopyModal .modal-panel');
    var body = document.querySelector('#assignmentCopyModal .modal-body');
    var rows = Array.prototype.map.call(document.querySelectorAll('#assignmentCopyFields [data-assignment-copy-row]'),
      function(r){
        var t = r.querySelector('[data-assignment-copy-term]').getBoundingClientRect();
        var c = r.querySelector('[data-assignment-copy-category]').getBoundingClientRect();
        var d = r.querySelector('[data-assignment-copy-due]').getBoundingClientRect();
        var card = r.getBoundingClientRect();
        return { stacked: c.top >= t.bottom && d.top >= c.bottom && Math.abs(t.left - c.left) < 1
            && Math.abs(c.left - d.left) < 1,
          inside: t.right <= card.right + 0.5 && c.right <= card.right + 0.5 && d.right <= card.right + 0.5 };
      });
    return { rows: rows, panelScroll: panel.scrollWidth - panel.clientWidth,
      bodyScroll: body.scrollWidth - body.clientWidth,
      pageScroll: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  })()`);
  check('WO-3.48: under a coarse pointer at 768px, every control in the open three-row dialog measures '
    + '>=44px both ways — pills, name, both selects, the date field and its Clear, the confirm and Cancel',
    coarse348 === true && touch348.length >= 3 * 4 + 5 && under348.length === 0,
    'coarse = ' + coarse348 + ', measured ' + touch348.length + '; under = '
      + JSON.stringify(under348.slice(0, 6)));
  check('WO-3.48: at that width each row stacks term, category and due one above the other, inside its card, '
    + 'and nothing scrolls sideways',
    layout348.rows.length === 3 && layout348.rows.every((r) => r.stacked && r.inside)
      && layout348.panelScroll <= 0 && layout348.bodyScroll <= 0 && layout348.pageScroll <= 0,
    JSON.stringify(layout348));
  await clickSel('[data-assignment-copy-cancel]');
  await clickSel('#assignmentsView [data-assignment-new]');
  await sleep(150);
  const door44 = await evalJs(`(function(){ var b = document.getElementById('assignmentCopyDoor');
    var r = b.getBoundingClientRect(); return { w: r.width, h: r.height }; })()`);
  await clickSel('[data-assignment-create-cancel]');
  check('WO-3.48: the create door measures >=44px both ways under a coarse pointer',
    door44.w >= 44 && door44.h >= 44, JSON.stringify(door44));

  /* ── THE FIXTURE COMES BACK OUT, and the page goes back to what this section received ── */
  await closeIfOpen348();
  await evalJs(`(async function(){ var s = window.planbook.store;
    s.update(function(doc){
      var ids = doc.assignments.filter(function(a){ return /^c_wo348_/.test(a.classId); })
        .map(function(a){ return a.id; });
      ids.forEach(function(id){ delete doc.scores[id]; });
      doc.assignments = doc.assignments.filter(function(a){ return !/^c_wo348_/.test(a.classId); });
      doc.classes = doc.classes.filter(function(c){ return !/^c_wo348_/.test(c.id); });
      doc.students = doc.students.filter(function(x){ return x.id !== 'wo348-s1'; });
    });
    await s.flush(); return 1; })()`);
  await send('Emulation.setDeviceMetricsOverride',
    { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await send('Page.reload');
  await sleep(600);
  await waitForBoot();
  await evalJs(KILL_ANIM);
  const gone348 = await evalJs(`(function(){ var d = window.planbook.store.getDoc();
    return d.classes.filter(function(c){ return /^c_wo348_/.test(c.id); }).length
      + d.assignments.filter(function(a){ return /^c_wo348_/.test(a.classId); }).length; })()`);
  check('WO-3.48: the fixture is gone again — no c_wo348_ class and no assignment in one',
    gone348 === 0, gone348 + ' left');
}
}
