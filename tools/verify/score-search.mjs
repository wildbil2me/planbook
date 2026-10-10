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
        /* THREE CATEGORIES SINCE WO-3.28, which shares this fixture for its combination checks.
           Work and Quizzes each hold two assignments; Homework holds none, so it must get NO pill
           (a pill that empties the grid is a dead control). Weighted 60 / 40 / 0 so the weights
           still total 100 and every grade below is a real one, and so a Quizzes average is never
           the overall grade by accident. */
        categories:[{ id:'wo329-cat', name:'Work', weight:60 },
                    { id:'wo329-quiz', name:'Quizzes', weight:40 },
                    { id:'wo329-hw', name:'Homework', weight:0 }],
        roster: people.map(function(p){ return p.id; }).reverse() });
      people.forEach(function(p){ doc.students.push(p); });
      doc.assignments.push({ id:'wo329-a1', classId:'c_wo329', termId:'tm_wo329',
        categoryId:'wo329-cat', name:'Essay', points:100, assigned:'', due:'' });
      doc.assignments.push({ id:'wo329-a2', classId:'c_wo329', termId:'tm_wo329',
        categoryId:'wo329-quiz', name:'Quiz', points:20, assigned:'', due:'' });
      doc.assignments.push({ id:'wo329-a3', classId:'c_wo329', termId:'tm_wo329',
        categoryId:'wo329-cat', name:'Essay two', points:50, assigned:'', due:'' });
      doc.assignments.push({ id:'wo329-a4', classId:'c_wo329', termId:'tm_wo329',
        categoryId:'wo329-quiz', name:'Quiz two', points:10, assigned:'', due:'' });
      /* Filed under a category this class does not have — reachable from a restored document. It
         belongs to no pill and must show under All only. */
      doc.assignments.push({ id:'wo329-a5', classId:'c_wo329', termId:'tm_wo329',
        categoryId:'wo329-gone', name:'Loose sheet', points:10, assigned:'', due:'' });
      doc.scores = doc.scores || {};
      /* Different numbers per student, and Reed left blank on everything, so the summary has a class
         average AND a blank count to hold still while the rows narrow — and so Reed has no Quizzes
         figure at all, which is the student the category average has to leave out.

         THE QUIZ CELLS ARE CHOSEN TO TELL ARITHMETICS APART (WO-3.28's mutation proof). Castillo's
         second quiz is MISSING (0 out of the full 10) and Quinn's is EXCUSED (out of the
         grade entirely), so the engine's per-student figure differs from a mean of the typed
         numbers; the students have different possible points, so the mean of their figures differs
         from one pooled earned/possible across the class; and 60/40 keeps every Quizzes figure off
         the overall grade beside it. */
      doc.scores['wo329-a1'] = { 'wo329-s1':{ v:90 }, 'wo329-s2':{ v:80 }, 'wo329-s3':{ v:70 },
        'wo329-s5':{ v:60 }, 'wo329-s6':{ v:95 } };
      doc.scores['wo329-a2'] = { 'wo329-s2':{ v:15 }, 'wo329-s5':{ v:10 }, 'wo329-s6':{ v:19 } };
      doc.scores['wo329-a3'] = { 'wo329-s1':{ v:40 }, 'wo329-s2':{ v:45 }, 'wo329-s6':{ v:30 } };
      doc.scores['wo329-a4'] = { 'wo329-s1':{ v:9 }, 'wo329-s2':{ v:null, flag:'missing' },
        'wo329-s3':{ v:6 }, 'wo329-s5':{ v:null, flag:'excused' }, 'wo329-s6':{ v:7 } };
      doc.scores['wo329-a5'] = { 'wo329-s6':{ v:8 } };
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

  /* ── WO-2.61: the box a teacher sees is the field that has focus ──

     Read off the live layout, never off a stylesheet: the defect was a ring drawn on the right element
     around the wrong rectangle. GEOM reads, for one search box, (a) the field — its rect, its own
     border and radius, whether it is the focused element and matches `:focus-visible`; (b) the
     wrapper — its rect and whether it draws a border or padding of its own, because a wrapper that
     does is the visible box the ring is NOT on; (c) the 🔍 and the ✕ rects; (d) the field's content
     box, which is where typed text is drawn and clipped, against the glyph's right edge and the ✕'s
     left (the ✕'s whole box — under a coarse pointer its 44px target, not just its disc); and (e) a
     hit test at the glyph's centre, which must land on the field. With a value longer than the field
     the caret is put at the end and `scrollLeft` read, so the "end" half is a string actually
     scrolled up against the right padding rather than one that happens to stop short of it. */
  const GEOM = (boxId, xId) => `(function(){
    var f = document.getElementById(${JSON.stringify(boxId)}), x = document.getElementById(${JSON.stringify(xId)});
    if (!f || !x) return null;
    var w = f.parentNode, g = w.querySelector(':scope > span[aria-hidden="true"]');
    var R = function(e){ var r = e.getBoundingClientRect();
      return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
    var fs = getComputedStyle(f), ws = getComputedStyle(w), px = function(v){ return parseFloat(v) || 0; };
    var fr = R(f), wr = R(w), gr = g ? R(g) : null, xr = R(x);
    f.setSelectionRange(f.value.length, f.value.length);
    f.scrollLeft = f.scrollWidth;
    var gc = gr ? document.elementFromPoint((gr.l + gr.r) / 2, (gr.t + gr.b) / 2) : null;
    var inside = function(a){ return !!a && a.l >= fr.l - 0.5 && a.r <= fr.r + 0.5
      && a.t >= fr.t - 0.5 && a.b <= fr.b + 0.5; };
    return {
      focused: document.activeElement === f, fv: f.matches(':focus-visible'),
      outline: fs.outlineStyle + ' ' + fs.outlineWidth,
      field: fr, fieldBorder: [fs.borderTopWidth, fs.borderRightWidth, fs.borderBottomWidth,
        fs.borderLeftWidth].map(px), fieldBorderStyle: fs.borderTopStyle, fieldRadius: px(fs.borderTopLeftRadius),
      wrap: wr, wrapBorder: [ws.borderTopWidth, ws.borderRightWidth, ws.borderBottomWidth,
        ws.borderLeftWidth].map(px), wrapPad: [ws.paddingTop, ws.paddingRight, ws.paddingBottom,
        ws.paddingLeft].map(px),
      sameBox: Math.abs(wr.l - fr.l) < 0.5 && Math.abs(wr.r - fr.r) < 0.5
        && Math.abs(wr.t - fr.t) < 0.5 && Math.abs(wr.b - fr.b) < 0.5,
      glyph: gr, x: xr, xShown: !x.classList.contains('hidden') && x.getClientRects().length > 0,
      glyphInside: inside(gr), xInside: inside(xr),
      glyphTapsField: gc === f,
      textStart: fr.l + px(fs.borderLeftWidth) + px(fs.paddingLeft),
      textEnd: fr.r - px(fs.borderRightWidth) - px(fs.paddingRight),
      scrolled: f.scrollLeft, overflows: f.scrollWidth > f.clientWidth, value: f.value.length
    }; })()`;
  /* Long enough to overflow the widest box this section draws — the Scores box under the coarse
     pointer at 1024, which `(max-width: 1024px)` lets run to ~640px — so `scrollLeft` is never 0. */
  const LONG = 'Bartholomew Alexander Montgomery-Fitzwilliam Worthington the Third, '
    + 'Esquire, of the Hampshire Montgomery-Fitzwilliams, Class of Twenty-Seven';
  /* The line-1 and line-2 verdicts on one GEOM reading. The field is focused through a real press at
     its centre (clickSel), which is what draws the ring on a tap. */
  const bordered = (m) => !!m && m.focused && m.fv && /^solid/.test(m.outline)
    && m.fieldBorder.every((b) => b >= 1) && m.fieldBorderStyle === 'solid' && m.fieldRadius > 0
    && m.wrapBorder.every((b) => b === 0) && m.wrapPad.every((p) => p === 0) && m.sameBox
    && m.xShown && m.glyphInside && m.xInside && m.glyphTapsField;
  const clear = (m) => !!m && !!m.glyph && m.xShown && m.overflows && m.scrolled > 0
    && m.textStart >= m.glyph.r && m.textEnd <= m.x.l && m.value === LONG.length;
  const geomOf = async (boxId, xId) => {
    await setBox(boxId, LONG);
    await clickSel('#' + boxId);
    const m = await evalJs(GEOM(boxId, xId));
    await setBox(boxId, '');
    await evalJs("(function(){ var a = document.activeElement; if (a && a.blur) a.blur(); return 1; })()");
    return m;
  };

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

    /* ── WO-2.58 line 5, the registry's half: the ✕ in its search box ──
       Absent on an empty field and present with text; a tap empties the field, shows the whole list
       and leaves the field UNFOCUSED; Escape empties it. The tap is the element's own click() with
       the field focused — not a CDP mouse press, because a mouse press on a button moves focus to
       the button by itself and the "unfocused" half would pass on a build that never blurs. Safari
       on the iPad does not focus a tapped button, which is exactly the case where the blur is the
       only thing that puts the keyboard away. Escape is a real key at the page, typed into the box. */
    const CLEAR = (box, x) => `(function(){
      var b = document.getElementById(${JSON.stringify(box)}), x = document.getElementById(${JSON.stringify(x)});
      var a = document.activeElement;
      return { value: b ? b.value : null, xShown: !!x && !x.classList.contains('hidden')
                 && x.getClientRects().length > 0,
               xIsSibling: !!x && !!b && x.parentNode === b.parentNode,
               focused: a === b, active: a ? (a.id || a.tagName) : '' }; })()`;
    const attX = {};
    attX.empty = await evalJs(CLEAR('attendanceSearch', 'attendanceSearchClear'));
    await setBox('attendanceSearch', 'ma');
    attX.typed = await evalJs(CLEAR('attendanceSearch', 'attendanceSearchClear'));
    attX.typedRows = (await evalJs(REGISTRY)).length;
    await evalJs("(function(){ document.getElementById('attendanceSearch').focus();"
      + " document.getElementById('attendanceSearchClear').click(); return 1; })()");
    await new Promise(r => setTimeout(r, 150));
    attX.tapped = await evalJs(CLEAR('attendanceSearch', 'attendanceSearchClear'));
    attX.tappedRows = (await evalJs(REGISTRY)).length;
    await clickSel('#attendanceSearch');
    for (const c of 'bell') await skChar(c);
    attX.keyed = await evalJs(CLEAR('attendanceSearch', 'attendanceSearchClear'));
    attX.keyedRows = (await evalJs(REGISTRY)).length;
    await skEsc();
    attX.escaped = await evalJs(CLEAR('attendanceSearch', 'attendanceSearchClear'));
    attX.escapedRows = (await evalJs(REGISTRY)).length;
    await evalJs("(function(){ var a = document.activeElement; if (a && a.blur) a.blur(); return 1; })()");
    check('WO-2.58: the registry\'s search box draws no ✕ while empty and one beside the field once it holds text; a tap on it empties the field, brings back all six rows and leaves the field unfocused; Escape typed into the box empties it and brings them back too',
      attX.empty.value === '' && !attX.empty.xShown && attX.empty.xIsSibling
        && attX.typed.value === 'ma' && attX.typed.xShown && attX.typedRows === 3
        && attX.tapped.value === '' && !attX.tapped.xShown && attX.tappedRows === 6
        && !attX.tapped.focused
        && attX.keyed.value === 'bell' && attX.keyed.xShown && attX.keyedRows === 1
        && attX.escaped.value === '' && !attX.escaped.xShown && attX.escapedRows === 6,
      JSON.stringify(attX));
    /* WO-2.61, the registry's half, read here while the registry is on screen; checked below beside
       the grid's, so the two boxes are one verdict. */
    const geomFine = { attendance: await geomOf('attendanceSearch', 'attendanceSearchClear') };

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

    /* ── WO-2.58 line 5, the score grid's half: the same ✕, the same three behaviours ──
       Read the way the registry's was above, and for its reason: click() with the field focused, so
       "unfocused" is the build's blur and not a side effect of a mouse press on a button. The Escape
       above already proves the key on this box; it is asserted again here against the ✕'s state. */
    const scX = {};
    scX.escaped = await evalJs(CLEAR('scoresSearch', 'scoresSearchClear'));
    for (const c of 'ma') await skChar(c);
    scX.typed = await evalJs(CLEAR('scoresSearch', 'scoresSearchClear'));
    scX.typedRows = (await evalJs(GRID)).rows.length;
    await evalJs("(function(){ document.getElementById('scoresSearch').focus();"
      + " document.getElementById('scoresSearchClear').click(); return 1; })()");
    await new Promise(r => setTimeout(r, 150));
    scX.tapped = await evalJs(CLEAR('scoresSearch', 'scoresSearchClear'));
    const scAfterX = await evalJs(GRID);
    scX.tappedRows = scAfterX.rows.length;
    scX.found = scAfterX.found;
    check('WO-2.58: the score grid\'s search box draws no ✕ while empty (after the Escape above) and one beside the field once it holds text; a tap on it empties the field, brings back all six rows and the count line goes, and the field is left unfocused',
      scX.escaped.value === '' && !scX.escaped.xShown && scX.escaped.xIsSibling
        && scX.typed.value === 'ma' && scX.typed.xShown && scX.typedRows === 3
        && scX.tapped.value === '' && !scX.tapped.xShown && scX.tappedRows === 6
        && scX.found === '' && !scX.tapped.focused,
      JSON.stringify(scX));
    /* ── WO-2.61 lines 1 and 2, on a fine pointer, both screens ── */
    geomFine.scores = await geomOf('scoresSearch', 'scoresSearchClear');
    check('WO-2.61: on both screens the focused element is the bordered one — with the field focused by a press, the <input> matches :focus-visible and draws the ring, carries the border (every side) and the radius, the box around it draws no border and no padding and has exactly the field\'s rect, the 🔍 and the ✕ lie inside the field\'s rect, and a hit test at the 🔍\'s centre finds the field',
      bordered(geomFine.attendance) && bordered(geomFine.scores), JSON.stringify(geomFine));
    check('WO-2.61: typed text never runs under the glyph or the ✕ — with a string longer than the field, scrolled to its end, the field\'s text area starts right of the 🔍 and ends left of the ✕ on both screens',
      clear(geomFine.attendance) && clear(geomFine.scores),
      JSON.stringify(['attendance', 'scores'].map((k) => { const m = geomFine[k]; return m && { k: k,
        glyphRight: m.glyph && m.glyph.r, textStart: m.textStart, textEnd: m.textEnd, xLeft: m.x.l,
        scrolled: m.scrolled, overflows: m.overflows }; })));
    /* The section goes on to type into the box from where the caret was left; put it back there. */
    await clickSel('#scoresSearch');

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

    /* ════════════ WO-3.28 — the same grid narrowed to one category, and the two filters together ════════════
       This fixture is shared on purpose: WO-3.28 lands second, so it carries the checks for the
       combination (its own Deliverables say so), and a second class planted for them would be a
       second roster to keep in step with this one. The grid is back on its arrival state here — box
       empty, every row — after the WO-3.29 line-6 round trip just above. */
    const CATS = `(function(){
      var host = document.getElementById('scoresCategories');
      var pills = host ? Array.prototype.slice.call(host.querySelectorAll('[data-scores-category]')) : [];
      var wrap = document.getElementById('scoresGridWrap');
      var heads = Array.prototype.slice.call(document.querySelectorAll('#scoresHead th[data-score-col]'))
        .map(function(th){ return th.getAttribute('data-score-col'); });
      var cells = {};
      Array.prototype.slice.call(document.querySelectorAll('[data-score-cell]')).forEach(function(i){
        cells[i.getAttribute('data-score-cell')] = 1; });
      var catHead = document.querySelector('#scoresHead th.scores-cat-avg');
      var rows = Array.prototype.slice.call(document.querySelectorAll('#scoresBody tr[data-score-row]'));
      var summary = document.getElementById('scoresSummary');
      var catSum = summary ? summary.querySelector('[data-scores-cat-average]') : null;
      /* The summary with the category's own figure (and the separator before it) taken out — what
         is left is every whole-class figure on the line, compared as text with the pill off. */
      var rest = '';
      if (summary) {
        var clone = summary.cloneNode(true);
        var cs = clone.querySelector('[data-scores-cat-average]');
        if (cs) { if (cs.previousSibling) cs.previousSibling.remove(); cs.remove(); }
        rest = clone.textContent;
      }
      return {
        hostHidden: !host || host.classList.contains('hidden'),
        pills: pills.map(function(b){ return { id: b.getAttribute('data-scores-category'),
          label: b.textContent, pressed: b.getAttribute('aria-pressed'),
          active: b.classList.contains('active'), group: !!b.closest('[data-pill-group]') }; }),
        heads: heads, cellCols: Object.keys(cells).sort(),
        filtered: !!wrap && wrap.classList.contains('filtered'),
        catHead: catHead ? catHead.textContent.replace(/\\s+/g, ' ').trim() : '',
        /* The figure alone — the number line, or the em dash — since correction round 1 put a letter
           under it; the letter and where both lines sit are read separately, in catLines. */
        catCells: rows.map(function(r){ var c = r.querySelector('td.scores-cat-avg');
          var f = c ? (c.querySelector('.scores-grade-num') || c.querySelector('.scores-grade-none')) : null;
          return r.getAttribute('data-score-row') + '=' + (c ? (f ? f.textContent.trim() : '(empty)') : '(none)'); }),
        catLines: rows.map(function(r){
          var c = r.querySelector('td.scores-cat-avg'), g = r.querySelector('td.scores-grade');
          function top(e){ return e ? Math.round(e.getBoundingClientRect().top * 100) / 100 : null; }
          var cn = c ? c.querySelector('.scores-grade-num') : null, cl = c ? c.querySelector('.scores-grade-letter') : null;
          var gn = g ? g.querySelector('.scores-grade-num') : null, gl = g ? g.querySelector('.scores-grade-letter') : null;
          return { id: r.getAttribute('data-score-row'), none: !!(c && c.querySelector('.scores-grade-none')),
            letter: cl ? cl.textContent : null, letters: c ? c.querySelectorAll('.scores-grade-letter').length : 0,
            numTop: top(cn), letterTop: top(cl), gradeNumTop: top(gn), gradeLetterTop: top(gl),
            gradeLetter: gl ? gl.textContent : null }; }),
        rows: rows.map(function(r){ return r.getAttribute('data-score-row'); }),
        grades: rows.map(function(r){ return r.getAttribute('data-score-row') + '='
          + (r.querySelector('.scores-grade')||{}).textContent; }),
        catSum: catSum ? catSum.textContent.replace(/\\s+/g, ' ').trim() : '',
        catSumB: catSum ? (catSum.querySelector('b')||{}).textContent : '',
        catSumLetter: catSum ? catSum.querySelectorAll('.scores-grade-letter').length : -1,
        summaryRest: rest,
        summary: summary ? summary.textContent : '',
        headline: (document.getElementById('scoresHeadline')||{}).textContent || '',
        box: (document.getElementById('scoresSearch')||{}).value,
        said: (document.getElementById('srLive')||{}).textContent || ''
      }; })()`;
    const pick = async (id) => {
      await clickSel('#scoresCategories [data-scores-category="' + id + '"]');
      await new Promise(r => setTimeout(r, 150));
      return evalJs(CATS);
    };
    const ALL5 = ['wo329-a1', 'wo329-a2', 'wo329-a3', 'wo329-a4', 'wo329-a5'];

    const cAll = await evalJs(CATS);
    check('WO-3.28: the pills are All and then one per category with work in the open term, names only — Work and Quizzes, and no pill for Homework, which has no assignment, nor for the work filed under no category; All is pressed, the strip is not a data-pill-group, and every column is drawn',
      !cAll.hostHidden
        && JSON.stringify(cAll.pills.map((p) => p.id)) === JSON.stringify(['', 'wo329-cat', 'wo329-quiz'])
        && JSON.stringify(cAll.pills.map((p) => p.label)) === JSON.stringify(['All', 'Work', 'Quizzes'])
        && cAll.pills[0].pressed === 'true' && cAll.pills[0].active
        && cAll.pills.slice(1).every((p) => p.pressed === 'false' && !p.active)
        && cAll.pills.every((p) => !p.group)
        && JSON.stringify(cAll.heads) === JSON.stringify(ALL5) && !cAll.filtered && !cAll.catHead,
      JSON.stringify({ pills: cAll.pills, heads: cAll.heads, filtered: cAll.filtered }));

    /* ── WO-3.28 line 1: only the category's columns are in the DOM ── */
    const cQuiz = await pick('wo329-quiz');
    check('WO-3.28: with Quizzes picked, only its two columns are in the DOM — the head names exactly wo329-a2 and wo329-a4, no input anywhere on the page belongs to another assignment (the uncategorised one included), the third column\'s head names Quizzes, the box wears .filtered, and the pills moved aria-pressed with .active',
      JSON.stringify(cQuiz.heads) === JSON.stringify(['wo329-a2', 'wo329-a4'])
        && JSON.stringify(cQuiz.cellCols) === JSON.stringify(['wo329-a2', 'wo329-a4'])
        && /^Quizzes\s*average$/i.test(cQuiz.catHead) && cQuiz.filtered
        && cQuiz.pills.filter((p) => p.pressed === 'true').map((p) => p.id).join() === 'wo329-quiz'
        && cQuiz.pills.filter((p) => p.active).map((p) => p.id).join() === 'wo329-quiz'
        && /Quizzes only/.test(cQuiz.said),
      JSON.stringify({ heads: cQuiz.heads, cellCols: cQuiz.cellCols, catHead: cQuiz.catHead,
        filtered: cQuiz.filtered, pills: cQuiz.pills, said: cQuiz.said }));

    /* ── WO-3.28 line 2: every figure in the third column is the engine's ──
       The expected strings are computed IN THE PAGE from window.planbook.gradeEngine and formatted
       the way src/scores.js formats a percentage (two places), so this asks "is the column the
       engine's answer" and not "is it a number worked out here". The class figure is the mean of the
       same per-student answers over the students who have one. The fixture's quiz cells are chosen
       so that a pooled earned/possible across the class (66.00%), a mean that ignores the missing
       and excused marks, and the overall grade are all different numbers from these. */
    const engine = await evalJs(`(function(){
      var d = window.planbook.store.getDoc(), g = window.planbook.gradeEngine;
      var cls = d.classes.filter(function(c){ return c.id === 'c_wo329'; })[0];
      var ids = ['wo329-s3','wo329-s2','wo329-s1','wo329-s5','wo329-s4','wo329-s6'];
      var per = {}, figs = [];
      ids.forEach(function(id){
        var p = g.categoryPercentage(d, cls, 'tm_wo329', 'wo329-quiz', id);
        per[id] = p === null ? '—' : Number(p).toFixed(2) + '%';
        if (p !== null) figs.push(p); });
      var mean = figs.length ? figs.reduce(function(a, b){ return a + b; }, 0) / figs.length : null;
      return { per: per, mean: mean === null ? '—' : mean.toFixed(2) + '%', n: figs.length }; })()`);
    const shownPer = {};
    cQuiz.catCells.forEach((c) => { const i = c.indexOf('='); shownPer[c.slice(0, i)] = c.slice(i + 1); });
    const perOk = cQuiz.rows.length === 6 && cQuiz.rows.every((id) => shownPer[id] === engine.per[id]);
    check('WO-3.28: the third column\'s figure for every student equals categoryPercentage() for that student and category (Reed, with no quiz graded, gets the em dash), and the summary\'s Quizzes average is those figures averaged over the five students who have one',
      perOk && engine.n === 5 && engine.per['wo329-s4'] === '—'
        && cQuiz.catSumB === engine.mean && /^Quizzes average/.test(cQuiz.catSum)
        && engine.mean !== '66.00%',
      'shown ' + JSON.stringify(shownPer) + ' · engine ' + JSON.stringify(engine.per)
        + ' · summary ' + JSON.stringify(cQuiz.catSum) + ' against the engine mean ' + engine.mean);

    /* ── WO-3.28, correction round 1: each student's category figure carries ITS OWN letter ──
       The owner's ruling at the 👤 reading: the letter letterFromPercentage() gives for the category
       figure, under it, on the overall letter's line — and the em dash with no letter where there is
       no figure, and no letter on the summary's class figure. The expected letters are the engine's,
       asked in the page for the same figures the column shows. The fixture makes a letter carried
       across from the overall grade a different letter in at least one row (asserted below, so the
       check cannot pass because the two bandings happen to agree). */
    const lettersExpected = await evalJs(`(function(){
      var d = window.planbook.store.getDoc(), g = window.planbook.gradeEngine;
      var cls = d.classes.filter(function(c){ return c.id === 'c_wo329'; })[0];
      var out = {};
      ['wo329-s3','wo329-s2','wo329-s1','wo329-s5','wo329-s4','wo329-s6'].forEach(function(id){
        var p = g.categoryPercentage(d, cls, 'tm_wo329', 'wo329-quiz', id);
        var o = g.classGrade(d, cls, 'tm_wo329', id);
        out[id] = { cat: p === null ? null : g.letterFromPercentage(d, cls, p), overall: o.letter }; });
      return out; })()`);
    const lineBad = cQuiz.catLines.filter((r) => {
      const want = lettersExpected[r.id] || {};
      if (want.cat === null) return !(r.none && r.letters === 0 && r.numTop === null);
      return r.none || r.letters !== 1 || r.letter !== want.cat
        || r.numTop === null || r.gradeNumTop === null || Math.abs(r.numTop - r.gradeNumTop) > 0.5
        || r.letterTop === null || r.gradeLetterTop === null || Math.abs(r.letterTop - r.gradeLetterTop) > 0.5
        || !(r.letterTop > r.numTop);
    });
    const lettersDiffer = Object.keys(lettersExpected).filter((id) => lettersExpected[id].cat !== null
      && lettersExpected[id].cat !== lettersExpected[id].overall).length;
    check('WO-3.28: with Quizzes picked, each student\'s category figure has the letter letterFromPercentage() gives for THAT figure, on its own line under the number — the number on the overall grade number\'s line and the letter on the overall letter\'s line, in every row — Reed, with no figure, shows the em dash and no letter, and the summary\'s Quizzes average carries no letter (correction round 1)',
      cQuiz.catLines.length === 6 && lineBad.length === 0 && lettersDiffer >= 1
        && cQuiz.catSum === 'Quizzes average ' + engine.mean && cQuiz.catSumLetter === 0,
      'rows ' + JSON.stringify(cQuiz.catLines) + ' · expected ' + JSON.stringify(lettersExpected)
        + ' · rows where the category letter is not the overall one: ' + lettersDiffer
        + ' · summary ' + JSON.stringify(cQuiz.catSum)
        + (lineBad.length ? ' · WRONG: ' + JSON.stringify(lineBad) : ''));

    /* ── WO-3.28 line 4: the filter moves no whole-class figure ── */
    const gradeMap = (snap) => { const m = {}; snap.grades.forEach((g) => { const i = g.indexOf('=');
      m[g.slice(0, i)] = g.slice(i + 1); }); return m; };
    check('WO-3.28: the class average, the blank count, the weights total, the headline and every overall grade are byte-identical with Quizzes picked and with All — the summary compared as text with only the category\'s own figure taken out',
      cQuiz.summaryRest === cAll.summary && cQuiz.headline === cAll.headline
        && JSON.stringify(gradeMap(cQuiz)) === JSON.stringify(gradeMap(cAll))
        && /Class average/.test(cAll.summary) && /blank/.test(cAll.summary)
        && Object.keys(gradeMap(cAll)).length === 6 && cAll.summary.indexOf('Quizzes') < 0,
      'All: ' + JSON.stringify(cAll.summary) + ' · Quizzes, less its own figure: '
        + JSON.stringify(cQuiz.summaryRest) + ' · grades ' + JSON.stringify(gradeMap(cQuiz)));

    /* ── WO-3.28 line 1's keyboard half: →, Tab and Enter stop at the last SHOWN column and row ──
       Grid order is Bell, Castillo, Johnson, Quinn, Reed, Shah. The caret is put on a cell by script
       with its value selected (the state every keyboard arrival leaves), and every move after that is
       a real key at the page. Tab is the browser's own and src/scores.js does not bind it, so what is
       asserted for Tab is where the browser can put the caret when only the shown columns exist. */
    const qCell = (a, st) => '#scoresBody [data-score-cell="' + a + '"][data-score-student="' + st + '"]';
    const where = `(function(){ var a = document.activeElement;
      return a ? { col: a.getAttribute('data-score-cell') || '', student: a.getAttribute('data-score-student') || '',
        door: a.getAttribute('data-student-detail') || '', id: a.id || '', tag: a.tagName } : null; })()`;
    const putOn = (a, st) => evalJs('(function(){ var e = document.querySelector(' + JSON.stringify(qCell(a, st))
      + '); if (!e) return 0; e.focus(); e.select(); return 1; })()');
    const listen = async (press) => {
      await evalJs("(function(){ var e = document.getElementById('srLive'); if (e) e.textContent = '·'; return 1; })()");
      await press();
      let said = '·';
      for (let i = 0; i < 20 && said === '·'; i++) {
        await new Promise(r => setTimeout(r, 25));
        said = await evalJs("(document.getElementById('srLive')||{}).textContent || ''");
      }
      return { at: await evalJs(where), said: said === '·' ? '' : said };
    };
    const skRight = () => sk('ArrowRight', 'ArrowRight', 39);
    const skTab = () => sk('Tab', 'Tab', 9);
    const placed = await putOn('wo329-a2', 'wo329-s3');
    const r1 = await listen(skRight);
    const r2 = await listen(skRight);
    const t1 = await listen(skTab);
    const t1b = await listen(skTab);
    /* THE LAST ROW'S END IS READ, NOT TABBED OFF. A real Tab from the grid's very last field leaves
       the page altogether in this headless browser — nothing focusable follows the grid — and a page
       that has lost focus that way does not get it back on the reloads that follow: the date-field
       section two sections on (verify/date-zero-key.mjs) then finds its three ArrowLefts no longer
       walking the caret home, and types a September date into the day and the year. Found by this
       work order's own full run, on 2026-10-02. So the end of the last shown row is asserted in
       document order instead, which is the order Tab walks: the last score field in the whole page
       is Shah's second quiz, so Tab from it has no score field left to land in. */
    const t2 = await evalJs(`(function(){
      var all = document.querySelectorAll('[data-score-cell]'), last = all[all.length - 1];
      return { at: last ? { col: last.getAttribute('data-score-cell'),
        student: last.getAttribute('data-score-student') } : null, count: all.length }; })()`);
    await putOn('wo329-a4', 'wo329-s4');
    const n1 = await listen(skEnter);
    const n2 = await listen(skEnter);
    check('WO-3.28: with Quizzes picked, → walks Bell\'s row from the first quiz to the second and stops there saying "that is the last assignment"; Tab from that last shown column goes on to the next row — Castillo\'s name, the door every row starts with — and the Tab after that to Castillo\'s first quiz, that row\'s first shown cell, never an essay or the loose sheet; and the last score field in document order — the order Tab walks — is Shah\'s second quiz, the last shown row\'s last shown column, so Tab from it has no score field left to land in; Enter down the second quiz goes Reed → Shah and stops on Shah saying "that is the last student"',
      placed === 1
        && !!r1.at && r1.at.col === 'wo329-a4' && r1.at.student === 'wo329-s3'
        && !!r2.at && r2.at.col === 'wo329-a4' && r2.at.student === 'wo329-s3' && /last assignment/.test(r2.said)
        && !!t1.at && t1.at.col === '' && t1.at.door === 'wo329-s2'
        && !!t1b.at && t1b.at.col === 'wo329-a2' && t1b.at.student === 'wo329-s2'
        && !!t2.at && t2.at.col === 'wo329-a4' && t2.at.student === 'wo329-s6' && t2.count === 12
        && !!n1.at && n1.at.col === 'wo329-a4' && n1.at.student === 'wo329-s6'
        && !!n2.at && n2.at.col === 'wo329-a4' && n2.at.student === 'wo329-s6' && /last student/.test(n2.said),
      JSON.stringify({ r1, r2, t1, t1b, t2, n1, n2 }));

    /* ── WO-3.28 line 5: a name typed and a category picked, together, and each one cleared ── */
    await setBox('scoresSearch', 'ma');
    const both = await evalJs(CATS);
    await setBox('scoresSearch', '');
    const searchCleared = await evalJs(CATS);
    await setBox('scoresSearch', 'ma');
    const pillCleared = await pick('');
    const swapped = await pick('wo329-cat');
    const MA = JSON.stringify(['wo329-s3', 'wo329-s1', 'wo329-s4']);
    check('WO-3.28: "ma" with Quizzes picked shows exactly Bell, Johnson and Reed and exactly the two quiz columns, with the third column; emptying the box brings back all six rows and keeps the quiz columns; picking All with "ma" still typed brings back all five columns and keeps the three rows; and picking Work with "ma" typed narrows to the two essays, the rows untouched',
      JSON.stringify(both.rows) === MA && JSON.stringify(both.heads) === JSON.stringify(['wo329-a2', 'wo329-a4'])
        && both.filtered && /Quizzes/.test(both.catHead) && both.catCells.length === 3
        && searchCleared.rows.length === 6 && searchCleared.box === ''
        && JSON.stringify(searchCleared.heads) === JSON.stringify(['wo329-a2', 'wo329-a4']) && searchCleared.filtered
        && JSON.stringify(pillCleared.rows) === MA && pillCleared.box === 'ma'
        && JSON.stringify(pillCleared.heads) === JSON.stringify(ALL5) && !pillCleared.filtered && !pillCleared.catHead
        && JSON.stringify(swapped.rows) === MA && JSON.stringify(swapped.heads) === JSON.stringify(['wo329-a1', 'wo329-a3'])
        && /^Work\s*average$/i.test(swapped.catHead),
      JSON.stringify({ both: [both.rows, both.heads], searchCleared: [searchCleared.rows.length, searchCleared.heads],
        pillCleared: [pillCleared.rows, pillCleared.heads, pillCleared.box], swapped: [swapped.rows, swapped.heads, swapped.catHead] }));

    /* ── WO-3.28 line 6: leave with Work picked and "ma" typed, come back to All; nothing stored ── */
    await clickSel('#scoresView [data-class-screen="class"]');
    await new Promise(r => setTimeout(r, 200));
    await clickSel('#classView [data-class-screen="scores"]');
    await new Promise(r => setTimeout(r, 300));
    const cBack = await evalJs(CATS);
    const storeAfterPills = await readLocalStore(evalJs, 400);
    check('WO-3.28: leaving the grid with Work picked for Attendance and coming back shows All pressed, every column, no third column and an unfiltered box — and no planbook_ key was written or changed by any pill tap above',
      cBack.pills.length === 3 && cBack.pills[0].pressed === 'true'
        && cBack.pills.filter((p) => p.pressed === 'true').length === 1
        && JSON.stringify(cBack.heads) === JSON.stringify(ALL5) && !cBack.filtered && !cBack.catHead
        && cBack.rows.length === 6 && ours(storeBefore) === ours(storeAfterPills)
        && !Object.keys(storeAfterPills).some((k) => /categor|filter/i.test(k)
          || /wo329-(cat|quiz)/.test(String(storeAfterPills[k]))),
      JSON.stringify({ pills: cBack.pills.map((p) => p.id + ':' + p.pressed), heads: cBack.heads,
        filtered: cBack.filtered }) + '; planbook_ keys '
        + (ours(storeBefore) === ours(storeAfterPills) ? 'unchanged' : 'CHANGED: ' + ours(storeAfterPills)));

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
    /* WO-2.58 line 5's last clause, on both screens: the ✕ is at least 44px under the coarse pointer,
       measured with text in the box (it is not drawn without), and a real press at its centre is
       what clears the box — so the 44px is a target the hit test actually lands on, not a box drawn
       around a smaller one. The glyph's disc is measured beside it, because "small glyph" is the
       other half of the ruling. */
    const X44 = (box, x) => `(function(){
      var b = document.getElementById(${JSON.stringify(box)}), e = document.getElementById(${JSON.stringify(x)});
      if (!e) return null; var r = e.getBoundingClientRect(), cs = getComputedStyle(e);
      var disc = r.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      return { w: r.width, h: r.height, disc: disc, clip: cs.backgroundClip, value: b ? b.value : null,
               display: cs.display }; })()`;
    /* WO-2.61 under the coarse pointer: the registry's box read now, while it is on screen. */
    const geomCoarse = { attendance: await geomOf('attendanceSearch', 'attendanceSearchClear') };
    const xSizes = {};
    await setBox('attendanceSearch', 'ma');
    xSizes.attendance = await evalJs(X44('attendanceSearch', 'attendanceSearchClear'));
    await clickSel('#attendanceSearchClear');
    xSizes.attendanceAfterPress = await evalJs("document.getElementById('attendanceSearch').value");
    await clickSel('#classView [data-class-screen="scores"]');
    await new Promise(r => setTimeout(r, 300));
    await setBox('scoresSearch', 'ma');
    xSizes.scores = await evalJs(X44('scoresSearch', 'scoresSearchClear'));
    await clickSel('#scoresSearchClear');
    xSizes.scoresAfterPress = await evalJs("document.getElementById('scoresSearch').value");
    const x44 = (m) => !!m && m.display !== 'none' && m.w >= 44 && m.h >= 44 && m.disc <= 24
      && m.clip === 'content-box';
    check('WO-2.58: under the coarse pointer the ✕ in both search boxes — the registry\'s and the score grid\'s — is a target of at least 44px around a disc of no more than 24, and a real press at its centre clears the box',
      coarse === true && x44(xSizes.attendance) && x44(xSizes.scores)
        && xSizes.attendanceAfterPress === '' && xSizes.scoresAfterPress === '',
      'coarse = ' + coarse + ' · ' + JSON.stringify(xSizes));
    const box = await evalJs(`(function(){ var b = document.getElementById('scoresSearch');
      if (!b) return null; var r = b.getBoundingClientRect();
      return { w: r.width, h: r.height, display: getComputedStyle(b).display,
               viewHidden: document.getElementById('scoresView').classList.contains('hidden') }; })()`);
    check('the score grid\'s search box measures at least 44px tall and 44px wide under the coarse pointer, on the open grid',
      coarse === true && !!box && !box.viewHidden && box.display !== 'none' && box.h >= 44 && box.w >= 44,
      'coarse = ' + coarse + ' · ' + JSON.stringify(box));
    /* WO-2.61 lines 1–3 under the coarse pointer, both screens: the same two verdicts as on the fine
       pointer, now with the ✕ at its 44px square (whose whole box, not its disc, must lie inside the
       field and right of the text), and the field — the bordered thing — at least 44px tall on each. */
    geomCoarse.scores = await geomOf('scoresSearch', 'scoresSearchClear');
    check('WO-2.61: under the coarse pointer, on both screens, the focused field is the bordered box with the 🔍 and the ✕\'s 44px square inside it, typed text clears both, and the field is at least 44px tall',
      coarse === true && ['attendance', 'scores'].every((k) => bordered(geomCoarse[k]) && clear(geomCoarse[k])
        && geomCoarse[k].field.h >= 44 && geomCoarse[k].x.w >= 44 && geomCoarse[k].x.h >= 44),
      'coarse = ' + coarse + ' · ' + JSON.stringify(geomCoarse));
    /* WO-3.28 line 7: the category pills, every one of them, measured on the open grid. */
    const pills44 = await evalJs(`(function(){
      return Array.prototype.slice.call(document.querySelectorAll('#scoresCategories [data-scores-category]'))
        .map(function(b){ var r = b.getBoundingClientRect();
          return { label: b.textContent, w: Math.round(r.width * 100) / 100, h: Math.round(r.height * 100) / 100,
            display: getComputedStyle(b).display }; }); })()`);
    check('WO-3.28: every category pill on the open score grid — All, Work and Quizzes — measures at least 44px tall and 44px wide under the coarse pointer',
      coarse === true && pills44.length === 3
        && pills44.every((p) => p.display !== 'none' && p.h >= 44 && p.w >= 44),
      'coarse = ' + coarse + ' · ' + JSON.stringify(pills44));

    /* ── WO-3.28 correction round 1: every frozen column holds its declared width, whatever is in it ──

       THE DEFECT THIS EXISTS FOR WAS SEEN ON THE iPAD AND NOWHERE ELSE (2026-10-02, v150): the
       category average drifted a few pixels with a horizontal scroll before it stuck, while the name
       and grade held. A sticky column only holds still from the first pixel if its NATURAL position —
       the sum of the rendered widths to its left — is already its sticky `left`. In an auto-layout
       table a cell's `width` is a floor and not a size, so a column whose contents are wider than the
       declared number pushes everything after it right, and the next frozen column then travels the
       difference before it sticks. Whether that happens depended on the font: iPadOS draws the app's
       figures in a wider face than this headless Edge.

       So this check plants the widest things each frozen column can be asked to hold — 100.00% and its
       letter in both the grade and the category average, a category name far longer than any head,
       and a surname longer than the name column — and then, on the real drawn grid, asks every frozen
       cell in every row (head included) two things at scrollLeft 0 and again at full right scroll:
       is its left edge, measured from the box, exactly its computed sticky `left`; and is its rendered
       width exactly its declared `min-width`. Both pointers, at the iPad's portrait width for the
       coarse one. A column allowed to grow past its declared width goes red here, in Edge's font:
       the planted surname and category name are wider than any face can fit, and for the one column
       whose widest figure DOES fit this face — the grade's 100.00% — a third arm widens the face
       itself. That is what makes the check independent of the font the desk happens to have.
       MUTATION-PROVED in TESTING.md § WO-3.28, correction round 1. */
    const FROZEN = `(function(){
      var wrap = document.getElementById('scoresGridWrap');
      if (!wrap) return null;
      var max = wrap.scrollWidth - wrap.clientWidth;
      function read(at){
        wrap.scrollLeft = at;
        var b = wrap.getBoundingClientRect(), x0 = b.left + wrap.clientLeft;
        var bad = [], n = 0;
        Array.prototype.slice.call(wrap.querySelectorAll('tr')).forEach(function(tr){
          Array.prototype.slice.call(tr.querySelectorAll('.scores-name, .scores-grade, .scores-cat-avg'))
            .forEach(function(c){
              if (c.parentElement !== tr) return;
              n += 1;
              var r = c.getBoundingClientRect(), cs = getComputedStyle(c);
              var off = Math.round((r.left - x0) * 100) / 100, w = Math.round(r.width * 100) / 100;
              var stickAt = parseFloat(cs.left), decl = parseFloat(cs.minWidth);
              if (Math.abs(off - stickAt) > 0.5 || Math.abs(w - decl) > 0.5) {
                bad.push({ row: tr.getAttribute('data-score-row') || 'head', cls: c.className,
                  off: off, left: stickAt, w: w, declared: decl });
              }
            });
        });
        return { at: wrap.scrollLeft, cells: n, bad: bad };
      }
      var out = { max: max, zero: read(0), full: read(max) };
      wrap.scrollLeft = 0;
      return out; })()`;
    /* THE WIDEST FIGURES, planted for this check and for nothing after it: the fixture is taken back
       out at the foot of this section. Shah gets full marks on every assignment, so both the overall
       grade and the Quizzes average read 100.00% with the top band's letter; six more quizzes make the
       picked category wide enough to scroll at the iPad's portrait width; and Quizzes and Shah get
       names no column could fit in any face. */
    const LONG_CAT = 'Quizzes, tests and every in-class assessment';
    await evalJs(`(function(){
      var s = window.planbook.store;
      s.update(function(doc){
        var cls = doc.classes.filter(function(c){ return c.id === 'c_wo329'; })[0];
        cls.categories.forEach(function(c){ if (c.id === 'wo329-quiz') c.name = ${JSON.stringify(LONG_CAT)}; });
        doc.students.forEach(function(p){ if (p.id === 'wo329-s6') p.last = 'Shah-Vandersloot-Okonkwo-Fitzgerald'; });
        for (var i = 6; i <= 11; i++) {
          doc.assignments.push({ id:'wo329-a' + i, classId:'c_wo329', termId:'tm_wo329',
            categoryId:'wo329-quiz', name:'Quiz ' + i, points:10, assigned:'', due:'' });
        }
        var full = { 'wo329-a1':100, 'wo329-a2':20, 'wo329-a3':50, 'wo329-a4':10, 'wo329-a5':10 };
        for (var j = 6; j <= 11; j++) full['wo329-a' + j] = 10;
        Object.keys(full).forEach(function(a){
          doc.scores[a] = doc.scores[a] || {};
          doc.scores[a]['wo329-s6'] = { v: full[a] }; });
      });
      return 1; })()`);
    await evalJs('window.planbook.store.flush()');
    const widest = async () => {
      await pick('wo329-quiz');
      const shah = await evalJs(`(function(){
        var r = document.querySelector('#scoresBody tr[data-score-row="wo329-s6"]');
        var h = document.querySelector('#scoresHead th.scores-cat-avg .scores-cat-avg-name');
        /* How wide this face draws "100.00%" against the room the grade cell's padding leaves it —
           reported, not asserted: it is the headroom the iPad's wider face used up. */
        var n = r ? r.querySelector('.scores-grade .scores-grade-num') : null, g = n ? n.parentElement : null;
        var ink = null, room = null;
        if (n && n.firstChild) { var rg = document.createRange(); rg.selectNodeContents(n);
          ink = Math.round(rg.getBoundingClientRect().width * 100) / 100;
          var cs = getComputedStyle(g);
          room = Math.round((g.getBoundingClientRect().width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
            - parseFloat(cs.borderLeftWidth) - parseFloat(cs.borderRightWidth)) * 100) / 100; }
        return { grade: n ? n.textContent : '',
          cat: r ? (r.querySelector('.scores-cat-avg .scores-grade-num')||{}).textContent : '',
          head: h ? h.textContent : '', gradeInk: ink, gradeRoom: room }; })()`);
      const m = await evalJs(FROZEN);
      await pick('');
      return { shah, m };
    };
    await send('Emulation.setDeviceMetricsOverride',
      { width: 768, height: 1024, deviceScaleFactor: 2, mobile: true });
    await new Promise(r => setTimeout(r, 300));
    const wc = await widest();
    /* AND IN A WIDER FACE THAN THIS DESK HAS. "100.00%" fits the grade cell in Edge's Segoe UI with a
       few pixels to spare (gradeInk against gradeRoom in the detail above), which is exactly why the
       defect never showed here: no figure the app can draw overflows the GRADE column in this face,
       so the native arms above can only catch the name and the category average growing. This arm
       stands in for iPadOS's wider face by widening every glyph in the grid — letter-spacing, injected
       for the length of one reading and taken out again — so the grade column is asked to hold more
       than it has room for too, and a grade column allowed to grow goes red here. */
    await evalJs(`(function(){ var st = document.createElement('style'); st.id = 'wo328WideFace';
      st.textContent = '.scores-grid, .scores-grid * { letter-spacing: 4px !important; }';
      document.head.appendChild(st); return 1; })()`);
    const wcWide = await widest();
    await evalJs("(function(){ var st = document.getElementById('wo328WideFace'); if (st) st.remove(); return 1; })()");
    await send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await send('Emulation.setDeviceMetricsOverride',
      { width: 1024, height: 768, deviceScaleFactor: 1, mobile: false });
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 700));
    await waitForBoot();
    await evalJs(KILL_ANIM);
    await evalJs(INSTALL_WALKER);
    const fineNow = await evalJs("matchMedia('(pointer: fine)').matches");
    await clickSel('#classTabBar [data-class-tab="c_wo329"]');
    await new Promise(r => setTimeout(r, 250));
    await clickSel('#classView [data-class-screen="scores"]');
    await new Promise(r => setTimeout(r, 300));
    const wf = await widest();
    const holds = (w) => !!w.m && w.m.max > 0 && w.m.full.at > 0
      && w.m.zero.cells >= 21 && w.m.full.cells === w.m.zero.cells
      && w.m.zero.bad.length === 0 && w.m.full.bad.length === 0
      && w.shah.grade === '100.00%' && w.shah.cat === '100.00%' && w.shah.head === LONG_CAT;
    check('WO-3.28: with the widest figures planted — 100.00% in the grade and the category average, a category name no head can fit, a surname no name column can fit — every frozen cell in every row, head included, sits exactly at its sticky left and is exactly its declared width, at scrollLeft 0 and again at full right scroll — coarse pointer at the iPad\'s portrait 768 (correction round 1)',
      coarse === true && holds(wc), JSON.stringify(wc));
    check('WO-3.28: and the same again on the coarse pointer with every glyph in the grid widened by 4px — a face wider than this desk\'s, in which "100.00%" no longer fits the grade cell\'s room — so the grade column is held to its width too, not only the two columns this face happens to overflow (correction round 1)',
      coarse === true && holds(wcWide) && wcWide.shah.gradeInk > wcWide.shah.gradeRoom,
      JSON.stringify(wcWide));
    check('WO-3.28: and the same with the fine pointer at 1024 — no frozen column grows past its declared width, so none travels before it sticks (correction round 1)',
      fineNow === true && holds(wf), JSON.stringify(wf));

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
