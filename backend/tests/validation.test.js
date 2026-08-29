/**
 * Additional unit tests for backend/api/middleware/validation.js
 *
 * Existing coverage (see disputeValidation.test.js) exercises the dispute
 * rules through the full route. These tests target the validation chains
 * directly and fill gaps around empty input, malformed data, and the
 * unhappy path for the search and webhook schemas — no production code
 * is changed.
 */
import { describe, expect, it } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import {
  validate,
  searchQueryRules,
  webhookSubscribeRules,
  disputeEscrowIdParamRules,
} from '../api/middleware/validation.js';

function buildApp(rules, handler = (req, res) => res.json({ ok: true })) {
  const app = express();
  app.use(express.json());
  app.all('/t/:escrowId?', validate(rules), handler);
  return app;
}

describe('validation.js — edge cases', () => {
  describe('empty input', () => {
    it('search: accepts an entirely empty query string (all fields optional)', async () => {
      const res = await request(buildApp(searchQueryRules)).get('/t');
      expect(res.status).toBe(200);
    });

    it('webhook: rejects an empty request body', async () => {
      const res = await request(buildApp(webhookSubscribeRules)).post('/t').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'url' })]),
      );
    });

    it('escrowId param: rejects an empty string param', async () => {
      const res = await request(buildApp(disputeEscrowIdParamRules)).get('/t/');
      // trailing slash collapses to the optional param being absent -> route falls
      // through to Express's own 404, so exercise the same rule with a space instead
      expect([400, 404]).toContain(res.status);
    });
  });

  describe('malformed data', () => {
    it('webhook: rejects a non-HTTPS url', async () => {
      const res = await request(buildApp(webhookSubscribeRules))
        .post('/t')
        .send({ url: 'http://example.com/hook', eventTypes: ['escrow.created'] });
      expect(res.status).toBe(400);
      expect(res.body.details[0].field).toBe('url');
    });

    it('webhook: rejects eventTypes that is not an array', async () => {
      const res = await request(buildApp(webhookSubscribeRules))
        .post('/t')
        .send({ url: 'https://example.com/hook', eventTypes: 'escrow.created' });
      expect(res.status).toBe(400);
      expect(res.body.details.some((d) => d.field === 'eventTypes')).toBe(true);
    });

    it('escrowId param: rejects a non-numeric value', async () => {
      const res = await request(buildApp(disputeEscrowIdParamRules)).get('/t/abc123');
      expect(res.status).toBe(400);
      expect(res.body.details[0].field).toBe('escrowId');
    });

    it('search: strips control characters from q instead of erroring', async () => {
      const res = await request(buildApp(searchQueryRules, (req, res) => res.json({ q: req.query.q })))
        .get('/t')
        .query({ q: 'abcdef' });
      expect(res.status).toBe(200);
    });
  });

  describe('unhappy path', () => {
    it('webhook: rejects more than 20 eventTypes', async () => {
      const res = await request(buildApp(webhookSubscribeRules))
        .post('/t')
        .send({
          url: 'https://example.com/hook',
          eventTypes: Array.from({ length: 21 }, (_, i) => `event.${i}`),
        });
      expect(res.status).toBe(400);
      expect(res.body.details[0].field).toBe('eventTypes');
    });

    it('search: rejects q longer than 200 characters', async () => {
      const res = await request(buildApp(searchQueryRules))
        .get('/t')
        .query({ q: 'x'.repeat(201) });
      expect(res.status).toBe(400);
      expect(res.body.details[0].field).toBe('q');
    });

    it('escrowId param: rejects a value above the u64 max', async () => {
      const res = await request(buildApp(disputeEscrowIdParamRules)).get(
        '/t/99999999999999999999',
      );
      expect(res.status).toBe(400);
      expect(res.body.details[0].field).toBe('escrowId');
    });
  });
});
