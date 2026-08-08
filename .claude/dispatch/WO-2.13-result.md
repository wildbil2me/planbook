Implemented correction round 1 and overwrote [WO-2.13-result.md](C:\dev\planbook\.claude\dispatch\WO-2.13-result.md).

Key outcomes:

- Fixed the active-filter detail-panel `TypeError` and stale filtered-row totals.
- Added exact dated-term/year assertions and coverage for `setMark()` and `unconfirmAll()`.
- Made the timing block compatible with pre-refactor `HEAD`.
- Persisted fixture restoration.
- Corrected the false on-disk claim that the harness was broken.
- Syntax checks, `git diff --check`, and `wo-sweep` completed with zero failures.

The current browser run and same-method timing pair remain honestly open because Edge still could not start inside this sandbox. The real-iPad acceptance line also remains unchecked.