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
 * in one dialog, in its own block at the foot — rewritten by WO-3.49 (2026-10-06) for the list that
 * replaced the pills and cards, where each copy's due date picks its term. It plants seven classes
 * of its own, reloads at its head and its foot, takes them back out, and hands the page back at
 * 1280x900 with touch off — the state print-sheets.mjs set and this section received.
 */

import { measureIn } from './touch-targets.mjs';
/* Node's today — moved by `--today` with the page's — for the create door's copy, which is dated today
   and so goes into whichever of the fixture's quarters holds it (WO-3.49). */
import { nodeToday } from './lib-dates.mjs';

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
  ══════════ ONE ASSIGNMENT INTO SEVERAL CLASSES, ONE LINE PER CLASS (WO-3.48, WO-3.49) ══════════

  Here rather than in verify/assignments.mjs, beside the class copy, because this block needs a
  fixture that file cannot build out of the classes the run happens to leave. WO-3.48 wrote it for
  the pills-and-cards dialog; WO-3.49 rewrote it for the list that replaced them, in which the due
  date picks each copy's term. Its seven classes are prefixed `c_wo349_` and all of them come back
  out at the foot. Every dated class has a Quarter 1 and a Quarter 2 — 2026-08-24 to 2026-10-31 and
  2026-11-01 to 2027-01-22 — and the source assignment is due in Quarter 2, because that is the case
  v167's firstTermId() got wrong and the case WO-3.49's first Acceptance line names:
    · P1, the source (Essays, Quizzes).
    · P2, a section of the same course: a category of the source's name under another id and
      another spelling (" essays "), dated Q1 and Q2 — the copy must land in Q2.
    · P4, the same terms, categories but none of that name.
    · P6, one dated year-long term and no categories.
    · P5, no terms at all. P3, terms with no dates. P7, a gap between its quarters (Nov 1 to 15).
  The four ways a line can be blocked are each one of those classes rather than one of them hoped for.

  WHAT IS DRIVEN, ALL THROUGH THE CONTROLS A TEACHER TOUCHES: a row's Duplicate, each class's tick,
  each line's category select and both its dates (typed, picked and Cleared), the source line's three
  fields, the confirm, Cancel, the close button, Escape, the editor's + New assignment, its name
  field, its Copy into other classes…, and its Cancel. The window.planbook seam plants the fixture,
  reads the document, and archives the other classes for the one-class case.

  THE CLOCK. The create door's copy is dated today (WO-3.17), so its term is the one holding today:
  Quarter 1 on a real-clock run in October, Quarter 2 under `--today=2026-11-10`. The expected term
  is worked out here from the fixture's own dates and nodeToday, never asked of the app.

  WHAT IS NOT HERE AND IS OWED TO A HUMAN: WO-3.49's last Acceptance line — three sections, one a day
  behind, a slip fixed on the source line, read on each class's own list on a real iPad after a
  force-quit, in both orientations, and whether two dates and two Clears fit a portrait line under a
  thumb. The coarse pass below measures every control in the open dialog at 820px and that the lines
  fold; it cannot hold a native date picker or a select wheel, and its date field is Edge's.
