/* categories-weights.mjs — categories & weights (WO-3.1)
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

import { INSTALL_CLASS_READER } from './classes-terms.mjs';

export async function run(h) {
const { check, skip, send, evalJs, clickSel, KILL_ANIM, INSTALL_WALKER, waitForBoot, seam,
  classesBooted, classSeam } = h;

/* ───────────────── categories & weights (WO-3.1) ─────────────────
 *
 * The four acceptance lines of WO-3.1, as far as they can honestly be driven — and two of them
 * cannot be driven all the way here, which is stated rather than papered over. There is no grade
 * engine (WO-3.4), no assignments UI (WO-3.3) and no score grid (WO-3.5), so nothing in this app
 * renders a percentage for a student. What exists to be measured is the CATEGORIES: the total, the
 * warning that names it, the provisional verdict the later screens will read, and the fact that
 * two classes cannot interfere.
 *
 * Everything is driven through the controls a teacher touches — the Categories button on a manager
 * row, the real name and weight fields, the real Remove and its real confirm. The
 * window.planbook.categories seam is used only to READ, and specifically to read weightTotal() and
 * isProvisional(): a check that summed the weights itself would go green against a build where the
 * banner does its own arithmetic and the export WO-3.4 is going to consume says something else.
 *
 * What is NOT here and is owed to a human: a thumb on a 58px numeric field, whether iPadOS offers
 * the numeric keypad for `type="number"`, and whether the amber line is legible on a projector at
 * the back of a room. The touch section below measures the boxes; it cannot press them.
 */

console.log('\n--- categories & weights ---');

const catSeam = await evalJs("!!(window.planbook && window.planbook.categories"
  + " && typeof window.planbook.categories.weightTotal === 'function'"
  + " && typeof window.planbook.categories.isProvisional === 'function')");

