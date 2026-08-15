# WO-3.15 result — a way to add an assignment from the score grid

Implemented, but **not marked done** because `node tools/verify-shell.mjs` could not run in this sandbox. Edge never wrote `DevToolsActivePort`; this is an environment limitation, not a pass or app failure.

What changed:

- Added the exact existing `+ New assignment` button to `#scoresActions`.
- Reused the existing delegated creator and `afterAssignmentChange()` repaint chain.
- Added an explicit shared-editor Cancel for newly created assignments. It removes the assignment and empty score column from either entry surface.
- Preserved autosave behavior for Done, Close, Escape, and backdrop dismissal.
- Deliberately returns focus to the stable grid `+ New assignment` button.
- Added WO-3.15 behavior and ≥44px checks inside the existing WO-3.5 harness block.
- Bumped the service-worker cache from v60 to v61.

Acceptance status:

1. Implemented, not verified here.
2. Implemented, not verified here.
3. Implemented through the shared path, not verified here.
4. Measurement added, not verified here.
5. Not verified; requires a real iPad and remains unticked.

Verification:

- JavaScript syntax checks: passed.
- `node tools/wo-sweep.mjs`: exit 0 — 18 checks, 14 passed, 0 failed, 4 advisory reviews.
- `git diff --check`: passed.
- `node tools/verify-shell.mjs`: **could not run** because Edge did not create `DevToolsActivePort`.
- No acceptance boxes were ticked; WO-3.15 remains CLAIMED.
- `CHANGELOG.md` was not touched.

The required report was written as the final filesystem action: [.claude/dispatch/WO-3.15-result.md](C:/dev/planbook/.claude/dispatch/WO-3.15-result.md).

Required local follow-up:

```text
node tools/verify-shell.mjs
node tools/wo-sweep.mjs
```

If the browser harness is green locally, acceptance lines 1–4 can be evaluated and ticked. Line 5 still requires the owner on a real iPad.