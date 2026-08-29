# Issue 1: Document env vars used by `mfaAuth.js`

**Category:** Documentation | **Difficulty:** Beginner | **Priority:** Medium

## Problem

`backend/api/middleware/mfaAuth.js` reads `process.env.MFA_HIGH_VALUE_THRESHOLD`
(via `requireMfaForHighValue`) with no corresponding entry in
`backend/.env.example`, making local setup error-prone for new contributors.
(`MFA_JWT_SECRET`, the other secret consumed by this middleware, was already
documented in `.env.example` and validated at startup by `config/secrets.js`.)

## Changes

- `backend/.env.example` — added `MFA_HIGH_VALUE_THRESHOLD=10000` with a
  comment explaining it gates `requireMfaForHighValue` and pointing at the
  source file, right next to the existing `MFA_JWT_SECRET` entry.
- `README.md` — added a note under the "Configure environment" setup step
  referencing the new MFA-related `.env.example` entries.

## Files touched

- `backend/.env.example`
- `README.md`

## Acceptance criteria

- [x] Every env var read in `backend/api/middleware/mfaAuth.js` has a
      matching `.env.example` entry with a comment
- [x] README setup section references the new entries
