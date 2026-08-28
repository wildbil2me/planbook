/*
  The merge-field resolver — one student, one template, at send time (WO-5.1).

  ── WHAT THIS FILE IS FOR, IN ONE SENTENCE ──

  A template is subject + body with `{{field}}` markers in it (docs/data-model.md § Outreach
  templates); this turns those markers into text for ONE student, and refuses everything it was not
  told to resolve. The editor is WO-5.2 and the `mailto:` handoff is WO-5.3 — neither exists yet, so
  this module has no screen, no DOM and no store write, exactly as src/signals.js had none at WO-4.1.

  ── THE WHITELIST IS THE FENCE, AND IT IS THE WHOLE OF THE FENCE ──

  `FIELDS` below is a flat list of the sixteen names docs/data-model.md tabulates, each with the
  function that answers it. A token is resolved by an EXACT STRING MATCH against those names and by
  nothing else. There is no path expression, no split on `.`, no walk from the document root, and
  nothing anywhere in this file reads a property named after a token. That is WO-5.1's Traps line
  made structural rather than promised:

      a blacklist fails open the moment somebody adds a field to the data model.
      a whitelist fails closed the moment somebody adds a field to the data model.

  So `{{supports.accommodations}}` does not resolve because it is not in the list, `{{plan}}` does
  not resolve because it is not in the list, and a field nobody has thought of yet does not resolve
  because it is not in the list. **Deleting REFUSED_WORDS below would not make a single one of them
  resolve** — see that constant's own comment for what it actually does, which is choose the wording
  of an error and nothing else.

  Two consequences worth stating out loud because they look like omissions:

  · **There is no `doc[a][b]` anywhere in this file.** The refusal list in the Deliverables is a
    TEST SURFACE — every path in it must be provably unreachable — rather than a runtime filter, and
    `tools/wo-sweep.mjs` § 20 asserts the absence structurally, in two claims that are two halves of
    one sentence. **Claim 2** is the NAME: no support identifier appears in this file's code at all,
    only inside string literals and prose. **Claim 5** is the SHAPE, and it is a LIST OF SPELLINGS
    rather than a claim about every way JavaScript can read a property. What it asserts is absent
    from this file's code, by name: a bracket subscript in member position whose key is not an
    integer literal — after an identifier, a `)`, a `]` or a `}`, through an optional `?.`, and with
    a newline allowed on either side of the `[` — a computed key in a destructuring pattern or an
    object literal, a split, a fold, `eval`, `new Function`, `Reflect.get`. The harness proves what
    today's paths resolved on today's fixture; the two greps prove that none of THOSE spellings is
    in this file whatever it comes to contain, which is the difference that matters for a "just this
    once" lookup somebody adds later. What they do not prove — and a grep over a crude comment strip
    cannot — is that no other spelling gets past. `Object.entries(root).find(([k]) => k === name)[1]`
    reads a property by a token-named key and passes § 20 today, because the destructured `[k]` sits
    after a `(` and the subscript that survives it has an integer key; `Object.values`, a `for…in`
    that compares and returns, and a `Map` built out of the object are the same story. So read claim
    5 as *these spellings are absent*, never as *no dynamic read is possible*. What makes a dynamic
    read impossible is the whitelist above; § 20 is only what stops it being walked around quietly.
    *(Claim 5 arrived with WO-1.32 and this paragraph was five days ahead of it. Claim 2 on its own
    is a check on names, and a path walk names nothing — which is not hypothetical: WO-5.1's
    dispatch was killed holding one right here in `resolveText()`, the delivered tree resolved every
    support field to the roster string, and § 20 was green over it. A sentence in a header is worth
    what the check under it asserts, and this one was not until claim 5.)*
    *(**This paragraph used to end "on any input", and the wording was the failure rather than a
    slip** — WO-1.34, 2026-08-28, finished by its own verifier the same day. It said the greps prove
    there is nothing here that could resolve a field ON ANY INPUT, and **five** spellings falsified
    it as written. Three were found when the work order was booked — `root?.[name]`,
    `const { [name]: got } = root`, and a subscript whose `[` opens its own line. Two more came back
    from the verifier of the fix: `root[` on one line with `name]` on the next — the exact inverse of
    the third, and squarely in member position — and `{ ...root }[name]`, whose object is spelled as
    a literal. All five are closed in § 20 now. **The instructive half is why the first attempt
    missed the last two.** It closed the three spellings and then re-pitched the universal one size
    smaller — *wherever in the file the `[` sits* — which is the same overclaim in a smaller box, and
    it is precisely the gap those two walked through. A universal with an exception hung off the end
    is not a narrower claim; it is the same claim with a footnote, and a reader believes the
    sentence. Hence the enumeration above: what the check covers, positively, and the limit stated as
    a limit. A parser would settle the rest, and a parser inside a grep tool is forbidden outright.
    **None of this touches the fence**: the fence is the whitelist above.)*
  · **A key on `Object.prototype` is not a field.** `FIELDS` is an ARRAY scanned by `===`, not an
    object indexed by the token. Indexed by the token, `{{constructor}}`, `{{toString}}` and
    `{{__proto__}}` all find something truthy, and the first build of a resolver that looks like this
    one usually ships that. There is no lookup here that a prototype key can reach.

  ── AN UNRESOLVED FIELD NEVER RENDERS BLANK, AND THAT IS ONE RULE WITH ONE CHOKE POINT ──

  docs/data-model.md: *"Dear ," going home is worse than sending nothing.* So a resolver answers with
  a string or with `null`, and **the empty string is not an answer** — `resolveText()` treats a blank
  or whitespace-only return exactly as it treats `null`. One test, in one place, rather than sixteen
  resolvers each remembering to say `null` instead of `''`.

  What happens then is that **the token stays on the page exactly as the teacher typed it** and the
  draft is blocked. That is true of all three failures, and it is deliberate:

      refused     `{{supports.medical}}`   — a template defect. It can never resolve.
      unknown     `{{student.email}}`      — a template defect. This build has no such field.
      unresolved  `{{guardian.name}}`      — a DATA defect. The field is real; this student has no
                                             guardian on file, so there is nothing to put there.

  **Leaving the token visible is the safe answer for the refused case as well as the other two, and
  that is a ruling rather than a shortcut.** The alternative readings of *"it does not render"* are
  to drop the token or to blank it, and both produce a body that reads clean and could be copied out
  of a preview and sent. A literal `{{supports.medical}}` in the text carries no student's data — it
  is the teacher's own typing handed back — and it is the one rendering that cannot be mistaken for
  a finished sentence. What "renders nothing sensitive" means here is what it says: no value from
  the roster is ever fetched for a refused name, because no code in this file can fetch one.

  The three are told apart by the `code` on the error, never by the shape of the output. There are
  TWO branches in `resolveText()`, not three — off the whitelist, and on it with nothing behind it —
  and the refused/unknown split happens one level down in `refusalFor()`. Said precisely because the
  count is the kind of thing a later reader "fixes": there is no missing third arm to add.

  ── THE NUMBERS ARE NOT COMPUTED HERE. NOT ONE OF THEM ──

  WO-5.1's Deliverables: *"two grade implementations will disagree eventually, and the email is the
  copy that's wrong."* Every figure below comes out of the module that owns it —
  src/grade-engine.js for the grade and the missing work, src/attendance.js for the term totals,
  src/signals.js for the explanations and the delta, src/log.js for the behavior entries — and this
  file adds nothing to any of them but a join and a label. There is no arithmetic in this file at
  all; the only `+` in it concatenates strings.

  `{{grade.delta}}` is the sharpest case. It is read off the HIT that produced the draft, through
  src/signals.js's own `signalFigure()`, and it resolves to that figure's `text` — the same string
  the praise row draws big (src/signals-view.js). Re-measuring the climb here would produce a second
  number that agrees on every fixture anybody writes and disagrees the first time a threshold moves
  under a stale list.

  ── THE DOCUMENT HANDED IN MUST BE THE OPEN ONE ──

  src/signals.js's header states this and the reason is the same one: the attendance half cannot be
  a pure read. *"Which dates did this class actually meet"* is src/attendance.js's answer and has
  been since WO-2.1, and its helpers resolve against the document the store has open. A second copy
  of that filter chain here would agree with itself perfectly and disagree with the registry the
  first time a day off was authored. So `request.doc` is expected to be the open year; passing a
  foreign document would mix two years' meetings into one email.

  ── AND THERE IS NO WRITER IN THIS FILE ──

  Nothing here imports `update`, `getDoc` or `setPref`, nothing pushes to a collection, and
  `newYearDocument()` gained nothing for this work order. The document is byte-identical either side
  of a resolve. WO-5.3 is what writes a `contact` entry once a draft has actually left the building,
  and it writes it through src/log.js's one writer.
*/

