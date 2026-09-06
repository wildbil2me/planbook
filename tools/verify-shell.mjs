/* verify-shell.mjs — drive the real app in a headless browser and measure it.
 *
 * Run:  node tools/verify-shell.mjs
 * Exit: 0 if every check passed, 1 if any failed or the browser could not be driven.
 *
 * WHY THIS EXISTS. Several of Phase 1's acceptance lines cannot be settled by reading a
 * stylesheet. WO-1.2 shipped `.search-box { min-height: 44px }` around a 19px input: the
 * wrapper measured 44px, the input did not, and tapping above the text did nothing. A
 * stylesheet review calls that line compliant. Measuring it does not. Everything here is a
 * claim that grep would get wrong.
 *
 * It is NOT a test framework, and the distinction matters — `CLAUDE.md` and Roll Call!'s
 * `plans/b-hygiene.md` rule out linters and test frameworks. This is one dependency-free
 * `.mjs` under `tools/`, run by hand, exactly as `tools/README.md` describes; Roll Call!'s
 * `design/execution-guide.md` §7 already says to verify by driving the built demo in headless
 * Edge over CDP. `TESTING.md` remains the gate. This tool feeds it evidence.
 *
 * Read `tools/README.md` § "Driving a browser over CDP" before changing anything below. Two
 * of the traps documented there were discovered twice, by two different agents, because they
 * present as app defects rather than harness bugs.
 *
 * ── WHAT THIS FILE IS, SINCE WO-1.26 ──────────────────────────────────────────────────────
 *
 * It is the entry, and only the entry: the arguments, the static server, the browser, the page,
 * the shared helpers every section is handed, the two ordered lists of sections, and the summary.
 * The checks themselves live one per file in `tools/verify/`. Nothing was added and nothing was
 * removed in that split — the count printed at the bottom was 1156 before it and is 1156 after,
 * which is the whole of what WO-1.26 claims.
 *
 * It moved because the file had reached 32,853 lines and agents had stopped reading it: 616
 * `Edit`/`Write` calls against this one path, 511 shell-outs to read thirty-line windows of it,
 * and only 59 of 142 implementer runs that ever saw a `0 failed` summary line. The reasoning and
 * the measurements are in `plans/verification-tooling.md`
 * § "Splitting the harness, 2026-08-25 (WO-1.26)", and where a new check goes is in
 * `tools/README.md` § "Driving a browser over CDP", first subsection.
 *
 * THE LIST BELOW IS EXPLICIT ON PURPOSE, and a directory scan is the thing it exists instead of.
 * A runner that globbed `tools/verify/*.mjs` would make the check count depend on what happens to
 * be on disk, which is exactly the property that lets a section disappear and still print green.
 * Adding a section is a new file, one `import` line, and one row in `STATIC_SECTIONS` or
 * `BROWSER_SECTIONS` — a visible diff in one place.
 *
 * A SECTION THAT THROWS USED TO KILL THE RUN, AND THE HALF OF THAT RULE THAT SURVIVES IS THE LOUD
 * HALF. The paragraph that stood here said nothing below wraps `run(h)` in a try/catch, deliberately,
 * because catching would turn a section that broke into a section that quietly did not happen —
 * the same lie as a silent skip, and the failure mode this file's SKIP accounting exists to make
 * loud. That reasoning is still right and it is why the containment below is shaped the way it is.
 * What beat it is the case it did not imagine, measured on 2026-08-31 (WO-1.44): one unsatisfied
 * selector in the attendance section threw out of the process at check 518 of 1,284, and the other
 * 766 checks — grades, signals, outreach, every surface downstream of attendance — did not run, on
 * a run whose summary line never printed. **A run that stops has not gone green or red, and no
 * reader of its output can tell.** That is worse than the thing the paragraph was protecting
 * against, because 513 PASS lines scroll past first and it looks like a run.
 *
 * So the rule is now about LOUDNESS rather than about lethality, and `runSection()` below keeps
 * every word of it: a section that throws gets a FAIL result of its own, named after the file,
 * carrying the throw and how many of that section's checks had run before it — printed as a FAIL
 * line, listed in the FAILED block of the summary, counted in `results`, and the run exits 1. It is
 * not quiet, it is not a skip, and nothing about it reads green. What it stops being is fatal to
 * the sections after it. If the page cannot be brought back, the run stops there and says which
 * sections never ran, by name — which is the one thing the old behaviour could not say either.
 */

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/* ── the sections, in run order ─────────────────────────────────────────────────────────────
 * Sixty-three files, named after the surface they drive rather than after the work order that added
 * them, so that a reader looking for "where do I put a check about the score grid" answers it
 * from the list. Two of them are not sections: lib-dates.mjs is a pure helper library, and
 * attendance-passes.mjs is the second half of the attendance section, called by the first half
 * with the fixtures it has already built. */
import { run as precache } from './verify/precache.mjs';
import { run as dateFormat } from './verify/date-format.mjs';
import { run as keysLegendScores } from './verify/keys-legend-scores.mjs';
import { run as keysLegendMarking } from './verify/keys-legend-marking.mjs';
import { run as keysLegendGuards } from './verify/keys-legend-guards.mjs';

