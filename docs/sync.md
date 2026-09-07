# Sync (opt-in)

Planbook is fully usable with no account. Sync exists only to carry the year document between
the teacher's laptop and iPad, and it is off until they turn it on.

## The scope, and only this scope

```
https://www.googleapis.com/auth/drive.file
```

"See, edit, create, and delete **only the specific Google Drive files you use with this app**."
It grants access to files this app created and nothing else — the rest of the teacher's Drive is
invisible to it.

**Never add `spreadsheets`.** It reads every spreadsheet the teacher owns, and its only use would
be reading a sheet the app didn't create. **Never add a mail scope** — outreach goes out through
`mailto:`, which needs no permission at all. Those two additions are what put "Google hasn't
verified this app" in front of a teacher, and the whole point of this architecture is that they
never see it.

`drive.file` is still a *sensitive* scope, so the OAuth client needs Google verification before
public launch — a privacy policy, a verified domain, and a demo video. Days, not months, and no
CASA security assessment (that's restricted scopes only). Until it's verified, sync stays behind a
flag; the local-first app ships without it.

## Auth

Google Identity Services token flow, browser-only, no client secret and no backend. Consequences
worth knowing up front:

- Access tokens last about an hour and **there is no refresh token in a browser-only flow**. Sync
  happens while the app is open and the teacher is signed in; a silent re-auth (`prompt: ''`)
  usually renews it, but sometimes they'll click. Background or scheduled sync is not possible —
  don't design a feature that assumes it.
- One OAuth client, owned and verified by us. Teachers deploy nothing.

### What WO-7.1 settled — 2026-08-24

The three things the protocol above did not answer, decided when the sign-in was built. All three
live in [`src/auth.js`](../src/auth.js), argued at length in its header; this is the short form.

**The token lives in memory and only in memory.** A module variable, so a reload is a sign-out.
It is not student data and not a UI preference, so `src/prefs.js`'s `PREF_DEFAULTS` would refuse
it — but the reason is stronger than the closed door: an access token is a bearer credential, and
in `localStorage` it outlives the tab and survives a laptop handed to a substitute. Persisting it
would buy nothing anyway, because there is no refresh token and the thing that makes the next
sign-in silent is the teacher's own Google session rather than our storage.

**The control is in the About modal, not in Backup & restore.** Backup was the tempting home and it
loses on one sentence from this document: *sync is not a backup.* A Connect button under "Download
a backup" teaches the misconception that costs a term of grades. About already carries the sentence
a sign-in qualifies — "There is no account and no server" — and that is where the footnote belongs.

**The flag is the origin.** `hostAllowsSignIn()` answers for loopback and nothing else, and **that
is the code holding itself back rather than a limit Google imposes** — the client's authorized-origin
list has carried `https://planbook.hwgteach.com` beside `https://localhost:8443` since 2026-08-21,
confirmed 2026-08-24. Loopback is simply where a handshake can succeed with the code's list as it
stands. On the deployed app the section is not drawn, no Google script is ever fetched, and
[`../privacy.html`](../privacy.html)'s claim that Planbook loads no third-party code of any kind
stays true word for word — **which is what the hold buys, and what widening the list costs.**
**WO-7.3 widens that one function, and that is all that is left of the pair**; the console half was
paid on the dates above. Either half alone gives a button that ends in `origin_mismatch`, and today
the code is the half that is behind, which is the safe direction.

*(This paragraph read* "the OAuth client's **only** authorized JavaScript origin (`https://localhost:8443`)"
*until 2026-09-07, four lines above the sentence naming the second origin — a contradiction inside one
paragraph.* `0f77a37` *swept that instruction out of eight files on 2026-08-24 and reached the WO-7.3
sentence below rather than this one. **The claim travelled before it was caught**: it is where*
`CLAUDE.md`*'s copy came from, and a reading of WO-7.2 on 2026-09-07 concluded from it that the iPad
was blocked behind Google's review queue, when the block is one line in* `hostAllowsSignIn()` *and
the deploy that would widen it.)*

Two more things worth carrying forward. A grant that does not contain this scope is **refused**
rather than held, so a token whose consent screen said something else never gets stored. And
`acceptTokenResponse()` copies three fields out of Google's answer rather than keeping the answer,
which is how "no refresh token is stored" is a property of the shape instead of a check for a name.

**The panel said nothing is uploaded yet, and that line was a deliverable.** WO-7.1 signed in and
stopped; WO-7.2 moved a document, so the sentence went in the same sitting as the code that made it
false — which is what "whatever moves a document says so in the same words" is for. What replaced it
is two notes in the same panel: **what sync puts in a teacher's Drive**, named field by field down
to the accommodations, the medical needs and the behavior plans, and **sync is not a backup**. The
first is `CLAUDE.md`'s one-exception rule applied a second time — the downloadable backup is the
exception "and its own UI says so", and sync is now the second place that data leaves the device, so
its own UI says so too. Do not soften either, and do not filter the upload to make the first go
away.

### What WO-7.2 settled — 2026-09-07

Four things decided while the transfer was built, each argued at length in `src/drive-sync.js`'s
header; this is the short form. The restore question is the fifth and has a section of its own,
under the model below.

**`baseRev` lives in IndexedDB, in a store of its own, keyed by `docId`.** It existed in this
document and in no line of code until WO-7.2. It could not go in the year document — that is the
thing being synced, so a per-device bookmark inside it would travel to the other device and be read
as that device's own, and writing it would itself bump `rev` and put the document permanently ahead
of the bookmark just written. It could not go in `localStorage` either: `src/prefs.js` is UI
preferences and refuses an undeclared key, and the state of a data transfer is not a switch
position. `src/store.js` is the only file in the repository that opens IndexedDB and it stays that
way, which is why the two readers live there rather than in the sync module.

**One multipart request per write, and never a resumable upload.** A resumable upload is what
Google's documentation reaches for at three to six megabytes, and it is exactly what creates a
half-written state with a name — a session URI and bytes at Drive belonging to a transfer nobody
finished. A single request has no such state: Drive commits the whole body or the previous revision
stands. That is the "never half-written" acceptance line as a property of the shape rather than as a
cleanup path that has to be got right.

**Preserve, then overwrite.** On a conflict the losing copy is downloaded and written to a new Drive
file *before* the live file is touched. A failure anywhere before that write leaves Drive exactly as
it was, so an interrupted conflict is a conflict that has not happened. The conflict copy carries
`conflictOf` rather than `docId`, so `files.list` can never match it again.

**The save chip gets `syncing` and `retry` and never `error`.** `queued` does not come back — it was
Roll Call!'s outbox state and this app has no outbox. `error` is refused because it draws "✕ Save
failed": every failure path leaves the document on the device untouched, so painting it would tell a
teacher her grades are in danger at the moment they are not. A failed sync reports in the Drive
panel.

## The model: whole document, last writer wins

The teacher never edits two devices at once — that was established up front, and it's what makes
this sound rather than lazy. Each save bumps `rev`; the app remembers `baseRev`, the rev it last
knows landed in Drive. The remote file carries its `rev` in `appProperties`, so ordering is
readable without downloading it.

```
remote.rev == baseRev   → local is ahead      → upload
remote.rev >  baseRev   → remote is ahead     → download (if local is unchanged since baseRev)
both changed            → conflict            → keep both, never discard
```

### What a restore does to `rev`

A restore is the one operation that puts a document on the device without a save producing it, so
it has to answer to the ordering above. It does, and the rule is already implemented in
`src/store.js` (`restoreDocument()`, and the reasoning block above it):

```
restored.rev = max(this device's rev for that year, the file's rev) + 1
```

**`rev` never goes backwards for a year on a device.** A backup taken at rev 12 and restored over a
year that had reached rev 50 here becomes rev 51, not rev 12. Reverting to the file's number would
let a later sync compare against a rev the document on this device never had, which is the one thing
the table above cannot survive.

The consequence is deliberate and is the behavior a teacher restoring on purpose expects: the
restored document is **ahead of `baseRev`**, so it uploads, and an old file restored knowingly
**supersedes** the Drive copy rather than quietly losing to it. A restore is a decision; sync must
not overturn it on the next poll.

`updatedAt` becomes now, for the same reason — both are save bookkeeping, not content. Everything
the teacher typed comes back exactly as the file holds it.

### What a restore from a *different device* does — answered 2026-09-07 (WO-7.2)

This paragraph was an open question until the day sync was built. It read: a backup restored from a
different device brings that file's `docId` with it, `docId` is what `files.list` matches on, and
whatever builds sync has to decide what that means — "most likely re-point `baseRev` and re-match
the remote file rather than assume the local pairing still holds. Write the answer here when it
exists."

**The answer is that nothing needs to be detected, because the bookmark is keyed by `docId`.**
`baseRev` lives in IndexedDB in a store of its own, one small record per document, keyed by the
document's own id (`src/store.js`, `readSyncState()`, which carries the argument for that home and
for the two places it was refused). So a document restored from another device asks for a bookmark
under an id this device has never synced, and there is none. **"No bookmark" is a state the
comparison already had to handle**, and its answer is the conservative one:

