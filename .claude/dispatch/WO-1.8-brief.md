# WO-1.8 — Accommodations on the roster · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.8-result.md` — as your last act, and return it in-band too.

**Routing decision.** This goes to Claude because `ROUTING.md`'s first Claude rule names
accommodations, medical, and plan data as a sensitive surface that is never delegated, and WO-1.8 is
the definitional case of it — the Ship 1 table's one-line reason is "the most sensitive data in the
app." The runner-up consideration I set aside: the `supports` block is fully specified in
`docs/data-model.md`, which is normally the shape that derives to Codex — but the deliverable that
carries the risk here is the *discreet-by-default display*, which is a judgment call about
disclosure rather than a transform, and a plausible-looking implementation of it is a legal
disclosure. Treat that asymmetry as the standing instruction for every choice in this work order:
when a display decision is a close call, the quieter option wins.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.8 — Accommodations on the roster

**Ship** 1 · **Status** ⬜ NOT STARTED · **Size** M · 🚩 · **Depends on** WO-1.7
**Closes roadmap** Phase 1 → "Accommodations on the roster."

**Why it exists.** A teacher is legally obligated to implement accommodations from day one, which
is why the *fields* are Ship 1 even though the contextual prompts (WO-3.8) are Ship 2. This is also
the most consequential data in the app if it leaks — read
[`../../docs/data-model.md`](../../docs/data-model.md) § Accommodations before writing any of it.

**Deliverables**
- `students[].supports` exactly as the data model specifies: `plan` (IEP/504/ELL/none),
  `caseManager` {name, email}, `reviewDate`, `accommodations[]` {kind, detail, appliesTo},
  `medical`, `behaviorPlan`.
- An editor for it, reachable from the student record and clearly separated from ordinary fields.
- `kind` from the enumerated list plus `other` with free text. `appliesTo` empty means everything.
- Discreet display baseline: on any list view the default state is **not showing it** — a dot
  beside the name, details on deliberate tap. (The global toggle is WO-1.9.)
- The backup copy from WO-1.5 updated if it isn't already accurate.

**Out of scope** — surfacing at point of use (WO-3.8), calendar surfacing of `reviewDate` (WO-6.1).

**Acceptance**
- [ ] Every field in the data model's `supports` block is editable and round-trips.
- [ ] No list view shows plan status, accommodation detail, medical, or behavior text without a
      deliberate tap.
- [ ] The indicator dot does not itself encode the plan type by color or shape — a projected dot
      that means "IEP" is still a disclosure.
- [ ] `reviewDate` is stored and readable, whether or not anything consumes it yet.
- [ ] The backup UI names accommodation and medical data as present in the file.

**Traps** — It is tempting to show the accommodation list inline on the roster "because the teacher
needs it." That screen gets projected. Discreet by default is not a preference setting.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/data-model.md`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Beyond the list above, these are the specific pages and files this work order needs open:

- **`docs/data-model.md` lines 79–91** — the `supports` block verbatim, including the enumerated
  `kind` list. Build the shape from *that*, not from the work order's abbreviated restatement.
- **`docs/data-model.md` § "Accommodations — the most sensitive data in the app" (lines 186–217)** —
  the four rules. Rule 1 is what Acceptance lines 2 and 3 are testing. Rule 3 ("surfaced where the
  work happens") is WO-3.8 and is **out of scope here**; do not start on it. Rule 4 is Acceptance
  line 5. The closing paragraph is why `reviewDate` exists with no consumer yet — Acceptance line 4
  is asking you to store it faithfully, not to build the calendar.
- **`src/roster.js`** — the sibling whose conventions you must match, not re-invent. `studentRow`
  (~345), `openStudentEditor` (~684), `renderStudentEditor` (~664), `editStudentField` (~699), and
  the guardian array editor (`addGuardian` / `removeGuardian` / `guardianCard`, ~557–760). The
  `accommodations[]` editor is the same problem the guardians editor already solved — a repeating
  card list with add and remove. Follow that pattern rather than inventing a second one.
- **`src/modal.js`, `src/store.js`, `src/prefs.js`, `src/live-region.js`, `src/save-indicator.js`** —
  the existing modal, persistence, preference, announcement and save-feedback plumbing. Reuse.
- **`src/README.md`** — the module conventions this file layout follows.
- **`design/style-guide.md`** — the inline-colors rule reads like a mistake and is not. Do not tidy
  it into CSS variables. No dark mode.

**Two things about the state of the tree, both of which you should verify rather than take from me:**

- **The backup copy may already be most of the way there.** `index.html` around lines 919–920 and
  955, and the header comment in `src/backup.js` around lines 12–16, already name accommodation,
  IEP/504, medical and behavior-plan data as present in the backup file — but they say it in the
  *future* tense ("from WO-1.8 it **will** hold"). As of this work order it does hold. Deliverable 5
  says "updated if it isn't already accurate," so read every one of those passages and make the tense
  match reality. That is the whole of Acceptance line 5; do not rewrite the backup feature.
- **Baseline before you start is green**: `verify-shell.mjs` 164/164, `wo-sweep.mjs` 9 PASS with one
  standing `REVIEW | sensitive field names outside src/backup.js` (6 mentions). **That REVIEW count
  will go up because of your work, and that is expected, not a regression.** It is a greppable
  prompt, not a verdict. In your report, list each new mention you introduce and state why it is not
  an emit path — that is the evidence the sweep is asking for.

**One forward-looking constraint that is not scope creep.** WO-1.9 (presentation mode, the very next
work order) must be able to suppress every `supports` field app-wide by flipping **one** choke point,
and its Traps line says per-screen conditionals will pass that work order and fail in Phase 4. You
are not building the toggle, the header control, or the persisted preference — all three are WO-1.9
and out of scope. But route your sensitive rendering through a single helper *now*, so WO-1.9 has
one place to change. Scattering `if` statements across screens would satisfy WO-1.8 and quietly cost
WO-1.9 its whole design.

---

## 3. Constraints — non-negotiable, and each one has already cost someone a day

These are inlined verbatim into every brief on both routes, so that no constraint depends on an
agent having gone and read a pointer. The fifth one is the spine of this particular work order:

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
- Stay inside the work order's **Out of scope** line. Do not tick roadmap boxes, edit `plans/`, or
  touch `CHANGELOG.md` / `TESTING.md` — the teacher does maintenance, after the verifier reports.

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

1. Every field in the data model's `supports` block is editable and round-trips.
2. No list view shows plan status, accommodation detail, medical, or behavior text without a deliberate tap.
3. The indicator dot does not itself encode the plan type by color or shape — a projected dot that means "IEP" is still a disclosure.
4. `reviewDate` is stored and readable, whether or not anything consumes it yet.
5. The backup UI names accommodation and medical data as present in the file.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

