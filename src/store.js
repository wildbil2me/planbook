/*
  The year document store — IndexedDB, and the save loop that keeps it current.

  ── ONE OBJECT STORE, ONE RECORD PER YEAR, AND NOTHING NORMALIZED ──

  `years`, keyed by the year string, each record the whole document as a single value. That
  is not a shortcut taken to save an afternoon; it is the sync design. Whole-document
  last-writer-wins is only sound because there is exactly one thing to compare and one thing
  to overwrite (docs/sync.md). Splitting `students` / `scores` / `attendance` into their own
  stores would look tidier, would profile faster, and would quietly remove the property that
  makes sync correct — without breaking a single thing you could test on a desk. Don't.

  The whole year is 3-6 MB (docs/data-model.md). It loads in well under a second, which is
  why every query in this app is a plain array operation over an object already in memory and
  there is no query layer anywhere in the repo.

  ── THE SAVE LOOP ──

  update() mutates the live document and schedules a debounced write. Every write that lands
  bumps `rev` by exactly one and stamps `updatedAt`. `rev` counts SAVES, not edits — it is
  the sync ordering key, and two edits inside the debounce window are deliberately one save
  and one rev. That is what debouncing is for.

  Debounce, and then flush the moment the page stops being visible: iOS kills a backgrounded
  tab without warning, and a timer that has not fired yet dies with it. A lost debounce there
  is a period of grades the teacher already typed.

  ── WHAT IS NOT HERE ──

  No Drive, no conflict handling, and nothing ever sets the chip's `syncing` state — Phase 7
  owns all of it.

  Backup and restore live in src/backup.js, which owns the file format, the validation, and the
  teacher-facing copy. Only two things about them are the store's business and they are at the
  bottom of this file: reading a stored record without opening it, and the swap itself.
*/

import { showSaveState } from './save-indicator.js';
import { announce } from './live-region.js';
import { getPref, setPref } from './prefs.js';

const DB_NAME = 'planbook';
/* The IndexedDB version, which is NOT the document's schemaVersion and never tracks it. This
   number changes only when the object stores themselves change shape — and the whole point of
   the single-document design is that they never will. Document shape changes go through
   MIGRATIONS below. */
const DB_VERSION = 1;
const STORE = 'years';

/* The document's own version, stamped into every document and read back on load. It went to 2 at
   WO-2.10, when every `marks` cell became an object — see MIGRATIONS below. */
export const SCHEMA_VERSION = 2;

/* Long enough to swallow a burst of typing, short enough that "✓ Saved" appears while the
   teacher is still looking at the chip. */
const DEBOUNCE_MS = 800;
/* A pure debounce never fires while the teacher keeps going, and entering a column of grades
   is exactly that — thirty keystrokes, none of them 800ms apart. The ceiling is what makes
   the first save happen during the work rather than after it. */
const MAX_WAIT_MS = 5000;
const RETRY_AFTER_MS = 400;

/* ────────────────────────────── ids ────────────────────────────── */

/* Prefixes come from docs/data-model.md: c_ class, k_ category, s_ student, a_ assignment,
   l_ log, e_ event, t_ template — plus tm_ term, added at WO-1.6. Short and base36 rather than a
   UUID because these ids are read by a human exactly once — in a backup file they are trying to
   understand — and a line of hyphenated hex tells that person nothing.

   `tm_` is two characters because `t_` was already template, and a term needed a prefix that reads
   as "term" in that backup file rather than one that reads as nothing. docs/data-model.md sketches
   a term as `{ "id": "Q1", … }`; that is illustrative shorthand in a schema sketch, and the term id
   is opaque like every other id here — src/classes.js generates every one of them from newId('tm')
   and nothing anywhere compares one against a literal. */
export function newId(prefix) {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(36).padStart(2, '0');
  return prefix + '_' + out.slice(0, 10);
}

/* docId and deviceId are the two ids that leave the device: Phase 7 matches a Drive file by
   docId and labels a conflict copy by device (docs/sync.md), so these want real global
   uniqueness rather than readability. randomUUID needs a secure context, which Planbook
   always has — the fallback exists so a mis-served local copy fails at the store instead of
   at boot. */
function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return newId('u') + '-' + newId('u');
}

/* ────────────────────────────── the document ────────────────────────────── */