import { run as focusRing } from './verify/focus-ring.mjs';
import { run as inlineColors } from './verify/inline-colors.mjs';
import { run as safeArea } from './verify/safe-area.mjs';
import { run as modal } from './verify/modal.mjs';
import { run as localstoragePrefs } from './verify/localstorage-prefs.mjs';
import { run as liveRegion } from './verify/live-region.mjs';
import { run as yearDocumentStore } from './verify/year-document-store.mjs';
import { run as backupRestore } from './verify/backup-restore.mjs';
import { run as classesTerms } from './verify/classes-terms.mjs';
import { run as categoriesWeights } from './verify/categories-weights.mjs';
import { run as letterGrades } from './verify/letter-grades.mjs';
import { run as gradeEngine } from './verify/grade-engine.mjs';
import { run as rosterContacts } from './verify/roster-contacts.mjs';
import { run as supportDetails } from './verify/support-details.mjs';
import { run as assignments } from './verify/assignments.mjs';
import { run as termNav } from './verify/term-nav.mjs';
import { run as historyDialogWrite } from './verify/history-dialog-write.mjs';
import { run as attendance } from './verify/attendance.mjs';
import { run as termEdgesMarking } from './verify/term-edges-marking.mjs';
import { run as termEnded } from './verify/term-ended.mjs';
import { run as registerOpensOnTerm } from './verify/register-opens-on-term.mjs';
import { run as todayGoesToTerm } from './verify/today-goes-to-term.mjs';
import { run as keyboardMarking } from './verify/keyboard-marking.mjs';
import { run as touchTargets } from './verify/touch-targets.mjs';
import { run as horizontalOverflow } from './verify/horizontal-overflow.mjs';
import { run as notePanel } from './verify/note-panel.mjs';
import { run as passCard } from './verify/pass-card.mjs';
import { run as portraitLandscape } from './verify/portrait-landscape.mjs';
import { run as totalsRenderCost } from './verify/totals-render-cost.mjs';
import { run as recordedMeetingCounts } from './verify/recorded-meeting-counts.mjs';
import { run as totalsByteIdentical } from './verify/totals-byte-identical.mjs';
import { run as scoreGrid } from './verify/score-grid.mjs';
import { run as assignedAndDue } from './verify/assigned-and-due.mjs';
import { run as dateZeroKey } from './verify/date-zero-key.mjs';
import { run as dateClear } from './verify/date-clear.mjs';
import { run as attendanceHistory } from './verify/attendance-history.mjs';
import { run as gradeDetail } from './verify/grade-detail.mjs';
import { run as gradeSheet } from './verify/grade-sheet.mjs';
import { run as pastDue } from './verify/past-due.mjs';
import { run as accommodationPrompts } from './verify/accommodation-prompts.mjs';
import { run as printGate } from './verify/print-gate.mjs';
import { run as buildLine } from './verify/build-line.mjs';
import { run as workerTakeover } from './verify/worker-takeover.mjs';
import { run as copyClass } from './verify/copy-class.mjs';
import { run as contactsImport } from './verify/contacts-import.mjs';
import { run as signalEngine } from './verify/signal-engine.mjs';
import { run as ungradedCount } from './verify/ungraded-count.mjs';
import { run as calendarEvents } from './verify/calendar-events.mjs';
import { run as calendarDerived } from './verify/calendar-derived.mjs';
import { run as calendarDrawn } from './verify/calendar-drawn.mjs';
import { run as concernList } from './verify/concern-list.mjs';
import { run as praiseColumn } from './verify/praise-column.mjs';
import { run as policyUrl } from './verify/policy-url.mjs';
import { run as driveSignIn } from './verify/drive-sign-in.mjs';
import { run as logEntries } from './verify/log-entries.mjs';
import { run as mergeFields } from './verify/merge-fields.mjs';
import { run as templates } from './verify/templates.mjs';
import { run as outreach } from './verify/outreach.mjs';
import { run as contactLog } from './verify/contact-log.mjs';
import { run as cooldownQuiet } from './verify/cooldown-quiet.mjs';

/* Not a section — the pure date library every section reads its "what day is it" out of. Imported
   here for the two values that are this file's business: how far the clock has been moved by
   `--today` and by how many milliseconds, so the PAGE can be moved by the same amount. Everything
   else in that module is imported by the sections that use it. */
import { SHIFT_DAYS, SHIFT_MS, nodeToday } from './verify/lib-dates.mjs';

/* The schema this build writes. Written out here rather than read off the app, so that the checks
   below which say "the document came out at the current version" are claims about a NUMBER and not
   a comparison of the app with itself. It went 1 → 2 at WO-2.10, when every `marks` cell became an
   object, and 2 → 3 at WO-2.8, when the document grew `openPasses` and `passes`; the next
   migration changes this line and the assertions that use it. */
const SCHEMA_NOW = 3;

/* The two controls that replaced the ~950-line soft cap on 2026-08-05, retired after binding once
   in four work orders — it could not tell coverage from bloat on a file that grows with the app's
   surface. `plans/verification-tooling.md` § "Retiring the line cap" holds the reasoning, and says
   these get reported beside the check count so that neither is a number nobody computes. Lines per
   check catches 400 lines buying five checks; runtime catches the harness quietly becoming too slow
   to run before a commit, which is how one actually dies. Neither gates anything — this file gates
   nothing, by the first rule in that document. They are printed to be looked at. */
const RUN_STARTED = Date.now();

/* Derived, not hardcoded. This script gets run once every few months by someone who has
   forgotten it exists, possibly from a clone at a different path. */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};

/* Every browser that speaks CDP and is plausibly on a Windows teacher-laptop. Edge first
   because that is what the suite's execution guide names. */
const BROWSERS = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
];

/* ────────────────────────────── result bookkeeping ────────────────────────────── */

const results = [];
function check(name, ok, detail) {
  results.push({ name, state: ok ? 'pass' : 'fail', detail: detail || '' });
  console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name + (detail ? '  :: ' + detail : ''));
}
/* A skipped check is announced, never silent. A fixture that quietly stopped existing is how
   a suite of 27 checks becomes a suite of 4 that still prints green. */
function skip(name, why) {
  results.push({ name, state: 'skip', detail: why });
  console.log('SKIP | ' + name + '  :: ' + why);
}

/* ────────────────── reading localStorage, and whose keys are whose ──────────────────
 *
 * THE BROWSER CAN WRITE INTO THE PAGE'S LOCALSTORAGE TOO, which took two red runs at WO-1.9 to
 * believe. `shopifySelectors` and `debug` appeared mid-run — intermittently, on a throwaway
 * profile, on a page served from 127.0.0.1 that nothing but this app touches, and never on a
 * shorter probe of the same page. They were suspected to be Edge's, not Planbook's, and
 * `--disable-extensions` plus `--disable-component-extensions-with-background-pages` went on the
 * launch line as the fix (see below).
 *
 * The two checks that read localStorage assert "every key here starts with planbook_" — this
 * was dropped once, on the reasoning that the environment noise made the assertion unreliable,
 * but trap 7 in tools/README.md is the precedent against exactly that move: dropping a
 * sensitive-feeling assertion because the harness looks unreliable leaves the check measuring
 * almost nothing, and it goes green whether or not a leak is present. The environment gets
 * fixed instead (the two flags above), and the assertion is kept and trusted. src/prefs.js is
 * the only door to localStorage in this repo and it prefixes everything it writes, which
 * tools/wo-sweep.mjs settles statically by grep as well — both catch a key written outside the
 * door, one at the source and one in the browser.
 *
 * Every key, ours or not, and every value, is still searched for the fixture's own phrases: what
 * makes a key a leak is what is in it as much as what it's named. And a foreign key is always
 * PRINTED when the check fails, so a reader can see what was in the store.
 */
