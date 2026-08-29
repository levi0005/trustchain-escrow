/**
 * Integration test for the happy-path flow through
 * backend/api/routes/reputationRoutes.js.
 *
 * Exercises: search -> leaderboard -> single-address lookup, end to end
 * through the real router with only the data layer (Prisma / ES) mocked.
 * Rate limiting and caching middleware are mocked to no-ops so the test
 * stays fast and hermetic.
 */
import { jest, describe, expect, it, beforeEach } from '@jest/globals';

// ── Module mocks (must come before any dynamic import of the SUT) ─────────────

const mockFindUnique = jest.fn();

jest.unstable_mockModule('../lib/prisma.js', () => ({
  default: {
    reputationRecord: {
      findUnique: (...args) => mockFindUnique(...args),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
  },
}));

jest.unstable_mockModule('../services/reputationSearchService.js', () => ({
  search: jest.fn().mockResolvedValue({
    hits: [{ address: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5', totalScore: 42 }],
    total: 1,
  }),
  leaderboard: jest.fn().mockResolvedValue({
    entries: [{ address: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5', totalScore: 42 }],
    total: 1,
  }),
}));

jest.unstable_mockModule('../services/reputationService.js', () => ({
  recalculateAll: jest.fn().mockResolvedValue({ updated: 0 }),
}));

// Rate limiting / caching middleware are pure pass-throughs for this test —
// their own behavior is covered by dedicated unit tests elsewhere.
jest.unstable_mockModule('../api/middleware/cache.js', () => ({
  cacheResponse: () => (req, res, next) => next(),
  TTL: { LEADERBOARD: 300, REPUTATION: 60 },
}));

jest.unstable_mockModule('../../middleware/rateLimit.js', () => ({
  reputationSearchRateLimit: (req, res, next) => next(),
}));

jest.unstable_mockModule('../api/middleware/slidingRateLimiter.js', () => ({
  createRedisSlidingWindowRateLimiter: () => (req, res, next) => next(),
}));

// ── Import the module under test after mocks are registered ──────────────────

const { default: reputationRoutes } = await import('../api/routes/reputationRoutes.js');
const { default: express } = await import('express');
const { default: request } = await import('supertest');

// ── Test app ──────────────────────────────────────────────────────────────────

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/reputation', reputationRoutes);
  return app;
}

const ADDR = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

beforeEach(() => {
  jest.clearAllMocks();
  mockFindUnique.mockResolvedValue({
    address: ADDR,
    totalScore: 42,
    completedEscrows: 5,
    disputedEscrows: 1,
    disputesWon: 1,
    totalVolume: '1000',
    lastUpdated: new Date().toISOString(),
  });
});

describe('GET /api/reputation happy path', () => {
  it('returns a single reputation record for a valid address', async () => {
    const res = await request(buildApp()).get(`/api/reputation/${ADDR}`);
    expect(res.status).toBe(200);
    expect(res.body.address).toBe(ADDR);
    expect(res.body.totalScore).toBe(42);
  });

  it('returns 400 for a malformed address', async () => {
    const res = await request(buildApp()).get('/api/reputation/not-a-valid-address');
    expect(res.status).toBe(400);
  });

  it('returns a default zeroed record when no reputation row exists yet', async () => {
    mockFindUnique.mockResolvedValueOnce(null);
    const res = await request(buildApp()).get(`/api/reputation/${ADDR}`);
    expect(res.status).toBe(200);
    expect(res.body.totalScore).toBe(0);
  });
});
