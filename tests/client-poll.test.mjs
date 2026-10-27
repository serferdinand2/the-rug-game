// The client's long poll (#25): one request at a time, backing off on failures, and ending when the seat is gone.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { backoff, pollTable } from '../src/lib/poll.js';
import { ApiError } from '../src/lib/api.js';

/**
 * A fake request that plays out a script: each entry is a room view or an error to throw.
 * @param {any[]} script
 */
function scripted(script) {
	/** @type {string[]} */
	const asked = [];
	const request = async (/** @type {string} */ endpoint) => {
		asked.push(endpoint);
		const next = script.shift();
		if (next instanceof Error) {
			throw next;
		}
		return next;
	};
	return { request, asked };
}

test('the back-off waits 1, 2, 4 and 8 seconds, then 10', () => {
	assert.deepEqual(
		[1, 2, 3, 4, 5, 9].map(backoff),
		[1000, 2000, 4000, 8000, 10000, 10000]
	);
});

test('answers arrive in order, each request asking after the newest version', async () => {
	let version = 3;
	/** @type {number[]} */
	const accepted = [];
	const { request, asked } = scripted([{ version: 4 }, { version: 5 }]);
	await pollTable({
		request,
		version: () => version,
		accept: (room) => {
			accepted.push(room.version);
			version = room.version;
		},
		lost: () => assert.fail('not lost'),
		trouble: () => assert.fail('no trouble'),
		stopped: () => accepted.length === 2,
		wait: async () => {},
	});
	assert.deepEqual(asked, ['state?since=3', 'state?since=4']);
	assert.deepEqual(accepted, [4, 5]);
});

test('a failure backs off and reports the trouble, then the next answer is taken', async () => {
	/** @type {any[]} */
	const events = [];
	const { request } = scripted([
		new ApiError(0, "Can't reach the server."),
		new ApiError(500, 'Something went wrong. Try again.'),
		{ version: 2 },
	]);
	await pollTable({
		request,
		version: () => 1,
		accept: (room) => events.push(['accept', room.version]),
		lost: () => assert.fail('not lost'),
		trouble: (failures) => events.push(['trouble', failures]),
		stopped: () => events.some(([kind]) => kind === 'accept'),
		wait: async (ms) => {
			events.push(['wait', ms]);
		},
	});
	assert.deepEqual(events, [
		['trouble', 1],
		['wait', 1000],
		['trouble', 2],
		['wait', 2000],
		['accept', 2],
	]);
});

test('a 400 means the seat is gone: lost is called and the poll ends', async () => {
	/** @type {any[]} */
	const lostWith = [];
	const { request, asked } = scripted([
		new ApiError(400, "You aren't at this table."),
		{ version: 9 },
	]);
	await pollTable({
		request,
		version: () => 1,
		accept: () => assert.fail('nothing after the seat is gone'),
		lost: (error) => lostWith.push(error.message),
		trouble: () => assert.fail('no trouble'),
		stopped: () => false,
		wait: async () => {},
	});
	assert.deepEqual(lostWith, ["You aren't at this table."]);
	assert.equal(asked.length, 1);
});

test('a 401 means the session ended, which also loses the seat', async () => {
	let lost = 0;
	const { request } = scripted([new ApiError(401, 'Sign in again.')]);
	await pollTable({
		request,
		version: () => 1,
		accept: () => assert.fail('no answer'),
		lost: () => {
			lost += 1;
		},
		trouble: () => assert.fail('no trouble'),
		stopped: () => false,
		wait: async () => {},
	});
	assert.equal(lost, 1);
});

test('a stopped poll sends nothing more, and drops an answer that arrives after the stop', async () => {
	let stop = false;
	let accepted = 0;
	const { request, asked } = scripted([{ version: 2 }, { version: 3 }]);
	const slow = async (/** @type {string} */ endpoint) => {
		const room = await request(endpoint);
		stop = true;
		return room;
	};
	await pollTable({
		request: slow,
		version: () => 1,
		accept: () => {
			accepted += 1;
		},
		lost: () => assert.fail('not lost'),
		trouble: () => assert.fail('no trouble'),
		stopped: () => stop,
		wait: async () => {},
	});
	assert.equal(accepted, 0);
	assert.equal(asked.length, 1);
});

test('at a hot-seat table each request asks for the seat on show (#26)', async () => {
	let seat = 2;
	let answers = 0;
	const { request, asked } = scripted([{ version: 2 }, { version: 3 }]);
	await pollTable({
		request,
		version: () => 1 + answers,
		seat: () => seat,
		accept: () => {
			answers += 1;
			seat = 3;
		},
		lost: () => assert.fail('not lost'),
		trouble: () => assert.fail('no trouble'),
		stopped: () => answers === 2,
		wait: async () => {},
	});
	assert.deepEqual(asked, ['state?since=1&seat=2', 'state?since=2&seat=3']);
});