function readLocalStore(evaluate, limit) {
  return evaluate(`(function(){ var out = {};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i); out[k] = String(localStorage.getItem(k)).slice(0, ` + limit + `); }
    return out; })()`);
}
const oursIn = (store) => Object.keys(store).filter(k => k.indexOf('planbook_') === 0);
const foreignIn = (store) => Object.keys(store).filter(k => k.indexOf('planbook_') !== 0);
const storeDetail = (store) => oursIn(store).join(', ')
  + (foreignIn(store).length ? ' · not ours, and searched anyway: ' + foreignIn(store).join(', ') : '');

/* ────────────────────────────── the harness every section is handed ──────────────────────────────
 *
 * One object, built in two steps, and the two steps are the reason the static sections run first.
 * `STATIC_SECTIONS` read files off disk and never touch a browser — the precache walk, the date
 * formatter, the two ⌨ Keys legends — so they run before Edge is launched and report a broken
 * SHELL array in two seconds rather than after a six-minute drive. Everything they need exists by
 * this line; everything else is filled in by the `Object.assign` further down, once the server is
 * listening and the page has booted.
 *
 * WHAT RIDES HERE AND WHAT DOES NOT. Anything that talks to the browser, the server or the
 * bookkeeping is on this object. Anything that does not — the date helpers, the two legend readers,
 * the page-side reader strings, `measureIn` — stays in the module that documents it and is imported
 * by name, so that a reader who wants to know where a helper is answers the question by reading one
 * `import` line rather than by grepping this file. */
const h = {
  SCHEMA_NOW, ROOT, results, check, skip, readLocalStore, oursIn, foreignIn, storeDetail,

  /* Filled in below. Declared here rather than assigned out of nowhere, so that the whole shared
     surface of this harness is one object literal a reader can take in at a glance. */
  PORT: 0, SERVED: null, udd: '', consoleLog: null,
  send: null, evalJs: null, has: null, clickSel: null, clickVisible: null, openCalendarPanel: null,
  KILL_ANIM: '', INSTALL_WALKER: '', dateResetOn: null, waitForBoot: null, load: null,

  /* Three readings one section takes and later ones live on. `seam` is "is window.planbook on the
     page at all", read once by `tools/verify/localstorage-prefs.mjs`; fifteen sections after it
     gate themselves on that one answer rather than asking again, which is the same argument the
     seam checks themselves make — a second reading is a second answer. `classesBooted` and
     `classSeam` are `tools/verify/classes-terms.mjs`'s, read by categories, letter grades, the
     grade engine and assignments. All three were module-scope `const`s before WO-1.26 and are on
     the harness for the same reason they were module-scope: one reading, many readers. */
  seam: false, classesBooted: false, classSeam: false,
};

const STATIC_SECTIONS = [
  { file: 'verify/precache.mjs', run: precache },
  { file: 'verify/date-format.mjs', run: dateFormat },
  { file: 'verify/keys-legend-scores.mjs', run: keysLegendScores },
  { file: 'verify/keys-legend-marking.mjs', run: keysLegendMarking },
  { file: 'verify/keys-legend-guards.mjs', run: keysLegendGuards },
];

