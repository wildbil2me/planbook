# WO-5.10 — The status line is the one field the projector does not empty · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-5-outreach.md`
**Report to** `.claude/dispatch/WO-5.10-result.md` — as your last act, and return it in-band too.

**Route — Claude Opus.** This is a one-line change inside the **presentation-mode branch of a
sensitive surface**, which `ROUTING.md` § "Route to Claude" makes undelegatable regardless of size —
and it is the same reason WO-5.7 found this defect and deliberately did not fix it. The runner-up:
on its other five bullets an XS model change with a named mutation reads Codex-shaped, and it fails
the budget bullet independently (`verify-shell.mjs` is 429s a run here, so clean + mutation is
~14.3 min against a 20 min cap before any reading or writing). Set aside — the surface decides.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-5.10 — The status line is the one field the projector does not empty

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-14 · **Size** XS · **Depends on** WO-5.7

**Why it exists.** `paintOutreach()`'s blocked branch empties the subject, the body, the *To* line,
its note, the chips, the template options and the reasons list, in as many words: *"emptied rather
than hidden … `display: none` is not a redaction."* Then it returns, and **the status line is drawn
after the return, from `model.status`, which `outreachModel()` puts on `base` before it asks whether
the projector is on.** Two of the sentences that variable can hold name a person: *"The draft was
rebuilt for Wo53Guardian One…"* (`setOutreachRecipient()`) and *"Handed to your mail app and logged
on Ada …'s record"* (`recordHandoff()`). So a teacher who switches recipient, or hands a draft off,
and then flips the projector has a guardian's name or a child's sitting inside the `.hidden` form —
`display: none`, exactly the thing the flow's own rule says is not a redaction.

**It is a breach of the rule and not a live disclosure, and both halves of that sentence matter.**
Nothing is on the glass today; `#outreachStatus` is inside `#outreachForm`, which the same paint
hides. But the rule exists because a hidden element is one CSS regression, one `hidden` class
dropped by a later work order, or one *Inspect element* under a projector from being read — and
WO-5.3's mutation round found the shape once already, a confirm dialog left standing over a form
that had just emptied itself. **Found by WO-5.7's implementer, confirmed by its verifier against
`git show HEAD:src/outreach-view.js`, and deliberately not fixed there**: the fix is one line, but
it is a line in the presentation-mode branch of a sensitive surface, and WO-5.7 was about a
clipboard.

**Why the harness is green over it.** `tools/verify/outreach.mjs`'s projector check reads
`#outreachModal.textContent` — which *does* include hidden text — and asserts no guardian's name is
in it. It passes because of **ordering**: the fixture flips the projector before it has ever
switched a recipient or handed anything off, so `status` is `''` when the flip lands and the check
never sees the sentence it would catch. The check is right; the fixture cannot make it fire.

**Deliverables**
- `outreachModel()` returns `status: ''` when `blocked` — on `base`, beside `clipboard: ''`, for the
  reason written there: the projected model has nothing to draw rather than a paint declining to
  draw it. **The model, not the paint**: the paint draws `model.status` and must keep doing so, or the
  status line becomes the one field with two opinions about the projector.
- A check in `tools/verify/outreach.mjs` that **switches recipient first, then flips the projector**,
  and asserts `#outreachStatus` is empty and `#outreachModal.textContent` carries no guardian's name.
  The existing projector check is left as it is — it is a different fixture and it already passes
  for an honest reason.
- `tools/README.md`'s `check()` count moves; update it in the same sitting (the WO-3.26 scar).

**Acceptance**
- [ ] With a recipient switched and the rebuilt note on screen, flipping the projector leaves
      `#outreachStatus` empty and no guardian's name anywhere in `#outreachModal.textContent`, hidden
      or not.
- [ ] Flipping the projector back does not resurrect the sentence: the status line stays empty until
      the teacher does something that writes a new one.
- [ ] The mutation — `status: status` restored on `base` — turns the new check red and leaves the
      existing projector check green, which is the proof that the new fixture reaches what the old
      one cannot.

**Traps** — **Do not clear the module variable from inside the paint.** `status = ''` in
`paintOutreach()`'s blocked branch would pass the first two Acceptance lines and put a writer of flow
state inside a function whose contract is to draw a model; every other status write in the file is
in a handler, and `resetOutreach()` is the one place the paint's caller clears it. **And do not widen
into `announce()`.** `setOutreachRecipient()` announces *"Writing to Wo53Guardian One."* to the live
region — that is a screen reader, not a projector, and the same reasoning that keeps a `note`
visible under presentation mode (`CLAUDE.md` § Accommodations) applies: the teacher at the keyboard
is not the audience the mode protects against. Leave it.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/README.md`
  - `tools/verify/outreach.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/outreach-view.js` — the file the one-line change lands in. Read `outreachModel()` and
  `paintOutreach()`'s blocked branch together, and read the header's reasons before touching it.
- `sw.js` — `src/outreach-view.js` is in `SHELL` (line 120), so **bump `CACHE`** (currently
  `planbook-shell-v115`). A `src/` edit without the bump reaches no device.
- `CLAUDE.md` § Accommodations — the presentation-mode rulings, including the one the Traps line
  points at about `note` staying visible.

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

## 5. Done means these 3 lines, reported against one by one

1. With a recipient switched and the rebuilt note on screen, flipping the projector leaves `#outreachStatus` empty and no guardian's name anywhere in `#outreachModal.textContent`, hidden or not.
2. Flipping the projector back does not resurrect the sentence: the status line stays empty until the teacher does something that writes a new one.
3. The mutation — `status: status` restored on `base` — turns the new check red and leaves the existing projector check green, which is the proof that the new fixture reaches what the old one cannot.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

