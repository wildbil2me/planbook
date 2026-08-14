/*
  Hall passes — who is out of the room, since when, and what happened to every pass that ended.

  This module is the MODEL only. It holds no DOM, reads no clock, and never calls the store: every
  function here takes the live year document and mutates it, or takes a document and reads it. The
  registry owns the screen, the clock and the src/store.js update() that wraps these calls
  (src/attendance.js). That split is what keeps the `D` coupling — a dismissal closing an open pass
  — inside the SAME update() as the mark that caused it, rather than as a second write that could
  land on its own if the first one threw.

  ── THE ONE THING THIS WORK ORDER EXISTS TO GET RIGHT ──

  Roll Call! keeps its open passes in a module variable — `activePasses`, dashboard.html:2437 — and
  that is the one thing not copied here. Over there the app runs a session on a machine that stays
  awake. Planbook is an installed iPad PWA that iOS suspends, evicts and force-quits, used by a
  teacher who is interrupted every period. An in-memory pass means a force-quit loses track of a
  student who is physically out of the room, and the app cannot say so afterwards because it no
  longer knows. That is a safety property, not a convenience, so an open pass is a record in the
  year document and reaches IndexedDB on the same debounced save as everything else.

  It does not go anywhere near the browser's synchronous key-value store either. That one holds
  `planbook_`-prefixed UI preferences and nothing else (CLAUDE.md), and a pass names a student.

  ── TWO COLLECTIONS, AND WHY NOT ONE, AND WHY NEITHER IS `log` ──

  `openPasses` is STATE: who is out right now. At most three per class, usually none, and an entry
  leaves it the moment the student is back.

  `passes` is HISTORY: one entry per pass that ENDED, appended on return and never edited
  afterwards. docs/data-model.md § log records the rule and where it came from — "Roll Call! made
  hall passes append-only after matching rows by `name + time` proved fragile" — and this array
  inherits it verbatim. Nothing in this file rewrites a field of an entry in `passes`. There is one
  removal, and it is the retraction described under the dismissal rule below.

  CANCELLING A PASS (WO-2.11) IS NOT A SECOND REMOVAL FROM `passes`, and the distinction is the
  whole of that work order. cancelPass() takes an entry out of `openPasses` and writes NOTHING —
  the history array is not read, not written, and not even named inside it. A tap that sent nobody
  anywhere is not a trip, so there is nothing for the append-only rule to protect; what that rule
  protects is trips that happened, and the retraction below is still the only thing in this file
  that removes one of those.

  They are two arrays rather than one array with an "is it finished" field because an open pass and
  a finished one are asked about by different code at different moments: the registry asks "is this
  student out?" every render, and WO-2.9's history asks "what happened this term?" once. One array
  would make the first question a filter over the second, and it would make "append-only" a claim
  about some of an array's fields rather than about the array.

  AND NEITHER OF THEM IS THE `log` ARRAY, which is the schema decision this work order deliberately
  left open. `log` is typed `kind: "behavior|contact|note"` and it is the OUTREACH record: Phase 4's
  cooldown reads it to suppress a repeated contact, the concern rules count behavior entries in it,
  and Phase 5's `{{behavior.recent}}` merge field renders it into an email. Four reasons passes stay
  out of it:

    - A pass in `log` is one missing `kind` filter away from "🚽 8 min" arriving in a message to a
      guardian. The same argument the rules over the roster's most sensitive fields make: put the
      mistake out of reach by construction rather than by remembering not to make it. (This file
      names none of those fields, so that tools/wo-sweep.mjs keeps reporting the short list of
      places that do.)
    - The fields do not overlap. A log entry has `audience`, `subject`, `body`; a pass has
      `classId`, `type`, `out`, `back`, `minutes`. One array whose shape depends on its `kind` is
      the polymorphic-cell mistake docs/data-model.md already refuses twice, one level up.
    - Volume. Five classes at a few passes a period is thousands of entries a year against a few
      hundred outreach ones. `log` would become mostly passes, and every reader of it would pay.
    - Phase 4 and WO-2.9 both want passes by name. A named array is a thing a rule can opt into;
      a `kind` inside somebody else's array is a thing every rule has to opt out of.

  ── WHAT WO-2.9 ADDED, AND WHY IT IS IN HERE RATHER THAN ON THE SCREEN ──

  Three things: elapsedSeconds() and the two alert thresholds, the `alerted` field markAlerted()
  writes, and the readers the history view counts with. All of them are arithmetic and rules over
  the two collections above, which is what this file is; what stays in src/attendance.js is the
  clock it is asked with, the element the figure lands in, and the sentence a screen reader hears.

  THE ONE RULE THAT MATTERS HERE IS THAT NOTHING IN THIS FILE ACCUMULATES. elapsedSeconds() takes
  `now` as an argument and subtracts, every time; there is no counter, no interval, and nothing this
  module remembers between two calls. iOS stops timers in a backgrounded PWA, and a count kept
  anywhere would come back wrong and say nothing about it.

  ── WHAT A PASS DOES NOT DO ──

  It does not touch attendance. A student at the bathroom is PRESENT — issuing and returning a pass
  writes no attendance record, moves no mark, and creates no meeting. The only coupling in either
  direction is the dismissal below, and it runs one way: a mark closes a pass, never the reverse.
*/

