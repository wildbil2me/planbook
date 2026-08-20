# WO-6.6 — correction 1, result

**One line changed, in one file.** No source file touched, nothing rebuilt.

## What the line reads now

`c:\dev\planbook\TESTING.md` — the WO-6.6 block, formerly line 7156, now 7156–7165:

```
- [x] No `setPref('openClassId'` appears anywhere outside `src/classes.js`, and **WO-6.6 added no
      writer**: the calendar keeps its view because `selectClass()` asks `currentView()`, inside the
      one function that was already there. *(**The box is narrowed to that clause on purpose**, and
      only that clause is ticked — 2026-08-19. The Acceptance line as written in
      `plans/work-orders/phase-6-calendar-glance.md` also claims `openClassId` is written in **exactly
      one function**, and a grep contradicts it: `createClass()` writes it too, at `src/classes.js:975`,
      so that a teacher's FIRST class becomes the open one — a writer predating this work order by a
      fortnight. That box is left **open** in the phase file, with the note beneath it, because whether
      the criterion is satisfied as written is the owner's call. Read the phase file for that half; do
      not read a tick here as closing it.)*
```

I took the reword option rather than the bare untick, because the second clause is true, greppable and
worth having recorded — and an unticked box under text that is entirely true is a false statement in the
other direction. What the tick now covers is exactly what the grep shows, and the sentence that used to
claim "exactly one function" now *names the second writer with its line number* and defers to the phase
file. The gate document and the phase file agree: neither one says the first clause is met.

Re-ran the grep after the edit, from the repo root, and read the output:

```
$ grep -rn "setPref('openClassId'" src/
src/classes.js:650:  setPref('openClassId', id);
src/classes.js:975:  if (activeClasses(getDoc()).length === 1) setPref('openClassId', cls.id);
```

Both writers are in `src/classes.js`; neither is new. My phase-file note at
`plans/work-orders/phase-6-calendar-glance.md:656-665` is **unchanged**, and that Acceptance box is
still open.

## Sweep

`node tools/wo-sweep.mjs`, run to completion, last line of the summary block:

```
25 checks · 23 passed · 0 failed · 2 to review
```

The two REVIEWs are the two standing ones — *sensitive field names outside `src/backup.js`* (334
mentions) and *due-date and late/missing on the same line* (8 sites) — the same pair, with the same
counts, that the original WO-6.6 run reported. Neither is a verdict and neither moved.

Two lines from that run worth quoting because they bear on this work order rather than on the edit:

```
PASS | every SHELL file change is paired with a CACHE bump :: planbook-shell-v88 is not in any commit
       yet — the bump is uncommitted, which is the rule being followed
PASS | the recorded `check()` call-site count matches the harness :: 1022 `check()` call site(s) in
       tools/verify-shell.mjs, matching tools/README.md:1011
```

## What I did not do

- **Did not run `verify-shell.mjs`.** `TESTING.md` is not in `SHELL` in `sw.js` and holds no `check()`
  call site, so a prose edit there cannot move the 1040 or the recorded count; the sweep's count check
  above reads `tools/verify-shell.mjs` and `tools/README.md`, both untouched. The 1040/1040 from the
  original dispatch and the verifier's own reproduction stands as the harness reading for this build.
  I did not re-derive it and I am not claiming it as a run of mine.
- **Did not touch `src/classes.js`.** As instructed. See the follow-up below.
- **Did not tick a 👤 line.** The three iPad readings in both documents are still open. I have no
  device and nothing here was measurable by eye.
- **Did not write `CHANGELOG.md`.** Nothing to add for a correction round beyond what WO-6.6's own
  entry will say; the changelog draft in the original result is unaffected by this edit.
- **Did not commit.** The whole WO-6.6 implementation is still uncommitted in the working tree (15
  modified files); `HEAD` (425a3d7) is the booking commit for the work order, not the code. Worth
  knowing for whoever commits: `sw.js` is at v88 in the tree and v87 at `HEAD`, and my edit adds 116
  lines / removes 1 in `TESTING.md` and nothing else. I checked the diff is not a line-ending rewrite —
  `git diff --numstat -- TESTING.md` gives `116 1`, and the file is still LF-clean UTF-8.

## Proposed follow-up, not done here

**Collapse the second `openClassId` writer, or rule that two is correct.** `createClass()` sets the
pref directly when it creates the teacher's first active class, which is the only reason the Acceptance
line's first clause is false. The tidy version routes that through `selectClass()` so the pref has one
writer — but `createClass()` runs before there is a class screen to select into, so it is not a
one-line move, and it changes the first-run path that gets a brand-new teacher onto their first class.
That is a small work order of its own with its own iPad reading on first-run, and it predates WO-6.6 by
a fortnight. The alternative ruling — *two writers in one file is fine, reword the criterion* — is
cheaper and is what the text now reflects. Either way it is the owner's call, which is what both
documents now say.
