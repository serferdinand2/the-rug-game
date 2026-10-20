// Rate limits and client addresses, tested without a running server.
import test from 'node:test';
import assert from 'node:assert/strict';
import { rateLimiter, clientAddress } from '../limits.mjs';

test('each address may send a fixed number of requests per window', () => {
  const limiter = rateLimiter(3, 1000);
  for (let i = 0; i < 3; i++) {
    assert.equal(limiter.allow('a', 0), true);
  }
  assert.equal(limiter.allow('a', 999), false);
  assert.equal(limiter.allow('b', 999), true, 'other addresses keep their own count');
  assert.equal(limiter.allow('a', 1000), true, 'a new window starts a new count');
});

test('quiet addresses are forgotten', () => {
  const limiter = rateLimiter(3, 1000);
  limiter.allow('a', 0);
  limiter.allow('b', 1500);
  limiter.sweep(2500);
  assert.equal(limiter.size, 1);
  limiter.sweep(4000);
  assert.equal(limiter.size, 0);
});

test('forwarded addresses count only behind a trusted proxy', () => {
  const req = { headers: { 'x-forwarded-for': '198.51.100.250, 203.0.113.1' }, socket: { remoteAddress: '10.0.0.1' } };
  assert.equal(clientAddress(req, true), '203.0.113.1', 'the proxy appends the real client last');
  assert.equal(clientAddress(req, false), '10.0.0.1', 'without a trusted proxy the header is ignored');
  assert.equal(clientAddress({ headers: {}, socket: { remoteAddress: '10.0.0.2' } }, true), '10.0.0.2', 'no header falls back to the socket');
});