const BROWSER_SECTIONS = [
  { file: 'verify/focus-ring.mjs', run: focusRing },
  { file: 'verify/inline-colors.mjs', run: inlineColors },
  { file: 'verify/safe-area.mjs', run: safeArea },
  { file: 'verify/modal.mjs', run: modal },
  { file: 'verify/localstorage-prefs.mjs', run: localstoragePrefs },
  { file: 'verify/live-region.mjs', run: liveRegion },
  { file: 'verify/year-document-store.mjs', run: yearDocumentStore },
  { file: 'verify/backup-restore.mjs', run: backupRestore },
  { file: 'verify/classes-terms.mjs', run: classesTerms },
  { file: 'verify/categories-weights.mjs', run: categoriesWeights },
  { file: 'verify/letter-grades.mjs', run: letterGrades },
  { file: 'verify/grade-engine.mjs', run: gradeEngine },
  { file: 'verify/roster-contacts.mjs', run: rosterContacts },
  { file: 'verify/support-details.mjs', run: supportDetails },
  { file: 'verify/assignments.mjs', run: assignments },
  { file: 'verify/term-nav.mjs', run: termNav },
  { file: 'verify/history-dialog-write.mjs', run: historyDialogWrite },
  { file: 'verify/attendance.mjs', run: attendance },
  { file: 'verify/term-edges-marking.mjs', run: termEdgesMarking },
  { file: 'verify/term-ended.mjs', run: termEnded },
  { file: 'verify/register-opens-on-term.mjs', run: registerOpensOnTerm },
  { file: 'verify/today-goes-to-term.mjs', run: todayGoesToTerm },
  { file: 'verify/keyboard-marking.mjs', run: keyboardMarking },
  { file: 'verify/touch-targets.mjs', run: touchTargets },
  { file: 'verify/horizontal-overflow.mjs', run: horizontalOverflow },
  { file: 'verify/note-panel.mjs', run: notePanel },
  { file: 'verify/pass-card.mjs', run: passCard },
  { file: 'verify/portrait-landscape.mjs', run: portraitLandscape },
  { file: 'verify/totals-render-cost.mjs', run: totalsRenderCost },
  { file: 'verify/recorded-meeting-counts.mjs', run: recordedMeetingCounts },
  { file: 'verify/totals-byte-identical.mjs', run: totalsByteIdentical },
  { file: 'verify/score-grid.mjs', run: scoreGrid },
  { file: 'verify/assigned-and-due.mjs', run: assignedAndDue },
  /* Straight after the section about the same two fields, and it depends on that placement in one
     direction only: it puts the viewport back to 1024 for itself rather than trusting the 390 it
     inherits. Moving it elsewhere in this list costs nothing. */
  { file: 'verify/date-zero-key.mjs', run: dateZeroKey },
  /* Straight after the keystroke section, because the two are halves of one repair: that one drives
     the `0` and asserts that no event replaces the element, this one drives the button that does.
     It sets its own 1024 viewport and puts the page back on the home view when it is finished, so
     it depends on its neighbours in neither direction. */
  { file: 'verify/date-clear.mjs', run: dateClear },
  { file: 'verify/attendance-history.mjs', run: attendanceHistory },
  { file: 'verify/grade-detail.mjs', run: gradeDetail },
  { file: 'verify/grade-sheet.mjs', run: gradeSheet },
  { file: 'verify/past-due.mjs', run: pastDue },
  { file: 'verify/accommodation-prompts.mjs', run: accommodationPrompts },
  { file: 'verify/print-gate.mjs', run: printGate },
  { file: 'verify/build-line.mjs', run: buildLine },
  { file: 'verify/worker-takeover.mjs', run: workerTakeover },
  { file: 'verify/copy-class.mjs', run: copyClass },
  { file: 'verify/contacts-import.mjs', run: contactsImport },
  { file: 'verify/signal-engine.mjs', run: signalEngine },
  { file: 'verify/ungraded-count.mjs', run: ungradedCount },
  { file: 'verify/calendar-events.mjs', run: calendarEvents },
  { file: 'verify/calendar-derived.mjs', run: calendarDerived },
  { file: 'verify/calendar-drawn.mjs', run: calendarDrawn },
  { file: 'verify/concern-list.mjs', run: concernList },
  { file: 'verify/praise-column.mjs', run: praiseColumn },
  { file: 'verify/policy-url.mjs', run: policyUrl },
  { file: 'verify/drive-sign-in.mjs', run: driveSignIn },
  { file: 'verify/log-entries.mjs', run: logEntries },
  { file: 'verify/merge-fields.mjs', run: mergeFields },
  /* AFTER THE RESOLVER AND BEFORE THE RESTORE (WO-5.2). It drives the screen over
     src/merge-fields.js, so it reads better beside it — and it puts the document through a real
     backup and a real restore of its own, which is the one thing the section below it also does.
     That one stays last for its own reason. */
  { file: 'verify/templates.mjs', run: templates },
  /* AND THE SEND FLOW AFTER THE EDITOR THAT FEEDS IT (WO-5.3). It reads `templatesFor()` the way
     that screen writes it, and it drives the signal card — so it wants both of them behind it. It
     is not last for the reason the section below is: it restores nothing, and its own fixture is
     put back by hand at the foot of it. */
  { file: 'verify/outreach.mjs', run: outreach },
  /* AND THE CONTACT LOG DIRECTLY AFTER THE FLOW THAT WRITES IT (WO-5.4). It is the only section
     that presses the handoff — the section above proves the same flow writes NOTHING while a draft
     is being made, so the two read as one argument in this order and would read as two in any
     other. It is not last for the reason the section below is: it restores nothing, and its own
     fixture, including the two contacts it makes the app write, is put back by hand at the foot
     of it. */
  { file: 'verify/contact-log.mjs', run: contactLog },
  /* LAST, AND ON PURPOSE (WO-4.5). It is the only section that drives a real restore of the whole
     year document through backup.restoreFromText() and the confirm button — its acceptance line
     asks for exactly that — and a section that replaces the document is a section nothing should
     run after. The file it restores is this run's own, so the content is unchanged either way;
     what this ordering buys is that the claim does not have to be true of the next fixture too. */
  { file: 'verify/cooldown-quiet.mjs', run: cooldownQuiet },
];

/* Part of the harness, counted in the lines-per-check figure below, and not a section: a pure
   helper library nothing runs on its own, and the far half of one section. */
const HARNESS_ALSO = ['verify/lib-dates.mjs', 'verify/attendance-passes.mjs'];

/* SAID BEFORE THE FIRST CHECK PRINTS, AND AGAIN IN THE SUMMARY (WO-1.44). A run on a moved clock
   is evidence about a day, not about today, and a log that did not say so is a log somebody quotes
   as an ordinary run. Nothing prints when the flag is absent, which is the ordinary case. */
if (SHIFT_DAYS) {
  console.log('CLOCK   : --today=' + nodeToday + ' — this run is ' + SHIFT_DAYS
    + ' day(s) from the real one, in Node AND in the page. Not an ordinary run.');
  console.log('');
}

/*
  ── ONE SECTION, RUN, AND WHAT HAPPENS IF IT THROWS (WO-1.44) ──

  Read the amended paragraph at the head of this file first: this is the whole of the containment,
  and every word of the rule it replaces is kept except the lethality.

  WHAT A THROW MEANS HERE. `clickSel()` throws when the element it was asked for is not on the page,
  and that is correct — a harness that clicked nothing and carried on would go on reporting about a
  screen it never touched. What was not correct is where the throw LANDED. On 2026-08-31 one
  selector built from an id a failed fixture had left `undefined` took out the 766 checks registered
  after attendance, and the summary line that would have said so never printed.

  SO THE THROW BECOMES A CHECK. `results` gains a `fail` named after the section file, carrying the
  message, the top of the stack, and how many of that section's own checks had run before it — the
  last of which is the closest anything here can honestly come to saying how much did NOT run, since
  no section declares a total. It prints as a FAIL line where it happened, it is listed in the
  FAILED block of the summary, it is counted in `results`, and it makes the process exit 1.

  AND THE PAGE IS PUT BACK, because a section that died mid-fixture usually leaves a modal open over
  everything and the sections after it would then be measuring the wreckage rather than the app.
  `load()` is the same reload a dozen sections already take. If it does not come back, the run stops
  there and the loop below names the sections that never ran — which is the one thing the old
  behaviour could not do either.

  IT IS USED FOR BOTH LISTS. A static section throws before the browser is even launched, where the
  blast radius is all 1,284 checks rather than 766; the argument for containing it is the same
  argument one size larger. `recover` is what differs, and a null one means "carry on regardless":
  there is no page to reload before there is a page, and nothing a static section does can wreck one.
*/
async function runSection(s, recover) {
  const before = results.length;
  try {
    await s.run(h);
    return true;
  } catch (e) {
    const where = (e && e.stack ? String(e.stack) : String(e))
      .split('\n').slice(0, 4).map((l) => l.trim()).join(' ← ');
    check('§ ' + s.file + ' ran to the end of its own checks', false,
      /* "of its own checks" and never "check(s)": `tools/wo-sweep.mjs` § 11 counts the string
         `check(` across this file, and a plural written that way is a call site it can see and the
         run can never fire. The false count then has to be typed into `tools/README.md` to get the
         sweep green, which is a number nothing produced. */
      'it threw after ' + (results.length - before) + ' of its own checks, and the rest of that '
      + 'section did not run — ' + where);
    if (!recover) return true;
    return await recover();
  }
}