import { newId } from './store.js';

/*
  The three types, in the owner's own words and with Roll Call!'s own icons and labels
  (dashboard.html:5264). `type` is the stored value and is lower-case and opaque-ish; `word` is what
  a button says; `said` is what a screen reader and an announcement get, because "Bath" read out
  loud is not a thing anybody says.
*/
export const PASS_TYPES = [
  { type: 'bathroom', icon: '🚽', word: 'Bath',  said: 'bathroom' },
  { type: 'nurse',    icon: '🏥', word: 'Nurse', said: 'nurse' },
  { type: 'quick',    icon: '⚡', word: 'Quick', said: 'quick' },
];

/*
  Roll Call!'s MAX_ACTIVE_PASSES (dashboard.html:2372), matched rather than re-argued: three
  students out of one room at once is already more than a teacher can watch.

  IT IS COUNTED PER CLASS, which is where this diverges from the reference — over there one class is
  loaded at a time, so a global count and a per-class one are the same number. Here they are not,
  and a pass the teacher forgot to close in period 2 must not silently eat a third of period 3's
  capacity for a room it has nothing to do with. The cap is about how many of THIS class's students
  are out of THIS room, which is also the only version of it that can be explained on the screen the
  teacher is looking at.
*/
export const MAX_OPEN_PASSES = 3;

/* How a pass ended, on the history entry. Two values, and the second one is the dismissal rule
   below — the difference matters to WO-2.9's history view, which otherwise reads "back after 4
   minutes" about a student who never came back. */
export const BY_RETURN = 'return';
export const BY_DISMISSAL = 'dismissed';

/*
  WHEN A TRIP HAS GONE ON TOO LONG (WO-2.9), in minutes, escalating once.

  Roll Call!'s `alertOneMin: 5` / `alertTwoMin: 10` (dashboard.html:1659), at its own numbers. Over
  there they are two fields on the settings dialog; here they are constants, and that is a decision
  rather than an omission — this app has no settings surface at all yet, and a preference no control
  can move is a preference that exists to be read. When one arrives, src/prefs.js is where the two
  numbers go (a fact about this browser, never about a student) and these become its defaults; that
  is one line each and nothing else in this file changes, because everything below asks
  alertLevelFor() rather than the numbers.
*/
export const ALERT_ONE_MIN = 5;
export const ALERT_TWO_MIN = 10;

/* The descriptor for a stored type, or null for one this build does not know — a hand-edited or
   foreign document, the same posture src/attendance.js takes toward an unknown mark code. */
export function passType(type) {
  return PASS_TYPES.filter((t) => t.type === type)[0] || null;
}

/* ────────────────────────────── reading ──────────────────────────────

   Both accessors tolerate a document without the key. The 2 → 3 migration seeds both arrays and
   runs on load and on restore, so this is belt to that braces — the same call src/attendance.js
   makes over `attendance` and for the same reason. */

export function openPassesIn(doc) {
  return doc && Array.isArray(doc.openPasses) ? doc.openPasses : [];
}