if (!classesBooted || !classSeam || !catSeam) {
  skip('categories & weights: the starter set, the total that names itself, per-class isolation, and a removal that counts',
    classesBooted
      ? 'no window.planbook.categories seam on the page — it is kept deliberately for this file to read the weight arithmetic through, so its absence is a defect and not a stage of the build'
      : 'the app did not boot before this section');
} else {
  /* Everything this section reads off the SCREEN, in one page-side helper, so a check is one round
     trip and the reads cannot drift between checks. The document side is window.__cls() above,
     which already carries the per-class category names, weights, ids and totals. */
  const INSTALL_CAT_READER = `(function(){
    window.__cat = function(){
      var modal = document.getElementById('categoriesModal');
      var total = document.getElementById('categoryTotal');
      var list = document.getElementById('categoryList');
      var rows = Array.prototype.slice.call(list.querySelectorAll('.category-row'));
      return {
        open: !!modal && !modal.classList.contains('hidden'),
        stacked: !document.getElementById('classesModal').classList.contains('hidden'),
        className: (document.getElementById('categoriesClassName')||{}).textContent,
        names: rows.map(function(r){ return r.querySelector('.category-name-input').value; }),
        weights: rows.map(function(r){ return r.querySelector('.category-weight').value; }),
        ids: rows.map(function(r){ return r.querySelector('.category-name-input').getAttribute('data-category-id'); }),
        upDisabled: rows.map(function(r){ return r.querySelector('[data-category-move-up]').disabled; }),
        downDisabled: rows.map(function(r){ return r.querySelector('[data-category-move-down]').disabled; }),
        /* A category name is teacher-typed; one of them below is given markup on purpose. */
        injected: list.querySelectorAll('b, script, i').length,
        rowChildren: rows.reduce(function(n, r){ return n + r.querySelectorAll('b, script, i').length; }, 0),
        total: total ? total.textContent : '',
        warn: !!(total && total.classList.contains('warn')),
        error: (document.getElementById('categoryError')||{}).textContent,
        empty: !!list.querySelector('.class-empty'),
        confirmOpen: !document.getElementById('categoryRemoveModal').classList.contains('hidden'),
        confirmLead: (document.getElementById('categoryRemoveLead')||{}).textContent,
        confirmFacts: (document.getElementById('categoryRemoveFacts')||{}).textContent.replace(/\\s+/g,' '),
        confirmButton: (document.getElementById('categoryRemoveBtn')||{}).textContent
      };
    }; return 1; })()`;
  await evalJs(INSTALL_CAT_READER);

  /* Typing a weight, through the real field and the real delegated listener: setting `.value` and
     dispatching `input` is the path a keystroke takes, and shell.js reads the element rather than
     the event's provenance. Weights are set by INDEX because that is what a teacher does — the
     third row down — and the row order is itself asserted below. */
  const typeWeights = async (values) => {
    await evalJs(`(function(){ var rows = document.querySelectorAll('#categoryList .category-row');
      var want = ${JSON.stringify(values)};
      for (var i = 0; i < want.length && i < rows.length; i++) {
        if (want[i] === null) continue;
        var f = rows[i].querySelector('.category-weight');
        f.value = String(want[i]); f.dispatchEvent(new Event('input', { bubbles:true }));
      }
      return 1; })()`);
    await new Promise(r => setTimeout(r, 120));
  };
  const rowClassId = async (n) => await evalJs(
    `(function(){ var r = document.querySelectorAll('#classList .class-row')[${n - 1}];
      var b = r && r.querySelector('[data-category-manage]');
      return b ? b.getAttribute('data-category-manage') : ''; })()`);

  await clickSel('header [data-class-manage]');

  /*
    Row 1 is the class the backup section restored — written by a build older than this work order,
    so its `categories` key is absent entirely rather than empty. The editor has to survive that
    rather than throw on `cls.categories.length`, and the total line's answer has to be a sentence
    about there being nothing to weight rather than a confident "0%".
  */
  const bareId = await rowClassId(1);
  await clickSel('#classList .class-row:nth-child(1) [data-category-manage]');
  const bare = await evalJs('window.__cat()');
  const bareDoc = await evalJs('window.__cls()');
  check('a class stored with no categories at all opens the editor, says so, and does not print a total it cannot have',
    bare.open && bare.stacked && bare.empty && bare.names.length === 0 && bare.warn
      && /No categories yet/.test(bare.total) && !/0%/.test(bare.total)
      && bareDoc.provisional[bareDoc.ids.indexOf(bareId)] === true,
    JSON.stringify({ rows: bare.names.length, warn: bare.warn, total: bare.total }));
  /* And the manager row behind it says the same thing in a badge, which is the half of "visible,
     persistent" that is not inside the panel a teacher has to open to see it. */
  check('and the manager row behind it carries the warning too, in words rather than only in colour',
    bareDoc.rowWarnings[0] === 'no categories',
    'row badges = ' + JSON.stringify(bareDoc.rowWarnings));

  await clickSel('#categoriesModal [data-modal-close]');

  /*
    ACCEPTANCE LINE 1, driven on a class that arrived with the starter set: 40/35/25 produces no
    warning, and 40/35/20 warns and shows 95%.

    The fourth starter category is removed first, and that removal is itself the "nothing is filed
    under it" branch — no confirm, no dialog, gone on the tap. Three categories is what the
    acceptance line names, and getting to three through the real control is cheaper than a fixture.
  */
  const workingId = await rowClassId(2);
  await clickSel('#classList .class-row:nth-child(2) [data-category-manage]');
  const seeded = await evalJs('window.__cat()');
  const seededDoc = await evalJs('window.__cls()');
  const workingAt = seededDoc.ids.indexOf(workingId);
  check('a class created through the form arrives with a starter set that already totals 100, and no warning',
    seeded.open && seeded.names.length === 4 && !seeded.warn
      && /100%/.test(seeded.total) && !/⚠/.test(seeded.total)
      && seededDoc.weightTotals[workingAt] === 100
      && seededDoc.provisional[workingAt] === false
      && seededDoc.rowWarnings[1] === '',
    JSON.stringify(seeded.names) + ' at ' + JSON.stringify(seeded.weights)
      + ' :: ' + JSON.stringify(seeded.total));

  await clickSel('#categoryList .category-row:nth-child(4) [data-category-remove]');
  const dropped = await evalJs('window.__cat()');
  check('removing a category with nothing filed under it takes one tap and opens no dialog',
    dropped.names.length === 3 && !dropped.confirmOpen
      && JSON.stringify(dropped.names) === JSON.stringify(seeded.names.slice(0, 3)),
    JSON.stringify(dropped.names) + ', confirm opened = ' + dropped.confirmOpen);

  await typeWeights([40, 35, 25]);
  const balanced = await evalJs('window.__cat()');
  const balancedDoc = await evalJs('window.__cls()');
  check('weights of 40/35/25 produce no warning at all',
    !balanced.warn && /100%/.test(balanced.total) && !/⚠/.test(balanced.total)
      && balancedDoc.weightTotals[workingAt] === 100
      && balancedDoc.provisional[workingAt] === false
      && balancedDoc.rowWarnings[1] === '',
    JSON.stringify(balanced.weights) + ' :: ' + JSON.stringify(balanced.total)
      + ', row badge = ' + JSON.stringify(balancedDoc.rowWarnings[1]));

  await typeWeights([null, null, 20]);
  const short = await evalJs('window.__cat()');
  const shortDoc = await evalJs('window.__cls()');
  /* The number, not the verdict: "shows 95%" is the acceptance line, and a banner reading "these
     weights are invalid" would satisfy every other clause here. Asserted as a substring of the
     line the teacher reads, and the row badge is asserted to carry the same figure — two surfaces,
     one arithmetic. */
  check('and 40/35/20 warns, naming the actual total as 95% rather than calling it invalid',
    short.warn && /95%/.test(short.total) && /provisional/.test(short.total)
      && shortDoc.weightTotals[workingAt] === 95
      && shortDoc.provisional[workingAt] === true
      && shortDoc.rowWarnings[1] === 'weights 95%',
    JSON.stringify(short.total) + ' :: row badge ' + JSON.stringify(shortDoc.rowWarnings[1]));
  /* Nothing was blocked on the way — the work order's own words are "don't block them, tell
     them", so an error line or a disabled control here would be the defect rather than the fix. */
  const notBlocked = await evalJs(`(function(){ var m = document.getElementById('categoriesModal');
    return { error: (document.getElementById('categoryError')||{}).textContent,
             disabled: m.querySelectorAll('button[disabled], input[disabled]').length,
             enabledFields: m.querySelectorAll('input:not([disabled])').length }; })()`);
  /* `disabled` is reported rather than asserted at zero: the two disabled controls in that panel
     are the first row's ↑ and the last row's ↓, which are the ENDS OF THE LIST and have nothing to
     do with the total. Every field is asserted live, which is the claim. */
  check('a wrong total blocks nothing: no error line, and every field still live',
    notBlocked.error === '' && notBlocked.enabledFields === 6,
    JSON.stringify(notBlocked) + ' (the disabled pair are the reorder arrows at the ends of the list)');

  /*
    ACCEPTANCE LINE 3, and the fixture is the state the two checks above just produced: this class
    is on three categories totalling 95, and its neighbours are still on the untouched starter four
    totalling 100. Read off the document for every class at once, so "no interference" is a claim
    about all six rather than about the one that was looked at.
  */
  const others = shortDoc.ids
    .map((id, i) => ({ id, i }))
    .filter((c) => c.i !== workingAt && shortDoc.categories[c.i] > 0);
  check('two classes carry different category sets without interference, and the rest are untouched',
    shortDoc.categories[workingAt] === 3 && shortDoc.weightTotals[workingAt] === 95
      && others.length >= 4
      && others.every((c) => shortDoc.categories[c.i] === 4 && shortDoc.weightTotals[c.i] === 100)
      && others.every((c) => JSON.stringify(shortDoc.categoryNames[c.i])
        === JSON.stringify(seededDoc.categoryNames[c.i])),
    'edited class = ' + shortDoc.categories[workingAt] + ' categories at '
      + shortDoc.weightTotals[workingAt] + '%; the other ' + others.length + ' = '
      + JSON.stringify(others.map((c) => shortDoc.categories[c.i] + '@' + shortDoc.weightTotals[c.i])));
  /* Every category id in the document is generated and opaque, the same claim WO-1.6 makes about
     term ids and for the same reason: an id that means something is an id somebody eventually
     parses. Fifteen is the guard against a vacuous pass rather than the expected number: four
     classes on the starter four plus the edited one on three is nineteen at this point in the run,
     and `every` over an empty list is true. */
  const catIds = shortDoc.categoryIds.reduce((all, list) => all.concat(list), []);
  check('every category id is generated and opaque: k_ prefixed, unique, and never a name',
    catIds.length >= 15 && catIds.every((id) => /^k_[0-9a-z]{10}$/.test(id))
      && new Set(catIds).size === catIds.length,
    catIds.length + ' category ids across ' + shortDoc.ids.length + ' classes, e.g. ' + catIds[0]);

  /*
    Rename, reorder, and add — the rest of the first deliverable, on the class that is open. The
    name carries markup, because a category is named by a teacher and "Labs <b>only</b>" has to
    stay those characters rather than become bold.
  */
  await evalJs(`(function(){ var f = document.querySelectorAll('#categoryList .category-name-input')[1];
    f.value = 'Quizzes <b>and</b> exit tickets'; f.dispatchEvent(new Event('input', { bubbles:true }));
    return 1; })()`);
  await new Promise(r => setTimeout(r, 120));
  const renamedCat = await evalJs('window.__cat()');
  const renamedCatDoc = await evalJs('window.__cls()');
  check('a category renames as it is typed, and a name containing markup stays text',
    renamedCatDoc.categoryNames[workingAt][1] === 'Quizzes <b>and</b> exit tickets'
      && renamedCat.injected === 0 && renamedCat.rowChildren === 0
      && renamedCatDoc.weightTotals[workingAt] === 95,
    'stored ' + JSON.stringify(renamedCatDoc.categoryNames[workingAt][1])
      + ', elements injected into the list = ' + renamedCat.injected);

  await clickSel('#categoryList .category-row:nth-child(3) [data-category-move-up]');
  const reordered = await evalJs('window.__cat()');
  const reorderedDoc = await evalJs('window.__cls()');
  check('the up control moves a category one place earlier, in the document and on screen together',
    JSON.stringify(reorderedDoc.categoryIds[workingAt])
      === JSON.stringify([renamedCatDoc.categoryIds[workingAt][0],
        renamedCatDoc.categoryIds[workingAt][2], renamedCatDoc.categoryIds[workingAt][1]])
      && JSON.stringify(reordered.ids) === JSON.stringify(reorderedDoc.categoryIds[workingAt])
      && reordered.upDisabled[0] === true && reordered.downDisabled[2] === true
      && reorderedDoc.weightTotals[workingAt] === 95,
    JSON.stringify(reordered.names) + ' at ' + JSON.stringify(reordered.weights));

  await clickSel('#categoriesModal [data-category-add]');
  const added = await evalJs('window.__cat()');
  const addedDoc = await evalJs('window.__cls()');
  /* A new category arrives at 0 and NOT at "whatever makes the total work". Adding one must not
     silently reweight the categories already there — see src/categories.js's addCategory() — so
     the total is still 95 and the banner still says 95. */
  check('a category added arrives at 0% and changes no other weight, so the total does not move',
    added.names.length === 4 && added.weights[3] === '0'
      && addedDoc.weightTotals[workingAt] === 95 && added.warn && /95%/.test(added.total)
      && JSON.stringify(addedDoc.categoryWeights[workingAt].slice(0, 3))
        === JSON.stringify(reorderedDoc.categoryWeights[workingAt]),
    JSON.stringify(added.weights) + ' :: ' + JSON.stringify(added.total));

  /*
    And back to 100 the other way, which is the crossing the banner has to make in the direction
    that matters most: a teacher who has just fixed it has to be told she has.

    THE NUMBERS ARE THE FLOATING-POINT CASE BALANCE_EPSILON EXISTS FOR, and they were chosen by
    searching for a set rather than guessed: 40.1 + 34.7 + 25.2 + 0 is exactly 100 in decimal and
    100.00000000000001 in IEEE-754, so a `=== 100` in isBalanced() calls a correct class
    provisional. The first draft of this check used 12.5 + 87.5, which sums to 100 EXACTLY in
    binary — it went green against the strict-equality mutation and proved nothing. That is worth
    knowing about: this defect appears for some decimal sets and not others, and never for the
    round numbers anyone reaches for first.
  */
  await typeWeights([40.1, 34.7, 25.2, 0]);
  const fixed = await evalJs('window.__cat()');
  const fixedDoc = await evalJs('window.__cls()');
  check('weights that are right only in decimal — 40.1 + 34.7 + 25.2 — are called right, and the warning clears',
    !fixed.warn && /100%/.test(fixed.total) && !/⚠/.test(fixed.total)
      && fixedDoc.provisional[workingAt] === false
      && fixedDoc.rowWarnings[1] === ''
      && fixedDoc.weightTotals[workingAt] !== 100,
    JSON.stringify(fixedDoc.categoryWeights[workingAt]) + ' sums to '
      + fixedDoc.weightTotals[workingAt] + ' :: ' + JSON.stringify(fixed.total));
  /* Stored exactly as typed, which is the header's first decision: nothing clamps, rounds or
     repairs a number a teacher entered. 0 is a real weight — it is how a category stops counting
     without its work being destroyed — and it is not silently deleted or turned into a removal. */
  check('a weight is stored exactly as it was typed, decimals and a deliberate zero included',
    fixedDoc.categoryWeights[workingAt].every((w) => typeof w === 'number')
      && JSON.stringify(fixedDoc.categoryWeights[workingAt]) === JSON.stringify([40.1, 34.7, 25.2, 0])
      && fixedDoc.categories[workingAt] === 4,
    JSON.stringify(fixedDoc.categoryWeights[workingAt]));

  /*
    THE REMOVAL WARNING — the third deliverable, and the one place this feature destroys anything.
    The fixture is written through the store because there is no assignment screen yet (WO-3.3 owns
    that), and its point is that the confirm counts real records rather than printing zeroes. A
    neighbouring category gets an assignment of its own, so "it removed the right one" is
    falsifiable.
  */
  const victimCat = fixedDoc.categoryIds[workingAt][0];
  const bystanderCat = fixedDoc.categoryIds[workingAt][1];
  await evalJs(`(async function(){ var s = window.planbook.store;
    s.update(function(d){
      d.assignments.push({ id:'a_k1', classId:${JSON.stringify(workingId)},
        categoryId:${JSON.stringify(victimCat)}, name:'Unit 1 test', points:100 });
      d.assignments.push({ id:'a_k2', classId:${JSON.stringify(workingId)},
        categoryId:${JSON.stringify(victimCat)}, name:'Unit 2 test', points:50 });
      d.assignments.push({ id:'a_k3', classId:${JSON.stringify(workingId)},
        categoryId:${JSON.stringify(bystanderCat)}, name:'Pop quiz', points:10 });
      /* Object cells, per docs/data-model.md — never a bare number. */
      d.scores['a_k1'] = { s_v1:{ v:87 }, s_v2:{ v:null, flag:'missing' } };
      d.scores['a_k2'] = { s_v1:{ v:44 } };
      d.scores['a_k3'] = { s_v1:{ v:9 } };
    });
    await s.flush(); return 1; })()`);
  /* Re-rendered through the real control rather than by calling the renderer: the Remove button's
     aria-haspopup is set per row from what is filed under it, and a row drawn before the fixture
     existed would still be promising no dialog. */
  await clickSel('#categoriesModal [data-modal-close]');
  await clickSel('#classList .class-row:nth-child(2) [data-category-manage]');
  await clickSel('#categoryList .category-row:nth-child(1) [data-category-remove]');
  const warned = await evalJs('window.__cat()');
  check('removing a category that holds work warns first, and counts the assignments and scores it takes',
    warned.confirmOpen && /2 assignments and 3 scores/.test(warned.confirmFacts)
      && /cannot be undone/.test(warned.confirmLead) && /weight to 0/.test(warned.confirmLead)
      && /Remove /.test(warned.confirmButton),
    JSON.stringify(warned.confirmFacts.slice(0, 200)) + ' :: ' + JSON.stringify(warned.confirmButton));

  const beforeCatCancel = await evalJs(
    '(async function(){ await window.planbook.store.flush(); return window.__cls(); })()');
  await clickSel('[data-category-remove-cancel]');
  const afterCatCancel = await evalJs(`(async function(){ await window.planbook.store.flush();
    var live = window.__cls(); var s = window.planbook.store.getDoc();
    live.catConfirmOpen = !document.getElementById('categoryRemoveModal').classList.contains('hidden');
    live.assignmentIds = s.assignments.map(function(a){ return a.id; });
    live.scoreKeys = Object.keys(s.scores);
    return live; })()`);
  check('cancelling the removal leaves the category, its assignments and its scores exactly as they were',
    afterCatCancel.catConfirmOpen === false
      && afterCatCancel.categories[workingAt] === beforeCatCancel.categories[workingAt]
      && afterCatCancel.rev === beforeCatCancel.rev
      && afterCatCancel.assignmentIds.indexOf('a_k1') >= 0
      && afterCatCancel.scoreKeys.indexOf('a_k1') >= 0,
    'categories ' + afterCatCancel.categories[workingAt] + ', rev ' + beforeCatCancel.rev
      + ' -> ' + afterCatCancel.rev + ' (nothing written, so rev cannot move)');

  await clickSel('#categoryList .category-row:nth-child(1) [data-category-remove]');
  await clickSel('[data-category-remove-confirm]');
  await new Promise(r => setTimeout(r, 300));
  const removed = await evalJs(`(async function(){ var s = window.planbook.store; await s.flush();
    var d = s.getDoc(); var live = window.__cls();
    live.assignmentIds = d.assignments.map(function(a){ return a.id; });
    live.scoreKeys = Object.keys(d.scores);
    live.catConfirmOpen = !document.getElementById('categoryRemoveModal').classList.contains('hidden');
    return live; })()`);
  check('confirming takes the category, the assignments filed under it and their scores — and only those',
    removed.categories[workingAt] === 3 && !removed.catConfirmOpen
      && removed.categoryIds[workingAt].indexOf(victimCat) === -1
      && removed.categoryIds[workingAt].indexOf(bystanderCat) >= 0
      && removed.assignmentIds.indexOf('a_k1') === -1
      && removed.assignmentIds.indexOf('a_k2') === -1
      && removed.assignmentIds.indexOf('a_k3') >= 0
      && removed.scoreKeys.indexOf('a_k1') === -1 && removed.scoreKeys.indexOf('a_k2') === -1
      && removed.scoreKeys.indexOf('a_k3') >= 0,
    'categories left ' + removed.categories[workingAt] + ', assignments left '
      + JSON.stringify(removed.assignmentIds) + ', score columns left '
      + JSON.stringify(removed.scoreKeys));
  /* And the total followed the removal down, which is the other half of "recomputed immediately":
     40.1 went with the category, so the class is at 59.9 and the banner and the row badge both say
     so without anything being reopened. Compared with a tolerance rather than to 59.9 exactly,
     because 34.7 + 25.2 is 59.900000000000006 — the same arithmetic BALANCE_EPSILON is about, and
     the reason the two surfaces print through one formatter rather than two. */
  const afterRemovalScreen = await evalJs('window.__cat()');
  check('and the total recomputed the moment the category left, on the banner and on the row behind it',
    Math.abs(removed.weightTotals[workingAt] - 59.9) < 0.005 && afterRemovalScreen.warn
      && /59\.9%/.test(afterRemovalScreen.total)
      && removed.rowWarnings[1] === 'weights 59.9%',
    JSON.stringify(afterRemovalScreen.total) + ' :: row badge '
      + JSON.stringify(removed.rowWarnings[1]));

  /* The fixture comes back out, so the sections after this one see the document they expect. */
  await evalJs(`(async function(){ var s = window.planbook.store;
    s.update(function(d){
      d.assignments = d.assignments.filter(function(a){ return a.id !== 'a_k3'; });
      delete d.scores['a_k3'];
    });
    await s.flush(); return 1; })()`);

  /*
    A full reload. Weights are the setting a whole term of grades is computed from, so "it was in
    the document" is not the claim — the claim is that it came back out of IndexedDB, and that the
    warning a teacher left on screen is the warning she finds when she opens the app again. Flushed
    first, for the reason the classes section states at length: CDP tears the execution context
    down without waiting for a debounced write.
  */
  await evalJs("window.planbook.closeModal('categoriesModal');"
    + "window.planbook.closeModal('classesModal');1");
  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  const catBoot = await waitForBoot();
  await evalJs(KILL_ANIM);
  await evalJs(INSTALL_WALKER);
  await evalJs(INSTALL_CLASS_READER);
  await evalJs(INSTALL_CAT_READER);
  const reopened = await evalJs('window.__cls()');
  check('the weights survive a reload, and the class comes back provisional because it still is',
    catBoot && JSON.stringify(reopened.categoryWeights[workingAt]) === JSON.stringify([34.7, 25.2, 0])
      && Math.abs(reopened.weightTotals[workingAt] - 59.9) < 0.005
      && reopened.provisional[workingAt] === true
      && reopened.categoryNames[workingAt][1] === 'Quizzes <b>and</b> exit tickets',
    catBoot ? JSON.stringify(reopened.categoryWeights[workingAt]) + ' for '
      + JSON.stringify(reopened.categoryNames[workingAt])
      : 'the loading screen never came down');
}
}