/* The static half of the run: no browser, no server, no page. */
for (const s of STATIC_SECTIONS) await runSection(s, null);

/* ────────────────────────────── static server ────────────────────────────── */

/* Every path this server was ASKED for, in order, whether or not the file existed. Read by one
   block — § "the policy URL is not the app" at the foot of this file — which has to tell a
   navigation the worker answered out of Cache Storage from one it let through to the network, and
   from the page those two are the same rendered document. A path that appears here reached the
   network; a path that does not, did not. Nothing else reads it, and nothing writes it but the
   line below. */
const SERVED = [];

const server = http.createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  SERVED.push(p);
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT)) { res.writeHead(403); res.end('no'); return; }
  try {
    const buf = await fs.readFile(f);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    res.end(buf);
  } catch { res.writeHead(404); res.end('not found'); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const PORT = server.address().port;

function bail(msg) {
  console.error('\nCANNOT RUN: ' + msg);
  try { server.close(); } catch {}
  process.exit(1);
}

/* ────────────────────────────── launch the browser ────────────────────────────── */

let exe = null;
for (const b of BROWSERS) { try { await fs.access(b); exe = b; break; } catch {} }
if (!exe) bail('no Edge or Chrome found. Looked in:\n  ' + BROWSERS.join('\n  '));
console.log('browser : ' + exe);
console.log('serving : ' + ROOT + ' on 127.0.0.1:' + PORT + '\n');

const udd = await fs.mkdtemp(path.join(os.tmpdir(), 'pb-verify-'));

/* Port 0 lets the browser choose, and it writes the choice to DevToolsActivePort. A fixed
   port collides with a previous run that did not shut down cleanly, and the failure looks
   like "the app broke" rather than "something else owns 9333". */
/* The two extension flags are the suspected source of the foreign localStorage keys described at
   readLocalStore() above — Edge ships features as bundled component extensions, and a content
   script of one of them is the only thing on this machine that could be writing into the store of
   a page served from 127.0.0.1. Suspected, not proven: the injection was intermittent and could
   not be reproduced on demand, so the assertions below do not depend on these flags working. */
const proc = spawn(exe, [
  '--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + udd,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars',
  '--disable-extensions', '--disable-component-extensions-with-background-pages',
  'about:blank',
], { stdio: 'ignore' });
proc.on('error', e => bail('could not spawn the browser: ' + e.message));

async function debuggerUrl() {
  const portFile = path.join(udd, 'DevToolsActivePort');
  for (let i = 0; i < 100; i++) {
    try {
      const txt = await fs.readFile(portFile, 'utf8');
      const [port, wsPath] = txt.split('\n');
      if (port && wsPath) return 'ws://127.0.0.1:' + port.trim() + wsPath.trim();
    } catch {}
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('the browser never wrote DevToolsActivePort');
}

let ws;
try {
  ws = new WebSocket(await debuggerUrl());
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('CDP socket refused')); });
} catch (e) { proc.kill(); bail(e.message); }

let id = 0, sessionId = null;
const pending = new Map();
/* Everything the page logged, in order. Runtime.enable is already on, so these events were
   arriving and being dropped; keeping them is what lets a check assert that a failure was
   REPORTED and not only handled — "does not silently swallow" is an acceptance line, and the
   console is where a swallowed error would have gone. */
const consoleLog = [];
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.method === 'Runtime.consoleAPICalled') {
    const args = (msg.params.args || []).map(a => (a.value !== undefined ? String(a.value) : (a.description || '')));
    consoleLog.push({ type: msg.params.type, text: args.join(' ') });
    return;
  }
  if (msg.id && pending.has(msg.id)) {
    const e = pending.get(msg.id); pending.delete(msg.id);
    msg.error ? e.rej(new Error(JSON.stringify(msg.error))) : e.res(msg.result);
  }
};
function send(method, params = {}, useSession = true) {
  const mid = ++id;
  const payload = { id: mid, method, params };
  if (useSession && sessionId) payload.sessionId = sessionId;
  ws.send(JSON.stringify(payload));
  return new Promise((res, rej) => pending.set(mid, { res, rej }));
}

const target = await send('Target.createTarget', { url: 'about:blank' }, false);
const attached = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true }, false);
sessionId = attached.sessionId;
await send('Page.enable');
await send('Runtime.enable');

async function evalJs(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) {
    throw new Error(r.exceptionDetails.exception?.description || 'eval threw');
  }
  return r.result.value;
}
async function has(sel) { return await evalJs('!!document.querySelector(' + JSON.stringify(sel) + ')'); }

/* Input.dispatchMouseEvent takes VIEWPORT coordinates, so a target below the fold is not
   clicked — the event lands on whatever is at that spot on screen, or on nothing, and the
   failure reads as "the modal stopped opening". Scroll it into view first, then measure.
   WO-1.3's install banner is what exposed this: it added ~150px above the shelf and pushed
   the second modal opener off an 800x600 headless window. */
async function clickSel(sel, nth = 0) {
  const box = await evalJs('(function(){var e=document.querySelectorAll(' + JSON.stringify(sel) + ')['
    + nth + '];if(!e)return null;e.scrollIntoView({block:"center"});var r=e.getBoundingClientRect();'
    + 'return {x:r.x+r.width/2,y:r.y+r.height/2}})()');
  if (!box) throw new Error('nothing to click for ' + sel + ' [' + nth + ']');
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x, y: box.y, button: 'left', clickCount: 1 });
  await new Promise(r => setTimeout(r, 150));
}

/*
  ONE VISIBLE MATCH, CLICKED BY INDEX — clickSel's oldest trap, wrapped so it stops being retyped.

  Several hooks in this app are carried by four or five elements at once and which of them is on
  screen depends on the view: `[data-view-home]` is on the header's own tab, on the class view's
  panel header, on the assignment list's, on the score grid's and on the calendar's. A bare
  `clickSel('[data-view-home]')` takes the FIRST in document order, which is usually `.hidden` —
  clickSel measures it at 0x0 and dispatches the click at the top-left corner of the viewport
  instead, onto whatever is there. That reads as "the button stopped working" and has cost two
  sections a red run apiece (tools/README.md § "Driving a browser over CDP", trap 3).
*/
async function clickVisible(sel) {
  const nth = await evalJs(`(function(){
    var all = document.querySelectorAll(${JSON.stringify(sel)});
    for (var i = 0; i < all.length; i++) {
      var r = all[i].getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return i;
    }
    return -1; })()`);
  if (nth < 0) throw new Error('no visible ' + sel + ' on this screen');
  await clickSel(sel, nth);
}