export function passesIn(doc) {
  return doc && Array.isArray(doc.passes) ? doc.passes : [];
}

/* The open pass for one student in one class, or null. A student can hold at most one at a time —
   openPass() refuses a second — so the first match is the answer rather than one of several. */
export function openPassFor(doc, classId, studentId) {
  return openPassesIn(doc)
    .filter((p) => p && p.classId === classId && p.studentId === studentId)[0] || null;
}

/* Everyone out of this room right now, in the order they left. */
export function openPassesFor(doc, classId) {
  return openPassesIn(doc).filter((p) => p && p.classId === classId);
}

export function atCap(doc, classId) {
  return openPassesFor(doc, classId).length >= MAX_OPEN_PASSES;
}

/* ── AND THE HISTORY, READ BACK (WO-2.9) ──

   Every trip this class has finished, and every trip one student has finished in it, oldest first —
   `passes` is appended to on return and never reordered, so the array's own order IS the order they
   happened in and nothing here sorts.

   THEY READ `passes` AND NOTHING ELSE, which is what makes WO-2.9's fourth acceptance line free
   rather than checked: a cancelled pass was removed from `openPasses` and never written here, so
   there is no filter for it to be missing from. A history built by walking BOTH collections and
   marking the open ones "still out" would have had to remember to leave the cancelled ones out, and
   that is exactly the kind of rule that is right on the day it is written. */

export function passesFor(doc, classId) {
  return passesIn(doc).filter((p) => p && p.classId === classId);
}

/*
  ONE STUDENT'S FINISHED TRIPS, AND — SINCE WO-2.26 — OPTIONALLY ONLY THE ONES INSIDE A DATE WINDOW.

  THE WINDOW IS HERE AND NOWHERE ELSE, which is the whole of that work order's first decision. Two
  surfaces are term-scoped now (the card on the Student Report screen and the count line on the
  attendance history dialog) and one is not (the class-wide 🚪 Passes dialog, which stays the
  year-wide view it has always been), so the question "is this trip in that stretch of the year?"
  is asked by three callers and answered in one place. A second copy of it in a screen would be a
  second date-window rule beside the one src/attendance.js owns, which is exactly what the WO-2.9
  header refused when it declined to scope the class dialog.

  THE ARGUMENTS ARE `from`/`to` AND THE COMPARISON IS ON STRINGS, both lifted from
  src/attendance.js's meetingDates(): an empty bound is an open one, both ends are INCLUSIVE, and
  `2026-09-09` sorts as text exactly as it sorts as a day, which is why nothing here parses a date.
  The day a trip belongs to is passDate() below — the first ten characters of `out`, per
  docs/data-model.md — and never Date.parse, which moves an 11:40pm trip to the next day in one time
  zone and not in another.

  A CALLER THAT PASSES NOTHING GETS THE WHOLE YEAR, so the two readers above this line and every
  pre-WO-2.26 call site mean what they always meant.
*/
export function passesForStudent(doc, classId, studentId, from = '', to = '') {
  return passesIn(doc).filter((p) => p && p.classId === classId && p.studentId === studentId
    && (!from || passDate(p) >= from) && (!to || passDate(p) <= to));
}

/*
  The same list, narrowed to a TERM — src/attendance.js's termTotals() over attendanceTotals(),
  shape for shape, so "which trips does this term hold" and "which meetings does this term hold" are
  asked in the same words on the two surfaces that ask both.

  A term with no dates is a term with no bounds, so this hands back the whole year rather than
  nothing. That is the same fallback classRecord() takes, and the two screens that call this say so
  in the words attendanceCard() already uses.
*/
export function passesForStudentInTerm(doc, classId, studentId, term) {
  return passesForStudent(doc, classId, studentId, term && term.start, term && term.end);
}

/*
  THE LOCAL DATE OF A TRIP: the first ten characters of `out`, per docs/data-model.md — *"the local
  date of a pass is the first ten characters of `out` and is deliberately not a second field"*. Here
  rather than in the history view because that rule is a fact about the record and not about a
  screen, and because Date.parse-ing the stamp to ask which day it was is how a trip at 11:40pm
  moves to the next day in one time zone and not in another.
*/
export function passDate(entry) {
  return entry && typeof entry.out === 'string' ? entry.out.slice(0, 10) : '';
}