/* A conventional US scale, seeded so that a fresh document can render a letter at all. It is
   data, not policy: the teacher edits the boundaries in Settings and the grade math reads
   them rather than hardcoding 90/80/70 (docs/data-model.md § Letter grades). Literals like
   these belong in seed data and nowhere else. */
function defaultLetterScale() {
  return [
    { letter: 'A',  min: 93 }, { letter: 'A-', min: 90 },
    { letter: 'B+', min: 87 }, { letter: 'B',  min: 83 }, { letter: 'B-', min: 80 },
    { letter: 'C+', min: 77 }, { letter: 'C',  min: 73 }, { letter: 'C-', min: 70 },
    { letter: 'D+', min: 67 }, { letter: 'D',  min: 63 }, { letter: 'D-', min: 60 },
    { letter: 'F',  min: 0 },
  ];
}

/* A valid, empty year document, exactly the shape docs/data-model.md settles. Every collection
   is present and empty rather than absent: a screen that has to check whether `students`
   exists before reading it is a screen that will eventually forget. */
export function newYearDocument(year) {
  return {
    schemaVersion: SCHEMA_VERSION,
    docId: uuid(),
    year: year,
    /* 0 means "never written". createYear()'s first save makes the stored document rev 1, so
       a document's rev is the number of saves behind it. */
    rev: 0,
    /* Generated with the document. Whether the device that WRITES a document re-stamps this
       is Phase 7's question, not this work order's — sync uses it to name a conflict copy
       ("conflict from iPad"), and nothing here reads it. */
    deviceId: uuid(),
    updatedAt: new Date().toISOString(),

    teacher: { name: '', school: '', email: '', adminEmail: '', defaultCc: true },

    /* No schedule object, by design — plans/rotating-schedule.md. A class met if it has an
       attendance record without an exception, so there is nothing here to seed. */
    classes: [],
    letterScale: defaultLetterScale(),
    students: [],
    assignments: [],
    /* Keyed by assignment, then student, and a cell is always an object — never a bare number
       (docs/data-model.md). No key at all means ungraded, which is why this seeds to `{}` and
       not to a grid of nulls. */
    scores: {},
    attendance: [],
    log: [],
    events: [],
    templates: [],
    /* Empty, and deliberately not pre-filled with threshold keys. The defaults are tabulated
       in docs/data-model.md § Signal thresholds, and Phase 4 owns their names. The evaluator
       has to read a missing key as its default regardless — every document written before a
       threshold was added is missing it — so naming them here would only make this file look
       like the source of truth for arithmetic it does not implement. */
    signals: {},
  };
}

/* July is the boundary: a document created in August is for the year that is about to start,
   one created in May is for the year in progress. The teacher can create any year by hand
   from the year picker, so a wrong guess costs one tap rather than a wrong document. */
export function currentSchoolYear(now = new Date()) {
  const start = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return start + '-' + (start + 1);
}

/* `2026-2027`. Tolerant on the way in — an en dash, a slash, a space, `2026-27`, or a bare
   `2026` all mean the same thing to a teacher — and strict on the way out, because the string
   is the primary key of the object store and two spellings of one year would be two
   documents. Returns null when it cannot tell what was meant; the caller says so. */
export function normalizeYear(input) {
  const raw = String(input == null ? '' : input).trim();
  const pair = raw.match(/^(\d{4})\s*[-–—/ ]\s*(\d{2}|\d{4})$/);
  if (pair) {
    const start = Number(pair[1]);
    const end = pair[2].length === 2 ? Number(String(start).slice(0, 2) + pair[2]) : Number(pair[2]);
    if (end !== start + 1) return null;
    return start + '-' + end;
  }
  const single = raw.match(/^(\d{4})$/);
  if (single) return Number(single[1]) + '-' + (Number(single[1]) + 1);
  return null;
}

/* ────────────────────────────── migration ────────────────────────────── */

/* Keyed by the schemaVersion a step upgrades FROM, so `MIGRATIONS[1]` turns a version-1
   document into a version-2 one. The ladder, the walk, and the refusal to load a document it
   cannot place were all written before there was anything to climb, so that the first real
   migration would be one entry in this object rather than a refactor of the load path. WO-2.10
   is that first entry, and it is exactly one entry: nothing below it changed.

   A step receives the document, mutates or replaces it, and returns it. It must not touch
   schemaVersion — the walk below owns that. */
