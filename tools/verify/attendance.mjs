/* attendance.mjs — attendance: the registry, three states in a grid, and no P in the document
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

import { nodeToday, thisWeek, lastWeek, daysApart, tomorrow } from './lib-dates.mjs';
import { passes } from './attendance-passes.mjs';

export async function run(h) {
const { check, skip, send, evalJs, has, clickSel, KILL_ANIM, INSTALL_WALKER, waitForBoot, seam } = h;

/* ───────────────── attendance ─────────────────
 *
 * WO-2.1's twelve acceptance lines, driven through the controls a teacher touches: the screen is
 * opened by clicking the state line on a real card, marks are made by tapping real cells, past
 * days are unlocked with the real pencil, and the class is dropped and un-dropped with the real
 * column head. The window.planbook.attendance seam is used only to READ — what stateOf() says
 * about a class, what the app thinks today is — because the alternative is a second copy of "is
 * this class taken" living in this file, where it could agree with itself and disagree with the
 * app. That is precisely the failure the three states exist to prevent.
 *
 * ONE EXCEPTION TO READ-ONLY, and it is named here because it is the only one: acceptance line 9
 * says future dates are blocked, and a blocked path has no control to click. The check that proves
 * it calls setMark() through the seam with tomorrow's date and asserts nothing lands. Driving it
 * from the UI is impossible by construction, which is the claim.
 *
 * THREE CLAIMS HERE ARE ABOUT WHAT IS *NOT* IN THE DOCUMENT, and an absence check with nothing
 * behind it is not evidence — so each is paired with the presence that proves the fixture was
 * real. "No P is stored" is asserted over a class of 26 with four exceptions on it, counted; the
 * twenty-two silent students are the claim, and the four loud ones are what makes the silence mean
 * something. "No submit step" is asserted as the absence of a form and of any button whose label
 * is save/submit/finalize/apply, on a dialog whose other controls are enumerated in the same read.
 * "No future column" is asserted against a window whose six dates this file computes for itself.
 *
 * WHAT IS NOT HERE, AND IS OWED TO A HUMAN: WO-2.1's acceptance lines 2, 6 and 8. Six columns
 * readable on the iPad the owner actually holds, twenty-five students in under fifteen seconds, and
 * a "not today" strip legible across a lit classroom all need a thumb, a device and eyes. This
 * section measures what a desk can measure about them — six columns rendered and no sideways
 * scroll at 800px and at an emulated coarse 1024px, a path that is one tap per absence with
 * nothing to submit, and a banner that is on screen and carries the date in words — and none of
 * those three is the line. They stay 👤 items in TESTING.md.
 *
 * ── WO-2.10, AND WHY MOST OF THIS SECTION MOVED RATHER THAN GREW ──
 *
 * A cell is an OBJECT now — `{ code, at?, note? }` — and a class that has been started holds a `U`
 * for every student nobody has reached yet. Both of those change what every read below sees, so the
 * reader was re-pointed rather than extended: `values` counts `.code`, and it counts what it finds
 * however deep, so a cell that is still a bare string shows up as its own entry rather than as
 * `[object Object]` in a tally nobody reads.
 *
 * THE THREE NEW CLAIMS THAT ARE ABOUT AN ABSENCE, each paired with the presence that makes it mean
 * something. "One tap changes no other cell" is asserted by reading all twenty-six cells before and
 * after, not by reading the one that was tapped — the work order says so in as many words, and a
 * check that read only the tapped cell would have passed the build this work order exists to
 * replace. "No bare string anywhere" is asked of every cell in the whole document, across every
 * year-level fixture this run has written, with the object count printed beside it so a zero cannot
 * pass for a clean sweep. And "no stray tardy time" is asserted on a cell that DOES carry a time —
 * the dismissal's — so that "no `at`" cannot be true because nothing was ever stamped.
 */

console.log('\n--- attendance ---');

/* Flushed then reloaded, for the reason every section here reloads (tools/README.md trap 6) and
   for one that belongs to this feature: the registry is filled from the document when its dialog
   opens, and a screen that renders only because the module still holds what it just wrote is a
   screen that is empty on the teacher's next launch — which for attendance is a period of a term
   gone. */
