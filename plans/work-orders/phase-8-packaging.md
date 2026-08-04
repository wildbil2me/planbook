# Phase 8 work orders — 1.0 packaging

**Phase goal:** something a stranger can find, evaluate, install, and trust.

Branch: `phase/8-packaging`. The 1.0.0 call itself is [WO-G4](gates.md#wo-g4--the-100-call).

---

## WO-8.1 — `TESTING.md` complete and passing

**Status** ⬜ NOT STARTED · **Size** M · **Depends on** every phase
**Closes roadmap** Phase 8 → "`TESTING.md` complete and fully passing."

**Why it exists.** This is the regression gate. **There is no automated suite and that is a
decision, not an omission** — which puts all the weight on this checklist being real.

**Deliverables**
- Every work order's acceptance lines present in `TESTING.md`, organized by surface rather than by
  phase, since that's how you actually walk an app.
- A full pass on desktop **and on a real iPad**, results dated.
- Gaps found during the pass either fixed or written into `README.md`'s known limitations — never
  quietly ticked.

**Acceptance**
- [ ] Every acceptance line from WO-1.1 through WO-7.3 appears in `TESTING.md`.
- [ ] A complete pass is recorded with a date, a browser version, and an iPadOS version.
- [ ] Nothing is ticked that was written but not run. *(The one rule the whole protocol rests on.)*

---

## WO-8.2 — Demo build

**Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-8.1
**Closes roadmap** Phase 8 → "Demo build with a fake in-memory dataset, no account."

**Why it exists.** A stranger evaluating a gradebook will not type in a roster to find out whether
they like it. The demo is the top of the adoption funnel, and it doubles as a headless test surface.

**Reference:** Roll Call!'s `tools/build-demo.mjs` — clone the pattern, where **the engine's
*presence* is the switch** rather than a runtime flag that can leak into production.

**Deliverables**
- `tools/build-demo.mjs`, bare Node, no dependencies.
- A fake dataset with enough shape to exercise the interesting cases: an empty category, a
  turnaround student, a quiet-middle student, a dropped day, an untaken day, a student with
  accommodations.
- In-memory only. The demo writes nothing to IndexedDB and cannot be confused for real data.
- Sync and outreach disabled or clearly simulated in demo mode.

**Acceptance**
- [ ] The demo runs with no account, no sign-in, and no permissions.
- [ ] Closing and reopening the demo resets it — nothing persisted.
- [ ] The production build contains no demo dataset and no demo switch.
- [ ] The demo surfaces at least one concern signal and one praise signal on load.
- [ ] Demo accommodation data is obviously fictional.

---

## WO-8.3 — Accessibility pass

**Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-8.2
**Closes roadmap** Phase 8 → "Accessibility pass: screen reader, keyboard-only, contrast."

**Why it exists.** *Roll Call!'s headless run found 66 unlabelled buttons in an area already ticked
done.* **Run the pass, don't assert it.**

**Deliverables**
- Screen reader pass with NVDA and VoiceOver across every screen.
- Keyboard-only pass: every action reachable, focus never lost, focus always visible.
- Contrast check against the palette in `design/style-guide.md`, including the wash-background
  chips and the on-dark secondary text.
- A headless audit run over the demo build, since the demo has data to render.
- Fixes, then a re-run. The re-run is the deliverable, not the first run.

**Acceptance**
- [ ] Zero unlabelled interactive controls across the app, verified by an automated sweep over the
      demo — not by inspection.
- [ ] Every icon-only button has `aria-label` and `title`; every toggle has `aria-pressed`.
- [ ] The whole app is operable keyboard-only, including attendance marking and score entry.
- [ ] Save failures and offline states announce through the `aria-live` region.
- [ ] No contrast failure at AA on any text.

---

## WO-8.4 — Print stylesheets

**Status** ⬜ NOT STARTED · **Size** S · **Depends on** WO-2.6, WO-3.9
**Closes roadmap** Phase 8 → "Print stylesheets for every printable surface."

**Deliverables**
- `@media print` on every printable surface: gradebook, attendance record, student detail,
  calendar month.
- App chrome hidden; the hidden `#printHeader` becomes visible to title the printout.
- `body[data-modal-print]` to print a single modal, per the style guide.
- **Presentation-mode rules apply to print unconditionally** — a printout left on a desk is the same
  disclosure as a projected screen, and there is no toggle to remember.

**Acceptance**
- [ ] Each printable surface produces a clean page with a title, class, term, and date.
- [ ] No app chrome, navigation, or button appears in any printout.
- [ ] No printout contains accommodation, medical, or plan data, regardless of presentation-mode
      state.
- [ ] The gradebook printout is ordered to match the SIS entry screen (WO-3.9).

---

## WO-8.5 — README, FERPA, and known limitations

**Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-8.1
**Closes roadmap** Phase 8 → "`README.md` with a Known limitations section" and "`docs/FERPA.md`."

**Why it exists.** The 1.0 criteria require limitations to be "written down before launch, not
discovered by a user." And the FERPA document is a genuine asset with principals and district IT —
no vendor server ever touches student data, and no account is required. That position is worth
stating well.

**Deliverables**
- `README.md`: what it is, install, first attendance mark, and a **Known limitations** section
  naming the gaps out loud — no SIS integration, no multi-teacher, no translation, `mailto:` cannot
  confirm delivery, sync is foreground-only, whatever WO-2.7 shipped without.
- `docs/FERPA.md`, **stronger than Roll Call!'s** because the architecture is stronger: no vendor
  server, no account required, one Drive scope covering only app-created files.
- **It must address accommodation and medical data directly, not only grades** — including the fact
  that the JSON backup contains them and that this is the same posture a paper folder has.
- Data-flow statement: what leaves the device, when, and to where. The honest answer is "nothing,
  unless the teacher turns on sync or sends an email."

**Acceptance**
- [ ] Every README feature has been run end-to-end against real data. *A documented feature that
      fails on a teacher's first day loses that teacher permanently.*
- [ ] Known limitations names at least every gap listed above.
- [ ] `FERPA.md` has a section on accommodation and medical data, and one on backups.
- [ ] Both documents are readable by a principal, not only by a developer.

---

## WO-8.6 — Onboarding, name, and distribution

**Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-8.5
**Closes roadmap** Phase 8 → "Onboarding: install → marking attendance with no documentation" and
"Name and distribution channel decided."

**Why it exists.** *Roll Call! sat at 0.9.0-beta with every engineering blocker closed, held up by
exactly this. It isn't an engineering task and it doesn't resolve itself.* Naming it as a work order
with acceptance criteria is the only defense.

Note the coupling: WO-3.10 needs a verified domain, which needs the distribution decision. If sync
is wanted before 1.0, **the naming decision is on Phase 3's critical path**, not Phase 8's.

**Deliverables**
- Onboarding path: install → create a class → paste a roster → mark attendance, with no
  documentation and no warning screen.
- A first-run flow that gets a teacher to their first attendance mark, following Roll Call!'s
  setup-flow skeleton.
- **The name.** Decided, not shortlisted.
- **The distribution channel.** Decided: where it's hosted, how a teacher finds it, what the URL is.

**Acceptance**
- [ ] A teacher who has never seen the app installs it and marks attendance for a real class without
      asking a question. Test on an actual person, not a thought experiment.
- [ ] No step in that path requires reading documentation.
- [ ] The name is written down here and used consistently in the manifest, README, and consent
      screen.
- [ ] The URL exists, resolves, and matches the verified domain from WO-3.10.
