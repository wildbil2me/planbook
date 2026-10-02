/* score-search.mjs — the score grid narrows by student (WO-3.29)
 *
 * One section per surface (tools/README.md § "Where a new check goes"). This one drives the search
 * box over the score grid, and the registry's search box beside it, against one fixture of its own:
 * the four names the work order's first Acceptance line is written about, plus two that make the
 * negatives honest — a student whose NICKNAME is the only thing a query matches, and one whose name
 * matches nothing anybody types here.
 *
 * IT IS PLANTED THROUGH THE STORE, for the reason tools/verify/score-grid.mjs gives about its own:
 * the claims are about the box, not about creating a class, and every QUERY below is typed — the
 * focus line keystroke by keystroke at the page, the comparison loop through the `input` event both
 * screens listen for, which is how tools/verify/attendance.mjs drives the registry's box.
 *
 * THE FIXTURE COMES BACK OUT at the foot, and the class this section found open is put back.
 */

import fs from 'node:fs';
import path from 'node:path';

export async function run(h) {
const { check, skip, send, evalJs, clickSel, KILL_ANIM, INSTALL_WALKER, waitForBoot, readLocalStore,
  oursIn } = h;

console.log('\n--- the score grid narrows by student (WO-3.29) ---');
{
  /* ── line 2's structural half, read off disk: one matcher, and neither screen carries its own ──

     A fixture can only show that today's answers agree. What makes the two boxes ONE rule is that
     the test lives in one place, so this reads the three files with comments stripped and asks: is
     there exactly one exported matcher, do both screens call it, and does either screen still
     lower-case a name and look for the box's text inside it — the shape the attendance test had
     before it moved. It runs before the browser is touched because it needs none. */
  const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const read = (f) => strip(fs.readFileSync(path.join(h.ROOT, 'src', f), 'utf8'));
  const roster = read('roster.js'), att = read('attendance.js'), sc = read('scores.js');
  const ownTest = /(?:rosterName|fullName)\s*\([^)]*\)\s*\.toLowerCase\s*\(\s*\)\s*\.(?:indexOf|includes|startsWith)\s*\(/;
  const importsIt = (code) => /import\s*\{[^}]*\bnameMatches\b[^}]*\bsearchNeedle\b[^}]*\}\s*from\s*'\.\/roster\.js'|import\s*\{[^}]*\bsearchNeedle\b[^}]*\bnameMatches\b[^}]*\}\s*from\s*'\.\/roster\.js'/.test(code);
  const calls = (code, name) => (code.match(new RegExp('(?<![\\w.])' + name + '\\s*\\(', 'g')) || []).length;
  const one = {
    exported: (roster.match(/export function nameMatches\s*\(/g) || []).length,
    needleExported: (roster.match(/export function searchNeedle\s*\(/g) || []).length,
    rosterTests: ownTest.test(roster),
    attImports: importsIt(att), scImports: importsIt(sc),
    attCalls: calls(att, 'nameMatches'), scCalls: calls(sc, 'nameMatches'),
    attNeedle: calls(att, 'searchNeedle'), scNeedle: calls(sc, 'searchNeedle'),
    attOwn: ownTest.test(att), scOwn: ownTest.test(sc),
    attTrims: /String\(value \|\| ''\)\.trim\(\)\.toLowerCase\(\)/.test(att),
  };
  check('one matcher, read off disk with comments stripped: src/roster.js exports nameMatches() and searchNeedle() once each and holds the only lower-cased name test; src/attendance.js and src/scores.js both import the pair from it, both call it, and neither carries a name test or a needle normalisation of its own',
    one.exported === 1 && one.needleExported === 1 && one.rosterTests
      && one.attImports && one.scImports && one.attCalls >= 1 && one.scCalls >= 1
      && one.attNeedle >= 1 && one.scNeedle >= 1
      && !one.attOwn && !one.scOwn && !one.attTrims,
    JSON.stringify(one));

  const seam = await evalJs("!!(window.planbook && window.planbook.store && window.planbook.classes)");
  if (!seam) {
    skip('the score grid search: the four names, the nickname, the count, the empty line, Escape, the edges, the caret, the figures, the arrival and the 44px',
      'no window.planbook.store/classes seam on the page, so no fixture can be planted');
    return;
  }

  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await send('Emulation.setDeviceMetricsOverride',
    { width: 1200, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 700));
  await waitForBoot();
  await evalJs(KILL_ANIM);
  await evalJs(INSTALL_WALKER);

  /* One key at the page, the shape tools/verify/score-grid.mjs's sk() uses: a printable key carries
     `text`, a named one is a rawKeyDown. */
  const sk = async (k, code, vk, text) => {
    const ev = { key: k, code: code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers: 0 };
    if (text) ev.text = text;
    await send('Input.dispatchKeyEvent', Object.assign({ type: text ? 'keyDown' : 'rawKeyDown' }, ev));
    await send('Input.dispatchKeyEvent', Object.assign({ type: 'keyUp' }, ev));
    await new Promise(r => setTimeout(r, 45));
  };
  const skChar = (c) => {
    const up = c.toUpperCase();
    const code = /[a-z]/i.test(c) ? 'Key' + up : c === ' ' ? 'Space' : c === ',' ? 'Comma' : '';
    const vk = /[a-z]/i.test(c) ? up.charCodeAt(0) : c === ' ' ? 32 : c === ',' ? 188 : c.charCodeAt(0);
    return sk(c, code, vk, c);
  };
  const skEsc = () => sk('Escape', 'Escape', 27);
  const skEnter = () => sk('Enter', 'Enter', 13);
  const skDown = () => sk('ArrowDown', 'ArrowDown', 40);
  const skUp = () => sk('ArrowUp', 'ArrowUp', 38);

  const plant = await evalJs(`(function(){
    var s = window.planbook.store, c = window.planbook.classes;
    var d = s.getDoc();
    if (!d) return { ok:false, why:'no year document is open' };
    var people = [
      { id:'wo329-s1', first:'Amari', last:'Johnson', nickname:'' },
      { id:'wo329-s2', first:'Ben', last:'Castillo', nickname:'' },
      { id:'wo329-s3', first:'Marcus', last:'Bell', nickname:'' },
      { id:'wo329-s4', first:'Thomas', last:'Reed', nickname:'' },
      /* The nickname is the whole of this row's reason: "zeke" is in it and in nothing else. */
      { id:'wo329-s5', first:'Robert', last:'Quinn', nickname:'Zeke' },
      { id:'wo329-s6', first:'Priya', last:'Shah', nickname:'' }
    ];
    var was = c.getSelectedClassId();
    s.update(function(doc){
      doc.classes.push({ id:'c_wo329', name:'WO-3.29 Search', archived:false,
        terms:[{ id:'tm_wo329', label:'WO-3.29 Term', start:'', end:'' }],
        categories:[{ id:'wo329-cat', name:'Work', weight:100 }],
        roster: people.map(function(p){ return p.id; }).reverse() });
      people.forEach(function(p){ doc.students.push(p); });
      doc.assignments.push({ id:'wo329-a1', classId:'c_wo329', termId:'tm_wo329',
        categoryId:'wo329-cat', name:'Essay', points:100, assigned:'', due:'' });
      doc.assignments.push({ id:'wo329-a2', classId:'c_wo329', termId:'tm_wo329',
        categoryId:'wo329-cat', name:'Quiz', points:20, assigned:'', due:'' });
      doc.scores = doc.scores || {};
      /* Different numbers per student, and Reed left blank on both, so the summary has a class
         average AND a blank count to hold still while the rows narrow. */
      doc.scores['wo329-a1'] = { 'wo329-s1':{ v:90 }, 'wo329-s2':{ v:80 }, 'wo329-s3':{ v:70 },
        'wo329-s5':{ v:60 }, 'wo329-s6':{ v:95 } };
      doc.scores['wo329-a2'] = { 'wo329-s2':{ v:15 }, 'wo329-s5':{ v:10 }, 'wo329-s6':{ v:19 } };
    });
    c.selectClass('c_wo329');
    return { ok:true, was: was };
  })()`);

  if (!plant.ok) {
    check('the WO-3.29 fixture is real', false, plant.why);
    return;
  }

  await evalJs('window.planbook.store.flush()');
  await clickSel('#classTabBar [data-class-tab="c_wo329"]');
  await new Promise(r => setTimeout(r, 250));

  const GRID = `(function(){
    var view = document.getElementById('scoresView');
    var rows = Array.prototype.slice.call(document.querySelectorAll('#scoresBody tr[data-score-row]'));
    var box = document.getElementById('scoresSearch');
    var found = document.getElementById('scoresFound');
    var empty = document.getElementById('scoresEmpty');
    var wrap = document.getElementById('scoresGridWrap');
    var a = document.activeElement;
    return {
      shown: !!view && !view.classList.contains('hidden'),
      rows: rows.map(function(r){ return r.getAttribute('data-score-row'); }),
      names: rows.map(function(r){ return (r.querySelector('.scores-name-btn')||{}).textContent || ''; }),
      grades: rows.map(function(r){ return r.getAttribute('data-score-row') + '='
        + (r.querySelector('.scores-grade')||{}).textContent; }),
      headRows: document.querySelectorAll('#scoresHead tr').length,
      wrapHidden: !wrap || wrap.classList.contains('hidden'),
      boxValue: box ? box.value : null,
      boxInView: !!box && !box.closest('.hidden'),
      found: found && !found.classList.contains('hidden') ? found.textContent.replace(/\\s+/g,' ').trim() : '',
      emptyShown: !!empty && !empty.classList.contains('hidden'),
      emptyText: empty ? empty.textContent : '',
      summary: (document.getElementById('scoresSummary')||{}).textContent || '',
      headline: (document.getElementById('scoresHeadline')||{}).textContent || '',
      active: a ? (a.id || a.getAttribute('data-score-student') || a.tagName) : '',
      said: (document.getElementById('srLive')||{}).textContent || ''
    }; })()`;

  const REGISTRY = `(function(){
    return Array.prototype.slice.call(document.querySelectorAll('#classView tr[data-attendance-row]'))
      .map(function(r){ return r.getAttribute('data-attendance-row'); }); })()`;

  const setBox = (id, v) => evalJs('(function(){ var e = document.getElementById(' + JSON.stringify(id)
    + '); e.value = ' + JSON.stringify(v) + '; e.dispatchEvent(new Event("input", { bubbles: true }));'
    + ' return 1; })()');

  const doorOk = await evalJs("!!document.querySelector('#classView [data-class-screen=\"scores\"]')");
  if (!doorOk) {
    check('the Scores segment is reachable from the class screen, so the search box can be driven the way a teacher reaches it',
      false, 'no #classView [data-class-screen="scores"]');
  } else {
    /* ── the registry's answers, taken FIRST and through its own box, before the grid is opened ──
       Line 2 asks that the attendance search answer every one of these queries identically. The
       registry's answer is read here, the grid's below, and the comparison is set against set. */
    const QUERIES = ['ma', 'bell, m', 'zeke', '  MA ', 'zz', 'REED', 'son, a', ''];
    const registry = {};
    for (const q of QUERIES) {
      await setBox('attendanceSearch', q);
      registry[q] = (await evalJs(REGISTRY)).slice().sort();
    }
    await setBox('attendanceSearch', '');

    await clickSel('#classView [data-class-screen="scores"]');
    await new Promise(r => setTimeout(r, 300));
    const whole = await evalJs(GRID);
    const storeBefore = await readLocalStore(evalJs, 400);

    /* ── line 1: the four names, the "Last, First" form, the nickname, the count ── */
    const grid = {};
    for (const q of QUERIES) {
      await setBox('scoresSearch', q);
      grid[q] = await evalJs(GRID);
    }
    const ma = grid['ma'];
    check('typing "ma" shows Amari, Marcus and Thomas and not Ben (or anyone else), in grid order, and the count beside the box reads "3 of 6 students"',
      whole.shown && whole.rows.length === 6 && whole.found === ''
        && JSON.stringify(ma.rows) === JSON.stringify(['wo329-s3', 'wo329-s1', 'wo329-s4'])
        && ma.rows.indexOf('wo329-s2') < 0 && ma.found === '3 of 6 students',
      'whole class ' + JSON.stringify(whole.names) + ' (count ' + JSON.stringify(whole.found)
        + '); "ma" → ' + JSON.stringify(ma.names) + ', count ' + JSON.stringify(ma.found));
    check('"bell, m" — the "Last, First" form — shows Marcus alone, and "zeke", which is only Robert Quinn\'s nickname, shows no one',
      JSON.stringify(grid['bell, m'].rows) === JSON.stringify(['wo329-s3'])
        && grid['zeke'].rows.length === 0 && grid['zeke'].found === '0 of 6 students',
      '"bell, m" → ' + JSON.stringify(grid['bell, m'].names) + '; "zeke" → '
        + JSON.stringify(grid['zeke'].names) + ' (' + grid['zeke'].found + ')');
    const zz = grid['zz'];
    check('a query matching no one draws the grid\'s own empty line and no grid head — the grid wrapper is hidden and #scoresHead holds no row — while the box stays on screen holding the query',
      zz.rows.length === 0 && zz.headRows === 0 && zz.wrapHidden && zz.emptyShown
        && /matches that/.test(zz.emptyText) && zz.boxInView && zz.boxValue === 'zz',
      JSON.stringify({ rows: zz.rows.length, headRows: zz.headRows, wrapHidden: zz.wrapHidden,
        empty: zz.emptyShown ? zz.emptyText : '(hidden)', box: zz.boxValue, boxInView: zz.boxInView }));

    /* ── line 2's behavioural half: the same queries, the same students, on both screens ── */
    const diffs = QUERIES.filter((q) => JSON.stringify(registry[q])
      !== JSON.stringify(grid[q].rows.slice().sort()));
    check('the attendance search answers every one of those queries identically — "ma", "bell, m", "zeke", "  MA " (trimmed and lower-cased), "zz", "REED", "son, a" and the empty box, each read off the registry\'s own rows through its own box and compared set for set with the grid\'s',
      diffs.length === 0 && registry['ma'].length === 3 && registry['zeke'].length === 0
        && registry[''].length === 6,
      diffs.length ? 'differ on ' + JSON.stringify(diffs.map((q) => ({ q: q, registry: registry[q],
        grid: grid[q].rows.slice().sort() })))
        : JSON.stringify(QUERIES.map((q) => q + '→' + registry[q].length)));

    /* ── line 5: every figure byte-identical with the search on and off ── */
    const gradeOf = (snap) => { const m = {}; snap.grades.forEach((g) => { const i = g.indexOf('=');
      m[g.slice(0, i)] = g.slice(i + 1); }); return m; };
    const wholeGrades = gradeOf(whole);
    const narrowedOk = QUERIES.every((q) => grid[q].summary === whole.summary
      && grid[q].headline === whole.headline
      && grid[q].grades.every((g) => { const i = g.indexOf('=');
        return wholeGrades[g.slice(0, i)] === g.slice(i + 1); }));
    check('the class average, the blank count and every overall grade are byte-identical with the search on and off — the summary line and the headline compared as text under every query above (the empty-result ones included), and each shown row\'s grade cell against the same student\'s with the box empty',
      narrowedOk && /Class average/.test(whole.summary) && /blank/.test(whole.summary)
        && Object.keys(wholeGrades).length === 6,
      'whole: ' + JSON.stringify(whole.summary) + ' · ' + JSON.stringify(wholeGrades)
        + (narrowedOk ? '' : ' · under "ma": ' + JSON.stringify(ma.summary) + ' · ' + JSON.stringify(ma.grades)));

    /* ── line 4: the caret stays in the box from the first letter to the last ── */
    await setBox('scoresSearch', '');
    await clickSel('#scoresSearch');
    const typed = 'bell, m';
    const trail = [];
    for (const c of typed) {
      await skChar(c);
      const at = await evalJs(`(function(){ var a = document.activeElement;
        return { id: a ? a.id : '', value: a ? a.value : '', rows:
          document.querySelectorAll('#scoresBody tr[data-score-row]').length }; })()`);
      trail.push(at);
    }
    check('typing "bell, m" one key at a time keeps document.activeElement on #scoresSearch after every keystroke, the value growing a letter at a time, while the rows narrow under it to Marcus alone',
      trail.length === typed.length
        && trail.every((t, i) => t.id === 'scoresSearch' && t.value === typed.slice(0, i + 1))
        && trail[trail.length - 1].rows === 1,
      JSON.stringify(trail));

    /* ── line 1's last clause: Escape clears the box and every row returns ── */
    await skEsc();
    const afterEsc = await evalJs(GRID);
    check('Escape in the search box clears it and every row returns, with the caret still in the box and the grid still on screen',
      afterEsc.boxValue === '' && afterEsc.rows.length === 6 && afterEsc.found === ''
        && afterEsc.active === 'scoresSearch' && afterEsc.shown && !afterEsc.emptyShown,
      JSON.stringify({ box: afterEsc.boxValue, rows: afterEsc.rows.length, active: afterEsc.active,
        found: afterEsc.found, shown: afterEsc.shown }));

    /* ── line 3: the edges of a narrowed column ──
       "ma" leaves Bell, Johnson, Reed. The caret starts on Bell's Essay cell; ArrowUp there is the
       first SHOWN student, Enter twice reaches Reed, and Enter and ArrowDown there are the last —
       each said in the sentence the grid already speaks. Ben Castillo, between Bell and Johnson in
       the whole class, must never receive the caret. */
    for (const c of 'ma') await skChar(c);
    const cell = (s) => '#scoresBody [data-score-cell="wo329-a1"][data-score-student="' + s + '"]';
    const hear = async (press) => {
      await evalJs("(function(){ var e = document.getElementById('srLive'); if (e) e.textContent = '·'; return 1; })()");
      await press();
      let said = '·';
      for (let i = 0; i < 20 && said === '·'; i++) {
        await new Promise(r => setTimeout(r, 25));
        said = await evalJs("(document.getElementById('srLive')||{}).textContent || ''");
      }
      const at = await evalJs("(function(){ var a = document.activeElement; return a ? (a.getAttribute('data-score-student') || a.id) : ''; })()");
      return { at: at, said: said };
    };
    await clickSel(cell('wo329-s3'));
    const up = await hear(skUp);
    const e1 = await hear(skEnter);
    const e2 = await hear(skEnter);
    const e3 = await hear(skEnter);
    const dn = await hear(skDown);
    check('with the rows narrowed to "ma", ArrowUp on the first shown row stays put and says "first student"; Enter walks Bell → Johnson → Reed, skipping Castillo; Enter and ArrowDown on Reed stay put and say "last student"',
      up.at === 'wo329-s3' && /first student/.test(up.said)
        && e1.at === 'wo329-s1' && e2.at === 'wo329-s4'
        && e3.at === 'wo329-s4' && /last student/.test(e3.said)
        && dn.at === 'wo329-s4' && /last student/.test(dn.said),
      JSON.stringify({ up: up, e1: e1.at, e2: e2.at, e3: e3, down: dn }));

    /* ── line 6: leave, come back, an empty search; and no planbook_ key moved ── */
    await clickSel('#scoresView [data-class-screen="class"]');
    await new Promise(r => setTimeout(r, 200));
    await clickSel('#classView [data-class-screen="scores"]');
    await new Promise(r => setTimeout(r, 300));
    const back = await evalJs(GRID);
    const storeAfter = await readLocalStore(evalJs, 400);
    const ours = (st) => JSON.stringify(oursIn(st).sort().map((k) => [k, st[k]]));
    check('leaving the grid for Attendance and coming back through the switcher shows an empty search and the whole class, and no planbook_ key was written or changed by any of the typing above',
      back.boxValue === '' && back.rows.length === 6 && back.found === ''
        && ours(storeBefore) === ours(storeAfter)
        && !Object.keys(storeAfter).some((k) => /search/i.test(k) || /bell, m|"ma"/.test(String(storeAfter[k]))),
      'box ' + JSON.stringify(back.boxValue) + ', rows ' + back.rows.length + '; planbook_ keys before '
        + oursIn(storeBefore).length + ', after ' + oursIn(storeAfter).length
        + (ours(storeBefore) === ours(storeAfter) ? ', unchanged' : ' — CHANGED: ' + ours(storeAfter)));

    /* ── line 7: the box at 44px under a coarse pointer ── */
    await send('Emulation.setDeviceMetricsOverride',
      { width: 1024, height: 768, deviceScaleFactor: 2, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 700));
    await waitForBoot();
    await evalJs(KILL_ANIM);
    await evalJs(INSTALL_WALKER);
    const coarse = await evalJs("matchMedia('(pointer: coarse)').matches");
    await clickSel('#classTabBar [data-class-tab="c_wo329"]');
    await new Promise(r => setTimeout(r, 250));
    await clickSel('#classView [data-class-screen="scores"]');
    await new Promise(r => setTimeout(r, 300));
    const box = await evalJs(`(function(){ var b = document.getElementById('scoresSearch');
      if (!b) return null; var r = b.getBoundingClientRect();
      return { w: r.width, h: r.height, display: getComputedStyle(b).display,
               viewHidden: document.getElementById('scoresView').classList.contains('hidden') }; })()`);
    check('the score grid\'s search box measures at least 44px tall and 44px wide under the coarse pointer, on the open grid',
      coarse === true && !!box && !box.viewHidden && box.display !== 'none' && box.h >= 44 && box.w >= 44,
      'coarse = ' + coarse + ' · ' + JSON.stringify(box));

    await send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await send('Emulation.setDeviceMetricsOverride',
      { width: 1200, height: 900, deviceScaleFactor: 1, mobile: false });
  }

  /* THE FIXTURE COMES BACK OUT, and the class this section found open goes back under it. */
  await evalJs(`(async function(){
    var s = window.planbook.store, c = window.planbook.classes;
    var d = s.getDoc();
    if (!d) return 0;
    s.update(function(doc){
      doc.classes = doc.classes.filter(function(x){ return x.id !== 'c_wo329'; });
      doc.students = doc.students.filter(function(x){ return String(x.id).indexOf('wo329-') !== 0; });
      doc.assignments = doc.assignments.filter(function(a){ return a.classId !== 'c_wo329'; });
      Object.keys(doc.scores || {}).forEach(function(k){
        if (String(k).indexOf('wo329-') === 0) delete doc.scores[k]; });
    });
    var was = ${JSON.stringify(plant.was || '')};
    if (was) c.selectClass(was);
    c.refreshClassBar();
    await s.flush();
    return 1; })()`);
  const gone = await evalJs(`(function(){ var d = window.planbook.store.getDoc();
    return d.classes.filter(function(x){ return x.id === 'c_wo329'; }).length
      + d.students.filter(function(x){ return String(x.id).indexOf('wo329-') === 0; }).length; })()`);
  check('the WO-3.29 fixture comes back out — no class and no student of it left in the document',
    gone === 0, gone + ' left');
}
}
