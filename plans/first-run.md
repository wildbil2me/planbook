# First run: a landing page, then two ways in

**Design thread — [`design-threads.md`](design-threads.md). Status: drawn** (2026-10-13, in
[`design/mockups/first-run-flow.html`](../design/mockups/first-run-flow.html)) — **waiting on the
owner's answers to the ten questions below.** Started 2026-10-12.

**Ruled by the owner, 2026-10-13, before drawing:**
1. **The A/B question is a rework of the home screen's empty state**, not a new screen — so B stays
   behind `untouchedYear()`.
2. **`about.html` is shortened** so the door keeps lifting its words; WO-8.16's no-retyping ruling stands.
3. **On a laptop the install banner is shortened**, not removed.

The stale-sync launch prompt below is out of first-run's scope and belongs to Phase 7; it is not drawn.

## Open questions — the drawing's, collected here

Each is marked in amber where it is drawn. Answers are recorded here, dated, in place.

1. **`about.html`'s *Installing it* section** — kept there, unlifted by the door? Proposed: yes.
2. **The landing button's word** — *Get started* (drawn) or *Open Planbook*, `about.html`'s own.
3. **The installed app's first launch skips ① and ②**, as today. Proposed: yes.
4. **Both choices primary** (drawn), or A primary and B outlined.
5. **The header on an empty year** — unchanged (drawn), or quieter until the first class.
6. **No "name the year" step** — `boot()` has named it. Proposed: dropped.
7. **Path A guided** (drawn — a step strip, each step handing to the next) **or just doors.**
8. **Drive while Google reviews** — disabled with a reason (drawn), or absent.
9. **The laptop banner's colour** — amber (drawn), or a quieter colour.
10. **Students by file or by paste first** — drawn file first; paste first is safer for a stranger,
    because the importer reads only the Blackbaud contact export.

