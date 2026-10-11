# WO-1.78: implementer's result

**The owner's choice was option 2, "The kinds in full", and it is built.** `design/style-guide.html` now draws the three dialog kinds at their widths: `modal-confirm` 480, `modal-form` 640 and `modal-report` 900. Each is labelled as Planbook's and not the suite's. `design/style-guide.md` § 5 says the twin draws them. Nothing in `src/` moved, and no `CACHE` bump is owed because the page is not in `SHELL`. I committed nothing.

## Against the Acceptance list

**1. The owner's choice is recorded in `TESTING.md` § WO-1.78, and `design/style-guide.html` and `design/style-guide.md` agree with it.** [x]
- **`TESTING.md`:** I kept the orchestrator's heading and choice paragraph and added the evidence under them. There is no second heading.
- **`style-guide.html`, the CSS:**
  - `.modal-confirm` / `.modal-form` / `.modal-report` come right after `.modal-panel`, which is unchanged: still 480 with `max-width: 95vw`.
  - A comment above them is headed "THE THREE KINDS OF DIALOG — PLANBOOK'S, NOT YET THE SUITE'S". It states four things: width and never `max-width`, the 480 fallback, that they sit above the 640px block, and how an app keeping the single modal deletes them.
  - They are restated in the `(pointer: coarse)` block, as `src/shell.css` does.
  - The phone block `.modal-panel { width: 95vw; }` is still last.
- **`style-guide.html`, § 6 Components:** a new section is labelled "Dialog kinds — Planbook's, not yet the suite's". It has three openers and a note that says, in the page's own voice, that this is where Planbook departs from the suite's single 480 modal.
- **`style-guide.html`, the specimens:**
  - `#sgModal` keeps its id, its two openers and its text. It now wears `modal-confirm` and has one added sentence saying the suite's modal and Planbook's confirm are the same width.
  - `#sgModalForm` and `#sgModalReport` are new. The report specimen holds the kinds table.
- **`style-guide.md` § 5:** one paragraph added, saying the twin draws all three labelled as Planbook's. With that, the "kept in step by hand" sentence on line 18 is true again. Nothing in the `.md` said the twin shows one modal, so nothing else changed.
- **Evidence:** I made a scratch copy of the page with a probe script appended and opened it in headless Edge from `file://` with `--dump-dom`. The probe measured `offsetWidth` for each opener's panel:

  | Document width | Confirm (both openers) | Specimen | Form | Report |
  |---|---|---|---|---|
  | 1355px | 480 | 480 | 640 | 900 |
  | 955px | 480 | 480 | 640 | 900 |
  | 555px | 515 | 515 | 515 | 515 |

  At 555px all five are equal, so the phone block still wins. For each of the five openers: the close button gets focus on open; Escape, ✕ and a backdrop click each close it; focus returns to whichever button opened it. `window.onerror` collected nothing.
- **Read by eye:** whether the two files "agree" is a reading. I read both and they agree, but the verifier should read them too.

**2. `style-guide.html` still opens from `file://`, links no stylesheet and fetches nothing.** [x]
- **Opens:** it opened from `file:///…/sg.html` in headless Edge at three window widths, and the scripts ran without error. That was the scratch copy, which differs from the real file only by the probe.
- **The grep I ran:** `grep -nE '<link[^>]*stylesheet|@import|url\(|fetch\(|XMLHttpRequest|src=|https?://' design/style-guide.html`.
- **What it matched:** two lines only. Line 7 is the `data:` SVG favicon, and line ~1267 is its escaped copy inside § 11's `<pre>`. The `http://www.w3.org/2000/svg` in both is an XML namespace inside a `data:` URI, not a request.
- **The new script:** the code I added is inline in the existing `<script>` block and fetches nothing.

