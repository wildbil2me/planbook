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