/*
  ONE ROW'S WORTH OF ARITHMETIC over a list of finished passes: how many of each type, how many
  altogether, and how many minutes they add up to.

  IT IS THE ONLY COUNTER, and both halves of the history view use it — the per-student rows and the
  line under them that totals the class. Roll Call! counts its Hall Pass Summary rows in one loop
  and prints no class total at all (dashboard.html:4812), so the total here is a Planbook addition
  and it exists for WO-2.9's third acceptance line: *"the history view's totals match the log"* is a
  claim a teacher can check by eye only when the number she is checking is on the screen. Summing
  the rows a second time in the view would make that check a comparison between two copies of the
  same loop.

  `minutes` is the number closePass() stored, never re-derived from the two stamps: it was computed
  at the moment of return and must not change because a clock did (docs/data-model.md § passes). An
  entry from a hand-edited file whose `minutes` is not a number contributes nothing rather than NaN,
  which would silently make every total in the dialog unreadable. A type this build does not know
  counts toward `total` and its minutes and toward no column — the same posture passType() takes
  everywhere else in this file, and the alternative is a trip that happened going missing from the
  one number the acceptance line asks a teacher to check.
*/
export function tallyPasses(list) {
  const out = { bathroom: 0, nurse: 0, quick: 0, total: 0, minutes: 0 };
  (Array.isArray(list) ? list : []).forEach((p) => {
    if (!p) return;
    if (passType(p.type)) out[p.type] += 1;
    out.total += 1;
    if (typeof p.minutes === 'number' && isFinite(p.minutes)) out.minutes += p.minutes;
  });
  return out;
}

/*
  MINUTES OUT, from the two stamps rather than from a counter.

  Both stamps carry their UTC offset (`2026-09-09T09:12:00-04:00`), which is exactly why a duration
  can be taken from them: Date.parse resolves each one to an instant, and the difference between two
  instants is right even across the November hour change. This is the one place in this app that
  parses one of those strings — src/attendance.js reads the clock face straight out of the string
  and says why — and it parses them because it wants the instant and not the face.

  Rounded like Roll Call!'s timeBack(), and floored at zero: a device clock that steps backwards
  between the two stamps should produce "0 minutes", not a negative number nobody can read.
*/
export function minutesBetween(out, back) {
  const a = Date.parse(String(out || ''));
  const b = Date.parse(String(back || ''));
  if (!isFinite(a) || !isFinite(b)) return 0;
  return Math.max(0, Math.round((b - a) / 60000));
}

/*
  AND HOW LONG THEY HAVE BEEN GONE SO FAR (WO-2.9) — the same subtraction as above with the second
  stamp still in the future, which is why it is here beside it rather than in the screen.

  THE WHOLE WORK ORDER IS IN THE SIGNATURE. `now` is an argument, so this function counts nothing
  and remembers nothing: every answer it gives is `now` minus the stamp the document is holding.
  iOS suspends timers when Safari backgrounds an installed PWA, so a counter that ADDED a second per
  tick would read "2 minutes" after twenty and would do it silently — the same class of bug as the
  eviction hazard in CLAUDE.md, correct on a desk and wrong on the device this ships to. The caller
  passes Date.now() at the moment it paints, and a caller that has been asleep for ten minutes gets
  ten minutes.

  SECONDS RATHER THAN MINUTES, because the card shows m:ss the way Roll Call!'s does
  (dashboard.html:3424) and because the two alert thresholds below are crossed at a second rather
  than at a rounding. Floored at zero for minutesBetween()'s reason: a device clock that steps
  backwards should read 0:00 and not a negative number nobody can read.
*/
export function elapsedSeconds(out, now) {
  const a = Date.parse(String(out || ''));
  const b = typeof now === 'number' ? now : Date.parse(String(now || ''));
  if (!isFinite(a) || !isFinite(b)) return 0;
  return Math.max(0, Math.floor((b - a) / 1000));
}

