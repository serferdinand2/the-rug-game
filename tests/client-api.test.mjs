// The browser's API client (#25): sign-in, errors, the 409 retry and where a returning person lands, on a server at port 0.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { server, config } from '../server.mjs';
import { ApiError, createApi, withSession } from '../src/lib/api.js';
import { change, sameSeats } from '../src/lib/changes.js';
import { boot } from '../src/lib/boot.js';
import { seatToFetch, seatToShow, sendMove } from '../src/lib/moves.js';
import { myDecision } from '../src/lib/turn.js';

let base = '';

before(async () => {
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
after(() => {
	server.closeAllConnections();
	server.close();
});

/** A tab's sessionStorage, kept in a Map. */
function memory() {
	/** @type {Map<string, string>} */
	const items = new Map();
	return {
		/** @param {string} key */
		getItem: (key) => items.get(key) ?? null,
		/** @param {string} key @param {string} value */
		setItem: (key, value) => {
			items.set(key, String(value));
		},
		/** @param {string} key */
		removeItem: (key) => {
			items.delete(key);
		},
	};
}

/** A signed-in client, as one browser tab. @param {string} name */
async function tab(name) {
	const api = createApi({ base, fetch, storage: memory() });
	await api.signIn(name);
	return api;
}

test('signing in keeps the token and the name, and every request carries the token', async () => {
	const api = createApi({ base, fetch, storage: memory() });
	assert.equal(api.token(), null);
	assert.equal(await api.signIn('  Ana  '), 'Ana');
	assert.match(String(api.token()), /^[0-9a-f]{48}$/);
	assert.equal(api.name(), 'Ana');
	const me = await api.request('me');
	assert.equal(me.name, 'Ana');
});

test('a refused request throws an ApiError with the status and the server message', async () => {
	const api = await tab('Ana');
	await assert.rejects(api.request('join', { code: 'zzzzzzzz' }), {
		name: 'ApiError',
		status: 404,
		message: 'There is no table with that code.',
	});
});

test('a request the server never answers is an ApiError with status 0', async () => {
	const api = createApi({
		base,
		fetch: () => Promise.reject(new TypeError('fetch failed')),
		storage: memory(),
	});
	await assert.rejects(api.request('config'), {
		name: 'ApiError',
		status: 0,
		message: "Can't reach the server.",
	});
});

test('a 401 forgets the stored token, so the next step signs in again', async () => {
	const storage = memory();
	storage.setItem('rg-token', 'f'.repeat(48));
	const api = createApi({ base, fetch, storage });
	await assert.rejects(api.request('me'), { status: 401 });
	assert.equal(api.token(), null);
});

test('a change lands after someone else changed the table, while the seats stay the same', async () => {
	const ana = await tab('Ana');
	const bo = await tab('Bo');
	const created = await ana.request('create', { options: {} });
	const joined = await bo.request('join', { code: created.code });
	await bo.request('ready', { ready: true });
	const room = await change(
		ana.request,
		'configure',
		{ options: { version: 'original' } },
		joined
	);
	assert.equal(room.options.version, 'original');
	assert.equal(room.version, joined.version + 2);
});

test('a change refuses to guess when the seats changed, and carries the newer table', async () => {
	const ana = await tab('Ana');
	const bo = await tab('Bo');
	const created = await ana.request('create', { options: {} });
	await bo.request('join', { code: created.code });
	await assert.rejects(
		change(ana.request, 'remove-seat', { seat: 2 }, created),
		(/** @type {any} */ error) => {
			assert.ok(error instanceof ApiError);
			assert.equal(error.status, 409);
			assert.equal(error.message, 'The table changed. Try again.');
			assert.deepEqual(
				error.room.seats.map((/** @type {any} */ s) => s.name),
				['Ana', 'Bo']
			);
			return true;
		}
	);
	const now = await ana.request('state');
	assert.equal(now.seats.length, 2, 'nobody was removed');
});

test('a change built from the table is rebuilt from the newer one on a retry, so quick choices add up', async () => {
	const ana = await tab('Ana');
	const created = await ana.request('create', { options: {} });
	/** @param {string} id */
	const turnOn = (id) => (/** @type {any} */ room) => ({
		options: { variants: [...room.options.variants, id] },
	});
	// Both clicks start from the table as it was: the second meets a newer version.
	await change(ana.request, 'configure', turnOn('tapestry-draft'), created);
	const room = await change(
		ana.request,
		'configure',
		turnOn('civ-draft'),
		created
	);
	assert.deepEqual(room.options.variants, ['tapestry-draft', 'civ-draft']);
});

test('a session the server forgot is signed in again under the same name, and the action runs once more', async () => {
	const storage = memory();
	const api = createApi({ base, fetch, storage });
	await api.signIn('Ana');
	storage.setItem('rg-token', 'f'.repeat(48));
	const room = await withSession(api, '', () =>
		api.request('create', { options: {} })
	);
	assert.equal(room.seats[0].name, 'Ana');
	assert.notEqual(api.token(), 'f'.repeat(48));
});

test('a new name signs in as a new guest before the action', async () => {
	const api = await tab('Ana');
	const first = api.token();
	const room = await withSession(api, 'Bo', () =>
		api.request('create', { options: {} })
	);
	assert.equal(room.seats[0].name, 'Bo');
	assert.notEqual(api.token(), first);
});

test('two tables have the same seats only with the same names in the same order', () => {
	const seats = (/** @type {string[]} */ ...names) => ({
		seats: names.map((name, i) => ({ seat: i + 1, name, ready: i === 0 })),
	});
	assert.ok(sameSeats(seats('Ana', 'Bo'), seats('Ana', 'Bo')));
	assert.ok(!sameSeats(seats('Ana', 'Bo'), seats('Bo', 'Ana')));
	assert.ok(!sameSeats(seats('Ana'), seats('Ana', 'Bo')));
});

test('boot without a token is a guest with the table choices', async () => {
	const api = createApi({ base, fetch, storage: memory() });
	const booted = await boot(api);
	assert.equal(booted.me, null);
	assert.equal(booted.room, null);
	assert.ok(booted.config.versions.length > 0);
});

test('boot with a seated token comes back to the table', async () => {
	const api = await tab('Ana');
	const created = await api.request('create', { options: {} });
	const booted = await boot(api);
	assert.equal(booted.me.name, 'Ana');
	assert.equal(booted.room.code, created.code);
});

test('boot with a token at no table is a signed-in guest', async () => {
	const api = await tab('Ana');
	const booted = await boot(api);
	assert.equal(booted.me.name, 'Ana');
	assert.equal(booted.room, null);
});

test('boot with an expired token forgets it and starts as a guest', async () => {
	const storage = memory();
	storage.setItem('rg-token', 'f'.repeat(48));
	storage.setItem('rg-name', 'Ana');
	const api = createApi({ base, fetch, storage });
	const booted = await boot(api);
	assert.equal(booted.me, null);
	assert.equal(api.token(), null);
	assert.equal(api.name(), 'Ana', 'the name stays to fill the field');
});

test('two guests answer setup and their first turns with moves built from their own decisions (#26)', async () => {
	const ana = await tab('Ana');
	const bo = await tab('Bo');
	const created = await ana.request('create', { options: {} });
	await bo.request('join', { code: created.code });
	let room = await change(
		ana.request,
		'start',
		{},
		await ana.request('state')
	);
	const people = [ana, bo];
	let incomeTurns = 0;
	for (let step = 0; step < 200 && incomeTurns < 2; step++) {
		let moved = false;
		for (const [i, person] of people.entries()) {
			room = await person.request('state');
			const mine = myDecision(room.game, i + 1);
			if (!mine) {
				continue;
			}
			if (mine.kind === 'chooseTurn') {
				incomeTurns += 1;
			}
			room = await sendMove(person.request, room, null, {
				decision: mine.id,
				...mine.answers[0],
			});
			moved = true;
		}
		assert.ok(moved, 'somebody always has a decision');
	}
	assert.equal(incomeTurns, 2);
	assert.equal(room.game.phase, 'play');
});

test('a move with a stale version is refused with the newer table, and not sent again (#26)', async () => {
	const ana = await tab('Ana');
	const bo = await tab('Bo');
	const created = await ana.request('create', { options: {} });
	await bo.request('join', { code: created.code });
	const started = await change(
		ana.request,
		'start',
		{},
		await ana.request('state')
	);
	const mine = myDecision((await ana.request('state')).game, 1);
	// Bo moves first, so Ana's table is out of date.
	const theirs = myDecision((await bo.request('state')).game, 2);
	await sendMove(bo.request, await bo.request('state'), null, {
		decision: theirs.id,
		...theirs.answers[0],
	});
	await assert.rejects(
		sendMove(ana.request, started, null, {
			decision: mine.id,
			...mine.answers[0],
		}),
		(/** @type {any} */ error) => {
			assert.equal(error.status, 409);
			assert.equal(error.message, 'The table changed. Try again.');
			assert.ok(error.room.version > started.version);
			return true;
		}
	);
});

test('a hot-seat table shows the lowest seat being asked (#26)', () => {
	const game = {
		pending: [
			{
				id: 1,
				batch: 1,
				player: null,
				kind: 'group',
				lanes: [
					{
						player: 2,
						stack: [
							{ id: 2, batch: 2, player: 2, kind: 'chooseCiv' },
						],
					},
					{
						player: 3,
						stack: [
							{ id: 3, batch: 3, player: 3, kind: 'chooseCiv' },
						],
					},
				],
			},
		],
	};
	assert.equal(seatToShow({ mode: 'hotseat', game, you: [1, 2, 3] }), 2);
	assert.equal(seatToShow({ mode: 'online', game, you: [1] }), null);
	assert.equal(
		seatToShow({ mode: 'hotseat', game: null, you: [1, 2] }),
		null
	);
});

test('a hot-seat room for the wrong seat is swapped for the asked one, and the right one is taken as it is (#26)', () => {
	/** @param {number[]} asked */
	const gameAsking = (...asked) => ({
		pending: asked.map((player, i) => ({
			id: i + 1,
			batch: i + 1,
			player,
			kind: 'chooseTurn',
		})),
	});
	const room = (
		/** @type {number | null} */ viewing,
		/** @type {any} */ game
	) => ({
		mode: 'hotseat',
		you: [1, 2],
		viewing,
		game,
	});
	// Boot's public view: show the asked seat instead.
	assert.equal(seatToFetch(room(null, gameAsking(1)), null), 1);
	// The asked seat's own view: take it.
	assert.equal(seatToFetch(room(1, gameAsking(1)), 1), null);
	// A poll that still asked for the previous seat after the turn passed: fetch the new one.
	assert.equal(seatToFetch(room(1, gameAsking(2)), 1), 2);
	// Nobody is asked (the server is about to answer for someone): keep the seat on show.
	assert.equal(seatToFetch(room(2, gameAsking()), 2), null);
	assert.equal(seatToFetch(room(null, gameAsking()), 2), 2);
	// Online there is nothing to choose.
	assert.equal(
		seatToFetch(
			{ mode: 'online', you: [1], viewing: 1, game: gameAsking(2) },
			null
		),
		null
	);
});
