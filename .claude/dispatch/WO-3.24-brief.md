# WO-3.24 — no legend row in this app has ever been measured for spill · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.24-result.md` — as your last act, and return it in-band too.

**Routing decision.** This work order routes to **Codex** on the rubric — the spec is complete inside
the work order (the exact element, the exact comparison, the two exact widths), every Acceptance line
is a mechanically checkable count of green and red, `src/` changes only on a conditional that current
evidence says will not fire, and there is no new convention: WO-3.21 and WO-2.24 are the two built
precedents for a harness check plus a `tools/README.md` count. It was **re-routed to Claude Sonnet**
before dispatch on exactly the evidence that moved WO-3.12 and WO-3.21: `tools/verify-shell.mjs:333`
builds the browser profile with `fs.mkdtemp(path.join(os.tmpdir(), 'pb-verify-'))`, a write *outside*
the repo, and Codex runs under `--sandbox workspace-write`, which cannot create it — so Codex cannot
run the harness at all, and four of the five Acceptance lines here are run evidence. (The Codex probe
itself passed clean this dispatch, `SMOKE OK`, exit 0. **The runner is healthy; the sandbox is the
constraint.**) The runner-up I set aside: raising the tier to Opus on the *In scope if the measurement
goes red* branch, which would put teacher-facing legend prose in play. Declined — the owner's
2026-08-16 iPad sitting found no spill on any of the eight rows, the work order forbids hunting for
one, and a fallback is not a re-rubricing. **If the measurement does go red on a pre-existing row,
say so in your report before you reword it** — that is the one path where this brief's tier
assumption stops holding, and the 👤 line at Acceptance 5 exists for it.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.24 — no legend row in this app has ever been measured for spill

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-16 · **Size** S · **Depends on** WO-3.22 · **Blocks** nothing, and
that is deliberate — nothing spills today, so this is a row to cut if the fortnight tightens
**Closes roadmap** *(no box. Harness, not app: on current evidence nothing a teacher sees changes.
The same call WO-3.12 and WO-3.21 made, and for the same reason.)*

**Not a go-live blocker, and no defect is known.** Booked 2026-08-16 out of WO-3.22's implementation
and its iPad sitting. The owner opened the ⌨ Keys panel on the installed iPad that day, portrait and
landscape, and **no row spilled** — the text stops short of its own border on all eight, the
pre-existing `← →` row included. **Do not go hunting for a spill on the assumption there is one.**

**Why it exists.** `.scores-key` is `white-space: nowrap`, so a row wider than the panel pushes
through its own border instead of wrapping, and it does that while passing every 44px check — the
"Days off" failure from the first iPad sitting, in a place no instrument is pointed. **Nothing in the
harness has ever opened `#scoresKeys` at all.** WO-3.22 added a ninth string to that panel and could
defend it only by counting characters: 37 against the `← →` row's 67, same class, same font. That is
an argument from the strings, and its own Acceptance said so. The eyes that then confirmed it are one
sitting at one pair of widths on one device — real evidence, and not a thing that re-runs itself when
the next row lands.

**The order of the two facts matters.** A measurement booked while a spill is live is a bug fix; this
one is booked while the panel is clean, which is the cheap moment to write it and the reason it can
be cut without anything breaking.

**Deliverables**
- **The panel opened through its real button and measured**, `scrollWidth` against `clientWidth` on
  `#scoresKeys` and on each `.scores-key`, under a coarse pointer at 390px and at 1024px. Opening it
  through the button rather than by unhiding it is the point: WO-2.21's scar is a sweep that measured
  a screen that was not the one on screen.
- **A red that names the row.** A panel-level pass with a spilling child inside it is the failure this
  is written to catch, so the per-row measurement is the claim and the container is context.
- **Proof by mutation, run rather than reasoned** — lengthen one row's text until it spills, watch the
  check go red naming that row, revert, and record the counts in `tools/README.md` the way WO-3.21's
  and WO-2.24's are.

**In scope if the measurement goes red: rewording the row that spills**, the `← →` row from WO-3.16
included. WO-3.22 was forbidden to touch it and so could not have paid this debt; this work order can,
and a check that lands red with no remedy in its own scope is a harness left failing.

**Out of scope** — restyling the panel, `white-space` itself, and the attendance key list, which is a
modal `<dl>` whose prose wraps and is a different shape (see WO-2.34, which opens it for a different
reason; if the two land near each other they should share whatever opens-and-measures helper this one
builds).

**Acceptance**
- [ ] The ⌨ Keys panel is opened through its own button and every `.scores-key` in it is measured, at
      390px and 1024px under a coarse pointer.
- [ ] Lengthening one row until it spills turns a check red **and names that row** — run, not
      reasoned, with the counts before and during quoted. A mutation that reddens nothing means this
      work order did not land.
- [ ] Reverted, and `git diff` carries no trace of the mutation.
- [ ] `node tools/verify-shell.mjs` passes whole on the delivered tree, with the check count in
      `tools/README.md` moved in step.