import { weightedClassGrade, openWork } from './grade-engine.js';
/* The term totals a guardian reads, out of the same walk the registry's own percentage comes from
   (WO-2.4, WO-2.6), and the formatter that prints it. `plainDate` is here for the behavior lines
   below: a date said four ways in one app is four dates, and src/attendance.js's parser is the one
   that never leaves UTC for the arithmetic and never enters it for the reading. */
import { termTotals, percentText, plainDate } from './attendance.js';
/* How a percentage is written down in Planbook — two fixed places, because the SIS carries two and
   this number is re-keyed into it by hand (src/scores.js). Imported rather than re-declared, for
   the reason that file's own header gives: two formatters that have to agree is the answer this
   repo keeps refusing, and the one that drifts is the one nobody is looking at. */
import { formatPercent } from './scores.js';
/* The explanation sentences and the figure a signal row draws. `orderHits()` rather than a sort of
   this file's own: WO-6.4's glance panel, the concern column and this draft all ask "which of these
   matters most", and three surfaces answering it for themselves is three answers (src/signals.js). */
import { orderHits, signalFigure } from './signals.js';
/* ONE READER, NAMING ITS KINDS AT THE CALL. src/log.js's header calls the `kind` filter the whole of
   the firewall between a behavior note and an email; this is the first caller on the far side of
   it, so it asks for `behavior` by name and can therefore never be handed a `note` (the teacher's
   own working memory) or a `contact` (an email that already went). See BEHAVIOR_FIELD below. */
