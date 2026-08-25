/* letter-grades.mjs — letter grades (WO-3.2)
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
const { check, skip, send, evalJs, has, clickSel, KILL_ANIM, INSTALL_WALKER, waitForBoot, seam,
  classesBooted, classSeam } = h;

/* ───────────────── letter grades (WO-3.2) ─────────────────
 *
 * The four acceptance lines of WO-3.2. Three of them are driven entirely through the controls a
 * teacher touches — the door in the class manager, the subject pills, the real letter and boundary
 * fields, the real reorder arrows and Remove — and the fourth (`there is no rounding code anywhere`)
 * is a grep, made in tools/wo-sweep.mjs § 10 rather than measured here.
 *
 * That sentence was wrong when this section was written, and the scar is worth keeping: it said the
 * grep was "made in tools/wo-sweep.mjs" at a point when the sweep had no rounding check at all. The
 * acceptance line had been settled by hand, once, in the dispatch that built this — so the record
 * claimed a standing guard where there was a one-time reading, and the next person to add a "round
 * to nearest whole percent" option would have been told by two files that something was watching.
 * The check now exists, which is the only reason this reference is allowed to stand.
 *
 * WHY THE MAPPING IS READ THROUGH THE SEAM. Nothing in this app displays a grade: there is no grade
 * engine (WO-3.4), no assignment UI (WO-3.3) and no score grid (WO-3.5), and WO-3.2 explicitly
 * forbids building a preview over student data to demonstrate the mapping with. So "89.5 is an A and
 * 89.49 is an A−" is asked of window.planbook.letterScale.letterFor() after the boundary has been
 * typed into the real field — which is also the only way to tell a build where the ranges on screen
 * come out of the exported mapping from one where the panel does its own arithmetic and the export
 * WO-3.4 is going to import says something else. A check that banded the percentage itself would
 * agree with itself perfectly and prove nothing.
 *
 * NO BOUNDARY IS WRITTEN DOWN IN THIS FILE except the ones this section types on purpose. The seeded
 * scale is compared against what src/store.js put in the document, because 90/80/70 belongs in seed
 * data and nowhere else — a harness asserting `93` would be a second copy of the school's grading
 * policy living in a tool.
 *
 * What is NOT here and is owed to a human: a thumb on a 64px letter field and a 66px boundary field
 * side by side, whether iPadOS offers the numeric keypad for the boundary, and whether "never
 * reached" reads as amber rather than as an error from the back of a room. The touch section below
 * measures the boxes; it cannot press them.
 */

console.log('\n--- letter grades ---');

const scaleSeam = await evalJs("!!(window.planbook && window.planbook.letterScale"
  + " && typeof window.planbook.letterScale.letterFor === 'function'"
  + " && typeof window.planbook.letterScale.scaleFaults === 'function'"
  + " && typeof window.planbook.letterScale.scaleForClass === 'function')");

