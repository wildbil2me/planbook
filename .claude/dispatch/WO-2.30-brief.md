# WO-2.30 — archiving the open class misdirects the pass alert · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.30-result.md` — as your last act, and return it in-band too.

**Routing decision.** Routed to **Claude at the Opus tier, on merits and not as a fallback.** The
deciding signal is that this work order's first deliverable is *an undecided design choice* — it
names three candidate behaviours and requires the decision, with its reasoning, be written into the
work order before code exists — and its Traps are judgment traps rather than mechanical ones. The
runner-up consideration set aside: it is Size S with one mechanically checkable harness clause,
which reads Codex-shaped, but a work order whose primary deliverable is a decision is exactly what
the rubric keeps away from a runner that matches specs well and chooses between them poorly.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.30 — archiving the open class misdirects the pass alert

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-15 · **Size** S · **Depends on** WO-2.9, WO-2.28

**Booked 2026-08-14 out of WO-2.28's close-out, and it is a separate bug rather than a loose end of
that work order.** WO-2.28 made the overdue alert independent of the banner. This is independent of
that fix: it would have been a bug before WO-2.28 and it is still one after, because its cause is not
in `src/attendance.js` at all.

**The bug.** `getSelectedClassId()` (`src/classes.js:165`–`170`) resolves rather than trusts — a
deliberate and correct design, and its comment says why: *"the preference can name a class that has
since been archived or deleted … the answer is the first one that exists rather than nothing. A
header that goes blank because a stored id went stale reads as the app losing the class."* So when
the open class is archived or deleted:

```js
return list.some((c) => c.id === want) ? want : list[0].id;
```

`openClass()` becomes **`list[0]` — the first surviving class, which is not the one that went away.**
`paintPassElapsed()` then walks a *different* class's open passes, on the next tick and every tick
after. A student still out on a pass from the class that was just archived is **never alerted on
again**: no guard fires, nothing returns early, and the loop is busily and correctly processing
somebody else's room.

**It is misdirection, not silence, and that distinction is the work.** An earlier note in this file's
close-out described it as hitting `paintPassElapsed()`'s first guard
(`if (!box || !cls || !doc) return;`, `src/attendance.js:2962`). **That is wrong and the wording has
been corrected.** The first guard only fires when there is no active class left *at all* — the last
class archived — which is the rare tail of a rare case. The ordinary case is that another class
exists, so `cls` is truthy, the function runs happily, and the alert is computed for the wrong room.
A silent return is a feature that stopped; a silent misdirection looks exactly like a working app.

**Why no harness check reaches it today.** WO-2.28's missing-node check punches its hole in the DOM by
hand, which is the honest limit its own `TESTING.md` entry records. This path has to be reached
*through the app* — issue a pass, archive that class from the class manager, and let the clock tick —
and no check in the suite archives a class with a pass open. That is what makes this worth a work
order rather than a comment: **it is invisible to every green run the project currently makes.**

**Deliverables**
- The behaviour decided and implemented. The three candidates, and the decision belongs in the work
  order before code is written: close the open passes of a class being archived (the pass's room no
  longer exists, so the trip is over); or leave the passes and refuse to let `openClass()` silently
  become a class whose passes nobody is watching; or alert across the boundary, which
  `src/attendance.js:2970`–`2981` has now refused on the record three times and should not be
  reopened casually.
- Whatever is chosen, `src/passes.js` and the archive path in `src/classes.js` agree about what
  happens to an open pass when its class stops being open.
- A harness check that reaches it **through the app** — a pass issued, the class archived, the clock
  ticked — rather than by editing the DOM.

**Acceptance**
- [ ] Archiving a class with a student out on a pass has a defined, written-down outcome, and the
      work order says which of the three it is and why.
- [ ] A student out on a pass in the archived class is not silently left un-alerted while a different
      class's passes are processed in their place.
- [ ] The check drives the real path — issue, archive, tick — and fails on today's build.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` print what they printed before, but
      for the count.

**Traps** — **Do not "fix" `getSelectedClassId()`'s fallback.** Returning `''` instead of `list[0]`
would blank the header on a stale id, which is the exact failure its comment was written to prevent,
and it would reach far beyond hall passes. The fallback is right; what is missing is anything that
notices a pass was left behind by it. **Do not reach for the cross-class alert** as the easy answer —
see the refusal at `src/attendance.js:2970`–`2981`, which is now three work orders deep and names the
real objection: an alert about a child in a room the teacher is not in, with no card, no Return
button and nothing to act on. **This is not a WO-2.28 regression** and its fix does not belong in
`paintPassElapsed()`'s loop.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/attendance.js`
  - `src/classes.js`
  - `src/passes.js`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open these, and note the line drift — the work order's line numbers were written on an earlier