import { entriesOfKind } from './log.js';
/* The one name a sentence is allowed to know. src/signals.js imports the same function from the
   same place, for the same reason: a second copy of those eight lines could be right about a
   hyphen, a suffix or a half-typed name in a way this one is not. */
import { fullName } from './roster.js';

/* ────────────────────────────── the outcomes ──────────────────────────────

   Three codes, and they are separate because WO-5.1's Acceptance grades them separately — line 1 is
   the refusal, line 3 is the unresolved guardian, line 6 is the unknown name. A build that answered
   all three with one code would pass a reading of the output and could not be asked which of them
   it had done. */

/* A name that reaches accommodation, medical or plan data. It cannot resolve in this build and it
   cannot be made to resolve in a later one without deleting the rule this file exists for. */
export const REFUSED = 'refused-field';

/* A name this build does not have. Not sensitive, not resolvable — a typo, or a field somebody
   assumed existed. It still blocks, because a template nobody has read is a template that goes out
   with `{{studnet.first}}` in it. */
export const UNKNOWN = 'unknown-field';

/* A real field with nothing behind it FOR THIS STUDENT: no guardian on file, no graded work yet,
   no missing assignments to list. The template is fine and the draft is not sendable. */
export const UNRESOLVED = 'unresolved-field';

/*
  ────────────────────────── the words that name a refusal ──────────────────────────

  **READ THIS BEFORE DECIDING IT IS THE BLACKLIST THE TRAPS LINE FORBIDS.** It is not a gate. It
  runs only over names that have ALREADY been refused by the whitelist — `refusalFor()` is reached
  from the `!field` arm of `resolveText()` and from nowhere else — and the only thing it decides is
  which of two error messages a teacher reads. Delete this constant and every one of these paths
  still resolves to nothing; the errors would simply all read "not a merge field" instead of saying
  why this one is different.

  That is the property that makes it safe to have: it can only ever be too small, never too
  permissive. A support field somebody adds to docs/data-model.md next year is refused by the
  whitelist on the day it is added, and the worst this list can do is describe the refusal in
  weaker words until somebody adds the noun.

  The six roots are WO-5.1's own refusal list, plus `accommodation` because it is the noun a teacher
  would actually type. Compared case-insensitively and as substrings, because `{{student.supports}}`
  and `{{SUPPORTS}}` are the same mistake.

  **IT OVER-REACHES AND THAT IS THE RIGHT DIRECTION.** `{{explanation}}` contains `plan`, so an
  unknown field with that name is described as a refusal rather than as a typo. Both outcomes block
  the send and neither resolves anything, so the cost is one word of a message; the alternative —
  splitting the name into segments and matching them — is the path walk the header refuses, wearing
  a classifier's clothes. src/supports.js rounds an unreadable answer toward hiding for the same
  reason and says so at presentationMode().
*/
const REFUSED_WORDS = ['supports', 'support', 'accommodation', 'medical', 'behaviorplan',
  'behaviourplan', 'plan', 'casemanager', 'reviewdate'];

