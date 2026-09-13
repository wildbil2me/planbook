# WO-5.11 — A web mail handler takes the PWA window with it · implementer result

**Implementer** Claude (Opus) · **Date** 2026-09-12 · **Tree** staged, uncommitted, no mutation in it.

The mutation proof was made and reverted (`git checkout -- index.html`, by name) before any of the
numbers below were written; `grep -n MUTATION index.html` is empty and `git diff index.html` against
the staged copy is empty.

## Acceptance, line by line

1. **👤 Laptop — Gmail registered as Chrome's `mailto:` handler, installed PWA, *Open in my mail app*
   opens a Gmail compose in a browser tab, filled, PWA still on the draft.** — **NOT TICKED.** Needs
   the owner's laptop with the handler registered; no headless run can see a protocol-handler table.
   The attribute is on the element and the harness reads it back (`target = "_blank"`), which is the
   whole of what a desk can show. Force-quit the installed app from the app switcher first — `CACHE`
   is `v114`, and a reload shows the old shell.
2. **👤 iPad — same tap opens Mail with the draft filled, no blank tab and no blank window, in Safari
   or installed.** — **NOT TICKED.** Needs the iPad, and it is the line that decides the work order:
   if Safari leaves a blank tab or window, the two attributes come out of `index.html` and the
   failure is written at the fourth bullet in `src/outreach-view.js`'s header, which already says so.
   Force-quit first.
3. **The contact-log entry is still written on the click; `tools/verify/contact-log.mjs` passes
   unchanged.** — **TICKED.** Not one byte of that file moved (`git diff --cached --stat` lists seven
   files and it is not among them). In the clean run its section is green: *"pressing the handoff
   appends exactly ONE entry…"* PASS, *"and the app does not intercept the link…"* PASS (hook found,
   no `preventDefault`, no `location`, harness listener still stopped the navigation), *"a BLOCKED
   draft writes nothing…"* PASS. It stayed green on the mutation run too. `target` changes where a
   followed link lands, not whether the click fires.
4. **A blocked draft is still not a link — no `href` — and the new check asserts the attributes only
   on a ready one.** — **TICKED.** The refused-merge-field check still reads
   `href: null, ariaDisabled: "true", focusable: false` (clean run line 1411, PASS). The new check sits
   after the three-check `href` trilogy on the ready praise draft and reads `href present = true,
   target = "_blank", rel = "noopener"`; nothing was added on the blocked draft. `paintOpen()` was
   read: it sets and strips `href`, `aria-disabled` and `aria-label` and nothing else, and never
   rebuilds the element, so the two static attributes survive every repaint — including the
   presentation-mode reset at `src/outreach-view.js:774`, which likewise touches only those two.
5. **The mutation — the attribute removed — turns exactly the new check red.** — **TICKED.**
   `target="_blank"` removed from the anchor in `index.html` (with a `MUTATION` HTML comment on the
   line while it was in). Run: `1343 checks · 1342 passed · 1 failed · 0 skipped`, 453s. The one FAIL
   line is the new check, evidence `href present = true, target = null, rel = "noopener"`. Nothing
   else moved — the contact-log section and the refused-draft check stayed green. Reverted by name,
   re-run clean: `1343 checks · 1343 passed · 0 failed · 0 skipped`, 451s.

## Runs, as read from their own output

| Run | Summary line | Lines | Time |
|---|---|---|---|
| Clean, delivered tree | `1343 checks · 1343 passed · 0 failed · 0 skipped` | 41,759 · 31.1/check | 450s |
| Mutated (`target` removed) | `1343 checks · 1342 passed · 1 failed · 0 skipped` | 41,759 | 453s |
| Clean, after revert | `1343 checks · 1343 passed · 0 failed · 0 skipped` | 41,759 | 451s |

`wo-sweep.mjs` on the finished tree: `42 checks · 39 passed · 0 failed · 3 to review`, the three
reviews the same three WO-5.7 recorded; § 22 reads 1333 call sites across 69 files, matching
`tools/README.md:1213`. `wo-gate.mjs WO-5.11`: gates clear, parses the ticked rows.