/* Which alert a trip of this length has earned: 0 none, 1 the first, 2 the second. Both thresholds
   in one function so that "is this overdue" has one answer — the card's colour, the announcement
   and the fired-ness written on the pass are three readings of it, and three copies of `>=` is how
   they come to disagree. */
export function alertLevelFor(seconds) {
  if (seconds >= ALERT_TWO_MIN * 60) return 2;
  if (seconds >= ALERT_ONE_MIN * 60) return 1;
  return 0;
}

/* WHICH ALERTS THIS PASS HAS ALREADY GIVEN — 0, 1 or 2, and 0 for a pass carrying no `alerted` key
   at all, which is every pass at the moment it is issued and every pass written by a build before
   this one. */
export function alertedLevel(pass) {
  const n = pass && typeof pass.alerted === 'number' ? pass.alerted : 0;
  return n >= 2 ? 2 : (n >= 1 ? 1 : 0);
}

/* ────────────────────────────── writing ──────────────────────────────

   Every writer takes `d`, the live document inside src/store.js's update(), and returns what it
   did — the entry, or null when it refused. Nothing here schedules a save, announces anything or
   repaints: the caller is holding an update() and owns all three. */

/*
  A PASS GOES OUT. One tap: who, which type, and the time out.

  Three refusals, and each of them is a state the screen already prevents — the buttons are not
  drawn for a student who is out, and they are disabled at the cap. They are here as well because a
  guard on the writer is a fact about the document and a guard on the renderer is a fact about which
  buttons happened to get drawn (the same posture src/attendance.js's writableDate() takes).
*/
export function openPass(d, classId, studentId, type, at) {
  if (!d || !classId || !studentId) return null;
  if (!passType(type)) return null;
  if (!Array.isArray(d.openPasses)) d.openPasses = [];
  if (openPassFor(d, classId, studentId)) return null;
  if (atCap(d, classId)) return null;

  const pass = { id: newId('p'), studentId: studentId, classId: classId, type: type, out: at };
  d.openPasses.push(pass);
  return pass;
}

/*
  A NOTE ON A PASS, typed on the banner card while the student is out (WO-2.11) — "went to the
  counsellor after", "third time today".

  IT IS ON THE OPEN PASS AND IT IS CARRIED INTO `passes` BY closePass() BELOW. Typed while the
  student is out and read back long afterwards by WO-2.9's history view, which is the only thing
  that makes it worth storing: a note that died on the return would render nowhere.

  THE SHAPE RULE IS src/attendance.js's setNote() RULE, not a variant of it: the key is set when
  the trimmed string has something in it and DELETED otherwise, so a pass nobody noted carries no
  `note` key at all rather than an empty string. Same rule the mark cell follows, and the same
  reason — a field that is present-but-empty is a field every reader has to test twice.
*/
export function notePass(d, classId, studentId, text) {
  if (!d || !classId || !studentId) return null;
  const open = openPassFor(d, classId, studentId);
  if (!open) return null;

  const note = String(text == null ? '' : text);
  if (note.trim()) open.note = note;
  else delete open.note;
  return open;
}

/*
  AN ALERT HAS BEEN GIVEN (WO-2.9). One field on the open pass, holding the HIGHEST alert this trip
  has already produced: absent or 0 before either fires, 1 after the first, 2 after the second.

  IT IS STATE ON THE PASS, exactly as Roll Call!'s `pass.alertFired.five` / `.ten` is
  (dashboard.html:3528) — and being state on the pass in THIS app means it is in the year document,
  which is the same inversion the header argues about `openPasses` itself. Roll Call!'s fired-ness
  lives in a module variable, so over there a reload re-alarms every overdue student; here the
  teacher who relaunches a force-quit app is not told twice about a trip she already knows about.
  That is what the acceptance line's *"fires once each"* is worth on the device this ships to, and
  it costs one small write at the moment of the alert.

  ONE NUMBER RATHER THAN TWO BOOLEANS, and the divergence is deliberate: `five` and `ten` bake the
  DEFAULT thresholds into the schema, so a teacher who ever moves the first alert to seven minutes
  is left with a field called `five` that means something else. A level is a level whatever minute
  it was crossed at.

  IT ONLY EVER GOES UP. A second call at the same level is refused rather than rewritten, which is
  what makes "not repeatedly" a property of the writer instead of a promise made by the renderer
  that calls it — the renderer runs every second.

  NOTHING CARRIES IT INTO HISTORY. closePass() below builds its entry field by field and this is not
  one of them, so a finished trip in `passes` says what happened rather than what the app said about
  it while it was happening. The reset on return is the same fact: the record this lives on is gone.
*/
export function markAlerted(d, classId, studentId, level) {
  if (!d || !classId || !studentId) return null;
  const open = openPassFor(d, classId, studentId);
  if (!open) return null;
  const want = level >= 2 ? 2 : (level >= 1 ? 1 : 0);
  if (want <= alertedLevel(open)) return null;
  open.alerted = want;
  return open;
}

