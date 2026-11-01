/* excused-report.mjs — the student report lists excused work, with any score it kept (WO-3.70)
 *
 * Since WO-3.68 an excused cell may keep the score it had, and the grade sheet, its CSV and the score
 * history show it. The student report could not: its screen and studentCsv() listed openWork()'s rows,
 * and excused work is in none of them. WO-3.70 gives the report a third kind of row — the engine's
 * excusedWork(), a sibling of openWork() and heldWork() — on a card of its own and in the CSV's Work
 * section, with the grade sheet's own mark (`Ex (62)`, or `Ex` alone).
 *
 * THE FIXTURE, BY HAND. One weighted class, Quizzes 50% (drop lowest 1) and Tests 50%, two students,
 * fixed dates so the golden text below does not move with the clock:
 *
 *            t1 Test  q1 Quiz 1  q2 Quiz 2  q3 Quiz 3  q4 Quiz 4  qh Held quiz  lo Loose
 *            100      100        20         20         20         10 (held)     10 (no category)
 *   Ana      80       Ex (62)    Ex         —          15         Ex (7)        Ex
 *   Ben      70       90         missing    —          18         —             5
 *
 *   Ana: Quizzes hold one scored cell, q4 15/20 = 75% (the drop keeps the best, ruling 4), Tests 80%,
 *        so 77.5%. Her live excused pieces are q1 (kept 62), q2 and lo — the report lists those three,
 *        in that order (categories in order, then the work filed under none). Her held quiz is excused
 *        with 7 kept: it is HELD WORK, listed once on the held card, and not again as excused.
 *   Ben: NO EXCUSED CELL ANYWHERE, and every other kind of row: q3 outstanding, q2 missing, qh held and
 *        ungraded, q1 dropped (90% ties q4's 90%, and q1 is due earlier). His report's text and his CSV
 *        must be the bytes the build before WO-3.70 drew, which is GOLDEN below — captured from that
 *        build by this very section, not written by hand.
 *
 * GOLDEN is the pre-change output, captured at the parent of the WO-3.70 change with the src/ files
 * unedited (the capture run is recorded in TESTING.md § WO-3.70). Ana's grade in both modes, her
 * openWork() rows and the text of her to-move and missing cards are in it too: Acceptance line 2 says
 * the new rows change none of them, and "the same as before" is only checkable against before.
 *
 * Presentation mode is read the way the held and dropped cards are drawn: src/detail.js asks it
 * nothing, so the excused card must draw the same words in both modes. Plants its own class through
 * the store, takes it back out, and leaves presentation mode where it found it. No reload, no viewport
 * change — the rows are text, not controls, so there is no touch target to measure.
 *
 * WHAT IS NOT HERE AND IS OWED TO A HUMAN: whether the excused rows READ clearly on the iPad, in normal
 * mode and in presentation mode. Computed colour proves the mark is drawn in the excused purple; no
 * emulator has eyes.
 */

