/*
  The only code in Planbook that is allowed to touch localStorage.

  Two rules from CLAUDE.md meet here, and both are easy to break by accident from three
  work orders away:

    - every key is prefixed `planbook_`, and
    - localStorage holds UI preferences and nothing else. Student data lives in IndexedDB,
      one JSON document per year (docs/data-model.md). Grades, names, contacts,
      attendance, and above all accommodation / medical / plan data never come near this
      file.

  The enforcement is PREF_DEFAULTS: setPref() refuses a key that is not declared there.
  That turns "no planbook_ key holds anything but a UI preference" from a promise into
  something the code cannot violate without someone first adding the key to a list whose
  name says what belongs in it.

  Adding a preference is one line below plus a default, and the defaults-merge means an
  older device missing the key reads the default rather than undefined — the pattern is
  lifted from Roll Call!'s loadConfig() (portable-components.md §8).
*/

export const PREFIX = 'planbook_';

/* key → default value. A key absent from this map cannot be written. */
export const PREF_DEFAULTS = {
  /* Epoch ms of the last "Not now" on the install banner; 0 means never dismissed. A fact
     about this browser's chrome, not about a student — see src/install-banner.js, which owns
     how long the dismissal lasts and why. */
  installBannerDismissedAt: 0,

  /* The year label this browser had open last, e.g. "2026-2027"; '' means "no preference,
     open the most recent one". A fact about this browser and not about a student: the year
     documents themselves live in IndexedDB, and the iPad and the laptop are each allowed to
     sit on a different year without either of them being wrong. Nothing but the label is
     here — no roster, no grades, nothing from inside the document. src/store.js reads it on
     boot and writes it on a year switch. */
  openYear: '',

  /* When a backup download was last STARTED from this browser, keyed by school year:
     { "2026-2027": 1754336000000 }. An empty object means never, for any year.

     Dates and year labels and nothing else — no filename, no counts, nothing lifted out of a
     document. The year label is already here in `openYear` for the same reason: it names a
     document, it is not content from inside one. That is what makes a fact about a gradebook
     full of students legal in localStorage at all.

     WHY PER-YEAR, which it was not until 2026-08-04. It was one timestamp for the whole
     browser, and the reasoning was sound as far as it went: the backup that matters is the one
     for the device in front of you, and a file downloaded on the laptop does nothing for the
     iPad whose storage iOS will evict. But a teacher part-way through a rollover has two live
     years, and one number meant that downloading 2026-2027 marked 2027-2028 as backed up too —
     the nag went quiet for a year that had never been written to a file. A warning that
     silences itself for the year you did not save is worse than no warning, because it also
     answers the question. Per-browser survives, per-year is added underneath it.

     It is still not proof the file reached the disk. A download can be cancelled at the save
     dialog and no event tells a page so; this is "she was offered the file", and the nag is
     built to be cheap to satisfy rather than exact. Still not synced, for the reason above.

     A value written before that date is a bare number rather than a map. src/backup.js treats
     one as "no year has been backed up", which nags once too often rather than once too few —
     the only direction a data-safety default may round. */
  lastBackupAt: {},

  /* The id of the class whose tab is selected, e.g. "c_3f9a1b2c4d"; '' means "no preference, open
     the first one". An ID and never a name: a class name is teacher-typed content that belongs in
     the year document, and the whole point of this file is that nothing from inside a document
     comes near localStorage. It is a fact about this browser rather than about a student — the
     iPad can sit on Period 1 while the laptop sits on Period 5 without either being wrong, which
     is the same reason `openYear` is here. src/classes.js resolves it against the open document on
     every read, so an id that names an archived or deleted class costs nothing. */
  openClassId: '',

  /* The term selected within each class: { "c_3f9a1b2c4d": "tm_88ab01cc9f" }. An empty object
     means no preference for any class.

     WHY IT IS A MAP AND NOT ONE ID, which is the lesson `lastBackupAt` above paid for. Term ids
     are opaque and belong to one class — Period 1's second quarter and Period 5's second quarter
     are two different ids — so a single value for the browser would be wrong for every class
     except the one it was set from, and switching class would silently answer "which term" with a
     term that class does not have. Ids on both sides of the map, and nothing else.

     Entries for classes that no longer exist are left where they are: src/classes.js falls back to
     the first term the class actually has, so a stale key is inert, and a preference file that
     prunes itself is a preference file that needs to know what a class is. */
  openTermIds: {},

  /* Which of the main area's views this browser was last looking at: 'home' for the class grid,
     'class' for the open class (WO-1.13). src/views.js is the only reader and the only writer, and
     it holds the list of names this may legally be.

     STILL TWO VALUES SINCE WO-3.3 GAVE A CLASS SEVERAL SCREENS, and that is a decision rather than
     an omission: a class always opens on Attendance, so the assignment list is written down here as
     `class` and no reload can restore it. src/views.js's REMEMBERED_AS says why at length.

     A VIEW NAME AND NOT AN ELEMENT ID. The markup is allowed to be renamed; a preference holding
     `#classView` would make an id in index.html a storage format. Nor is it a class id — WHICH
     class is open is `openClassId` above, which was always the right preference and is what a
     reload resolves the class from. This one only says which of two screens was on the glass.

     A fact about this browser and this moment, like every key here: the laptop can sit on the class
     grid while the iPad sits on Period 3's registry, and neither is wrong. An unknown value — from
     an older build, or a view a later work order removed — falls back to the class grid rather than
     to a blank main area. */
  openView: 'home',

  /* Presentation mode: true while every support field in the app is suppressed — the switch a
     teacher hits before she plugs in the projector (WO-1.9).

     A FACT ABOUT THIS BROWSER AND THIS ROOM, not about a student, which is what makes it legal
     here at all: what is stored is a switch position, and a switch position says nothing about
     whether any student has a plan. The accommodations it hides never move — they stay in the year
     document in IndexedDB either way, and turning the switch back reveals exactly what was there.
     It is also right for it to differ per device: the laptop wired to the projector can be in
     presentation mode while the iPad in the teacher's hand is not, and neither is wrong. Same
     reasoning as `openYear` and `openClassId` above.

     WHY IT IS PERSISTED AT ALL, since "discreet by default is not a preference setting" is the
     rule the roster's own reveal state obeys by NOT being stored (src/roster.js's supportsShown).
     The two are opposite questions. The reveal state remembers that support data was on screen,
     and a remembered `true` would put a student's plan on the wall the morning after one afternoon
     it was left open. This remembers that support data is HIDDEN, and forgetting it is the failure:
     a teacher who turned it on before first period must not find it off after lunch. Persistence
     rounds toward less disclosure here and toward less disclosure there; that is the same rule
     twice, not two rules.

     src/supports.js is the only reader — its one visibility switch is where this becomes an
     answer — and src/presentation.js owns the header control that writes it. */
  presentationMode: false,

  /* Alert sounds: true while an overdue hall pass may make a noise (WO-2.29). Default ON, which is
     the only defensible default for a safety alert — a teacher who never finds this control still
     gets told that a student has been gone ten minutes.

     A FACT ABOUT THIS BROWSER AND THIS ROOM, exactly as `presentationMode` above is, and legal here
     for the same reason: what is stored is a switch position, and a switch position says nothing
     about any student. Nothing about a pass, a name or a time comes near it.

     WHY IT IS NOT A FIELD IN THE YEAR DOCUMENT, which is the other place it could have gone and the
     one src/past-due.js's `pastDueDismissed` argues against at length. The document syncs and is
     restored from backup: a teacher who silenced her iPad to proctor a test would have silenced the
     laptop too, and a restore would carry the silence along with the grades. It is also right for it
     to differ per device — the iPad in her hand is the one that has to make a noise, and the laptop
     wired to the projector may well be the one that must not.

     PERSISTED, AND THAT ROUNDS THE UNSAFE WAY ON PURPOSE. A remembered `false` means an alert that
     stays silent after the test is over, which is the failure mode; forgetting it would mean the
     sound coming back on its own mid-period, which is the other one. The muted speaker in the
     header is what pays for the choice — the state is on the glass rather than in a settings screen
     nobody opens. src/alert-sound.js is the only reader and owns the control that writes it. */
  soundsOn: true,

  /* Which assignments this browser has answered "Not now" to on the past-due prompt (WO-3.6):
     { "a_3f9a1b2c4d": true }. An empty object means it has never been dismissed for anything.

     SINCE WO-3.19 IT SILENCES TWO THINGS RATHER THAN ONE. The score grid's overdue column head is
     drawn from the same computed set as the banner, so a dismissal takes the amber off that head on
     the next render as well as taking the banner down — they are one signal at two volumes, and an
     amber head with no banner to explain it is the worse half to leave up. The assignment list's own
     amber date is a different comparison over a different set and stays; src/past-due.js's
     pastDueAsksAbout() carries the long version. Nothing about that changes what is STORED here,
     which is still an assignment id and `true`.

     AN ASSIGNMENT ID ON ONE SIDE AND `true` ON THE OTHER, and nothing from inside a document on
     either — no name, no due date, no student, no score. That is what makes a fact about a
     gradebook full of students legal in localStorage at all, and it is the same shape `openClassId`
     takes for the same reason: an ID and never a name, because a name is teacher-typed content that
     belongs in the year document.

     WHY IT IS A PREFERENCE AND NOT A FIELD IN THE YEAR DOCUMENT, which was the other candidate and
     is the question src/past-due.js's decision 4 answers at length. The document syncs and is
     restored from backup, so a field there is a schema change docs/data-model.md would have to
     carry — for a banner — and a restore would then resurrect or destroy dismissals along with the
     grades. What is stored here is which nudge this browser has waved off, which is a fact about
     this browser's chrome in exactly the way `installBannerDismissedAt` above is.

     THE ACCEPTED COST: dismiss on the laptop and the iPad still asks once. For a prompt whose whole
     job is to ask, that is the right way round — accepting on either device writes the same cells.

     Entries for assignments that no longer exist are left where they are, exactly as `openTermIds`
     leaves a stale class key: src/past-due.js resolves this against the open document on every
     read, so a dead id is inert, and a preference file that prunes itself is a preference file that
     has to know what an assignment is. */
  pastDueDismissed: {},
};

/* Reads never throw: Safari in private mode can make localStorage itself throw on access,
   and a missing preference must degrade to the default rather than take the app down. */
export function getPref(key) {
  if (!(key in PREF_DEFAULTS)) return undefined;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? PREF_DEFAULTS[key] : JSON.parse(raw);
  } catch (e) {
    return PREF_DEFAULTS[key];
  }
}

export function setPref(key, value) {
  if (!(key in PREF_DEFAULTS)) {
    /* Loud on purpose. The likely cause is someone reaching for localStorage to stash
       something that belongs in the year document. */
    console.error('prefs: refusing to write "' + key + '" — not a declared UI preference.');
    return false;
  }
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}