export const MIGRATIONS = {
  /*
    1 → 2 (WO-2.10). A `marks` cell was a bare code string — `"A"` — and is now always an object,
    `{ code: "A" }`, optionally carrying `at` (the moment a `T` or a `D` settled) and `note`.
    docs/data-model.md § "A mark cell is always an object" says why: it is the score-cell rule one
    datatype over, and a cell that is `"A"` sometimes and `{code:"T",…}` other times is the
    polymorphic-cell mistake that work order set out to avoid.

    THREE FAILURE MODES THIS STEP IS SHAPED AGAINST, because each of them turns a term of
    attendance into rubbish rather than into an error anyone would see:

      - RUNS TWICE. A cell that is already an object is left exactly as it is, so a second pass
        cannot produce `{ code: { code: "A" } }`. The walk above only runs a step when the
        document sits below SCHEMA_VERSION and openYear() writes the result back once, so this
        cannot happen through the front door — but a hand-edited document, a restore of a file
        that was itself restored, or a future step inserted below this one all can, and being
        idempotent costs one comparison.
      - RUNS HALFWAY. Every record and every cell is walked; nothing is skipped on a shape this
        step does not recognise, because "left alone" is what half-converted means. A cell that is
        neither a string nor an object is a cell no build of Planbook ever wrote, and it is
        DELETED rather than kept — a mark nobody can read is not a mark, and leaving it would put
        a shape in the document that every reader after this would have to know about.
      - NO `at` IS INVENTED. A `T` written before this work order recorded no time and it does not
        get one now: `{ code: "T" }` with no `at` is the honest record of a tardy whose moment was
        never captured, and a timestamp made up from the migration's own clock would read as the
        student having arrived the day the teacher updated the app.

    An empty string is the one string that is not a code. It could only come from a hand-edited
    file, and it means "no mark", which is what deleting the key means.
  */
  1: (doc) => {
    const list = Array.isArray(doc.attendance) ? doc.attendance : [];
    list.forEach((record) => {
      if (!record || !record.marks || typeof record.marks !== 'object') return;
      Object.keys(record.marks).forEach((studentId) => {
        const cell = record.marks[studentId];
        if (typeof cell === 'string') {
          if (cell) record.marks[studentId] = { code: cell };
          else delete record.marks[studentId];
        } else if (!cell || typeof cell !== 'object' || Array.isArray(cell) || !cell.code) {
          delete record.marks[studentId];
        }
      });
    });
    return doc;
  },
};

/* Walks a document up to SCHEMA_VERSION. Three things it refuses to do, each because the
   alternative loses data quietly:

     - A document from a NEWER build is refused, not downgraded. It contains fields this build
       has never heard of, and saving it back would drop every one of them.
     - A gap in the ladder is refused, not skipped. A document that says version 3 when this
       build only knows how to climb from 4 is not a version-4 document.
     - A document already at SCHEMA_VERSION is returned untouched, with nothing applied. */
export function migrateDocument(doc) {
  const from = doc && doc.schemaVersion;
  if (typeof from !== 'number' || !Number.isFinite(from)) {
    throw new Error('store: this document has no schemaVersion, so it cannot be placed. '
      + 'Planbook will not guess at the shape of a gradebook.');
  }
  if (from > SCHEMA_VERSION) {
    throw new Error('store: the document for ' + doc.year + ' was written by a newer version of '
      + 'Planbook (schema ' + from + ', this build reads ' + SCHEMA_VERSION + '). Update Planbook '
      + 'and open it again — loading it here would drop whatever the newer version added.');
  }

  const applied = [];
  let out = doc;
  let v = from;
  while (v < SCHEMA_VERSION) {
    const step = MIGRATIONS[v];
    if (typeof step !== 'function') {
      throw new Error('store: no migration from schema ' + v + ' to ' + (v + 1)
        + '. The document has not been changed.');
    }
    out = step(out) || out;
    v += 1;
    out.schemaVersion = v;
    applied.push((v - 1) + '→' + v);
  }
  return { doc: out, applied: applied };
}

/* ────────────────────────────── IndexedDB ────────────────────────────── */

let dbPromise = null;

