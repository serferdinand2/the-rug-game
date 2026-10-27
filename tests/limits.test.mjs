// Rate limits and client addresses, tested without a running server.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { rateLimiter, clientAddress, addressKey } from '../server/limits.mjs';

test('each address may send a fixed number of requests per window', () => {
	const limiter = rateLimiter(3, 1000);
	for (let i = 0; i < 3; i++) {
		assert.equal(limiter.allow('a', 0), true);
	}
	assert.equal(limiter.allow('a', 999), false);
	assert.equal(
		limiter.allow('b', 999),
		true,
		'other addresses keep their own count'
	);
	assert.equal(
		limiter.allow('a', 1000),
		true,
		'a new window starts a new count'
	);
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
	const req = {
		headers: { 'x-forwarded-for': '198.51.100.250, 203.0.113.1' },
		socket: { remoteAddress: '10.0.0.1' },
	};
	assert.equal(
		clientAddress(req, true),
		'203.0.113.1',
		'the proxy appends the real client last'
	);
	assert.equal(
		clientAddress(req, false),
		'10.0.0.1',
		'without a trusted proxy the header is ignored'
	);
	assert.equal(
		clientAddress(
			{ headers: {}, socket: { remoteAddress: '10.0.0.2' } },
			true
		),
		'10.0.0.2',
		'no header falls back to the socket'
	);
});

test('a limit can be read each time, so it can change while the server runs', () => {
	let limit = 1;
	const limiter = rateLimiter(() => limit, 1000);
	assert.equal(limiter.allow('a', 0), true);
	assert.equal(limiter.allow('a', 0), false);
	limit = 3;
	assert.equal(limiter.allow('a', 0), true, 'the new limit counts at once');
});

test('limits count an IPv6 address by its /64 block, which one household or host holds', () => {
	assert.equal(addressKey('203.0.113.5'), '203.0.113.5');
	assert.equal(addressKey('::ffff:203.0.113.5'), '203.0.113.5');
	assert.equal(addressKey('2001:db8:1:2:3:4:5:6'), '2001:db8:1:2::/64');
	assert.equal(addressKey('2001:DB8:1:2:ffff::9'), '2001:db8:1:2::/64');
	assert.equal(addressKey('2001:db8::1'), '2001:db8:0:0::/64');
	assert.equal(addressKey('::1'), '0:0:0:0::/64');
	assert.equal(addressKey('fe80::1%en0'), 'fe80:0:0:0::/64');
	assert.equal(addressKey(undefined), 'unknown');
});
