# WO-5.5 — The two sentences the flow does not say · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-5-outreach.md`
**Report to** `.claude/dispatch/WO-5.5-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude at **Opus** tier: the deliverable is teacher-facing copy — two
sentences whose exact wording *is* the work order — which is `ROUTING.md` § "Route to Claude" ("It
produces teacher-facing prose"), reinforced by § "Later phases at a glance" putting all of Phase 5
in the Claude column as a property of the work rather than a runner's record. The runner-up was
Codex: size S, and three of the four Acceptance lines are grep-checkable. It was set aside because
the work order leaves one decision explicitly unmade — whether to unify the two strip heads into a
shared constant or change both in step — and says in as many words that it "cannot be made by
accident." That is the judgment this route exists to buy.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-5.5 — The two sentences the flow does not say

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-29 · **Size** S · **Depends on** WO-5.3

**Why it exists.** Two places where the app knows something the teacher does not, and says nothing.
Both were found by watching one person use it for the first time, which is the only way this kind of
defect is ever found.

**The first is in the editor.** The eight starter templates ship as TEXT and become records only
when saved — WO-5.2's ruling, and a good one: a Save is "the one keystroke between a shipped
sentence and a hundred guardians reading it in the same words." But nothing on the screen says so.
A teacher who reads a starter, likes it, and goes to write a message finds it is not on offer, and
the app's explanation is an empty picker. **The rule is right and its silence is the bug.**

**The second is in the send flow.** A draft holding an unresolved field says *"This draft cannot be
sent"* — true, and no help at all. It does not say what to do, and what to do is simple: type over
the token, or take it out. The owner's wording is better than the shipped one because it describes
the state rather than announcing a refusal, and a teacher who reads *"has at least one undefined
field"* already knows more than one who reads *"cannot be sent."*

**Deliverables**
- The template editor says, where a starter is opened, that it is not available in a draft until it
  is saved — at the moment the question arises, not in a help panel.
- The block strip's head changes from *This draft cannot be sent* to **This draft has at least one
  undefined field** (the owner's words, 2026-08-29).
- The strip carries the instruction: remove the field or type what it should say, and the draft
  continues. The resolver's existing per-field sentences stay exactly as they are — this adds the
  sentence about what to DO, which no resolver can write because it is about the box, not the token.

**Acceptance**
- [ ] Opening a starter in the editor states that it must be saved before a draft can use it.
- [ ] A draft with an unresolved field heads its strip *This draft has at least one undefined field*
      and says, in words, that removing the field or typing over it will unblock the draft.
- [ ] The resolver's own per-field sentences are unchanged — this work order adds a sentence and
      rewrites a heading, and touches `src/merge-fields.js` not at all.
- [ ] Neither new sentence names a student, so presentation mode is unaffected.

**Traps** — The block strip is drawn by two screens (`src/templates-view.js`'s preview and
`src/outreach-view.js`) over one shared section, § UNRESOLVED in `src/shell.css`. A heading changed
in one and not the other is this phase's own "two askers" defect. Change it once.

*(**Three things read off the tree on 2026-08-29, after WO-5.6 landed and the flow went live.**
Added here rather than left for the implementer to hit, because two of them turn a green harness red
and the third turns it green while breaking an Acceptance line above.*

- ***"Change it once" is the intent and not yet the shape.*** *The two heads are already different
  strings —* `src/outreach-view.js:481` *ends "· N things to fix",* `src/templates-view.js:513` *ends
  "· N field did not resolve" — so there is no shared constant to edit and an implementer looking
  for one will not find it.* **Whether to unify them into one place or change both in step is this
  work order's call to make and to write down**, *but it cannot be made by accident.*
- ***The old head is asserted in two harness files, and both go red.*** `tools/verify/outreach.mjs:585`
  *tests* `/cannot be sent/` *on the strip head and* `tools/verify/templates.mjs:498-502` *tests*
  `/cannot be sent/i` *on the preview's.* **Update the assertions to the new head and keep every
  other conjunct** *— the WO-5.6 sitting reddened four WO-5.3 checks the same way and the answer was
  to strengthen them, never to relax one to match new copy. A check edited down to fit is the defect
  this directory exists to catch.*
- ***`src/merge-fields.js` says "cannot be sent" too, and must not be touched.*** *Lines 549 and 552
  are the resolver's own per-field sentences, which* **Acceptance line 3 protects in as many words**.
  *A find-and-replace over the phrase satisfies the second Acceptance line and breaks the third in
  the same keystroke.* `src/outreach.js:18` *and* `:178` *quote the resolver in prose and are not copy.*

*And one thing that is an opportunity rather than a trap: the strip itself is an empty*
`<div id="outreachBlock">` *filled by JS, so the send-flow half likely opens no* `index.html` *at
all — but the editor half may.* **If this sitting opens `index.html`, row 42 rides with it** *—*
[WO-8.13](phase-8-packaging.md#wo-813--the-about-modal-names-two-documents-and-not-the-licence)*,
one About row, which is what the* 🎒 *mark is for. An* `index.html` *change also wants a* `CACHE`
*bump in* `sw.js`*.)*

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/merge-fields.js`
  - `src/outreach-view.js`
  - `src/outreach.js`
  - `src/shell.css`
  - `src/templates-view.js`
  - `tools/verify/outreach.mjs`
  - `tools/verify/templates.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Four things from the dispatch side, none of which the tree will tell you.**

1. **Write the two-heads decision down in the code, not only in your result file.** The work order's
   own note says unify-or-change-in-step "is this work order's call to make and to write down." Pick
   one and leave a comment at the point of departure saying which and why — a later reader who finds
   two hand-kept strings and no note will assume it was an oversight and unify it badly. The Traps
   line calls a divergence here "this phase's own two-askers defect"; whichever shape you choose has
   to make that divergence structurally hard, not merely currently absent.
2. **`src/merge-fields.js` is a sensitive surface and Acceptance line 3 fences it by name.** Do not
   open it to edit. A find-and-replace over "cannot be sent" satisfies line 2 and breaks line 3 in
   the same keystroke — the work order says so, and it is the single most likely way this dispatch
   fails. `git diff --stat` at the end must not list that file.
3. **Do not take WO-8.13, even if you open `index.html`.** The work order flags it as a 🎒
   ride-along and the project convention allows it, but it is a separate row with its own claim and
   its own verifier, and work done under this brief is work this dispatch's verifier is not asked to
   grade. If you do open `index.html`, say so in your result file — it gets dispatched next, on its
   own. An `index.html` edit still wants the `CACHE` bump in `sw.js` for *this* work order's own
   change.
4. **If `verify-shell.mjs` cannot run in your environment, report that as an environment and not as
   a result.** It is re-run locally before any box is ticked. `wo-sweep.mjs` has no such excuse —
   it must be green, and note that a stale count in `tools/README.md` is the sweep line that goes red
   on work being *done* rather than wrong.

**Files the work order names with line numbers** — `src/outreach-view.js:481`,
`src/templates-view.js:513`, `tools/verify/outreach.mjs:585`, `tools/verify/templates.mjs:498-502`,
`src/merge-fields.js:549,552` (read-only), `src/shell.css` § UNRESOLVED. Those were read off the tree
on 2026-08-29; confirm them rather than trusting them.

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
  exceptions: **never tick a 👤 or 📆 line** — one needs a real iPad you do not have, the other a date
  that has not arrived — and leave the `CHANGELOG.md` entry to the teacher, who decides what a change
  means. Anything you do tick must be
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

1. Opening a starter in the editor states that it must be saved before a draft can use it.
2. A draft with an unresolved field heads its strip *This draft has at least one undefined field* and says, in words, that removing the field or typing over it will unblock the draft.
3. The resolver's own per-field sentences are unchanged — this work order adds a sentence and rewrites a heading, and touches `src/merge-fields.js` not at all.
4. Neither new sentence names a student, so presentation mode is unaffected.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

