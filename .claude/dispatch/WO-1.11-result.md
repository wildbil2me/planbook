# WO-1.11 — Back up every year in one tap · implementation report

**Implementer** Claude (work-order-implementer) · **Branch** `phase/1-shell-store-roster`
**Verification** `node tools/verify-shell.mjs` → **224 checks · 224 passed · 0 failed · 0 skipped**
(72s). `node tools/wo-sweep.mjs` → **11 checks · 10 passed · 0 failed · 1 to review** (the standing
`sensitive field names outside src/backup.js` REVIEW, unchanged by this work order — nothing added
here mentions a support field outside `src/backup.js`).

**Revised 2026-08-05 after a FAIL from the work-order verifier on Acceptance line 2.** One defect,
one fix, one fixture that reproduces it; the correction round is written up in its own section
below, and Acceptance line 2 has been rewritten around the new evidence rather than the old claim.
Nothing else was touched — restore, the rest of `src/backup.js`, and the other four acceptance lines
are exactly as they were verified.

Nothing in `plans/`, `CHANGELOG.md` or `TESTING.md` was touched. No box was ticked. No commit.

---

## Files changed

| File | What changed |
|---|---|
| `c:\dev\planbook\src\backup.js` | `downloadAllBackups()`, `documentForBackup()`, `handToBrowser()` and `fileFor()` split out of the existing download; `refreshYearCoverage()` + `refreshBackupAllControl()`; `yearsNeverBackedUp()` and `refreshOtherYearsLine()` now take the year list instead of reading it; the never-downloaded line's second sentence now names the new control — **and, in the correction round, only ever builds that sentence when there is more than one year** |
| `c:\dev\planbook\index.html` | `#backupDownloadAllBtn` (hidden, `data-backup-download-all`) inside `.backup-actions`; `#backupAllNote`; a WO-1.11 paragraph in the file header comment |
| `c:\dev\planbook\src\shell.js` | routes `data-backup-download-all`; the hook is documented in the hook list at the top |
| `c:\dev\planbook\src\shell.css` | `.modal-body .backup-all-note`, plus its `@media (pointer: coarse)` size bump in the same pass |
| `c:\dev\planbook\sw.js` | `CACHE` `planbook-shell-v12` → `v13` (see decisions) |
| `c:\dev\planbook\tools\verify-shell.mjs` | **+575 lines, 0 removed** — 15 new checks (13 in the first pass, 2 in the correction round). No existing check, fixture or assertion was edited |
| `c:\dev\planbook\tools\README.md` | check count 201 → 222 → 224 with the WO-1.11 share named; a ninth CDP trap, found while writing these checks |

---

## The architectural decision the work order asked for first

**Taken as steered: one file per year, downloaded in sequence.** Restore is untouched — no new
top-level shape, no new meaning for "replace", every file is a file `parseBackup()` already read
before this work order existed. The reasoning is written into `src/backup.js` at the head of the new
section, including why the array-of-year-documents variant was not built.

Four sub-decisions the work order left open, all made deliberately and all recorded in the file:

1. **Which document each year's file is built from.** The **open** year comes from `getDoc()`, every
   other year from `readStoredDocument()`. `flush()` resolves even when the write failed
   (`src/store.js`), so the record on disk can be one edit behind the screen — the open year's file
   has to carry what the teacher typed. `openYear()` is never called: taking a backup must not move
   the teacher off the class she was looking at.
2. **What an off-version stored record produces.** The text that would be written is passed through
   **`parseBackup()` — the reader on the other side of the round trip — before it is handed to the
   browser.** Whatever a restore would refuse, this refuses to write. That is what makes Acceptance
   line 4 true by construction rather than by inspection. Consequence, stated plainly: a year written
   by a *newer* Planbook (the only off-version case that can exist today, since `MIGRATIONS` is empty
   and `SCHEMA_VERSION` is 1) gets **no file, no stamp, and a sentence on screen naming it and saying
   what to do**. The alternative — writing a file the teacher's own app refuses to read — would have
   answered the nag without being a way back. The one-file button still does *not* validate, so the
   open year remains downloadable on its own even in that state.
3. **Older-schema records are written as they sit, not migrated on the way out.** `parseBackup()`
   walks the ladder on the way *in* and the confirm says it did; a copy rewritten by a migration the
   teacher never saw run is a copy whose original no longer exists anywhere. Today this is
   unobservable (the two are the same bytes); it starts to matter at the first real migration.
4. **Order and pacing.** `listYears()` order — chronological, the same order the year picker uses and
   the order the files sort in Files. 400ms between hand-offs (`BETWEEN_FILES_MS`), through the
   *existing* `<a download>` + blob mechanism, one `<a>` and one object URL per file, each URL keeping
   its own 60-second reprieve so a later file cannot revoke an earlier file's blob out from under a
   save sheet. No second download path was invented.

