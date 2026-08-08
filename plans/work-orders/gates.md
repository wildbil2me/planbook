# Gate work orders — the ship gates and the 1.0.0 call

Four work orders that produce no code. They exist because the failure mode they guard against is
*declaring done*: a phase that felt finished, a ship that was never rehearsed, a release called on
how complete it felt rather than on criteria.

Each is a checklist you run, not a thing you build.

---

## WO-G1 — Ship 1 go-live rehearsal

**Ship** 1 · **Status** ⬜ NOT STARTED · **Size** M · 🚩 · **Depends on** WO-1.1 … WO-2.4
**Target** ~2026-08-22, before students walk in ~2026-08-24

**Why it exists.** A three-week-old app will be holding a live term of attendance. The decision to
go live was made 2026-08-03 with the risk stated and accepted; **this work order is the thing that
makes it considered rather than reckless.** Two facts are load-bearing and both get verified here,
not assumed.

### The three things that must be right

From [`../ROADMAP.md`](../ROADMAP.md): the riskiest thing on day one is the attendance ledger itself
— not a schedule, since there isn't one. What must be right is narrow and testable.

- [ ] **A mark lands and survives a reload.** On the iPad, installed, with the app force-quit
      between mark and check.
- [ ] **A dropped class is distinguishable from an untaken one** — on screen, and in the stored
      document.
- [ ] **The percentage matches a hand count.** Against a real class, over real recorded meetings.

**Verify all three against a real class before trusting it with a term.**

### The rehearsal

- [ ] Run a **full simulated school day**: five classes, one dropped, one marked late in the day,
      one deliberately left untaken, and one marked for yesterday. Then reload and confirm every
      state reads correctly.
- [ ] **Backup drill, end to end.** Download the backup, wipe browser storage, restore, and confirm
      every mark, student, and class returns. Do this on the iPad, not only the laptop.
- [ ] **Installed on the actual teaching iPad**, from Safari, launching without browser chrome.
      Record the iPadOS version in `TESTING.md`.
- [ ] **Airplane mode test.** Full class marked with no network, then reconnect. Nothing lost.
- [ ] **Roll Call! confirmed still deployed and working.** It is the fallback, and *a fallback
      you've decommissioned isn't one.* Do not decommission it.
- [ ] The week-one plan is written down: which app is the record of truth, and what the trigger is
      for falling back. Decide the trigger now, not at 7:45am on a Tuesday.
- [ ] A backup is downloaded and stored off the device before day one.

### Where Ship 1 actually runs — decided 2026-08-08

**The term runs on the LAN address: `https://192.168.50.142:8443`, served by
`tools/serve-https.mjs` from a `main` checkout.** No public host, no static host, no domain. That
is a decision, not a gap waiting to be filled — Phase 8 owns the distribution channel and a real
URL, and neither is needed to mark attendance in August.

**It works because the app is offline-first, and that is proven rather than assumed.** WO-1.3's
checks include the installed app opening with the network disabled, and the desk half was run with
the server process *stopped outright* rather than with a DevTools toggle. Once the iPad has
installed and the service worker has precached `SHELL`, the laptop can be closed and off-network
for the rest of the term.

**What follows from it, and what the rehearsal must cover:**

- **The origin is an IP address, and IndexedDB is scoped to the origin.** `https://192.168.50.142:8443`
  is not where the app is served from; it *is* where the term's attendance lives. A DHCP lease that
  moves does not degrade this — it strands it. A fresh install at a new address is a different
  origin with an empty database, and the only way back is a backup file taken beforehand.
  **Pin the laptop's address with a DHCP reservation at the router before day one.**
  `tools/README.md` already records the adjacent failure: a moved lease leaves a valid certificate
  for the wrong host, signed, unexpired, and refused.
- **Updates require the iPad back on that network with the server running.** There is no deploy that
  reaches the device on its own. Landing a fix and the teacher receiving it are two separate acts all
  term.
- **The iPad is on `planbook-shell-v30` as of this decision.** The bump to `v31` — which carries
  WO-2.4's counts and percentage and WO-2.13's fix — reaches it only on its next load from the
  server. Do that *before* rehearsing, or the rehearsal measures an app two work orders old.
- **There is no sync in Ship 1.** Phase 7 is 🔒 GATED on OAuth verification, and `docs/sync.md` says
  the local-first app ships without it. Moving a year between laptop and iPad is a backup file out
  and a restore in, by hand — `plans/ROADMAP.md` calls it "crude, manual, and real."

### Ship gate

- [ ] `TESTING.md` Phase 1 and Phase 2 sections fully passing. *(Checked 2026-08-08: 246 boxes
      ticked, 6 open. All six are under the struck-through `WO-2.1 — Attendance marking screen`
      heading, superseded 2026-08-06 and kept as a record; they were never run against the screen
      that shipped and ticking them would be false. Read as satisfied — but it is a judgement, so it
      is written here rather than left for the next reader to re-derive.)*