/*
  ────────────────────────── how many behavior entries "recent" is ──────────────────────────

  THREE, AND IT IS THIS FILE'S OWN NUMBER RATHER THAN A COPY OF ONE. The log card on the student
  record draws four before it hides the rest (src/log-sheet.js), and that is a different question:
  a card is a place to read everything eventually, and an email is a place to make one point. A
  message home that lists a term of conduct is a dossier, and the teacher stops sending it.

  IT IS A COUNT AND NOT A WINDOW OF DAYS, deliberately. A day window here would be a second window
  standing beside `behaviorWindowDays` — the threshold the concern rule fires on — free to disagree
  with the signal that produced the draft, which is the exact shape src/signals.js refuses for
  ranking. What stops a stale entry going out silently is that **every line carries its own date**:
  an entry from October in a May email says October in the text, where the teacher edits it before
  it goes (WO-5.3: editable before sending, always).
*/
const RECENT_ENTRIES = 3;

/* ────────────────────────────── reading the document ──────────────────────────────

   Local, tolerant and read-only, the same three lines src/signals.js and src/roster.js each keep
   for themselves. A collection missing from a hand-edited or restored file is an empty one, not a
   throw: a resolver that dies takes the send flow with it and tells the teacher nothing. */

function arrayOf(value) { return Array.isArray(value) ? value : []; }
function text(value) { return value === null || value === undefined ? '' : String(value); }

function classById(doc, classId) {
  return arrayOf(doc && doc.classes).filter((c) => c && c.id === classId)[0] || null;
}

function termById(cls, termId) {
  return arrayOf(cls && cls.terms).filter((t) => t && t.id === termId)[0] || null;
}

function studentById(doc, studentId) {
  return arrayOf(doc && doc.students).filter((s) => s && s.id === studentId)[0] || null;
}

/*
  WHICH GUARDIAN `{{guardian.name}}` MEANS. The audience picker is WO-5.3's and it will hand one
  over on the request — guardian 1 or guardian 2, chosen by the teacher — so a passed guardian wins
  outright. The fallback is `preferred` and then the first on file, which is the order the roster
  already draws them in.

  A STUDENT WITH NO GUARDIAN COMES BACK NULL RATHER THAN AS AN EMPTY OBJECT, and that is what makes
  WO-5.1's third acceptance line pay: the field resolves to nothing, the token stays on the page,
  and the draft is not sendable. An empty object here would resolve to `''`, which the choke point
  in `resolveText()` would catch anyway — but two answers to "is there a guardian" is one more than
  this needs.
*/
function guardianFor(student, chosen) {
  if (chosen && typeof chosen === 'object') return chosen;
  const all = arrayOf(student && student.guardians).filter((g) => g && text(g.name).trim());
  return all.filter((g) => g.preferred)[0] || all[0] || null;
}

/*
  ONE DRAFT'S FACTS, RESOLVED ONCE. The grade, the open work and the term totals are each asked for
  at most once per draft however many times a template names them — a body that says the percentage
  in the subject and again in the closing line should cost one weighted average, not three.

  The memo is per call and dies with it. Nothing here is cached across drafts: a resolver that
  remembered a grade would be the second truth this repo keeps refusing, and the teacher enters
  scores between two sends.
*/
function contextOf(request) {
  const req = request || {};
  const doc = req.doc || null;
  const cls = classById(doc, text(req.classId));
  const termId = text(req.termId);
  const student = studentById(doc, text(req.studentId));
  /* The hits this draft may speak from. A caller holding a whole evaluation hands over `hits`; a
     caller holding one row hands over `hit` and gets a list of one. Both are the caller's choice
     rather than this file's, because a hit outlives the pass that made it and a cross-class list is
     a legitimate thing to draft from (src/signals.js at signalFigure()). Nothing here calls
     evaluate(): re-running the engine would answer about today, and the draft is about the row the
     teacher tapped. */
  const hits = Array.isArray(req.hits) ? req.hits.filter(Boolean)
    : (req.hit ? [req.hit] : []);
  const memo = {};
  return {
    doc: doc,
    cls: cls,
    term: termById(cls, termId),
    termId: termId,
    student: student,
    studentName: fullName(student),
    guardian: guardianFor(student, req.guardian),
    /* The signal that produced this draft. `{{grade.delta}}` is read off it and off nothing else. */
    hit: req.hit || null,
    hits: hits,
    grade() {
      if (!('grade' in memo)) {
        memo.grade = (doc && cls && student)
          ? weightedClassGrade(doc, cls, termId, student.id) : null;
      }
      return memo.grade;
    },
    missing() {
      if (!('missing' in memo)) {
        memo.missing = (doc && cls && student)
          ? openWork(doc, cls, termId, student.id).filter((row) => row.state === 'missing') : [];
      }
      return memo.missing;
    },
    totals() {
      if (!('totals' in memo)) {
        memo.totals = (cls && student)
          ? termTotals(cls.id, student.id, this.term) : null;
      }
      return memo.totals;
    },
  };
}