---

## Against the Acceptance list, one by one

### 1. With two years on the device, one tap produces a readable backup of both — **verified on Edge/Chromium; not on an iPad**

Driven with **three** years on the device by clicking the real control, and the evidence deliberately
does not come through the page: the files are read back **off disk** out of the throwaway profile's
download directory, `JSON.parse`d in Node, and matched against the years on the device.

```
PASS | one tap writes a readable backup of every year on the device, one file each
  :: 3 file(s) landed for 3 year(s) on the device: Planbook 2019-2020 backup 2026-08-05.json,
     Planbook 2026-2027 backup 2026-08-05.json, Planbook 2030-2031 backup 2026-08-05.json
PASS | and the years it never opened arrive with their own rosters, support data included
  :: Planbook 2026-2027 backup 2026-08-05.json carries the medical field ·
     2019-2020 (2 students, docId d_from_an_ol), 2030-2031 (0 students, docId f0dbf456-a81)
PASS | the status names every file it handed over, and says a page cannot know one arrived
```

Each file is asserted to be a whole year document (`classes`/`students` arrays, `scores` a map,
`schemaVersion` 1), to carry the year in its name, and — for the years the loop never opened — to have
its **own** `docId` and its own roster, which is what separates a real per-year read from a loop that
wrote three copies of the open document.

**Browser:** headless Edge/Chrome over CDP on Windows 11, `--remote-debugging-port=0`, downloads
redirected into the throwaway profile. **This says nothing about iPadOS.** Chrome accepts a dozen
programmatic downloads in a row; Safari is the platform in question and I cannot drive it.

### 2. The control is absent with only one year, and no teacher who never rolls over ever sees it — **verified, after a correction round; the first pass failed this line and the failure is described below**

**What the verifier found, and it was right.** The button was absent with one year — but the panel's
never-downloaded strip could still *name* it, by label, as though it were on the screen. On the
boot-failure recovery screen (`getDoc()` is `null`) with exactly one year on the device and that year
never downloaded, the strip read:

> This backs up the year you have open. 2026-2027 is also on this device and has never been
> downloaded — “Back up all 1 year” writes it out too.

Naming a hidden control, under the one label `refreshBackupAllControl()` is written specifically
never to produce. My first pass asserted the invariant that makes that impossible — "this line is
only ever shown when there is more than one year, so the control it names is always on screen beside
it" — in a comment, and left the code's actual hiding test dependent only on whether some year was
un-downloaded. Two conditions, one enforced and one assumed.

**The fix** (`src/backup.js`, `refreshOtherYearsLine()`): the year count is now a condition of
building `pending` at all, so the line and the control it names appear and disappear together.

```js
  const pending = years.length > 1
    ? yearsNeverBackedUp(years).filter((y) => !doc || y !== doc.year)
    : [];
```

**The `!doc ||` filter was deliberately left alone**, and the reasoning is written into the file
above the function. It looks like the culprit — it is what keeps the lone year in the list instead of
excluding it as "the year you have open" — but it is also the only reason this line works on the
boot-failure screen at all: with several years on the device and none of them open, every
un-downloaded year is one to name, the control *is* on screen, and the advice is good. Requiring an
open document would have taken the line away from the case it earns its keep in, to fix a case that
is really about there being no other year to compare against. Gating on the count is sufficient on
its own: with one year and a document open, `pending` was already empty.

**What the one-year boot-failure screen now says about coverage: nothing**, and I think that is the
honest answer rather than a gap — the one-file button is disabled because nothing is open, the
multi-year control is hidden because there is one year, and a document this build refuses to open is
one `downloadAllBackups()` refuses to write. There is no action for a sentence to point at. Said
that way in the comment so the next reader does not "restore" the sentence.

**The fixture that would have caught it**, `tools/verify-shell.mjs`, at the end of the boot-failure
block. The verifier's diagnosis of the fixture gap was exact: the three conditions were each already
in the run and never co-occurred. So the check builds the state instead of waiting for it — the other
year records are lifted out whole and put aside, every stamp is cleared, the survivor is poisoned to
`schemaVersion` 99, the page is reloaded into the failure screen, and the panel is opened from that
screen. Held for 40 samples over a second, per trap 5, because `refreshYearCoverage()` re-reads
IndexedDB without the panel waiting for it.

```
PASS | with one un-downloaded year and no year open, nothing names a control that is not there
  :: years on the device = ["2026-2027"], nothing open = true, stamped = false; the multi-year
     control stayed hidden across 40 samples over 1s (0 sightings); the panel said "Back up all …"
     nowhere; the never-downloaded strip was hidden
PASS | and that fixture puts every year back, so the sections below inherit nothing
  :: booted = true, years = ["2019-2020","2026-2027","2030-2031"] (took 3 away), open = 2026-2027
     at schema 1, stamps back = true
```