**3. `node tools/wo-sweep.mjs` is green.** [x]
- **Result:** `EXIT=0` with "50 checks · 47 passed · 0 failed · 3 to review". I re-ran it after ticking and got the same summary.
- **The three to-review items:** they are the standing ones (sensitive field names, due-date with late/missing, mockup banners). None of them names `design/style-guide.*`.
- **Coverage:** `STYLE` (wo-sweep.mjs:76) is every `.css`/`.html` file outside `tools/`, so the colour, no-variable, no-dark-mode and 44px greps did read the edited page.
- **Audit:** `wo-gate.mjs --audit` passes.
- **Also run:** `node tools/verify-shell.mjs`, because brief § 4 names it, even though it never opens `design/`. It ended `EXIT=0` with "2012 checks · 2012 passed · 0 failed · 0 skipped" (1081s). I read that from the finished log, not while it was still running.

**4. `TESTING.md` § WO-1.78 carries these lines verbatim with the evidence for each.** [x] The section has all four lines, verbatim, with evidence under each, plus two lines stating there is no 👤 and no 📆 line.

I ticked all four boxes in `plans/work-orders/phase-1-shell-store-roster.md`. None is 👤 or 📆, and each has evidence named above. I did not change the status (`🤖 CLAIMED`); `--tick` is the orchestrator's.

## Not verified
- **Touch-device widths:** under a real coarse pointer I did not emulate the touch pass. The restated rules there are the same three values, and the phone block follows them.
- **Reading by eye:** a human has not yet read the drawn panels for how they look next to each other. There is no iPad line in this work order.

## Mutations
None planted in the tree. The probe script lived only in the scratch copy. `grep -rn MUTATION design/` returns nothing.

## Decisions the work order didn't settle
- **The suite's modal and Planbook's confirm:** `#sgModal` wears `modal-confirm` rather than staying bare. Because the width is the same, the suite's specimen still reads as the suite's modal, and the page then practises the rule that every panel wears exactly one kind.
- **The touch-pass restatement:** I restated the kinds in the touch pass to mirror `src/shell.css` and the `.md`'s bullet, which says they "are restated in its `pointer: coarse` block". Copying the page therefore carries six lines. The note and the `.md` both say an app keeping the single modal deletes those six and nothing else.
- **The opener script:** I generalised it. A bare `data-modal-open` still opens `#sgModal`, and a value names the specimen. `#sgModalClose` keeps its id but is no longer looked up by id; the close button is found per overlay.
- **The page header comment:** I left its line "Change the app name … Nothing else is app-specific" alone. It is still true: the kinds travel with a copy and need no edit to work.

## Out of scope, declined
- **A table margin:** I gave the report specimen's table an inline `style="margin:10px 0"`, because `.modal-body p + p` does not space a `<p>` after a `<div>`. I did not touch the shared `.modal-body` rule.
- **The grade sheet override:** I did not mention the 980 `grades-report-panel` override in the twin. It is a Planbook screen, not a kind, and the `.md` already names it.

## Files changed
- `c:\dev\planbook\design\style-guide.html`
- `c:\dev\planbook\design\style-guide.md` (CRLF preserved: 191/191)
- `c:\dev\planbook\TESTING.md`
- `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md` (four boxes ticked)

## Draft CHANGELOG line (the teacher's call)
"The style guide's rendered page now shows Planbook's three dialog widths — confirm 480, form 640, report 900 — as openable specimens, labelled as this app's departure from the suite's single 480 modal."

## Correction round 1

The verifier's FAIL on Acceptance 1 was right: the copy-out instruction and the "deletes … and nothing
else" wording predated the change and were false on the new page. Repaired, prose only; no value, CSS
rule, markup element or script moved.

- `design/style-guide.html:20-26` — header comment, HOW TO USE IT step 2: now names the three dialog
  kinds as Planbook's, not yet the suite's, to keep or strip, and lists what stripping deletes.
- `design/style-guide.html:288-291` — CSS comment above `.modal-confirm`: "lose nothing else" kept
  (it is true of the CSS), plus a sentence that the page still SHOWS the kinds until the § 6 section,
  the two specimens and the confirm specimen's class and first paragraph also go.
