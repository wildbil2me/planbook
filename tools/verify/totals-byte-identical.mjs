/* totals-byte-identical.mjs — byte-identical total objects (WO-2.13)
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

export async function run(h) {
const { check, evalJs } = h;

/* ───────── byte-identical total objects (WO-2.13) ───────── */
console.log('\n--- byte-identical total objects (WO-2.13) ---');
{
  const exact = await evalJs(`(function(){
    var s=window.planbook.store,a=window.planbook.attendance,c=window.planbook.classes,d=s.getDoc();
    var cls=(d.classes||[])[0],student=cls&&(cls.roster||[])[0];
    if(!cls||!student)return {fixture:false};
    var oldAttendance=JSON.stringify(d.attendance||[]),oldEvents=JSON.stringify(d.events||[]);
    var dates=['2026-09-01','2026-09-03','2026-09-08','2026-09-11','2026-09-14',
      '2026-09-18','2026-09-21','2026-09-24','2026-09-29','2026-10-02'];
    d.attendance=dates.map(function(date,i){return {classId:cls.id,date:date,
      marks:i===4?Object.fromEntries([[student,{code:'E'}]]):{}};});
    d.attendance.push({classId:cls.id,date:'2026-09-04',exception:'dropped'});
    d.events=[{id:'wo213-day-off',kind:'no-school',title:'Fixture holiday',
      date:'2026-09-07',endDate:'2026-09-07',classIds:[]}];
    var excused=a.attendanceTotals(cls.id,student);
    var noMarks=a.attendanceTotals(cls.id,'wo-2-4-no-marks');
    d.attendance.push({classId:cls.id,date:'2026-10-05',
      marks:Object.fromEntries([[student,{code:'U'}]])});
    var withU=a.attendanceTotals(cls.id,student);
    var zero=a.attendanceTotals(cls.id,'student-with-no-meetings','2030-01-01','2030-12-31');
    d.attendance=JSON.parse(oldAttendance);d.events=JSON.parse(oldEvents);a.renderAttendance();
    return {fixture:true,excused:excused,noMarks:noMarks,withU:withU,zero:zero};
  })()`);
  const expected = {
    excused:{P:9,T:0,A:0,E:1,D:0,meetings:10,attended:10,percent:100},
    noMarks:{P:10,T:0,A:0,E:0,D:0,meetings:10,attended:10,percent:100},
    withU:{P:9,T:0,A:1,E:1,D:0,meetings:11,attended:10,percent:10/11*100},
    zero:{P:0,T:0,A:0,E:0,D:0,meetings:0,attended:0,percent:null}
  };
  check('attendanceTotals() returns byte-identical full objects for E, no-mark, U, and zero cases',
    exact && exact.fixture
      && JSON.stringify({excused:exact.excused,noMarks:exact.noMarks,withU:exact.withU,zero:exact.zero})
        === JSON.stringify(expected),
    JSON.stringify(exact));
}
}