**It is not a vacuous pass, and I measured that rather than argued it.** With the one-line gate
reverted and everything else identical, the same run reports:

```
FAIL | with one un-downloaded year and no year open, nothing names a control that is not there
  :: … the panel said "Back up all …" in "Back up all 1 year"; the never-downloaded strip was shown:
     "This backs up the year you have open. 2026-2027 is also on this device and has never been
     downloaded — “Back up all 1 year” writes it out too."
```

224 checks · 223 passed · **1 failed** on the reverted tree; 224 · 224 · 0 with the fix. The
assertion is on the words "Back up all" never appearing anywhere in the panel, which the markup's own
fallback label ("Back up every year") leaves free to mean exactly that — so it catches the sentence
whether the strip hides itself or is reworded later.

**The existing check on that line still passes unedited.** `and the panel goes back to naming that
year as never downloaded` runs with three years on the device and still requires both the year name
and `Back up all` in the text; nothing about the multi-year case changed.

---

The original evidence for this line, which still stands:

Measured at the **only moment in the run when the device holds exactly one school year** (the store
section, before the year-switch checks create the second and third), which is why that check lives
300 lines above the backup section. Asserted as a state that *holds* — 40 samples over a second —
because `openBackupPanel()` deliberately does not await the IndexedDB read that reveals the control,
so a single "hidden right now" sample cannot tell a correct absence from a refresh that has not
landed.

```
PASS | with one year on the device, nothing offers to back up every year
  :: one year on the device; the control and its note are in the markup = true, hook present = true,
     and both stayed hidden across 40 samples over 1s (0 sightings)
PASS | with several years on the device the control appears, and its label says how many it covers
  :: label = "Back up all 3 years", note = "That writes 3 separate files, one school year each,
     and every one of them restores on its own. Your iPad may ask about each file."
```

Both halves are in the suite on purpose: a control that is never shown passes the first alone, and one
that is always shown passes the second alone. The panel copy carries the count in the **label** as
well as the prose, which is the deliverable's "says how many years it covers".

### 3. Each year written gets its own stamp; the nag is down for both afterwards — **verified**

The stamp map is cleared to `{}` first, so this is measured from nothing rather than from what earlier
checks left behind, and the nag is confirmed **up** beforehand for every year that has anything to lose
(a year with nothing typed into it never nags, by design — the fixture distinguishes them).

```
PASS | before the tap: no year is stamped, and every year holding anything is nagging
  :: 2019-2020 (has data) nag=true, 2026-2027 (has data) nag=true, 2030-2031 (empty) nag=false
PASS | each year written gets its own lastBackupAt stamp, and every stamp is fresh
  :: planbook_lastBackupAt = {"2019-2020":…317,"2026-2027":…721,"2030-2031":…124}
PASS | the nag is down for every year afterwards, not only for the one on screen
  :: 2019-2020 nag=false, 2026-2027 nag=false, 2030-2031 nag=false;
     the never-downloaded line is hidden = true
```

The nag is asked **year by year** (each year opened in turn, `refreshBackupNag()` called, the strip
read), because the strip is a fact about the open document and asking it once would only have proved it
about one year. `recordBackupFor()` is unchanged and is called once per year, immediately **after** the
hand-off — never ahead of it, never in a batch.

**The Traps line has its own fixture, and it is the one I would look at first:**

```
PASS | a year Planbook cannot read is not written, is NOT stamped, and is named on screen
  :: 2019-2020 had 1 file(s) on disk before this tap and 0 written by it; this tap wrote 2 file(s)
     for 2026-2027, 2030-2031; stamps = {"2026-2027":…,"2030-2031":…};
     status = "Saved 2 of 3 school years: … 2019-2020 was not written: the document for 2019-2020
     was written by a newer version of Planbook (schema 99, this build reads 1…"
PASS | and the panel goes back to naming that year as never downloaded
  :: "This backs up the year you have open. 2019-2020 is also on this device and has never been
     downloaded — “Back up all 3 years” writes it out too."
```

One year is poisoned in storage exactly the way a newer build would leave it, its stamp cleared, and
the run repeated. Afterwards: its file on disk is **untouched**, it has **no stamp**, the status is
error-toned and says "Saved 2 of 3", names the year, gives the reason, and says the year is still
marked as never backed up. The record is then put back byte for byte and that repair is itself
asserted, so nothing below inherits a poisoned year.

### 4. Restore still accepts every file this produces, and the WO-1.5 refusal checks still pass unchanged — **verified**

```
PASS | restore accepts every file this produces — each one reaches the confirm by name
  :: 2019-2020: accepted=true confirm="Replace 2019-2020" |
     2026-2027: accepted=true confirm="Replace 2026-2027" |
     2030-2031: accepted=true confirm="Replace 2030-2031"
```