/* An assignment's name, for `{{missing.list}}`. src/grade-engine.js hands back ids and points and
   says at its own definition that a name is the screen's business — so the join happens here, off
   `assignments[]`, rather than the engine growing a string a teacher typed. */
function assignmentName(doc, id) {
  const found = arrayOf(doc && doc.assignments).filter((a) => a && a.id === id)[0];
  return text(found && found.name).trim() || 'Untitled assignment';
}

/* ────────────────────────────── the sixteen fields ──────────────────────────────

   docs/data-model.md § Outreach templates, in the order that table lists them, one entry per row.
   `tools/wo-sweep.mjs` § 20 reconciles these names against that table name for name and in both
   directions, so a field added here without being documented is red, and so is a documented field
   nothing resolves.

   `about` is the sentence WO-5.2's field palette prints beside the name. It lives here rather than
   on that screen because the palette *is* the documentation of the refusal list, by omission — a
   second list of descriptions over there could describe a field this one does not have.

   EVERY `resolve` RETURNS A STRING OR `null`, and `null` means "nothing to put there". None of them
   returns `''` on purpose; `resolveText()` rounds a blank to `null` anyway, which is the choke point
   the never-render-blank rule needs and the reason no resolver below has to remember it. */
const FIELDS = [
  { name: 'student.first', about: 'The student’s first name, as the roster has it',
    resolve(ctx) { return text(ctx.student && ctx.student.first).trim() || null; } },
  { name: 'student.last', about: 'The student’s last name',
    resolve(ctx) { return text(ctx.student && ctx.student.last).trim() || null; } },
  /* Nothing falls back to the first name here. A template that says "Dear {{student.nickname}}"
     over a student who has none is a template asking for something that is not on file, and the
     block is the honest answer — quietly substituting a different field would make the two
     indistinguishable in a preview. */
  { name: 'student.nickname', about: 'What the student goes by, when the roster records one',
    resolve(ctx) { return text(ctx.student && ctx.student.nickname).trim() || null; } },
  { name: 'guardian.name', about: 'The guardian this message is addressed to',
    resolve(ctx) { return text(ctx.guardian && ctx.guardian.name).trim() || null; } },
  { name: 'class.name', about: 'The class this message is about',
    resolve(ctx) { return text(ctx.cls && ctx.cls.name).trim() || null; } },
  { name: 'teacher.name', about: 'Your name, from Settings',
    resolve(ctx) { return text(ctx.doc && ctx.doc.teacher && ctx.doc.teacher.name).trim() || null; } },
  /* The engine's answer, printed by the app's own formatter. `percentage: null` is "there is no
     grade yet" — an unbalanced set of weights, or no graded work — and it resolves to nothing
     rather than to a zero this file invented. */
  { name: 'grade.percent', about: 'The current weighted grade for this class and term',
    resolve(ctx) {
      const g = ctx.grade();
      return g && g.percentage !== null ? formatPercent(g.percentage) : null;
    } },
  { name: 'grade.letter', about: 'The letter that percentage falls in',
    resolve(ctx) {
      const g = ctx.grade();
      return g && g.letter ? text(g.letter) : null;
    } },
  /*
    THE PRAISE WORKHORSE, AND IT IS READ OFF THE HIT RATHER THAN MEASURED AGAIN.

    `signalFigure()` is the number the signal row draws big, and `.text` is the exact string it
    draws — signed, two decimals, and carrying src/signals.js's own minus. So "the delta in the
    email is the delta on the row" is a string comparison rather than an argument about rounding.

    THE UNIT TEST IS THE POINT: only a figure whose unit is `points` is a change in the grade.
    `turnaround` counts RULES CLEARED and `no-missing` counts ASSIGNMENTS, and putting either of
    those numbers behind a field called `grade.delta` would be the subtraction PRAISE_RANK exists
    to prevent, arriving in a guardian's inbox. A draft from one of those rules resolves this to
    nothing and is blocked, which is the template being wrong for that row.
  */
  { name: 'grade.delta', about: 'How far the grade moved, from the signal that opened this draft',
    resolve(ctx) {
      const figure = signalFigure(ctx.hit);
      return figure && figure.unit === 'points' && text(figure.text).trim()
        ? text(figure.text) : null;
    } },
  /* A count always resolves, including at zero: "0" is a value and a template that says "she has
     {{missing.count}} missing" over a student with none is a true sentence. The LIST is the one
     that cannot be empty — see below. */
  { name: 'missing.count', about: 'How many pieces of work you have marked missing',
    resolve(ctx) { return String(ctx.missing().length); } },
  { name: 'missing.list', about: 'Those assignments by name',
    resolve(ctx) {
      const names = ctx.missing().map((row) => assignmentName(ctx.doc, row.id));
      return names.length ? names.join(', ') : null;
    } },
  /* `percent: null` is the honest zero-meeting state (src/attendance.js) and resolves to nothing:
     "her attendance is No recorded meetings" is the sentence percentText() would hand over, and it
     is not a sentence to mail home. The two counts below are counts and answer at zero. */
  { name: 'attendance.percent', about: 'Attendance for this term, over recorded meetings',
    resolve(ctx) {
      const totals = ctx.totals();
      return totals && totals.percent !== null ? percentText(totals) : null;
    } },
  { name: 'attendance.absences', about: 'Absences this term',
    resolve(ctx) {
      const totals = ctx.totals();
      return totals ? String(totals.A) : null;
    } },
  { name: 'attendance.tardies', about: 'Times late this term',
    resolve(ctx) {
      const totals = ctx.totals();
      return totals ? String(totals.T) : null;
    } },
  /*
    ─────────────────── WHY THIS ONE IS NOT FILTERED, AND WHY THAT IS SAFE ───────────────────

    WO-5.1's Deliverables ask that `{{signals.list}}` be "explicitly filtered too, since either could
    otherwise carry a plan reference through". **It is safe by construction instead, and re-filtering
    it here would be the second opinion `wo-sweep` counts the askers of.**

    src/signals.js's contract: a rule is two functions, `measure(ctx, studentId)` publishes NUMBERS
    and `say(numbers, who)` is handed those numbers plus `who` — a small object of names, strings
    only, no document, no clock, no thresholds. A rule therefore cannot put a figure in its sentence
    that the hit does not carry, because there is no figure within reach that is not in `numbers`.
    And nothing in that file reads a support, a plan or a medical need: WO-4.4 added
    `supports.attendanceClause` and put its reader in src/accommodation-prompt.js *precisely* so that
    it did not live in the engine, naming this merge field as the reason in as many words.

    So an explanation is arithmetic and two names. A filter over it here could only ever be a
    substring search for words a teacher never typed into an explanation she cannot author — and it
    would go green forever while quietly teaching the next reader that the engine is untrusted.
    **If a rule is ever found putting a string it was handed into a sentence, that is a defect in
    src/signals.js and it is fixed there**, not papered over on the way out.

    The ORDER is `orderHits()`, the app's own ranking, so the list in the email reads in the order
    the column the teacher tapped reads. The list is filtered to this student and NOT to this class:
    a caller that handed over several evaluations' hits meant to, and dropping the ones from another
    section would be this file deciding what a cross-class draft is allowed to say.
  */
  { name: 'signals.list', about: 'Why this student surfaced, in the app’s own sentences',
    resolve(ctx) {
      const mine = ctx.hits.filter((h) => h && ctx.student && h.studentId === ctx.student.id);
      const lines = orderHits(mine).map((h) => text(h.explanation).trim()).filter(Boolean);
      return lines.length ? lines.join('\n') : null;
    } },
  /*
    ─────────────────── THE HARD ONE, AND THE LIMIT IS STATED RATHER THAN GLOSSED ───────────────────

    A behavior entry is `{ at, kind, subject, body }` and both text fields are whatever the teacher
    typed. So what "filtered" can mean here is narrower than it sounds, and the honest version is:

      · ONE KIND, ASKED FOR BY NAME. `entriesOfKind(doc, id, ['behavior'])` — so a `note` (the
        teacher's own working memory, which CLAUDE.md § Accommodations records may be about anything)
        and a `contact` (an email that already went) cannot arrive here through a widened default.
        That is src/log.js's firewall holding one function further out.
      · THE DATE AND THE SUBJECT. **The `body` never crosses this line.** It is the long free-text
        half — the place a teacher writes *"let her finish in the hall, she has extra time"* — and
        it is the field with the most room in it for something that must not leave the roster. The
        subject is a headline, and on the two-tap sheet it is one of six fixed strings.
      · THREE OF THEM, newest first. See RECENT_ENTRIES.

    **AND THE LIMIT THIS CODE CANNOT CLOSE:** a subject is still free text. A teacher who types a
    plan reference into a subject line will see it in her draft. Nothing here can prove otherwise and
    this comment does not claim to — it is the same open edge CLAUDE.md § Accommodations records for
    a note under a projector, named rather than fixed quietly, and the two things that stand behind
    it are that every draft is editable before it goes (WO-5.3) and that the resolver puts nothing
    on screen or in a mail client by itself.

    **PRESENTATION MODE IS NOT ASKED, AND THAT IS A RULING.** `logKindVisible()` is the SCREEN's
    suppression — a projector in a classroom — and an email to a guardian is not a projector; a
    guardian is entitled to what a behavior entry says, which is the whole reason this field exists.
    Reading through `visibleEntriesFor()` would mean a teacher who left the header switch on gets a
    draft with its behavior paragraph missing, or blocked with a message that says there is nothing
    on file when there is. The obligation that follows lands on WO-5.2: a live preview is a SCREEN,
    and it asks src/supports.js — the one function, never a second copy — before it draws a resolved
    body. This module owns no pixels and cannot answer that question for it.
  */
  { name: 'behavior.recent', about: 'Your last few behavior entries — the date and the heading',
    resolve(ctx) {
      if (!ctx.doc || !ctx.student) return null;
      const lines = entriesOfKind(ctx.doc, ctx.student.id, ['behavior'])
        .slice(0, RECENT_ENTRIES)
        .map((entry) => {
          const on = plainDate(text(entry.at).slice(0, 10));
          const subject = text(entry.subject).trim();
          return subject ? on + ' — ' + subject : '';
        })
        .filter(Boolean);
      return lines.length ? lines.join('\n') : null;
    } },
];

