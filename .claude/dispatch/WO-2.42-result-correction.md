# WO-2.42 — correction 1, result

**Route** Claude (work-order-implementer) · **Reported** 2026-08-17
**Correction brief** `.claude/dispatch/WO-2.42-correction-1.md` · **Original result**
`.claude/dispatch/WO-2.42-result.md`

---

## The short version

The verifier was right and I was wrong. `src/classes.js` has not moved since WO-2.30 — I checked it
myself rather than taking the finding on trust, and every one of the verifier's numbers reproduces.
The sentence I shipped in two places took a real open question (*WO-2.30's recorded md5 matches
nothing*) and closed it with an explanation that is false. Both sentences are now replaced with what
is actually known, including "I cannot account for it."

**Documentation only. No code was touched and the harness was not re-run** — as instructed, and
because neither would change the finding. `git diff --stat -- src/` is empty and
`git diff -- tools/verify-shell.mjs` is byte-for-byte what the verifier already checked.

---

## What I verified before writing (my own commands, my own output)

I did not want to correct one unverified sentence with another, so I re-derived the finding:

```
$ git log --oneline -6 -- src/classes.js
aa10ec2 Refuse to archive a class with a student still out on a pass (WO-2.30)
4eb6349 Give a class its assignments, and a way between its screens (WO-3.3)
...

$ git log --oneline aa10ec2..HEAD -- src/classes.js
(no output)

$ git show aa10ec2:src/classes.js | md5sum   8506f8915eb7725b67b2e8593856ef89
$ git show HEAD:src/classes.js    | md5sum   8506f8915eb7725b67b2e8593856ef89
$ md5sum src/classes.js                      8506f8915eb7725b67b2e8593856ef89
```

Then every blob in the file's history — eight commits, hashed one at a time:

```
aa10ec2 8506f8915eb7725b67b2e8593856ef89
4eb6349 5d8e86d1de16e489b8071fd74800fb40
2b0a0ec d4110d6eac8c47661dec32a5a9c4aea5
e3cddc4 785e12279fab6c2fb2688a9992ee585a
79e6a6a 765303fdbf1caee884c686aa08c4604e
7f6b33b 22cfa14d55dba0a829bfdda0f02f9ef5
b4fe0b2 188852621372b6abe06e4c17f8178f40
33bab80 fe93ae1d3f303cc95f8c9d4ef773ac43
```

`df7b2e98c83d7e00543ce5b0da9b7991` appears **zero** times (grep -c on that list = 0). Line endings
ruled out independently: `git config --get core.autocrlf` → `false`, and the CRLF rendering of the
current file hashes `1be194fd4cce5dea17b68f5f8114efae`, not `df7b2e98…`.

So: the file is unchanged since WO-2.30's own commit, the recorded hash has never been its md5, and
nothing I can find accounts for the recorded value. **WO-2.30's proof-of-revert is unverifiable.**
That is the sentence that belongs in both files, and it is now in both.

---

## Change 1 — `TESTING.md`, the WO-2.42 red-demonstration paragraph

**Was** (`TESTING.md:4024`):

> The `df7b2e98…` recorded in the WO-2.30 entry above is that day's hash; the file has legitimately
> moved since, so the proof is against the hash this sitting took.

**Now** (`TESTING.md:4023-4035`, quoted verbatim, with the preceding sentence for context):

> `src/classes.js` was restored byte-identically afterwards (md5
> `8506f8915eb7725b67b2e8593856ef89`, taken before the mutation and again after the revert). **That
> pair is this row's proof and it stands on its own.** The `df7b2e98…` recorded in the WO-2.30 entry
> above matches nothing: `src/classes.js` has not been touched since `aa10ec2`, WO-2.30's own commit,
> and the blob is byte-identical at `aa10ec2`, at HEAD and in the working tree — `8506f891…` all
> three. Hashing every one of the eight blobs in the file's history returns `df7b2e98…` at none of
> them, and line endings do not account for it either (`core.autocrlf=false`; the CRLF variant is
> `1be194fd…`). **So WO-2.30's proof-of-revert is unverifiable, and I cannot account for the hash it
> records.** No second explanation is offered here because none is known. The WO-2.30 entry above is
> left exactly as written — the discrepancy is pre-existing and not this row's to rewrite — and this
> row's revert is proven against the hash taken in this sitting, not against that one. *(Corrected
> 2026-08-17 in this row's correction round: the first version of this sentence said the file had
> legitimately moved since, which is false, and it closed an open question with a wrong answer.)*