Every file the control wrote is read back off disk and fed through the **real** restore path
(`restoreFromText`), and each has to reach the confirm with the right year named on the Replace button;
each is then cancelled, because this line is about what restore *accepts*, and the swap has its own
checks. **The restore validation path was not modified in any way** — `parseBackup`,
`openRestoreConfirm` and `restoreDocument` are byte-identical.

`confirmRestore()` is **not** byte-identical, and the first version of this report overstated that;
the correction is the wording, not the substance. Exactly one hunk touches it (`git diff -U0 --
src/backup.js` shows a single hunk in the whole restore region, at old line 441): the post-restore
refresh call `refreshOtherYearsLine()` became `refreshYearCoverage()`, plus the comment above it,
because a restore that adds the second year on a device brings the new control onto the screen for
the first time. Nothing in the parse, the refusal, the confirm, or the swap changed.

**"Unchanged" is literal, and checkable:** `git diff --numstat -- tools/verify-shell.mjs` is
`575  0` — 575 lines added, **zero removed**. No refusal fixture, message regex, or expectation was
edited to make anything pass. All six refusals still pass, with their original messages:

```
PASS | every malformed or non-Planbook file is refused, with a message, and never reaches the confirm
PASS | and each refusal says what was actually wrong with that file, not one generic message
PASS | a refused file changes nothing — no partial apply, not even a rev
```

### 5. 👤 On an installed iPad: every file lands in Files, and the run is not silently truncated — **NOT CLOSED, and I cannot close it**

This needs a real installed PWA on real iPadOS hardware. Nothing in this run touches it: no service
worker was involved, no home-screen launch, no Files app, no thumb. I am explicitly **not** inferring it
from Chrome — Chrome accepted three downloads from one gesture and that is exactly the behavior iPadOS
is suspected of not having.

What I built for the failure the Traps line names, so that the human test has something to fail
*against* rather than something to discover:

- **Nothing is stamped that was not handed over.** Per-year, after the hand-off, never before.
- **A year that could not be read is named on screen with a reason**, the run reports "Saved 2 of 3",
  and the never-downloaded line comes back for that year.
- **The honest limit is on screen, not just in a comment.** The success message names *every file* it
  handed over and says: "Check that every one of them arrived: a page is never told whether a download
  finished." That sentence is there because the one failure mode I **cannot** detect is Safari silently
  dropping the second and third `<a download>` click: no event tells a page a download landed
  (`PREF_DEFAULTS.lastBackupAt` already says this about the one-file button). So a stamp on a file iOS
  quietly dropped remains possible, and the file names in the message are what let the teacher catch it.
- **400ms between hand-offs**, which is the only lever a page has on that behavior. A mitigation, not a
  fix.

**Honest statement of what is still unknown after my work:** if iPadOS turns out to drop later
downloads in a burst, `planbook_lastBackupAt` will have been stamped for years whose files never
arrived, and the only thing standing between the teacher and a false clear is that sentence in the
status. That is the residual this acceptance line exists to settle. See the proposed follow-up below —
I did not build the fix for it, because the fix depends on what the iPad actually does and because it
would be a third control.

---

## Decisions I made that the work order did not settle

1. **`sw.js` `CACHE` bumped v12 → v13.** `sw.js` says "Bump on every deploy that changes any file in
   SHELL", and this changes four of them (`index.html`, `src/backup.js`, `src/shell.js`,
   `src/shell.css`). WO-1.10 is now committed at v12, so leaving v12 risks an installed PWA never
   fetching the new `backup.js`. No SHELL entries were added — no new files exist.
2. **The never-downloaded line's second sentence was reconciled**, as the brief permits: it used to
   say "switch to it from the year button to back it up too", which is now wrong advice, and it now
   names the control instead. What the line *asks about* is untouched, `refreshBackupNag()` is
   untouched, and the strip is still a per-year strip. The existing check on that line still passes
   unedited (it requires "year you have open" and the year name, both of which survive).
3. **`refreshOtherYearsLine()` and `yearsNeverBackedUp()` now take the year list** instead of each
   reading it, because the panel asks two questions of the same list and two reads is how two answers
   on one screen drift apart. Behavior on a store that refuses to list years is identical to before:
   both stay hidden.
4. **The control is hidden, not disabled-and-relabelled**, when there is one year — and it is *not*
   re-hidden on reopen, which would blink it off and on. "Back up all 1 years" is not a thing to show
   anybody, and the whole point is that a teacher who never rolls over never meets it.
5. **A re-entrancy guard plus a disabled button** during the run. Two concurrent runs would hand over
   two copies of every file and stamp twice.
6. **The control stays available on the boot-failure screen** (where the one-file button is disabled
   because nothing is open). Backing up the readable years while one year is unreadable is exactly the
   situation that wants it, and the unreadable one is named as skipped.