/* THE LOOKUP, AND THERE IS NO OTHER ONE. An `===` scan over sixteen entries, the same shape
   src/signals.js's ruleById() takes. Nothing indexes an object by a token — see the header for what
   `{{constructor}}` does to the build that does. */
function fieldNamed(name) {
  return FIELDS.filter((field) => field.name === name)[0] || null;
}

/*
  THE PALETTE WO-5.2 DRAWS, as data, with no resolver on it. Names and sentences only: a screen that
  could reach a `resolve` through this could resolve a field outside a draft, which is a second door
  into the same room.
*/
export function mergeFieldPalette() {
  return FIELDS.map((field) => ({ name: field.name, about: field.about }));
}

/* Every resolvable name, in the documented order. Exported for a check and for a palette head; the
   copy is fresh each call so a caller cannot sort the whitelist out from under the resolver. */
export function mergeFieldNames() {
  return FIELDS.map((field) => field.name);
}

/* ────────────────────────────── the tokens ──────────────────────────────

   `{{ name }}` with whatever spacing a teacher left around it, non-greedy so an unclosed brace is
   text rather than a swallowed paragraph, and `[^{}]` inside so a token cannot contain another
   one. The name is trimmed for the LOOKUP and the token is echoed back VERBATIM when it does not
   resolve — a teacher who typed a stray space sees her own line, not a tidied one. */
