/* totals-render-cost.mjs — attendance totals render cost (WO-2.13)
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

/* ───────── attendance totals render cost (WO-2.13) ───────── */
console.log('\n--- attendance totals render cost (WO-2.13) ---');
{
  const timing = await evalJs(`(function(){
    var s=window.planbook.store, a=window.planbook.attendance, c=window.planbook.classes;
    var d=s.getDoc(), old=JSON.stringify(d), oldClass=c.getSelectedClassId();
    var cls=(d.classes||[])[0]; if(!cls) return {fixture:false,why:'no class'};
    var ids=[]; d.students=[]; cls.roster=[];
    for(var i=0;i<27;i++){var id='wo213-student-'+i;ids.push(id);d.students.push({id:id,first:'Student',last:String(i)});cls.roster.push(id);}
    cls.terms=[{id:'tm_wo213',label:'Quarter 1',start:'2026-01-01',end:'2026-03-31'}];
    d.attendance=[];
    for(var day=0;day<175;day++){
      var date=new Date(Date.UTC(2026,0,1+day)).toISOString().slice(0,10), marks={};
      if(day===1||day===89)marks[ids[0]]={code:'A'};
      if(day===2)marks[ids[0]]={code:'T'};
      d.attendance.push({classId:cls.id,date:date,marks:marks});
    }
    for(var extra=0;extra<700;extra++)d.attendance.push({classId:'wo213-other-'+extra,date:'2025-01-01',marks:{}});
    c.selectClass(cls.id); a.renderAttendance();
    var samples=[];
    for(var run=0;run<9;run++){var start=performance.now();a.renderAttendance();samples.push(performance.now()-start);}
    samples.sort(function(x,y){return x-y;});
    var hasCount=typeof a.resetMeetingDatesCallCount==='function'&&typeof a.meetingDatesCallCount==='function';
    var calls=null;if(hasCount){a.resetMeetingDatesCallCount();a.renderAttendance();calls=a.meetingDatesCallCount();}
    var target='2026-03-31';a.editDay(target);a.setFilter('A');
    var rowSel='[data-attendance-row="'+ids[0]+'"] .attendance-student-totals';
    var beforeRow=(document.querySelector(rowSel)||{}).textContent||'';
    var beforeClass=(document.getElementById('attendanceTotals')||{}).textContent||'';
    var threw='';try{a.setMark(ids[0],'P',target);}catch(e){threw=e&&e.message||String(e);}
    var afterRow=(document.querySelector(rowSel)||{}).textContent||'';
    var afterClass=(document.getElementById('attendanceTotals')||{}).textContent||'';
    a.setFilter('all');a.setMark(ids[0],'A',target);a.setFilter('A');
    var unconfirmThrew='';try{a.unconfirmAll(target);}catch(e){unconfirmThrew=e&&e.message||String(e);}
    var afterUnconfirmRow=(document.querySelector(rowSel)||{}).textContent||'';
    var result={fixture:true,records:d.attendance.length,meetings:175,rows:ids.length,
      median:samples[4],samples:samples,calls:calls,beforeRow:beforeRow,afterRow:afterRow,
      beforeClass:beforeClass,afterClass:afterClass,
      threw:threw,unconfirmThrew:unconfirmThrew,afterUnconfirmRow:afterUnconfirmRow};
    var restored=JSON.parse(old);Object.keys(d).forEach(function(k){delete d[k];});Object.assign(d,restored);
    s.update(function(){});if(oldClass)c.selectClass(oldClass);a.setFilter('all');a.renderAttendance();return result;
  })()`);
  console.log('MEASURE | renderAttendance() at 875 records / 175 meetings / 27 rows | '
    + (timing && timing.fixture ? timing.median.toFixed(2)+' ms median | '+JSON.stringify(timing.samples)
      : 'fixture failed: '+JSON.stringify(timing)));
  check('the WO-2.13 performance fixture is exactly 875 records / 175 meetings / 27 rows',
    timing && timing.fixture && timing.records === 875 && timing.meetings === 175 && timing.rows === 27,
    JSON.stringify(timing && {records:timing.records,meetings:timing.meetings,rows:timing.rows}));
  check('meetingDates() is called a constant two times for a dated-term render',
    timing && (timing.calls === null || timing.calls === 2), timing ? timing.calls+' call(s)' : 'fixture did not run');
  /* THE ROW IS THE WHOLE CLAIM NOW (WO-2.53). It was the row AND the open detail panel below it —
     that panel carried the same student's term and year counts in one line, and it was the surface
     this check watched from the MARK path while WO-2.18's watched it from the term-switch path. The
     panel is gone; the row's own line is still folded out of the same shared per-render pass, on a
     row an active filter has taken off the screen, which is the case WO-2.13 exists for. */
  check('a filtered-out row repaints exact term totals after a mark',
    timing && !timing.threw
      && timing.beforeRow === 'Quarter 1 · P 87 · T 1 · A 2 · E 0 · D 0 · 98%'
      && timing.afterRow === 'Quarter 1 · P 88 · T 1 · A 1 · E 0 · D 0 · 99%'
      && timing.beforeClass === timing.afterClass,
    JSON.stringify(timing && {row:[timing.beforeRow,timing.afterRow],
      class:[timing.beforeClass,timing.afterClass],threw:timing.threw}));
  check('unconfirmAll() repaints a filtered-out row under an active filter without throwing',
    timing && !timing.unconfirmThrew
      && timing.afterUnconfirmRow === 'Quarter 1 · P 87 · T 1 · A 2 · E 0 · D 0 · 98%',
    JSON.stringify(timing && {row:timing.afterUnconfirmRow,threw:timing.unconfirmThrew}));
}
}