7. **`tools/README.md`: a ninth CDP trap.** My own first version of the truncation check diffed
   download *names* and went red on a correct build the second time the loop ran, because a second run
   writes the same names. The fix (new name **or** moved mtime, and keep the assertion on the file the
   app decided about) is now written down where the next agent will find it, with the trap-8 reasoning
   about not narrowing an assertion to route around the environment.

---

## Proposed follow-ups (named, not done)

1. **If the iPad truncates: making the stamp provable.** The only truthful fix is a confirmation step
   — the panel listing the files it handed over and the teacher confirming they arrived before anything
   is stamped. That is a third control and a second gesture, it contradicts the "she was offered the
   file" semantic the one-file button already ships, and it is only worth building if Acceptance 5
   comes back bad. It wants its own work order and its own acceptance lines. **Declined here.**
2. **The array-of-year-documents artifact** is not implemented and should not be implemented quietly:
   the work order says it wants its own acceptance lines. Nothing in this change makes it harder to add
   later.
3. **Horizontal overflow of an open modal at 390px is still unmeasured.** The overflow sweep measures
   the page at three widths, not open panels. The new button is 134px inside a `flex-wrap: wrap` row
   whose longest existing button ("Download 2026-2027 backup", ~200px) already fit, so I believe there
   is no new risk — but I verified that by reasoning, not by measurement, and a check that opens the
   panels inside the overflow sweep would settle it for every modal at once.

## Temptations declined, for the record

- Migrating older-schema records on the way out (tidier, one shape) — rejected in favour of copying
  the stored bytes; reasoning is in `documentForBackup()`.
- Widening restore to understand several years — out of scope and out of bounds; restore is unmodified.
- Zipping the files, Drive, scheduled backups, restoring one class out of a file — all out of scope.
- "Tidying" the two backup buttons into one control with a mode — the one-file button stays primary
  because the year she is teaching wants to be backed up first and fastest.

---

## The correction round (2026-08-05)

**Scope, held deliberately narrow.** One defect, named by the verifier against Acceptance line 2. The
change is three lines of code, a comment block that records why, and two checks. Restore is untouched;
`refreshBackupAllControl()`'s own visibility logic is untouched; no existing check, fixture, assertion
or expectation was edited. `sw.js` stays at `v13`, which already covers this file.

**Files changed in this round:** `c:\dev\planbook\src\backup.js`,
`c:\dev\planbook\tools\verify-shell.mjs`, `c:\dev\planbook\tools\README.md` (check count only),
`c:\dev\planbook\.claude\dispatch\WO-1.11-result.md`.

**The decision the correction round had to make**, since the work order did not settle it: whether to
hide the strip in the one-year case or keep it with the control-naming clause dropped. **Hidden.** The
sentence is built out of "*also* on this device" and "N *other* years", and with one year on the
device neither word is true whatever `getDoc()` returns — dropping only the trailing clause would have
left a line that is grammatically about a comparison it cannot make. Hiding also makes the invariant
the comment claims true in code, which is the actual defect. The cost is stated above and in the file:
the one-year boot-failure screen now says nothing about backup coverage.

**Noted, not acted on, because it is out of this round's scope and was not what the verifier flagged.**
On the *multi-year* boot-failure screen the strip's first sentence still reads "This backs up the year
you have open" when no year is open — pre-existing since 2026-08-04, unchanged by WO-1.11 or by this
fix, and the check on that line asserts that wording. It is one sentence of panel copy and it wants
someone to decide what the strip should say when there is nothing open, rather than an implementer
deciding it inside a correction round.

---

## The second correction round (2026-08-05) — the iPad refused the architecture

**This round is not a bug fix.** The first correction round fixed panel copy. This one replaces the
delivery mechanism, after the control failed on the hardware it was built for.

**Verification** `node tools/verify-shell.mjs` → **224 checks · 224 passed · 0 failed · 0 skipped**
(70s), run four times: twice clean, once with a deliberate defect injected, once clean at the end.
`node tools/wo-sweep.mjs` → **11 checks · 10 passed · 0 failed · 1 to review** — the standing
`sensitive field names outside src/backup.js` REVIEW, unchanged, and `src/zip.js` is *not* among the
files it lists.

Nothing in `plans/`, `CHANGELOG.md` or `TESTING.md` was touched. No box was ticked. No commit.

**Note on process:** the machine crashed mid-session with the code complete and this section
unwritten. Everything below was re-verified from the tree afterwards rather than recalled — the runs
quoted here are post-crash runs.

### What the hardware did

Tapping "Back up all N years" on the **installed** iPad PWA produced the native "Open in…" sheet for
the first file only. Saving it and returning to Planbook left the panel exactly as before: no second
dialog, no status line, the nag still up for the undelivered year. That last detail is the one piece
of good news in the report — `recordBackupFor()` never ran for that year, so nothing was falsely
stamped and the data-safety half of the Traps line held. But the feature did not do its job.

