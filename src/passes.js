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
  d.passes.push(done);
  return done;
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
  d.openPasses.push(open);
  return open;
}