## Change 2 — `plans/work-orders/phase-2-attendance.md`, the "How it came out" note

**Was** (`:4183`):

> the `df7b2e98…` in `TESTING.md` is the WO-2.30-era hash and the file has moved on since

**Now** (`:4182-4192`, verbatim; the italic markers are the surrounding note's voice):

> *(`824 · 822 passed · 2 failed`, exit 1). `src/classes.js` was restored byte-identically — md5
> `8506f8915eb7725b67b2e8593856ef89` before the mutation and again after the revert, which is this
> row's proof and needs nothing else. The* `df7b2e98…` *recorded in `TESTING.md`'s WO-2.30 entry
> matches no blob of that file at any commit in its history: nothing has touched `src/classes.js`
> since* `aa10ec2` *— WO-2.30's own commit — where it already hashed* `8506f891…`*, all eight
> historical blobs hash to something else, and line endings do not account for it
> (`core.autocrlf=false`; the CRLF variant is* `1be194fd…`*).* **WO-2.30's proof-of-revert is
> therefore unverifiable, and I cannot account for the hash it records.** *No second explanation is
> offered, because none is known; the WO-2.30 entry is left as written, its discrepancy being
> pre-existing and not this row's to rewrite. (Corrected 2026-08-17 in this row's correction round —
> the first version of this sentence said the file had moved on since, which is false.)*

## Change 3 — `TESTING.md:3492` left alone, and proved left alone

Instruction 2 honoured. The entire `TESTING.md` diff for this dispatch is **one pure-addition hunk**:

```
$ git diff -U0 -- TESTING.md | grep '^@@'
@@ -3987,0 +3988,77 @@
```

Nothing before line 3988 is modified or deleted, so WO-2.30's `df7b2e98…` entry at `:3492` stands
untouched, discrepancy and all. That is deliberate: this row's job was to stop covering it, not to
rewrite it.

## Change 4 — the sibling audit now counts three, not two

The verifier's undercount is real and I accepted it after reading the code. Current line numbers,
read this sitting from `tools/verify-shell.mjs` (they are within two lines of the ones the correction
brief quotes; nothing moved, the brief and I are just counting from slightly different anchors):