The cause is structural, not a timing problem. In an installed PWA a download is a full context
switch away from the page, and returning does not resume the JS that was in flight. The loop's
`await` on `BETWEEN_FILES_MS` never came back, so neither did the second `handToBrowser()` nor the
status line after the loop. **No delay fixes this** — the page goes away at the first hand-off, not
when a timer expires. One tap in an installed PWA gets one download event.

So the first-round decision ("one file per year, in sequence, so restore never changes") was correct
in its reasoning and wrong on the platform. The work order's framing — *try the cheaper path and let
the iPad decide* — worked exactly as intended; the iPad decided.

### The ZIP writer: STORED, not `CompressionStream`

`src/zip.js`, ~215 lines, hand-written, zero dependencies. One STORED entry per year. The decision
and its reasoning are written into the head of that file, in the same register as
`documentForBackup()`'s. Summarised:

**STORED was chosen over the browser's native `CompressionStream('deflate-raw')`**, which is
available everywhere this app runs (Safari 16.4+) and would have shrunk a year of pretty-printed
JSON by roughly 10×. Three reasons, in the order they weighed:

1. **This is the recovery path.** A STORED entry's "compressed" bytes *are* the file's bytes, so the
   only thing between the teacher's data and her disk is a header and a checksum. Every failure mode
   of a compressor becomes a failure mode of the backup, and it would surface as an archive that
   unzips to something subtly wrong on the one day everything else has already gone wrong.
2. **STORED is verifiable here.** Node has no zip reader and this repo will not add one, so the
   checks parse the archive with a matching hand-written reader. Evidence beat compression.
3. **Size is not the teacher's problem.** Tens of megabytes on her own disk, once a week.

There is a fourth reason that is about *this* work order specifically and is written into the file:
`CompressionStream` is async, and the hand-off is the one thing that has been proven to survive an
installed PWA. Moving more work in front of it is how it stops being proven. The door is left open
deliberately — `method` is a field in both headers, and adding method 8 later changes nothing else in
the file.

**Written from the spec, not delegated.** Local file header, per-entry CRC-32 (table built from the
0xEDB88320 polynomial), central directory, end-of-central-directory. No zip64, no encryption, no data
descriptors. Sizes are *checked* against the 32-bit fields rather than assumed to fit, because a
truncated size field produces an archive that looks fine and unpacks to garbage.

**Independently validated, not only by my own reader.** A probe archive built by `src/zip.js` (three
entries, including a 200 KB one and non-ASCII content) was opened by three readers that share no code
with mine or with each other:

| Reader | Result |
|---|---|
| .NET `ZipArchive` (PowerShell `Expand-Archive`) | all three extracted, byte-exact, UTF-8 intact |
| libarchive (`C:\Windows\System32\tar.exe -tvf`) | all three listed, correct sizes and local timestamps |
| Python `zipfile` | `testzip()` → `None` (every CRC verified), method 0, dates correct |

And `crc32("123456789")` returns `cbf43926`, the standard test vector.

### The stamping semantics, which got simpler rather than more careful

The Traps line was written against the hard version of this problem. It is now much easier to
satisfy, and that is worth stating plainly rather than quietly enjoying:

- **Before:** N hand-offs, each of which could be the one the platform dropped, each followed by its
  own `recordBackupFor()`. The honest-stamp property depended on getting the ordering right N times,
  and the residual risk — iOS silently dropping hand-off 2 after hand-off 1 was already stamped —
  could not be closed at all, only warned about in the status line.
- **Now:** every year is read and validated first, then one archive is built, then one
  `handToBrowser()`. Only if that returns without throwing does `recordBackupFor()` run — for every
  year that is actually an entry. **There is no longer a middle state.** A run cannot be
  half-delivered, because there is nothing to truncate.
- Years excluded because `documentForBackup()` refused them (a document from a newer Planbook) are
  not entries, get no stamp, and are named on screen with the reason. Unchanged in intent, and now
  unambiguous: the browser either took the one file or it threw.
- The `try` wraps **both** the build and the hand-off, so a `zipStored()` throw reads as "no file,
  nothing stamped, nothing changed" rather than as a stamp.

What survives from the old version is the one honest limitation: no event tells a page a download
reached the disk. That claim is now smaller ("did the one thing you asked for arrive" rather than
"did all three"), but it is the same claim, so the status still names the file and asks her to check.

### What the new checks in `tools/verify-shell.mjs` actually cover

A **minimal ZIP reader** (~70 lines) sits beside the existing download helpers: scan backwards for the
end-of-central-directory record, walk the central directory, seek to each local header, take the
bytes, CRC them. It is deliberately stricter than a lenient unzipper — the two copies of every size
and CRC (local header and central directory) must **agree with each other**, the entry must be
STORED, and the CRC must match the bytes.