function openDb() {
  return new Promise((resolve, reject) => {
    let req;
    /* indexedDB itself can throw on access — Safari in private browsing is the case that
       matters, and it is also the one a teacher hits by accident. */
    try { req = indexedDB.open(DB_NAME, DB_VERSION); } catch (e) { reject(e); return; }

    req.onupgradeneeded = () => {
      const db = req.result;
      /* One store. No index: the document loads whole and is written whole, so there is
         nothing to look up by. An index added here would be the first half of splitting the
         document, which the header comment explains at length. */
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'year' });
    };
    req.onsuccess = () => {
      const db = req.result;
      /* Another tab upgrading the database blocks on every connection that is still open.
         Closing here means the OTHER tab succeeds and this one reconnects on its next call,
         instead of both sitting there waiting for each other. */
      db.onversionchange = () => { db.close(); dbPromise = null; };
      resolve(db);
    };
    req.onerror = () => reject(req.error || new Error('IndexedDB refused to open'));
    req.onblocked = () => reject(new Error('another Planbook tab is holding the database open'));
  });
}

function connect() {
  if (!dbPromise) dbPromise = openDb().catch((e) => { dbPromise = null; throw e; });
  return dbPromise;
}

function request(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('the IndexedDB request failed'));
  });
}

async function readYear(year) {
  const db = await connect();
  return request(db.transaction(STORE, 'readonly').objectStore(STORE).get(year));
}

async function readYearKeys() {
  const db = await connect();
  const keys = await request(db.transaction(STORE, 'readonly').objectStore(STORE).getAllKeys());
  return keys.slice().sort();
}

function writeDocument(doc) {
  return connect().then((db) => new Promise((resolve, reject) => {
    let t;
    try {
      t = db.transaction(STORE, 'readwrite');
      /* put() serializes the document synchronously, right here. A DataCloneError — anything
         in the document that structured clone refuses, a function or a DOM node that got in
         by accident — throws from this line rather than arriving as an error event, which is
         why the call is inside the try and not after it. */
      t.objectStore(STORE).put(doc);
    } catch (e) { reject(e); return; }

    /* Resolve on `complete`, never on the request's own `success`. A request can succeed and
       the transaction still abort afterwards — quota, a closing connection — and showing
       "✓ Saved" for a write that was then thrown away is the one lie this chip must never
       tell. */
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error || new Error('the save transaction failed'));
    t.onabort = () => reject(t.error || new Error('the save transaction was aborted'));
  }));
}

/* ────────────────────────────── open document + save loop ────────────────────────────── */

let current = null;        /* the open year document, live in memory */
let dirty = false;         /* the in-memory document differs from what is stored */
let saving = false;
let inFlight = null;       /* the promise of the write that is running, for flush() to await */
let debounceTimer = null;
let maxWaitTimer = null;

/* The store's only outward notification. A screen re-reads getDoc() and re-renders itself;
   there is deliberately no diffing, no binding, and no framework here. */
const listeners = [];
export function subscribe(fn) {
  listeners.push(fn);
  return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); };
}
function notify() {
  listeners.forEach((fn) => {
    try { fn(current); } catch (e) { console.error('store: a subscriber threw', e); }
  });
}

/* The open document, live. Callers read it directly — it is a plain object and the whole
   design is that array operations over it are the query layer. Write only through update(),
   or the change is in memory and nowhere else. */
export function getDoc() { return current; }

export function update(mutate) {
  if (!current) throw new Error('store: no year document is open');
  mutate(current);
  schedule();
  return current;
}

function schedule() {
  dirty = true;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(save, DEBOUNCE_MS);
  if (!maxWaitTimer) maxWaitTimer = setTimeout(save, MAX_WAIT_MS);
}

function clearTimers() {
  clearTimeout(debounceTimer); debounceTimer = null;
  clearTimeout(maxWaitTimer); maxWaitTimer = null;
}

function save() {
  /* A timer that fires during a write is not dropped: the write re-checks `dirty` when it
     settles and schedules the next one itself. Clearing the timers before this guard would
     lose that edit. */
  if (saving) return inFlight;
  clearTimers();
  if (!current || !dirty) return Promise.resolve();

  saving = true;
  dirty = false;
  inFlight = writeCurrent(current);
  return inFlight;
}