- [ ] 👤 If the check went red on a row that was already there, the reworded row is read on the
      installed iPad in both orientations before the box above is ticked.

**Traps** — **A headless viewport is not an iPad and this check must not be sold as one.** It
measures a layout at a width; the 2026-08-16 sitting is still the only time this panel has been
looked at on glass, and a green run here closes no 👤 line. **The panel is `flex-wrap: wrap`**, so
each row is its own chip and a container that fits proves nothing about the rows inside it — measure
the children or the check is vacuous.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/README.md`
  - `tools/verify-shell.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open these, and know why each is on the list:

- **`index.html:1056-1075`** — the panel itself, `#scoresKeys`, and the nine `.scores-key` rows
  inside it. The comment at `:1059-1061` states the `white-space: nowrap` hazard in the markup; the
  `← →` row at `:1071` is the long one (67 characters) that WO-3.22 measured itself against and was
  forbidden to touch. This work order may touch it, but only if the run turns it red.
- **`src/scores.js:134-135`** — `KEYS_ID = 'scoresKeys'` and
  `KEYS_BTN_SEL = '#scoresView [data-scores-keys]'`, plus `toggleScoreKeys()`. The button is
  delegated through `src/shell.js:1215`. **Click the real button** — the Deliverable says so and
  WO-2.21's scar is behind it. Unhiding `#scoresKeys` by removing `.hidden` yourself is the failure
  mode this line was written against, and the panel's `aria-expanded` on the button is the
  independent evidence that the click landed.
- **`tools/verify-shell.mjs:218-275`** — the existing legend check, and the thing you are *not*
  duplicating. It is deliberately **static**: it reads `index.html` and `src/scores.js` as text and
  compares which keys are bound against which are documented. It has never opened the panel in a
  browser and never measured anything. Yours is the driven, measured half. Read its header comment
  anyway — it explains the panel's structure and its vacuous-pass guards, and both apply to you.
- **The coarse-pointer machinery already in the harness.** `Emulation.setDeviceMetricsOverride` +
  `Emulation.setTouchEmulationEnabled`, then **assert `matchMedia('(pointer: coarse)').matches`
  before believing anything you measured** — `tools/README.md` trap 3, and
  `tools/verify-shell.mjs:3816-3825` and `:13320-13328` are two worked examples of the assert-first
  pattern. A width override that silently failed leaves you measuring at 1280 and passing for the
  wrong reason (trap 10 makes the same point about print).
- **`tools/README.md` § the check-count entries**, e.g. `**598 at WO-2.24**` at `:1351` and
  `**677 at WO-2.25's second correction round**` at `:800`. That is the house format for what
  Deliverable 3 asks you to write: the count, the summary line copied verbatim, the line total, the
  mutation, and what went red. The instruction at `:1325` is explicit and load-bearing — **do not
  increment the number by arithmetic; run the harness and copy its summary line.** That figure has
  gone stale three times (WO-1.5, WO-2.18, WO-3.5) by exactly the arithmetic you are being told not
  to do.
- **`tools/README.md` § "Two rules that follow from those"**, at the foot of the file. *"Guard every
  sweep against a vacuous pass"* is the whole risk here: `scrollWidth <= clientWidth` over an empty
  node list is `true`. Assert you found nine rows (or whatever the tree holds), not zero.

**The one measurement trap specific to this panel, stated in the work order's own Traps and worth
repeating:** `#scoresKeys` is `flex-wrap: wrap`. The container will fit whatever you throw at it,
because it wraps. **The rows do not wrap — they are `nowrap`.** So a container-level
`scrollWidth`/`clientWidth` comparison is close to vacuous and the per-`.scores-key` comparison is
the actual claim. Measure the children. The container measurement is worth keeping as context, but
it is not the check.

**On the mutation (Acceptance 2).** Lengthen one row's text in `index.html` until it spills, run the
harness, and **quote the real numbers** — the row's `scrollWidth` and `clientWidth` before and
during, and the harness summary line both times. Then revert and prove it: `git diff -- index.html`
must be empty at the end. A mutation you reasoned about instead of running does not satisfy this
line, and a mutation that reddens nothing means the check is vacuous and the work order did not
land.

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

## 5. Done means these 5 lines, reported against one by one

1. The ⌨ Keys panel is opened through its own button and every `.scores-key` in it is measured, at 390px and 1024px under a coarse pointer.
2. Lengthening one row until it spills turns a check red **and names that row** — run, not reasoned, with the counts before and during quoted. A mutation that reddens nothing means this work order did not land.
3. Reverted, and `git diff` carries no trace of the mutation.
4. `node tools/verify-shell.mjs` passes whole on the delivered tree, with the check count in `tools/README.md` moved in step.
5. 👤 If the check went red on a row that was already there, the reworded row is read on the installed iPad in both orientations before the box above is ticked.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