/*
  THE DAYS-OFF AND EVENTS DOORS LIVE ON THE CALENDAR NOW (WO-6.6), AND THIS IS THE ONE PLACE THAT
  KNOWS HOW TO REACH THEM.

  Ten call sites in this file used to open those two panels from `#homeView`'s title row. The owner's
  ruling of 2026-08-19 took both buttons off that row — the home screen keeps Calendar and loses the
  other two — so every one of those selectors now names a button that does not exist. Rather than
  re-typing the same three-step walk ten times, it is written once here: shut anything over the page,
  get onto the calendar if we are not already, and tap the panel's own door in that screen's panel
  header.

  THE HOME SCREEN'S OWN Calendar BUTTON IS THE ROUTE IN, deliberately, rather than the fourth segment
  on the class-screen switcher. Both doors are real and both are tested in § "the month and the week,
  drawn" — but the pill arrives FILTERED to the class it came from, and a block that only wants to
  author a day off should not be silently choosing a lens for itself. The home door is the one that
  opens with every class showing.

  IT IS SCOPED TO `.panel-title-actions`. The same two hooks are also inside `#calendarEmpty`, which
  is `.hidden` on any month with something on it — so an unscoped selector would take whichever of
  the two copies came first in document order and click a 0x0 element whenever the month was not
  empty. That is clickVisible's trap above, met a second way.
*/
async function openCalendarPanel(hook) {
  await evalJs(`(function(){
    if (!window.planbook || !window.planbook.closeModal) return 0;
    var open = document.querySelectorAll('.modal-overlay:not(.hidden)');
    Array.prototype.forEach.call(open, function(o){ window.planbook.closeModal(o); });
    return open.length; })()`);
  const onCalendar = await evalJs("(function(){ var v = document.getElementById('calendarView');"
    + ' return !!v && !v.classList.contains(\'hidden\'); })()');
  if (!onCalendar) {
    const onHome = await evalJs("(function(){ var v = document.getElementById('homeView');"
      + ' return !!v && !v.classList.contains(\'hidden\'); })()');
    if (!onHome) await clickVisible('[data-view-home]');
    await clickSel('#homeView [data-calendar-open]');
    await new Promise(r => setTimeout(r, 200));
  }
  await clickSel('#calendarView .panel-title-actions ' + hook);
  await new Promise(r => setTimeout(r, 250));
}

/* Headless Chromium with no visible frame never advances a transition or a keyframe, so
   getBoundingClientRect returns start-of-animation values. `.modal-close` measures 42.24px —
   which is 44 x 0.96, the srIn keyframe's opening scale — and reads exactly like a failed
   touch target. Kill animation before measuring anything, and re-apply after every reload. */
const KILL_ANIM = "(function(){var s=document.createElement('style');"
  + "s.textContent='*,*::before,*::after{transition:none !important;animation:none !important}';"
  + "document.head.appendChild(s);return 1})()";

/* One rule walker, installed page-side, used by every stylesheet check below.
 *
 * THE TRAP, and it is subtle enough to have cost two harnesses: a modern CSSStyleRule exposes
 * its own `.cssRules` — an empty CSSRuleList, present because CSS nesting exists. So the
 * obvious walk
 *
 *     if (r.cssRules) { walk(r.cssRules); continue; }   // WRONG
 *
 * treats every ordinary style rule as a container, recurses into nothing, and skips it. A
 * stylesheet of 120 rules reports 3, every selector search comes back empty, and nothing
 * throws. It reads as a clean pass. Process the rule first, THEN recurse into any children.
 */
const INSTALL_WALKER = `(function(){
  window.__eachRule = function(fn){
    var seen = 0;
    function walk(list){
      for (var i=0;i<list.length;i++){
        var r = list[i];
        if (r.style) { seen++; fn(r, r.selectorText || r.keyText || '(' + r.constructor.name + ')'); }
        if (r.cssRules && r.cssRules.length) walk(r.cssRules);
      }
    }
    for (var j=0;j<document.styleSheets.length;j++){
      try { walk(document.styleSheets[j].cssRules); } catch(e){}
    }
    return seen;
  };
  return 1;
})()`;

/* ────── is the shared date reset still reaching this field? (WO-2.24) ──────
 *
 * WHAT IS BEING GUARDED. `src/shell.css`'s BASE section holds one rule —
 * `input[type="date"] { -webkit-appearance: none; appearance: none; }` — and seven date fields on
 * four screens are drawn the way their stylesheets say only because it is there. Two of the seven,
 * the assignment editor's, also keep an identical copy of their own in `src/assignments.css` for
 * reasons written at that rule, and the WO-3.17 section at the foot of this file already measures
 * those two. The other five have nothing but the shared rule, and until this helper existed nothing
 * here had ever read a *style* off one of them: the dialogs get driven and the fields get typed
 * into, and the whole rule could still be deleted as a duplicate with every check in the repo
 * green.
 *
 * WHY A COMPUTED STYLE AND NOT A HEIGHT, which is the question this helper exists to answer and
 * the reason it is a helper rather than three lines of `min-height`. It is not that the boxes are
 * unmeasured — since WO-2.21 the coarse sweep opens all three of these dialogs and asserts 44px on
 * every control in them, date fields named in two of the three check messages. It is that those
 * measurements CANNOT FAIL for this: this engine applies an author's height to a date input whether
 * or not anything has told WebKit to stop painting the control itself, so 44px comes back on the
 * fixed tree and on the broken one alike. Measured rather than argued — with the rule deleted from
 * src/shell.css, all three of those sweeps stayed green (`measured 22 · 13 · 18; under = []`) while
 * the three checks below went red. A height check written for this defect is one that tells the
 * next reader a rule is guarded when it is not. Computed `appearance` is the one value that moves: it
 * is `none` while the rule is in the cascade and it is not the moment the rule goes. So this reads
 * a style and claims exactly one thing — the declaration is live on this element — and it claims
 * nothing whatever about the box the teacher sees. The height, the width and the widget WebKit
 * paints are iPad questions, they are owed to a human in `TESTING.md`, and no green run here pays
 * any part of them off.
 *
 * THE FIELD MUST BE ON SCREEN WHEN IT IS READ, and that is asserted rather than arranged for.
 * `getComputedStyle` answers for a `display: none` node as readily as for a drawn one, so a read
 * taken over a dialog nobody opened would be green about a screen that was never there — the same
 * lie as measuring a hidden view. Every call therefore carries the caller's own evidence that its
 * dialog or panel is open, and the element itself has to be laying out a box before its style
 * counts. A field that is missing or hidden is a FAIL here and never a quiet pass.
 *
 * IT READS COMPUTED STYLE AND NEVER `.value`. One of the three fields is the plan review date on
 * the student editor, so nothing this returns — no detail, no console line — may carry what a
 * teacher typed into it. Element ids and computed properties only. The box's dimensions are not
 * printed either, on purpose: they are not what is being asserted and a number in the detail is
 * how a height quietly becomes part of the claim.
 *
 * Shaped like homeVsDoc() in the classes section below — it returns `{ ok, detail }` and the caller
 * writes the check, so each surface names itself in its own words and this file's check count stays
 * one result per call site. */
