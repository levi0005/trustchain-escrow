# Issue 2: End-to-end happy-path test for `reputationRoutes.js`

**Category:** Testing | **Difficulty:** Intermediate | **Priority:** Low

## Problem

The happy-path flow through `backend/api/routes/reputationRoutes.js`
(`GET /api/reputation/:address`) had no integration test, so regressions in
routing, validation, or the controller's default-record fallback could slip
past CI undetected.

## Changes

Added `backend/tests/reputationRoutes.test.js`, which:

- Builds a real Express app mounting the actual `reputationRoutes` router
  (not a reimplementation).
- Mocks the data layer only (`lib/prisma.js`, `services/reputationSearchService.js`,
  `services/reputationService.js`) plus the rate-limit/cache middleware
  (converted to pass-throughs), following the same `jest.unstable_mockModule`
  pattern already used in `backend/tests/health.test.js` and
  `backend/tests/disputeValidation.test.js`.
- Exercises the full happy path: `GET /api/reputation/:address` for a valid
  Stellar address returns the stored record, an invalid address returns 400,
  and a missing record returns the documented zeroed default.

No production code changed. The test uses only mocked I/O so it runs in
well under 5s.

## Files touched

- `backend/tests/reputationRoutes.test.js` (new)

## Acceptance criteria

- [x] New integration test exercises the full flow start to finish
- [x] Test uses existing test fixtures/mocking patterns (mirrors
      `health.test.js` / `disputeValidation.test.js`)
- [x] Runs in under 5s (all dependencies mocked, no network/DB/Redis)