*/
console.log('\n--- one assignment into several classes, one line per class (WO-3.48, WO-3.49) ---');
{
  const { INSTALL_WALKER } = h;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const flush = () => evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  const SRC = 'c_wo349_src', P2 = 'c_wo349_p2', P3 = 'c_wo349_p3', P4 = 'c_wo349_p4',
    P5 = 'c_wo349_p5', P6 = 'c_wo349_p6', P7 = 'c_wo349_p7';
  const NAMES = { [SRC]: 'WO-3.49 English I P1', [P2]: 'WO-3.49 English I P2',
    [P3]: 'WO-3.49 English IV P3', [P4]: 'WO-3.49 English I P4', [P5]: 'WO-3.49 English III P5',
    [P6]: 'WO-3.49 English I P6', [P7]: 'WO-3.49 AP Lit P7' };
  const ESSAY = 'a349_essay', BLANK = 'a349_blank';
  const SRC_ESSAYS = 'k349_src_essays', P2_ESSAYS = 'k349_p2_essays', P2_QUIZ = 'k349_p2_quiz',
    P7_ESSAYS = 'k349_p7_essays';
  const Q1 = ['2026-08-24', '2026-10-31'], Q2 = ['2026-11-01', '2027-01-22'];

  await flush();
  await send('Emulation.setDeviceMetricsOverride',
    { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await send('Page.reload');
  await sleep(600);
  await waitForBoot();
  await evalJs(KILL_ANIM);
  await evalJs(INSTALL_WALKER);

  const plant349 = await evalJs(`(async function(){
    var s = window.planbook.store, c = window.planbook.classes;
    if (!s || !c || !s.getDoc()) return { ok:false, why:'no seam or no open year' };
    var Q1 = ${JSON.stringify(Q1)}, Q2 = ${JSON.stringify(Q2)};
    function q(id, label, d){ return { id:id, label:label, start:d[0], end:d[1] }; }
    s.update(function(doc){
      if (!Array.isArray(doc.assignments)) doc.assignments = [];
      if (!doc.scores) doc.scores = {};
      doc.students.push({ id:'wo349-s1', first:'Odette', last:'Ashby' });
      function cls(id, name, terms, cats, roster){
        doc.classes.push({ id:id, name:name, archived:false, letterScale:null, roster:roster || [],
          terms:terms, categories:cats });
      }
      cls('${SRC}', ${JSON.stringify(NAMES[SRC])},
        [q('tm349_src1', 'Q1', Q1), q('tm349_src2', 'Q2', Q2)],
        [{ id:'${SRC_ESSAYS}', name:'Essays', weight:60 }, { id:'k349_src_quiz', name:'Quizzes', weight:40 }],
        ['wo349-s1']);
      /* Essays SECOND and spelt differently: a match by position, or by exact string, would miss it. */
      cls('${P2}', ${JSON.stringify(NAMES[P2])},
        [q('tm349_p2a', 'Q1', Q1), q('tm349_p2b', 'Q2', Q2)],
        [{ id:'${P2_QUIZ}', name:'Quizzes', weight:30 }, { id:'${P2_ESSAYS}', name:' essays ', weight:70 }]);
      cls('${P3}', ${JSON.stringify(NAMES[P3])},
        [{ id:'tm349_p3', label:'Q1', start:'', end:'' }],
        [{ id:'k349_p3_essays', name:'Essays', weight:100 }]);
      cls('${P4}', ${JSON.stringify(NAMES[P4])},
        [q('tm349_p4a', 'Q1', Q1), q('tm349_p4b', 'Q2', Q2)],
        [{ id:'k349_p4_hw', name:'Homework', weight:100 }]);
      cls('${P5}', ${JSON.stringify(NAMES[P5])}, [],
        [{ id:'k349_p5_essays', name:'Essays', weight:100 }]);
      cls('${P6}', ${JSON.stringify(NAMES[P6])},
        [q('tm349_p6', 'Year', ['2026-08-24', '2027-06-15'])], []);
      cls('${P7}', ${JSON.stringify(NAMES[P7])},
        [q('tm349_p7a', 'Q1', Q1), q('tm349_p7b', 'Q2', ['2026-11-16', '2027-01-22'])],
        [{ id:'${P7_ESSAYS}', name:'Essays', weight:100 }]);
      doc.assignments.push({ id:'${ESSAY}', classId:'${SRC}', termId:'tm349_src2',
        categoryId:'${SRC_ESSAYS}', name:'WO-3.49 Personal narrative', points:50,
        assigned:'2026-11-05', due:'2026-11-12' });
      doc.assignments.push({ id:'${BLANK}', classId:'${SRC}', termId:'tm349_src2',
        categoryId:'k349_src_quiz', name:'WO-3.49 Quiz 1', points:10,
        assigned:'2026-11-03', due:'' });
      doc.scores['${ESSAY}'] = { 'wo349-s1': { v:44 } };
    });
    c.selectClass('${SRC}'); c.selectTerm('tm349_src2'); c.refreshClassBar();
    await s.flush();
    return { ok:true, classes: s.getDoc().classes.filter(function(x){ return /^c_wo349_/.test(x.id); }).length };
  })()`);
  check('WO-3.49: the fixture planted cleanly — a source due in Quarter 2 and six targets that differ in '
    + 'exactly the ways the list has to speak to',
    plant349.ok === true && plant349.classes === 7, JSON.stringify(plant349));

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
    /* Opening a class through its card goes to the term nearest today (WO-2.54), which on a real
       October clock is Q1 — and both fixture assignments are in Q2. So Q2 is chosen on the term
       strip, the way a teacher would, before any row's Duplicate is looked for. */
    await clickSel('#termNav [data-term-select="tm349_src2"]');
    await sleep(200);
  };
  await toSourceList();

  /* Everything a check below reads off the dialog, in one round trip: the source line, every other
     line (its tick, the term named under it, its category select's value AND the option actually
     displayed, both dates, its amber lines), every select in the dialog, the note and the confirm. */
  const READ349 = `(function(){
    var modal = document.getElementById('assignmentCopyModal');
    var list = document.getElementById('assignmentCopyList');
    function shown(sel){ if (!sel || sel.selectedIndex < 0) return null; return sel.options[sel.selectedIndex].value; }
    function flags(line){ return Array.prototype.map.call(line.querySelectorAll('[data-assignment-copy-flag]'),
      function(f){ return f.textContent.replace(/\\s+/g, ' '); }).join(' | '); }
    var kids = list ? Array.prototype.slice.call(list.children) : [];
    var srcLine = list ? list.querySelector('[data-assignment-copy-source-line]') : null;
    var source = srcLine ? {
      index: kids.indexOf(srcLine), id: srcLine.getAttribute('data-assignment-copy-line'),
      text: (srcLine.querySelector('.assign-copy-ref') || {}).textContent,
      sub: (srcLine.querySelector('.assign-copy-sub') || {}).textContent,
      ticks: srcLine.querySelectorAll('[data-assignment-copy-class], [aria-pressed]').length,
      cat: (srcLine.querySelector('[data-assignment-copy-source="categoryId"]') || {}).value,
      assigned: (srcLine.querySelector('[data-assignment-copy-source="assigned"]') || {}).value,
      due: (srcLine.querySelector('[data-assignment-copy-source="due"]') || {}).value } : null;
    var lines = Array.prototype.map.call(list ? list.querySelectorAll('[data-assignment-copy-line]:not([data-assignment-copy-source-line])') : [],
      function(l){
        var id = l.getAttribute('data-assignment-copy-line');
        var tick = l.querySelector('[data-assignment-copy-class]');
        var cat = l.querySelector('[data-assignment-copy-category]');
        var as = l.querySelector('[data-assignment-copy-assigned]');
        var due = l.querySelector('[data-assignment-copy-due]');
        var sub = l.querySelector('[data-assignment-copy-sub]');
        return { id: id, on: l.classList.contains('on'), pressed: tick ? tick.getAttribute('aria-pressed') : null,
          tickFor: tick ? tick.getAttribute('data-assignment-copy-class') : null,
          sub: sub ? sub.textContent : null,
          skip: (l.querySelector('.assign-copy-skip') || {}).textContent || '',
          cat: cat ? cat.value : null, catShown: shown(cat), catDisabled: cat ? cat.disabled : null,
          catLabel: cat && cat.selectedIndex >= 0 ? cat.options[cat.selectedIndex].textContent : null,
          assigned: as ? as.value : null, due: due ? due.value : null, flag: flags(l) };
      });
    var selects = Array.prototype.map.call(modal.querySelectorAll('select'), function(s){
      return s.hasAttribute('data-assignment-copy-category') ? 'line'
        : s.getAttribute('data-assignment-copy-source') === 'categoryId' ? 'source' : 'other'; });
    var btn = document.getElementById('assignmentCopyBtn');
    return { open: !!modal && !modal.classList.contains('hidden'),
      editorOpen: !document.getElementById('assignmentModal').classList.contains('hidden'),
      title: (document.getElementById('assignmentCopyTitle') || {}).textContent,
      lead: (document.getElementById('assignmentCopyLead') || {}).textContent.replace(/\\s+/g, ' '),
      note: (document.getElementById('assignmentCopyNote') || {}).textContent.replace(/\\s+/g, ' '),
      name: (document.querySelector('[data-assignment-copy-name]') || {}).value,
      headsFirst: !!kids[0] && kids[0].classList.contains('assign-copy-heads'),
      heads: kids[0] ? kids[0].textContent : '',
      source: source, lines: lines, selects: selects,
      termControls: modal.querySelectorAll('[data-assignment-copy-term]').length,
      button: btn ? btn.textContent : null, disabled: btn ? btn.disabled : null };
  })()`;
  const DOC349 = `(function(){ var d = window.planbook.store.getDoc();
    return { rev: d.rev,
      assignments: d.assignments.map(function(a){ return JSON.parse(JSON.stringify(a)); }),
      essay: JSON.stringify(d.assignments.filter(function(a){ return a.id === '${ESSAY}'; })[0]),
      scoreKeys: Object.keys(d.scores || {}), essayScores: JSON.stringify((d.scores || {})['${ESSAY}']),
      active: window.planbook.classes.getActiveClasses().map(function(c){ return c.id; }) }; })()`;
  /* A field set the way a keystroke or a picker sets it: `.value`, then the event src/shell.js reads. */
  const pick = async (sel, value, ev) => {
    const ok = await evalJs(`(function(){ var s = document.querySelector(${JSON.stringify(sel)}); if (!s) return 0;
      s.value = ${JSON.stringify(String(value))};
      s.dispatchEvent(new Event(${JSON.stringify(ev || 'change')}, { bubbles: true })); return 1; })()`);
    await sleep(150);
    return ok;
  };
  const tick = async (id) => { await clickSel('#assignmentCopyList [data-assignment-copy-class="' + id + '"]'); };
  const clearOn = async (sel) => {
    await clickSel(`#assignmentCopyList [data-date-field]:has(${sel}) [data-date-clear]`);
  };
  const liveSays = async (re) => {
    let said = '';
    for (let i = 0; i < 20; i++) {
      said = await evalJs("(document.getElementById('srLive') || {}).textContent || ''");
      if (re.test(said)) break;
      await sleep(50);
    }
    return said;
  };
  /* The classes in the order the list draws them, the way the announcement names them. */
  const listed = (ids) => { const names = ids.slice().sort((a, b) => offered.indexOf(a) - offered.indexOf(b))
    .map((id) => NAMES[id]); return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1]; };
  const lineOf = (st, id) => st.lines.filter((l) => l.id === id)[0] || null;
  const closeIfOpen349 = () => evalJs("['assignmentCopyModal','assignmentModal']"
    + ".forEach(function(m){ window.planbook.closeModal(m); }); 1");
  const SAVE = 'Save ' + NAMES[SRC] + ' and ';

  /* ── FROM DUPLICATE: THE SOURCE HEADS THE LIST, AND NOTHING IS TICKED ── */
  const docBefore349 = await evalJs(DOC349);
  await clickSel('#assignmentsView [data-assignment-duplicate="' + ESSAY + '"]');
  await sleep(150);
  const opened = await evalJs(READ349);
  const offered = docBefore349.active.filter((id) => id !== SRC);
  check('WO-3.49: from Duplicate, the source heads the list under the column heads — its own class, '
    + '"this assignment · Q2", and no tick — and every other active class follows in the class manager\'s '
    + 'order, none ticked; the source\'s own class is not offered as a copy',
    opened.open && opened.title === 'Duplicate this assignment' && opened.headsFirst
      && /Class · term/.test(opened.heads) && /Category/.test(opened.heads) && /Assigned/.test(opened.heads)
      && !!opened.source && opened.source.index === 1 && opened.source.id === SRC
      && opened.source.ticks === 0 && opened.source.sub === 'this assignment · Q2'
      && opened.source.cat === SRC_ESSAYS && opened.source.assigned === '2026-11-05'
      && opened.source.due === '2026-11-12'
      && JSON.stringify(opened.lines.map((l) => l.id)) === JSON.stringify(offered)
      && opened.lines.every((l) => l.tickFor === l.id && l.pressed === 'false' && !l.on
        && l.skip === 'Not copied' && l.sub === null)
      && opened.lines.every((l) => l.id !== SRC),
    JSON.stringify({ source: opened.source, lines: opened.lines.map((l) => l.id), offered,
      heads: opened.heads }));
  check('WO-3.49: no term control exists anywhere in the dialog — the one select open with nothing ticked '
    + 'is the source\'s category — and the confirm is disabled, reading "Copy into other classes"',
    opened.termControls === 0 && JSON.stringify(opened.selects) === '["source"]'
      && opened.disabled === true && opened.button === 'Copy into other classes'
      && /Tick the classes to copy it into/.test(opened.note),
    JSON.stringify({ selects: opened.selects, button: opened.button, disabled: opened.disabled }));

  /* ── THREE TICKS, AND WHAT EACH LINE PROPOSES ──
     Ticked in the order P6, P2, P4 on purpose: a single value the last tick overwrote would leave the
     other two lines showing P4's, and the per-line checks below go red. */
  await tick(P6); await tick(P2); await tick(P4);
  const three = await evalJs(READ349);
  const l2 = lineOf(three, P2), l4 = lineOf(three, P4), l6 = lineOf(three, P6);
  check('WO-3.49: three ticks turn three lines on, in place and in list order, each tick reading '
    + 'aria-pressed="true", and each ticked line names the term its due date picks under the class — '
    + 'P2 and P4 "Q2, from its due date" (due 2026-11-12), P6 "Year, from its due date"',
    three.lines.filter((l) => l.on).map((l) => l.id).join() === [P2, P4, P6].sort((a, b) =>
      offered.indexOf(a) - offered.indexOf(b)).join()
      && [l2, l4, l6].every((l) => !!l && l.on && l.pressed === 'true')
      && l2.sub === 'Q2, from its due date' && l4.sub === 'Q2, from its due date'
      && l6.sub === 'Year, from its due date'
      && three.termControls === 0
      && three.selects.filter((s) => s === 'line').length === 3 && three.selects.indexOf('other') === -1,
    JSON.stringify([l2, l4, l6].map((l) => l && { id: l.id, on: l.on, sub: l.sub })));
  check('WO-3.49: every line\'s category select shows the value that will be written — P2 its own id for the '
    + 'matched " essays ", P4 the "choose a category" placeholder, P6 a disabled "no categories" select — '
    + 'and P4 and P6 say why on their own amber line while P2 says nothing',
    l2.cat === P2_ESSAYS && l2.catShown === P2_ESSAYS && l2.flag === ''
      && l4.cat === '' && l4.catShown === '' && /choose a category/i.test(l4.catLabel || '')
      && l4.catDisabled === false && /Nothing here is called “Essays”/.test(l4.flag)
      && l6.cat === '' && l6.catDisabled === true && /has no categories/.test(l6.catLabel || '')
      && /WO-3\.49 English I P6 has no grading categories yet/.test(l6.flag),
    JSON.stringify([l2, l4, l6].map((l) => l && { id: l.id, cat: l.cat, shown: l.catShown, flag: l.flag })));
  check('WO-3.49: both dates on every ticked line start on the source\'s (assigned 2026-11-05, due '
    + '2026-11-12), the name is one field above the list, the note says each copy\'s dates start on this '
    + 'one\'s and nothing is re-dated to today, and the confirm reads "Copy into 3 classes"',
    three.lines.filter((l) => l.on).every((l) => l.assigned === '2026-11-05' && l.due === '2026-11-12')
      && three.name === 'WO-3.49 Personal narrative'
      && /Each copy’s dates start on this one’s/.test(three.note) && /Nothing is re-dated to today/.test(three.note)
      && !/come across as/.test(three.note)
      && three.button === 'Copy into 3 classes' && three.disabled === false,
    JSON.stringify({ dates: three.lines.filter((l) => l.on).map((l) => [l.assigned, l.due]),
      note: three.note, button: three.button }));

  /* ── EACH LINE'S DATES ARE ITS OWN (Acceptance 3) ── P4 is a section a day behind: its assigned date
     typed first and read before anything else moves, then its due date picked. P6's assigned typed. */
  await pick('[data-assignment-copy-assigned="' + P4 + '"]', '2026-11-06', 'input');
  const p4Assigned = await evalJs(READ349);
  await pick('[data-assignment-copy-due="' + P4 + '"]', '2026-11-13', 'change');
  await pick('[data-assignment-copy-assigned="' + P6 + '"]', '2026-11-04', 'input');
  const perLine = await evalJs(READ349);
  const a4 = lineOf(p4Assigned, P4), b2 = lineOf(perLine, P2), b4 = lineOf(perLine, P4), b6 = lineOf(perLine, P6);
  check('WO-3.49: changing P4\'s assigned date leaves P4\'s due date where it was; each line\'s dates are its '
    + 'own — P4 2026-11-06 / 2026-11-13, P6 2026-11-04 / 2026-11-12, P2 still on the source\'s — and the '
    + 'source line has not moved',
    !!a4 && a4.assigned === '2026-11-06' && a4.due === '2026-11-12'
      && b4.assigned === '2026-11-06' && b4.due === '2026-11-13'
      && b6.assigned === '2026-11-04' && b6.due === '2026-11-12'
      && b2.assigned === '2026-11-05' && b2.due === '2026-11-12'
      && perLine.source.assigned === '2026-11-05' && perLine.source.due === '2026-11-12'
      && perLine.button === 'Copy into 3 classes',
    JSON.stringify({ afterAssigned: a4 && [a4.assigned, a4.due],
      lines: [b2, b4, b6].map((l) => l && [l.id, l.assigned, l.due]), source: perLine.source }));

  /* ── THE SOURCE LINE: HELD, FOLLOWED, AND NAMED ON THE CONFIRM (Acceptance 4, 5, 6) ── */
  await pick('[data-assignment-copy-source="due"]', '2026-11-19', 'input');
  await flush();
  const dueMoved = await evalJs(READ349);
  const docDueMoved = await evalJs(DOC349);
  check('WO-3.49: changing the source\'s due date moves every line still on the old date (P2, P6) and not '
    + 'the line whose due date was changed by hand (P4), and moves no assigned date',
    lineOf(dueMoved, P2).due === '2026-11-19' && lineOf(dueMoved, P6).due === '2026-11-19'
      && lineOf(dueMoved, P4).due === '2026-11-13'
      && lineOf(dueMoved, P2).assigned === '2026-11-05' && lineOf(dueMoved, P4).assigned === '2026-11-06'
      && lineOf(dueMoved, P6).assigned === '2026-11-04'
      && lineOf(dueMoved, P2).sub === 'Q2, from its due date',
    JSON.stringify(dueMoved.lines.filter((l) => l.on).map((l) => [l.id, l.assigned, l.due])));
  check('WO-3.49: a source edit is held, not written — `rev` unmoved and the source byte-identical after a '
    + 'flush — and the confirm now reads "Save WO-3.49 English I P1 and copy into 3 classes"',
    docDueMoved.rev === docBefore349.rev && docDueMoved.essay === docBefore349.essay
      && dueMoved.button === SAVE + 'copy into 3 classes' && dueMoved.disabled === false,
    'rev ' + docBefore349.rev + ' -> ' + docDueMoved.rev + ', button ' + JSON.stringify(dueMoved.button));
  await pick('[data-assignment-copy-source="assigned"]', '2026-11-02', 'input');
  const asMoved = await evalJs(READ349);
  check('WO-3.49: changing the source\'s assigned date moves every line still on the old one (P2) and not '
    + 'the lines whose assigned date was changed by hand (P4, P6), and moves no due date',
    lineOf(asMoved, P2).assigned === '2026-11-02' && lineOf(asMoved, P4).assigned === '2026-11-06'
      && lineOf(asMoved, P6).assigned === '2026-11-04'
      && lineOf(asMoved, P2).due === '2026-11-19' && lineOf(asMoved, P4).due === '2026-11-13',
    JSON.stringify(asMoved.lines.filter((l) => l.on).map((l) => [l.id, l.assigned, l.due])));
  /* "Exactly when the source has changed": both dates put back, and the confirm goes back with them. */
  await pick('[data-assignment-copy-source="assigned"]', '2026-11-05', 'input');
  await pick('[data-assignment-copy-source="due"]', '2026-11-12', 'change');
  const putBack = await evalJs(READ349);
  await pick('[data-assignment-copy-source="due"]', '2026-11-19', 'input');
  const again = await evalJs(READ349);
  check('WO-3.49: the confirm says it saves the source exactly when the source has changed — with both '
    + 'dates put back it reads "Copy into 3 classes" again, and the following lines came back with them',
    putBack.button === 'Copy into 3 classes' && lineOf(putBack, P2).assigned === '2026-11-05'
      && lineOf(putBack, P2).due === '2026-11-12'
      && again.button === SAVE + 'copy into 3 classes' && lineOf(again, P2).due === '2026-11-19',
    JSON.stringify({ putBack: putBack.button, again: again.button }));

  /* ── BLOCKED LINES (Acceptance 2) ── */
  await tick(P5); await tick(P3); await tick(P7);
  await pick('[data-assignment-copy-due="' + P7 + '"]', '2026-11-10', 'input');
  const blocked = await evalJs(READ349);
  const k5 = lineOf(blocked, P5), k3 = lineOf(blocked, P3), k7 = lineOf(blocked, P7);
  check('WO-3.49: a line no date can place is blocked and says why on its own amber line — P5 has no terms, '
    + 'P3\'s terms have no dates, P7\'s due date (Nov 10) falls between its Q1 and Q2 — and the confirm is '
    + 'disabled while any of them is ticked',
    k5.sub === 'no terms yet' && /WO-3\.49 English III P5 has no terms/.test(k5.flag) && /untick it/.test(k5.flag)
      && k3.sub === 'no term dates yet' && /terms has its dates typed in/.test(k3.flag)
      && k7.sub === 'no term holds its due date'
      && /Its due date, Nov 10, falls between Q1 and Q2/.test(k7.flag) && /Change the date/.test(k7.flag)
      && blocked.disabled === true && blocked.button === SAVE + 'copy into 6 classes',
    JSON.stringify([k5, k3, k7].map((l) => l && { id: l.id, sub: l.sub, flag: l.flag.slice(0, 90) })
      .concat([{ button: blocked.button, disabled: blocked.disabled }])));
  await clickSel('#assignmentCopyBtn');
  await flush();
  const refused = await evalJs(DOC349);
  const stillOpen = await evalJs(READ349);
  check('WO-3.49: pressing the confirm while a blocked line is ticked writes nothing — no copy and no '
    + 'source edit, `rev` unmoved after a flush — and leaves the dialog open',
    refused.rev === docBefore349.rev && refused.assignments.length === docBefore349.assignments.length
      && refused.essay === docBefore349.essay && stillOpen.open,
    'rev ' + docBefore349.rev + ' -> ' + refused.rev);
  /* P7 with no due date falls back to its assigned date — in the gap too, then with no date at all,
     then placed by an assigned date inside its Q2. */
  await clearOn('[data-assignment-copy-due="' + P7 + '"]');
  const byAssigned = await evalJs(READ349);
  await clearOn('[data-assignment-copy-assigned="' + P7 + '"]');
  const noDate = await evalJs(READ349);
  await pick('[data-assignment-copy-assigned="' + P7 + '"]', '2026-11-17', 'input');
  const placed7 = await evalJs(READ349);
  check('WO-3.49: a blank due date is placed by the assigned date — P7 Cleared falls back to its assigned '
    + 'Nov 5, still in the gap and saying so; with no date at all it says nothing places it; with an '
    + 'assigned date of Nov 17 it reads "Q2, from its assigned date" and its amber line is gone',
    lineOf(byAssigned, P7).due === '' && lineOf(byAssigned, P7).sub === 'no term holds its assigned date'
      && /It has no due date, and its assigned date, Nov 5, falls between Q1 and Q2/.test(lineOf(byAssigned, P7).flag)
      && lineOf(noDate, P7).sub === 'no date to place it'
      && /no due date and no assigned date/.test(lineOf(noDate, P7).flag)
      && lineOf(placed7, P7).sub === 'Q2, from its assigned date' && lineOf(placed7, P7).flag === ''
      && lineOf(placed7, P7).due === '' && lineOf(placed7, P7).cat === P7_ESSAYS,
    JSON.stringify([byAssigned, noDate, placed7].map((s) => { const l = lineOf(s, P7);
      return { sub: l.sub, due: l.due, assigned: l.assigned, flag: l.flag.slice(0, 70) }; })));
  await tick(P5); await tick(P3);
  const unblocked = await evalJs(READ349);
  check('WO-3.49: unticking the two blocked classes turns their lines back into "Not copied" and enables the '
    + 'confirm — "Save WO-3.49 English I P1 and copy into 4 classes" — with every other line\'s edits kept',
    !lineOf(unblocked, P5).on && lineOf(unblocked, P5).skip === 'Not copied' && !lineOf(unblocked, P3).on
      && unblocked.disabled === false && unblocked.button === SAVE + 'copy into 4 classes'
      && lineOf(unblocked, P4).due === '2026-11-13' && lineOf(unblocked, P7).assigned === '2026-11-17',
    JSON.stringify({ button: unblocked.button, disabled: unblocked.disabled }));

  /* ── THE WRITE ── */
  await clickSel('#assignmentCopyBtn');
  const said349 = await liveSays(/^Saved /);
  await flush();
  const afterCopy = await evalJs(DOC349);
  const beforeIds = docBefore349.assignments.map((a) => a.id);
  const made = afterCopy.assignments.filter((a) => beforeIds.indexOf(a.id) === -1);
  const madeIn = (id) => made.filter((a) => a.classId === id)[0] || null;
  const m2 = madeIn(P2), m4 = madeIn(P4), m6 = madeIn(P6), m7 = madeIn(P7);
  const closed349 = await evalJs(READ349);
  check('WO-3.49: a copy\'s termId is the target\'s term holding its due date — the source is due in Q2 '
    + '(2026-11-19), and the copy into P2, which has a dated Q1 and Q2, lands in Q2 (tm349_p2b), as do P4\'s; '
    + 'P6\'s lands in its one year-long term, and P7\'s, with no due date, in the Q2 holding its assigned date',
    !!m2 && m2.termId === 'tm349_p2b' && !!m4 && m4.termId === 'tm349_p4b'
      && !!m6 && m6.termId === 'tm349_p6' && !!m7 && m7.termId === 'tm349_p7b',
    JSON.stringify(made.map((a) => ({ classId: a.classId, termId: a.termId, assigned: a.assigned, due: a.due }))));
  check('WO-3.49: confirming writes exactly four copies, one per ticked line, each a new id with no scores '
    + 'entry, and each line\'s assigned and due written to that copy only — P2 2026-11-05 / 2026-11-19, P4 '
    + '2026-11-06 / 2026-11-13, P6 2026-11-04 / 2026-11-19, P7 2026-11-17 / blank — none for an unticked class',
    made.length === 4 && new Set(made.map((a) => a.id)).size === 4 && made.every((a) => a.id !== ESSAY)
      && m2.assigned === '2026-11-05' && m2.due === '2026-11-19'
      && m4.assigned === '2026-11-06' && m4.due === '2026-11-13'
      && m6.assigned === '2026-11-04' && m6.due === '2026-11-19'
      && m7.assigned === '2026-11-17' && m7.due === ''
      && made.every((a) => afterCopy.scoreKeys.indexOf(a.id) === -1)
      && made.every((a) => [P3, P5].indexOf(a.classId) === -1)
      && afterCopy.essayScores === docBefore349.essayScores && !closed349.open,
    JSON.stringify(made.map((a) => ({ classId: a.classId, assigned: a.assigned, due: a.due }))));
  check('WO-3.49: the copy into P2 is filed under P2\'s OWN id for "Essays", P7\'s under P7\'s, P4\'s and P6\'s '
    + 'under no category, no copy carries the source\'s categoryId, and each holds exactly the eight fields '
    + 'an assignment has, with the source\'s points and the one name',
    m2.categoryId === P2_ESSAYS && m7.categoryId === P7_ESSAYS && m4.categoryId === '' && m6.categoryId === ''
      && made.every((a) => a.categoryId !== SRC_ESSAYS)
      && made.every((a) => a.points === 50 && a.name === 'WO-3.49 Personal narrative'
        && Object.keys(a).sort().join() === 'assigned,categoryId,classId,due,id,name,points,termId'),
    JSON.stringify(made.map((a) => ({ classId: a.classId, categoryId: a.categoryId, keys: Object.keys(a).length }))));
  const essayAfter = JSON.parse(afterCopy.essay);
  const essayBefore = JSON.parse(docBefore349.essay);
  check('WO-3.49: the source\'s held edit is written on confirm in the SAME update() as the copies — `rev` '
    + 'moved by exactly one — its due date now 2026-11-19, everything else as it was, its termId kept (ruling 5)',
    afterCopy.rev === docBefore349.rev + 1 && essayAfter.due === '2026-11-19'
      && JSON.stringify(Object.assign({}, essayAfter, { due: essayBefore.due })) === docBefore349.essay
      && essayAfter.termId === 'tm349_src2',
    'rev ' + docBefore349.rev + ' -> ' + afterCopy.rev + ', source ' + afterCopy.essay);
  check('WO-3.49: it announces once, naming the source because it was saved: "Saved WO-3.49 Personal '
    + 'narrative in WO-3.49 English I P1, and copied … into P2, P4, P6 and P7 with no scores on them."',
    said349 === 'Saved WO-3.49 Personal narrative in ' + NAMES[SRC] + ', and copied WO-3.49 Personal narrative into '
      + listed([P2, P4, P6, P7]) + ' with no scores on them.',
    JSON.stringify(said349));

  /* ── A BLANK SOURCE DUE: EVERY LINE BLANK, PLACED BY THE ASSIGNED DATE ── */
  await clickSel('#assignmentsView [data-assignment-duplicate="' + BLANK + '"]');
  await sleep(150);
  await tick(P2);
  const blank = await evalJs(READ349);
  const docPreBlank = await evalJs(DOC349);
  await clickSel('#assignmentCopyBtn');
  const saidBlank = await liveSays(/^Copied /);
  await flush();
  const afterBlank = await evalJs(DOC349);
  const madeBlank = afterBlank.assignments.filter((a) => docPreBlank.assignments.every((b) => b.id !== a.id));
  check('WO-3.49: duplicating an assignment with no due date starts the line blank and places it by the '
    + 'assigned date — "Q2, from its assigned date" — and the copy is written into P2\'s Q2 with no due date; '
    + 'an untouched source writes nothing of its own and the announcement does not say it was saved',
    lineOf(blank, P2).due === '' && lineOf(blank, P2).assigned === '2026-11-03'
      && lineOf(blank, P2).sub === 'Q2, from its assigned date'
      && blank.button === 'Copy into ' + NAMES[P2]
      && madeBlank.length === 1 && madeBlank[0].classId === P2 && madeBlank[0].termId === 'tm349_p2b'
      && madeBlank[0].due === '' && madeBlank[0].assigned === '2026-11-03'
      && afterBlank.rev === docPreBlank.rev + 1
      && JSON.stringify(afterBlank.assignments.filter((a) => a.id === BLANK))
        === JSON.stringify(docPreBlank.assignments.filter((a) => a.id === BLANK))
      && /^Copied WO-3\.49 Quiz 1 into /.test(saidBlank),
    JSON.stringify({ line: lineOf(blank, P2), made: madeBlank, said: saidBlank }));

  /* ── CANCEL, CLOSE AND ESCAPE DROP THE SOURCE'S HELD EDITS (Acceptance 4, 5) ── each after an edit to
     all three of the source's fields and a ticked line, each read after a flush, because update() only
     schedules a save (WO-5.3's harness). Each reopening must show the source as the document has it. */
  const docPreDismiss = await evalJs(DOC349);
  const dismissals = [];
  let follows = null;
  for (const how of ['Cancel', 'Close', 'Escape']) {
    await closeIfOpen349();
    await clickSel('#assignmentsView [data-assignment-duplicate="' + ESSAY + '"]');
    await sleep(150);
    const fresh = await evalJs(READ349);
    await pick('[data-assignment-copy-source="due"]', '2026-12-01', 'input');
    await pick('[data-assignment-copy-source="assigned"]', '2026-11-30', 'input');
    const untickedSave = await evalJs(READ349);
    await tick(P2);
    await pick('[data-assignment-copy-source="categoryId"]', 'k349_src_quiz', 'change');
    const withCat = await evalJs(READ349);
    if (how === 'Cancel') follows = { cat: lineOf(withCat, P2).cat, due: lineOf(withCat, P2).due };
    if (how === 'Cancel') await clickSel('[data-assignment-copy-cancel]');
    else if (how === 'Close') await clickSel('#assignmentCopyModal [data-modal-close]');
    else {
      await evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); 1");
      await sleep(150);
    }
    await flush();
    const after = await evalJs(DOC349);
    const st = await evalJs(READ349);
    dismissals.push({ how, freshSource: fresh.source && [fresh.source.cat, fresh.source.assigned, fresh.source.due],
      freshTicked: fresh.lines.filter((l) => l.on).length,
      untickedButton: untickedSave.button, untickedDisabled: untickedSave.disabled,
      catButton: withCat.button, rev: after.rev, count: after.assignments.length,
      essaySame: after.essay === docPreDismiss.essay, open: st.open });
  }
  const docSource = JSON.parse(docPreDismiss.essay);
  check('WO-3.49: with nothing ticked the confirm stays disabled even though the source has changed, and '
    + 'reads "Save WO-3.49 English I P1 and copy into other classes"; ticking one makes it "… copy into '
    + 'WO-3.49 English I P2"',
    dismissals.length === 3 && dismissals.every((d) => d.untickedDisabled === true
      && d.untickedButton === SAVE + 'copy into other classes'
      && d.catButton === SAVE + 'copy into ' + NAMES[P2]),
    JSON.stringify(dismissals.map((d) => [d.untickedButton, d.untickedDisabled, d.catButton])));
  check('WO-3.49: Cancel, the close button and Escape each leave the source byte-identical after three held '
    + 'edits — `rev` and the assignment count unmoved after a flush — and each reopening shows the source '
    + 'as the document has it, with nothing ticked',
    dismissals.every((d) => d.rev === docPreDismiss.rev && d.count === docPreDismiss.assignments.length
      && d.essaySame && d.open === false && d.freshTicked === 0
      && JSON.stringify(d.freshSource) === JSON.stringify([docSource.categoryId, docSource.assigned, docSource.due])),
    JSON.stringify(dismissals.map((d) => ({ how: d.how, rev: d.rev, same: d.essaySame, src: d.freshSource })))
      + ' against rev ' + docPreDismiss.rev);
  check('WO-3.49: an untouched line follows the source\'s category by NAME — P2, ticked before the source moved '
    + 'to Quizzes, moves to P2\'s own Quizzes id — and was proposed on the source\'s held due date',
    !!follows && follows.cat === P2_QUIZ && follows.due === '2026-12-01', JSON.stringify(follows));

  /* ── THE SOURCE'S CATEGORY AND ASSIGNED DATE REACH THE DOCUMENT ON CONFIRM TOO ── the write above
     carried a due date only. Here the other two fields are changed on the source line and confirmed. */
  await closeIfOpen349();
  await clickSel('#assignmentsView [data-assignment-duplicate="' + BLANK + '"]');
  await sleep(150);
  await tick(P2);
  await pick('[data-assignment-copy-source="categoryId"]', SRC_ESSAYS, 'change');
  await pick('[data-assignment-copy-source="assigned"]', '2026-11-04', 'input');
  const docPreSave = await evalJs(DOC349);
  const preSaveLine = await evalJs(READ349);
  await clickSel('#assignmentCopyBtn');
  await flush();
  const afterSave = await evalJs(DOC349);
  const blankBefore = docPreSave.assignments.filter((a) => a.id === BLANK)[0];
  const blankAfter = afterSave.assignments.filter((a) => a.id === BLANK)[0];
  const savedCopy = afterSave.assignments.filter((a) => docPreSave.assignments.every((b) => b.id !== a.id));
  check('WO-3.49: a change to the source\'s category and assigned date is held until the confirm and written '
    + 'by it, in the same update() as the copy — `rev` +1 — with its due date and termId untouched; the '
    + 'untouched P2 line followed both',
    preSaveLine.button === SAVE + 'copy into ' + NAMES[P2] && docPreSave.rev === afterSave.rev - 1
      && JSON.stringify(blankBefore) === JSON.stringify(docPreBlank.assignments.filter((a) => a.id === BLANK)[0])
      && blankAfter.categoryId === SRC_ESSAYS && blankAfter.assigned === '2026-11-04'
      && blankAfter.due === '' && blankAfter.termId === 'tm349_src2'
      && savedCopy.length === 1 && savedCopy[0].classId === P2 && savedCopy[0].categoryId === P2_ESSAYS
      && savedCopy[0].assigned === '2026-11-04' && savedCopy[0].termId === 'tm349_p2b',
    JSON.stringify({ button: preSaveLine.button, rev: [docPreSave.rev, afterSave.rev], source: blankAfter,
      copy: savedCopy }));

  /* ── THE CREATE DOOR ── */
  await closeIfOpen349();
  await clickSel('#assignmentsView [data-assignment-new]');
  await sleep(150);
  const doorShown = await evalJs(`(function(){ var b = document.getElementById('assignmentCopyDoor');
    return { exists: !!b, hidden: b ? b.classList.contains('hidden') : null,
      w: b ? b.getBoundingClientRect().width : 0, text: b ? b.textContent : '',
      editorOpen: !document.getElementById('assignmentModal').classList.contains('hidden'),
      cancelShown: !document.getElementById('assignmentCreateCancel').classList.contains('hidden') }; })()`);
  await evalJs(`(function(){ var f = document.querySelector('#assignmentFields [data-assignment-field="name"]');
    f.value = 'WO-3.49 Essay 3'; f.dispatchEvent(new Event('input', { bubbles: true })); return 1; })()`);
  await sleep(150);
  const created = await evalJs(`(function(){ var d = window.planbook.store.getDoc();
    var a = d.assignments.filter(function(x){ return x.classId === '${SRC}' && x.name === 'WO-3.49 Essay 3'; });
    return a.length === 1 ? JSON.parse(JSON.stringify(a[0])) : null; })()`);
  await clickSel('#assignmentCopyDoor');
  await sleep(150);
  const fromCreate = await evalJs(READ349);
  check('WO-3.48: during a create, with other active classes, the editor shows "Copy into other classes…" '
    + 'beside Done, alongside Cancel',
    doorShown.exists && doorShown.hidden === false && doorShown.w > 0 && doorShown.editorOpen
      && doorShown.cancelShown && doorShown.text === 'Copy into other classes…',
    JSON.stringify(doorShown));
  check('WO-3.49: the create door closes the editor and opens the list on the NEW assignment — its name, the '
    + 'lead saying each copy stays as it is if this one changes — with the source heading the list and no '
    + 'tick on it, nothing ticked, and the source\'s own class not offered',
    !!created && fromCreate.open && !fromCreate.editorOpen && fromCreate.title === 'Copy into other classes'
      && fromCreate.name === 'WO-3.49 Essay 3' && /“WO-3\.49 Essay 3”/.test(fromCreate.lead)
      && /stays as it is if you change this one later/.test(fromCreate.lead)
      && !!fromCreate.source && fromCreate.source.index === 1 && fromCreate.source.id === SRC
      && fromCreate.source.ticks === 0
      && fromCreate.lines.every((l) => l.id !== SRC && !l.on && l.pressed === 'false')
      && fromCreate.lines.length === offered.length && fromCreate.disabled === true,
    JSON.stringify({ created: !!created, title: fromCreate.title, name: fromCreate.name,
      source: fromCreate.source, lead: fromCreate.lead.slice(0, 120) }));
  /* The new assignment is dated today (WO-3.17), so its copy's term is the one holding TODAY in P2:
     Q1 on a real-clock run in October, Q2 under --today=2026-11-10. Worked out from the fixture's dates
     here, not asked of the app. Outside both quarters the line must say no term holds it. */
  const wantTerm = nodeToday >= Q1[0] && nodeToday <= Q1[1] ? { id: 'tm349_p2a', label: 'Q1' }
    : nodeToday >= Q2[0] && nodeToday <= Q2[1] ? { id: 'tm349_p2b', label: 'Q2' } : null;
  await tick(P2);
  const createLine = await evalJs(READ349);
  await clickSel('#assignmentCopyBtn');
  await flush();
  const createCopy = await evalJs(`(function(){ var d = window.planbook.store.getDoc();
    return { src: d.assignments.filter(function(a){ return a.id === ${JSON.stringify(created && created.id)}; }).length,
      p2: d.assignments.filter(function(a){ return a.classId === '${P2}' && a.name === 'WO-3.49 Essay 3'; })
        .map(function(a){ return JSON.parse(JSON.stringify(a)); }) }; })()`);
  check('WO-3.49: from the create door, a copy dated today goes into the term of P2 that holds today ('
    + (wantTerm ? wantTerm.label : 'none') + ' on ' + nodeToday + ') — its line said so before the tap — and '
    + 'the new assignment itself is kept: the door is not the editor\'s Cancel',
    !!created && created.due === nodeToday && created.assigned === nodeToday
      && (wantTerm
        ? lineOf(createLine, P2).sub === wantTerm.label + ', from its due date'
          && createCopy.src === 1 && createCopy.p2.length === 1 && createCopy.p2[0].id !== created.id
          && createCopy.p2[0].termId === wantTerm.id && createCopy.p2[0].due === nodeToday
          && createCopy.p2[0].categoryId === P2_ESSAYS
        : lineOf(createLine, P2).sub === 'no term holds its due date' && createCopy.p2.length === 0),
    JSON.stringify({ today: nodeToday, created: created && [created.assigned, created.due],
      sub: lineOf(createLine, P2).sub, copies: createCopy.p2.map((a) => [a.termId, a.due]) }));
  await closeIfOpen349();
  await clickSel('#assignmentsView [data-assignment-edit="' + ESSAY + '"]');
  await sleep(150);
  const onEdit = await evalJs(`(function(){ var b = document.getElementById('assignmentCopyDoor');
    return { editorOpen: !document.getElementById('assignmentModal').classList.contains('hidden'),
      hidden: b ? b.classList.contains('hidden') : null, w: b ? b.getBoundingClientRect().width : -1 }; })()`);
  check('WO-3.48: opening an existing row through Edit does not show "Copy into other classes…"',
    onEdit.editorOpen && onEdit.hidden === true && onEdit.w === 0, JSON.stringify(onEdit));
  await closeIfOpen349();

  /* ── ONE ACTIVE CLASS: NO DOOR, AND DUPLICATE HAS NOTHING TO OFFER ── every other active class is put
     away through the seam, and put back exactly as it was. */
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
  await clickSel('#assignmentsView [data-assignment-duplicate="' + ESSAY + '"]');
  await sleep(150);
  const loneDup = await evalJs(READ349);
  await clickSel('[data-assignment-copy-cancel]');
  await evalJs(`(function(){ var s = window.planbook.store; var ids = ${JSON.stringify(parked)};
    s.update(function(doc){ doc.classes.forEach(function(c){ if (ids.indexOf(c.id) >= 0) c.archived = false; }); });
    window.planbook.classes.refreshClassBar(); return 1; })()`);
  check('WO-3.48: with one active class, a create shows Cancel and no "Copy into other classes…"',
    parked.length >= 6 && lone.active === 1 && lone.editorOpen && lone.cancelShown && lone.hidden === true,
    JSON.stringify({ parked: parked.length, lone }));
  check('WO-3.49: with one active class, Duplicate shows the source line alone, says there is no other class '
    + 'and that a second copy in this class is made with New, and its confirm is disabled',
    loneDup.open && !!loneDup.source && loneDup.lines.length === 0 && loneDup.disabled === true
      && /no other class to copy this into/.test(loneDup.note) && /made with New/.test(loneDup.note),
    JSON.stringify({ lines: loneDup.lines.length, note: loneDup.note, disabled: loneDup.disabled }));

  /* ── THE WIDE LIST (Acceptance 8) ── at 1280px under a fine pointer, and either side of the measured
     919/920 breakpoint src/assignments.css records. Read with the source and three classes on. */
  const LAYOUT349 = `(function(){
    var panel = document.querySelector('#assignmentCopyModal .modal-panel');
    var body = document.querySelector('#assignmentCopyModal .modal-body');
    var list = document.getElementById('assignmentCopyList');
    var heads = list.querySelector('.assign-copy-heads');
    function box(e){ var r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom }; }
    var lines = Array.prototype.map.call(list.querySelectorAll('.assign-copy-line.on, .assign-copy-line.source'), function(l){
      var first = box(l.querySelector('.assign-copy-tick, .assign-copy-ref'));
      var cells = Array.prototype.map.call(l.querySelectorAll('.assign-copy-cell'), function(c){
        var cb = box(c), clear = c.querySelector('[data-date-clear]'), input = c.querySelector('input[type="date"]');
        return { t: cb.t, fits: !clear || (box(clear).r <= cb.r + 0.5 && box(input).r <= box(clear).l + 0.5),
          cue: getComputedStyle(c.querySelector('.assign-copy-cue')).display !== 'none' };
      });
      return { id: l.getAttribute('data-assignment-copy-line'), first: first, cells: cells };
    });
    var off = Array.prototype.map.call(list.querySelectorAll('.assign-copy-line.off'), function(l){
      return l.getBoundingClientRect().height; });
    return { width: innerWidth, coarse: matchMedia('(pointer: coarse)').matches,
      heads: getComputedStyle(heads).display !== 'none', lines: lines, offHeights: off,
      oneRow: lines.every(function(l){ return l.cells.length === 3 && l.cells.every(function(c){
        return Math.abs(c.t - l.first.t) < 12 && !c.cue; }); }),
      folded: lines.every(function(l){ return l.cells.length === 3 && l.cells.every(function(c){
        return c.t >= l.first.b - 0.5 && Math.abs(c.t - l.cells[0].t) < 4 && c.cue; }); }),
      fits: lines.every(function(l){ return l.cells.every(function(c){ return c.fits; }); }),
      scroll: [panel.scrollWidth - panel.clientWidth, body.scrollWidth - body.clientWidth,
        list.scrollWidth - list.clientWidth,
        document.documentElement.scrollWidth - document.documentElement.clientWidth] };
  })()`;
  await clickSel('#assignmentsView [data-assignment-duplicate="' + ESSAY + '"]');
  await sleep(150);
  await tick(P2); await tick(P4); await tick(P6);
  const wide = await evalJs(LAYOUT349);
  await send('Emulation.setDeviceMetricsOverride', { width: 920, height: 900, deviceScaleFactor: 1, mobile: false });
  await sleep(200);
  const at920 = await evalJs(LAYOUT349);
  await send('Emulation.setDeviceMetricsOverride', { width: 919, height: 900, deviceScaleFactor: 1, mobile: false });
  await sleep(200);
  const at919 = await evalJs(LAYOUT349);
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await sleep(200);
  check('WO-3.49: at 1280px under a fine pointer, the source and every ticked class are each one line — the '
    + 'name and its three fields side by side under the column heads — every date and its Clear inside its '
    + 'cell, and nothing scrolls sideways',
    wide.width === 1280 && wide.coarse === false && wide.heads && wide.lines.length === 4 && wide.oneRow
      && wide.fits && wide.scroll.every((n) => n <= 0),
    JSON.stringify({ width: wide.width, heads: wide.heads, oneRow: wide.oneRow, fits: wide.fits, scroll: wide.scroll,
      first: wide.lines[1] }));
  check('WO-3.49: the measured breakpoint holds on both sides — at 920px the list is still one line a class '
    + 'with every Clear inside its cell, and at 919px it has folded',
    at920.width === 920 && at920.heads && at920.oneRow && at920.fits && at920.scroll.every((n) => n <= 0)
      && at919.width === 919 && !at919.heads && at919.folded && at919.scroll.every((n) => n <= 0),
    JSON.stringify({ at920: { heads: at920.heads, oneRow: at920.oneRow, fits: at920.fits, scroll: at920.scroll },
      at919: { heads: at919.heads, folded: at919.folded, scroll: at919.scroll } }));
  await clickSel('[data-assignment-copy-cancel]');

  /* ── THE COARSE PASS, AT A PORTRAIT iPAD'S 820px ── */
  await flush();
  await send('Emulation.setDeviceMetricsOverride',
    { width: 820, height: 1180, deviceScaleFactor: 2, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Page.reload');
  await sleep(700);
  await waitForBoot();
  await evalJs(KILL_ANIM);
  await evalJs(INSTALL_WALKER);
  const coarse349 = await evalJs("matchMedia('(pointer: coarse)').matches && innerWidth === 820");
  await evalJs("window.planbook.classes.selectClass('" + SRC + "'); window.planbook.classes.selectTerm('tm349_src2'); 1");
  await toSourceList();
  await clickSel('#assignmentsView [data-assignment-duplicate="' + ESSAY + '"]');
  await sleep(150);
  await tick(P2); await tick(P4); await tick(P6);
  const touch349 = await evalJs(measureIn('#assignmentCopyModal'));
  const under349 = touch349.filter((m) => m.h < 44 || m.w < 44);
  const narrow = await evalJs(LAYOUT349);
  check('WO-3.49: under a coarse pointer at 820px, every control in the open dialog measures >=44px both ways '
    + '— every tick, the name, every category select, every date field and every Clear, the confirm and Cancel',
    coarse349 === true && touch349.length >= offered.length + 1 + 4 * 5 + 2 && under349.length === 0,
    'coarse = ' + coarse349 + ', measured ' + touch349.length + '; under = '
      + JSON.stringify(under349.slice(0, 6)));
  check('WO-3.49: at 820px each class folds to two rows — the name, then category, assigned and due side by '
    + 'side with a cue each — the column heads are gone, an unticked class is one row, and nothing scrolls '
    + 'sideways; in this browser two dates and two Clears fit a portrait line',
    narrow.coarse && !narrow.heads && narrow.lines.length === 4 && narrow.folded && narrow.fits
      && narrow.offHeights.length > 0 && narrow.offHeights.every((h) => h < 70)
      && narrow.scroll.every((n) => n <= 0),
    JSON.stringify({ heads: narrow.heads, folded: narrow.folded, fits: narrow.fits, off: narrow.offHeights,
      scroll: narrow.scroll }));
  await clickSel('[data-assignment-copy-cancel]');
  await clickSel('#assignmentsView [data-assignment-new]');
  await sleep(150);
  const door44 = await evalJs(`(function(){ var b = document.getElementById('assignmentCopyDoor');
    var r = b.getBoundingClientRect(); return { w: r.width, h: r.height }; })()`);
  await clickSel('[data-assignment-create-cancel]');
  check('WO-3.48: the create door measures >=44px both ways under a coarse pointer',
    door44.w >= 44 && door44.h >= 44, JSON.stringify(door44));

  /* ── THE FIXTURE COMES BACK OUT, and the page goes back to what this section received ── */
  await closeIfOpen349();
  await evalJs(`(async function(){ var s = window.planbook.store;
    s.update(function(doc){
      var ids = doc.assignments.filter(function(a){ return /^c_wo349_/.test(a.classId); })
        .map(function(a){ return a.id; });
      ids.forEach(function(id){ delete doc.scores[id]; });
      doc.assignments = doc.assignments.filter(function(a){ return !/^c_wo349_/.test(a.classId); });
      doc.classes = doc.classes.filter(function(c){ return !/^c_wo349_/.test(c.id); });
      doc.students = doc.students.filter(function(x){ return x.id !== 'wo349-s1'; });
    });
    await s.flush(); return 1; })()`);
  await send('Emulation.setDeviceMetricsOverride',
    { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await send('Page.reload');
  await sleep(600);
  await waitForBoot();
  await evalJs(KILL_ANIM);
  const gone349 = await evalJs(`(function(){ var d = window.planbook.store.getDoc();
    return d.classes.filter(function(c){ return /^c_wo349_/.test(c.id); }).length
      + d.assignments.filter(function(a){ return /^c_wo349_/.test(a.classId); }).length; })()`);
  check('WO-3.49: the fixture is gone again — no c_wo349_ class and no assignment in one',
    gone349 === 0, gone349 + ' left');
}
}
