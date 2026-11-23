import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkRateLimit,
  generateSessionToken,
  hashPassword,
  hashSessionToken,
  resetRateLimitsForTests,
  sanitizePlainText,
  verifyPassword,
} from './security.ts';

test('scrypt password hashing verifies matching password and rejects wrong password', async () => {
  const hash = await hashPassword('Vrindavan108!');
  assert.ok(hash.includes(':'));
  assert.equal(await verifyPassword('Vrindavan108!', hash), true);
  assert.equal(await verifyPassword('WrongPass123', hash), false);
});

test('session token generator produces unique tokens and deterministic SHA-256 hashes', () => {
  const a = generateSessionToken();
  const b = generateSessionToken();
  assert.notEqual(a.rawToken, b.rawToken);
  assert.equal(hashSessionToken(a.rawToken), a.tokenHash);
});

test('sanitizePlainText strips control characters and enforces max length', () => {
  const dirty = '  Hare\u0000 Krishna\u0007  ';
  assert.equal(sanitizePlainText(dirty, 20), 'Hare Krishna');
  assert.equal(sanitizePlainText('abcdef', 3), 'abc');
});

test('sliding-window rate limiter enforces max attempts', () => {
  resetRateLimitsForTests();
  assert.equal(checkRateLimit('ip1', 2, 60000).allowed, true);
  assert.equal(checkRateLimit('ip1', 2, 60000).allowed, true);
  const blocked = checkRateLimit('ip1', 2, 60000);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds >= 1);
});
