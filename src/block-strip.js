/*
  THE WORDS THE BLOCK STRIP SAYS ON BOTH SCREENS (WO-5.5).

  ── WHY THERE IS A FILE HERE AT ALL, AND WHAT DECIDED ITS SHAPE ──

  Two surfaces draw the strip: src/templates-view.js's live preview and src/outreach-view.js's send
  flow. src/shell.css § UNRESOLVED already holds its PIXELS in one place, for the reason written
  there — one phase rule, one treatment, in the sheet they both load. This file is that same
  decision taken about its WORDS.

  It exists because WO-5.5's Traps line says "change it once" and there was nothing to change once.
  The two heads were hand-kept strings that HAPPENED to open alike — `'This draft cannot be sent · '`
  written out in each file — so the work order that rewrote the sentence had to remember to do it
  twice, which is the phase's own "two askers" defect waiting for whichever copy edit came next
  rather than one already made. **The work order left unify-or-change-in-step open and asked for the
  call to be written down: this file is the call.** Changing both by hand would have satisfied the
  Acceptance line today and left the next reader with two strings, no note, and no reason to think
  they were meant to agree.

  ── WHAT IS SHARED, AND WHAT IS DELIBERATELY NOT ──

  The rule for anything added here: **a string belongs in this file when both screens must say it
  word for word, and belongs on its screen when they must not.** Two do today.

  What is NOT here, and none of it is an oversight:

  - **The words after the `·`.** The preview counts FIELDS, because a template is what it is about;
    the send flow counts THINGS TO FIX, because a draft can also be blocked by a recipient with no
    address or by no message being chosen. src/outreach-view.js's paintBlock() argues that at its
    own point of departure and it is still true. What IS here is the SHAPE that carries them —
    blockHead() below — which is a different claim: the two screens must agree about the separator
    and about singular-or-plural, and they must not agree about the noun.
  - **The clear-state sentence.** The two screens say different things when nothing is wrong —
    "ready for your mail app" against "8 fields resolved" — so there is no shared sentence to lift,
    and a constant that is only accidentally equal is worse than two literals because it looks like
    a promise the code is not making.
  - **The per-field sentences.** Those are src/merge-fields.js's, printed as they were handed over,
    and WO-5.5's third Acceptance line fences that file out of this work order by name.

  IT DRAWS NOTHING, OWNS NO STATE, AND IMPORTS NOTHING. Two sentences, one composer, this comment.
*/

/*
  THE HEAD OF A BLOCKED STRIP — the owner's words, 2026-08-29, replacing "This draft cannot be sent".

  It describes the state rather than announcing a refusal, which is the whole of why it is better:
  a teacher who reads "has at least one undefined field" already knows what is wrong with her draft,
  where one who reads "cannot be sent" has only been told what the app will not do.

  "AT LEAST ONE" IS LOAD-BEARING and is what lets the count after the `·` be larger than one without
  the head becoming a lie — and, on the send flow, what keeps it true when a missing address is on
  the list beside the field.
*/
export const UNDEFINED_FIELD_HEAD = 'This draft has at least one undefined field';

/*
  WHAT TO DO ABOUT IT, WHICH NO RESOLVER CAN WRITE — WO-5.5's Deliverables draw that line and it is
  the reason this sentence is here rather than beside the ones in src/merge-fields.js. Every
  per-field sentence is about the TOKEN: what it was, why it did not become anything, which of the
  three failures it is. This one is about the BOX, and the box is the only thing on the screen the
  teacher can act on.

  ONE SCREEN PRINTS IT, AND THAT IS ARGUED IN src/templates-view.js's paintBlock() rather than here:
  the send flow's box holds ONE message to one person, and the editor's holds a template that every
  future draft is cut from. The sentence is shared so that the day the editor has an honest use for
  it, it says the same words.
*/
export const FIELD_FIX_SENTENCE = 'Remove the field or type what it should say over it — either '
  + 'one unblocks the draft.';

/*
  A HEAD, COMPOSED: a sentence, the middle dot, the count, and a noun that agrees with it.

  The two screens count different things and must go on doing so — see the header — but there is no
  reason on earth for them to disagree about the punctuation between the sentence and the number, or
  about which of them writes the plural. Both were written out by hand in two files until WO-5.5,
  which is how the heads came to be two strings that only looked like one. `sentence` and the two
  nouns are the caller's, because they are what differs; everything between them is not.

  IT TAKES BOTH NOUNS RATHER THAN ADDING AN `s`. "field did not resolve" pluralises to "fields did
  not resolve" — the change is not at the end of the phrase — and a helper that could only add a
  suffix would have sent one of its two callers back to writing the whole head by hand.
*/
export function blockHead(sentence, count, singular, plural) {
  return sentence + ' · ' + count + ' ' + (count === 1 ? singular : plural);
}
