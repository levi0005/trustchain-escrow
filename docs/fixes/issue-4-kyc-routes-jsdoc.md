# Issue 4: JSDoc for `kycRoutes.js`

**Category:** Documentation | **Difficulty:** Beginner | **Priority:** Medium

## Problem

Handlers wired up in `backend/api/routes/kycRoutes.js` lacked JSDoc
annotations, making IDE hover hints and generated docs incomplete.

## Changes

Added `@param`/`@returns` JSDoc blocks (comments only, no behavior change)
for:

- `captureRawBody` — the raw-body-capturing middleware used ahead of the
  Sumsub webhook handler.
- `POST /token`, `GET /status/:address`, `POST /webhook`, and
  `GET /admin` route handlers — each block documents the `req`/`res`
  shape and links related middleware (e.g. `captureRawBody`) with
  `{@link}`.

## Files touched

- `backend/api/routes/kycRoutes.js`

## Acceptance criteria

- [x] Every exported/handler function in `kycRoutes.js` has a JSDoc block
- [x] No behavior change — comments only
- [x] `npm run lint` expected to pass with no new warnings (JSDoc comments
      only; not run per task instructions)
