/* year-document-store.mjs — the year document store
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

/* The harness's one clock, as an epoch number: the freshness assertion below compares a stamp the
   PAGE wrote against a millisecond read in Node, and the two have to be the same clock under
   `--today`. See nodeNowMs() at its definition. */
import { nodeNowMs } from './lib-dates.mjs';

export async function run(h) {
const { SCHEMA_NOW, consoleLog, check, skip, send, evalJs, has, clickSel, KILL_ANIM, INSTALL_WALKER,
  waitForBoot, seam } = h;

/* ───────────────── the year document store ─────────────────
 *
 * WO-1.4's acceptance lines are the ones a human looking at the app cannot settle: that `rev`
 * counts saves rather than edits, that a failed write reaches the chip instead of being
 * swallowed, that two years coexist, and that a document from an older schema comes up the
 * migration ladder without losing anything. All of it is driven through the exported store,
 * which until WO-1.6 and WO-1.7 give the app a screen that writes is only reachable through
 * the window.planbook seam.
 *
 * These checks WRITE to IndexedDB, and that is safe only because the browser above runs
 * against a throwaway --user-data-dir that is deleted at the bottom of this file. Nothing
 * here may ever be pointed at a real profile.
 */

console.log('\n--- year document store ---');
const DOC_KEYS = ['schemaVersion', 'docId', 'year', 'rev', 'deviceId', 'updatedAt', 'teacher',
  'classes', 'letterScale', 'students', 'assignments', 'scores', 'attendance', 'log',
  /* WO-2.8's two, and they are both here rather than one: an open pass and a finished one are
     separate collections on purpose (docs/data-model.md), and a build that shipped only `passes`
     would be the in-memory `activePasses` mistake with a log bolted on. */
  'openPasses', 'passes',
  'events', 'templates', 'signals'];
const storeSeam = await evalJs("!!(window.planbook && window.planbook.store"
  + " && typeof window.planbook.store.update === 'function')");

if (!storeSeam) {
  skip('the year document store: shape, rev, save failure, two years, migration',
    'no window.planbook.store seam on the page — it is kept deliberately for this file to read through, so its absence is a defect and not a stage of the build; see the window.planbook block at the foot of src/shell.js');
} else {
  const doc0 = await evalJs(`(function(){ var d=window.planbook.store.getDoc(); if(!d) return null;
    return { year:d.year, schemaVersion:d.schemaVersion, rev:d.rev, docId:d.docId,
             hasDeviceId:!!d.deviceId, keys:Object.keys(d),
             scoresIsMap:(!!d.scores && typeof d.scores==='object' && !Array.isArray(d.scores)),
             label:(document.getElementById('yearButtonLabel')||{}).textContent }; })()`);

  check('boot() put a year document in memory and the loading screen came down behind it',
    !!doc0 && doc0.schemaVersion === SCHEMA_NOW && !!doc0.docId && doc0.hasDeviceId
      && /^\d{4}-\d{4}$/.test(doc0.year || ''),
    doc0 ? 'year=' + doc0.year + ' rev=' + doc0.rev + ' schemaVersion=' + doc0.schemaVersion : 'no document');
  check('the fresh document carries every collection docs/data-model.md names, and scores is a map',
    !!doc0 && DOC_KEYS.every(k => doc0.keys.includes(k)) && doc0.scoresIsMap,
    doc0 ? 'missing: ' + JSON.stringify(DOC_KEYS.filter(k => !doc0.keys.includes(k))) : 'no document');
  check('the header names the open year', !!doc0 && doc0.label === doc0.year,
    doc0 ? 'button says "' + doc0.label + '", document says "' + doc0.year + '"' : 'no document');

  /*
    WO-1.11's second acceptance line, and it is HERE — three hundred lines before the backup
    section — because this is the only moment in the run when the device holds exactly one school
    year. The year-switch checks below create 2030-2031, the migration fixture adds a third, and
    nothing deletes a year afterwards. "No teacher who never rolls over ever sees it" is a claim
    about that state and cannot be made from any later one.

    The positive half — the control appearing, labelled with the count — is in the backup section.
    Neither half means anything alone: a control that is never shown passes this check, and one
    that is always shown passes that one.

    Asserted as a state that HOLDS rather than as one sample, per trap 5. openBackupPanel()
    deliberately does not await the read of IndexedDB that reveals this control (a recovery screen
    does not wait on the store), so "hidden right now" cannot tell a correct absence from a refresh
    that has not landed yet. Forty samples over a second can.
  */
  const oneYear = await evalJs(`(async function(){
    var b = window.planbook && window.planbook.backup;
    if (!b || typeof b.downloadAllBackups !== 'function') return { seam:false };
    var years = await window.planbook.store.listYears();
    b.openBackupPanel(document.querySelector('header [data-backup-panel]'));
    var el = document.getElementById('backupDownloadAllBtn');
    var note = document.getElementById('backupAllNote');
    var visible = 0, samples = 0;
    for (var i = 0; i < 40; i++) {
      samples++;
      if (el && !el.classList.contains('hidden')) visible++;
      if (note && !note.classList.contains('hidden')) visible++;
      await new Promise(function(r){ setTimeout(r, 25); });
    }
    window.planbook.closeModal('backupModal');
    return { seam:true, years:years.length, inMarkup:!!el && !!note, visible:visible,
             samples:samples, hooked: !!document.querySelector('[data-backup-download-all]') }; })()`);
  if (!oneYear.seam) {
    skip('with one year on the device, nothing offers to back up every year',
      'no window.planbook.backup.downloadAllBackups seam on the page — see the window.planbook block at the foot of src/shell.js');
  } else if (oneYear.years !== 1) {
    skip('with one year on the device, nothing offers to back up every year',
      'the device already holds ' + oneYear.years + ' years at this point in the run, so the '
        + 'one-year state cannot be observed here');
  } else {
    check('with one year on the device, nothing offers to back up every year',
      oneYear.inMarkup && oneYear.hooked && oneYear.visible === 0,
      'one year on the device; the control and its note are in the markup = ' + oneYear.inMarkup
        + ', hook present = ' + oneYear.hooked + ', and both stayed hidden across '
        + oneYear.samples + ' samples over 1s (' + oneYear.visible + ' sightings)');
  }

  /* The Traps line, measured rather than asserted: splitting the document into per-collection
     stores is the change that breaks sync and breaks nothing you can see on a desk. */
  const shape = await evalJs(`(function(){ return new Promise(function(res, rej){
    var open = indexedDB.open('planbook');
    open.onerror = function(){ rej(open.error); };
    open.onsuccess = function(){
      var db = open.result;
      var names = Array.prototype.slice.call(db.objectStoreNames);
      var s = db.transaction(names[0], 'readonly').objectStore(names[0]);
      var all = s.getAll();
      all.onerror = function(){ rej(all.error); };
      all.onsuccess = function(){
        var recs = all.result;
        res({ stores:names, keyPath:s.keyPath, indexes:Array.prototype.slice.call(s.indexNames),
              count:recs.length,
              whole: recs.length > 0 && recs.every(function(d){
                return Array.isArray(d.students) && Array.isArray(d.classes)
                  && Array.isArray(d.attendance) && !!d.scores && typeof d.rev === 'number'; }) });
        db.close();
      };
    }; }); })()`);
  check('one object store called years, keyed by the year string, with no index on it',
    shape.stores.length === 1 && shape.stores[0] === 'years' && shape.keyPath === 'year'
      && shape.indexes.length === 0,
    'stores=' + JSON.stringify(shape.stores) + ' keyPath=' + shape.keyPath
      + ' indexes=' + JSON.stringify(shape.indexes));
  check('one record per year, and the record IS the whole document — nothing normalized out',
    shape.count >= 1 && shape.whole, 'records = ' + shape.count);

  /* Debounce: two edits inside the window are one save and one rev. 60ms apart against an
     800ms debounce, then a wait long enough for the timer and the write. */
  const deb = await evalJs(`(async function(){ var s = window.planbook.store;
    var before = s.getDoc().rev;
    s.update(function(d){ d.teacher.school = 'probe one'; });
    await new Promise(function(r){ setTimeout(r, 60); });
    s.update(function(d){ d.teacher.school = 'probe two'; });
    var duringWindow = s.getDoc().rev;
    await new Promise(function(r){ setTimeout(r, 1800); });
    return { before:before, duringWindow:duringWindow, after:s.getDoc().rev,
             value:s.getDoc().teacher.school }; })()`);
  check('two edits 60ms apart are ONE save and ONE rev, and the later edit is the one stored',
    deb.after === deb.before + 1 && deb.value === 'probe two',
    'rev ' + deb.before + ' -> ' + deb.after + ', teacher.school = ' + JSON.stringify(deb.value));
  check('an edit alone does not move rev — rev counts saves, not keystrokes',
    deb.duringWindow === deb.before, 'rev during the debounce window = ' + deb.duringWindow);

  /* The other half of the Traps line, and the one that costs a period of grades when it is
     wrong: iOS kills a backgrounded tab, and a debounce timer that has not fired dies with
     it — so the pending write has to start the moment the page stops being visible.
     `visibilityState` cannot be assigned, so it is shadowed for the length of this check and
     the event dispatched; the listener reads exactly that property. What is asserted is the
     TIMING — the write is on disk well inside the 800ms the debounce would still be counting. */
  const vis = await evalJs(`(async function(){ var s = window.planbook.store;
    var stamp = 'flushed-on-hide-' + Date.now();
    var t0 = Date.now();
    s.update(function(d){ d.teacher.adminEmail = stamp; });
    Object.defineProperty(document, 'visibilityState',
      { configurable:true, get:function(){ return 'hidden'; } });
    document.dispatchEvent(new Event('visibilitychange'));
    delete document.visibilityState;

    function readStored(){ return new Promise(function(res, rej){
      var open = indexedDB.open('planbook');
      open.onerror = function(){ rej(open.error); };
      open.onsuccess = function(){ var db = open.result;
        var q = db.transaction('years','readonly').objectStore('years').get(s.getDoc().year);
        q.onsuccess = function(){ res(q.result); db.close(); };
        q.onerror = function(){ rej(q.error); }; }; }); }

    for (var i = 0; i < 12; i++) {
      var stored = await readStored();
      if (stored && stored.teacher.adminEmail === stamp) return { landed:true, ms:Date.now() - t0 };
      await new Promise(function(r){ setTimeout(r, 50); });
    }
    return { landed:false, ms:Date.now() - t0 }; })()`);
  check('a pending edit is flushed when the page stops being visible, not left on the debounce',
    vis.landed && vis.ms < 700,
    'on disk after ' + vis.ms + 'ms — the debounce alone would still have 800ms to run');

  const once = await evalJs(`(async function(){ var s = window.planbook.store;
    var before = s.getDoc().rev;
    s.update(function(d){ d.teacher.name = 'Persisted Probe'; });
    await s.flush();
    var chip = document.getElementById('saveIndicator');
    return { before:before, after:s.getDoc().rev, chip:chip.className, text:chip.textContent,
             updatedAt:s.getDoc().updatedAt, year:s.getDoc().year, docId:s.getDoc().docId }; })()`);
  check('a further save bumps rev by exactly one and stamps updatedAt',
    once.after === once.before + 1 && Math.abs(nodeNowMs() - Date.parse(once.updatedAt)) < 120000,
    'rev ' + once.before + ' -> ' + once.after + ', updatedAt = ' + once.updatedAt);
  check('the save indicator shows the real write landing',
    /(^|\s)saved(\s|$)/.test(once.chip) && once.text.indexOf('Saved') >= 0,
    'class="' + once.chip + '" text="' + once.text + '"');

  /* A full document load, not a soft re-render: this is the acceptance line's "full reload". */
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  const cameBack = await waitForBoot();
  await evalJs(KILL_ANIM);
  await evalJs(INSTALL_WALKER);
  const after = await evalJs(`(function(){ var d=window.planbook.store.getDoc(); if(!d) return null;
    return { year:d.year, rev:d.rev, docId:d.docId, name:d.teacher.name, school:d.teacher.school,
             label:(document.getElementById('yearButtonLabel')||{}).textContent }; })()`);
  check('the app boots again after a full reload, out of IndexedDB', cameBack && !!after,
    after ? 'reopened ' + after.year : 'the loading screen never came down');
  check('the change persists across a full reload, with its rev and its docId',
    !!after && after.name === 'Persisted Probe' && after.school === 'probe two'
      && after.rev === once.after && after.year === once.year && after.docId === once.docId,
    JSON.stringify(after));

  /* Year switching, driven through the picker rather than through the store's API: "create a
     new year, list years, open one" is a deliverable about controls a teacher can reach, and
     calling createYear() from here would only prove the half that was never in doubt. */
  const FIRST_YEAR = once.year;
  const NEW_YEAR = '2030-2031';
  await clickSel('[data-year-picker]');
  await new Promise(r => setTimeout(r, 400));
  const listed = await evalJs(`(function(){ var m=document.getElementById('yearModal');
    return { open: !!m && !m.classList.contains('hidden'),
             rows: Array.prototype.slice.call(document.querySelectorAll('#yearList [data-year-switch]'))
                     .map(function(b){ return b.getAttribute('data-year-switch'); }),
             current: Array.prototype.slice.call(document.querySelectorAll('#yearList .year-row.current'))
                     .map(function(b){ return b.getAttribute('data-year-switch'); }) }; })()`);
  check('the year button opens the picker, and the picker lists the years on this device',
    listed.open && listed.rows.length === 1 && listed.rows[0] === FIRST_YEAR
      && listed.current.length === 1 && listed.current[0] === FIRST_YEAR,
    JSON.stringify(listed));

  await evalJs('(function(){document.getElementById("yearNewInput").value='
    + JSON.stringify(NEW_YEAR) + ';return 1})()');
  await clickSel('#yearModal button[type="submit"]');
  await new Promise(r => setTimeout(r, 1200));
  const made = await evalJs(`(async function(){ var s=window.planbook.store; var d=s.getDoc();
    return { years: await s.listYears(), year:d.year, rev:d.rev, docId:d.docId,
             students:d.students.length, name:d.teacher.name,
             modalOpen: !document.getElementById('yearModal').classList.contains('hidden'),
             label:(document.getElementById('yearButtonLabel')||{}).textContent,
             pref: window.planbook.getPref('openYear') }; })()`);
  check('creating a year from the picker writes a SECOND document and opens it, empty',
    made.years.length === 2 && made.years.indexOf(NEW_YEAR) >= 0 && made.years.indexOf(FIRST_YEAR) >= 0
      && made.year === NEW_YEAR && made.rev === 1 && made.students === 0 && made.name === ''
      && made.docId !== once.docId && !made.modalOpen && made.label === NEW_YEAR,
    JSON.stringify(made));
  check('the last-open year is remembered as a planbook_ preference, and it is only a label',
    made.pref === NEW_YEAR, 'planbook_openYear = ' + JSON.stringify(made.pref));

  await clickSel('[data-year-picker]');
  await new Promise(r => setTimeout(r, 400));
  await clickSel('#yearList [data-year-switch=' + JSON.stringify(FIRST_YEAR) + ']');
  await new Promise(r => setTimeout(r, 900));
  const back = await evalJs(`(function(){ var d=window.planbook.store.getDoc();
    return { year:d.year, rev:d.rev, docId:d.docId, name:d.teacher.name, school:d.teacher.school,
             modalOpen: !document.getElementById('yearModal').classList.contains('hidden'),
             label:(document.getElementById('yearButtonLabel')||{}).textContent }; })()`);
  check('switching back through the picker shows the FIRST year\'s data, not the second\'s',
    back.year === FIRST_YEAR && back.docId === once.docId && back.name === 'Persisted Probe'
      && back.school === 'probe two' && back.rev === once.after && !back.modalOpen
      && back.label === FIRST_YEAR,
    JSON.stringify(back));

  /* The migration ladder, walked TWO steps. It used to be one — MIGRATIONS was empty, and what was
     being checked was that the ladder existed, ran and lost nothing, so that adding the first real
     step would be one entry in an object rather than a rewrite of the load path. WO-2.10 added that
     entry, so this fixture now climbs a hook installed here (0 → 1) and then the app's own real
     step (1 → 2), which is a better test of the walk than either alone: a ladder that ran only the
     step it was handed, or only its own, would be caught here.

     The fixture's one mark is a BARE STRING, which is what every document written before WO-2.10
     holds, and it has to arrive as `{ code: 'A' }` with no `at` invented for it. A step is installed
     for the length of one open and removed again; the document it climbs is written straight into
     IndexedDB, the way a document from an older build would be sitting there. */
  const OLD_YEAR = '2019-2020';
  const mig = await evalJs(`(async function(){ var s = window.planbook.store;
    var older = { schemaVersion:0, docId:'d_from_an_older_build', year:${JSON.stringify(OLD_YEAR)},
      rev:7, deviceId:'dev_old', updatedAt:'2019-09-01T00:00:00.000Z',
      teacher:{ name:'Older Build', school:'', email:'', adminEmail:'', defaultCc:true },
      classes:[{ id:'c_1', name:'Period 3' }], letterScale:[{ letter:'A', min:93 }],
      students:[{ id:'s_1', first:'Keep', last:'Me' }],
      assignments:[{ id:'a_1', classId:'c_1', name:'Quiz', points:100 }],
      scores:{ a_1:{ s_1:{ v:87 } } }, attendance:[{ classId:'c_1', date:'2019-09-09', marks:{ s_1:'A' } }],
      log:[], events:[], templates:[], signals:{} };
    await new Promise(function(res, rej){
      var open = indexedDB.open('planbook');
      open.onerror = function(){ rej(open.error); };
      open.onsuccess = function(){ var db = open.result;
        var t = db.transaction('years', 'readwrite');
        t.objectStore('years').put(older);
        t.oncomplete = function(){ db.close(); res(); };
        t.onerror = function(){ rej(t.error); };
      }; });

    var ran = 0;
    s.MIGRATIONS[0] = function(d){ ran++; d.cameThroughTheHook = true; return d; };
    var opened, failure = null;
    try { opened = await s.openYear(${JSON.stringify(OLD_YEAR)}); }
    catch (e) { failure = String(e && e.message); }
    delete s.MIGRATIONS[0];
    if (failure) return { failure: failure };

    /* Read it back off disk: a migration that only happened in memory would run again on
       every open, and the acceptance line is about a document, not a variable. */
    var stored = await new Promise(function(res, rej){
      var open = indexedDB.open('planbook');
      open.onerror = function(){ rej(open.error); };
      open.onsuccess = function(){ var db = open.result;
        var q = db.transaction('years','readonly').objectStore('years').get(${JSON.stringify(OLD_YEAR)});
        q.onsuccess = function(){ res(q.result); db.close(); };
        q.onerror = function(){ rej(q.error); };
      }; });

    await s.openYear(${JSON.stringify(FIRST_YEAR)});
    return { ran:ran, schemaVersion:opened.schemaVersion, marker:opened.cameThroughTheHook === true,
             rev:opened.rev, docId:opened.docId, teacher:opened.teacher.name,
             student:opened.students[0] && opened.students[0].last,
             score:opened.scores.a_1 && opened.scores.a_1.s_1 && opened.scores.a_1.s_1.v,
             mark:opened.attendance[0] && opened.attendance[0].marks.s_1,
             storedMark: stored && stored.attendance[0] && stored.attendance[0].marks.s_1,
             /* WO-2.8's rung, read off DISK for the reason the mark above is: a collection seeded
                in memory and never written back is a collection the next launch does not have. */
             storedOpen: stored && stored.openPasses, storedPasses: stored && stored.passes,
             storedVersion: stored && stored.schemaVersion, storedMarker: stored && stored.cameThroughTheHook };
  })()`);
  check('a document written under an older schema loads THROUGH the migration hook',
    !mig.failure && mig.ran === 1 && mig.schemaVersion === SCHEMA_NOW && mig.marker === true,
    mig.failure ? 'openYear threw: ' + mig.failure
      : 'steps run = ' + mig.ran + ', schemaVersion now ' + mig.schemaVersion);
  check('and it loses nothing on the way up — students, scores, marks, docId, teacher',
    !mig.failure && mig.student === 'Me' && mig.score === 87
      && !!mig.mark && mig.mark.code === 'A'
      && mig.docId === 'd_from_an_older_build' && mig.teacher === 'Older Build',
    JSON.stringify(mig));
  /* WO-2.10's own step, asked of the thing it converts. The cell arrived as `"A"` and has to be
     `{ code: "A" }` — an object, its code intact, and NO `at`, because the moment that tardy or
     absence was marked was never recorded and a timestamp from the migration's own clock would say
     the student arrived the day the teacher updated the app. Asserted on the record ON DISK as well
     as in memory: a conversion that happened only in memory would run again on every open, which is
     one of the three failure modes that step is written against. */
  check('and every bare-string mark cell came up as an object, with no `at` invented for it',
    !mig.failure && !!mig.storedMark && typeof mig.storedMark === 'object'
      && mig.storedMark.code === 'A' && mig.storedMark.at === undefined
      && Object.keys(mig.storedMark).join(',') === 'code',
    'the cell was "A" in the version-1 document and is ' + JSON.stringify(mig.storedMark)
      + ' on disk (in memory: ' + JSON.stringify(mig.mark) + ')');
  /* WO-2.8's step, asked the same way. A document written before hall passes existed has neither
     collection, and it has to come up the ladder holding both — empty, on disk, and as arrays
     rather than as anything else. src/passes.js reads them through an accessor that tolerates a
     missing key, so a build whose rung did nothing would LOOK fine on screen and would write a
     document that every later reader has to keep guarding against. This is where that shows. */
  check('and it comes up holding both hall-pass collections, empty, as arrays, on disk',
    !mig.failure && Array.isArray(mig.storedOpen) && mig.storedOpen.length === 0
      && Array.isArray(mig.storedPasses) && mig.storedPasses.length === 0,
    'openPasses = ' + JSON.stringify(mig.storedOpen) + ', passes = ' + JSON.stringify(mig.storedPasses)
      + ' in the version-0 document read back off disk');
  check('the migrated document is written back once, as a save (rev 7 -> 8), not on every open',
    !mig.failure && mig.rev === 8 && mig.storedVersion === SCHEMA_NOW && mig.storedMarker === true,
    'rev = ' + mig.rev + ', stored schemaVersion = ' + mig.storedVersion);

  /* A forced save failure, and it has to be a REAL one: a function in the document is a value
     structured clone refuses, so put() throws DataCloneError out of the same line a full disk
     would. Nothing in the store is stubbed for this. It goes last in the section because it
     leaves the in-memory document permanently unwritable — every later save fails too, which
     is exactly the condition being checked, and the reload at the top of the next section is
     what clears it. */
  const logMark = consoleLog.length;
  const failed = await evalJs(`(async function(){ var s = window.planbook.store;
    var before = s.getDoc().rev;
    s.update(function(d){ d.teacher.thisCannotBeCloned = function(){}; });
    await s.flush();
    /* Poll for a SETTLED chip rather than sleeping a fixed 150ms. writeCurrent resolves only
       after its one retry has run and painted 'error' (store.js:388), so the sleep was never
       needed to see the end state — but a doomed save restarted by a surviving timer repaints
       'retry' underneath it, and a fixed wait lands inside that window often enough to fail a
       green build. Waiting on the condition cannot race it. */
    var chip = document.getElementById('saveIndicator');
    await new Promise(function(resolve){
      var deadline = Date.now() + 12000, settledSince = 0;
      (function poll(){
        var settled = /(^|\s)(error|saved)(\s|$)/.test(chip.className);
        if (!settled) settledSince = 0;
        else if (!settledSince) settledSince = Date.now();
        /* Settled AND still settled 600ms later. A single sample cannot tell a finished
           failure from the gap between two attempts, and MAX_WAIT_MS is 5000, so a stale
           max-wait timer restarting the doomed write lands squarely on a 5000ms deadline. */
        if ((settledSince && Date.now() - settledSince > 600) || Date.now() > deadline) return resolve();
        setTimeout(poll, 25);
      })();
    });
    return { before:before, after:s.getDoc().rev, chip:chip.className, text:chip.textContent,
             spoken:(document.querySelector('[aria-live]')||{}).textContent }; })()`);
  check('a save failure paints the error state on the indicator',
    /(^|\s)error(\s|$)/.test(failed.chip) && failed.text.indexOf('Save failed') >= 0,
    'class="' + failed.chip + '" text="' + failed.text + '"');
  check('and it is announced as well as shown — the chip is not something a screen reader watches',
    /Save failed/i.test(failed.spoken || ''), 'live region = ' + JSON.stringify(failed.spoken));
  check('and rev is rolled back, so memory never claims a save that storage never saw',
    failed.after === failed.before, 'rev ' + failed.before + ' -> ' + failed.after);
  const swallowed = consoleLog.slice(logMark).filter(l => l.type === 'error'
    && /could not be saved/i.test(l.text));
  check('the failure is not silently swallowed — it reaches the console with the year named',
    swallowed.length >= 1, swallowed.length ? swallowed[0].text.slice(0, 120)
      : 'nothing was logged at error level');
}
}