if (!classesBooted || !classSeam || !scaleSeam) {
  skip('letter grades: the seeded bands and their derived ranges, an out-of-order band caught in the editor, a boundary of 89.5, and a per-class override',
    classesBooted
      ? 'no window.planbook.letterScale seam on the page — it is kept deliberately for this file to read the mapping through, so its absence is a defect and not a stage of the build'
      : 'the app did not boot before this section');
} else {
  /* Everything this section reads off the screen and out of the document, in one page-side helper,
     so a check is one round trip and the reads cannot drift between checks. The document half comes
     through the module's own exports rather than being re-derived here — see the note above. */
  const INSTALL_SCALE_READER = `(function(){
    window.__scale = function(){
      var modal = document.getElementById('letterScaleModal');
      var list = document.getElementById('bandList');
      var note = document.getElementById('scaleNote');
      var subjects = document.getElementById('scaleSubjects');
      var override = document.getElementById('scaleOverride');
      var rows = Array.prototype.slice.call(list.querySelectorAll('.band-row'));
      var pills = Array.prototype.slice.call(subjects.querySelectorAll('[data-scale-subject]'));
      var s = window.planbook.letterScale;
      var doc = window.planbook.store.getDoc();
      var docScale = s.letterScaleOf(doc);
      return {
        open: !!modal && !modal.classList.contains('hidden'),
        stacked: !document.getElementById('classesModal').classList.contains('hidden'),
        subjects: pills.map(function(p){ return p.textContent; }),
        subjectIds: pills.map(function(p){ return p.getAttribute('data-scale-subject'); }),
        active: pills.map(function(p){ return p.classList.contains('active'); }),
        pressed: pills.map(function(p){ return p.getAttribute('aria-pressed'); }),
        overrideText: override.textContent.replace(/\\s+/g, ' ').trim(),
        overrideOn: !!override.querySelector('[data-scale-override-on]'),
        overrideOff: !!override.querySelector('[data-scale-override-off]'),
        /* A letter is a field on an editable row and a span on an inherited one, which is the
           read-only half of the per-class override rather than a second rendering of the list. */
        letters: rows.map(function(r){ var f = r.querySelector('.band-letter-input');
          return f ? f.value : (r.querySelector('.band-letter')||{}).textContent; }),
        mins: rows.map(function(r){ var f = r.querySelector('.band-min'); return f ? f.value : null; }),
        ranges: rows.map(function(r){ return (r.querySelector('.band-range')||{}).textContent; }),
        rangeWarn: rows.map(function(r){ var c = r.querySelector('.band-range');
          return !!(c && c.classList.contains('warn')); }),
        inherited: rows.filter(function(r){ return r.classList.contains('inherited'); }).length,
        fields: list.querySelectorAll('input').length,
        /* A letter is teacher-typed; one of them below is given markup on purpose. */
        injected: list.querySelectorAll('b, script, i').length,
        note: note ? note.textContent : '',
        warn: !!(note && note.classList.contains('warn')),
        empty: !!list.querySelector('.class-empty'),
        addHidden: document.getElementById('bandAddRow').classList.contains('hidden'),
        docLetters: docScale.map(function(b){ return b.letter; }),
        docMins: docScale.map(function(b){ return b.min; }),
        faults: s.scaleFaults(docScale),
        classIds: doc.classes.map(function(c){ return c.id; }),
        classNames: doc.classes.map(function(c){ return c.name; }),
        classArchived: doc.classes.map(function(c){ return !!c.archived; }),
        classOwn: doc.classes.map(function(c){ return s.hasOwnScale(c); }),
        /* What the field actually HOLDS, not a boolean about it. null is the documented sentinel for
           "use the document default", an array is an override, and undefined is a class stored by a
           build older than this work order — the restored class in row 1 of the manager is exactly
           that, and a check asserting strict equality with null for every other class would fail on
           it for a reason that has nothing to do with the claim. Distinguishing them is also the
           only way to assert that turning an override OFF writes the sentinel rather than an empty
           array. (No backticks in this comment: it is inside a template literal.) */
        classScaleKind: doc.classes.map(function(c){
          return c.letterScale === null ? 'null'
            : (Array.isArray(c.letterScale) ? 'array' : typeof c.letterScale); }),
        classTopMin: doc.classes.map(function(c){ var eff = s.scaleForClass(doc, c);
          return eff.length ? eff[0].min : null; }),
        rev: doc.rev
      };
    }; return 1; })()`;
  await evalJs(INSTALL_SCALE_READER);

  /* Typing a boundary or a letter, through the real field and the real delegated listener: setting
     `.value` and dispatching `input` is the path a keystroke takes, and shell.js reads the element
     rather than the event's provenance. By ROW INDEX, because that is what a teacher does — the
     second row down — and because a band deliberately has no id (src/letter-scale.js's decision 3). */
  const typeBand = async (index, field, value) => {
    await evalJs(`(function(){
      var sel = ${JSON.stringify(field)} === 'min' ? '.band-min' : '.band-letter-input';
      var row = document.querySelectorAll('#bandList .band-row')[${index}];
      var f = row && row.querySelector(sel);
      if (!f) return 0;
      f.value = ${JSON.stringify(String(value))};
      f.dispatchEvent(new Event('input', { bubbles: true }));
      return 1; })()`);
    await new Promise(r => setTimeout(r, 120));
  };
  /* What the app makes of a percentage, asked of the exported mapping against the scale that applies
     — the document's, or one class's. '(none)' rather than null so a detail line says which. */
  const letterAt = async (pct, classId) => await evalJs(`(function(){
    var s = window.planbook.letterScale; var d = window.planbook.store.getDoc();
    var want = ${JSON.stringify(classId || '')};
    var cls = want ? d.classes.filter(function(c){ return c.id === want; })[0] : null;
    var out = s.letterFor(${JSON.stringify(pct)}, cls ? s.scaleForClass(d, cls) : s.letterScaleOf(d));
    return out === null ? '(none)' : out; })()`);

  /* Nothing above this is guaranteed to have left the screen clear — the categories section closes
     its own panels, and a section that skipped left whatever it had open. */
  await evalJs("['categoryRemoveModal','categoriesModal','termsModal','classesModal']"
    + ".forEach(function(m){ window.planbook.closeModal(m); }); 1");

  await clickSel('header [data-class-manage]');
  await clickSel('#classesModal [data-letter-scale]');
  const seededScale = await evalJs('window.__scale()');
  /*
    THE DOOR, AND THE SEED. The panel opens over the class manager (src/modal.js keeps a stack, so
    Escape closes this and leaves that open) with the bands src/store.js seeded — compared against
    the document rather than against numbers typed in here, for the reason in this section's header.
  */
  check('the letter-scale editor opens over the class manager and shows the bands the document holds',
    seededScale.open && seededScale.stacked
      && seededScale.letters.length === seededScale.docLetters.length
      && seededScale.letters.length >= 5
      && JSON.stringify(seededScale.letters) === JSON.stringify(seededScale.docLetters)
      && JSON.stringify(seededScale.mins) === JSON.stringify(seededScale.docMins.map(String))
      && seededScale.fields === seededScale.letters.length * 2,
    seededScale.letters.length + ' bands: ' + JSON.stringify(seededScale.letters) + ' at '
      + JSON.stringify(seededScale.mins));
  /* And it is in order with no gap, which is the state a fresh document has to arrive in: a teacher
     who has made no decision yet must not be greeted by a warning. */
  check('a seeded scale is called clean: nothing unreachable, no gap at the bottom, and no warning',
    !seededScale.warn && !/⚠/.test(seededScale.note)
      && seededScale.faults.unreachable.length === 0 && seededScale.faults.gapBelow === null
      && seededScale.faults.reachable === seededScale.faults.bands
      && /exactly one letter/.test(seededScale.note),
    JSON.stringify(seededScale.faults) + ' :: ' + JSON.stringify(seededScale.note));

  /*
    DELIVERABLE 4 — the derived range on every row, which is what makes a gap or an overlap visible
    without a validator. The expected text is built HERE from the document's own boundaries, so the
    check is that the panel derived the upper bound from the band above it: the top band runs up with
    no ceiling, and every other band stops where the one above it starts.
  */
  const wantRanges = seededScale.docMins.map((min, i) => i === 0
    ? min + '% and up'
    : min + '% up to ' + seededScale.docMins[i - 1] + '%');
  check('every band shows the range it works out to, derived from the band above rather than stored',
    JSON.stringify(seededScale.ranges) === JSON.stringify(wantRanges)
      && seededScale.rangeWarn.every((w) => w === false),
    JSON.stringify(seededScale.ranges.slice(0, 4)) + ' … expected '
      + JSON.stringify(wantRanges.slice(0, 4)));

  /*
    ACCEPTANCE LINE 3, in the direction that is actually expressible. An INTERIOR GAP IS NOT: the
    upper bound is derived, so two bands cannot leave a hole between them (src/letter-scale.js's
    header argues it at length). What is expressible is a band nothing can reach — and typing the
    work order's own 89.5 into the A boundary while A− still sits at 90 is exactly that, which is why
    this fixture is the first half of acceptance line 1 rather than a second one.
  */
  await typeBand(0, 'min', 89.5);
  const outOfOrder = await evalJs('window.__scale()');
  check('a band the list can never reach is caught in the editor: named in the note, and flagged on its own row',
    outOfOrder.warn && JSON.stringify(outOfOrder.faults.unreachable) === '[1]'
      && outOfOrder.rangeWarn[1] === true && /never reached/.test(outOfOrder.ranges[1])
      && outOfOrder.note.indexOf(outOfOrder.docLetters[1]) >= 0
      && /never be reached/.test(outOfOrder.note)
      && outOfOrder.rangeWarn[0] === false,
    JSON.stringify(outOfOrder.note) + ' :: row 2 range ' + JSON.stringify(outOfOrder.ranges[1]));
  /*
    And the mapping AGREES with the warning rather than quietly working around it. A percentage
    between the two boundaries is the band BELOW the stranded one, because nothing sorts the list to
    be helpful — if letterFor() sorted, this scale would look fine and the editor's warning would be
    a warning about nothing.

    THE THIRD PROBE IS THE ONLY ONE THAT CATCHES A SORT, and the first draft of this check did not
    have it: at 89.4 and 89.6 a sorted scale and an unsorted one give the SAME answers, because
    reordering A above A− changes nothing below 90. Mutating letterFor() to sort descending turned
    nothing red at all. A percentage of 92 is where the two builds disagree — the list says A, sorted
    says A− — which is the whole of "the order is the rule".
  */
  const skipped = await letterAt(89.4);
  const aboveBoth = await letterAt(92);
  check('and the mapping skips the unreachable band rather than sorting the scale behind the teacher',
    skipped === outOfOrder.docLetters[2] && await letterAt(89.6) === outOfOrder.docLetters[0]
      && aboveBoth === outOfOrder.docLetters[0],
    '89.4 is ' + skipped + ', not ' + outOfOrder.docLetters[1]
      + '; 89.6 is ' + await letterAt(89.6) + '; 92 is ' + aboveBoth + ' — the first band in the '
      + 'list, which is what a build that sorted would get wrong');

  /*
    ACCEPTANCE LINE 1. A− goes to 89 — below the new A boundary and above the band under it — which
    is the scale the acceptance line describes, and the warning clears because the list is in order
    again.
  */
  await typeBand(1, 'min', 89);
  const halfPoint = await evalJs('window.__scale()');
  const atBoundary = await letterAt(89.5);
  const justUnder = await letterAt(89.49);
  check('an A boundary of 89.5 makes 89.5 an A and 89.49 the band below it, with no rounding anywhere in between',
    atBoundary === halfPoint.docLetters[0] && justUnder === halfPoint.docLetters[1]
      && await letterAt(89.4999) === halfPoint.docLetters[1]
      && await letterAt(90) === halfPoint.docLetters[0]
      && !halfPoint.warn && halfPoint.faults.unreachable.length === 0,
    '89.5 -> ' + atBoundary + ', 89.49 -> ' + justUnder + ', 89.4999 -> '
      + await letterAt(89.4999) + ' (boundaries ' + halfPoint.docMins[0] + ' / '
      + halfPoint.docMins[1] + ')');
  /* Stored exactly as it was typed, decimal included — src/letter-scale.js's first decision, and
     docs/data-model.md's rule about a number a teacher entered. A build that rounded the boundary on
     the way in would pass a check that only asked what 89.5 maps to, because 89.5 is an A either
     way; what it could not do is still be 89.5 in the document. */
  check('the boundary is stored exactly as typed — 89.5, as a number, not 90 and not "89.5"',
    halfPoint.docMins[0] === 89.5 && typeof halfPoint.docMins[0] === 'number'
      && halfPoint.mins[0] === '89.5'
      && halfPoint.ranges[0] === '89.5% and up' && halfPoint.ranges[1] === '89% up to 89.5%',
    'document ' + JSON.stringify(halfPoint.docMins.slice(0, 3)) + ' :: field '
      + JSON.stringify(halfPoint.mins[0]) + ' :: ranges '
      + JSON.stringify(halfPoint.ranges.slice(0, 2)));
  /* Nothing was blocked on the way through the faulty state — the same call src/categories.js made
     about weights that do not add up, and for the same reason: a scale mid-edit is wrong for a
     second at a time. An error line or a disabled field here would be the defect rather than the
     fix. The two disabled controls are the ends of the list, which is what they are asserted to be. */
  const scaleNotBlocked = await evalJs(`(function(){ var m = document.getElementById('letterScaleModal');
    var off = Array.prototype.slice.call(m.querySelectorAll('button[disabled], input[disabled]'));
    return { disabled: off.map(function(b){ return b.getAttribute('aria-label'); }),
             fields: m.querySelectorAll('input:not([disabled])').length,
             errors: m.querySelectorAll('.class-error:not(.hidden)').length }; })()`);
  check('a faulty scale blocks nothing: every field still live, and the only disabled controls are the ends of the list',
    scaleNotBlocked.errors === 0 && scaleNotBlocked.fields === halfPoint.letters.length * 2
      && scaleNotBlocked.disabled.length === 2
      && /higher/.test(scaleNotBlocked.disabled[0]) && /lower/.test(scaleNotBlocked.disabled[1]),
    JSON.stringify(scaleNotBlocked));

  /*
    ADDING A BAND, and the boundary it must NOT invent. A new band arrives at 0 rather than halfway
    between its neighbours, because a boundary Planbook chose is Planbook deciding what a B+ is —
    which is the one thing "the app never hardcodes 90/80/70" forbids. So it lands out of order with
    the bottom band and the note says so at once, which is the prompt to type the real number.
  */
  await clickSel('#letterScaleModal [data-band-add]');
  const addedBand = await evalJs('window.__scale()');
  const last = addedBand.letters.length - 1;
  check('a band added arrives at 0% with no boundary invented for it, and the note says the scale is out of order',
    addedBand.letters.length === halfPoint.letters.length + 1
      && addedBand.mins[last] === '0' && addedBand.docMins[last] === 0
      && JSON.stringify(addedBand.docMins.slice(0, last)) === JSON.stringify(halfPoint.docMins)
      && addedBand.warn && addedBand.rangeWarn[last] === true,
    'new band ' + JSON.stringify(addedBand.letters[last]) + ' at '
      + JSON.stringify(addedBand.mins[last]) + ' :: ' + JSON.stringify(addedBand.note));
  /* A letter is typed by a teacher, so markup in one stays text. */
  await typeBand(last, 'letter', 'I<b>nc</b>');
  const markup = await evalJs('window.__scale()');
  check('a letter renames as it is typed, and one containing markup stays text',
    markup.docLetters[last] === 'I<b>nc</b>' && markup.injected === 0,
    'stored ' + JSON.stringify(markup.docLetters[last]) + ', elements injected into the list = '
      + markup.injected);
  /* And out again on the tap, with no confirm dialog anywhere: nothing is filed under a band. */
  await clickSel('#bandList .band-row:last-child [data-band-remove]');
  const removedBand = await evalJs(`(function(){ var live = window.__scale();
    live.dialogs = Array.prototype.slice.call(document.querySelectorAll('.modal-overlay'))
      .filter(function(o){ return !o.classList.contains('hidden'); })
      .map(function(o){ return o.id; });
    return live; })()`);
  check('removing a band takes one tap and opens no dialog, because nothing is filed under a band',
    removedBand.letters.length === halfPoint.letters.length
      && JSON.stringify(removedBand.docMins) === JSON.stringify(halfPoint.docMins)
      && JSON.stringify(removedBand.dialogs) === JSON.stringify(['classesModal', 'letterScaleModal'])
      && !removedBand.warn,
    JSON.stringify(removedBand.letters) + ' :: open dialogs ' + JSON.stringify(removedBand.dialogs));

  /*
    REORDER IS THE REPAIR THAT CHANGES NO BOUNDARY, which is why the arrows are here at all and why
    nothing sorts the list for the teacher. Moving the bottom band up makes the one it passed
    unreachable — no number changed — and moving it back repairs it, also with no number changed.
  */
  const beforeMove = removedBand.docMins.slice();
  await clickSel('#bandList .band-row:last-child [data-band-move-up]');
  const moved = await evalJs('window.__scale()');
  const bottom = moved.letters.length - 1;
  check('reordering changes no boundary at all, and can strand a band on its own',
    JSON.stringify(moved.docMins.slice().sort((a, b) => a - b))
      === JSON.stringify(beforeMove.slice().sort((a, b) => a - b))
      && JSON.stringify(moved.faults.unreachable) === JSON.stringify([bottom])
      && moved.warn && /never reached/.test(moved.ranges[bottom]),
    JSON.stringify(moved.docMins.slice(-3)) + ' :: unreachable '
      + JSON.stringify(moved.faults.unreachable));
  /* The row that moved is now the second from the bottom, and it is that row's ↓ that undoes it —
     the last row's is disabled, because it is the end of the list. */
  await clickSel('#bandList .band-row:nth-last-child(2) [data-band-move-down]');
  const unmoved = await evalJs('window.__scale()');
  check('and moving it back repairs the scale, again without touching a boundary',
    JSON.stringify(unmoved.docMins) === JSON.stringify(beforeMove) && !unmoved.warn
      && unmoved.faults.unreachable.length === 0,
    JSON.stringify(unmoved.docMins.slice(-3)) + ' :: ' + JSON.stringify(unmoved.note));

  /*
    THE OTHER EXPRESSIBLE FAULT: the gap at the bottom, which is the only true gap this shape allows.
    Raising the lowest boundary leaves every percentage below it with no letter at all — and the
    mapping says so rather than falling back to a letter nobody defined.
  */
  await typeBand(unmoved.letters.length - 1, 'min', 50);
  const gapped = await evalJs('window.__scale()');
  const belowTheFloor = await letterAt(49);
  check('a gap at the bottom is caught in the editor, and a percentage under it gets no letter rather than an invented one',
    gapped.warn && gapped.faults.gapBelow === 50 && /below 50%/.test(gapped.note)
      && belowTheFloor === '(none)' && await letterAt(50) === gapped.docLetters[gapped.docLetters.length - 1],
    JSON.stringify(gapped.note) + ' :: 49% -> ' + belowTheFloor);
  await typeBand(unmoved.letters.length - 1, 'min', 0);
  const ungapped = await evalJs('window.__scale()');
  check('setting it back to 0 clears the gap and the note goes positive again',
    !ungapped.warn && ungapped.faults.gapBelow === null && /exactly one letter/.test(ungapped.note)
      && await letterAt(0) === ungapped.docLetters[ungapped.docLetters.length - 1],
    JSON.stringify(ungapped.note));

  /*
    ACCEPTANCE LINE 2 — the per-class override, and the door to it. The subject row is where it is
    reached from, because the class-manager row already carries seven controls (WO-1.22 added Copy) and
    plans/gradebook-surfaces.md forbids re-cutting it: so the pills are asserted to be the document's
    own active classes, in order, behind "Every class".
  */
  const subjectIds = ungapped.subjectIds.slice(1);
  /* The classes still on the bar, in document order. An ARCHIVED class is deliberately not offered
     here — it is one the teacher has put away, and it keeps whatever override it had — so this is the
     assertion that would catch the pill row being built off `doc.classes` unfiltered. */
  const activeIds = ungapped.classIds.filter((id, i) => !ungapped.classArchived[i]);
  check('the subject row offers the document scale and every class on the bar, which is where the per-class override is reached',
    ungapped.subjects[0] === 'Every class' && ungapped.subjectIds[0] === ''
      && ungapped.active[0] === true && ungapped.pressed[0] === 'true'
      && subjectIds.length >= 4
      && JSON.stringify(subjectIds) === JSON.stringify(activeIds)
      && ungapped.active.filter((a) => a).length === 1
      && /Every class uses these bands/.test(ungapped.overrideText),
    ungapped.subjects.length + ' subjects: ' + JSON.stringify(ungapped.subjects.slice(0, 3))
      + ' … :: ' + JSON.stringify(ungapped.overrideText.slice(0, 80)));

  const overrideId = subjectIds[1];
  await clickSel('#scaleSubjects [data-scale-subject="' + overrideId + '"]');
  const inherited = await evalJs('window.__scale()');
  /* A class with no override is SHOWN the bands it uses, read-only. Editing them here would be
     editing every other class from a panel whose subject row says the name of one. */
  check('a class with no override shows the bands it uses, read-only, with the door to give it its own',
    inherited.inherited === inherited.letters.length && inherited.fields === 0
      && inherited.addHidden === true && inherited.overrideOn && !inherited.overrideOff
      && JSON.stringify(inherited.letters) === JSON.stringify(inherited.docLetters)
      && inherited.classScaleKind[inherited.classIds.indexOf(overrideId)] === 'null',
    inherited.letters.length + ' inherited row(s), ' + inherited.fields + ' field(s), add-a-band '
      + (inherited.addHidden ? 'hidden' : 'showing'));

  await clickSel('#scaleOverride [data-scale-override-on]');
  const owned = await evalJs('window.__scale()');
  const ownedAt = owned.classIds.indexOf(overrideId);
  /* Turning it on writes a COPY of the bands that already applied — not a diff against the default,
     which would be a second thing to keep in step every time the default moved. */
  check('turning the override on copies the bands that already applied, and the rows become editable',
    owned.classOwn[ownedAt] === true && owned.classScaleKind[ownedAt] === 'array'
      && owned.inherited === 0 && owned.fields === owned.letters.length * 2
      && owned.addHidden === false && owned.overrideOff && !owned.overrideOn
      && owned.classTopMin[ownedAt] === owned.docMins[0]
      && JSON.stringify(owned.letters) === JSON.stringify(owned.docLetters),
    'own bands = ' + owned.classOwn[ownedAt] + ', top boundary ' + owned.classTopMin[ownedAt]
      + ' copied from ' + owned.docMins[0]);

  /*
    AND IT APPLIES TO THAT CLASS ONLY, which is the acceptance line itself. The class's A boundary
    goes to 95 and the same percentage is asked of both scales: a build that shared one array between
    the copy and the document — the mistake src/categories.js's starterCategories() carries a warning
    about — would answer identically for both and fail here.
  */
  await typeBand(0, 'min', 95);
  const isolated = await evalJs('window.__scale()');
  const inThatClass = await letterAt(94, overrideId);
  const inTheDocument = await letterAt(94);
  const inAnotherClass = await letterAt(94, subjectIds[0]);
  check('a per-class override applies to that class only: 94% is one letter there and another everywhere else',
    isolated.classTopMin[ownedAt] === 95 && isolated.docMins[0] === ungapped.docMins[0]
      && inThatClass === isolated.docLetters[1] && inTheDocument === isolated.docLetters[0]
      && inAnotherClass === isolated.docLetters[0]
      && isolated.classOwn.filter((o) => o).length === 1
      && isolated.classScaleKind.every((k, i) => i === ownedAt ? k === 'array' : k !== 'array'),
    '94% -> ' + inThatClass + ' in ' + JSON.stringify(isolated.classNames[ownedAt])
      + ', ' + inAnotherClass + ' in ' + JSON.stringify(isolated.classNames[isolated.classIds.indexOf(subjectIds[0])])
      + ', ' + inTheDocument + ' document-wide; classes with their own bands = '
      + isolated.classOwn.filter((o) => o).length);
  /* And the panel says whose bands are whose while the document scale is up, because "why did my
     change not reach Period 3" is the question an override creates. */
  await clickSel('#scaleSubjects [data-scale-subject=""]');
  const named = await evalJs('window.__scale()');
  check('with the document scale up, the panel names the classes that have their own bands',
    named.overrideText.indexOf(named.classNames[ownedAt]) >= 0
      && /own bands/.test(named.overrideText) && named.inherited === 0
      && named.fields === named.letters.length * 2,
    JSON.stringify(named.overrideText.slice(0, 120)));

  /*
    A FULL RELOAD. A letter scale is the setting a whole year of report cards is read through, so "it
    was in the document" is not the claim — the claim is that it came back out of IndexedDB, both
    halves of it: the document's own 89.5 boundary and one class's override. Flushed first, for the
    reason tools/README.md trap 6 states at length.
  */
  await evalJs("window.planbook.closeModal('letterScaleModal');"
    + "window.planbook.closeModal('classesModal');1");
  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  const scaleBoot = await waitForBoot();
  await evalJs(KILL_ANIM);
  await evalJs(INSTALL_WALKER);
  await evalJs(INSTALL_CLASS_READER);
  await evalJs(INSTALL_SCALE_READER);
  await clickSel('header [data-class-manage]');
  await clickSel('#classesModal [data-letter-scale]');
  const reloadedScale = await evalJs('window.__scale()');
  check('the bands survive a reload — the document scale and the one class override both come back out of IndexedDB',
    scaleBoot && JSON.stringify(reloadedScale.docMins) === JSON.stringify(isolated.docMins)
      && JSON.stringify(reloadedScale.docLetters) === JSON.stringify(isolated.docLetters)
      && reloadedScale.classTopMin[reloadedScale.classIds.indexOf(overrideId)] === 95
      && reloadedScale.classOwn.filter((o) => o).length === 1
      && await letterAt(89.5) === reloadedScale.docLetters[0]
      && await letterAt(94, overrideId) === reloadedScale.docLetters[1],
    scaleBoot ? JSON.stringify(reloadedScale.docMins.slice(0, 3)) + ' with '
      + reloadedScale.classOwn.filter((o) => o).length + ' class override(s)'
      : 'the loading screen never came down');

  /* And off again, which writes the `null` sentinel rather than an empty array — "use the document
     default" is a thing the document already has a word for, and the next reader of that field has
     to be able to tell the two apart. */
  await clickSel('#scaleSubjects [data-scale-subject="' + overrideId + '"]');
  await clickSel('#scaleOverride [data-scale-override-off]');
  const releasedScale = await evalJs('window.__scale()');
  const releasedAt = releasedScale.classIds.indexOf(overrideId);
  check('turning the override off writes null rather than an empty array, and the class is back on the document bands',
    releasedScale.classScaleKind[releasedAt] === 'null'
      && releasedScale.classOwn[releasedAt] === false
      && releasedScale.classOwn.every((o) => o === false)
      && releasedScale.inherited === releasedScale.letters.length
      && releasedScale.classTopMin[releasedAt] === releasedScale.docMins[0]
      && await letterAt(94, overrideId) === releasedScale.docLetters[0],
    'letterScale holds ' + releasedScale.classScaleKind[releasedAt] + '; 94% is now '
      + await letterAt(94, overrideId) + ' in that class again');

  await evalJs("window.planbook.closeModal('letterScaleModal');"
    + "window.planbook.closeModal('classesModal');1");
}
}