**All three harness runs hung at teardown after printing their full summary** — the
non-deterministic hang `TESTING.md` § WO-5.7 records. None printed an exit code; each was killed by
PID after the summary was read, taking only its own `node` and the headless Edge tree on its own
`pb-verify-*` temp profile. Two orphaned `pb-verify-*` Edge trees from earlier sittings today
(14:23 and 14:42, no living parent) were cleared before the first kill. So "the exit code" for each
run is my `taskkill`; the summary line is the reading, exactly as § WO-5.7 says to read it. Two of
the three runs started with zero strays on the machine and hung anyway, which takes WO-5.7's best
correlation (strays not cleared) off the table — recorded in the new TESTING block. Not this work
order's to fix; `tools/verify-shell.mjs` is untouched.

## Files changed (all staged)

- `c:\dev\planbook\index.html` — `target="_blank" rel="noopener"` on `#outreachOpen`, static, in the
  same attribute order the About modal's two links use; one sentence added to the existing *A REAL
  LINK* comment pointing at the header's fourth reason. No third comment.
- `c:\dev\planbook\src\outreach-view.js` — the *THE HANDOFF IS A REAL LINK* list goes from three
  reasons to four; the fourth says what a web handler does to a same-window `mailto:` (the Gmail URL,
  outside scope, no address bar, the owner's words), why `_blank` is safe for an OS handler (the
  scheme never touches the window, `target` ignored), why `noopener` is not optional, that the
  attributes are static and `paintOpen()` leaves them alone, that the iPad reading can reverse it,
  and that nothing detects or registers a handler. No code in the file changed.
- `c:\dev\planbook\tools\verify\outreach.mjs` — `drawn()` snapshot gains `target` and `rel`; the
  ready-draft `url` snapshot returns `hasHref`, `target`, `rel`; one `check()` after the `href`
  trilogy asserting `target === '_blank'` and `rel` containing `noopener` (regex on whitespace-
  delimited tokens, so `noopener noreferrer` would still pass and `noopenerx` would not).
- `c:\dev\planbook\tools\README.md` — count line 1332 → 1333; WO-5.11 entry after WO-5.7's, stating
  the mutation, the exact check it reddens, and both run totals.
- `c:\dev\planbook\sw.js` — `CACHE` `planbook-shell-v113` → `v114`.
- `c:\dev\planbook\TESTING.md` — new § WO-5.11 after § WO-5.9: the two 👤 lines verbatim and
  unticked, three desk-side lines ticked with evidence, the run totals, and the teardown-hang note.
- `c:\dev\planbook\plans\work-orders\phase-5-outreach.md` — Acceptance lines 3, 4, 5 ticked. Status
  left at `🤖 CLAIMED` for `--handoff`. The two 👤 boxes untouched.

Not touched, on purpose: `src/shell.js` (the delegated listener rides the click unchanged),
`tools/verify/contact-log.mjs`, `CHANGELOG.md`.

## Decisions the work order left open

- **Which attribute to mutate:** `target`, because it is the one that changes where the navigation
  lands; `rel` would have proved the regex and not the fix. Stated in both docs.
- **Where the check sits:** after the third check of the `href` trilogy rather than between the first
  and second, because checks two and three begin *"and it survives…"* / *"and all five characters…"*
  and read as a chain off the first; splitting them would have made the prose lie about its
  neighbour. It is still "beside the `href` check" — same snapshot, same draft, same block.
- **`rel` asserted as containing, not equal.** A later `noreferrer` beside it is not the defect.
- **The `index.html` comment is one sentence** and defers to the header, per the brief's "extend the
  first one with one sentence rather than writing a third." A first draft had three and was cut.

## Out-of-scope temptations declined

- Detecting whether the click opened anything (the `blur`/`visibilitychange` trick) to offer *Copy
  the draft* as a fallback — the Traps line forbids handler detection, and the app cannot see the
  protocol-handler table. Not built.
- Toggling `target`/`rel` in `paintOpen()` with the `href` — the brief's third trap; static markup.
- Touching `tools/verify-shell.mjs` for the teardown hang — three of three here; worth its own work
  order now, not this one.

## Draft CHANGELOG entry (for the teacher, not written to the file)

> *Open in my mail app* now opens in a new tab when your browser handles `mailto:` links itself —
> Gmail in Chrome, say — instead of replacing Planbook's own window with a bare compose page. If
> your computer hands mail links to a desktop app (Mail, Outlook), nothing changes. Still being
> checked on the iPad.

## What the verifier should re-run

`node tools/verify-shell.mjs` (expect 1343/1343; expect it to hang after the summary — read the
summary, kill it by PID, clear `pb-verify-*` Edge trees), `node tools/wo-sweep.mjs` (expect
42 · 39 · 0 · 3), and `grep -n MUTATION index.html` (expect nothing). The two 👤 lines are the owner's.