async function writeCurrent(doc) {
  /* rev and updatedAt advance once per save, before the write, and are put back if the write
     never lands — otherwise memory claims a save that storage never saw, and the next sync
     compares against a rev that does not exist anywhere. A retry of a failed write is the
     SAME save and does not bump again. */
  const prevRev = doc.rev;
  const prevUpdatedAt = doc.updatedAt;
  doc.rev = prevRev + 1;
  doc.updatedAt = new Date().toISOString();

  showSaveState('saving');
  let landed = false;
  try {
    await writeDocument(doc);
    landed = true;
    showSaveState('saved');
  } catch (first) {
    /* One retry, and the chip says so. IndexedDB failures are not all permanent — a
       transaction aborted because another tab was upgrading the database succeeds a moment
       later — and a chip that goes straight to red for those trains the teacher to ignore
       red. One retry, then the truth. */
    showSaveState('retry');
    try {
      await new Promise((r) => setTimeout(r, RETRY_AFTER_MS));
      await writeDocument(doc);
      landed = true;
      showSaveState('saved');
    } catch (second) {
      doc.rev = prevRev;
      doc.updatedAt = prevUpdatedAt;
      /* The change is still in memory and still unsaved, which is what `dirty` means. It is
         NOT rescheduled: a write that fails for a permanent reason fails again in 800ms, and
         a chip flapping red every second is worse than a chip that stays red. The next edit,
         or the next flush, tries again.

         `clearTimers()` is what makes that true. Without it a timer armed BEFORE this write
         outlives the failure and restarts it: `save()` returns early at the `saving` guard
         without clearing anything, so an edit that arrived mid-write leaves `maxWaitTimer`
         running, and it fires MAX_WAIT_MS after it was set — five seconds after a permanent
         failure — into a `dirty` document that fails again. Bounded, and `rev` is put back
         both times, but it is exactly the flapping this comment says it is avoiding. */
      dirty = true;
      clearTimers();
      showSaveState('error');
      console.error('store: the year document for ' + doc.year + ' could not be saved, and the '
        + 'last change is only in memory. Storage may be full, or this may be a private '
        + 'browsing window. Cause:', second);
    }
  }

  saving = false;
  inFlight = null;
  notify();
  /* An edit that arrived while the write was in the air. Only after a write that landed —
     see the `dirty` note above for why a failed one stops here. */
  if (landed && dirty) schedule();
  return landed;
}

/* Write now, and resolve when there is nothing left to write. Never rejects: a save failure
   is reported on the chip and in the console, and a caller awaiting a flush is usually about
   to switch years or close the page, where throwing helps nobody. */
export async function flush() {
  if (inFlight) await inFlight;
  clearTimers();
  await save();
}

/*
  iOS kills a backgrounded tab whenever it wants the memory, and a debounce timer that has not
  fired yet dies with it — a period of grades the teacher already typed, gone without an error.
  So the pending write starts the instant the page stops being visible.

  Both events, because neither one covers the other on iOS: `visibilitychange` fires when the
  teacher switches apps or locks the screen, `pagehide` when the page is navigated away or put
  into the back/forward cache. Firing twice is harmless — the second call finds nothing dirty.

  Being honest about the limit: an IndexedDB write is asynchronous, and a page frozen or killed
  before the transaction completes loses it anyway. There is no synchronous storage to fall
  back on. Starting the write at the first sign of backgrounding is the most a page can do,
  which is also why the debounce above is 800ms and not 5 seconds.
*/
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flush();
});
window.addEventListener('pagehide', () => { flush(); });

/* ────────────────────────────── years ────────────────────────────── */

/* Just the year strings, read with getAllKeys rather than by loading every document. Listing
   the years a teacher can switch to should not pull three other years of rosters and grades
   into memory to do it. */
export function listYears() { return readYearKeys(); }

/* Whatever is pending belongs to the document that is about to stop being current, so it is
   written before the switch. And if it would not write, the switch does not happen: `dirty`
   still true after a flush means the last change is in memory and nowhere else, and dropping
   `current` on the floor at that point is the one way this store can lose a grade silently.
   flush() resolves through a failed write on purpose — it is called from `pagehide`, where
   throwing helps nobody — so the refusal belongs here rather than in it. */
async function leaveCurrent() {
  await flush();
  if (current && dirty) {
    throw new Error('store: the ' + current.year + ' document has a change that would not save, '
      + 'so Planbook has not switched years — switching now would throw that change away. Free '
      + 'up storage, or download a backup of this year first.');
  }
}

export async function openYear(year) {
  await leaveCurrent();

  const stored = await readYear(year);
  if (!stored) throw new Error('store: there is no document for ' + year + ' on this device.');

  const result = migrateDocument(stored);
  current = result.doc;
  dirty = false;
  setPref('openYear', current.year);

  if (result.applied.length) {
    /* Written back straight away, so a document is migrated once rather than on every open.
       That write is a save like any other and bumps rev. */
    dirty = true;
    await flush();
    console.info('store: migrated the ' + current.year + ' document (' + result.applied.join(', ') + ')');
  }

  notify();
  return current;
}