Six of WO-1.11's fifteen checks were rewritten around the new mechanism; the other nine were not
touched at all. Same claims, new evidence:

| Check | What it now proves |
|---|---|
| `one tap writes one zip file, holding a readable backup of every year on the device` | `newDownloads(dlBefore, **1**)` — the architecture change stated as an assertion, and the poll keeps watching for half a second afterwards, so a build that *also* fired a per-year download fails rather than passing as "at least one". Then: the archive parses, entry count equals the year count, every entry is STORED with a matching CRC and agreeing headers, every entry parses as a whole year document, entry names are exactly `Planbook <year> backup <date>.json`, and the set of years inside equals the set on the device. |
| `and the years it never opened are in there with their own rosters, support data included` | A distinct `docId` per entry and a real roster in a year the code never opened — so a build that zipped three copies of the open document fails. The open year's entry still carries the medical field. |
| `the status names the zip and what is in it, and says a page cannot know it arrived` | The zip's name, every entry name, "unzip it", "Check that it arrived", "support details". |
| `restore accepts every file this produces` | Every entry's text is pulled out of the archive and fed through the **real** `restoreFromText()`, reaching the confirm with the right year on the Replace button. These are literally the bytes a teacher holds after tapping the zip in Files. |
| `a year Planbook cannot read is left out of the zip, is NOT stamped, and is named on screen` | Poison one year to schema 99 and tap again: the new archive holds exactly the *other* years, the victim is not an entry, has no stamp, and the status says "holding 2 of 3", names it, gives the reason, and says it is still marked as never backed up. |
| the panel note | "one zip file", "all N school years", "unzip it", "restores by itself". |

**The check count is unchanged at 224** — this round replaced checks rather than adding them.
`tools/README.md` now says so explicitly, because a flat number across a rewrite is exactly the kind
of thing that reads as "nobody touched the harness."

**The negative control, run rather than argued.** With a one-bit CRC defect injected into
`src/zip.js`'s local header — the class of bug that unzips fine in a lenient tool and fails in a
strict one — the suite reports:

```
FAIL | one tap writes one zip file, holding a readable backup of every year on the device
  :: 1 file(s) landed … holding Planbook 2019-2020 … — HEADERS DISAGREE, …
224 checks · 223 passed · 1 failed · 0 skipped
```

`src/zip.js` was restored from a byte copy afterwards, and the final run is 224/224.

### On "0 lines removed"

`git diff --numstat -- tools/verify-shell.mjs` is **`708  0`** — 708 added, **zero removed** against
`HEAD`. The six WO-1.5 refusal fixtures, and every other pre-WO-1.11 line in that file, are
byte-identical, and all six refusals pass with their original messages.

That number needs one honest qualification, because it flatters this round: WO-1.11 is not committed,
so `HEAD` predates all of it. Within the **uncommitted** working tree this round genuinely did
rewrite lines that WO-1.11's first round had added — the six checks above, the `listDownloads`
filter, the section's block comment. Nothing outside WO-1.11's own additions was edited, which is
what the discipline is actually for.

### Files changed in this round

| File | What changed |
|---|---|
| `c:\dev\planbook\src\zip.js` | **New.** The hand-written ZIP writer and its decision record. |
| `c:\dev\planbook\src\backup.js` | `zipStored` imported; `BETWEEN_FILES_MS` retired; `zipNameFor()`; `handToBrowser()` takes an optional ready-made `blob`; `downloadAllBackups()` rebuilt as read-all → build → one hand-off → stamp; status and note copy rewritten; the section's decision record rewritten around the hardware failure. |
| `c:\dev\planbook\sw.js` | `./src/zip.js` added to `SHELL`; `CACHE` `v13` → `v14` (a genuinely new file, so the bump is required). |
| `c:\dev\planbook\index.html` | The `#backupAllNote` comment, which described "how many files" it writes. Markup unchanged. **Correction (verifier, 2026-08-05): this row was incomplete — the file-header decision-record paragraph (WO-1.11, describing "one file per year" as current) was missed by this round and still contradicted `src/backup.js`'s rewritten comment until the verifier caught it and it was corrected separately.** |
| `c:\dev\planbook\src\shell.js` | Two comments: the hook-list line for `data-backup-download-all`, and the not-awaited note beside the router. No logic. |
| `c:\dev\planbook\tools\verify-shell.mjs` | The ZIP reader, the CRC-32 table, six rewritten checks, the section's block comment, the `.zip` download filter. |
| `c:\dev\planbook\tools\README.md` | The check-count paragraph (why 224 is flat across a rewrite); trap 9 extended with what survived the architecture change and what got better. |