- `design/style-guide.html:574-577` — the "How to carry this into another project" note (the same
  copy-out instruction in visible prose, found by the follow-up search) now names the dialog kinds as
  the one other app-specific thing.
- `design/style-guide.html:1046-1051` — § 6 "Dialog kinds" note: the strip list now covers the three
  rules, their three touch-pass restatements, this section, the form and report specimens, and the
  confirm specimen's `modal-confirm` class and first paragraph; the suite's 480 modal and its two
  original openers (html:1009-1010) survive.
- `design/style-guide.md:12-15` — copy-out sentence names the § 5 dialog kinds as Planbook's, to keep
  or strip.
- `design/style-guide.md:148-153` — § 5 paragraph's "deletes those six lines and nothing else" now
  lists the same strip set as the page.
- `TESTING.md` § WO-1.78 line 1 — box unticked; a "Correction round 1" paragraph records the
  first-pass FAIL, what was wrong, and what changed.
- `plans/work-orders/phase-1-shell-store-roster.md` — Acceptance box 1 unticked (it had been ticked).
  Status not touched; no `wo-gate` command run.

Search for any other false copy-out sentence: `grep -nE "nothing else|app-specific"` over both files
returns only the repaired lines. The footer's "Copy the file and go" (html footer) was left: it makes
no claim about what is app-specific.

Line 2 recheck (prose only, but re-run): `grep -nE '<link[^>]*stylesheet|@import|url\(|fetch\(|XMLHttpRequest|src=|https?://' design/style-guide.html`
matches only line 7 (the `data:` SVG favicon) and line 1280 (its escaped copy in § 11) — unchanged.
`grep -rn MUTATION design/` — nothing; no mutation was planted.

`node tools/wo-sweep.mjs` — `EXIT=0`, *50 checks · 47 passed · 0 failed · 3 to review* (the three
standing review items; none names `design/style-guide.*`). `verify-shell.mjs` was not re-run: it does
not open `design/`, and nothing it reads moved.

Not committed.

## Correction round 2

The verifier's second FAIL on Acceptance line 1: every strip list closed on "nothing else on the page
changes" (or "lose nothing else"), which was false — a literal strip leaves the "How to carry this"
sentence and several comments naming the kinds. Repaired on the owner's ruling, without enumerating
lines:

- `design/style-guide.md:152-153` — § 5 strip list now ends "... stay as they were — and every
  sentence and comment that names them." ("nothing else on the page changes" removed.)
- `design/style-guide.html:25-27` — header step 2 strip list now ends "..., and every sentence and
  comment that names them. Nothing else is app-specific." (That last sentence is about what a copy must
  rename, not about the strip, and stays — as does its twin at `style-guide.md:14-15`.)
- `design/style-guide.html:289-294` — CSS comment above the kinds: "and lose nothing else" removed; the
  list of what must go too now ends "and every sentence and comment that names them".
- `design/style-guide.html:1052-1053` — § 6 note: "and nothing else on the page changes" replaced by
  "— and every sentence and comment that names them".
- `grep -n "nothing else\|lose nothing"` over both files afterwards: only the two "Nothing else is
  app-specific" sentences remain; no stripping claim.
- `TESTING.md:4253` — "kept in step by hand" citation corrected from line 18 to line 20 (confirmed by
  `grep -n "kept in step" design/style-guide.md` → 20).
- `TESTING.md:4273-4283` — "Correction round 2" note added to line-1 evidence.

Acceptance box 1 left UNTICKED in TESTING.md and the phase file; row status untouched; no wo-gate
command run; nothing committed; no mutation planted.

`node tools/wo-sweep.mjs` → `EXIT=0`, `50 checks · 47 passed · 0 failed · 3 to review` (the three
standing review items; none names `design/style-guide.*`).