/*
  AND COMES BACK. The open pass leaves `openPasses`, one entry is appended to `passes`, and the
  minutes are computed from the two stamps.

  `endedBy` is BY_RETURN here and BY_DISMISSAL from the rule below. It is stored rather than
  inferred because "back after 4 minutes" and "dismissed after 4 minutes" are different facts about
  a student and WO-2.9's history has to be able to tell them apart — Roll Call! says the same thing
  by appending "· Dismissed" to the note (_finalizeDismissedPass, dashboard.html:5126), which is the
  same information in a field a reader has to parse.

  THE ENTRY IS KEYED BY STUDENT ID AND CLASS ID, never by name. A student renamed in March neither
  orphans their October passes nor picks up somebody else's: nothing in this file has ever seen a
  name.
*/
export function closePass(d, classId, studentId, at, endedBy) {
  if (!d || !classId || !studentId) return null;
  const open = openPassFor(d, classId, studentId);
  if (!open) return null;

  d.openPasses = openPassesIn(d).filter((p) => p !== open);
  if (!Array.isArray(d.passes)) d.passes = [];
  const done = {
    id: open.id,
    studentId: open.studentId,
    classId: open.classId,
    type: open.type,
    out: open.out,
    back: at,
    minutes: minutesBetween(open.out, at),
    endedBy: endedBy === BY_DISMISSAL ? BY_DISMISSAL : BY_RETURN,
  };
  /* The note the teacher typed while they were out, if there was one, and NO KEY AT ALL if there
     was not — notePass() above never leaves an empty one to copy, and this is where that rule
     reaches the permanent record.

     WHAT IS NOT COPIED IS `alerted` (WO-2.9), and the field list above is where that is decided:
     the note is the teacher's own words about the trip and belongs to it forever, while the alert
     level is the app's bookkeeping about a trip that had not finished yet. `minutes` is the honest
     record of how long it took; "and it was announced twice" is not a fact about the student. */
  if (open.note) done.note = open.note;
  d.passes.push(done);
  return done;
}

/*
  OR THE PASS NEVER HAPPENED (WO-2.11). The teacher's thumb landed on 🚽 aiming at the row below,
  and the student is sitting where they were.

  THIS IS THE ONLY WRITER IN THIS FILE THAT REMOVES AN OPEN PASS WITHOUT LEAVING A RECORD, and it
  is deliberately NOT a variant of closePass() above. Cancel is not a close with a flag: a close
  writes history, and the entry it would write here — `minutes: 0`, a phantom trip for a student
  who never left the room — is exactly the thing this function exists to prevent. That entry
  cannot be taken back afterwards either, because `passes` is append-only and reopenPass() refuses
  anything that was not ended by a dismissal, so "cancel as a zero-minute return" is a permanent
  wrong fact in the record Phase 4 reads as a signal.

  IT IS GATED ON THE PASS BEING OPEN, the way reopenPass() below is gated on `endedBy` being a
  dismissal, and the gate is structural rather than a test: this function is addressed by class and
  student, it finds its subject through openPassFor(), which reads `openPasses` and nothing else,
  and it never names `passes` at all. A returned trip is therefore not merely refused here — it is
  unreachable from here. That matters more than it looks: the append-only rule is what makes the
  pass log worth reading, and a cancel general enough to delete a FINISHED entry would repeal it
  for every entry rather than for the one being cancelled.

  A note typed on the pass goes with it, because it is a field of the record being removed and
  there is nowhere else for it to go. That is the answer to "where does the note on a cancelled
  pass end up": wherever the pass ends up, which is nowhere.
*/
export function cancelPass(d, classId, studentId) {
  if (!d || !classId || !studentId) return null;
  const open = openPassFor(d, classId, studentId);
  if (!open) return null;

  d.openPasses = openPassesIn(d).filter((p) => p !== open);
  return open;
}

