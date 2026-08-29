# Issue 3: Edge-case unit tests for `validation.js`

**Category:** Testing | **Difficulty:** Intermediate | **Priority:** Medium

## Problem

`backend/api/middleware/validation.js` had partial coverage (via
`backend/tests/disputeValidation.test.js`, which only exercises the dispute
rules through the full route) but was missing direct cases for empty input,
malformed data, and the unhappy path across the `search` and `webhook`
schemas.

## Changes

Added `backend/tests/validation.test.js`, which imports `validate()` and the
`searchQueryRules`, `webhookSubscribeRules`, and `disputeEscrowIdParamRules`
chains directly (no production code touched) and mounts them on a minimal
Express app via `supertest`, grouped into three describe blocks:

- **Empty input** — empty search query (all-optional fields), empty webhook
  body, empty escrowId param.
- **Malformed data** — non-HTTPS webhook URL, non-array `eventTypes`,
  non-numeric `escrowId`, control-character stripping in `q`.
- **Unhappy path** — `eventTypes` exceeding the 20-item cap, `q` exceeding
  the 200-char cap, `escrowId` above the u64 max.

10 new test cases total (more than the required 3), all against the
existing `validate()` response contract
(`{ error: 'Validation failed', details: [...] }`).

## Files touched

- `backend/tests/validation.test.js` (new)

## Acceptance criteria

- [x] At least 3 new test cases covering documented edge cases (10 added)
- [x] Tests pass in CI (pure unit tests, no external services)
- [x] No change to production code