export async function createYear(year) {
  const label = normalizeYear(year);
  if (!label) throw new Error('store: "' + year + '" is not a school year. Write it as 2026-2027.');

  const existing = await readYear(label);
  if (existing) throw new Error('store: there is already a document for ' + label + ' on this device.');

  await leaveCurrent();
  current = newYearDocument(label);
  setPref('openYear', current.year);
  dirty = true;
  await flush();
  notify();
  return current;
}

/*
  Load-on-open. Which document: the one the teacher last had open, or the most recent one on
  the device, or a brand new one for the current school year if this is a first run.

  The last-open year is a `planbook_` preference and not part of any document, because it is a
  fact about this browser rather than about a student — the iPad and the laptop can sit on
  different years without either of them being wrong (src/prefs.js).
*/
export async function boot() {
  await connect();
  const years = await listYears();
  const preferred = getPref('openYear');
  const year = years.indexOf(preferred) >= 0 ? preferred : years[years.length - 1];
  if (year) await openYear(year);
  else await createYear(currentSchoolYear());
  return current;
}

/* ────────────────────────────── restore ────────────────────────────── */

/* The stored record for a year, exactly as it sits on disk — NOT migrated, NOT opened, and not
   made current. It exists for the restore confirm, which has to describe the document it is
   about to overwrite, and that document is sometimes one openYear() refuses: a year written by
   a newer build is precisely the case the boot-failure exit is for, and it still has a year, a
   date, and a roster worth counting before it is replaced. Returns undefined when there is no
   record for that year. */
export function readStoredDocument(year) { return readYear(year); }

/*
  Replace one year's document with a validated one, and open it. This is the swap, and the
  order of the lines below is the whole of WO-1.5's Traps line.

  The caller has already read the file, parsed it, walked it up the migration ladder and checked
  its shape (src/backup.js). Nothing here touches the open document until IndexedDB has said the
  new record is on disk — writeDocument() resolves on the transaction's `complete`, never on the
  request's `success` — so there is no state in which half a restore has happened. If the write
  throws, this throws, and the open document, the header, and the stored record are all exactly
  as they were.

  WHICH YEAR IS REPLACED: the one named in the file, never the one that happens to be open. A
  backup of 2025-2026 dropped in while 2026-2027 is on screen must not overwrite 2026-2027, and
  it must not be quietly re-labelled either — `year` is the record's primary key and the
  document's identity, so a renamed restore would be two years of grades in one record. It
  replaces (or creates) the record for its own year and Planbook switches to it. The confirm
  dialog says which year that is, and says so before any of this runs.

  WHAT rev BECOMES: this device's count continues rather than reverting to the file's. A backup
  at rev 12 restored over a year that had reached rev 50 here is the 51st save of that year on
  this device, and saying so is what keeps rev usable as the sync ordering key (docs/sync.md).
  rev never goes backwards for a year, so a later sync can never find itself comparing against a
  rev this document never had — and a teacher who restores an old file on purpose gets a document
  that legitimately supersedes the one in Drive, rather than one that quietly loses to it. The
  teacher's data is restored exactly as the file holds it; rev and updatedAt are save
  bookkeeping, not content.

  The save chip is left alone. A restore is not a save, the same way a year switch is not one —
  it reports in its own dialog, which is where the teacher is looking (src/save-indicator.js).
*/
export async function restoreDocument(incoming) {
  /* Whatever is pending belongs to the document that is about to stop being current, and if it
     would not write, this refuses for the same reason a year switch does. It also means a
     restore of the SAME year does not race a debounced write of the document it replaces. */
  await leaveCurrent();

  const existing = await readYear(incoming.year);
  const priorRev = Math.max(Number(existing && existing.rev) || 0, Number(incoming.rev) || 0);
  incoming.rev = priorRev + 1;
  incoming.updatedAt = new Date().toISOString();

  await writeDocument(incoming);

  current = incoming;
  dirty = false;
  setPref('openYear', current.year);
  notify();
  return current;
}

/* Said out loud on a year switch, because the only visible change is a label in the header and
   a screen-reader user has no reason to be looking at it. */
export function announceYear(verb) {
  if (current) announce(verb + ' the ' + current.year + ' school year.');
}
