# WO-2.42 — correction 1

**Verdict from the verifier: FAIL.** Four of the five Acceptance lines verify clean and the fifth is
true in its proposition; the code fix was independently re-verified, including three green
`verify-shell.mjs` runs the verifier ran itself. **The failure is prose, not code**, and the fix is
two sentences.

## The verifier's ❌ finding, verbatim

> ### ❌ The finding
>
> Both shipped files now claim `src/classes.js` changed after WO-2.30, to explain why the recorded
> md5 doesn't match:
>
> - `c:\dev\planbook\TESTING.md:4024` — *"The `df7b2e98…` recorded in the WO-2.30 entry above is that
>   day's hash; the file has legitimately moved since"*
> - `c:\dev\planbook\plans\work-orders\phase-2-attendance.md:4183` — *"the `df7b2e98…` in
>   `TESTING.md` is the WO-2.30-era hash and the file has moved on since"*
>
> Both halves are false:
>
> ```
> blob at aa10ec2 (WO-2.30's own commit)  8506f8915eb7725b67b2e8593856ef89
> blob at HEAD                            8506f8915eb7725b67b2e8593856ef89
> working tree                            8506f8915eb7725b67b2e8593856ef89
> git log aa10ec2..HEAD -- src/classes.js  (no commits)
> ```
>
> `aa10ec2 "Refuse to archive a class with a student still out on a pass (WO-2.30)"` is the most
> recent commit to touch the file. I hashed every blob in its history — `df7b2e98…` has **never**
> been its md5 at any commit — and ruled out line endings (`core.autocrlf=false`; the CRLF variant is
> `1be194fd…`).
>
> Why this matters more than a stale pointer: it *closes a real open question with a wrong answer*.
> `TESTING.md:3492` offers `df7b2e98…` as WO-2.30's proof-of-revert, and that hash matches nothing —
> so WO-2.30's own proof-of-revert is unverifiable. WO-2.42 was positioned to flag that and instead
> explained it away. The correct sentence is "the recorded hash does not match and I cannot account
> for it." *(WO-2.30's discrepancy is pre-existing and not this row's fault; papering over it is.)*

And from the Acceptance walk:

> Four of the five ticks are true; the fifth (line 3) is true in its proposition but rests on the
> false sentence above.

## What to do

1. **Correct both sentences** — `TESTING.md:4024` and `plans/work-orders/phase-2-attendance.md:4183`
   — to say what is actually known: the revert is proven against the hash taken this sitting, and
   `df7b2e98…` matches no blob of `src/classes.js` at any commit, which is **unexplained**. Do not
   invent a second explanation for it. "I cannot account for it" is the accurate sentence and the
   verifier named it as the correct one.
2. **Leave WO-2.30's own entry at `TESTING.md:3492` alone.** The discrepancy there is pre-existing
   and not this row's to rewrite; this row's job is to stop covering it.
3. **Do not touch the code.** All five diff hunks in `tools/verify-shell.mjs` verified ✅ and the
   three-run evidence is already banked. Re-running `verify-shell.mjs` is not required for a
   documentation-only correction, and re-running it would not change the finding.

## Two secondary notes from the same verdict — worth folding in while you are here

Both are additions to what you already wrote, not corrections:

- **The sibling audit undercounts by one.** The verifier's words:

  > **It undercounts by one.** `said41` (`:11353`) is read after the loop at `:11335`, which exits on
  > *the elapsed figure changing* — not on anything the 41-minute alert check at `:11354` asserts
  > (`alerted === 2`, the sentence). That is structurally the closest analogue to the bug just fixed,
  > and it isn't named. It sits in the explicitly out-of-scope region, so this is a reporting gap,
  > not a scope breach; the proposed follow-up should cover all three.

  Add `said41` to the written answer and to the proposed follow-up, so the follow-up covers all
  three sites rather than two. **Do not fix it** — `:11284-11360` is the 41-minute clock check the
  work order puts explicitly out of scope.

- **Your judgment calls were upheld.** The `tools/README.md` trap 5 paragraph is **in scope** (the
  Out of scope line names three things and this is none of them), and declining the two-sleep
  follow-up was **agreed, for the right reason** — fixing them would widen past the three call sites
  and put an unrelated change inside the three-run evidence. Nothing to change on either.

## Then

Report to `.claude/dispatch/WO-2.42-result-correction.md` and return it in-band. Say what you
changed and quote the corrected sentences. It goes back through the same verifier.