/*
  THE DISMISSAL, AND ITS UNDO — the one place a mark and a pass touch each other.

  Marking a student `D` while they are out closes their pass rather than leaving one that never
  returns; taking the `D` back puts the pass back, still out, still since the same minute. That pair
  is Roll Call!'s _finalizeDismissedPass() / cancelDismiss() (dashboard.html:5126, 5147), and the
  difference is where the intermediate state lives: over there the pass is stashed in a module
  variable and only written out when the dismissal survives to the next save. Here there is no
  save step to survive to — every tap writes — so the pass is CLOSED at the `D`, and the undo
  RETRACTS the entry that the `D` wrote.

  THAT RETRACTION IS THE ONLY THING IN THIS FILE THAT REMOVES FROM `passes`, and it is narrow on
  purpose: it removes one entry, by its own id, only while that entry says it was ended by a
  dismissal, and only because the dismissal that wrote it has itself been taken back. Nothing is
  matched by name, by time or by "the most recent one" — the id is carried on the `D` mark cell
  itself, which is the only thing in the document whose lifetime is exactly the dismissal's. Joining
  these two records on a timestamp instead is precisely the `name + time` matching that made
  Roll Call!'s pass rows fragile and produced the append-only rule in the first place.

  The alternative — leave the entry standing — was considered and is worse: the teacher who taps the
  wrong row and taps it back would be left with a bathroom trip in the history that never happened,
  and a second entry for the same trip when the student actually returns.

  IT DOES NOT CONSULT atCap(), AND THAT IS DELIBERATE. There is a real sequence that takes a class to
  FOUR open passes: three students out, one of them dismissed (the class is down to two), a fourth
  sent out, and then the dismissal taken back. The cap is a rule about how many students the teacher
  SENDS OUT of the room, and this function sends nobody — it puts back a child who was already gone
  and whose dismissal has just been withdrawn. Refusing the reopen to hold the number at three would
  mean deleting a true record to satisfy a limit, which is the same sin as the retraction above
  running the wrong way: the app would be asserting that a student who is out of the room is not.
  So the number is allowed over, briefly and visibly — four Return buttons and the reason line, all
  of them nameable on the screen — and it comes back under the moment anybody taps Return, because
  openPass() is still the only door in and it still refuses. The one thing this obliges downstream:
  WO-2.9's banner must count what it finds rather than assume MAX_OPEN_PASSES is a ceiling.

  tools/verify-shell.mjs cannot reach this state — its `D` is undone at two open passes — so this
  paragraph is the record of the choice rather than a check being described.
*/
export function reopenPass(d, passId) {
  if (!d || !passId) return null;
  const done = passesIn(d).filter((p) => p && p.id === passId)[0];
  if (!done || done.endedBy !== BY_DISMISSAL) return null;

  d.passes = passesIn(d).filter((p) => p !== done);
  if (!Array.isArray(d.openPasses)) d.openPasses = [];
  const open = { id: done.id, studentId: done.studentId, classId: done.classId,
    type: done.type, out: done.out };
  /* And the note comes back with it (WO-2.11), for the same reason the time out does: this is a
     retraction of the app's own write, so what it puts back has to be what was there. A note
     silently dropped by an undo is a note the teacher typed and the app deleted. Absent stays
     absent — the key is set only when there was one, which is the shape rule everywhere else.

     `alerted` DOES NOT COME BACK (WO-2.9), and the asymmetry is the point: closePass() never
     carried it into `passes`, so there is nothing here to restore, and a student who is out of the
     room again with an hour-old time out should be announced again. The note is the teacher's
     words; the alert is the app noticing, and it is allowed to notice twice about two spells out
     of the room. */
  if (done.note) open.note = done.note;
  d.openPasses.push(open);
  return open;
}