**Untouched, deliberately:** `parseBackup`, `openRestoreConfirm`, `restoreDocument`, `confirmRestore`
— restore has never seen a zip and still does not. The single-year download button's whole code path.
`refreshOtherYearsLine()`'s `years.length > 1` gate from the first correction round (its two checks
still pass). `src/shell.css` — no new control, so nothing new needs a 44px rule; the existing
`.backup-all-note` coarse-pointer bump and the button's own 44px both still measure green
("Back up all 3 years" is 134.16 × 44).

### Decisions this round had to make that the brief did not settle

1. **A separate `src/zip.js` rather than inlining the writer in `backup.js`.** A byte-format writer is
   a different kind of thing from a file about teacher-facing recovery, `backup.js` was already near a
   thousand lines, and a module can carry its own decision record where the next reader will look for
   it. The cost is one more `SHELL` entry and one more cache bump, which the brief anticipated.
2. **The archive is named `Planbook all years backup <date>.zip`.** Same `Planbook … backup <date>`
   family as `fileFor()`, so the whole set sorts together in a Files listing. "all years" rather than a
   count, because the count is already on the button and the name is a thing she reads next June.
3. **`handToBrowser()` takes an optional `blob`** instead of growing a second copy of its six lines for
   the zip. That function carries two iPadOS scars and the brief was explicit about not inventing a
   second download path — so the bytes and the media type are the only things that differ, and
   everything about *how* a file is handed to iOS stays in one place.
4. **Partial success is still error-toned and still returns `false`,** even though a file really was
   delivered. Inherited from the first round and kept on purpose: the run did not do what the button
   said, and the panel should not look like it did.

### Things the brief did not anticipate

1. **The `.json` → `.zip` download filter removed a latent confound.** The old helpers listed every
   `.json` in the throwaway profile's download directory — which by that point already held several
   files from the *single-year* button's own checks. It happened not to matter, because the check
   diffed against a snapshot. Filtering to `.zip` makes the directory listing mean exactly one thing.
2. **The Traps check needed a new vacuity guard, and got a better one.** The old check leaned on "the
   victim's `.json` from run 1 exists on disk"; those files no longer exist. It now asserts the victim
   **was an entry in the first archive** (by name) and **is not an entry in the second** — a strictly
   stronger guard, since it compares the control against itself one tap earlier.
3. **The Traps check also got stronger for free.** The sequential version had to narrow itself to the
   victim's file and say nothing about the survivors, because a browser may refuse a second burst of
   downloads and trap 8 forbids a check that goes red about the environment. One hand-off per tap needs
   the browser to cooperate **once**, so the survivors are asserted too — the archive must hold exactly
   the other years. This is now written into trap 9 in `tools/README.md`.
4. **Memory, which is a real residual and is named rather than measured.** The archive is built
   entirely in memory: the entry texts, their UTF-8 encodings, the single archive buffer, and the Blob
   all exist at once. Five real years at 3-6 MB each could peak north of 100 MB transiently, on a
   device where Safari kills tabs under memory pressure. The brief explicitly sanctioned the single
   `Uint8Array`, and the three test years measure 4,278 bytes here, so nothing in this run says
   anything about it. **This is the thing to watch when the hardware test runs against five real
   years** — and if it bites, the fix is small and local (hand the `Blob` constructor an array of
   chunks and release each year's text as it is packed) rather than architectural.

### Against the Acceptance list, as this round leaves it

1. **One tap produces a readable backup of every year** — verified on Edge/Chromium, from the
   archive's own bytes off disk, three years, distinct `docId`s and rosters. Not on an iPad.
2. **Absent with one year** — unchanged this round; both existing checks still pass (the one-year state
   at the only moment in the run that holds it, and the one-year boot-failure fixture).
3. **Each year stamped, nag down for all** — verified, from a cleared stamp map, asked year by year.
4. **Restore accepts every file this produces; WO-1.5 refusals unchanged** — verified, now through the
   archive's entries; refusal fixtures byte-identical and green.
5. **👤 On an installed iPad** — **still open, and it is now the only thing that matters.** This round
   exists *because* line 5 came back bad. What a human still has to settle, and I cannot:
   - the "Open in…" sheet accepts an `application/zip` blob and saves it to Files;
   - tapping the saved archive in Files unpacks it to N loose `.json` files;
   - one of those files, dropped back into Planbook's restore, reaches the confirm;
   - and the panel's status line is still on screen when she comes back — which the old build could
     not manage, and which is the clearest single signal that the fix worked.

### Temptation declined, for the record

**Real compression via `CompressionStream('deflate-raw')`.** It is available, it is a few lines, and it
would cut the file roughly tenfold. Declined for the three reasons written into `src/zip.js`, and a
fourth that is about this work order: the async step would sit between the tap and the hand-off, which
is precisely where this feature has already failed once. If archive size ever becomes a real
complaint, method 8 is a contained change to one file — and it should be its own work order, with its
own line about what proves the compressed bytes came back out intact.