```
no bookmark + a remote file exists  → conflict → keep both
```

Both copies survive, the teacher is told what happened and where the other one is, and the bookmark
written afterwards means it happens exactly once — the next sync of that document is an ordinary
one.

**Why not re-point `baseRev` to the remote's rev and upload, which is what the open question
guessed at.** Because the restored document and the Drive file are two different lineages that
happen to share an id, and `rev` counts saves *of a document* rather than ticks of a global clock:
the other device may have saved fifty times since the backup was taken, so a restored file at rev 12
can be genuinely older than a Drive file at rev 40 or genuinely newer than one at rev 8, and nothing
available on this device says which. Re-pointing and uploading is a guess that overwrites; keeping
both is not a guess at all. **A spare file in Drive is the price of being wrong in the safe
direction**, and this design has already decided which direction that is.

### Three cases the table above does not name, and why all three are `conflict`

The table is the whole of the ordering when there is a bookmark and a readable remote rev. The
implementation (`planFor()` in `src/drive-sync.js`) adds three arms, and the direction is the point:
**this device replaces its own gradebook only on proof that the remote is a later version of that
same document, and otherwise keeps both.**

| case | answer | why |
|---|---|---|
| no remote file at all | upload | nothing to compare with; the first sync creates the file |
| no bookmark, remote exists | conflict | the case above — two lineages, no ordering |
| remote's `rev` unreadable | conflict | a file whose place in the order is unknown; unknown is not "the beginning" |
| remote's `rev` *below* `baseRev` | conflict | another device overwrote the file with a document whose save count is lower — not a descendant of anything this device knows |