- [x] `CHANGELOG.md` current. *(2026-08-08. WO-1.13 and WO-2.13 were both absent — WO-1.13 since
      2026-08-06 — and the gap was invisible until this line was checked against the file instead of
      assumed.)*
- [x] `phase/1-*` and `phase/2-*` merged to `main`; `main` is what's deployed. *(2026-08-08.
      Fast-forward to `9d09f4c`, 32 commits, 0 behind; `phase/1-shell-store-roster` was already
      contained in `main`. Pushed. "Deployed" means the LAN server above, per the decision record.)*

**If any of the three things above fails, Ship 1 does not go live and Roll Call! carries the term.**
That is not a failure of the project; it is the reason the fallback exists.

---

## WO-G2 — Ship 2 gate: first grades

**Ship** 2 · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** Phase 3, WO-2.5 … WO-2.7
**Target** ~2026-09-15, before the first grades are entered for real

**Why it exists.** Grade math wrong in September is discovered in November, by a guardian. The 1.0
criteria demand grade math "verified against hand-computed cases" — this is where that happens, on
the owner's real classes, before the numbers matter.

- [ ] Every case in `docs/grade-math-cases.md` (WO-3.4) verified by hand.
- [ ] A real class's weighted grade computed by hand and matched against the app, including at least
      one student with a `missing`, one with an `excused`, and one with an empty category.
- [ ] The letter scale matches what the owner actually uses, including the boundary case that
      rounding would have gotten wrong.
- [ ] Grades entered for one real assignment across all five classes in under 20 minutes.
- [ ] The printout order matches the SIS entry screen, confirmed against a real re-key.
- [ ] Backup drill re-run now that grades exist.
- [ ] `TESTING.md` Phase 3 section fully passing.
- [ ] WO-3.10 OAuth paperwork **submitted**, with the date recorded.

---

## WO-G3 — Ship 3 gate: signals

**Ship** 3 · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** Phase 4
**Target** October 2026, once 4–6 weeks of real data exist

**Why it exists.** Signals tuned against thin data produce lists nobody trusts, and a teacher who
stops reading the list has lost the feature permanently — quietly, without anyone deciding to kill it.

- [ ] At least four weeks of real grades and attendance exist before the thresholds are tuned.
- [ ] **Every flag reproducible by hand** from the numbers it shows — walk all nine concern rules
      and all five praise rules against real students.
- [ ] **Two consecutive weekly runs produce visibly different lists.** If they don't, the cooldown
      or the delta ranking is wrong, and this is the test that catches it.
- [ ] The praise list ranks by delta: verify a case where an improving B− student outranks a steady A.
- [ ] The quiet-middle list names students the owner agrees they had lost track of. Ask them.
- [ ] Thresholds adjusted from defaults to what the owner actually wants, and the defaults in
      [`../../docs/data-model.md`](../../docs/data-model.md) updated if reality disagreed with them.
- [ ] `TESTING.md` Phase 4 section fully passing.

---

## WO-G4 — The 1.0.0 call

**Status** ⬜ NOT STARTED · **Size** S · **Depends on** every work order
**Closes roadmap** → "What 1.0.0 means"

**Why it exists.** *This is an argument, not a scoreboard, and ticking every box is the trigger for
the call, not the call itself.* Write the argument down; each criterion gets a sentence of evidence,
not a checkmark.

| Criterion | Bar | Evidence |
|---|---|---|
| Data loss possible under normal use | **No.** Eviction warned about, backups nagged, restore proven, conflicts never silently resolved. **The only absolute blocker.** | |
| Advertised features all work | Every README feature run end-to-end against real data | |
| A stranger can install it unaided | Install → first attendance mark, no documentation, no warning screen | |
| Attendance ledger correct | Taken / dropped / not-taken never confused, past-date marking works, percentages match hand counts across a term of a randomly shifting rotation | |
| Grade math correct | Weighted categories, redistribution, late/missing/excused, letter scale verified against hand-computed cases — including all-excused categories, zero-point assignments, a term with one assignment | |
| Signals honest | Every flag reproducible by hand. Praise ranks by delta | |
| Sensitive data contained | Accommodations invisible in presentation mode, absent from every merge field, named in `FERPA.md` | |
| Known limitations documented | Written down before launch, not discovered by a user | |
| Manual checklist passing | `TESTING.md` fully checked, on desktop and a real iPad | |
| Distribution decided | Name and channel settled | |

**Explicitly not required for 1.0:** an automated test suite, SIS integration, translation of
outreach, multi-teacher or admin accounts, and any vendor-hosted backend.

- [ ] Every row above has evidence written in, not a checkmark.
- [ ] Planbook has survived **a full term** in the classroom.
- [ ] Only then: Roll Call! may be considered for decommissioning. Until this box, it stays deployed.
- [ ] `CHANGELOG.md` has a real `## [1.0.0]` entry, tagged on `main`.