| Site | Where | Why it is the same shape |
|---|---|---|
| `said41` | loop `:11335-11340`, read `:11355`, check `:11357` | The loop exits when `cardTicked.elapsed !== before1s` — the *elapsed figure changing*. That is exactly the claim of the check directly beneath it at `:11341`, so the loop is right for **that** check. The next check rides the same loop: it reads `said41 = await heard()` with no further wait and then asserts `alerted41.alerted === 2` **and** `/has been out on a bathroom pass for 41 minutes\./`. The figure moving is a proxy for the alert escalating, and escalation-then-announcement is the same two-task pair (`announce()`'s 30ms defer) that reddened `:12895`. **This is the closest analogue to the bug this row fixed, and my first audit misfiled it** — I listed "the interval-tick poll" under *exits on the very reading its check makes*, which is true of `:11341` and not of `:11357`. |
| `saidFive` | sleep `:11532`, read `:11535`, check `:11536` | Fixed `setTimeout(250)` after `wakeUp()`, then `heard()`. Not a proxy wait — trap 5's own shape, 220ms of margin against a 30ms defer. |
| `saidTen` | sleep `:11551`, read `:11554`, check `:11555` | Same. |

**None of the three was touched.** All three sit inside the work order's **Out of scope** line — "the
41-minute clock check" and "any widening into WO-2.30's hall-pass block beyond the three call sites"
— and the brief is explicit that `:11284-11360` is not mine to fix.

The written answer is corrected in both places. Its headline is no longer "this one was alone": it now
reads **"no other *named helper* waits on a proxy — but one inline poll does, and the first version of
this answer missed it"** (`TESTING.md:4036`), with the equivalent sentence in the work-order note at
`:4194`. Both now name all three sites and both book them as **one follow-up covering all three**.

**Proposed follow-up, revised (not booked by me):**

> `verify-shell.mjs` takes three readings of the live region behind a wait that does not assert them.
> `said41` (`:11355`) rides the interval-tick poll at `:11335`, which exits on the elapsed figure
> changing rather than on the escalation to `alerted === 2` or the sentence the check tests — the same
> two-task race WO-2.42 fixed in `waitForPassAlert()`. `saidFive` (`:11535`) and `saidTen` (`:11554`)
> use a fixed 250ms sleep after `wakeUp()`, which is trap 5's own shape with 220ms of margin against a
> 30ms deferred write. Replace all three with a poll on the sentence, the way `waitForPassAlert()` now
> waits. Sized together because they are one block and share one mechanism; splitting them would put
> three separate three-run evidence burdens on one race.

---

## Also corrected: a number in my original report

`git diff --numstat -- tools/verify-shell.mjs` reads **50 insertions / 9 deletions**. My original
report said "51 insertions / 10 deletions" in two places. The file is unchanged since the verifier
read it — I ran nothing that could have altered it this round — so that was a transcription slip in
the first report, not a change. It affects nothing in the shipped files (neither `TESTING.md` nor the
work-order note quotes a diffstat), but the correct figure is on the record here.

---

## What I re-checked, and what I deliberately did not

**Re-checked (output read, not predicted):**

- The four git/md5 commands above, and the eight-blob history hash.
- `git diff --stat -- src/` → **no output**, still empty.
- `git diff --stat -- tools/` → only the original round's `tools/README.md` (13 insertions) and
  `tools/verify-shell.mjs` (50 insertions / 9 deletions). **No code change this round.**
- `node tools/wo-sweep.mjs` → ran to completion in the foreground, exit `0`:
  ```
  ================ SUMMARY ================
  20 checks · 18 passed · 0 failed · 2 to review
  ```
  Both REVIEWs are the standing pair (`sensitive field names outside src/backup.js`, `due-date and
  late/missing on the same line`). `808 check() call site(s)` still matches `tools/README.md:873`.
  I re-ran it because I edited two tracked documents and the sweep greps documents as well as code.
- Line endings on both edited files: `file` reports UTF-8 text for each, and the diff contains **zero**
  CR bytes — no CRLF flip, and the diffstat is proportional (77 added lines in `TESTING.md`, 49 added /
  6 removed in the work-order file, for edits of that size).

**Deliberately not done:**

- **`node tools/verify-shell.mjs` was not re-run.** The correction brief says it is not required for a
  documentation-only correction and would not change the finding, and the three green runs plus the
  verifier's own three are already banked. I am not claiming a run I did not make.
- **No `tools/verify-shell.mjs` edit, no `src/` edit.** The finding was prose.
- **`said41` and the two sleeps were not fixed.** Out of scope, named instead.
- **No `CHANGELOG.md` entry.** The draft in my original report still stands and is the teacher's call.
- **No commit, no push.** Nothing in either brief asked for one, and the whole dispatch is still
  uncommitted in the working tree.

---

## Files changed this round

| File | What |
|---|---|
| `TESTING.md` | The false sentence in the WO-2.42 red-demonstration paragraph replaced with the hash finding and "I cannot account for it"; the sibling-audit bullet rewritten to name `said41` and count three sites. `:3492` (WO-2.30's own entry) untouched — the diff is a single addition hunk starting at `:3988`. |
| `plans/work-orders/phase-2-attendance.md` | The same two corrections in the "How it came out" note (`:4182-4192` and `:4194-4205`). Acceptance boxes unchanged — see the note below. |

Unchanged from the first round and still in the tree: `tools/verify-shell.mjs` (the fix),
`tools/README.md` (the trap 5 paragraph the verifier upheld as in scope).

---

## A judgment call this round raised

**I left the five Acceptance boxes ticked.** The verifier's own words are that "four of the five ticks
are true; the fifth (line 3) is true in its proposition but rests on the false sentence above" — the
red demonstration did happen, it printed the recorded signature, and the revert *is* proven by a hash
pair taken this sitting. What was false was the aside explaining someone else's hash, and that aside
is gone. Un-ticking a line whose proposition the verifier called true would misreport it in the other
direction. **If the verifier reads it the other way, that is its call and the box is one edit away** —
I flag it here rather than deciding it silently.

**And the thing I want on the record for whoever reads this in six months:** the original failure was
not a typo. I had a hash that did not match, and instead of writing "this does not match and I do not
know why" I reached for the most plausible-sounding reason and asserted it. It took four commands to
check and I ran none of them. The open question I papered over — *where did WO-2.30's `df7b2e98…` come
from?* — is still open, and it is now written down as open in two places instead of explained away in
two places.