And one row of the table read honestly rather than literally: `remote.rev == baseRev` with the local
document also at `baseRev` is *nothing has changed anywhere*, which uploads nothing. Taken
literally, that row would send three megabytes to replace a file with its own contents on every tap.

### What two devices that both edited offline actually experience

Worth writing down because it takes three syncs to settle and the middle one looks alarming.
Laptop at rev 50 and iPad at rev 12 have both edited since their last sync.

1. **Laptop syncs.** Drive is at the laptop's own last upload, so `remote.rev == baseRev` and the
   laptop is ahead: ordinary upload. Drive now holds the laptop's document.
2. **iPad syncs.** Drive moved and so did the iPad: conflict. The iPad writes *the laptop's*
   document to `Planbook 2026-2027 (conflict from Windows PC 2026-11-14).json` and makes its own
   the live copy. Nothing is lost; two files exist; the iPad's teacher is told.
3. **Laptop syncs again.** Drive now holds rev 12 where the laptop's bookmark says 50 — the
   remote is *behind* the bookmark, which is the fourth row above: conflict again. The laptop
   preserves the iPad's document as a second conflict copy and re-uploads its own.
4. **iPad syncs again.** The iPad has nothing unsynced, and Drive is ahead of its bookmark:
   ordinary download. Both devices now hold the laptop's document, and both teachers' work is in
   Drive — one live, two in named conflict files.

**Two conflict files and no merge is the designed outcome, not a defect.** The thing to notice is
that the iPad's own edits leave its screen at step 4 without a message at that moment; what it was
told is at step 2, and the file named there is where its work is. That is the honest cost of whole
document last-writer-wins with a per-device `rev`, and it is bounded by the premise this whole model
rests on: **the teacher never edits two devices at once.** Do not fix it with a merge.

**A conflict is not resolvable by guessing.** Write the losing side to Drive as
`Planbook 2026-2027 (conflict from iPad 2026-11-14).json`, keep the winner active, and tell the
teacher plainly what happened and where the other copy is. Silent merge of two gradebooks is how
you lose a term of grades and never find out.

Finding the file: `drive.file` limits `files.list` to app-created files, so the app can list its
own and match on `appProperties.docId` — no folder picker, no stored file path.

## What sync is not

It isn't a backup. Drive holds one live copy that sync will happily overwrite with a newer one.
The downloadable JSON in [data-model.md](data-model.md) is the backup, and it stays mandatory
whether or not sync is on.
