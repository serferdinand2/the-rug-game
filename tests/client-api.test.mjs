// The browser's API client (#25): sign-in, errors, the 409 retry and where a returning person lands, on a server at port 0.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { server, config } from '../server.mjs';
import { ApiError, createApi } from '../src/lib/api.js';
import { change, sameSeats } from '../src/lib/changes.js';
import { boot } from '../src/lib/boot.js';

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