export async function run(h) {
const { check, skip, evalJs, clickSel } = h;

console.log('\n--- the student report lists excused work, with any score it kept (WO-3.70) ---');
if (!(await evalJs("!!(window.planbook && window.planbook.detail && window.planbook.gradeEngine"
  + " && window.planbook.store && window.planbook.classes && window.planbook.supports)"))) {
  skip('the student report lists excused work (WO-3.70)', 'window.planbook is missing detail, '
    + 'gradeEngine, store, classes or supports, so the report cannot be read back');
  return;
}

const CLS = 'c_wo370', TERM = 'tm370', QUIZ = 'k370q', TEST = 'k370t';
const S = { ana: 'wo370-ana', ben: 'wo370-ben' };
const A = { t1: 'a370-t1', q1: 'a370-q1', q2: 'a370-q2', q3: 'a370-q3', q4: 'a370-q4', qh: 'a370-qh',
  lo: 'a370-lo' };

/* The pre-change output (see the header). `Exported,<date>` is written as EXPORTED in both the golden
   and the reading, because it is today's date and the only line of the file that is. */
const GOLDEN = {
  benText: 'BBBen BrambleWO-3.70 Excused report \u00b7 Q2 \u00b7 1 piece outstanding \u00b7 1 missing \u00b7'
    + ' 1 held57.50%F \u00b7 next D- at 60%Where the grade comes fromCategoryWeightEarnedCategory %Coun'
    + 'ts atContributesQuizzes50%18 / 4045.00%50%22.50Tests50%70 / 10070.00%50%35.00Overall100%57.50%Th'
    + 'e last column adds up to the overall grade. A category with nothing graded in it does not count '
    + 'as a zero \u2014 its weight is shared out across the categories that do have work, which is why '
    + 'the \u201ccounts at\u201d column can differ from the weight beside it.What it would take to move'
    + 'Ben Bramble is at 57.50% \u2014 a F. The next band up is 60% \u2014 a D-. 1 piece of work is sti'
    + 'll outstanding, worth 20 points in total: WO-3.70 Quiz 3 (20 pts).Scoring nothing on it leaves 5'
    + '0.00%. Full marks makes 66.67%.So scoring 60.01% on all of it lands at 60.00%, which is a D-. Th'
    + 'e arithmetic is a straight line between those two figures, so any score in between lands in betw'
    + 'een.Separately: 1 piece of work is marked missing \u2014 WO-3.70 Quiz 2. Handing it in and scori'
    + 'ng it in full would put the grade at 82.50%, a B-.Missing work \u00b7 20 points at stakeWO-3.70 '
    + 'Quiz 2Quizzes20 ptsMissing is marked by you and is never worked out from a due date, so nothing '
    + 'on this list appeared because a date rolled over. A blank score is not on this list either: blan'
    + 'k means ungraded and counts toward nothing until you say otherwise. Work marked missing counts a'
    + 's zero out of its full points, which is already in Ben Bramble\u2019s grade above.Held out of th'
    + 'e grade \u00b7 1 pieceWO-3.70 Held quizQuizzesnot graded yetHeldYou are holding these columns ou'
    + 't of the grade while you reconcile them \u2014 the columns the Scores screen marks Held. Nothing'
    + ' in them counts toward Ben Bramble\u2019s grade above or toward what it would take to move, a mi'
    + 'ssing mark included, until you commit the column.Dropped from the grade \u00b7 1 scoreWO-3.70 Qu'
    + 'iz 1Quizzes90 of 100DroppedThese categories leave each student\u2019s lowest scores out of the g'
    + 'rade, and these are Ben Bramble\u2019s \u2014 the scores the Scores screen strikes through and m'
    + 'arks dropped. They are kept and count toward nothing in the grade above. A later, lower score ta'
    + 'kes the drop over by itself. A score marked missing is never dropped.Attendance \u00b7 No record'
    + 'ed meetings0Present0Tardy0Absent0Event0DismissedTermPTAEDMeetingsAttendanceQ2 \u2014 open000000'
    /* WO-2.62: the term table's percentage cell reads a dash where it read the sentence, with the
       sentence as the cell's accessible name, which textContent does not carry. Two cells, edited
       by hand from the build before; nothing else in this golden moved. */
    + '\u2014Whole year000000\u2014Out of 0 recorded meetings in Q2 \u2014 n'
    + 'ot school days. A day this class did not meet, a holiday, and a day nobody has marked yet all co'
    + 'unt toward nothing in either direction.Q2, day by day \u00b7 0 meetingsNo meetings have been rec'
    + 'orded for WO-3.70 Excused report in this term yet. A day only appears here once it has been take'
    + 'n \u2014 a day nobody has marked is not a day nobody met.Hall passes \u00b7 noneNo hall passes a'
    + 're recorded for this student in Q2.Every trip that ended is here, oldest first \u2014 Q2 only. A'
    + ' pass that was cancelled never happened and was never written down, and a student who is out of '
    + 'the room right now is counted when they come back. None of this is attendance: a student on a ha'
    + 'll pass was present.What you have written downNothing to show here yet \u2014 what you write dow'
    + 'n from a class roster appears on this card, newest first.Who you have written toNothing to show '
    + 'here yet \u2014 a message you hand to your mail app from a signal card or from this record appea'
    + 'rs here, newest first.Newest first. Planbook records the moment you handed a message to your mai'
    + 'l app \u2014 it cannot tell whether you sent it from there, so this is what you wrote and when, '
    + 'not proof of delivery. Entries are never edited or deleted.This page is grades, attendance, hall'
    + ' passes, what you have written down and who you have written to, and nothing else. Nothing from '
    + 'Ben Bramble\u2019s support details is on it, on the printed sheet or in the CSV, in either mode '
    + '\u2014 those live on the roster and go nowhere but your own backup file. What you have written d'
    + 'own, who you have written to, any note on a score and what a changed score was are on the screen'
    + ' only: none of them is on the sheet or in the CSV.',
  benCsv: '\ufeffPlanbook \u2014 student grade detail\r\nStudent,Bramble,Ben\r\nClass,WO-3.70 Excused repor'
    + 't\r\nTerm,Q2\r\nOverall grade,57.50%,F\r\nExported,EXPORTED\r\n\r\nCategory,Weight %,Earned,Poss'
    + 'ible,Category %,Counts at %,Contributes\r\nQuizzes,50,18,40,45.00%,50,22.50\r\nTests,50,70,100,7'
    + '0.00%,50,35.00\r\nOverall,100,,,,,57.50%\r\n\r\nWork,Category,Points,State\r\nWO-3.70 Quiz 2,Qui'
    + 'zzes,20,marked missing\r\nWO-3.70 Quiz 3,Quizzes,20,outstanding\r\nWO-3.70 Held quiz,Quizzes,10,'
    + 'held \u2014 not graded yet\r\nWO-3.70 Quiz 1,Quizzes,100,"dropped \u2014 scored 90 of 100, not '
    + 'counted"\r\n\r\nAttendance,Count\r\nPresent,0\r\nTardy,0\r\nAbsent,0\r\nEvent,0\r\nDismissed,0\r'
    + '\nRecorded meetings,0\r\nAttendance %,\r\n',
  anaGrade: 77.5,
  anaPoints: 79.16666666666666,
  anaOpen: '[{"id":"a370-q3","categoryId":"k370q","points":20,"state":"open"}]',
  anaMove: 'What it would take to moveAna Aster is at 77.50% \u2014 a C+. The next band up is 80% \u2014 a B'
    + '-. 1 piece of work is still outstanding, worth 20 points in total: WO-3.70 Quiz 3 (20 pts).Scori'
    + 'ng nothing on it leaves 58.75%. Full marks makes 83.75%.So scoring 85.00% on all of it lands at '
    + '80.00%, which is a B-. The arithmetic is a straight line between those two figures, so any score'
    + ' in between lands in between.',
  anaMissing: 'Missing workNothing is marked missing.Missing is marked by you and is never worked out from a du'
    + 'e date, so nothing on this list appeared because a date rolled over. A blank score is not on thi'
    + 's list either: blank means ungraded and counts toward nothing until you say otherwise. Work mark'
    + 'ed missing counts as zero out of its full points, which is already in Ana Aster\u2019s grade abo'
    + 've.',
  benGrade: 57.5,
  benOpen: '[{"id":"a370-q2","categoryId":"k370q","points":20,"state":"missing"},{"id":"a37'
    + '0-q3","categoryId":"k370q","points":20,"state":"open"}]',
  benHeld: '[{"id":"a370-qh","categoryId":"k370q","points":10,"state":"open","column":"held'
    + '"}]',
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const plant = await evalJs(`(async function(){
  var s = window.planbook.store, c = window.planbook.classes;
  var d = s.getDoc();
  if (!d) return { ok:false, why:'no year document is open' };
  var was = c.getSelectedClassId();
  var mode = window.planbook.supports.presentationMode();
  window.planbook.supports.setPresentationMode(false);
  var S = ${JSON.stringify(S)}, A = ${JSON.stringify(A)};
  s.update(function(doc){
    if (!Array.isArray(doc.classes)) doc.classes = [];
    if (!Array.isArray(doc.students)) doc.students = [];
    if (!Array.isArray(doc.assignments)) doc.assignments = [];
    if (!doc.scores) doc.scores = {};
    doc.students.push({ id:S.ana, first:'Ana', last:'Aster' }, { id:S.ben, first:'Ben', last:'Bramble' });
    doc.classes.push({ id:'${CLS}', name:'WO-3.70 Excused report', archived:false, letterScale:null,
      roster:[S.ana, S.ben],
      terms:[{ id:'${TERM}', label:'Q2', start:'2026-07-01', end:'2030-06-30' }],
      categories:[{ id:'${QUIZ}', name:'Quizzes', weight:50, dropLowest:1 },
                  { id:'${TEST}', name:'Tests', weight:50 }]});
    var add = function(id, cat, name, points, due, held){
      var a = { id:id, classId:'${CLS}', termId:'${TERM}', categoryId:cat,
        name:name, points:points, assigned:'2026-09-01', due:due };
      if (held) a.held = true;
      doc.assignments.push(a);
    };
    add(A.t1, '${TEST}', 'WO-3.70 Unit Test', 100, '2026-09-20');
    add(A.q1, '${QUIZ}', 'WO-3.70 Quiz 1', 100, '2026-09-10');
    add(A.q2, '${QUIZ}', 'WO-3.70 Quiz 2', 20, '2026-09-12');
    add(A.q3, '${QUIZ}', 'WO-3.70 Quiz 3', 20, '2026-09-14');
    add(A.q4, '${QUIZ}', 'WO-3.70 Quiz 4', 20, '2026-09-16');
    add(A.qh, '${QUIZ}', 'WO-3.70 Held quiz', 10, '2026-09-18', true);
    add(A.lo, '', 'WO-3.70 Loose', 10, '2026-09-22');
    var put = function(a, st, cell){ if (!doc.scores[a]) doc.scores[a] = {}; doc.scores[a][st] = cell; };
    put(A.t1, S.ana, { v:80 });                  put(A.t1, S.ben, { v:70 });
    put(A.q1, S.ana, { v:62, flag:'excused' });  put(A.q1, S.ben, { v:90 });
    put(A.q2, S.ana, { v:null, flag:'excused' }); put(A.q2, S.ben, { v:null, flag:'missing' });
    put(A.q4, S.ana, { v:15 });                  put(A.q4, S.ben, { v:18 });
    put(A.qh, S.ana, { v:7, flag:'excused' });
    put(A.lo, S.ana, { v:null, flag:'excused' }); put(A.lo, S.ben, { v:5 });
  });
  c.selectClass('${CLS}'); c.selectTerm('${TERM}');
  c.refreshClassBar();
  await s.flush();
  return { ok:true, was: was, mode: mode, open: c.getOpenTermId('${CLS}') }; })()`);

if (!plant || !plant.ok || plant.open !== TERM) {
  check('the WO-3.70 fixture is real: one class of two, open on its term', false, JSON.stringify(plant));
  return;
}

/* One student's report, drawn by the screen's own renderDetail() and read back: the content's text,
   the CSV with its date masked, and the pieces the checks name. Drawn into the detail view whether or
   not it is showing — textContent does not need layout. */
const report = (s) => evalJs(`(function(){
  var p = window.planbook, d = p.store.getDoc(), g = p.gradeEngine;
  var cls = d.classes.filter(function(c){ return c.id === '${CLS}'; })[0];
  p.detail.openDetail('${S[s]}');
  p.detail.renderDetail();
  var content = document.getElementById('detailContent');
  var csv = p.detail.studentCsv(p.detail.detailModel()).text.replace(/\\r\\nExported,[0-9-]+\\r\\n/, '\\r\\nExported,EXPORTED\\r\\n');
  var excusedCard = content.querySelector('[data-detail-excused]');
  var rows = Array.prototype.map.call(content.querySelectorAll('[data-detail-excused-row]'), function(r){
    var mark = r.querySelector('.detail-excused-mark');
    return { id: r.getAttribute('data-detail-excused-row'), mark: mark ? mark.textContent : null }; });
  var held = content.querySelector('[data-detail-held]');
  var move = content.querySelector('.detail-move');
  var missing = null;
  Array.prototype.forEach.call(content.querySelectorAll('.detail-card'), function(card){
    var t = card.querySelector('.detail-card-title');
    if (t && /^Missing work/.test(t.textContent)) missing = card.textContent; });
  var clone = JSON.parse(JSON.stringify(d));
  var pc = clone.classes.filter(function(c){ return c.id === '${CLS}'; })[0];
  pc.gradingMode = 'points';
  var hero = content.querySelector('.detail-hero-sub');
  return { text: content.textContent, csv: csv,
    excused: excusedCard ? excusedCard.textContent : null, rows: rows,
    held: held ? held.textContent : null, hero: hero ? hero.textContent : null,
    move: move ? move.textContent : null, missing: missing,
    grade: g.classGrade(d, cls, '${TERM}', '${S[s]}').percentage,
    points: g.classGrade(clone, pc, '${TERM}', '${S[s]}').percentage,
    open: JSON.stringify(g.openWork(d, cls, '${TERM}', '${S[s]}')),
    heldWork: JSON.stringify(g.heldWork(d, cls, '${TERM}', '${S[s]}')),
    engineExcused: typeof g.excusedWork === 'function'
      ? JSON.stringify(g.excusedWork(d, cls, '${TERM}', '${S[s]}')) : null }; })()`);

const ana = await report('ana');
const ben = await report('ben');

if (GOLDEN === null) {
  /* The capture branch: run once against the build before the change, and paste what it prints. */
  console.log('WO370-CAPTURE ' + JSON.stringify({ benText: ben.text, benCsv: ben.csv,
    anaGrade: ana.grade, anaPoints: ana.points, anaOpen: ana.open, anaMove: ana.move,
    anaMissing: ana.missing, benGrade: ben.grade, benOpen: ben.open, benHeld: ben.heldWork }));
  check('WO-3.70: GOLDEN holds the pre-change report (capture run)', false, 'GOLDEN is null');
}
const G = GOLDEN || {};

/* ── ACCEPTANCE LINE 1: the screen and the CSV list each excused piece, kept score or `Ex` alone ── */
const csvLines = (x) => x.csv.split('\r\n');
const anaCsv = csvLines(ana);
check('WO-3.70: Ana\'s report draws an *Excused* card listing her three live excused pieces in order — Quiz 1 '
  + 'as `Ex (62)`, Quiz 2 and the loose work as `Ex` alone — in the grade sheet\'s own mark',
  ana.excused !== null && JSON.stringify(ana.rows) === JSON.stringify([
    { id: A.q1, mark: 'Ex (62)' }, { id: A.q2, mark: 'Ex' }, { id: A.lo, mark: 'Ex' }]),
  JSON.stringify({ rows: ana.rows, card: ana.excused }));
check('WO-3.70: Ana\'s CSV carries the same three rows in its Work section, after the live and held rows, '
  + 'State `excused — 62 kept` or `excused`',
  (function () {
    const at = (s) => anaCsv.indexOf(s);
    const q1 = at('WO-3.70 Quiz 1,Quizzes,100,excused — 62 kept');
    const q2 = at('WO-3.70 Quiz 2,Quizzes,20,excused');
    const lo = at('WO-3.70 Loose,,10,excused');
    const live = at('WO-3.70 Quiz 3,Quizzes,20,outstanding');
    const held = at('WO-3.70 Held quiz,Quizzes,10,"held — excused, 7 kept"');
    const att = at('Attendance,Count');
    return q1 > held && held > live && live > 0 && q2 === q1 + 1 && lo === q2 + 1 && att === lo + 2
      && anaCsv.filter((l) => /,excused/.test(l)).length === 3;
  })(),
  JSON.stringify(anaCsv));
check('WO-3.70: the engine\'s excusedWork() is ids, points and kept scores — no names — and its kept score '
  + 'is the one the cell holds',
  ana.engineExcused === JSON.stringify([
    { id: A.q1, categoryId: QUIZ, points: 100, state: 'excused', kept: 62 },
    { id: A.q2, categoryId: QUIZ, points: 20, state: 'excused', kept: null },
    { id: A.lo, categoryId: null, points: 10, state: 'excused', kept: null }]),
  String(ana.engineExcused));

/* ── ACCEPTANCE LINE 2: the grade, the to-move card and every openWork() reader are unchanged ── */
check('WO-3.70: Ana\'s grade (77.5% weighted, by hand), her openWork() rows, her to-move card and her '
  + 'missing card are what the build before WO-3.70 drew, in both grading modes',
  ana.grade === 77.5 && ana.grade === G.anaGrade && ana.points === G.anaPoints
    && ana.open === G.anaOpen && ana.move === G.anaMove && ana.missing === G.anaMissing
    && ana.open === JSON.stringify([{ id: A.q3, categoryId: QUIZ, points: 20, state: 'open' }]),
  JSON.stringify({ now: { grade: ana.grade, points: ana.points, open: ana.open, move: ana.move,
    missing: ana.missing }, before: G }));

/* ── ACCEPTANCE LINE 3: a held column's excused cell is listed once, as held work ── */
check('WO-3.70: Ana\'s excused Held quiz is on the held card as `excused, 7 kept`, counted in its title and '
  + 'the hero\'s `1 held`, and is not an excused row — not on screen, not from the engine, not in the CSV',
  ana.held !== null && /Held out of the grade · 1 piece/.test(ana.held)
    && /WO-3.70 Held quiz/.test(ana.held) && /excused, 7 kept/.test(ana.held)
    && / · 1 held$/.test(ana.hero || '')
    && ana.rows.every((r) => r.id !== A.qh) && String(ana.engineExcused).indexOf(A.qh) === -1
    && (ana.excused || '').indexOf('Held quiz') === -1
    && anaCsv.filter((l) => /WO-3\.70 Held quiz/.test(l)).length === 1,
  JSON.stringify({ held: ana.held, hero: ana.hero, rows: ana.rows }));

/* ── ACCEPTANCE LINE 4: a student with no excused work — the bytes of the build before ── */
check('WO-3.70: Ben, who has no excused cell, gets a report whose text is byte-identical to the build before '
  + 'WO-3.70 (outstanding, missing, held and dropped rows all present), and no *Excused* card',
  ben.text === G.benText && ben.excused === null && ben.rows.length === 0,
  JSON.stringify({ now: ben.text, before: G.benText }));
check('WO-3.70: Ben\'s CSV is byte-identical to the build before WO-3.70, and his grade, openWork() and '
  + 'heldWork() are too',
  ben.csv === G.benCsv && ben.grade === G.benGrade && ben.open === G.benOpen && ben.heldWork === G.benHeld
    && ben.engineExcused === '[]',
  JSON.stringify({ now: ben.csv, before: G.benCsv }));

/* ── PRESENTATION MODE: the held and dropped cards ask it nothing, and neither does this one ── */
const projected = await (async () => {
  await evalJs('(function(){ window.planbook.supports.setPresentationMode(true); return 1; })()');
  const r = await report('ana');
  await evalJs('(function(){ window.planbook.supports.setPresentationMode(false); return 1; })()');
  return r;
})();
check('WO-3.70: under presentation mode the excused card draws the same rows and words, as the held and '
  + 'dropped cards beside it do — the screen holds no second opinion about what a projector hides',
  projected.excused === ana.excused && JSON.stringify(projected.rows) === JSON.stringify(ana.rows)
    && projected.held === ana.held,
  JSON.stringify({ projected: projected.excused, normal: ana.excused }));

/* ── ON SCREEN, BY THE REAL PATH: the card is drawn and the mark wears the excused purple ── */
await evalJs(`(function(){ var all = document.querySelectorAll('[data-view-home]');
  for (var i = 0; i < all.length; i++) { var r = all[i].getBoundingClientRect();
    if (r.width > 0 && r.height > 0) { all[i].click(); return i; } } return -1; })()`);
await sleep(250);
await clickSel('#homeGrid [data-class-tab="' + CLS + '"]');
await sleep(250);
await clickSel('#classView [data-class-screen="scores"]');
await sleep(300);
await clickSel('#scoresBody [data-student-detail="' + S.ana + '"]');
await sleep(300);
const shown = await evalJs(`(function(){
  var v = document.getElementById('detailView'), card = v && v.querySelector('[data-detail-excused]');
  var mark = card && card.querySelector('.detail-excused-mark');
  var r = card ? card.getBoundingClientRect() : null;
  return { up: !!v && !v.classList.contains('hidden'), card: !!r && r.width > 0 && r.height > 0,
    color: mark ? getComputedStyle(mark).color : null }; })()`);
check('WO-3.70: opened from the Scores screen, Ana\'s report shows the *Excused* card, and its mark is drawn '
  + 'in the grid\'s excused purple, #7c3aed',
  shown.up && shown.card && shown.color === 'rgb(124, 58, 237)', JSON.stringify(shown));

/* ── THE FIXTURE COMES BACK OUT ── */
await evalJs(`(async function(){
  var s = window.planbook.store, c = window.planbook.classes;
  s.update(function(doc){
    doc.classes = doc.classes.filter(function(x){ return x.id !== '${CLS}'; });
    doc.students = doc.students.filter(function(x){ return String(x.id).indexOf('wo370-') !== 0; });
    doc.assignments = doc.assignments.filter(function(a){ return a.classId !== '${CLS}'; });
    Object.keys(doc.scores || {}).forEach(function(k){ if (String(k).indexOf('a370-') === 0) delete doc.scores[k]; });
  });
  window.planbook.supports.setPresentationMode(${plant.mode ? 'true' : 'false'});
  var was = ${JSON.stringify(plant.was || '')};
  if (was) c.selectClass(was);
  c.refreshClassBar();
  await s.flush();
  return 1; })()`);
const gone = await evalJs(`(function(){ var d = window.planbook.store.getDoc();
  return { classes: d.classes.filter(function(x){ return x.id === '${CLS}'; }).length,
    work: d.assignments.filter(function(a){ return a.classId === '${CLS}'; }).length,
    scores: Object.keys(d.scores || {}).filter(function(k){ return String(k).indexOf('a370-') === 0; }).length,
    mode: window.planbook.supports.presentationMode() }; })()`);
check('the WO-3.70 fixture came back off the document, and presentation mode was left as it was found',
  gone.classes === 0 && gone.work === 0 && gone.scores === 0 && gone.mode === !!plant.mode,
  JSON.stringify(gone));
}
