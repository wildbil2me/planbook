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