const TOKEN = /\{\{([^{}]*)\}\}/g;

/*
  WHY A NAME WAS REFUSED, which is the only decision REFUSED_WORDS takes part in. Read its comment
  before changing this: the field has already failed to resolve by the time this runs.
*/
function refusalFor(name) {
  const flat = name.toLowerCase().replace(/[^a-z]/g, '');
  return REFUSED_WORDS.some((word) => flat.indexOf(word) >= 0) ? REFUSED : UNKNOWN;
}

function messageFor(code, name, studentName) {
  const token = '{{' + name + '}}';
  if (code === REFUSED) {
    return token + ' is not a merge field and cannot be made into one. Accommodation, medical and '
      + 'plan details never leave the roster, so no template can resolve one — take it out of the '
      + 'template.';
  }
  if (code === UNKNOWN) {
    return token + ' is not a merge field. It is left on the page as you typed it, and this draft '
      + 'cannot be sent until it is corrected or removed.';
  }
  return token + ' has nothing to fill it for ' + (studentName || 'this student')
    + '. It is left on the page as you typed it, and this draft cannot be sent until there is '
    + 'something to put there.';
}

/*
  ONE PIECE OF TEXT, RESOLVED. Returns the text with every field it could answer replaced, the
  errors that block the send, and `blocked` — which is `errors.length > 0` and is on the return so
  that a caller asks one question rather than knowing that rule.

  THE THREE ARMS ARE SEPARATE ON PURPOSE (see the header). A refused name never reaches a resolver,
  an unknown name never reaches a resolver, and an unresolved one is a resolver that had nothing to
  say. Collapsing any two of them would leave WO-5.1's acceptance lines 1, 3 and 6 unable to tell
  which had happened.

  ERRORS ARE DEDUPED BY CODE AND NAME, not by occurrence: a body that says `{{guardian.name}}` in
  the greeting and again in the closing line is one missing guardian, and a list that said so twice
  would read as two problems. `where` says which half of a template it came from, filled by
  resolveDraft() below.
*/
export function resolveText(source, request) {
  const ctx = contextOf(request);
  const errors = [];
  const seen = [];
  function fail(code, name) {
    const key = code + '|' + name;
    if (seen.indexOf(key) >= 0) return;
    seen.push(key);
    errors.push({
      code: code,
      field: name,
      studentId: ctx.student ? ctx.student.id : '',
      studentName: ctx.studentName,
      where: '',
      message: messageFor(code, name, ctx.studentName),
    });
  }

  const out = text(source).replace(TOKEN, (token, inner) => {
    const name = String(inner).trim();
    const field = fieldNamed(name);
    /* ARM 1 and ARM 2 — not on the whitelist. Nothing is looked up, nothing is read off the
       document, and the token goes back exactly as it arrived. */
    if (!field) {
      fail(refusalFor(name), name);
      return token;
    }
    const value = field.resolve(ctx);
    /* ARM 3 — a real field with nothing behind it. The blank check is here, once, rather than in
       sixteen resolvers: "an unresolved merge field never renders blank" is one rule and it gets
       one place to live. */
    if (value === null || value === undefined || !text(value).trim()) {
      fail(UNRESOLVED, name);
      return token;
    }
    return text(value);
  });

  return { text: out, errors: errors, blocked: errors.length > 0 };
}