The owner looked at the deployed app as a stranger and found it **wordy and uninviting**. This file
holds the direction the conversation reached so it survives until there is a sitting to draw it. It
is not a work order and books nothing: the next step is a mockup under `design/mockups/` (per
`PROTOCOL.md`), the owner's ruling on it, and then M/S work orders — probably folded into or cut
ahead of [WO-8.6](work-orders/phase-8-packaging.md#wo-86--onboarding).

## What a stranger meets today

1. **The front door** (WO-8.16) — the about.html lede, then a device-picked panel whose main content
   is install instructions, and a *Use it in this browser* button.
2. **The home screen** — the amber install banner (a long iPad-Safari warning, shown even on a
   laptop, immediately after the visitor chose the browser), then *No classes yet*, *Add your first
   class*, and under a hairline the WO-7.9 doors: *Open from Google Drive* and *Restore a backup
   file*.

Three screens' worth of warnings and doubts, and one line about what the app does.

## The direction

**An empty device asks one question, not three.** A returning teacher on a device that has their
year never sees any of this — the app opens straight onto their classes. So anyone who reaches setup
is on an empty device, and the only question is whether they are starting fresh or bringing a year
that lives somewhere else. "Returning user" and "returning user, new device" were the same path.

```
Landing page          the pitch and one button — no install steps
   │
   ▼  (iPad only) install first — see "The Safari trap"
   │
Nothing is stored in this browser yet.
Planbook keeps everything on the device you use it on.
   ├─ A  I'm new to Planbook        → the new-user experience (WO-8.6's first-run flow)
   └─ B  I already use Planbook     → the import walkthrough
```

- **Landing page.** The lede, three or four lines of what it does, the privacy promise in a
  sentence, **Get started**. Install instructions are what make the current door read like a manual.
- **The headline is neutral on purpose.** *"Your data has not been loaded in this browser"* was
  considered and set aside: it assumes the reader has data, and most readers here do not — to a
  stranger it reads as an error. The second line carries the one idea the install and backup
  warnings later spend paragraphs on, at the moment it explains the screen.
- **A — new.** Name the year, add the first class, paste the roster, mark attendance.
- **B — the import walkthrough**, three short steps:
  1. *Where is your year?* On another device that syncs to Drive, or in a backup file.
  2. *Get it.* Sign in and pick it, or choose the file.
  3. *Confirm what is in it* — classes, student count, last changed — *Open it here?* — then the home
     screen with their own classes.

## Things that are already true and constrain it

- **The Drive door does not work for strangers yet.** While the OAuth client is in Testing only
  listed test users can sign in. Until Google verifies the app, B leads with the backup file.
- **The Safari trap.** On an iPad, Safari and the home-screen app keep separate storage, so a teacher
  who tried Planbook in Safari and then installed it opens the icon to an empty app with their year
  stranded in Safari. Installing *before* setup on iPad avoids creating the stranded year; B also
  carries a line for the teacher who already has one: open it in Safari, download a backup, restore
  it here. *(Believed not to happen on laptop Chrome/Edge, where tab and installed window share
  storage — verify before relying on it.)*
- **Nothing can be fetched from Drive at launch without a tap** (WO-7.10: Google has no silent
  sign-in in a browser). So "up-to-date data loads automatically" is not buildable. What is: on an
  opted-in device whose copy is stale, a launch prompt — *Last synced 3 days ago on this iPad.
  [Sync now]* — one tap, inside the gesture Safari needs. The header's sync button already reads
  freshness (WO-7.5). **Open question: what counts as stale.** Too eager and it shows every launch
  and gets dismissed by reflex.

## What it would undo

- **WO-8.16's ruling that the door's words are lifted from `about.html`**, never retyped. A shorter
  pitch means `about.html` gets shorter too, or the door gets its own words — which that ruling
  forbids. Decide which before drawing.
- **The WO-7.9 doors under the home screen's empty state** move into B, leaving the empty state
  with *Add your first class* alone.

## Later: a CSV import for any school system — a suggestion, not booked

*(2026-10-13, the owner: "leave it as a suggestion for later", and then: draw first run around what
ships today and keep the import discussion for future work. So the drawing's path A offers the two
doors that exist — the Blackbaud contact import and the paste — and nothing below is drawn.)*

**The problem, as the owner put it:** a new teacher is slowed by having to reformat an export, and
exports are not standard — even this school's file carries a column the owner added by hand (the
counselor's email), so a colleague's untouched Blackbaud export is refused today. Formats will be
added as they become known; the question is how that touches first run. The direction reached:

- **Split by when, not by simple / advanced.** First run needs **names** — attendance needs nothing
  else — so its student step should be one that cannot fail on a format: paste, or **any CSV with
  one question, "which column has the names?"** (or first + last). **Contacts come later, from the
  roster**, because nothing needs them until the first note goes home.
- **Contact formats are recognised, never picked from a list.** A teacher does not know what her
  file's layout is called. Planbook matches the file against known layouts (Blackbaud today); on no
  match it says which exports it can read, says her students are already in, and offers hand entry.
  The list appears only as that explanation. Each new format is one more recogniser, and the first-run
  path never changes.
- **Order already works**: the importer recognises names already in the year, so names on day one
  and contacts a week later fill the same students.
- **One shortcut**: a file chosen in first run that *is* a known layout offers *"This file has
  contacts too — import them now?"*, so a Blackbaud school still does it in one pass.
- **The counselor-email column**: the cheaper fix is asking for each counselor's email once after
  import and filling it by counselor name, which would let the importer accept Blackbaud's export as
  it comes. Open: which column was hand-added, and whether the export is a list each teacher builds
  (so there may be no "stock" Blackbaud layout at all).

The mapping-wizard thinking below came first and still stands for systems that are not recognised:

Path A's student step offers the
school system's contact-list CSV, and today that importer (`src/roster-import.js`, WO-1.23) reads
**one layout: Blackbaud's** per-class contact export — eight columns at fixed positions, no header,
extra guardians on continuation rows. Any other system's file is refused or misread, so for another
teacher the CSV door does not exist yet. The shape worked out in conversation:

- **An import wizard, not a conversion wizard.** Recognise a known layout and go straight to the
  shipped review; otherwise one mapping step — each column's header, two sample values, a dropdown
  (student name / first / last, student email and phone, counselor, guardian 1–2 name / phone /
  email, **ignore**) — then the shipped review. A converter that hands back a reshaped file costs a
  download and a re-upload for the same result.
- **Two guardian layouts**: Blackbaud's continuation rows, and the side-by-side *Parent 1 / Parent 2*
  columns many systems use. The mapping step has to ask which. The hardest part.
- **No support field is ever a mapping target** — the dropdown is a whitelist, as the merge fields
  are, and every unknown column defaults to *ignore*. A column called *Notes* or *Alerts* can never
  reach `supports`.
- **The mapping is remembered** as a `planbook_` preference keyed by the header row — a column layout
  is not student data — so the same export goes straight to review next year.
- **`.xlsx`**: start by saying "save it as CSV"; an Excel reader is a separate decision.
- **Get real files first.** Two or three exports from other systems (PowerSchool, Infinite Campus),
  names invented, or their documented column lists — designing the guesses from one school's file is
  guessing. Likely two or three M/S rows when booked.

## Fix regardless

The **install banner** should not fire on the first launch after the visitor chose the browser at
the door, and should not use iPad wording on a laptop. Small, separable, and worth booking on its
own whatever is decided above.