async function dateResetOn(sel, want, shownJs, shownWords) {
  const r = await evalJs(`(function(){
    var els = Array.prototype.slice.call(document.querySelectorAll(${JSON.stringify(sel)}));
    return { shown: !!(${shownJs}), found: els.length,
             fields: els.map(function(el){
               var cs = getComputedStyle(el);
               return { id: el.id || el.className, type: el.type,
                        appearance: cs.appearance, webkit: cs.webkitAppearance,
                        display: cs.display, visibility: cs.visibility,
                        rects: el.getClientRects().length }; }) }; })()`);
  const fields = r.fields || [];
  const ok = r.shown === true && r.found === want && fields.length === want
    && fields.every(f => f.type === 'date' && f.rects > 0 && f.display !== 'none'
      && f.visibility !== 'hidden' && f.appearance === 'none' && f.webkit === 'none');
  return { ok,
    detail: shownWords + ' = ' + r.shown + ', ' + r.found + ' of ' + want + ' field(s) found :: '
      + (fields.length
        ? fields.map(f => f.id + ' [' + f.type + '] appearance ' + f.appearance
          + ', -webkit-appearance ' + f.webkit
          + (f.rects > 0 && f.display !== 'none' && f.visibility !== 'hidden'
            ? '' : ' — NOT RENDERED: display ' + f.display + ', visibility ' + f.visibility
              + ', ' + f.rects + ' client rect(s)')).join(' · ')
        : 'nothing matched ' + sel)
      + ' — the only rule in this tree that puts `none` there is input[type="date"] '
      + '{ -webkit-appearance: none; appearance: none; } in src/shell.css\'s BASE section' };
}

/* Boot is asynchronous since WO-1.4 — the page hides its loading screen only once the year
   document is out of IndexedDB — so a fixed sleep is a race on a slow machine, and losing it
   would look like every check below failing at once. Poll instead, and report rather than
   hang. Returns false if the app never came up, which is a failure and never a skip. */
async function waitForBoot(ms = 8000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    try {
      const up = await evalJs("(function(){var l=document.getElementById('loadingScreen');"
        + "return !!(l && l.classList.contains('hidden'))})()");
      if (up) return true;
    } catch { /* the document is still swapping under us */ }
    await new Promise(r => setTimeout(r, 150));
  }
  return false;
}

/* ────── keeping a handle on the AudioContext the page holds (WO-2.31) ──────
 *
 * WHY THIS IS HERE AND NOT IN src/. The hall-pass section has to interrupt the held context and
 * watch the app come back from it, and the work order's own note is that no harness in this project
 * can reach an iOS audio session: CDP has nothing that interrupts one. What it CAN do is call
 * `suspend()` on the real context, which is a genuine state change arriving from outside on the
 * object the module is holding — the same shape the device produces, delivered by a different hand.
 *
 * BUT ONLY IF IT CAN GET AT THE OBJECT, and src/alert-sound.js deliberately does not hand it over:
 * `alertAudioState()` DESCRIBES the context precisely so that a harness cannot resume or close the
 * thing it is measuring. That refusal is right and stays. So the object is caught where it is made
 * instead — a `Proxy` on `window.AudioContext` that records every construction and forwards
 * everything else — and the page under test is unchanged: the module reads the same global, calls
 * the same constructor, and gets back a real AudioContext it made itself.
 *
 * A TEST DOUBLE THE PRODUCTION PATH KNOWS ABOUT WOULD BE WORTHLESS, which is why it is done this
 * way round rather than by exporting a "pretend you were interrupted" function. Nothing in src/
 * reads `window.__audioContexts`, nothing branches on it, and the module cannot tell this run from
 * one where the interruption came from a phone call. The checks assert the two halves are holding
 * the SAME object rather than assuming it: the module's own `interruptions` count has to move when
 * this file suspends it, or the check is red.
 *
 * Installed on new documents rather than after boot, because the context is constructed at the
 * first gesture of the run — thousands of lines before the section that needs it — and this file
 * reloads the page a dozen times. */
const CATCH_AUDIO_CONTEXTS = `(function(){
  var Real = window.AudioContext;
  if (!Real || window.__audioContexts) return;
  window.__audioContexts = [];
  window.AudioContext = new Proxy(Real, {
    construct: function(target, args){
      var made = Reflect.construct(target, args);
      window.__audioContexts.push(made);
      return made;
    }
  });
})();`;
await send('Page.addScriptToEvaluateOnNewDocument', { source: CATCH_AUDIO_CONTEXTS });

/* ────── the page's clock, moved by exactly as much as Node's (WO-1.44) ──────
 *
 * `--today=YYYY-MM-DD` moves `tools/verify/lib-dates.mjs`'s four values, which is half of what a
 * date experiment needs: the app reads its own clock, and a harness that believed in one day while
 * the page believed in another would fail every check that compares the two — starting with the
 * attendance section's "the date it will write is today in LOCAL time", which exists precisely to
 * catch the two runtimes disagreeing. So the same offset goes onto the page.
 *
 * A PROXY, FOR THE REASON CATCH_AUDIO_CONTEXTS IS ONE. The page under test is unchanged: nothing in
 * src/ reads a flag, nothing branches on it, and the app cannot tell this run from one taken on
 * that day. Only the zero-argument construction and `Date.now()` move; `new Date('2026-09-08')`,
 * `Date.parse` and `Date.UTC` forward untouched, which is what keeps every ISO string in a fixture
 * meaning what it says. `instanceof` survives because the proxy forwards `prototype`.
 *
 * IT SHIFTS RATHER THAN FREEZES, so elapsed-time arithmetic — the hall-pass clock, the overdue
 * alerts, the render-cost timings — measures what it always measured. That is stated at the flag's
 * own definition too; it is the property that makes the flag cheap enough to be worth having.
 *
 * INSTALLED ON NEW DOCUMENTS, and it has to be: `src/attendance.js` computes today at module scope
 * on some paths and this file reloads the page a dozen times. */