await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
/*
  THE VIEWPORT IS PINNED HERE, AND IT WAS NOT BEFORE WO-2.8. Every claim in this section is about a
  six-column grid, and how many columns the grid draws is a function of the viewport: src/attendance.js
  budgets the width and shows fewer days rather than scrolling sideways. Until the Passes column
  landed, the browser's own default window happened to be wide enough for six and nobody had to say
  so — which is a check whose premise is an accident of the harness, and the accident stopped
  holding the moment a 160px column joined the table. 1280 is a laptop, it is where six columns fit
  on a fine pointer with the pass column in place, and it is now stated rather than inherited.
  Cleared at the end of the section, before the coarse touch sweep sets its own.
*/
await send('Emulation.setDeviceMetricsOverride',
  { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Emulation.setTouchEmulationEnabled', { enabled: false });
await send('Page.reload');
await new Promise(r => setTimeout(r, 600));
const attBooted = await waitForBoot();
await evalJs(KILL_ANIM);
await evalJs(INSTALL_WALKER);

/*
  AND THE TERM DATES ARE CLEARED OFF EVERY CLASS HERE, WHICH IS A PREMISE OF THIS SECTION RATHER
  THAN A TIDY-UP (WO-2.50).

  Everything below marks, takes and drops classes on TODAY, and from WO-2.50 a class can only be
  marked on a day inside one of its terms. The classes this section inherits come out of the classes
  & terms section, where the last thing done to the first one is the "messy dates" fixture — term 1
  starting 2026-08-26, term 2 overlapping it, term 3 blank, term 4 backwards — which are exactly the
  dates that acceptance line asks NOT to be repaired, and which leave today outside every term of
  that class for the eight days before term 1 begins. The first run after WO-2.50 landed crashed
  there, on `[data-attendance-take]`, against a correct app: the class was locked, so the row drew
  the term-editor door and nothing else.

  This is the same shape as the viewport line above it. A section whose premise is an accident of
  what an earlier section left is a section that goes red for a reason with nothing to do with its
  subject — so the premise is stated here instead. The dates go rather than being replaced, because
  "no dated term" is the unbounded case (src/classes.js's outOfTermGap) and it is the one this
  section wants: it is about marking, not about terms. Every block below that is about term dates —
  WO-2.4's totals, WO-2.13's render cost, WO-2.17's nav, and WO-2.50's own section — plants the
  dates it needs and puts back what it found.
*/
await evalJs(`(async function(){
  var s = window.planbook.store, a = window.planbook.attendance;
  var d = s.getDoc();
  if (!d) return 0;
  var n = 0;
  s.update(function(doc){
    (doc.classes || []).forEach(function(cls){
      (cls.terms || []).forEach(function(t){
        if (t.start || t.end) n += 1;
        t.start = ''; t.end = '';
      });
    });
  });
  a.renderAttendance();
  await s.flush();
  return n; })()`);


/* One page-side reader for the whole section, for the reason window.__cls and window.__ros exist:
   one round trip per check, and the reads cannot drift apart between them. */
const INSTALL_ATT_READER = `(function(){
  function hookOf(b){
    var out = '';
    Array.prototype.slice.call(b.attributes).forEach(function(x){
      if (x.name.indexOf('data-attendance-') === 0) out = x.name + (x.value ? '=' + x.value : '');
    });
    return out;
  }
  window.__att = function(){
    var doc = window.planbook.store.getDoc();
    var a = window.planbook.attendance;
    var openId = window.planbook.classes.getSelectedClassId();
    var open = doc.classes.filter(function(c){ return c.id === openId; })[0] || null;
    var active = doc.classes.filter(function(c){ return !c.archived; });
    /* The registry is a VIEW in <main> since WO-1.13, not a dialog over the cards. So "is it up" is
       a question about #classView, and "did anything open a dialog to get here" is a separate
       question with its own answer below — the two used to be one field, and the acceptance line
       that says a class opens WITHOUT a dialog cannot be asked of a build where they still are.
       (No backticks in this comment: it is inside a template literal.) */
    var view = document.getElementById('classView');
    var home = document.getElementById('homeView');
    var heads = Array.prototype.slice.call(
      document.querySelectorAll('#attendanceHead th[data-attendance-col]'));
    var rows = Array.prototype.slice.call(
      document.querySelectorAll('#attendanceBody tr[data-attendance-row]'));
    var actions = Array.prototype.slice.call(document.querySelectorAll('#attendanceActions button'));
    var cards = Array.prototype.slice.call(document.querySelectorAll('#homeGrid .class-card'));
    function studentById(id){ return doc.students.filter(function(s){ return s.id === id; })[0] || null; }
    return {
      rev: doc.rev,
      appToday: a.todayISO(),
      openClass: openId,
      activeIds: active.map(function(c){ return c.id; }),
      /* Every attendance record in the document, verbatim, WITH ITS KEY SET. A record carrying a
         key nobody meant to write is exactly what one record per class per date is supposed to
         rule out, and a check that only read the fields it expected could not see one. */
      records: doc.attendance.map(function(r){
        return { classId: r.classId, date: r.date, exception: r.exception,
                 keys: Object.keys(r).sort().join(','),
                 marks: r.marks ? JSON.parse(JSON.stringify(r.marks)) : null }; }),
      /* Today's, separately. The document arrives here already holding records on 2026-09-09 and
         after: the class manager section pushes a fixture onto a class it is about to delete and
         onto a neighbour it is not, so that "it deleted the right one" is falsifiable, and the
         neighbour's survives. That residue is kept rather than cleaned away, because it is the only
         thing in the run that can catch a screen which writes onto the wrong date or reads the
         array without filtering. (No backticks in this comment: it is inside a template literal.) */
      today: doc.attendance.filter(function(r){ return r.date === a.todayISO(); })
        .map(function(r){
          return { classId: r.classId, date: r.date, exception: r.exception,
                   keys: Object.keys(r).sort().join(','),
                   marks: r.marks ? JSON.parse(JSON.stringify(r.marks)) : null }; }),
      /* Every mark CODE stored anywhere in the document, counted. The no-P claim is asked of the
         whole document rather than of the class on screen — one P anywhere is the trap sprung,
         whatever date it is on. A cell that is somehow still a bare string is counted under its own
         string, so it lands in this tally as itself rather than being folded in with the objects.
         (No backticks in this comment: it is inside a template literal.) */
      values: (function(){ var out = {};
        doc.attendance.forEach(function(r){
          Object.keys(r.marks || {}).forEach(function(k){
            var c = r.marks[k], code = (c && typeof c === 'object') ? c.code : String(c);
            out[code] = (out[code] || 0) + 1; });
        });
        return out; })(),
      todayValues: (function(){ var out = {};
        doc.attendance.filter(function(r){ return r.date === a.todayISO(); }).forEach(function(r){
          Object.keys(r.marks || {}).forEach(function(k){
            var c = r.marks[k], code = (c && typeof c === 'object') ? c.code : String(c);
            out[code] = (out[code] || 0) + 1; });
        });
        return out; })(),
      /* THE SHAPE OF EVERY CELL IN THE DOCUMENT, which is WO-2.10's acceptance line 13 and is a
         question about storage rather than about the screen. The object count is the guard against
         a vacuous pass: zero bare strings and zero cells at all are the same number otherwise, and
         this run legitimately empties the document between sections. The key tally is every field
         name used by any cell anywhere, so a cell carrying something nobody meant to write is
         visible here rather than only in a record dump.
         (No backticks in this comment: it is inside a template literal.) */
      cells: (function(){ var out = { objects:0, strings:0, other:0, bare:[], keys:{} };
        doc.attendance.forEach(function(r){
          Object.keys(r.marks || {}).forEach(function(k){
            var c = r.marks[k];
            if (typeof c === 'string') { out.strings++; out.bare.push(r.date + ' ' + k + ' = ' + JSON.stringify(c)); }
            else if (c && typeof c === 'object' && !Array.isArray(c)) { out.objects++;
              Object.keys(c).forEach(function(f){ out.keys[f] = (out.keys[f] || 0) + 1; }); }
            else { out.other++; out.bare.push(r.date + ' ' + k + ' = ' + JSON.stringify(c)); }
          });
        });
        return out; })(),
      states: active.map(function(c){ return c.id + '=' + a.stateOf(c.id, a.todayISO()); }).join(' '),
      /* ── WO-2.8, and the first two fields are the whole work order ──
         Both hall-pass collections, verbatim and WITH THEIR KEY SETS, read off the open document.
         An open pass has to be IN HERE rather than in a module variable: Roll Call! keeps its
         active passes in memory, and a build that copied that would answer every question on the
         screen correctly and answer this one with an empty array after a reload. A pass carrying a
         key nobody meant to write — a name, most of all — shows up in the key set rather than
         nowhere.
         (No backticks in this comment: it is inside a template literal.) */
      openPasses: (doc.openPasses || []).map(function(p){
        return { id: p.id, studentId: p.studentId, classId: p.classId, type: p.type, out: p.out,
                 /* WO-2.9: which overdue alert this trip has already given, on the record rather
                    than in a variable — which is what makes "fires once" survive a reload. Read
                    verbatim, and the key set beside it is what proves it does NOT exist before the
                    first alert and does not cross into the log. */
                 alerted: p.alerted,
                 note: p.note, keys: Object.keys(p).sort().join(',') }; }),
      passLog: (doc.passes || []).map(function(p){
        return { id: p.id, studentId: p.studentId, classId: p.classId, type: p.type, out: p.out,
                 back: p.back, minutes: p.minutes, endedBy: p.endedBy, note: p.note,
                 keys: Object.keys(p).sort().join(',') }; }),
      /* Both collections as they SIT, byte for byte, which is the only way to ask WO-2.11's first
         acceptance line: "cancelling leaves the pass log byte-identical" is a claim about the array
         and not about the fields this file remembered to read.
         (No backticks in this comment: it is inside a template literal.) */
      passLogJson: JSON.stringify(doc.passes || []),
      openPassJson: JSON.stringify(doc.openPasses || []),
      /* ── WO-2.3, and the second field is the whole work order ──
         Every calendar event, verbatim and WITH ITS KEY SET, so an entry carrying a field nobody
         meant to write shows up here rather than nowhere. And doc.attendance serialised BYTE FOR
         BYTE, which is the only honest way to ask "authoring an event created no attendance
         record": a count would pass a build that rewrote a record in place, and a field-by-field
         read would pass one that added a field this file forgot to look for. The Traps line is
         about a copy appearing in that array, so the array is compared as a string.
         (No backticks in this comment: it is inside a template literal.) */
      events: (doc.events || []).map(function(e){
        return { id: e.id, kind: e.kind, date: e.date, endDate: e.endDate, title: e.title,
                 classIds: (e.classIds || []).join(','),
                 keys: Object.keys(e).sort().join(',') }; }),
      attJson: JSON.stringify(doc.attendance || []),
      /* THE WHOLE DOCUMENT, serialised. Used once, to ask where a cancelled pass's note went: the
         answer is meant to be nowhere, and "nowhere" is a question about the document rather than
         about the two arrays a check might think to look in. */
      docJson: JSON.stringify(doc),
      /* ── WO-2.11: the pass banner ──
         One card per open pass IN THE CLASS ON SCREEN. Read off the DOM rather than off the
         document, so "the card says he is out" and "the document says he is out" stay two facts
         that can disagree — and the geometry with it, because the acceptance line that matters most
         here is where the banner IS: above the grid, costing the registry no width.
         (No backticks in this block: it is inside a template literal.) */
      passBanner: (function(){
        var box = document.getElementById('attendancePassBanner');
        var wrap = document.getElementById('attendanceGridWrap');
        if (!box) return null;
        var shown = !box.classList.contains('hidden');
        var br = box.getBoundingClientRect(), wr = wrap ? wrap.getBoundingClientRect() : null;
        return { shown: shown, label: box.getAttribute('aria-label') || '',
                 /* Inside the grid would be beside the rows by another name. */
                 insideGrid: !!(wrap && wrap.contains(box)),
                 aboveGrid: !!(wr && br.bottom <= wr.top + 0.5),
                 cards: Array.prototype.slice.call(box.querySelectorAll('.attendance-pass-card'))
                   .map(function(c){
                     var back = c.querySelector('[data-pass-return]');
                     var drop = c.querySelector('[data-pass-cancel]');
                     var note = c.querySelector('[data-pass-note]');
                     /* WO-2.9: the elapsed figure, and the escalation the whole CARD carries. Read
                        as text and as class names rather than as a colour — what is being asserted
                        is that the state moved, and a computed colour would tie the check to a
                        palette this sheet is allowed to re-tune. */
                     var clock = c.querySelector('[data-pass-elapsed]');
                     return { name: ((c.querySelector('.attendance-pass-card-name') || {}).textContent || '').trim(),
                              type: ((c.querySelector('.attendance-pass-card-type') || {}).textContent || '').trim(),
                              out: ((c.querySelector('.attendance-pass-card-out') || {}).textContent || '').trim(),
                              student: back ? back.getAttribute('data-pass-return') : '',
                              cancels: drop ? drop.getAttribute('data-pass-cancel') : '',
                              backText: back ? (back.textContent || '').trim() : '',
                              cancelText: drop ? (drop.textContent || '').trim() : '',
                              cancelLabel: drop ? (drop.getAttribute('aria-label') || '') : '',
                              elapsed: clock ? (clock.textContent || '').trim() : null,
                              elapsedFor: clock ? clock.getAttribute('data-pass-elapsed') : '',
                              over: (c.classList.contains('over-two') ? 2
                                : (c.classList.contains('over-one') ? 1 : 0)),
                              /* The sentinel WO-2.9's "patched, not repainted" check plants: it is
                                 on the card element, so it survives a text patch and dies with a
                                 rebuild. Absent on every other read. */
                              sentinel: c.getAttribute('data-wo29-sentinel') || '',
                              note: note ? note.value : null }; }) }; })(),
      /* Every name in the document, so that "the log is keyed by student id, never by name" can be
         asked as "does the serialised pass log contain any of these strings" rather than as "does
         it contain the fields I remembered to look for". */
      names: doc.students.map(function(s){ return s.first + ' ' + s.last; }),
      passJson: JSON.stringify(doc.passes || []) + JSON.stringify(doc.openPasses || []),
      /* The reason the pass buttons are off, when it is up. It is the acceptance line's "on screen
         rather than a dead control", so it is read as text and not as a class. */
      passNote: (function(){ var n = document.getElementById('attendancePassNote');
        return n && !n.classList.contains('hidden') ? (n.textContent || '').trim() : ''; })(),
      passColumn: document.querySelectorAll('#attendanceHead th.attendance-passes').length,
      /* What the OPEN class's state is on each date the grid is showing, asked of the predicate
         rather than read off the screen — so "the header says Taken" and "the document says taken"
         are two facts that can disagree and be caught disagreeing. */
      colStates: open ? heads.map(function(th){
        var d = th.getAttribute('data-attendance-col');
        return d + '=' + a.stateOf(open.id, d); }).join(' ') : '',
      /* The open class roster as pairs, so this file can derive the order it expects rather than
         asking the app what order it chose. */
      roster: open ? (open.roster || []).map(function(id){
        var s = studentById(id); return s ? [s.last, s.first] : null; }).filter(Boolean) : [],
      /* Which view is in <main>, read off the DOM rather than off the preference: the preference is
         what a reload restores and this is what a teacher is looking at, and a check that asked the
         preference could not tell those two apart. */
      viewShown: !!(view && !view.classList.contains('hidden')),
      homeShown: !!(home && !home.classList.contains('hidden')),
      /* Every overlay on the page that is currently up. Zero is the claim: opening a class is
         navigation now, and a registry that arrived by opening a dialog would be the Traps line's
         first failure mode wearing the new markup. */
      dialogs: Array.prototype.slice.call(document.querySelectorAll('.modal-overlay'))
        .filter(function(m){ return !m.classList.contains('hidden'); }).map(function(m){ return m.id; }),
      /* And what the view IS, in the markup sense: a page-level surface with no dialog semantics
         left on it. A dialog role, an aria-modal, or a close control are what the Traps line calls a
         dialog pretending to be a page. */
      viewRoles: view ? Array.prototype.slice.call(view.querySelectorAll('[role],[aria-modal]'))
        .map(function(e){ return (e.getAttribute('role') || '') + (e.getAttribute('aria-modal') ? '/modal' : ''); })
        .filter(function(r){ return r === 'dialog' || r.indexOf('/modal') >= 0; }) : ['no view'],
      viewCloses: view ? view.querySelectorAll('[data-modal-close]').length : -1,
      /* The way back out, and there are two doors on one hook — the tab at the head of the class
         row and the button in the view's own panel header. ON SCREEN ONLY, which is the whole point
         since WO-1.13: both live in the markup at all times, one of them inside the view that is
         hidden and one of them on a strip that is not drawn on the grid, so a count of the DOM would
         report the same number from either screen and could not tell "two ways back from a class"
         from "a way back offered on the screen you are already on". */
      homeDoors: Array.prototype.slice.call(document.querySelectorAll('[data-view-home]'))
        .filter(function(b){ return b.offsetParent !== null; })
        .map(function(b){ return (b.textContent || '').trim(); }),
      className: (document.getElementById('attendanceClassName') || {}).textContent,
      dateText: (document.getElementById('attendanceDate') || {}).textContent,
      stateText: (document.getElementById('attendanceState') || {}).textContent,
      stateClass: (document.getElementById('attendanceState') || {}).className,
      note: (function(){ var n = document.getElementById('attendanceNote');
        return n && !n.classList.contains('hidden') ? n.textContent : ''; })(),
      /* The "you are not on today" strip: whether it is up, and what it says. */
      banner: (function(){ var b = document.getElementById('attendanceBanner');
        return { shown: !!(b && !b.classList.contains('hidden')),
                 text: b ? (b.textContent || '').trim() : '' }; })(),
      actions: actions.map(function(b){
        return { text: (b.textContent || '').trim(), hook: hookOf(b),
                 pressed: b.getAttribute('aria-pressed') }; }),
      /* One entry per column: the date it will write, the word above it, the classes that paint it,
         and the one control that belongs to that day. */
      columns: heads.map(function(th){
        var btn = th.querySelector('button');
        return { date: th.getAttribute('data-attendance-col'),
                 dow: ((th.querySelector('.attendance-day-dow') || {}).textContent || '').trim(),
                 shown: ((th.querySelector('.attendance-day-date') || {}).textContent || '').trim(),
                 chip: ((th.querySelector('.attendance-day-state') || {}).textContent || '').trim(),
                 cls: th.className,
                 btn: btn ? hookOf(btn) : '',
                 btnText: btn ? (btn.textContent || '').trim() : '' }; }),
      pager: Array.prototype.slice.call(document.querySelectorAll('#attendancePager button'))
        .map(function(b){ return { text: (b.textContent || '').trim(),
                                   value: b.getAttribute('data-attendance-page'),
                                   disabled: !!b.disabled, title: b.title || '' }; }),
      pills: Array.prototype.slice.call(document.querySelectorAll('#attendancePills .pill'))
        .map(function(b){ return { code: b.getAttribute('data-attendance-filter'),
                                   active: b.classList.contains('active'),
                                   pressed: b.getAttribute('aria-pressed') }; }),
      sorts: Array.prototype.slice.call(document.querySelectorAll('#attendanceSort button'))
        .map(function(b){ return { which: b.getAttribute('data-attendance-sort'),
                                   active: b.classList.contains('active') }; }),
      rowCount: rows.length,
      /* Per row: whose it is, the name as drawn, and the glyph in every column of that row read
         left to right — "P?PP-P" is a whole row's story in six characters, and it is what makes a
         hole in the grid a thing this file can see rather than infer.

         THE GLYPH IS READ OFF THE CELL, NOT OFF THE td. Since WO-2.10 a td can also hold the time
         caption under the circle, so reading the td's own textContent yields "T8:14a" and every
         check that compares a row to a string of letters breaks on four characters that are not a
         mark. Same trap, and the same answer, as the avatar initials in the name cell below.
         (No backticks in this comment: it is inside a template literal.) */
      rows: rows.map(function(r){
        var tds = Array.prototype.slice.call(r.querySelectorAll('td[data-attendance-col]'));
        /* Read .attendance-student-name, not .attendance-name. The name cell holds an avatar beside
           the name, and the avatar's initials are part of the cell's textContent — reading the cell
           yields "AMAurelio, Marcus" and every check that compares or searches on a name breaks on
           two characters that are in nobody's name. Read the element that holds only the name.
           Falls back to the cell so this still reports something if the span is ever removed.
           NO BACKTICKS IN THIS BLOCK: it lives inside the template literal shipped to the browser,
           and one closes it. Same trap as the apostrophe rule in sw.js, found the same way. */
        return { name: ((r.querySelector('.attendance-student-name')
                         || r.querySelector('.attendance-name') || {}).textContent || '').trim(),
                 student: r.getAttribute('data-attendance-row'),
                 codes: tds.map(function(td){
                   var c = td.querySelector('.attendance-cell');
                   return ((c || td).textContent || '').trim(); }).join(''),
                 /* The time under each glyph, in the same left-to-right order, empty where there is
                    none — so "a tardy shows its time on the screen" is a thing this file reads
                    rather than infers from the document. */
                 times: tds.map(function(td){
                   var t = td.querySelector('.attendance-cell-time');
                   return t ? (t.textContent || '').trim() : ''; }),
                 /* And what a screen reader would be told about each cell, which is where the time
                    and the note are said in full. */
                 labels: tds.map(function(td){
                   var c = td.firstElementChild;
                   return c ? (c.getAttribute('aria-label') || '') : ''; }),
                 dates: tds.map(function(td){ return td.getAttribute('data-attendance-col'); }).join(' '),
                 tappable: tds.filter(function(td){
                   return !!td.querySelector('button[data-attendance-cell]'); }).length,
                 /* The one door on the row that leaves this screen (WO-2.53): a count and not a
                    boolean, so "one per row" and "not two" are the same read. */
                 door: r.querySelectorAll('[data-student-detail]').length,
                 /* This row's Passes cell (WO-2.8): which types it offers, how many of them are
                    switched off, whether it shows a Return instead, and the time out beside it.
                    Read off the buttons rather than off the document, so "the screen says he is
                    out" and "the document says he is out" stay two facts that can disagree.
                    (No backticks in this block: it is inside a template literal.) */
                 pass: (function(){
                   var td = r.querySelector('td[data-pass-cell]');
                   if (!td) return null;
                   var issue = Array.prototype.slice.call(td.querySelectorAll('[data-pass-issue]'));
                   var back = td.querySelector('[data-pass-return]');
                   var since = td.querySelector('.attendance-pass-since');
                   return { types: issue.map(function(b){ return b.getAttribute('data-pass-type'); }).join(','),
                            off: issue.filter(function(b){ return b.disabled; }).length,
                            out: !!back,
                            since: since ? (since.textContent || '').trim() : '',
                            label: back ? (back.getAttribute('aria-label') || '') : '' }; })(),
                 named: tds.filter(function(td){
                   var c = td.firstElementChild;
                   return !!(c && c.getAttribute('aria-label')); }).length }; }),
      /* THE WRITE BLOCK IN THE HISTORY DIALOG (WO-2.53), or nulls. It was a <tr> under the row until
         that work order moved it here, and the questions are the same ones: is it drawn, whose mark
         is it about, which of the four cases is on screen, and which of the two controls are offered.
         The "up" field is the dialog being open, which is a different question from the block being
         drawn: the block is absent on a day that accepts no writes, and that is a case with its own
         check. (No backticks in this block: it is inside a template literal, and one closes it.) */
      dialog: (function(){
        var modal = document.getElementById('attendanceHistoryModal');
        var body = document.getElementById('attendanceHistoryBody');
        var box = body ? body.querySelector('[data-attendance-write]') : null;
        var note = box ? box.querySelector('[data-attendance-note]') : null;
        var rows = body ? Array.prototype.slice.call(body.querySelectorAll('tbody tr')) : [];
        var flat = function(el){ return (el.textContent || '').replace(/\\s+/g, ' ').trim(); };
        var rowText = function(label){
          var hit = rows.filter(function(tr){
            var th = tr.querySelector('th');
            return !!th && flat(th).indexOf(label) === 0; })[0];
          return hit ? flat(hit) : ''; };
        var pick = function(sel){ var el = box ? box.querySelector(sel) : null;
          return el ? flat(el) : ''; };
        return { up: !!(modal && !modal.classList.contains('hidden')),
                 open: !!box,
                 student: box ? box.getAttribute('data-attendance-write') : '',
                 text: box ? flat(box) : '',
                 day: pick('.attendance-report-write-day'),
                 mark: pick('.attendance-report-write-mark'),
                 hasNote: !!note, note: note ? note.value : '',
                 noteDate: note ? note.getAttribute('data-attendance-note-date') : '',
                 unconfirms: box ? box.querySelectorAll('[data-attendance-unconfirm]').length : 0,
                 boxes: body ? body.querySelectorAll('[data-attendance-write]').length : 0,
                 /* The three figures beside the block that an un-confirm goes stale, read the way the
                    teacher reads them: the badge in the head, the open term's row, and the year. */
                 rate: body && body.querySelector('.attendance-report-rate')
                   ? flat(body.querySelector('.attendance-report-rate')) : '',
                 openTerm: (function(){
                   var hit = rows.filter(function(tr){
                     return tr.className.indexOf('attendance-report-open') >= 0; })[0];
                   return hit ? flat(hit) : ''; })(),
                 year: rowText('Whole year'),
                 /* And the fourth: the day-by-day table, one string per row of it. */
                 days: rows.filter(function(tr){
                   return !!tr.querySelector('.attendance-report-mark'); }).map(flat) }; })(),
      /* Anything that would turn one tap into two, or one screen into two. */
      submenus: document.querySelectorAll('#attendanceGridWrap select, #attendanceGridWrap [aria-expanded], #attendanceGridWrap details').length,
      /* The Traps line, as a structure rather than as a promise: no form to submit, and no control
         whose label says it commits anything. */
      forms: document.querySelectorAll('#classView form').length,
      submitish: Array.prototype.slice.call(document.querySelectorAll('#classView button'))
        .map(function(b){ return (b.textContent || '').trim(); })
        .filter(function(t){ return /save|submit|finali|apply|^done$|^ok$/i.test(t); }),
      injected: document.querySelectorAll('#attendanceBody b, #attendanceBody i, #attendanceBody script').length,
      /* Does the grid fit, or does it want a sideways swipe? The desk half of acceptance line 2. */
      fit: (function(){ var w = document.getElementById('attendanceGridWrap');
        if (!w) return null;
        return { over: w.scrollWidth - w.clientWidth,
                 page: document.documentElement.scrollWidth - window.innerWidth,
                 viewport: window.innerWidth }; })(),
      /* The home screen, and what each card says about today. The hook is the class its state line
         belongs to, answered by asking which control the line is INSIDE — since WO-1.13 the card is
         one button and the state line is a span in it, so "this line describes the class this tap
         opens" is a containment question rather than an attribute one. A line rendered onto the
         wrong card, or loose in the grid, reads as null here. */
      cards: cards.map(function(c){
        var s = c.querySelector('.class-card-state');
        var b = c.querySelector('.class-card-open');
        return { id: b ? b.getAttribute('data-class-tab') : null,
                 state: s ? (s.textContent || '').trim() : '',
                 cls: s ? s.className : '',
                 controls: c.querySelectorAll('button').length,
                 hook: (s && b && b.contains(s)) ? b.getAttribute('data-class-tab') : null }; })
    };
  };
  /* How a card's state line is actually PAINTED, for the claim that a dropped class and an untaken
     one are told apart without reading fine print. Computed style rather than declared, because
     what a projector shows is the computed one. */
  window.__look = function(id){
    /* The line inside the card that opens that class. It carried a hook of its own until WO-1.13
       made the card one control; it is a span now, found through the control it sits in. */
    var c = document.querySelector('#homeGrid .class-card-open[data-class-tab="' + id + '"]');
    var b = c ? c.querySelector('.class-card-state') : null;
    if (!b) return null;
    var s = getComputedStyle(b);
    return { text: (b.textContent || '').trim(), bg: s.backgroundColor, border: s.borderTopColor,
             style: s.borderTopStyle, color: s.color };
  };
  /* And the same question asked of a COLUMN — the head and a cell under it together, because the
     work order says the three states have to be distinguishable in the header AND in the cells. */
  window.__colLook = function(date){
    var th = document.querySelector('#attendanceHead th[data-attendance-col="' + date + '"]');
    var td = document.querySelector('#attendanceBody td[data-attendance-col="' + date + '"]');
    if (!th || !td || !td.firstElementChild) return null;
    var chip = th.querySelector('.attendance-day-state');
    var hs = getComputedStyle(th);
    var cs = getComputedStyle(td.firstElementChild);
    return { chip: chip ? (chip.textContent || '').trim() : '',
             chipColor: chip ? getComputedStyle(chip).color : '',
             headBg: hs.backgroundColor, headEdge: hs.borderBottomColor,
             headStyle: hs.borderBottomStyle,
             glyph: (td.firstElementChild.textContent || '').trim(),
             cellBg: cs.backgroundColor, cellEdge: cs.borderTopColor,
             cellStyle: cs.borderTopStyle, cellColor: cs.color }; };
  return 1; })()`;

const attSeam = await evalJs("!!(window.planbook && window.planbook.attendance"
  + " && typeof window.planbook.attendance.stateOf === 'function'"
  + " && typeof window.planbook.attendance.todayISO === 'function')");

if (!attBooted || !attSeam) {
  skip('attendance: the registry, three states in a grid, and no P in the document',
    attBooted ? 'no window.planbook.attendance seam on the page — it is kept deliberately for this file to read through, so its absence is a defect and not a stage of the build; see the window.planbook block at the foot of src/shell.js'
      : 'the app did not boot before this section');
} else {
  await evalJs(INSTALL_ATT_READER);
  /* Every dialog in the app, shut. `attendanceModal` is not on this list because there is no such
     thing since WO-1.13 — the registry is a view, and leaving it is navigation rather than a close,
     which is what goHome() below does through the control a teacher taps. */
  const closeAll = () => evalJs("(function(){ ['studentDeleteModal','studentModal',"
    + "'rosterPasteModal','rosterModal','teacherModal','termsModal','classDeleteModal','classesModal',"
    + "'daysOffConfirmModal','daysOffModal',"
    + "'backupModal','restoreConfirmModal','yearModal','aboutModal']"
    + ".forEach(function(m){ window.planbook.closeModal(m); }); return 1; })()");
  /* Back to the class grid, through the tab a teacher taps rather than through the seam — the
     acceptance line is that this control exists and works, so every route this section takes into a
     card goes through it. The header's door is used rather than the panel's because it is on screen
     from either view. */
  const goHome = async () => {
    await closeAll();
    if (await has('#classTabBar [data-view-home]')) await clickSel('#classTabBar [data-view-home]');
  };
  /* Flushed before every read that compares `rev`: the number only moves when a write lands, and a
     read taken while one is still on src/store.js's 800ms debounce reports the rev before it. */
  const read = () => evalJs('(async function(){ await window.planbook.store.flush(); return window.__att(); })()');
  /* One class, opened the way a teacher opens one: back to the grid, then a tap on its card. The
     card is one control since WO-1.13 — the state line inside it is a span — so the tap lands on
     `.class-card-open`, which is the same hook the header tab carries. */
  const openCard = async (id) => {
    await goHome();
    await clickSel('#homeGrid .class-card-open[data-class-tab="' + id + '"]');
    return read();
  };
  /* And the same class reached from the header's tab row instead, for the checks that are about the
     header being navigation. Same hook, same route, different door — but a different GESTURE, and
     that is the owner's call on WO-1.13: cards enter, tabs switch. The row is drawn on the class
     view only, so there is no such thing as tapping a class tab from the grid; what this does is
     what a teacher does, which is arrive on some other class and then switch to this one. */
  const openTab = async (id) => {
    await goHome();
    await clickSel('#homeGrid .class-card-open:not([data-class-tab="' + id + '"])');
    await clickSel('#classTabBar [data-class-tab="' + id + '"]');
    return read();
  };
  /* One cell, by student and by date — the same selector src/attendance.js writes, so a check that
     cannot find it is a check reporting that the hook moved. */
  const cellSel = (student, date) => '#attendanceBody [data-attendance-cell="' + student
    + '"][data-attendance-date="' + date + '"]';
  const tapCell = (student, date) => clickSel(cellSel(student, date));
  /* THE HISTORY DIALOG, WHICH IS WHERE A NOTE AND THE UN-CONFIRM LIVE SINCE WO-2.53. Opened the way
     a teacher opens it — a tap on the student's own name in the grid — and closed through its own ✕,
     because the grid behind it is out of a thumb's reach while it is up: clickSel dispatches at
     viewport coordinates, so a click aimed at a cell under the overlay lands on the overlay. */
  const openHistoryFor = async (student) => {
    await clickSel('#attendanceBody [data-attendance-history="' + student + '"]');
    return read();
  };
  const closeHistory = () => clickSel('#attendanceHistoryModal [data-modal-close]');
  /* One keystroke's worth of typing into the note field, wherever it is drawn. `input` rather than a
     synthesised key press for the reason src/shell.js listens for `input`: that is the event a paste,
     dictation and the software keyboard's own suggestions all produce. */
  const typeMarkNote = (text) => evalJs('(function(){ var e = document.querySelector("[data-attendance-note]");'
    + ' if (!e) return false; e.value = ' + JSON.stringify(text)
    + '; e.dispatchEvent(new Event("input", { bubbles: true })); return true; })()');
  const park = async () => {
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 2, y: 2 });
    await new Promise(r => setTimeout(r, 100));
  };
  /* Every record this section writes on a date that is not today, counted as it goes, so the
     "nothing else was disturbed" clause at the bottom is arithmetic rather than a guess. */
  let pastWrites = 0;

  /*
    A SIXTH CLASS, MADE HERE, THROUGH THE CONTROL A TEACHER MAKES ONE WITH.

    The classes section leaves five on the bar on purpose — it creates seven, deletes one to prove
    delete destroys records, and leaves one archived so the touch section has a delete confirm to
    measure. Five is one short of what this section needs, and the missing one is not a rounding
    detail: the day below is a full day of FIVE classes marked, and the sixth is the one still
    saying "Not taken yet" when the last bell goes. Without it there is no untaken class left at
    the end of the run, and the three states collapse to two in the exact check that exists to
    prove they do not. Made rather than un-archived, because the archived class is another
    section's fixture and handing it back afterwards is a state juggle that fails silently.
  */
  await closeAll();
  await clickSel('header [data-class-manage]');
  await evalJs('(function(){ document.getElementById("classNewInput").value = "Study Hall";'
    + ' return 1; })()');
  await clickSel('[data-class-create] button[type="submit"]');
  await closeAll();

  const start = await read();
  const ids = start.activeIds;

  /* ── the day loads showing all classes, and the third state is the one they are all in ── */

  /*
    `start.today` rather than `start.records`: the residue named in the reader above sits on
    2026-09-09 and after, and a section that demanded an empty attendance array would be asserting
    that no earlier section left anything behind rather than that this screen has written nothing
    yet. The residue is also why this is worth stating as a precondition at all — if a run ever
    happens to fall on one of those dates the two collide, and this line is where that says so out
    loud instead of turning into six confusing failures further down.
  */
  check('every class on the home screen carries today\'s state, and a day nobody has marked is six untaken classes',
    ids.length === 6 && start.cards.length === 6 && start.today.length === 0
      && start.cards.every((c) => c.state === 'Not taken yet' && / not-taken\b/.test(c.cls))
      && start.cards.map((c) => c.hook).join(',') === ids.join(',')
      && start.states === ids.map((id) => id + '=not-taken').join(' '),
    start.cards.length + ' card(s) ' + JSON.stringify(start.cards.map((c) => c.state))
      + '; records already on ' + nodeToday + ' = ' + start.today.length
      + ', on other dates = ' + (start.records.length - start.today.length));

  /* ── the way in, and the fact that looking is not marking ── */

  const marking = ids[0];
  const opened = await openCard(marking);
  check('one tap on a card puts that class\'s registry in the main area — and opening it writes nothing',
    opened.viewShown && !opened.homeShown && opened.dialogs.length === 0
      && opened.openClass === marking && opened.today.length === 0
      && opened.records.length === start.records.length
      && opened.rev === start.rev && opened.className !== '' && opened.dateText !== ''
      && opened.stateText === 'Not taken yet',
    'open on ' + JSON.stringify(opened.className) + ' for ' + JSON.stringify(opened.dateText)
      + '; class view up = ' + opened.viewShown + ', class grid up = ' + opened.homeShown
      + ', dialogs open = ' + JSON.stringify(opened.dialogs)
      + '; records on ' + nodeToday + ' = ' + opened.today.length + ', records in the document '
      + start.records.length + ' -> ' + opened.records.length
      + ', rev ' + start.rev + ' -> ' + opened.rev);

  check('the date it will write is today in LOCAL time — the same day Node reads off this machine',
    opened.appToday === nodeToday && opened.dateText.indexOf(String(Number(nodeToday.slice(8, 10)))) >= 0,
    'the app says ' + opened.appToday + ', this process says ' + nodeToday
      + ', the screen says ' + JSON.stringify(opened.dateText));

  /* ── the columns are a CALENDAR fact, not a record fact ── */

  check('the columns are the last six weekdays by calendar, most recent first, today at the front',
    opened.columns.length === 6
      && opened.columns.map((c) => c.date).join(' ') === thisWeek.join(' ')
      && opened.columns[0].date === nodeToday
      && / attendance-col-today\b/.test(opened.columns[0].cls)
      && opened.columns.every((c) => c.dow.length === 3 && c.shown.indexOf('/') > 0),
    'rendered ' + JSON.stringify(opened.columns.map((c) => c.dow + ' ' + c.date))
      + '; this process expected ' + JSON.stringify(thisWeek));

  /* The precondition that keeps the rest of this section honest: none of the six dates on screen
     may already carry a record for this class, or every claim below about what a tap wrote is a
     claim about somebody else's fixture. */
  const preexisting = opened.records.filter((r) => r.classId === marking && thisWeek.indexOf(r.date) >= 0);
  check('and none of those six dates already holds a record for this class, so what follows is this section\'s own',
    preexisting.length === 0,
    preexisting.length + ' record(s) already on ' + JSON.stringify(thisWeek)
      + ' for the class about to be marked: ' + JSON.stringify(preexisting));

  /* ── the grid itself: 26 rows, six columns, no submenu, nothing to submit ── */

  const expectedOrder = opened.roster.slice()
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])) || String(a[1]).localeCompare(String(b[1])))
    .map((p) => p[0] + ', ' + p[1]);
  check('a class of 26 draws 26 rows against six days, in surname order, with every cell named for a screen reader',
    opened.rowCount === 26
      && JSON.stringify(opened.rows.map((r) => r.name)) === JSON.stringify(expectedOrder)
      && opened.rows.every((r) => r.dates === thisWeek.join(' ') && r.named === 6)
      && opened.submenus === 0 && opened.injected === 0,
    opened.rowCount + ' row(s) of ' + expectedOrder.length + ' — first three '
      + JSON.stringify(opened.rows.slice(0, 3).map((r) => r.name))
      + ', submenu-shaped controls = ' + opened.submenus);

  /* The desk half of acceptance line 2. It is not the line — the line needs an iPad in the owner's
     hands — but a grid that already wants a sideways swipe at 800px would fail it on any device. */
  check('six columns for a class of 26 fit without a sideways swipe, and the page gains no horizontal scroll',
    !!opened.fit && opened.fit.over <= 0 && opened.fit.page <= 0,
    opened.fit ? 'the grid overflows its box by ' + opened.fit.over + 'px and the page by '
      + opened.fit.page + 'px in a ' + opened.fit.viewport + 'px viewport'
      : 'no grid to measure');

  check('there is no submit step on the registry — no form, and no control that says it saves',
    opened.forms === 0 && opened.submitish.length === 0,
    'forms = ' + opened.forms + ', controls whose label reads as a commit = '
      + JSON.stringify(opened.submitish) + '; class-level controls present = '
      + JSON.stringify(opened.actions.map((a) => a.text)));

  /* ── acceptance 9: there is no tomorrow, on screen or in the storage layer ── */

  const laterBtn = opened.pager.filter((b) => b.value === 'later')[0] || {};
  check('no column is later than today, and the control that would go there is disabled and says why',
    opened.columns.every((c) => c.date <= nodeToday)
      && laterBtn.disabled === true && /tomorrow/i.test(laterBtn.title || ''),
    'latest column = ' + opened.columns[0].date + ' against a today of ' + nodeToday
      + '; the pager reads ' + JSON.stringify(opened.pager.map((b) => b.text
        + (b.disabled ? ' (disabled)' : ''))));

  /*
    And the same rule asked of the storage layer, which is the only check in this section that
    WRITES through the seam. There is no control to click, because a blocked path has none; the
    claim is that the refusal is in the writer rather than in the rendering, so a keyboard path
    added in WO-2.5 inherits it.
  */
  const futureTry = await evalJs('(async function(){'
    + ' var before = window.planbook.store.getDoc().attendance.length;'
    + ' window.planbook.attendance.setMark(' + JSON.stringify(opened.rows[0].student)
    + ", 'A', " + JSON.stringify(tomorrow) + ');'
    + ' window.planbook.attendance.takeClass(' + JSON.stringify(tomorrow) + ');'
    + ' window.planbook.attendance.dropClass(' + JSON.stringify(tomorrow) + ');'
    + ' await window.planbook.store.flush();'
    + ' var doc = window.planbook.store.getDoc();'
    + ' return { before: before, after: doc.attendance.length,'
    + '   onTomorrow: doc.attendance.filter(function(r){ return r.date === '
    + JSON.stringify(tomorrow) + '; }).length }; })()');
  check('marking, taking or dropping TOMORROW writes nothing at all — the refusal is in the writer',
    futureTry.before === futureTry.after && futureTry.onTomorrow === 0,
    'three writes aimed at ' + tomorrow + ': records ' + futureTry.before + ' -> '
      + futureTry.after + ', records on that date = ' + futureTry.onTomorrow);

  /*
    ── WO-2.10 acceptance 1: ONE TAP MOVES ONE CELL AND NOTHING ELSE ──

    Read across all twenty-six cells of today's column before and after, because that is the
    acceptance line's own instruction ("verify by reading every other cell, not by looking at one")
    and because the build this work order replaces would have passed a check that read the tapped
    cell alone: there, one tap flipped every other `?` to `P` at once, which is the owner's second
    complaint and the whole reason `U` exists.
  */
  const first = opened.rows[4].student;
  await tapCell(first, nodeToday);
  const oneTap = await read();
  const oneTapRec = oneTap.today.filter((r) => r.classId === marking)[0] || {};
  const others = oneTap.rows.filter((r) => r.student !== first);
  check('one tap on a cell moves that cell to P and changes no other cell on the screen — all twenty-five stay ?',
    oneTap.rows.filter((r) => r.student === first)[0].codes.charAt(0) === 'P'
      && others.length === 25 && others.every((r) => r.codes.charAt(0) === '?')
      && opened.rows.every((r) => r.codes.charAt(0) === '?')
      && oneTap.today.length === 1 && oneTapRec.keys === 'classId,date,marks',
    'today\'s column read ' + JSON.stringify(opened.rows.map((r) => r.codes.charAt(0)).join(''))
      + ' and now reads ' + JSON.stringify(oneTap.rows.map((r) => r.codes.charAt(0)).join(''))
      + ' (the tapped row is #5)');
  /* And the same fact in the document, which is where the `?`s actually live: the tap wrote a `U`
     for the twenty-five it did not confirm, and deleted the entry of the one it did. A build that
     drew the `?`s without storing them would pass the check above and lose them on reload — which
     is the next check but one. */
  check('and the document says so: a U for every student not reached, and no entry at all for the one confirmed',
    Object.keys(oneTapRec.marks || {}).length === 25
      && oneTapRec.marks[first] === undefined
      && Object.keys(oneTapRec.marks).every((id) => oneTapRec.marks[id].code === 'U')
      && oneTap.todayValues.U === 25 && !oneTap.todayValues.P,
    'the record holds ' + Object.keys(oneTapRec.marks || {}).length + ' entr(ies), values = '
      + JSON.stringify(oneTap.todayValues) + ', and the confirmed student\'s entry is '
      + JSON.stringify(oneTapRec.marks[first]));
  /* The column head and the state line count what is left, which is the surface WO-2.10's Traps
     line demands: a class holding `U`s is a meeting with an absence for every one of them, and the
     failure is silent unless something says so. */
  check('and the screen is loud about it — the column head counts what is left and the state line leads with it',
    oneTap.columns[0].chip === '25 to go' && opened.columns[0].chip === 'Not taken'
      && oneTap.stateText === '25 unconfirmed'
      && / unconfirmed\b/.test(oneTap.stateClass)
      && /count as absent/.test(oneTap.note),
    'the column head says ' + JSON.stringify(oneTap.columns[0].chip) + ', the state line says '
      + JSON.stringify(oneTap.stateText) + ' with class ' + JSON.stringify(oneTap.stateClass)
      + ', and the note under it says ' + JSON.stringify(oneTap.note));

  /* ── WO-2.10 acceptance 4: the unconfirmed state is stored, so it survives a reload ── */

  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  const uReboot = await waitForBoot();
  await evalJs(KILL_ANIM);
  await evalJs(INSTALL_WALKER);
  await evalJs(INSTALL_ATT_READER);
  const afterOneTap = await openCard(marking);
  check('one tap, then a reload, still shows one P and twenty-five ? — the unconfirmed state came back out of IndexedDB',
    uReboot && afterOneTap.rowCount === 26
      && afterOneTap.rows.filter((r) => r.codes.charAt(0) === 'P').length === 1
      && afterOneTap.rows.filter((r) => r.codes.charAt(0) === '?').length === 25
      && afterOneTap.rows.filter((r) => r.student === first)[0].codes.charAt(0) === 'P'
      && afterOneTap.columns[0].chip === '25 to go'
      && afterOneTap.cards.filter((c) => c.id === marking)[0].state === '25 unconfirmed',
    uReboot ? 'today\'s column reads '
      + JSON.stringify(afterOneTap.rows.map((r) => r.codes.charAt(0)).join(''))
      + ' and the card says ' + JSON.stringify(afterOneTap.cards.filter((c) => c.id === marking)[0].state)
      : 'the loading screen never came down');

  /* ── WO-2.10 acceptance 7: the cycle, entered at P from a question mark ── */

  const cycler = opened.rows[0].student;
  const seen = [];
  for (let i = 0; i < 6; i++) {
    await tapCell(cycler, nodeToday);
    const step = await read();
    seen.push(step.rows.filter((r) => r.student === cycler)[0].codes.charAt(0));
  }
  const cycled = await read();
  const cycledRec = cycled.today.filter((r) => r.classId === marking)[0] || {};
  check('the cycle from ? reads P → A → E → T → D and returns to P, never to ?, with no menu and no second screen',
    seen.join('') === 'PAETDP'
      && cycled.submenus === 0 && cycled.rowCount === 26
      && cycledRec.marks && cycledRec.marks[cycler] === undefined,
    'six taps on a cell that started on ? walked ' + JSON.stringify(seen)
      + ' (present is stored as nothing at all, so the sixth tap left '
      + JSON.stringify(cycledRec.marks ? cycledRec.marks[cycler] : null) + ' on the record)');

  /* And it did not take the rest of the class with it: the twenty-four nobody has touched are still
     `?`, six taps later. */
  check('and six taps on one cell still change no other cell — twenty-four are ? and the confirmed one is P',
    cycled.rows.filter((r) => r.codes.charAt(0) === '?').length === 24
      && cycled.rows.filter((r) => r.codes.charAt(0) === 'P').length === 2
      && cycled.columns[0].chip === '24 to go',
    'today\'s column reads ' + JSON.stringify(cycled.rows.map((r) => r.codes.charAt(0)).join(''))
      + ' under a head that says ' + JSON.stringify(cycled.columns[0].chip));

  /* ── two absences on a class of 26, and what is in the document at rest ── */

  const absent = opened.rows[2].student;
  const tardy = opened.rows[7].student;
  await tapCell(absent, nodeToday);
  await tapCell(absent, nodeToday);                        /* two taps  -> P, A */
  for (let i = 0; i < 4; i++) await tapCell(tardy, nodeToday);   /* four taps -> P, A, E, T */
  const twoTaps = await read();
  const rec = twoTaps.today.filter((r) => r.classId === marking)[0] || {};
  check('an absence and a tardy are two entries in the document, and the other twenty-four are U or nothing',
    twoTaps.today.length === 1 && rec.classId === marking && rec.date === nodeToday
      && rec.keys === 'classId,date,marks'
      && rec.marks[absent].code === 'A' && rec.marks[tardy].code === 'T'
      && !twoTaps.values.P && twoTaps.rowCount === 26
      && twoTaps.todayValues.A === 1 && twoTaps.todayValues.T === 1,
    'record keys = ' + JSON.stringify(rec.keys) + '; the two marked cells are '
      + JSON.stringify({ absent: rec.marks[absent], tardy: rec.marks[tardy] })
      + ' for ' + twoTaps.rowCount + ' students; mark values today = '
      + JSON.stringify(twoTaps.todayValues) + ', in the whole document = '
      + JSON.stringify(twoTaps.values));
  check('and those two cells say so while the ones nobody has reached still read ?',
    twoTaps.rows.filter((r) => r.codes.charAt(0) === 'A').length === 1
      && twoTaps.rows.filter((r) => r.codes.charAt(0) === 'T').length === 1
      && twoTaps.rows.filter((r) => r.codes.charAt(0) === 'P').length === 2
      && twoTaps.rows.filter((r) => r.codes.charAt(0) === '?').length === 22,
    'today\'s column reads ' + JSON.stringify(twoTaps.rows.map((r) => r.codes.charAt(0)).join('')));

  /*
    ── WO-2.10 acceptance 9: the tardy carries its time, and the screen shows it ──

    Both halves, because they fail separately: the timestamp is in the document with its offset on
    it, and the grid draws the clock time under the letter without anything being opened. The offset
    is asserted rather than assumed — `toISOString()` would produce a `Z` and a different hour, and
    "arrived 12:14" on a class that starts at 08:10 is a wrong fact beside a student's name.
  */
  const tardyCell = rec.marks[tardy];
  const tardyRow = twoTaps.rows.filter((r) => r.student === tardy)[0];
  check('marking a student tardy stores an ISO timestamp with its offset, and the cell shows the time without a report',
    !!tardyCell.at && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(tardyCell.at)
      && tardyCell.at.slice(0, 10) === nodeToday
      && /^\d{1,2}:\d{2}[ap]$/.test(tardyRow.times[0])
      && tardyRow.times[0].slice(0, tardyRow.times[0].indexOf(':'))
        === String(Number(tardyCell.at.slice(11, 13)) % 12 || 12)
      && /tardy at \d{1,2}:\d{2} [AP]M/.test(tardyRow.labels[0])
      && twoTaps.rows.filter((r) => r.times[0]).length === 1,
    'the cell holds ' + JSON.stringify(tardyCell) + ', the grid draws '
      + JSON.stringify(tardyRow.times[0]) + ' under it, a screen reader is told '
      + JSON.stringify(tardyRow.labels[0]) + ', and ' + twoTaps.rows.filter((r) => r.times[0]).length
      + ' of 26 cells in that column carry a time');

  /* ── acceptance 1: a mark lands and survives a reload ── */

  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  const attReboot = await waitForBoot();
  await evalJs(KILL_ANIM);
  await evalJs(INSTALL_WALKER);
  await evalJs(INSTALL_ATT_READER);
  const afterReload = await evalJs('window.__att()');
  const reloadedRec = afterReload.today[0] || {};
  check('a mark lands and survives a reload — it comes back out of IndexedDB, not out of memory',
    attReboot && afterReload.today.length === 1
      && reloadedRec.marks[absent].code === 'A' && reloadedRec.marks[tardy].code === 'T'
      && reloadedRec.marks[tardy].at === tardyCell.at
      && !afterReload.values.P,
    attReboot ? 'the two marks back out of storage = '
      + JSON.stringify({ absent: reloadedRec.marks[absent], tardy: reloadedRec.marks[tardy] })
      : 'the loading screen never came down');
  check('and the card behind it says what the document says, without anything being reopened',
    afterReload.cards.filter((c) => c.id === marking)[0].state === '22 unconfirmed · 1 absent, 1 tardy'
      && / taken\b/.test(afterReload.cards.filter((c) => c.id === marking)[0].cls)
      && / unconfirmed\b/.test(afterReload.cards.filter((c) => c.id === marking)[0].cls),
    JSON.stringify(afterReload.cards.map((c) => c.state)));

  const reopened = await openCard(marking);
  check('and the grid it reopens to shows those two marks in today\'s column, on those two rows',
    reopened.rowCount === 26
      && reopened.rows.filter((r) => r.student === absent)[0].codes.charAt(0) === 'A'
      && reopened.rows.filter((r) => r.student === tardy)[0].codes.charAt(0) === 'T'
      && reopened.stateText === '22 unconfirmed · 1 absent, 1 tardy'
      && reopened.columns[0].date === nodeToday,
    'state line = ' + JSON.stringify(reopened.stateText) + ', today\'s column reads '
      + JSON.stringify(reopened.rows.map((r) => r.codes.charAt(0)).join('')));

  /*
    ── WO-2.10 acceptances 2 and 3: "Everyone's here" finishes the class, and what is left at rest ──

    One tap on the control that is allowed to change every row, on a class that is 22/26 of the way
    through being taken. Every `U` goes and the two real marks stay, which leaves the finished
    document holding exactly what WO-2.1's document held for the same class: two entries out of
    twenty-six students, no `U` and no `P`. Storage at rest is unchanged by this whole work order,
    and this is where that is measured.
  */
  await clickSel('#attendanceActions [data-attendance-take]');
  const finished = await read();
  const finishedRec = finished.today.filter((r) => r.classId === marking)[0] || {};
  check('"Everyone\'s here" resolves every remaining student in one tap, and the document holds no U afterwards',
    Object.keys(finishedRec.marks || {}).length === 2
      && finishedRec.marks[absent].code === 'A' && finishedRec.marks[tardy].code === 'T'
      && !finished.values.U && !finished.values.P
      && finished.rows.filter((r) => r.codes.charAt(0) === 'P').length === 24
      && finished.rows.filter((r) => r.codes.charAt(0) === '?').length === 0
      && finished.columns[0].chip === 'Taken'
      && finished.stateText === 'Taken · 1 absent, 1 tardy',
    'a class of 26 with two exceptions is ' + Object.keys(finishedRec.marks || {}).length
      + ' entr(ies) in the finished document: ' + JSON.stringify(finishedRec.marks)
      + '; U anywhere in the document = ' + (finished.values.U || 0)
      + '; the column reads ' + JSON.stringify(finished.rows.map((r) => r.codes.charAt(0)).join(''))
      + ' under ' + JSON.stringify(finished.columns[0].chip));

  /*
    ── WO-2.10 acceptances 10 and 11: one time, the dismissal's, and nothing left behind ──

    Cycled a cell all the way round on a class that is now finished, so it starts at present and
    every step is a code the teacher chose. Read at three points, because the three claims fail
    separately: `T` stamps a time, `D` past it leaves ONE time and it is the dismissal's, and `P`
    takes the whole entry with it — no code, no `at`, no note.

    A note is typed onto the mark first, so that the last of those three is not vacuously true: a
    build that dropped the code and kept the note would pass an assertion that only counted keys.
  */
  const undone = reopened.rows[4].student;
  await tapCell(undone, nodeToday);
  await tapCell(undone, nodeToday);                       /* A, E */
  const three = await read();
  await tapCell(undone, nodeToday);                       /* T — the first time stamped */
  const atTardy = await read();
  await tapCell(undone, nodeToday);                       /* D — the second, and the only one left */
  const atDismissed = await read();
  const tardyStamp = ((atTardy.today[0] || {}).marks || {})[undone] || {};
  const dismissStamp = ((atDismissed.today[0] || {}).marks || {})[undone] || {};
  check('cycling past T onto D leaves ONE time — the dismissal\'s — and no orphaned tardy time on the cell',
    ((three.today[0] || {}).marks || {})[undone].code === 'E'
      && ((three.today[0] || {}).marks || {})[undone].at === undefined
      && tardyStamp.code === 'T' && !!tardyStamp.at
      && dismissStamp.code === 'D' && !!dismissStamp.at
      && Object.keys(dismissStamp).sort().join(',') === 'at,code'
      && dismissStamp.at >= tardyStamp.at,
    'the cell went ' + JSON.stringify(((three.today[0] || {}).marks || {})[undone]) + ' -> '
      + JSON.stringify(tardyStamp) + ' -> ' + JSON.stringify(dismissStamp)
      + ' (an E carries no time, and the D carries exactly one field beside its code)');

  /* A note on it, then the last tap. The note is written through the block in the student's own
     history dialog, which since WO-2.53 is the only way a teacher can write one. */
  await openHistoryFor(undone);
  const typedOnD = await typeMarkNote('left at the end of the period');
  const noted = await read();
  await closeHistory();
  await tapCell(undone, nodeToday);                       /* back to present */
  const backToTwo = await read();
  check('cycling all the way back to present clears the entry entirely — no code, no time, no note left behind',
    typedOnD
      && (((noted.today[0] || {}).marks || {})[undone] || {}).note === 'left at the end of the period'
      && Object.keys((backToTwo.today[0] || {}).marks || {}).length === 2
      && !((backToTwo.today[0] || {}).marks || {})[undone]
      && backToTwo.today.length === 1 && !backToTwo.values.P
      && backToTwo.rows.filter((r) => r.student === undone)[0].codes.charAt(0) === 'P'
      && backToTwo.rows.filter((r) => r.student === undone)[0].times[0] === ''
      && backToTwo.rev > three.rev,
    'the cell carried ' + JSON.stringify(((noted.today[0] || {}).marks || {})[undone])
      + ' and is now ' + JSON.stringify(((backToTwo.today[0] || {}).marks || {})[undone])
      + '; the record holds ' + JSON.stringify((backToTwo.today[0] || {}).marks)
      + ', rev ' + three.rev + ' -> ' + backToTwo.rev);

  /* All four stored codes on one class, which is what makes the no-P claim below say something:
     every letter this app can store is in the document, and P is not one of them. */
  const eventStudent = reopened.rows[11].student;
  const dismissed = reopened.rows[19].student;
  for (let i = 0; i < 2; i++) await tapCell(eventStudent, nodeToday);   /* A, E */
  for (let i = 0; i < 4; i++) await tapCell(dismissed, nodeToday);      /* A, E, T, D */
  const fourCodes = await read();
  check('all four stored codes reach the document, and the fifth never does',
    JSON.stringify(fourCodes.todayValues) === JSON.stringify({ A: 1, T: 1, E: 1, D: 1 })
      && !fourCodes.values.P
      && Object.keys(fourCodes.today[0].marks).length === 4
      && fourCodes.today[0].keys === 'classId,date,marks',
    'mark values written today = ' + JSON.stringify(fourCodes.todayValues)
      + ', in the whole document = ' + JSON.stringify(fourCodes.values)
      + ', card says ' + JSON.stringify(fourCodes.cards.filter((c) => c.id === marking)[0].state));

  /*
    ── WO-2.10 acceptance 12: a note survives a reload, on the same student, date and class ──

    Written through the block in the student's own history dialog — which is where a note is typed
    since WO-2.53 — read back after a full reload out of IndexedDB, and checked on BOTH sides: the
    field comes back filled for that student on that date, and the note is in the cell rather than
    anywhere else in the document. The date the block is bound to is asserted too — a note that
    landed on today while the block said yesterday would be invisible here otherwise.
  */
  await openHistoryFor(dismissed);
  const dialogOnD = await read();
  const noteTyped = await typeMarkNote('left for the nurse at the bell');
  const typedIn = await read();
  await closeHistory();
  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  const noteReboot = await waitForBoot();
  await evalJs(KILL_ANIM);
  await evalJs(INSTALL_WALKER);
  await evalJs(INSTALL_ATT_READER);
  const backOnCard = await openCard(marking);
  await openHistoryFor(dismissed);
  const reopenedNote = await read();
  const noteCell = ((reopenedNote.today.filter((r) => r.classId === marking)[0] || {}).marks
    || {})[dismissed] || {};
  check('a note typed on a mark survives a reload, on the same student, date and class',
    noteReboot && noteTyped && dialogOnD.dialog.open && dialogOnD.dialog.student === dismissed
      && dialogOnD.dialog.hasNote && dialogOnD.dialog.noteDate === nodeToday
      && typedIn.dialog.note === 'left for the nurse at the bell'
      && noteCell.note === 'left for the nurse at the bell'
      && noteCell.code === 'D' && !!noteCell.at
      && reopenedNote.dialog.open && reopenedNote.dialog.student === dismissed
      && reopenedNote.dialog.note === 'left for the nurse at the bell'
      && backOnCard.rows.filter((r) => r.student === dismissed)[0].labels[0]
        .indexOf('left for the nurse at the bell') > 0
      && reopenedNote.records.filter((r) => JSON.stringify(r.marks || {}).indexOf('nurse') >= 0)
        .length === 1,
    noteReboot ? 'the block opened on ' + JSON.stringify(dialogOnD.dialog.mark) + ' for '
      + JSON.stringify(dialogOnD.dialog.noteDate) + '; after a reload the cell holds '
      + JSON.stringify(noteCell) + ' and the field reads '
      + JSON.stringify(reopenedNote.dialog.note)
      : 'the loading screen never came down');

  /*
    ── the history dialog is where un-confirm lives, and it puts ONE student back ──

    The deliverable is that a student cycled by mistake can be returned to `?`. Driven through the
    dialog's own button — the row's panel until WO-2.53 — and asserted the same way acceptance 1 is:
    every other cell in the column is read, because a control that un-confirmed the class would be a
    control that quietly turned twenty-five present students into absences. The dialog is left OPEN
    across the read, which is what makes the grid behind it a claim about a repaint rather than about
    a redraw on the way back to it.

    THE CELL HAS TO COME BACK AS `{ code: "U" }` AND NOTHING ELSE, and that clause is here because
    this check found the opposite on its first run: the note carried across the code change and left
    `{ code: "U", note: "left for the nurse at the bell" }` — a note about a mark that no longer
    existed, in an entry that is deleted the moment somebody confirms that student. src/attendance.js
    now stops the note at `U` and says why.
  */
  const beforeUnconfirm = await read();
  await clickSel('#attendanceHistoryModal [data-attendance-unconfirm]');
  const unconfirmed = await read();
  const unconfirmedRec = unconfirmed.today.filter((r) => r.classId === marking)[0] || {};
  check('the history dialog puts one student back to ? — and moves no other cell on the screen behind it',
    beforeUnconfirm.rows.filter((r) => r.student === dismissed)[0].codes.charAt(0) === 'D'
      && unconfirmed.rows.filter((r) => r.student === dismissed)[0].codes.charAt(0) === '?'
      && unconfirmedRec.marks[dismissed].code === 'U'
      && Object.keys(unconfirmedRec.marks[dismissed]).join(',') === 'code'
      && unconfirmed.rows.filter((r) => r.codes.charAt(0) === '?').length === 1
      && unconfirmed.columns[0].chip === '1 to go'
      && unconfirmed.rows.map((r) => r.codes.charAt(0)).join('')
        === beforeUnconfirm.rows.map((r) => r.codes.charAt(0)).join('').replace('D', '?'),
    'the cell went from ' + JSON.stringify(beforeUnconfirm.rows.filter((r) => r.student === dismissed)[0].codes.charAt(0))
      + ' to ' + JSON.stringify(unconfirmed.rows.filter((r) => r.student === dismissed)[0].codes.charAt(0))
      + ' and the entry is now ' + JSON.stringify(unconfirmedRec.marks[dismissed])
      + ' — the note and the time went with the mark. The column reads '
      + JSON.stringify(unconfirmed.rows.map((r) => r.codes.charAt(0)).join('')));

  /* And back to where the rest of this section expects it: the dialog shut and the dismissal
     restored. Five taps from `?` — P, A, E, T, D — because a cell that has been un-confirmed enters
     the cycle at present like any other question mark, and the dialog is shut first because the grid
     under it is out of a thumb's reach while it is up. */
  await closeHistory();
  for (let i = 0; i < 5; i++) await tapCell(dismissed, nodeToday);
  const restored4 = await read();
  check('and a re-confirmed cell walks the same cycle from ? — five taps back to dismissed, with a fresh time',
    (((restored4.today.filter((r) => r.classId === marking)[0] || {}).marks || {})[dismissed] || {}).code === 'D'
      && !!(((restored4.today.filter((r) => r.classId === marking)[0] || {}).marks || {})[dismissed] || {}).at
      /* The dialog is SHUT, which is the claim — and not that its body is empty. src/modal.js hides
         the overlay and leaves the last paint inside it, so a check that asked whether the write
         block was still in the DOM would be asking about a screen nobody can see. */
      && restored4.dialog.up === false
      && JSON.stringify(restored4.todayValues) === JSON.stringify({ A: 1, T: 1, E: 1, D: 1 }),
    'the cell is ' + JSON.stringify((((restored4.today.filter((r) => r.classId === marking)[0] || {}).marks || {})[dismissed]))
      + ' and today\'s values are ' + JSON.stringify(restored4.todayValues));

  /* ── acceptance 4: taken with zero exceptions is still a record ── */

  const allPresent = ids[1];
  const beforeTake = await openCard(allPresent);
  await clickSel('#attendanceActions [data-attendance-take]');
  const taken = await read();
  const takenRec = taken.today.filter((r) => r.classId === allPresent)[0] || {};
  check('one tap records a class as met with everyone present, and it is a record rather than a silence',
    takenRec.keys === 'classId,date,marks' && takenRec.exception === undefined
      && JSON.stringify(takenRec.marks) === '{}'
      && taken.states.indexOf(allPresent + '=taken') >= 0
      && taken.stateText === 'Taken · all present'
      && taken.columns[0].chip === 'Taken'
      && taken.today.length === beforeTake.today.length + 1,
    'record = ' + JSON.stringify(takenRec) + '; state line = ' + JSON.stringify(taken.stateText)
      + ', column head = ' + JSON.stringify(taken.columns[0].chip));
  check('and "taken with everyone present" is a different thing in the document from "not taken yet"',
    taken.states.indexOf(allPresent + '=taken') >= 0
      && taken.states.indexOf(ids[5] + '=not-taken') >= 0
      && taken.today.filter((r) => r.classId === ids[5]).length === 0
      && taken.cards.filter((c) => c.id === allPresent)[0].state === 'Taken · all present'
      && taken.cards.filter((c) => c.id === ids[5])[0].state === 'Not taken yet',
    taken.states);

  /* The same control, now pressed, taking it back — offered only while there is nothing to lose. */
  await clickSel('#attendanceActions [data-attendance-untake]');
  const untaken = await read();
  /* The other half of this one is quiet and worth naming: `allPresent` is a class the fixture
     residue may belong to, so an un-take that removed by classId alone — rather than by class AND
     date — would take a record off another day with it. That is a period of a term gone, and it
     would leave no trace on this screen. Hence the baseline comparison rather than a zero. */
  const otherDays = (r) => r.classId === allPresent && r.date !== nodeToday;
  check('the same one tap takes that back, and the day is not taken yet again — without touching another day',
    untaken.today.filter((r) => r.classId === allPresent).length === 0
      && untaken.records.filter(otherDays).length === start.records.filter(otherDays).length
      && untaken.states.indexOf(allPresent + '=not-taken') >= 0
      && untaken.stateText === 'Not taken yet'
      && untaken.cards.filter((c) => c.id === allPresent)[0].state === 'Not taken yet',
    'records for that class today = '
      + untaken.today.filter((r) => r.classId === allPresent).length
      + ' (on other dates ' + start.records.filter(otherDays).length + ' -> '
      + untaken.records.filter(otherDays).length + ', which the un-take must not have touched)'
      + ', state line = ' + JSON.stringify(untaken.stateText));
  /* The refusal that makes the toggle safe, read off the class that is carrying marks: with marks
     on the record the un-take is not offered at all, so nothing on this screen can destroy a mark
     by being tapped a second time. src/attendance.js's untakeClass() states the same rule again in
     code, where it cannot be skipped. */
  const withMarks = await openCard(ids[0]);
  const marksOnIt = Object.keys((withMarks.today.filter((r) => r.classId === ids[0])[0] || {}).marks || {}).length;
  check('the un-take is offered on a class with nothing on it and withheld from one with marks on it',
    untaken.actions.some((a) => a.hook.indexOf('data-attendance-take=') === 0)
      && !untaken.actions.some((a) => a.hook.indexOf('data-attendance-untake=') === 0)
      && marksOnIt > 0
      && !withMarks.actions.some((a) => a.hook.indexOf('data-attendance-untake=') === 0)
      && withMarks.actions.some((a) => a.hook.indexOf('data-attendance-drop=') === 0),
    'on the untaken class: ' + JSON.stringify(untaken.actions.map((a) => a.text))
      + '; on the class carrying ' + marksOnIt + ' marks: '
      + JSON.stringify(withMarks.actions.map((a) => a.text)));

  /* Left taken, so the full-day document below has a class recorded with nobody absent in it. */
  await openCard(allPresent);
  await clickSel('#attendanceActions [data-attendance-take]');

  /* ── acceptance 5: one tap drops a class, one tap undoes it — from today's column head ── */

  /*
    Driven on a class with NO ROSTER, deliberately. "The class can still be marked as met, or as
    not meeting" is a deliverable, and a class whose names have not been pasted yet is exactly the
    case where a screen that hides its table would hide the only two controls that could say so.
    What the cells of a dropped column look like is a separate claim and is measured further down,
    against the twenty-six-name class, where `rows.every(...)` is not vacuously true.
  */
  const dropped = ids[2];
  const emptyClass = await openCard(dropped);
  await clickSel('#attendanceHead [data-attendance-drop]');
  const isDropped = await read();
  const dropRec = isDropped.today.filter((r) => r.classId === dropped)[0] || {};
  check('one tap on today\'s column head says the class did not meet, and writes exactly classId, date and exception',
    dropRec.keys === 'classId,date,exception' && dropRec.exception === 'dropped'
      && dropRec.marks === null && dropRec.date === nodeToday
      && isDropped.states.indexOf(dropped + '=dropped') >= 0
      && isDropped.columns[0].chip === 'Didn’t meet'
      && isDropped.note !== '' && isDropped.stateText === 'Didn’t meet'
      && emptyClass.rowCount === 0 && isDropped.columns.length === 6,
    'record = ' + JSON.stringify(dropRec) + '; the column head says '
      + JSON.stringify(isDropped.columns[0].chip) + ' over a roster of '
      + emptyClass.rowCount + ' student(s), with ' + isDropped.columns.length
      + ' column head(s) still reachable');

  await clickSel('#attendanceHead [data-attendance-undrop]');
  const unDropped = await read();
  check('and one tap undoes it, leaving the day not taken yet rather than claiming everyone was there',
    unDropped.today.filter((r) => r.classId === dropped).length === 0
      && unDropped.states.indexOf(dropped + '=not-taken') >= 0
      && unDropped.stateText === 'Not taken yet' && unDropped.note === ''
      && unDropped.columns[0].chip === 'Not taken'
      && unDropped.cards.filter((c) => c.id === dropped)[0].state === 'Not taken yet',
    'records for that class today = '
      + unDropped.today.filter((r) => r.classId === dropped).length
      + ', column head = ' + JSON.stringify(unDropped.columns[0].chip));

  /* Dropped again, and left that way: the full day below needs one of each state. */
  await clickSel('#attendanceHead [data-attendance-drop]');

  /* ── acceptances 3 and 10: three states in ONE grid, and a hole you can see ──
     Every column of this class's week is acted on except ONE, which is the day "deliberately left"
     that the teacher then has to find without remembering which it was. Each past column takes its
     ✏ first, because a past column that accepted a tap without one would be the deliberate-unlock
     deliverable missing. */

  const holeAt = 3;
  await openCard(marking);
  for (let i = 1; i < 6; i++) {
    if (i === holeAt) continue;
    const date = thisWeek[i];
    await clickSel('[data-attendance-edit="' + date + '"]');
    await clickSel(i === 5 ? '#attendanceActions [data-attendance-drop]'
      : '#attendanceActions [data-attendance-take]');
    pastWrites += 1;
  }
  await clickSel('[data-attendance-page="today"]');
  const week = await read();

  const wantColStates = thisWeek.map((d, i) =>
    d + '=' + (i === holeAt ? 'not-taken' : (i === 5 ? 'dropped' : 'taken'))).join(' ');
  check('a past column takes its unlock, then accepts the same taps today does — and lands on that date',
    week.colStates === wantColStates
      && week.columns.map((c) => c.chip).join('|')
        === ['Taken', 'Taken', 'Taken', 'Not taken', 'Taken', 'Didn’t meet'].join('|')
      /* And with nothing unlocked, exactly ONE of the six cells in a row is a button: today's.
         A past column that took a tap without its ✏ would show six here, and the deliberate
         unlock would be a decoration rather than a gate. */
      && week.rows.every((r) => r.tappable === 1),
    'the document says ' + week.colStates + '; the column heads say '
      + JSON.stringify(week.columns.map((c) => c.chip)) + '; tappable cells per row = '
      + JSON.stringify([...new Set(week.rows.map((r) => r.tappable))]));

  /* Parked first (tools/README.md trap 7). The last thing clicked was inside this grid, so the
     cursor is sitting over a cell — and `.attendance-cell:hover` moves the border colour, which is
     one of the properties this comparison is about. One column measured hovered and two measured
     resting is indistinguishable from three states painted differently, which is the defect being
     looked for. */
  await park();
  const lookTakenCol = await evalJs('window.__colLook(' + JSON.stringify(thisWeek[1]) + ')');
  const lookHoleCol = await evalJs('window.__colLook(' + JSON.stringify(thisWeek[holeAt]) + ')');
  const lookDropCol = await evalJs('window.__colLook(' + JSON.stringify(thisWeek[5]) + ')');
  const apart = (a, b) => a.chip !== b.chip && a.chipColor !== b.chipColor
    && a.glyph !== b.glyph && a.cellBg !== b.cellBg && a.cellColor !== b.cellColor;
  check('a taken day, an untaken one and a dropped one differ in the column head AND in every cell under it',
    !!lookTakenCol && !!lookHoleCol && !!lookDropCol
      && apart(lookTakenCol, lookHoleCol) && apart(lookHoleCol, lookDropCol)
      && apart(lookTakenCol, lookDropCol)
      && lookTakenCol.glyph === 'P' && lookHoleCol.glyph === '?' && lookDropCol.glyph === '–'
      && lookDropCol.cellStyle === 'dashed' && lookHoleCol.cellStyle === 'solid'
      && lookTakenCol.cellStyle === 'solid'
      && lookDropCol.headStyle === 'dashed',
    'taken ' + JSON.stringify(lookTakenCol) + ' · untaken ' + JSON.stringify(lookHoleCol)
      + ' · dropped ' + JSON.stringify(lookDropCol));

  /* And in the document, which is the other half of acceptance 3: a dropped day is a record with
     an exception on it and an untaken day is no record at all. Not two flavours of the same shape. */
  const holeRec = week.records.filter((r) => r.classId === marking && r.date === thisWeek[holeAt]);
  const dropDayRec = week.records.filter((r) => r.classId === marking && r.date === thisWeek[5])[0] || {};
  check('and the same two days are different in the stored document — an exception, against no record at all',
    holeRec.length === 0 && dropDayRec.keys === 'classId,date,exception'
      && dropDayRec.exception === 'dropped',
    'the untaken day holds ' + holeRec.length + ' record(s); the dropped day holds '
      + JSON.stringify(dropDayRec));

  /* Acceptance 10, stated the way a teacher meets it: one glance at the grid, and exactly one
     column is the amber one. Every row agrees, because the wash is on the column and not on a cell. */
  const holeCols = week.columns.filter((c) => c.chip === 'Not taken').map((c) => c.date);
  check('a hole left three days earlier is the one amber column in the grid — found by looking, not by remembering',
    holeCols.length === 1 && holeCols[0] === thisWeek[holeAt]
      && week.rows.every((r) => r.codes.charAt(holeAt) === '?')
      && week.rows.every((r) => r.codes.split('').filter((ch) => ch === '?').length === 1),
    'columns reading "Not taken" = ' + JSON.stringify(holeCols) + ', expected '
      + JSON.stringify([thisWeek[holeAt]]) + '; a row reads '
      + JSON.stringify(week.rows[0].codes));

  /* ── acceptance 7: a date two weeks back, reached from this screen, landing on that date ── */

  await clickSel('[data-attendance-page="earlier"]');
  const paged = await read();
  const twoWeeks = lastWeek[lastWeek.length - 1];
  check('one tap of Earlier reaches the week before, and its oldest column is a fortnight back',
    paged.columns.map((c) => c.date).join(' ') === lastWeek.join(' ')
      && daysApart(nodeToday, twoWeeks) >= 14
      && paged.banner.shown && paged.banner.text.indexOf('not on screen') > 0,
    'showing ' + JSON.stringify(paged.columns.map((c) => c.date)) + '; the oldest is '
      + daysApart(nodeToday, twoWeeks) + ' calendar days back; the strip says '
      + JSON.stringify(paged.banner.text));

  await clickSel('[data-attendance-edit="' + twoWeeks + '"]');
  const unlocked = await read();
  /* The desk half of acceptance 8. Whether it reads across a classroom is a 👤 line; whether it is
     on screen, in words, naming the day, is not. */
  check('unlocking a past day puts a strip on screen that says which day it is, in words, and offers the way back',
    unlocked.banner.shown
      && /You are editing /.test(unlocked.banner.text)
      && unlocked.banner.text.indexOf('not today') > 0
      && unlocked.banner.text.indexOf(String(Number(twoWeeks.slice(8, 10)))) > 0
      && unlocked.dateText.indexOf(String(Number(twoWeeks.slice(8, 10)))) >= 0
      && / attendance-col-editing\b/.test(
        (unlocked.columns.filter((c) => c.date === twoWeeks)[0] || {}).cls || ''),
    'the strip says ' + JSON.stringify(unlocked.banner.text) + '; the column carries '
      + JSON.stringify((unlocked.columns.filter((c) => c.date === twoWeeks)[0] || {}).cls));

  /*
    Four taps on a cell in an unlocked column two weeks back: P, A, E, T. It lands on THAT date and
    nowhere else, it takes that day (a `U` for the twenty-five students it did not confirm, exactly
    as today's column does), and — the clause that is WO-2.10's — the tardy carries NO `at`.

    That last one is a decision this work order left open and src/attendance.js settles: `at` comes
    off the device clock, and the device clock on a Thursday says nothing true about what time a
    student walked in a fortnight ago. A wrong time printed beside a student's name in a
    conversation with a guardian is worse than no time, so a past column records the mark and not
    the moment.
  */
  const backThen = unlocked.rows[1].student;
  for (let i = 0; i < 4; i++) await tapCell(backThen, twoWeeks);
  pastWrites += 1;
  const marked = await read();
  const backRec = marked.records.filter((r) => r.classId === marking && r.date === twoWeeks)[0] || {};
  const backCell = (backRec.marks || {})[backThen] || {};
  check('and a tap there lands on THAT date — not on today, and not on the column beside it',
    backRec.date === twoWeeks && backRec.keys === 'classId,date,marks'
      && backCell.code === 'T' && backCell.at === undefined
      && Object.keys(backCell).join(',') === 'code'
      && Object.keys(backRec.marks).length === 26
      && Object.keys(backRec.marks).filter((id) => backRec.marks[id].code === 'U').length === 25
      && marked.records.filter((r) => r.classId === marking && r.date === nodeToday)[0].marks[backThen] === undefined
      && marked.records.filter((r) => r.classId === marking && r.date === lastWeek[4]).length === 0,
    'the cell on ' + twoWeeks + ' is ' + JSON.stringify(backCell) + ' — no time, because the device '
      + 'clock is not evidence about a fortnight ago — beside '
      + Object.keys(backRec.marks || {}).filter((id) => backRec.marks[id].code === 'U').length
      + ' unconfirmed students; today\'s record is still ' + JSON.stringify(
        marked.records.filter((r) => r.classId === marking && r.date === nodeToday)[0].marks));

  /* Back where a teacher would leave it. "Back to today" is the control on the strip itself, which
     is the one a teacher reaches for, so it is the one driven here. */
  await clickSel('#attendanceBanner [data-attendance-page="today"]');
  const home = await read();
  check('the way back is one tap on the strip, and it lands on today with the strip gone',
    !home.banner.shown && home.columns.map((c) => c.date).join(' ') === thisWeek.join(' ')
      && home.dateText.indexOf(String(Number(nodeToday.slice(8, 10)))) >= 0
      && home.columns.filter((c) => / attendance-col-editing\b/.test(c.cls)).length === 0,
    'showing ' + JSON.stringify(home.columns.map((c) => c.date)) + ', strip up = '
      + home.banner.shown);

  /* ── search, the filter pills and the sort pair ── */

  /* The term is taken out of the roster on screen rather than written in here: a literal that
     happens not to be in this class's twenty-six names makes the check fail with an empty result,
     which is indistinguishable from a search that does not work. */
  const typed = String(home.rows[1].name.split(',')[0] || '').toLowerCase();
  const searchHit = home.rows.filter((r) => r.name.toLowerCase().indexOf(typed) >= 0).length;
  await evalJs('(function(){ var e = document.getElementById("attendanceSearch");'
    + ' e.value = ' + JSON.stringify(typed) + ';'
    + ' e.dispatchEvent(new Event("input", { bubbles: true })); return 1; })()');
  const searched = await read();
  await evalJs('(function(){ var e = document.getElementById("attendanceSearch"); e.value = "";'
    + ' e.dispatchEvent(new Event("input", { bubbles: true })); return 1; })()');
  await clickSel('[data-attendance-filter="A"]');
  const filtered = await read();
  await clickSel('[data-attendance-filter="all"]');
  await clickSel('[data-attendance-sort="first"]');
  const sorted = await read();
  await clickSel('[data-attendance-sort="last"]');
  const byFirst = home.roster.slice()
    .sort((a, b) => String(a[1]).localeCompare(String(b[1])) || String(a[0]).localeCompare(String(b[0])))
    .map((p) => p[0] + ', ' + p[1]);
  check('search narrows the rows, a pill shows only that mark, and First/Last reorders the whole class',
    typed.length >= 3 && searchHit > 0 && searchHit < 26 && searched.rowCount === searchHit
      && searched.rows.every((r) => r.name.toLowerCase().indexOf(typed) >= 0)
      && filtered.rowCount === filtered.rows.filter((r) => r.codes.charAt(0) === 'A').length
      && filtered.rowCount > 0 && filtered.pills.filter((p) => p.active).length === 1
      && filtered.pills.filter((p) => p.code === 'A')[0].active
      && sorted.rowCount === 26
      && JSON.stringify(sorted.rows.map((r) => r.name)) === JSON.stringify(byFirst)
      && sorted.sorts.filter((s) => s.active).map((s) => s.which).join('') === 'first',
    'search for ' + JSON.stringify(typed) + ' left ' + searched.rowCount + ' of 26 ('
      + JSON.stringify(searched.rows.map((r) => r.name)) + '); the absent pill left '
      + filtered.rowCount + '; sorted by first name the top three are '
      + JSON.stringify(sorted.rows.slice(0, 3).map((r) => r.name)));

  /* ── a second class with a roster, so the full day has marks in more than one place ── */

  const second = ids[3];
  await closeAll();
  await clickSel('[data-class-tab]', 3);
  await clickSel('header [data-roster-manage]');
  /* Deliberately not in alphabetical order: the grid's own order is the claim below. */
  for (const name of ['Zeta, Ada', 'Alpha, Bo', 'Mid, Cy']) {
    await evalJs('(function(){ var e = document.getElementById("rosterNewInput"); e.value = '
      + JSON.stringify(name) + '; return 1; })()');
    await clickSel('[data-roster-create] button[type="submit"]');
  }
  const secondOpen = await openCard(second);
  check('a second class marks its own roster, in its own order, without touching the first',
    secondOpen.rowCount === 3
      && JSON.stringify(secondOpen.rows.map((r) => r.name)) === JSON.stringify(['Alpha, Bo', 'Mid, Cy', 'Zeta, Ada'])
      && secondOpen.rows.every((r) => r.codes === '??????')
      && Object.keys(secondOpen.today.filter((r) => r.classId === ids[0])[0].marks).length === 4,
    secondOpen.rowCount + ' row(s) ' + JSON.stringify(secondOpen.rows.map((r) => r.name))
      + '; the first class still holds '
      + Object.keys(secondOpen.today.filter((r) => r.classId === ids[0])[0].marks).length + ' marks');

  /* One tap, which takes that class and leaves the other two students unconfirmed — the half-taken
     class the day below needs, and the fixture the next check is built on. */
  await tapCell(secondOpen.rows[2].student, nodeToday);

  /*
    ── WO-2.10 acceptance 8: a student added AFTER a class was taken gets no mark for it ──

    The `U`s are written once, when the record is created, and never again. So a student who joins
    the roster afterwards has no entry on that day at all — which reads as present, because present
    is the absence of a mark, and which is the only honest answer: nobody failed to account for a
    student who was not on the list. A build that re-seeded on every write would give them an
    absence for a class they were not in, retroactively, and it would do it silently.
  */
  const beforeLate = await read();
  await closeAll();
  await clickSel('header [data-roster-manage]');
  await evalJs('(function(){ var e = document.getElementById("rosterNewInput");'
    + ' e.value = "Late, Ida"; return 1; })()');
  await clickSel('[data-roster-create] button[type="submit"]');
  const late = await openCard(second);
  const lateRec = late.today.filter((r) => r.classId === second)[0] || {};
  const lateStudent = late.rows.filter((r) => r.name === 'Late, Ida')[0] || {};
  check('a student added to the roster after a class was taken does not acquire a mark for it retroactively',
    late.rowCount === 4 && !!lateStudent.student
      && lateRec.marks[lateStudent.student] === undefined
      && Object.keys(lateRec.marks || {}).length
        === Object.keys((beforeLate.today.filter((r) => r.classId === second)[0] || {}).marks || {}).length
      && Object.keys(lateRec.marks || {}).length === 2
      && lateStudent.codes.charAt(0) === 'P'
      && late.columns[0].chip === '2 to go',
    'the class went from 3 students to ' + late.rowCount + ' and the record still holds '
      + Object.keys(lateRec.marks || {}).length + ' entr(ies) ' + JSON.stringify(lateRec.marks)
      + '; the new row reads ' + JSON.stringify(lateStudent.codes)
      + ' under a head that says ' + JSON.stringify(late.columns[0].chip));

  /* One more class taken with nobody absent, so the day is five classes. */
  await openCard(ids[4]);
  await clickSel('#attendanceActions [data-attendance-take]');

  /* ── acceptance 12: a full day of five classes, and no P anywhere in it ── */

  await closeAll();
  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  const dayReboot = await waitForBoot();
  await evalJs(KILL_ANIM);
  await evalJs(INSTALL_WALKER);
  await evalJs(INSTALL_ATT_READER);
  const day = await evalJs('window.__att()');

  const wantStates = [ids[0] + '=taken', ids[1] + '=taken', ids[2] + '=dropped',
    ids[3] + '=taken', ids[4] + '=taken', ids[5] + '=not-taken'].join(' ');
  /* Five records for today, and the document is otherwise exactly as this section found it plus
     the past days it wrote on purpose, counted as it went. The second clause is what makes the
     first mean "the app wrote five" rather than "there are five here now". */
  check('after a full day of five classes the document holds five records for today and every one of the three states',
    dayReboot && day.today.length === 5 && day.states === wantStates
      && day.records.length === start.records.length + 5 + pastWrites
      && day.today.filter((r) => r.exception).length === 1
      && day.today.filter((r) => r.keys === 'classId,date,marks').length === 4
      && day.today.filter((r) => r.classId === ids[5]).length === 0,
    dayReboot ? day.today.length + ' record(s) on ' + nodeToday + ': ' + day.states
      + '; records in the whole document ' + start.records.length + ' -> ' + day.records.length
      + ' against ' + pastWrites + ' deliberate write(s) on past dates'
      : 'the loading screen never came down');
  /* The exact tally is asked of today, where this section knows every tap it made. The no-P claim
     is asked of the WHOLE document, where a stray P written on any date by anything would show —
     and it is asked twice, once as an absent key and once as the complete key set. */
  check('and there is no P in it — not one, across five classes, six days and every student in them',
    !day.values.P && Object.keys(day.values).sort().join('') === 'ADETU'
      && JSON.stringify(day.todayValues) === JSON.stringify({ A: 1, T: 1, E: 1, D: 1, U: 2 })
      && day.today.filter((r) => r.marks).reduce((n, r) => n + Object.keys(r.marks).length, 0) === 6,
    'mark values written today = ' + JSON.stringify(day.todayValues)
      + ', every value stored anywhere in the document = ' + JSON.stringify(day.values)
      + ' across ' + day.today.filter((r) => r.marks).length + ' met classes');

  /*
    ── WO-2.10 acceptance 13: every cell in the document is an object ──

    Asked of storage rather than of the screen, and of the WHOLE document rather than of the class
    on screen — every year-level fixture this run has written passes through here, including the
    ones the classes section pushed straight into the store. `objects` is printed beside the zero
    because a document with no cells in it would answer "no bare strings" just as happily; `keys`
    is every field name any cell carries, so a cell holding something nobody meant to write shows
    up here rather than in a record dump nobody reads.
  */
  check('every cell in the document is an object — not one bare string anywhere, U and untimed codes included',
    day.cells.strings === 0 && day.cells.other === 0 && day.cells.objects >= 30
      && Object.keys(day.cells.keys).sort().join(',') === 'at,code'
      && day.cells.keys.code === day.cells.objects,
    day.cells.objects + ' object cell(s), ' + day.cells.strings + ' bare string(s), '
      + day.cells.other + ' of some other shape'
      + (day.cells.bare.length ? ' — ' + JSON.stringify(day.cells.bare.slice(0, 5)) : '')
      + '; every field name in use across them = ' + JSON.stringify(day.cells.keys));

  check('and each card on the home screen states its own class\'s answer',
    JSON.stringify(day.cards.map((c) => c.state)) === JSON.stringify([
      'Taken · 4 marked', 'Taken · all present', 'Didn’t meet', '2 unconfirmed',
      'Taken · all present', 'Not taken yet']),
    JSON.stringify(day.cards.map((c) => c.state)));
  /* WO-2.10 acceptance 6, on the surface it names: the half-taken class is the one that has to be
     loud, and it is loud in the same place the other five are quiet. Its own palette too — a green
     "taken" line over two students nobody looked at is the silence this is for. */
  check('and the half-taken class names its unconfirmed count on the card, in the caution palette',
    /^2 unconfirmed$/.test(day.cards.filter((c) => c.id === ids[3])[0].state)
      && / unconfirmed\b/.test(day.cards.filter((c) => c.id === ids[3])[0].cls)
      && !/ unconfirmed\b/.test(day.cards.filter((c) => c.id === ids[1])[0].cls),
    'the half-taken card says ' + JSON.stringify(day.cards.filter((c) => c.id === ids[3])[0].state)
      + ' with class ' + JSON.stringify(day.cards.filter((c) => c.id === ids[3])[0].cls)
      + '; the finished one says '
      + JSON.stringify(day.cards.filter((c) => c.id === ids[1])[0].state));

  /*
    And the three states are told apart ON THE CARD without reading the words — the same claim the
    column heads answer above, asked of the surface WO-1.13 changed. It matters more now than it did
    at WO-2.1: the state line stopped being a control of its own, so if it had also stopped carrying
    its palette it would have quietly become a grey sentence on a grey card.

    Parked first (tools/README.md trap 7): the last click landed on a card, and a card under the
    cursor is a card wearing `.class-card:hover` — one measured hovered and two measured resting is
    indistinguishable from three states painted differently, which is the defect being looked for.
  */
  await park();
  const cardTaken = await evalJs('window.__look(' + JSON.stringify(ids[1]) + ')');
  const cardDropped = await evalJs('window.__look(' + JSON.stringify(ids[2]) + ')');
  const cardUntaken = await evalJs('window.__look(' + JSON.stringify(ids[5]) + ')');
  const cardsApart = (a, b) => a.text !== b.text && a.bg !== b.bg && a.color !== b.color;
  check('and a taken class, a dropped one and an untaken one are three different cards to look at, not three sentences to read',
    !!cardTaken && !!cardDropped && !!cardUntaken
      && cardsApart(cardTaken, cardDropped) && cardsApart(cardDropped, cardUntaken)
      && cardsApart(cardTaken, cardUntaken)
      && cardDropped.style === 'dashed' && cardTaken.style === 'solid'
      && cardUntaken.style === 'solid',
    'taken ' + JSON.stringify(cardTaken) + ' · dropped ' + JSON.stringify(cardDropped)
      + ' · untaken ' + JSON.stringify(cardUntaken));

  /* ── WO-1.13: the reload above was taken from a class, so it comes back to that class ──
     `openClassId` has always survived a reload and until now it meant nothing on screen; this is
     the other half. The class is ids[4], which is where the last tap of the day left the app, and
     what has to come back is BOTH: that class open, and its working surface in <main> rather than
     the grid. The reload is the one already being taken for the day's tally above, so this costs
     no second boot.

     It is also where the class view's markup is asserted to be a page and not a dialog wearing new
     class names — no `role="dialog"`, no `aria-modal`, no close control anywhere inside it. That is
     the Traps line, and the moment to ask it is after a reload, when everything on screen was built
     from the markup rather than from whatever the run had done to it. */
  check('a reload taken from a class comes back to that class\'s view, not to a blank main area or the grid',
    day.viewShown && !day.homeShown && day.openClass === ids[4]
      && day.className !== '' && day.dialogs.length === 0
      /* Painted, not merely revealed: the six day columns are built by the renderer at boot, and an
         empty grid under a visible view would be a view restored without its screen. Columns rather
         than rows, because the class this reload lands on legitimately has an empty roster and the
         grid keeps its head for exactly that case (renderRows in src/attendance.js). */
      && day.columns.length === 6 && day.colStates !== '',
    'class view up = ' + day.viewShown + ', class grid up = ' + day.homeShown
      + ', open class = ' + JSON.stringify(day.openClass) + ' of ' + JSON.stringify(ids[4])
      + ', the screen says ' + JSON.stringify(day.className) + ' over '
      + day.columns.length + ' day column(s) and ' + day.rowCount + ' row(s)'
      + ', dialogs open = ' + JSON.stringify(day.dialogs));
  check('and that view is a page rather than a dialog wearing a new name — no dialog role, no aria-modal, no close control',
    day.viewRoles.length === 0 && day.viewCloses === 0 && day.homeDoors.length === 2,
    'dialog semantics found inside the view = ' + JSON.stringify(day.viewRoles)
      + ', close controls = ' + day.viewCloses + ', ways back to the grid = '
      + JSON.stringify(day.homeDoors));

  /* ── every open starts on today ──
     The screen is opened with a class walking through the door, and finding it where it was left
     an hour ago — paged back, filtered to tardies, with Tuesday unlocked — would cost exactly the
     seconds this whole design is about. Left until after the reload above so that the state being
     checked is the one a fresh open produces rather than one a reload cleared for free. */
  const reFiltered = await openCard(marking);
  await clickSel('[data-attendance-page="earlier"]');
  await clickSel('[data-attendance-filter="A"]');
  await closeAll();
  const reopenedFresh = await openCard(marking);
  check('every open starts on today, unpaged, unfiltered and with no past day left unlocked',
    reopenedFresh.columns.map((c) => c.date).join(' ') === thisWeek.join(' ')
      && !reopenedFresh.banner.shown
      && reopenedFresh.pills.filter((p) => p.active).map((p) => p.code).join('') === 'all'
      && reopenedFresh.sorts.filter((s) => s.active).map((s) => s.which).join('') === 'last'
      && reopenedFresh.rowCount === 26,
    'reopened on ' + JSON.stringify(reopenedFresh.columns.map((c) => c.date))
      + ' with ' + reopenedFresh.rowCount + ' row(s), pills '
      + JSON.stringify(reopenedFresh.pills.filter((p) => p.active).map((p) => p.code))
      + ' (it had been left on ' + JSON.stringify(reFiltered.columns[0].date) + ' paged back)');

  /*
    ── WO-1.13 acceptance 8: presentation mode covers the view that moved ──

    The registry holds no support data of any kind, on purpose (src/attendance.js: it is the screen
    most likely to be on a projector, with a whole class on it). That claim was made about a dialog;
    this asks it of the same screen as a page, with a full roster on it, in BOTH modes — because
    "the new view inherits presentation mode" is only meaningful if what it inherits is enforced
    where the data would otherwise be.

    The strings searched for are read out of the document rather than written here, so a fixture
    changed in the roster section cannot quietly make this check vacuous — and there being some of
    them is asserted, for the same reason. The mode is put back off before anything else runs: a run
    that walked away in presentation mode would suppress the fixtures of every check after it.
  */
  const supportStrings = await evalJs(`(function(){
    var out = [];
    function walk(v){
      if (typeof v === 'string') { if (v.trim().length > 3) out.push(v.trim()); return; }
      if (Array.isArray(v)) { v.forEach(walk); return; }
      if (v && typeof v === 'object') { Object.keys(v).forEach(function(k){ walk(v[k]); }); }
    }
    window.planbook.store.getDoc().students.forEach(function(s){ walk(s.supports); });
    return out; })()`);
  const onRoster = await openCard(marking);
  const quietOff = await evalJs("(function(){ var v = document.getElementById('classView');"
    + " return { text: v ? (v.textContent || '') : '',"
    + " hooks: v ? v.querySelectorAll('[data-support-plan],[data-supports-open],[data-supports-reveal],.support-dot').length : -1 }; })()");
  await clickSel('header [data-presentation-toggle]');
  await new Promise(r => setTimeout(r, 200));
  const quietOn = await evalJs("(function(){ var v = document.getElementById('classView');"
    + " return { on: !window.planbook.supports.supportsVisible(), text: v ? (v.textContent || '') : '',"
    + " hooks: v ? v.querySelectorAll('[data-support-plan],[data-supports-open],[data-supports-reveal],.support-dot').length : -1 }; })()");
  await clickSel('header [data-presentation-toggle]');
  await new Promise(r => setTimeout(r, 200));
  const modeLeftOff = await evalJs('window.planbook.supports.supportsVisible()');
  const leaked = (text) => supportStrings.filter((s) => text.indexOf(s) >= 0);
  check('the registry in the main area carries no support data in either mode, on a class of 26 with plans on file',
    supportStrings.length > 0 && onRoster.rowCount === 26
      && quietOff.hooks === 0 && quietOn.hooks === 0 && quietOn.on === true
      && leaked(quietOff.text).length === 0 && leaked(quietOn.text).length === 0
      && modeLeftOff === true,
    supportStrings.length + ' support string(s) on file, searched for on a ' + onRoster.rowCount
      + '-row grid; leaked with the mode off = ' + JSON.stringify(leaked(quietOff.text))
      + ', with it on = ' + JSON.stringify(leaked(quietOn.text))
      + '; support-shaped controls in the view = ' + quietOff.hooks + '/' + quietOn.hooks
      + '; mode really engaged = ' + quietOn.on + ', left off = ' + modeLeftOff);

  /* ── the way back out (WO-1.13) ──
     It used to be a ✕ on a dialog, and the check here was that closing it handed focus back to the
     card that opened it — the one opener in the app that could not be taken for granted, because
     the grid was rebuilt under it before the dialog went up. There is no dialog and no ✕ now:
     leaving the registry is navigation, so what has to be true is that the control is there, that
     it puts the class grid back without opening anything, and that WHICH CLASS IS OPEN survives the
     trip. That last clause is the one with teeth — a "back" that quietly cleared the selection
     would leave the header with nothing marked and the next screen describing no class. */
  const backFrom = ids[5];
  await openCard(backFrom);
  await clickSel('#classView [data-view-home]');
  const back = await read();
  check('one tap on "All classes" puts the grid back, opens no dialog, and keeps the class it was on open',
    back.homeShown && !back.viewShown && back.dialogs.length === 0
      && back.openClass === backFrom && back.cards.length === 6
      /* And no way back offered on the screen it lands on: both doors go with the class view they
         belong to, which is the same rule that takes the class tabs off this screen. Asserted on
         the class view instead, where the two of them are, by the reload check further up. */
      && back.homeDoors.length === 0,
    'class grid up = ' + back.homeShown + ', class view up = ' + back.viewShown
      + ', dialogs open = ' + JSON.stringify(back.dialogs) + ', open class still '
      + JSON.stringify(back.openClass) + ' of ' + JSON.stringify(backFrom)
      + '; doors back offered here = ' + JSON.stringify(back.homeDoors));

  /*
    ── WO-1.13 acceptance 3, as a measurement: cards enter, tabs switch ──

    "Exactly one control means work on this class now" was the line this work order failed the first
    time, and it failed on a build where the header's class tabs and the home screen's cards were
    both on screen, both carrying `data-class-tab`, both landing on the same branch of src/shell.js.
    The owner's call is that the tab row is not drawn on the grid at all: there the cards are how you
    enter a class, and on the class view the row is the switcher between classes — a job the cards
    cannot do, because by then they are not on screen.

    So it is counted as CONTROLS A TEACHER COULD TAP RIGHT NOW rather than as markup. Both sets are
    in the DOM at all times — the hidden view keeps its own — and `offsetParent` is null for anything
    inside a `.hidden` view or absent from a strip, which is what makes "never both at once" a
    question this file can answer at all.

    The first read is taken on the grid the check above just landed on; the second after one tap on a
    card, which is the gesture being asserted.
  */
  const visibleSelectors = () => evalJs(`(function(){
    function shown(sel){ return Array.prototype.slice.call(document.querySelectorAll(sel))
      .filter(function(e){ return e.offsetParent !== null; }); }
    var cap = document.querySelector('#classTabBar .hdr-empty');
    var strip = document.getElementById('classTabBar');
    var sr = strip.getBoundingClientRect();
    var cr = cap && cap.offsetParent !== null ? cap.getBoundingClientRect() : null;
    return { headerTabs: shown('#classTabBar [data-class-tab]').length,
             cards: shown('#homeGrid .class-card-open').length,
             activeTabs: shown('#classTabBar .cls-tab.active').map(function(b){ return b.textContent; }),
             doors: shown('[data-view-home]').map(function(b){ return (b.textContent || '').trim(); }),
             caption: cr ? (cap.textContent || '').trim() : '',
             /* Drawn, not merely present: a caption clipped to nothing is the blank navy strip the
                work order says must not happen, and it would answer this check green on text alone.
                Read inside the strip it is supposed to be in, too — one line of it, at its top. */
             capW: cr ? Math.round(cr.width) : 0, capH: cr ? Math.round(cr.height) : 0,
             capIn: !!(cr && cr.left >= sr.left - 1 && cr.right <= sr.right + 1
               && cr.height <= sr.height + 1) }; })()`);
  const onGrid = await visibleSelectors();
  check('on the class grid the only control that opens a class is the card — the header row draws no class tabs, and does not read as a blank strip',
    onGrid.cards === 6 && onGrid.headerTabs === 0 && onGrid.activeTabs.length === 0
      && onGrid.doors.length === 0 && onGrid.caption !== ''
      && onGrid.capW > 20 && onGrid.capH > 0 && onGrid.capIn,
    onGrid.cards + ' card(s) and ' + onGrid.headerTabs + ' header class tab(s) on screen; the strip '
      + (onGrid.caption ? 'says ' + JSON.stringify(onGrid.caption) + ' in ' + onGrid.capW + 'x'
        + onGrid.capH + 'px, inside the strip = ' + onGrid.capIn : 'is EMPTY')
      + ', ways back offered = ' + JSON.stringify(onGrid.doors));
  await clickSel('#homeGrid .class-card-open[data-class-tab="' + ids[0] + '"]');
  const inClass = await visibleSelectors();
  check('and on a class the only control that opens a class is the header tab — the cards are gone, one tab is active, and "All classes" says in words what the other one does',
    inClass.headerTabs === 6 && inClass.cards === 0 && inClass.activeTabs.length === 1
      && inClass.doors.length === 2 && inClass.doors.every((t) => /All classes/.test(t))
      && inClass.caption === '',
    inClass.headerTabs + ' header class tab(s) and ' + inClass.cards + ' card(s) on screen; active = '
      + JSON.stringify(inClass.activeTabs) + ', ways back = ' + JSON.stringify(inClass.doors));

  /* And the same door from the header, which is the one that has to work from either view — the
     panel's own is inside the screen it leaves. Driven separately rather than assumed to be the
     same code path, because two doors onto one route is only true while both are wired to it. */
  await openTab(ids[1]);
  await clickSel('#classTabBar [data-view-home]');
  const backHdr = await read();
  check('and so does the "All classes" tab in the header, from a class opened off the header tab row',
    backHdr.homeShown && !backHdr.viewShown && backHdr.dialogs.length === 0
      && backHdr.openClass === ids[1],
    'class grid up = ' + backHdr.homeShown + ', class view up = ' + backHdr.viewShown
      + ', open class = ' + JSON.stringify(backHdr.openClass));

  /*
    ── THE CLASS RESET, AND THE ROUND TRIP BACK OUT OF IT (WO-2.10) ──

    "Un-confirm is reachable: a student cycled by mistake can be returned to `?`, OR THE CLASS
    RESET, without leaving the screen." The row's own button is driven further up; this is the other
    half, and it goes last because it is the one control on this screen that deliberately destroys
    marks — the same trade dropClass() makes, and made loud the same way: its title counts what will
    go before it goes.

    Then straight back out again with "Everyone's here", which is what makes this a round trip
    rather than a one-way door: the class ends the run taken, with an empty `marks` object, which is
    the shape WO-2.1 shipped for a class where nobody was absent.
  */
  const beforeReset = await openCard(ids[0]);
  const resetBtn = beforeReset.actions.filter((a) => a.hook.indexOf('data-attendance-unconfirm-all=') === 0)[0];
  await clickSel('#attendanceActions [data-attendance-unconfirm-all]');
  const reset = await read();
  const resetRec = reset.today.filter((r) => r.classId === ids[0])[0] || {};
  check('"Un-confirm everyone" puts the whole class back to ?, and says how many marks that costs before it costs them',
    !!resetBtn && resetBtn.text === 'Un-confirm everyone'
      && beforeReset.actions.every((a) => a.hook.indexOf('data-attendance-untake=') !== 0)
      && Object.keys(resetRec.marks || {}).length === 26
      && Object.keys(resetRec.marks).every((id) => resetRec.marks[id].code === 'U')
      && Object.keys(resetRec.marks).every((id) => Object.keys(resetRec.marks[id]).join(',') === 'code')
      && reset.rows.every((r) => r.codes.charAt(0) === '?')
      && reset.columns[0].chip === '26 to go' && reset.stateText === '26 unconfirmed'
      && reset.states.indexOf(ids[0] + '=taken') >= 0,
    'the control offered on a class carrying four marks was '
      + JSON.stringify(beforeReset.actions.map((a) => a.text))
      + '; after one tap the record holds ' + Object.keys(resetRec.marks || {}).length
      + ' entr(ies), all of them U with nothing else on them, the column reads '
      + JSON.stringify(reset.rows.map((r) => r.codes.charAt(0)).join(''))
      + ' and the class is still a meeting (' + reset.states.split(' ')[0] + ')');

  await clickSel('#attendanceActions [data-attendance-take]');
  const retaken = await read();
  const retakenRec = retaken.today.filter((r) => r.classId === ids[0])[0] || {};
  check('and one tap of "Everyone\'s here" comes straight back out of it, to a record with an empty marks object',
    JSON.stringify(retakenRec.marks) === '{}'
      && retakenRec.keys === 'classId,date,marks'
      && retaken.rows.every((r) => r.codes.charAt(0) === 'P')
      && retaken.columns[0].chip === 'Taken' && retaken.stateText === 'Taken · all present'
      /* Its own class only. The half-taken class beside it keeps its two `U`s — "everyone's here"
         is a statement about the room in front of her, and a build that resolved every class at
         once would be the WO-2.1 defect this whole work order exists to undo, one level up. */
      && retaken.todayValues.U === 2 && !retaken.values.P,
    'the record is now ' + JSON.stringify(retakenRec) + ', the column reads '
      + JSON.stringify(retaken.rows.map((r) => r.codes.charAt(0)).join(''))
      + ' and the unconfirmed students left on the day are ' + (retaken.todayValues.U || 0)
      + ' (the other class\'s, untouched)');

  /*
    ── WO-2.8: hall passes ──

    Seven acceptance lines, and the FIRST ONE IS WHY THIS FEATURE EXISTS AS A WORK ORDER AT ALL:
    Roll Call! keeps its open passes in a module variable (`activePasses`, dashboard.html:2437), and
    a build that copied that would pass every other check below. So the reload check here does not
    ask the app whether the pass is still open — it reads the record straight out of IndexedDB, with
    the page freshly reloaded, and compares the time out character for character. That is the only
    question a desk can answer about "survives a force-quit", and it is the half of the line that is
    not owed to a human with a real iPad.

    THREE OF THESE CLAIMS ARE ABOUT WHAT DID *NOT* HAPPEN, and each is paired with the presence that
    makes the absence mean something. "A pass creates no attendance record" is asserted over a class
    that is genuinely taken, with the record count and the mark tally read before and after — the
    fixture is loud, and the silence beside it is the claim. "The log holds no name" is asked by
    searching the serialised log for every name in the document, not for the fields this file
    happened to think of. And "undoing the D leaves nothing behind" is asserted against a log entry
    that was seen to exist first.
  */
  const passClass = ids[0];
  const beforePasses = await openCard(passClass);
  const passRoster = beforePasses.rows.map((r) => r.student);
  /* The fixture, asserted rather than assumed: a class of 26 that is taken with everybody present,
     so that every claim below about attendance not moving is made against a real record with a real
     tally, and every claim about a pass is made on a row that has one. */
  const passBaselineRecords = beforePasses.records.length;
  const passBaselineValues = JSON.stringify(beforePasses.values);
  check('the registry carries a Passes column, three types per student, on a class that is already taken',
    beforePasses.passColumn === 1 && passRoster.length === 26
      && beforePasses.rows.every((r) => r.pass && r.pass.types === 'bathroom,nurse,quick'
        && r.pass.off === 0 && !r.pass.out)
      && beforePasses.openPasses.length === 0 && beforePasses.passLog.length === 0
      && beforePasses.states.indexOf(passClass + '=taken') >= 0,
    beforePasses.rows.length + ' row(s), the first offering '
      + JSON.stringify(beforePasses.rows[0] && beforePasses.rows[0].pass)
      + '; open passes = ' + beforePasses.openPasses.length + ', logged = '
      + beforePasses.passLog.length + ', over ' + passBaselineRecords + ' attendance record(s)');

  /* ── one tap out ── */
  const outA = passRoster[0];
  const outB = passRoster[1];
  const outC = passRoster[2];
  const outD = passRoster[3];
  await clickSel('[data-pass-issue="' + outA + '"][data-pass-type="bathroom"]');
  const issued = await read();
  const firstPass = issued.openPasses[0] || {};
  const rowA = issued.rows.filter((r) => r.student === outA)[0] || {};
  check('one tap sends a student out: who, which type, and the time — and their row offers Return instead',
    issued.openPasses.length === 1 && firstPass.studentId === outA
      && firstPass.classId === passClass && firstPass.type === 'bathroom'
      /* A local stamp WITH its offset, like every other time this app writes: the hour read back
         has to be the hour the teacher's clock showed (src/attendance.js's stampNow). A `Z` here
         would be the same instant printed as a different hour. */
      && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(firstPass.out || '')
      && (firstPass.out || '').slice(0, 10) === nodeToday
      && firstPass.keys === 'classId,id,out,studentId,type'
      && !!rowA.pass && rowA.pass.out === true && /^\d+:\d{2}[ap]$/.test(rowA.pass.since)
      /* And nobody else moved. Twenty-five rows still offering three buttons is what makes the one
         row that changed a change rather than a repaint. */
      && issued.rows.filter((r) => r.pass && r.pass.out).length === 1
      && issued.rows.filter((r) => r.pass && r.pass.types === 'bathroom,nurse,quick').length === 25,
    'openPasses = ' + JSON.stringify(issued.openPasses) + '; the row reads '
      + JSON.stringify(rowA.pass));

  /* WO-2.8 acceptance 6, on the tap that would break it. */
  check('and it wrote no attendance: no new record, no mark moved, nobody made absent by leaving the room',
    issued.records.length === passBaselineRecords
      && JSON.stringify(issued.values) === passBaselineValues
      && rowA.codes.charAt(0) === 'P',
    issued.records.length + ' attendance record(s) (was ' + passBaselineRecords
      + '), marks across the document = ' + JSON.stringify(issued.values)
      + ' (was ' + passBaselineValues + '); the row that left the room still reads "'
      + rowA.codes + '" across the week');

  /*
    ── ACCEPTANCE LINE 1, THE HALF A DESK CAN ANSWER ──

    Flushed, reloaded, and then read OUT OF INDEXEDDB rather than out of the app: the question is
    whether the open pass is a record or a variable, and only the record survives a process. The
    time out is compared character for character against the one written before the reload, because
    "still out" with a time re-stamped at boot would be a cleared board wearing the right shape.

    The 👤 half — an actual force-quit of an installed PWA on the owner's own iPad — stays owed.
  */
  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  await waitForBoot();
  await evalJs(KILL_ANIM);
  await evalJs(INSTALL_WALKER);
  await evalJs(INSTALL_ATT_READER);
  const onDisk = await evalJs(`(async function(){
    var rec = await new Promise(function(res, rej){
      var open = indexedDB.open('planbook');
      open.onerror = function(){ rej(open.error); };
      open.onsuccess = function(){ var db = open.result;
        var q = db.transaction('years','readonly').objectStore('years')
          .get(window.planbook.store.getDoc().year);
        q.onsuccess = function(){ res(q.result); db.close(); };
        q.onerror = function(){ rej(q.error); }; }; });
    return { open: (rec && rec.openPasses) || null, log: (rec && rec.passes) || null,
             stored: !!rec }; })()`);
  const relaunched = await openCard(passClass);
  const rowAgain = relaunched.rows.filter((r) => r.student === outA)[0] || {};
  check('an open pass survives a reload: it comes back out of IndexedDB, with the original time out',
    onDisk.stored && Array.isArray(onDisk.open) && onDisk.open.length === 1
      && onDisk.open[0].studentId === outA && onDisk.open[0].out === firstPass.out
      && Array.isArray(onDisk.log) && onDisk.log.length === 0
      && relaunched.openPasses.length === 1 && relaunched.openPasses[0].out === firstPass.out
      && !!rowAgain.pass && rowAgain.pass.out === true
      && rowAgain.pass.since === rowA.pass.since,
    'the record on disk is ' + JSON.stringify(onDisk.open) + ' — the same time out ('
      + firstPass.out + ') as before the reload, and the row still reads "'
      + (rowAgain.pass && rowAgain.pass.since) + '" beside its Return button');

  /* ── the cap, and the reason for it ── */
  await clickSel('[data-pass-issue="' + outB + '"][data-pass-type="nurse"]');
  await clickSel('[data-pass-issue="' + outC + '"][data-pass-type="quick"]');
  const capped = await read();
  const stillIn = capped.rows.filter((r) => r.pass && !r.pass.out);
  check('three at once is the cap: every remaining student\'s buttons are off, and the reason is on the screen',
    capped.openPasses.length === 3
      && capped.openPasses.map((p) => p.type).sort().join(',') === 'bathroom,nurse,quick'
      && stillIn.length === 23 && stillIn.every((r) => r.pass.off === 3)
      /* Not a dead control: the sentence above the grid says the number and what to do about it. */
      && /3 students/.test(capped.passNote) && /Return/.test(capped.passNote),
    capped.openPasses.length + ' out, ' + stillIn.length + ' rows with '
      + (stillIn[0] ? stillIn[0].pass.off : '?') + ' of 3 buttons disabled; the line above the grid says '
      + JSON.stringify(capped.passNote));

  /* And the writer refuses too, which is the half a disabled button cannot prove. Driven through
     the seam because a disabled control has no click to give — the same exception this section
     already makes for the future-date block, and for the same reason: a refused path has no button
     to press. */
  const fourth = await evalJs(`(async function(){
    var att = window.planbook.attendance;
    var p = window.planbook.passes;
    var s = window.planbook.store;
    /* The screen's own writer first: the guard a stale tap or a keyboard path would arrive at. */
    att.issuePass(${JSON.stringify(outD)}, 'bathroom');
    await s.flush();
    var afterScreen = s.getDoc().openPasses.length;
    /* And then the model underneath it, handed the live document with the screen's guard bypassed
       entirely. Both are asserted because they are guards against different mistakes — one is
       about a control that should not have fired, one is about the document — and a check that
       only drove the top one would go green with the bottom one deleted. */
    s.update(function(d){ p.openPass(d, ${JSON.stringify(passClass)},
      ${JSON.stringify(outD)}, 'bathroom', '2026-01-01T09:00:00-05:00'); });
    await s.flush();
    var out = window.__att();
    out.afterScreen = afterScreen;
    return out; })()`);
  check('and a fourth pass is refused by the screen AND by the writer under it, not merely un-clickable',
    fourth.afterScreen === 3 && fourth.openPasses.length === 3
      && fourth.openPasses.every((p) => p.studentId !== outD),
    'after asking the screen for a fourth, ' + fourth.afterScreen
      + ' pass(es) were open; after asking the model directly, ' + fourth.openPasses.length + ': '
      + JSON.stringify(fourth.openPasses.map((p) => p.studentId + ' ' + p.type)));

  /*
    ── AND THE CAP IS *THIS* CLASS'S CAP ──

    A deliberate divergence from the reference, argued at src/passes.js:81-91: Roll Call! loads one
    class at a time, so over there a global count and a per-class one are the same number. Here they
    are not — a pass the teacher forgot to close in period 2 must not eat a third of period 3's
    capacity for a room it has nothing to do with. EVERY OTHER PASS CHECK IN THIS SECTION RUNS
    INSIDE ONE CLASS, so a regression to a global count, or an openPassFor() that stopped filtering
    by classId, would leave all of them green.

    Nothing is issued next door: a pass left open in a second class would move the totals every
    check below counts. What is asked instead is the two predicates the divergence actually lives
    in, plus the screen drawn from them.
  */
  /* Any other class that has students on it — this run leaves one active class with an empty
     roster on purpose, and a check whose "next door" had no rows in it would assert nothing about
     a screen. Which one it lands on does not matter; that it has rows is asserted below. */
  const otherClass = await evalJs(`(function(){
    var d = window.planbook.store.getDoc();
    var c = d.classes.filter(function(x){ return !x.archived
      && x.id !== ${JSON.stringify(passClass)} && (x.roster || []).length > 0; })[0];
    return c ? c.id : ''; })()`);
  const otherOpen = await openCard(otherClass);
  const perClass = await evalJs(`(function(){
    var p = window.planbook.passes, d = window.planbook.store.getDoc();
    return { hereAtCap: p.atCap(d, ${JSON.stringify(passClass)}),
             thereAtCap: p.atCap(d, ${JSON.stringify(otherClass)}),
             hereOut: !!p.openPassFor(d, ${JSON.stringify(passClass)}, ${JSON.stringify(outA)}),
             thereOut: !!p.openPassFor(d, ${JSON.stringify(otherClass)}, ${JSON.stringify(outA)}),
             open: (d.openPasses || []).length }; })()`);
  check('the cap is THIS class\'s cap: a room that is full leaves the class next door its own three',
    perClass.hereAtCap === true && perClass.thereAtCap === false && perClass.open === 3
      /* And a student who is out of one room is not out of another: openPassFor() filters by class
         as well as by student, which is what stops the same child being drawn with a Return button
         in a room they are sitting in. */
      && perClass.hereOut === true && perClass.thereOut === false
      /* The screen agrees. Not one button off next door, and no reason line, while the class this
         section has been working is at its limit. */
      && otherOpen.rows.length > 0
      && otherOpen.rows.every((r) => r.pass && r.pass.off === 0 && !r.pass.out)
      && otherOpen.passNote === '',
    'at the cap here = ' + perClass.hereAtCap + ', next door = ' + perClass.thereAtCap
      + ' over ' + perClass.open + ' open pass(es); that student reads out here = '
      + perClass.hereOut + ', next door = ' + perClass.thereOut + '; '
      + otherOpen.rows.length + ' row(s) next door with '
      + JSON.stringify([...new Set(otherOpen.rows.map((r) => r.pass && r.pass.off))])
      + ' button(s) off and the note line ' + JSON.stringify(otherOpen.passNote));
  await openCard(passClass);

  /*
    ── one tap back, with the minutes it owes ──

    THE GAP IS MANUFACTURED. Left alone, every pass this run issues comes back in under a second and
    "0 minutes" is what a broken calculation and a correct one both produce. So the open pass's `out`
    is wound back seven minutes through the store before the Return is tapped, and seven is the
    number the entry has to carry. The wind-back is asserted before it is used.
  */
  const wound = await evalJs(`(async function(){
    var s = window.planbook.store;
    var was = '';
    s.update(function(d){
      d.openPasses.forEach(function(p){
        if (p.studentId !== ${JSON.stringify(outA)}) return;
        was = p.out;
        var t = new Date(Date.parse(p.out) - 7 * 60000);
        var pad = function(n){ return (n < 10 ? '0' : '') + n; };
        var off = -t.getTimezoneOffset(), abs = Math.abs(off);
        p.out = t.getFullYear() + '-' + pad(t.getMonth()+1) + '-' + pad(t.getDate())
          + 'T' + pad(t.getHours()) + ':' + pad(t.getMinutes()) + ':' + pad(t.getSeconds())
          + (off < 0 ? '-' : '+') + pad(Math.floor(abs/60)) + ':' + pad(abs % 60);
      }); });
    await s.flush();
    return { was: was, now: (s.getDoc().openPasses.filter(function(p){
      return p.studentId === ${JSON.stringify(outA)}; })[0] || {}).out }; })()`);
  check('the fixture for the minutes is real: that student\'s time out was wound back seven minutes',
    !!wound.was && !!wound.now && wound.now !== wound.was
      && Math.round((Date.parse(wound.was) - Date.parse(wound.now)) / 60000) === 7,
    'out went from ' + wound.was + ' to ' + wound.now);

  await evalJs('window.planbook.attendance.renderAttendance();1');
  await clickSel('[data-pass-return="' + outA + '"]');
  const returned = await read();
  const logged = returned.passLog[0] || {};
  const rowBack = returned.rows.filter((r) => r.student === outA)[0] || {};
  check('one tap back writes ONE log entry with the right minutes, and the student\'s buttons come back',
    returned.passLog.length === 1
      && logged.studentId === outA && logged.classId === passClass && logged.type === 'bathroom'
      && logged.out === wound.now && logged.minutes === 7 && logged.endedBy === 'return'
      && logged.keys === 'back,classId,endedBy,id,minutes,out,studentId,type'
      && returned.openPasses.length === 2
      && !!rowBack.pass && rowBack.pass.out === false
      && rowBack.pass.types === 'bathroom,nurse,quick'
      /* Under the cap again, so every other row's buttons come back on with it, and the reason
         above the grid goes away because there is no longer one. */
      && rowBack.pass.off === 0 && returned.passNote === '',
    'the log holds ' + returned.passLog.length + ' entr(ies): ' + JSON.stringify(logged)
      + '; the row now offers ' + JSON.stringify(rowBack.pass) + ' and the note line is '
      + JSON.stringify(returned.passNote));

  check('and the round trip still wrote no attendance — a student who went to the bathroom was present',
    returned.records.length === passBaselineRecords
      && JSON.stringify(returned.values) === passBaselineValues
      && rowBack.codes.charAt(0) === 'P',
    returned.records.length + ' attendance record(s) (was ' + passBaselineRecords
      + '), marks across the document = ' + JSON.stringify(returned.values)
      + ' (was ' + passBaselineValues + '), and that row reads "' + rowBack.codes + '"');

  /*
    ── the log is keyed by student id, and a rename proves it ──

    Asked of the document rather than of the screen, which is the acceptance line's own wording. The
    rename goes in through the store and the app is reloaded on top of it, so what is compared is a
    log entry that has been through IndexedDB since the name changed.
  */
  const renamedTo = await evalJs(`(async function(){
    var s = window.planbook.store;
    var doc = s.getDoc();
    var stu = doc.students.filter(function(x){ return x.id === ${JSON.stringify(outA)}; })[0];
    var was = { first: stu.first, last: stu.last };
    s.update(function(){ stu.first = 'Renamed'; stu.last = 'Afterwards'; });
    await s.flush();
    return was; })()`);
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  await waitForBoot();
  await evalJs(KILL_ANIM);
  await evalJs(INSTALL_WALKER);
  await evalJs(INSTALL_ATT_READER);
  const afterRename = await openCard(passClass);
  const keptEntry = afterRename.passLog.filter((p) => p.studentId === outA)[0] || {};
  check('the pass log is keyed by student id: renaming that student afterwards neither orphans nor re-attaches their pass',
    afterRename.names.indexOf('Renamed Afterwards') >= 0
      && afterRename.passLog.length === 1
      && keptEntry.id === logged.id && keptEntry.minutes === 7
      && keptEntry.out === logged.out && keptEntry.back === logged.back
      /* And no name is in there at all — searched for every name the document holds, rather than
         for the fields this file thought to look at. */
      && afterRename.names.every((n) => afterRename.passJson.indexOf(n) < 0)
      && afterRename.passJson.indexOf('Renamed') < 0,
    'the entry after the rename is ' + JSON.stringify(keptEntry)
      + '; the serialised pass collections mention none of the '
      + afterRename.names.length + ' names in the document');
  await evalJs(`(async function(){ var s = window.planbook.store;
    var stu = s.getDoc().students.filter(function(x){ return x.id === ${JSON.stringify(outA)}; })[0];
    s.update(function(){ stu.first = ${JSON.stringify(renamedTo.first)};
      stu.last = ${JSON.stringify(renamedTo.last)}; });
    await s.flush(); return 1; })()`);
  await evalJs('window.planbook.attendance.renderAttendance();1');

  /*
    ── `D` and an open pass agree ──

    Driven through the CELL, one tap at a time round the cycle, rather than through setMark: the
    coupling lives in the writer every tap goes through, and a check that called the writer directly
    would not notice a grid that had stopped reaching it. The three marks on the way to `D` are the
    control: a student who is out and is marked absent, at an event, or tardy is still out, and only
    the dismissal closes anything.
  */
  const beforeD = await read();
  const passB = beforeD.openPasses.filter((p) => p.studentId === outB)[0] || {};
  const onTheWay = [];
  for (let i = 0; i < 4; i++) {
    await tapCell(outB, nodeToday);
    const step = await read();
    const row = step.rows.filter((r) => r.student === outB)[0] || {};
    onTheWay.push(row.codes.charAt(0) + (step.openPasses.some((p) => p.studentId === outB) ? '+' : '-'));
  }
  const dismissD = await read();
  const dCell = ((dismissD.today.filter((r) => r.classId === passClass)[0] || {}).marks || {})[outB];
  const closedByD = dismissD.passLog.filter((p) => p.studentId === outB)[0] || {};
  check('marking a student D while they are out closes the pass — and A, E and T on the way there do not',
    onTheWay.join(' ') === 'A+ E+ T+ D-'
      && !dismissD.openPasses.some((p) => p.studentId === outB)
      && dismissD.passLog.length === 2
      && closedByD.endedBy === 'dismissed' && closedByD.out === passB.out
      && typeof closedByD.minutes === 'number'
      /* The link back, on the cell that caused it and nowhere else. A `D` that closed no pass
         carries no such field, and no other code ever does. */
      && !!dCell && dCell.code === 'D' && dCell.passId === closedByD.id
      && Object.keys(dCell).sort().join(',') === 'at,code,passId',
    'the cell walked ' + JSON.stringify(onTheWay.join(' '))
      + ' (code, and + for still out); the D cell is ' + JSON.stringify(dCell)
      + ' and the entry it closed is ' + JSON.stringify(closedByD));

  await tapCell(outB, nodeToday);
  const undoneD = await read();
  const undoneRec = (undoneD.today.filter((r) => r.classId === passClass)[0] || {});
  const backOut = undoneD.openPasses.filter((p) => p.studentId === outB)[0] || {};
  const rowB = undoneD.rows.filter((r) => r.student === outB)[0] || {};
  check('and undoing the D puts the pass back — same time out, and the entry it wrote is gone rather than doubled',
    backOut.studentId === outB && backOut.out === passB.out && backOut.id === closedByD.id
      && undoneD.openPasses.length === 2
      && undoneD.passLog.length === 1
      && !undoneD.passLog.some((p) => p.studentId === outB)
      && !!rowB.pass && rowB.pass.out === true
      /* The mark went back to present, which for this class means no entry at all — so the record
         is exactly the one this section started from, and the dismissal left nothing behind in
         either collection. */
      && JSON.stringify(undoneRec.marks) === '{}'
      && undoneD.records.length === passBaselineRecords
      && JSON.stringify(undoneD.values) === passBaselineValues,
    'the reopened pass is ' + JSON.stringify(backOut) + ', the log holds '
      + undoneD.passLog.length + ' entr(ies) ' + JSON.stringify(undoneD.passLog.map((p) => p.endedBy))
      + ', and the record is back to ' + JSON.stringify(undoneRec.marks));

  /*
    ── AND THEN THE DAY ROLLS OVER: yesterday's `D` does not put a pass back in the corridor ──

    The coupling is TODAY-ONLY IN BOTH DIRECTIONS, and the undo is the half that is easy to leave
    open — a retraction of the app's own write looks like it needs no date guard. It does. A `D`
    marked today carries a passId; tomorrow that same cell is a past-dated cell, and a past column
    is unlockable (WO-2.1). Ungated, editing it pushes a FINISHED pass back into `openPasses` with
    yesterday's time out: a Return button beside a student who is sitting in the room, one of the
    class's three slots eaten until somebody notices, and a real completed dismissal deleted out of
    the append-only history by an edit made on a later day. That is the Traps paragraph's own
    failure — the app asserting a child is out of the room when they are not — running backwards.

    EVERY OTHER `D` IN THIS SECTION IS MARKED AND UNDONE ON THE SAME DAY, so every check above is
    blind to it by construction. This one rolls the day over BY MOVING THE CELL RATHER THAN THE
    CLOCK: the dismissal is made today through the grid, exactly as the checks above make it, and
    then that cell — passId and all — is lifted onto yesterday's column with only its `at` re-dated,
    which is precisely the state midnight leaves it in. The fixture is asserted before it is used.

    IT IS MOVED ONTO THE RECORD THAT COLUMN ALREADY HAS, never onto a second record beside it, and
    the count is asserted. This is the mistake the first version of this check made and it is worth
    naming: yesterday is a day this section's own class was taken on, so a pushed record is a
    DUPLICATE classId+date pair — and a duplicate is inert (src/attendance.js:618-620, "the first is
    the one this app reads and the one every write below edits"). The D cell would have been sitting
    somewhere the tap below could never reach, the tap would have walked an empty cell P → A → E,
    and every assertion about a pass not reopening would have been true of a cell nothing touched.
  */
  const yesterday = thisWeek[1];
  for (let i = 0; i < 4; i++) await tapCell(outB, nodeToday);
  const dismissedAgain = await read();
  const secondD = dismissedAgain.passLog
    .filter((p) => p.studentId === outB && p.endedBy === 'dismissed')[0] || {};
  const rolled = await evalJs(`(async function(){
    var s = window.planbook.store;
    var d = s.getDoc();
    var cls = ${JSON.stringify(passClass)}, who = ${JSON.stringify(outB)};
    var day = ${JSON.stringify(yesterday)};
    var day0 = d.attendance.filter(function(r){ return r.classId === cls && r.date === day; });
    var rec = d.attendance.filter(function(r){
      return r.classId === cls && r.date === ${JSON.stringify(nodeToday)}; })[0];
    var cell = rec && rec.marks[who] ? JSON.parse(JSON.stringify(rec.marks[who])) : null;
    if (cell && cell.at) cell.at = day + cell.at.slice(10);
    var before = day0.length === 1 ? JSON.stringify(day0[0].marks || {}) : null;
    s.update(function(){
      delete rec.marks[who];
      if (day0.length === 1 && cell) day0[0].marks[who] = cell;
    });
    await s.flush();
    window.planbook.attendance.renderAttendance();
    var after = s.getDoc().attendance.filter(function(r){ return r.classId === cls && r.date === day; });
    return { records: after.length, before: before,
             moved: after.length === 1 ? ((after[0].marks || {})[who] || null) : null,
             todayNow: rec.marks[who] || null,
             open: s.getDoc().openPasses.length }; })()`);
  check('the fixture for a day rolling over is real: that D cell, passId and all, now sits on the one record yesterday has',
    rolled.records === 1
      && !!rolled.moved && rolled.moved.code === 'D' && rolled.moved.passId === secondD.id
      && (rolled.moved.at || '').slice(0, 10) === yesterday
      && rolled.todayNow === null && rolled.open === 1
      && dismissedAgain.passLog.length === 2 && secondD.endedBy === 'dismissed',
    yesterday + ' holds ' + rolled.records + ' record(s) for that class, the first of them reading '
      + JSON.stringify(rolled.moved) + ' for that student, and today holds '
      + JSON.stringify(rolled.todayNow) + '; the pass it closed is ' + JSON.stringify(secondD)
      + ', leaving ' + rolled.open + ' open');

  await clickSel('[data-attendance-edit="' + yesterday + '"]');
  await tapCell(outB, yesterday);          /* D -> P: the tap that would have reopened it */
  const nextDay = await read();
  await tapCell(outB, yesterday);          /* P -> A: and the cell comes back without the id */
  const nextDayA = await read();
  const yGone = (nextDay.records.filter((r) => r.classId === passClass && r.date === yesterday)[0]
    || {}).marks || {};
  const yRec = nextDayA.records.filter((r) => r.classId === passClass && r.date === yesterday)[0] || {};
  const stillDone = nextDay.passLog.filter((p) => p.id === secondD.id)[0] || {};
  check('but a D edited on a LATER day does not push its finished pass back into the corridor',
    /* THE TAP LANDED, which is the premise the two absences below are worth nothing without: the
       dismissal is off the cell, so the reopen was reached and refused rather than never asked. */
    !yGone[outB]
      /* Nobody new is out. One pass is open and it is the one that was already open. */
      && nextDay.openPasses.length === 1 && !nextDay.openPasses.some((p) => p.studentId === outB)
      /* And the history is intact: the dismissal that really happened is still there, unretracted,
         which is the half that would delete a record rather than invent one. */
      && nextDay.passLog.length === 2 && stillDone.endedBy === 'dismissed'
      && stillDone.out === secondD.out && stillDone.back === secondD.back
      /* The link dies with the cell instead, as the coupling's comment says it does: the rewritten
         cell carries a code and nothing else — no passId, and no `at`, because a device clock says
         nothing about yesterday. */
      && nextDayA.openPasses.length === 1 && nextDayA.passLog.length === 2
      && ((yRec.marks || {})[outB] || {}).code === 'A'
      && Object.keys((yRec.marks || {})[outB] || {}).join(',') === 'code',
    'after the tap on ' + yesterday + ' the cell held ' + JSON.stringify(yGone[outB] || null)
      + ', ' + nextDay.openPasses.length + ' pass(es) open ('
      + JSON.stringify(nextDay.openPasses.map((p) => p.studentId)) + ') and '
      + nextDay.passLog.length + ' logged ' + JSON.stringify(nextDay.passLog.map((p) => p.endedBy))
      + '; the rewritten cell is ' + JSON.stringify((yRec.marks || {})[outB]));

  /* Put the fixture away: the past column locked, yesterday's record put back byte for byte as this
     check found it — it is a real taken day this section borrowed, not one it invented, so it is
     restored rather than deleted — and that student sent out again, because the section has to END
     with two passes open for the reason below. */
  await clickSel('#attendanceBanner [data-attendance-page="today"]');
  await evalJs(`(async function(){
    var s = window.planbook.store;
    s.update(function(d){
      var rec = d.attendance.filter(function(r){
        return r.classId === ${JSON.stringify(passClass)}
          && r.date === ${JSON.stringify(yesterday)}; })[0];
      if (rec) rec.marks = JSON.parse(${JSON.stringify(rolled.before || '{}')});
    });
    await s.flush();
    window.planbook.attendance.renderAttendance();
    return 1; })()`);
  await clickSel('[data-pass-issue="' + outB + '"][data-pass-type="bathroom"]');

  /*
    ── WO-2.11: the banner, and cancelling a pass issued by mistake ──

    NINE ACCEPTANCE LINES, AND THE FIRST OF THEM IS THE WHOLE WORK ORDER: cancelling has to leave
    `passes` BYTE-IDENTICAL. So every claim about it below is made against `JSON.stringify` of the
    array taken immediately before the tap, not against a count and not against the fields this file
    thought to read — the failure this exists to prevent is a cancel implemented as a return with
    `minutes: 0`, which would keep the count honest for one entry and leave a phantom trip in the
    record Phase 4 reads as a signal.

    FOUR OF THESE CLAIMS ARE ABOUT WHAT DID *NOT* HAPPEN, and each is paired with the presence that
    makes the absence mean something. The pass being cancelled is issued, seen on a card and seen in
    the document first; the note whose disappearance is the claim is typed, read back off the open
    pass, and only then cancelled; the attendance that must not move is a class of 26 that is
    genuinely taken; and the append-only rule is asserted on a log entry that was watched being
    written by a Return two taps earlier.

    EVERYTHING GOES THROUGH THE CONTROLS. The one exception is the model gate at the end — asking
    cancelPass() to delete a FINISHED pass, which is the Traps paragraph's own failure mode and has
    no button by construction, because the card that carried one is gone the moment the pass ends.
  */
  const banner0 = await read();
  /* This section's own fixture, re-read rather than inherited: the WO-2.8 checks above borrowed a
     past column and put it back, and a baseline taken before all that would be asserting their
     tidy-up as well as this one's silence. */
  const cancelRecords = banner0.records.length;
  const cancelValues = JSON.stringify(banner0.values);
  const cardB = (banner0.passBanner.cards || []).filter((c) => c.student === outB)[0] || {};
  const cardC = (banner0.passBanner.cards || []).filter((c) => c.student === outC)[0] || {};
  check('the banner draws one card per open pass in this class: name, type, time out, Return, Cancel and a note field',
    !!banner0.passBanner && banner0.passBanner.shown
      && banner0.passBanner.cards.length === 2 && banner0.openPasses.length === 2
      && !!cardB.student && !!cardC.student
      /* The card names the student the row does, says which type, and says when they left — the
         three things the work order asks the card to carry, and no elapsed clock among them. */
      && cardB.name === (banner0.rows.filter((r) => r.student === outB)[0] || {}).name
      /* The word with NO glyph, asserted as an absence rather than left unstated: the emoji came
         off on 2026-08-07 to buy the card's single row, and a chip that quietly grew one again
         would cost that row back on the device where it is tightest. */
      && /^Bathroom$/.test(cardB.type) && /^Quick$/.test(cardC.type)
      && /^out \d+:\d{2} [AP]M$/.test(cardB.out)
      /* Both actions on the card, and Return carries the SAME hook the row's own Return carries —
         one writer, two surfaces. Cancel is on the card only; the cell's own controls are asserted
         to be three issue buttons or one Return everywhere else in this section. */
      && cardB.cancels === outB && cardB.backText === '✓ Return' && cardB.cancelText === '✕ Cancel'
      && /Nothing is recorded/.test(cardB.cancelLabel)
      && cardB.note === '' && cardC.note === ''
      && /2 students are out of/.test(banner0.passBanner.label),
    banner0.passBanner ? banner0.passBanner.cards.length + ' card(s): '
      + JSON.stringify(banner0.passBanner.cards.map((c) => c.name + ' / ' + c.type + ' / ' + c.out))
      + ', announced as ' + JSON.stringify(banner0.passBanner.label)
      : 'no banner element on the page at all');

  /* Acceptance line 9, and it is a claim about WHERE rather than about what: the registry's width is
     budgeted to the pixel and WO-2.12 is about to spend it again, so a banner that took a day column
     would be a regression nobody would attribute to this work order six weeks from now. Measured
     three ways — the column count against the count from before any pass existed, the geometry, and
     the containment, because a card inside the grid wrap is a panel beside the rows by another
     name. */
  check('and it costs the registry no day columns — it is above the grid, not inside it and not beside it',
    banner0.columns.length === beforePasses.columns.length
      && banner0.passBanner.insideGrid === false && banner0.passBanner.aboveGrid === true
      && banner0.fit.over <= 0 && banner0.fit.page <= 0,
    banner0.columns.length + ' day column(s) with two cards up, against '
      + beforePasses.columns.length + ' with none; inside the grid = '
      + banner0.passBanner.insideGrid + ', above it = ' + banner0.passBanner.aboveGrid
      + ', grid over its own box by ' + banner0.fit.over + 'px, page by ' + banner0.fit.page + 'px');

  /*
    THE DESK HALF OF A 👤 LINE, AND IT DOES NOT CLOSE IT. "Cancel and Return cannot be confused at
    speed on glass" is the owner's call on her own device and nothing here can answer it. What this
    can answer is the half that would make the question moot: the two controls have to be drawn as
    DIFFERENT SHAPES rather than as two buttons of one kind in two colours — filled against outline,
    which is the difference that survives being seen out of the corner of an eye, and the one a
    later refactor to "one button style for the card" would quietly delete.

    The pointer is parked first, for the reason tools/README.md's trap 7 gives: the last thing
    clicked measures its `:hover` rule, and a comparison between two buttons where one is hovered
    reports a difference that is not the one being asked about.
  */
  await park();
  const drawn = await evalJs(`(function(){
    var card = document.querySelector('.attendance-pass-card');
    if (!card) return null;
    var b = card.querySelector('[data-pass-return]'), c = card.querySelector('[data-pass-cancel]');
    if (!b || !c) return null;
    /* The alpha of the computed fill, so this asks "is it filled at all" rather than naming a
       colour. It was written against a literal white on 2026-08-07 and broke the same day the card
       took Roll Call!'s dark palette — a check that hardcodes the surface it sits on fails on a
       re-skin that did not touch the thing it is guarding. */
    var alpha = function(c){ var m = /^rgba?\(([^)]*)\)/.exec(c || ''); if (!m) return 1;
      var p = m[1].split(','); return p.length > 3 ? parseFloat(p[3]) : 1; };
    var look = function(e){ var s = getComputedStyle(e);
      return { bg: s.backgroundColor, fill: alpha(s.backgroundColor), color: s.color,
               border: s.borderTopColor, text: (e.textContent || '').trim() }; };
    return { back: look(b), cancel: look(c) }; })()`);
  check('Return and Cancel are drawn as different SHAPES on the card — filled against outline, not one style in two colours (the desk half of a 👤 line)',
    !!drawn && drawn.back.bg !== drawn.cancel.bg
      && drawn.back.color !== drawn.cancel.color
      && drawn.back.border !== drawn.cancel.border
      /* The fill is the load-bearing half: Return is a solid button and Cancel has no fill of its
         own at all — it shows whatever the card behind it is. */
      && drawn.back.fill === 1 && drawn.cancel.fill === 0
      && drawn.back.text.charAt(0) === '✓' && drawn.cancel.text.charAt(0) === '✕',
    drawn ? 'Return is ' + JSON.stringify(drawn.back) + ' and Cancel is '
      + JSON.stringify(drawn.cancel) : 'no card on screen to measure');

  /* Acceptance line 8's hardest clause: the banner is scoped to the class ON SCREEN, which is only
     visible on a screen whose OWN class has nobody out while another class does. `openPassesFor()`
     against `openPassesIn()` is the whole difference, and a build that used the second would draw
     two cards here and pass every other check in this section. */
  const nextDoor = await openCard(otherClass);
  check('the banner is scoped to the class on screen: nothing next door, while two students are still out of this one',
    !!nextDoor.passBanner && nextDoor.passBanner.shown === false
      && nextDoor.passBanner.cards.length === 0 && nextDoor.passBanner.label === ''
      /* And the document still says two, so this is a banner that is scoped rather than a banner
         that is broken. */
      && nextDoor.openPasses.length === 2
      && nextDoor.rows.length > 0 && nextDoor.rows.every((r) => r.pass && !r.pass.out),
    'next door: banner shown = ' + (nextDoor.passBanner || {}).shown + ' with '
      + ((nextDoor.passBanner || {}).cards || []).length + ' card(s), while the document holds '
      + nextDoor.openPasses.length + ' open pass(es) across ' + nextDoor.rows.length + ' row(s) here');
  const backHere = await openCard(passClass);
  check('and it is drawn again on the class the passes belong to, unchanged by the trip next door',
    backHere.passBanner.shown === true && backHere.passBanner.cards.length === 2
      && backHere.passBanner.cards.map((c) => c.student).sort().join(',')
        === [outB, outC].sort().join(','),
    backHere.passBanner.cards.length + ' card(s) back: '
      + JSON.stringify(backHere.passBanner.cards.map((c) => c.name)));

  /*
    ── the note, and the shape rule it has to follow ──

    Typed into the card's own field, twice: whitespace first, which must leave NO KEY, and then a
    sentence, which must leave exactly one. That is src/attendance.js's own rule for a mark's note
    and acceptance line 6 asks for it here — a pass with no note carries no `note` key at all, not
    an empty string.
  */
  const noteSel = '[data-pass-note="' + outB + '"]';
  const typeNote = (sel, text) => evalJs('(function(){ var e = document.querySelector('
    + JSON.stringify(sel) + '); if (!e) return 0; e.value = ' + JSON.stringify(text)
    + '; e.dispatchEvent(new Event("input", { bubbles: true })); return 1; })()');
  await typeNote(noteSel, '   ');
  const blankNote = await read();
  await typeNote(noteSel, 'nurse said to come straight back');
  const typedNote = await read();
  const openB = typedNote.openPasses.filter((p) => p.studentId === outB)[0] || {};
  check('a note typed on the card lands on the open pass — and whitespace alone leaves no key at all',
    (blankNote.openPasses.filter((p) => p.studentId === outB)[0] || {}).keys
      === 'classId,id,out,studentId,type'
      && openB.note === 'nurse said to come straight back'
      && openB.keys === 'classId,id,note,out,studentId,type'
      /* On the open pass and nowhere else. Nothing is finished, so nothing may have reached the
         history. */
      && typedNote.passLogJson === banner0.passLogJson,
    'the entry carried ' + JSON.stringify((blankNote.openPasses
      .filter((p) => p.studentId === outB)[0] || {}).keys) + ' after whitespace and '
      + JSON.stringify(openB.keys) + ' after a sentence; the log is unchanged at '
      + typedNote.passLog.length + ' entr(ies)');

  /*
    ── THE TAP THIS WORK ORDER EXISTS FOR ──

    Cancel, from the card, on a pass that is open and carries a note. Four things have to be true
    afterwards and they fail separately: the history is byte-identical, the open pass is gone, the
    ROW that issued it has its three buttons back (card → cell), and the note is nowhere in the
    document — not in either collection and not anywhere else either, which is why the whole
    serialised document is searched rather than the two arrays.
  */
  const beforeCancel = typedNote.passLogJson;
  await clickSel('[data-pass-cancel="' + outB + '"]');
  const cancelled = await read();
  const rowCancelled = cancelled.rows.filter((r) => r.student === outB)[0] || {};
  check('cancelling from the card leaves `passes` BYTE-IDENTICAL and takes the open pass with it',
    cancelled.passLogJson === beforeCancel
      && cancelled.passLog.length === typedNote.passLog.length
      && cancelled.openPasses.length === typedNote.openPasses.length - 1
      && !cancelled.openPasses.some((p) => p.studentId === outB)
      /* The card is gone and the row it came from offers the three types again — the two surfaces
         moving together is acceptance line 8's second clause, in the card-to-cell direction. */
      && cancelled.passBanner.cards.length === 1
      && cancelled.passBanner.cards[0].student === outC
      && !!rowCancelled.pass && rowCancelled.pass.out === false
      && rowCancelled.pass.types === 'bathroom,nurse,quick' && rowCancelled.pass.off === 0,
    'the log is ' + (cancelled.passLogJson === beforeCancel ? 'byte-identical' : 'DIFFERENT')
      + ' at ' + cancelled.passLog.length + ' entr(ies), ' + cancelled.openPasses.length
      + ' pass(es) still open, ' + cancelled.passBanner.cards.length
      + ' card(s) on the banner, and that row now offers ' + JSON.stringify(rowCancelled.pass));

  check('a note on a cancelled pass goes where the pass goes — nowhere in the document at all',
    typedNote.docJson.indexOf('nurse said to come straight back') >= 0
      && cancelled.docJson.indexOf('nurse said to come straight back') < 0,
    'the phrase was in the document before the cancel = '
      + (typedNote.docJson.indexOf('nurse said to come straight back') >= 0)
      + ', after it = ' + (cancelled.docJson.indexOf('nurse said to come straight back') >= 0));

  check('and cancelling wrote no attendance either: no record, no mark moved, nobody made absent by a mis-tap',
    cancelled.records.length === cancelRecords
      && JSON.stringify(cancelled.values) === cancelValues
      && rowCancelled.codes.charAt(0) === 'P',
    cancelled.records.length + ' attendance record(s) (was ' + cancelRecords
      + '), marks across the document = ' + JSON.stringify(cancelled.values)
      + ' (was ' + cancelValues + '); that row still reads "' + rowCancelled.codes + '"');

  /*
    ── acceptance line 2: the slot comes back IMMEDIATELY ──

    Taken to the cap, cancelled from the card, and then a FOURTH student is sent out with no reload
    and no repaint in between. A build that freed the slot in the document but not on the screen
    would leave the buttons grey; a build that did neither would refuse the issue outright, and the
    document is read after it either way.
  */
  const outE = passRoster[4];
  const outF = passRoster[5];
  await clickSel('[data-pass-issue="' + outD + '"][data-pass-type="nurse"]');
  await clickSel('[data-pass-issue="' + outE + '"][data-pass-type="bathroom"]');
  const atCapAgain = await read();
  await clickSel('[data-pass-cancel="' + outD + '"]');
  const freed = await read();
  await clickSel('[data-pass-issue="' + outF + '"][data-pass-type="quick"]');
  const refilled = await read();
  check('a cancelled pass frees its slot against the cap of three immediately — the next student goes out with no reload',
    atCapAgain.openPasses.length === 3 && /3 students/.test(atCapAgain.passNote)
      && atCapAgain.passBanner.cards.length === 3
      /* The moment after the cancel: two out, the reason line down, and every remaining row's
         buttons live again. */
      && freed.openPasses.length === 2 && freed.passNote === ''
      && freed.passBanner.cards.length === 2
      && freed.rows.filter((r) => r.pass && !r.pass.out).every((r) => r.pass.off === 0)
      /* And the slot is real, not merely drawn: the next issue lands. */
      && refilled.openPasses.length === 3
      && refilled.openPasses.some((p) => p.studentId === outF)
      && refilled.passBanner.cards.length === 3
      /* All of it without one entry reaching the history. */
      && refilled.passLogJson === beforeCancel,
    'at the cap: ' + atCapAgain.openPasses.length + ' out with the line up; after the cancel: '
      + freed.openPasses.length + ' out, line = ' + JSON.stringify(freed.passNote)
      + '; after the next issue: ' + refilled.openPasses.length + ' out and '
      + refilled.passLog.length + ' logged (unchanged = '
      + (refilled.passLogJson === beforeCancel) + ')');

  /*
    ── acceptance lines 5 and 6: Return still works, and the note rides through it ──

    Returned from the ROW rather than from the card, which is acceptance line 8's other direction:
    the cell writes and the card has to notice. The note is typed on the card first, so what is
    being asked is whether a note typed on one surface survives an action taken on the other.
  */
  await typeNote('[data-pass-note="' + outC + '"]', 'walked down to the office');
  const notedC = await read();
  await clickSel('[data-pass-return="' + outC + '"]');
  const returnedC = await read();
  const entryC = returnedC.passLog.filter((p) => p.studentId === outC)[0] || {};
  check('a note typed on the card survives the Return and is on the entry in `passes` — written from the row, and the card notices',
    (notedC.openPasses.filter((p) => p.studentId === outC)[0] || {}).note === 'walked down to the office'
      /* EXACTLY ONE entry, and the count is taken against the log this section has been holding
         byte-identical through four cancels. Cancel has not weakened Return. */
      && returnedC.passLog.length === refilled.passLog.length + 1
      && entryC.note === 'walked down to the office' && entryC.endedBy === 'return'
      && entryC.keys === 'back,classId,endedBy,id,minutes,note,out,studentId,type'
      && typeof entryC.minutes === 'number'
      /* The card went with the pass, and the row it belonged to has its three buttons back. */
      && returnedC.passBanner.cards.length === 2
      && !returnedC.passBanner.cards.some((c) => c.student === outC)
      && (returnedC.rows.filter((r) => r.student === outC)[0] || {}).pass.out === false,
    'the log went from ' + refilled.passLog.length + ' to ' + returnedC.passLog.length
      + ' entr(ies); the new one is ' + JSON.stringify(entryC) + ' and the banner is down to '
      + returnedC.passBanner.cards.length + ' card(s)');

  /* And the other half of the shape rule, on the same tap path: a pass nobody noted writes an entry
     with no `note` key at all. Returned from the CARD this time, so both buttons that carry the
     hook have been driven. */
  await clickSel('.attendance-pass-card [data-pass-return="' + outE + '"]');
  const returnedE = await read();
  const entryE = returnedE.passLog.filter((p) => p.studentId === outE)[0] || {};
  check('and a pass with no note carries no `note` key at all — the same rule a mark cell follows',
    returnedE.passLog.length === returnedC.passLog.length + 1
      && entryE.note === undefined
      && entryE.keys === 'back,classId,endedBy,id,minutes,out,studentId,type'
      && entryE.endedBy === 'return'
      && returnedE.passBanner.cards.length === 1
      && returnedE.passBanner.cards[0].student === outF,
    'that entry is ' + JSON.stringify(entryE) + ', leaving '
      + returnedE.passBanner.cards.length + ' card(s) on the banner');

  /*
    ── THE TRAPS PARAGRAPH, AS A CHECK ──

    `passes` is append-only and this work order is the one exception being carved into that rule, so
    it must not become two. cancelPass() is asked — through the seam, because a finished pass has no
    card and therefore no button — to remove an entry that has already been RETURNED. It has to
    refuse, and the array has to come back byte-identical.

    Asked twice, and the second is the one that would catch a cancel written to take an id: once by
    the student whose pass this section just returned, and once with the finished entry's own id
    passed as the student, which is the shape a "cancel by id" implementation would accept.
  */
  const gated = await evalJs(`(async function(){
    var s = window.planbook.store, p = window.planbook.passes;
    var before = JSON.stringify(s.getDoc().passes);
    var out = { before: before, byStudent: null, byId: null };
    s.update(function(d){ out.byStudent = p.cancelPass(d, ${JSON.stringify(passClass)},
      ${JSON.stringify(outC)}); });
    s.update(function(d){ out.byId = p.cancelPass(d, ${JSON.stringify(passClass)},
      ${JSON.stringify(entryC.id)}); });
    await s.flush();
    out.after = JSON.stringify(s.getDoc().passes);
    out.open = s.getDoc().openPasses.length;
    return out; })()`);
  check('cancelPass() refuses a pass that has already been returned: the one exception to append-only does not become two',
    gated.byStudent === null && gated.byId === null
      && gated.after === gated.before
      && gated.after.indexOf('walked down to the office') >= 0
      && gated.open === 1,
    'it returned ' + JSON.stringify(gated.byStudent) + ' for the student and '
      + JSON.stringify(gated.byId) + ' for the finished entry\'s own id; the log is '
      + (gated.after === gated.before ? 'byte-identical' : 'DIFFERENT') + ' and still holds '
      + 'the returned trip with its note');

  /* And the banner goes away entirely when this class has nobody out — the last clause of
     acceptance line 8, asserted by emptying the room rather than by starting from an empty one. */
  await clickSel('[data-pass-cancel="' + outF + '"]');
  const emptyRoom = await read();
  check('the banner disappears entirely when the class on screen has nobody out',
    emptyRoom.openPasses.length === 0 && emptyRoom.passBanner.shown === false
      && emptyRoom.passBanner.cards.length === 0 && emptyRoom.passBanner.label === ''
      && emptyRoom.passLogJson === returnedE.passLogJson
      && emptyRoom.rows.every((r) => r.pass && !r.pass.out && r.pass.off === 0),
    emptyRoom.openPasses.length + ' open pass(es), banner shown = '
      + emptyRoom.passBanner.shown + ' with ' + emptyRoom.passBanner.cards.length
      + ' card(s), and the log unchanged by the last cancel = '
      + (emptyRoom.passLogJson === returnedE.passLogJson));

  /* The rest of this section — WO-2.9's hall passes, WO-2.3's days off and the
     2026-08-08 punch list — is tools/verify/attendance-passes.mjs. It was split off by
     WO-1.26 on length alone: one file of 5,400 lines is the shape that work order
     exists to stop. The two halves are ONE section — the fixtures above are the
     fixtures below's preconditions — so everything the second half reads is handed
     over here by name rather than re-derived. A name added above and used below goes
     in this object and in that file's destructure, and nowhere else. */
  await passes(h, {
    closeAll, goHome, read, openCard, park, start, ids, marking, opened, first, others, seen,
    absent, finished, three, noted, dismissed, taken, untaken, dropped, week, apart, paged, marked,
    home, typed, searched, sorted, second, day, back, reset, passClass, passRoster, outA, outB,
    outC, outD, issued, fourth, wound, returned, drawn, typeNote, cancelled
  });
}
}