build and have moved:

- **`src/classes.js:152`–`175`** — the comment block above `getSelectedClassId()`. It is the design
  the first Trap forbids you to undo. Read it before you touch anything in that file.
- **`src/classes.js:822`–`843`** — `archiveClass()` / `restoreClass()`, the archive path the second
  Deliverable says must agree with `src/passes.js`. Note that archive is reversible and currently
  costs one tap with no dialog, while delete (below it, from `deletionCounts()` on) is destructive
  and already gates behind a counted confirm. **These two paths are not the same kind of act, and
  the work order's three candidates may not deserve the same answer on both** — say which you chose
  for each and why. The work order names deletion in its bug statement, so do not silently scope it
  to archive alone without saying so.
- **`src/passes.js`** — the whole file is 549 lines. `openPassesFor()`, `closePass()` (note its
  `endedBy` parameter and what values it already takes) and `cancelPass()` are the vocabulary any
  "close the open passes" option would have to use. If none of the existing verbs fits what
  archiving means, say so rather than stretching one.
- **`src/attendance.js:2947`–`3000`** — `paintPassElapsed()` and the comment block above it. The
  third refusal of the cross-class alert lives in the block starting *"SCOPED TO THE CLASS ON
  SCREEN"* (~line 2985). Read the refusal before considering that option; the third Trap says it is
  not to be reopened casually, and "casually" means without a surface of its own.

**On the decision itself.** The work order says the decision *belongs in the work order before code
is written*. Take that literally: amend WO-2.30's own section in
`plans/work-orders/phase-2-attendance.md` with the chosen behaviour and the argument for it, in this
project's voice, and do that before or alongside the implementation — not as a write-up afterwards.
Acceptance line 1 is graded on that prose existing and naming which of the three it is.

**On the harness check.** Acceptance line 3 says it must *fail on today's build*. Demonstrate that,
do not assert it: run the new check against the unfixed code (stash, or invert your change
temporarily) and put the actual failure output in your result file. A check that passes both before
and after is the failure mode this project has recorded more than once. It must drive the app —
issue a pass, archive that class through the class manager, tick the clock — not punch a hole in the
DOM. Read `tools/README.md` § "Driving a browser over CDP" first; four traps there present as app
defects.

**Scope.** Do not add a visible off-registry or cross-class indicator, and do not widen this into the
cross-class alert feature. If the right fix suggests one, name it in your result as a proposed
follow-up work order.

---

## 3. Constraints — non-negotiable, and each one has already cost someone a day

Codex does not read `CLAUDE.md`. It reads [`../../AGENTS.md`](../../AGENTS.md), which points back at
it — but the pointer is not enough for the constraints that matter. The orchestrator inlines these
into every brief, verbatim:

- No dependencies, no framework, no bundler, no linter, no test framework. No `package.json`.
- Colors inline, not CSS variables. No dark mode anywhere — no `prefers-color-scheme`, no
  `[data-theme]`.
- Every new control gets a 44px minimum in the `@media (pointer: coarse)` block.
- `localStorage` prefix `planbook_`, UI preferences only — never student data.
- No merge field, log line, print surface, or export emits accommodation, medical, or plan data.
- `late` and `missing` are teacher-marked, never inferred from a date. Blank means ungraded.
- Empty categories redistribute their weight.
- Taken · dropped · not-taken-yet are three states. Everything counts recorded meetings, never
  calendar days.
- Stay inside the work order's **Out of scope** line.
- You may tick the boxes your own run closed, and update `plans/` and `TESTING.md` as you go. Two
  exceptions: **never tick a 👤 line** — it needs a real iPad and you do not have one — and leave the
  `CHANGELOG.md` entry to the teacher, who decides what a change means. Anything you do tick must be
  something you actually checked; a tick you cannot point at evidence for is worse than a blank box.

---

## 4. Verification

```
node tools/verify-shell.mjs      # measures what a stylesheet review gets wrong
node tools/wo-sweep.mjs          # the eight standing greps
```

Both must be green before you report. **Do not write a second harness** — if this work order
needs a check `verify-shell.mjs` cannot make, say so in your report as a proposed follow-up.
Add checks for what you build; a fixture that cannot express the failure is not evidence.

---

## 5. Done means these 4 lines, reported against one by one

1. Archiving a class with a student out on a pass has a defined, written-down outcome, and the work order says which of the three it is and why.
2. A student out on a pass in the archived class is not silently left un-alerted while a different class's passes are processed in their place.
3. The check drives the real path — issue, archive, tick — and fails on today's build.
4. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` print what they printed before, but for the count.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