const SHIFT_PAGE_CLOCK = `(function(){
  var SHIFT = ${SHIFT_MS};
  if (!SHIFT || window.__clockShifted) return;
  window.__clockShifted = SHIFT;
  var Real = Date;
  window.Date = new Proxy(Real, {
    construct: function(target, args, nt){
      return args.length ? Reflect.construct(target, args, nt)
        : Reflect.construct(target, [Real.now() + SHIFT], nt);
    },
    apply: function(target, self, args){ return new Real(Real.now() + SHIFT).toString(); },
    get: function(target, key, recv){
      if (key === 'now') return function(){ return Real.now() + SHIFT; };
      return Reflect.get(target, key, recv);
    }
  });
})();`;
if (SHIFT_MS) await send('Page.addScriptToEvaluateOnNewDocument', { source: SHIFT_PAGE_CLOCK });

async function load() {
  await send('Page.navigate', { url: 'http://127.0.0.1:' + PORT + '/index.html' });
  await new Promise(r => setTimeout(r, 800));
  await waitForBoot();
  await evalJs(KILL_ANIM);
  await evalJs(INSTALL_WALKER);
}
await load();

const booted = await evalJs("document.querySelectorAll('*').length");
if (booted < 20) bail('the page did not render — is index.html a placeholder?');


/* The browser half of the harness, now that all of it exists. */
Object.assign(h, {
  PORT, SERVED, udd, consoleLog,
  send, evalJs, has, clickSel, clickVisible, openCalendarPanel,
  KILL_ANIM, INSTALL_WALKER, dateResetOn, waitForBoot, load,
});

/* A booted page again, or an honest no. Everything it can throw is caught in here, because the one
   thing this must never do is throw out of the recovery from a throw. */
async function recoverPage() {
  try {
    await load();
    return (await evalJs("document.querySelectorAll('*').length")) > 20;
  } catch { return false; }
}

for (let i = 0; i < BROWSER_SECTIONS.length; i++) {
  if (await runSection(BROWSER_SECTIONS[i], recoverPage)) continue;
  /* The page did not come back. Stopping is right — every section after this one would throw on its
     first `evalJs` and print the same failure over and over — but stopping SILENTLY is the whole of
     the defect this block exists to remove, so the sections that never ran are named, counted, and
     red. */
  const rest = BROWSER_SECTIONS.slice(i + 1).map((x) => x.file);
  check('every browser section in the run order ran', false,
    'the page could not be brought back after ' + BROWSER_SECTIONS[i].file + ' threw, so '
    + rest.length + ' section(s) did not run at all: '
    + (rest.join(', ') || '(none — it was the last one)'));
  break;
}

/* ────────────────────────────── summary ────────────────────────────── */

const fails = results.filter(r => r.state === 'fail');
const skips = results.filter(r => r.state === 'skip');
console.log('\n================ SUMMARY ================');
console.log(results.length + ' checks · ' + results.filter(r => r.state === 'pass').length
  + ' passed · ' + fails.length + ' failed · ' + skips.length + ' skipped');

/* Read from disk rather than tracked as a constant, so it cannot drift from the files it
   describes — and it counts THE WHOLE HARNESS rather than this file. Before WO-1.26 those were
   the same thing. After it they are not: measuring only the entry would report ~700 lines over
   1,156 checks, which is not a smaller number, it is a false one. What is summed is the same
   explicit list the run is driven from plus the two files that are not sections, so a module
   nothing imports is not counted any more than it is run. */
let ownLines = 0;
for (const rel of ['verify-shell.mjs', ...HARNESS_ALSO,
  ...STATIC_SECTIONS.map(s => s.file), ...BROWSER_SECTIONS.map(s => s.file)]) {
  ownLines += (await fs.readFile(path.join(ROOT, 'tools', rel), 'utf8')).split('\n').length;
}
const perCheck = results.length ? (ownLines / results.length) : 0;
console.log(ownLines.toLocaleString() + ' lines · ' + perCheck.toFixed(1) + ' lines per check · '
  + ((Date.now() - RUN_STARTED) / 1000).toFixed(0) + 's');
console.log('(health, not a gate — see plans/verification-tooling.md § "Retiring the line cap")');
if (skips.length) {
  console.log('\nSKIPPED (a skip is not a pass):');
  skips.forEach(s => console.log('  - ' + s.name + '  :: ' + s.detail));
}
if (fails.length) {
  console.log('\nFAILED:');
  fails.forEach(f => console.log('  - ' + f.name + (f.detail ? '\n      ' + f.detail : '')));
}
if (SHIFT_DAYS) {
  console.log('\nTHE CLOCK WAS MOVED: this run believed today was ' + nodeToday + ', ' + SHIFT_DAYS
    + ' day(s) from the real one. It is evidence about that day, not about today.');
}
console.log('\nThis tool measures. It does not replace TESTING.md, and nothing here closes a 👤 item —');
console.log('the iPad checks stay owed to a human no matter how green this run is.');

try { ws.close(); } catch {}
proc.kill();
server.close();
await fs.rm(udd, { recursive: true, force: true }).catch(() => {});
/* Set, not called. `process.exit()` while undici still holds a socket aborts the process on Windows
   (0xC0000409) AFTER the output above has printed — a run that said 628 of 628 and then handed the
   shell a crash code. Measured in verify-deploy.mjs at 2 of 5 runs; this file has the same exposure
   through the CDP WebSocket, which is undici's. Letting the process end naturally keeps the status.
   The three teardown lines above are what make that safe: if this ever hangs instead of exiting,
   one of them stopped releasing its handle, and that is the bug rather than this line. (WO-8.8
   follow-up.) */
process.exitCode = fails.length ? 1 : 0;
