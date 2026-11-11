// Named game scenarios for the browser tests (#184): only when the server runs with them on, and only by name.
import { afterAll, beforeAll, test } from 'vitest';
import assert from 'node:assert/strict';
import { server, config } from '../server/server.mjs';
import { myDecision } from '../src/lib/turn.js';
import { askedSeats } from '../src/lib/engine/game.js';

let base = '';

beforeAll(async () => {
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
	const address = /** @type {import('node:net').AddressInfo} */ (
		server.address()
	);
	base = `http://127.0.0.1:${address.port}/api/`;
	config.createLimit = 10_000;
	config.loginLimit = 10_000;
	config.apiLimit = 100_000;
	config.tablesPerAddress = 10_000;
});

afterAll(() => {
	config.scenarios = false;
	server.closeAllConnections();
	server.close();
});

/**
 * One API request.
 * @param {string} path
 * @param {Record<string, unknown>} [body] - Left out for a GET
 * @param {string} [token]
 * @returns {Promise<{ status: number, data: any }>}
 */
async function call(path, body, token) {
	const res = await fetch(base + path, {
		method: body === undefined ? 'GET' : 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		...(body !== undefined ? { body: JSON.stringify(body) } : {}),
	});
	const text = await res.text();
	return { status: res.status, data: text ? JSON.parse(text) : null };
}

/**
 * A hot-seat table for two with the expansions named, ready to start.
 * @param {string[]} expansions
 */
async function hotSeat(expansions) {
	const { token } = (await call('login', { name: 'Ana' })).data;
	let room = (
		await call(
			'create',
			{ options: { mode: 'hotseat', expansions } },
			token
		)
	).data;
	room = (
		await call('add-seat', { version: room.version, name: 'Bo' }, token)
	).data;
	return { token, room };
}

test('a scenario is refused unless the server runs with scenarios on (#184)', async () => {
	config.scenarios = false;
	const { token, room } = await hotSeat(['aa']);
	const answer = await call(
		'start',
		{ version: room.version, scenario: 'aa-card-places' },
		token
	);
	assert.equal(answer.status, 400, JSON.stringify(answer.data));
	assert.deepEqual(answer.data, {
		error: 'Scenarios are off on this server.',
	});
});

test('an unknown scenario, or one the table lacks the expansion for, is refused (#184)', async () => {
	config.scenarios = true;
	const unknown = await hotSeat(['aa']);
	const answer = await call(
		'start',
		{ version: unknown.room.version, scenario: 'no-such-thing' },
		unknown.token
	);
	assert.equal(answer.status, 400);
	assert.deepEqual(answer.data, { error: 'There is no such scenario.' });
	const base = await hotSeat([]);
	const without = await call(
		'start',
		{ version: base.room.version, scenario: 'aa-card-places' },
		base.token
	);
	assert.equal(without.status, 400);
	assert.deepEqual(without.data, {
		error: 'This scenario needs Arts & Architecture.',
	});
});

test("the A&A card places scenario asks where a Farm goes, Monuments' squares among the places, then the Forge with Astrolabe (#184)", async () => {
	config.scenarios = true;
	const { token, room } = await hotSeat(['aa']);
	const started = await call(
		'start',
		{ version: room.version, scenario: 'aa-card-places' },
		token
	);
	assert.equal(started.status, 200, JSON.stringify(started.data));
	const { game } = (await call('state', undefined, token)).data;
	const [seat] = askedSeats(game);
	const own = (await call(`state?seat=${seat}`, undefined, token)).data.game;
	const farm = myDecision(own, seat);
	assert.equal(farm?.kind, 'choosePlacement');
	assert.equal(farm?.building, 'farm');
	assert.ok(
		farm?.answers.some(
			(/** @type {any} */ a) => a.card === 'monuments' && a.row === 0
		)
	);
	const mine = own.seats[seat - 1];
	assert.ok(mine.tech.bottom.includes('astrolabe'));
	assert.ok(
		mine.incomeMat.tapestry.some(
			(/** @type {string[]} */ slot) => slot.at(-1) === 'monuments'
		)
	);
	// The Forge waits below the Farm.
	const ops = JSON.stringify(own.pending);
	assert.match(ops, /"forge"/);
	const latest = (await call('state', undefined, token)).data;
	await call('end', { version: latest.version }, token);
	await call('leave', {}, token);
});