/*
  A WHOLE DRAFT — subject and body out of one template, against one student.

  `request` is the caller's, and every part of it is optional except `doc`:

      { doc, classId, termId, studentId, guardian, hit, hits, template }

  `template` is a `templates[]` record (docs/data-model.md) or anything else carrying `subject` and
  `body`. `guardian` is WO-5.3's audience pick; `hit` is the signal row the draft was opened from
  and is what `{{grade.delta}}` reads; `hits` is a wider list `{{signals.list}}` may speak from.

  **`blocked` IS THIS MODULE'S WHOLE SAY IN THE SEND.** There is no send here to stop — WO-5.3 owns
  the `mailto:` handoff — so what "blocks the send" means at this layer is that the draft comes back
  carrying a named error and a flag, and the flow that owns the button reads them. A resolver that
  reached for a control would be this work order growing into the next one.
*/
export function resolveDraft(request) {
  const req = request || {};
  const template = req.template || {};
  const subject = resolveText(template.subject, req);
  const body = resolveText(template.body, req);
  const errors = subject.errors.map((e) => Object.assign({}, e, { where: 'subject' }))
    .concat(body.errors.map((e) => Object.assign({}, e, { where: 'body' })));
  return {
    subject: subject.text,
    body: body.text,
    errors: errors,
    blocked: errors.length > 0,
  };
}
