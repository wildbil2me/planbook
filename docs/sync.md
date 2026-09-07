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

**The panel says nothing is uploaded yet, and that line is a deliverable.** WO-7.1 signs in and
stops. Whatever moves a document says so in the same words.

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

**Open for Phase 7, not decided here:** a backup restored from a *different device* brings that
file's `docId` with it, and `docId` is what `files.list` matches on. Whatever builds sync has to
decide what that means — most likely re-point `baseRev` and re-match the remote file rather than
assume the local pairing still holds. Write the answer here when it exists.

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
