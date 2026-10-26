// The table API over HTTP (#23): sessions, the endpoints, version checks and long polling, on a server at port 0.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { server, config, api } from '../server.mjs';
import { tableChoices } from '../rooms.mjs';

/** @typedef {{ status: number, data: any }} Answer */

let base = '';
/** The limits as the server starts with them, restored after each test that changes one. */
const defaults = { ...config };

before(async () => {
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
	const address = /** @type {import('node:net').AddressInfo} */ (
		server.address()
	);
	base = `http://127.0.0.1:${address.port}/api/`;
	// Every test here comes from one address, so the per-address limits are raised; their own tests lower them.
	config.createLimit = 10_000;
	config.loginLimit = 10_000;
	config.apiLimit = 100_000;
	config.tablesPerAddress = 10_000;
});
after(() => {
	server.closeAllConnections();
	server.close();
});

/**
 * Calls the API.
 * @param {string} path - After /api/, with any query
 * @param {{ body?: unknown, token?: string, method?: string, raw?: string }} [options]
 * @returns {Promise<Answer>}
 */
async function call(path, { body, token, method, raw } = {}) {
	const res = await fetch(base + path, {
		method:
			method ??
			(body === undefined && raw === undefined ? 'GET' : 'POST'),
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		...(raw !== undefined
			? { body: raw }
			: body !== undefined
				? { body: JSON.stringify(body) }
				: {}),
	});
	const text = await res.text();
	return { status: res.status, data: text ? JSON.parse(text) : null };
}

/**
 * A new guest session.
 * @param {string} name
 * @returns {Promise<{ token: string, name: string }>}
 */
async function login(name) {
	const answer = await call('login', { body: { name } });
	assert.equal(answer.status, 200, JSON.stringify(answer.data));
	return answer.data;
}

/**
 * An online table: the first person creates it, the others join in order.
 * @param {...string} names
 */
async function table(...names) {
	const people = [];
	for (const name of names) {
		people.push(await login(name));
	}
	let room = (await call('create', { body: {}, token: people[0].token }))
		.data;
	for (const person of people.slice(1)) {
		room = (
			await call('join', {
				body: { code: room.code },
				token: person.token,
			})
		).data;
	}
	return { people, room };
}

/**
 * Asserts the answer's status and error message.
 * @param {Answer} answer
 * @param {number} status
 * @param {string} [error]
 */
function refused(answer, status, error) {
	assert.equal(answer.status, status, JSON.stringify(answer.data));
	if (error !== undefined) {
		assert.deepEqual(answer.data, { error });
	}
}

test('a guest signs in with a name and gets a token', async () => {
	const guest = await login('  Ana  ');
	assert.equal(guest.name, 'Ana');
	assert.match(guest.token, /^[0-9a-f]{48}$/);
	const me = await call('me', { token: guest.token });
	assert.deepEqual(me, { status: 200, data: { name: 'Ana', code: null } });
	refused(
		await call('login', { body: { name: '   ' } }),
		400,
		'Enter a name.'
	);
	refused(await call('me'), 401, 'Sign in again.');
	refused(await call('me', { token: 'nope' }), 401, 'Sign in again.');
});

test('the config lists the table choices and the long-poll wait', async () => {
	const answer = await call('config');
	assert.equal(answer.status, 200);
	assert.deepEqual(answer.data, {
		...tableChoices(),
		longPollMs: config.longPollMs,
	});
});

test('creating and joining a table answer the room view, with the table version', async () => {
	const { people, room } = await table('Ana', 'Bo');
	assert.equal(room.version, 2);
	assert.match(room.code, /^[0-9a-f]{8}$/);
	assert.deepEqual(room.seats, [
		{ seat: 1, name: 'Ana', away: false },
		{ seat: 2, name: 'Bo', away: false },
	]);
	assert.deepEqual(room.you, [2]);
	assert.equal(room.host, 1);
	const me = await call('me', { token: people[1].token });
	assert.equal(me.data.code, room.code);
	const original = await call('create', {
		body: { options: { version: 'original' } },
		token: (await login('Cy')).token,
	});
	assert.equal(original.data.options.version, 'original');
	assert.equal(original.data.version, 1);
});

test('a code is found in any case, and an unknown one is 404', async () => {
	const { room } = await table('Ana');
	const bo = await login('Bo');
	const joined = await call('join', {
		body: { code: ` ${room.code.toUpperCase()} ` },
		token: bo.token,
	});
	assert.equal(joined.status, 200);
	refused(
		await call('join', {
			body: { code: 'ffffffff' },
			token: (await login('Cy')).token,
		}),
		404,
		'There is no table with that code.'
	);
});

test('a person sits at one table at a time', async () => {
	const { people, room } = await table('Ana');
	refused(
		await call('create', { body: {}, token: people[0].token }),
		400,
		'Leave your table first.'
	);
	const other = await table('Bo');
	refused(
		await call('join', {
			body: { code: other.room.code },
			token: people[0].token,
		}),
		400,
		'Leave your table first.'
	);
	assert.equal(
		(
			await call('join', {
				body: { code: room.code },
				token: people[0].token,
			})
		).status,
		200,
		'joining your own table again is fine'
	);
});

test('the open tables are the online lobbies with a free seat', async () => {
	const { people, room } = await table('Open host', 'Open guest');
	const listed = (await call('tables')).data.tables.find(
		(/** @type {any} */ t) => t.code === room.code
	);
	assert.deepEqual(listed, {
		code: room.code,
		host: 'Open host',
		seats: 2,
		version: 'current',
		expansions: [],
	});
	await call('start', {
		body: { version: room.version },
		token: people[0].token,
	});
	const after = (await call('tables')).data.tables;
	assert.ok(!after.some((/** @type {any} */ t) => t.code === room.code));
});

test('bad requests get clear statuses', async () => {
	const { token } = await login('Ana');
	refused(
		await call('create', { raw: '{', token }),
		400,
		'Send the request as a JSON object.'
	);
	refused(
		await call('create', { raw: '[1]', token }),
		400,
		'Send the request as a JSON object.'
	);
	refused(
		await call('create', {
			raw: JSON.stringify({ name: 'x'.repeat(17_000) }),
			token,
		}),
		413,
		'That request is too large.'
	);
	refused(
		await call('create', { method: 'GET', token }),
		405,
		'Use POST for this request.'
	);
	refused(
		await call('state', { body: {}, token }),
		405,
		'Use GET for this request.'
	);
	refused(await call('nothing', { token }), 404, 'Unknown request.');
	refused(await call('state', { token }), 400, "You aren't at this table.");
	refused(
		await call('create', {
			body: { options: { expansions: 'pp' } },
			token,
		}),
		400,
		'The expansions must be a list.'
	);
});

test('a move, a start or any change with a stale version gets 409 and changes nothing', async () => {
	const { people, room } = await table('Ana', 'Bo');
	const [ana] = people;
	const changes = /** @type {[string, Record<string, unknown>][]} */ ([
		['configure', { options: { version: 'original' } }],
		['start', {}],
		['remove-seat', { seat: 2 }],
		['end', {}],
		['move', { seat: 1, action: { decision: 1 } }],
	]);
	for (const [path, body] of changes) {
		refused(
			await call(path, {
				body: { ...body, version: room.version - 1 },
				token: ana.token,
			}),
			409,
			'The table changed. Try again.'
		);
	}
	const state = await call('state', { token: ana.token });
	assert.equal(state.data.version, room.version);
	assert.equal(state.data.phase, 'lobby');
	assert.equal(state.data.options.version, 'current');
});

test('changes with the current version go through the room rules', async () => {
	const { people, room } = await table('Ana', 'Bo');
	const [ana, bo] = people;
	let state = (
		await call('configure', {
			body: { version: room.version, options: { version: 'original' } },
			token: ana.token,
		})
	).data;
	assert.equal(state.options.version, 'original');
	assert.equal(state.version, room.version + 1);
	refused(
		await call('start', {
			body: { version: state.version },
			token: bo.token,
		}),
		400,
		'Only the host can start the game.'
	);
	state = (
		await call('start', {
			body: { version: state.version },
			token: ana.token,
		})
	).data;
	assert.equal(state.phase, 'playing');
	const unchanged = await call('configure', {
		body: { version: state.version, options: { version: 'current' } },
		token: ana.token,
	});
	refused(unchanged, 400, 'The game has already started.');
	assert.equal(
		(await call('state', { token: ana.token })).data.version,
		state.version
	);
});

test('a move answers a decision for your own seat only', async () => {
	const { people, room: lobby } = await table('Ana', 'Bo');
	const [ana, bo] = people;
	const room = (
		await call('start', {
			body: { version: lobby.version },
			token: ana.token,
		})
	).data;
	const mine = ownDecision(room);
	refused(
		await call('move', {
			body: { version: room.version, seat: 2, action: mine.action },
			token: ana.token,
		}),
		400,
		"That seat isn't yours."
	);
	const moved = await call('move', {
		body: { version: room.version, action: mine.action },
		token: ana.token,
	});
	assert.equal(moved.status, 200, JSON.stringify(moved.data));
	assert.equal(moved.data.version, room.version + 1);
	refused(
		await call('move', {
			body: { version: room.version, action: mine.action },
			token: ana.token,
		}),
		409,
		'The table changed. Try again.'
	);
	const theirs = (await call('state', { token: bo.token })).data;
	assert.equal(theirs.version, moved.data.version);
	assert.ok(!('picks' in theirs.game.seats[0]), "Bo doesn't see Ana's picks");
});

/**
 * The first open decision the viewer may answer in a room view, with its first answer, as a move's action.
 * @param {any} room
 * @returns {{ seat: number, action: Record<string, unknown> }}
 */
function ownDecision(room) {
	const ops = room.game.pending.flatMap((/** @type {any} */ op) =>
		op.kind === 'group'
			? op.lanes.flatMap((/** @type {any} */ l) => l.stack)
			: [op]
	);
	const open = ops.find((/** @type {any} */ op) => op.answers?.length > 0);
	assert.ok(open, 'the viewer has an open decision');
	return {
		seat: open.player,
		action: { decision: open.id, ...open.answers[0] },
	};
}

test('a long-poll request answers at once when the table is newer', async () => {
	const { people, room } = await table('Ana');
	const started = Date.now();
	const answer = await call(`state?since=${room.version - 1}`, {
		token: people[0].token,
	});
	assert.equal(answer.status, 200);
	assert.equal(answer.data.version, room.version);
	assert.ok(Date.now() - started < 1000);
});

test('a long-poll request wakes when someone else changes the table', async () => {
	const { people, room } = await table('Ana');
	const bo = await login('Bo');
	const started = Date.now();
	const waiting = call(`state?since=${room.version}`, {
		token: people[0].token,
	});
	await new Promise((resolve) => setTimeout(resolve, 100));
	await call('join', { body: { code: room.code }, token: bo.token });
	const answer = await waiting;
	assert.equal(answer.status, 200);
	assert.equal(answer.data.version, room.version + 1);
	assert.equal(answer.data.seats[1].name, 'Bo');
	assert.ok(
		Date.now() - started < config.longPollMs,
		'on the change, not the wait'
	);
});

test('a long-poll request answers unchanged when nothing happens', async () => {
	config.longPollMs = 150;
	try {
		const { people, room } = await table('Ana');
		const started = Date.now();
		const answer = await call(`state?since=${room.version}`, {
			token: people[0].token,
		});
		assert.equal(answer.status, 200);
		assert.equal(answer.data.version, room.version);
		assert.ok(Date.now() - started >= 140);
	} finally {
		config.longPollMs = defaults.longPollMs;
	}
});

test('a long-poll request learns when its seat is removed or its table expires', async () => {
	const { people, room } = await table('Ana', 'Bo');
	const [ana, bo] = people;
	const removed = call(`state?since=${room.version}`, { token: bo.token });
	await new Promise((resolve) => setTimeout(resolve, 50));
	await call('remove-seat', {
		body: { version: room.version, seat: 2 },
		token: ana.token,
	});
	refused(await removed, 400, "You aren't at this table.");
	const now = (await call('state', { token: ana.token })).data;
	const expired = call(`state?since=${now.version}`, { token: ana.token });
	await new Promise((resolve) => setTimeout(resolve, 50));
	api.sweep(Date.now() + 2 * 24 * 60 * 60 * 1000);
	refused(await expired, 400, "You aren't at this table.");
});

test('a long-poll request that its client gives up leaves nothing waiting', async () => {
	const { people, room } = await table('Ana');
	const before = api.waiting();
	const aborts = new AbortController();
	const pending = fetch(`${base}state?since=${room.version}`, {
		headers: { Authorization: `Bearer ${people[0].token}` },
		signal: aborts.signal,
	}).catch(() => null);
	await new Promise((resolve) => setTimeout(resolve, 50));
	assert.equal(api.waiting(), before + 1);
	aborts.abort();
	await pending;
	await new Promise((resolve) => setTimeout(resolve, 50));
	assert.equal(api.waiting(), before);
});

test('leaving a running game keeps the seat, holds the person, and joining back restores it', async () => {
	const { people, room: lobby } = await table('Ana', 'Bo');
	const [ana, bo] = people;
	const room = (
		await call('start', {
			body: { version: lobby.version },
			token: ana.token,
		})
	).data;
	const left = await call('leave', { body: {}, token: bo.token });
	assert.deepEqual(left, {
		status: 200,
		data: { saved: true, code: room.code },
	});
	assert.equal((await call('me', { token: bo.token })).data.code, null);
	refused(
		await call('state', { token: bo.token }),
		400,
		"You aren't at this table."
	);
	refused(
		await call('create', { body: {}, token: bo.token }),
		400,
		`You still have a seat in a game at table ${room.code}. Return to it with that code first.`
	);
	const seen = (await call('state', { token: ana.token })).data;
	assert.equal(seen.seats[1].away, true);
	const back = await call('join', {
		body: { code: room.code },
		token: bo.token,
	});
	assert.equal(back.status, 200);
	assert.equal(back.data.seats[1].away, false);
	assert.deepEqual(back.data.you, [2]);
});

test('the last person out of a lobby closes it', async () => {
	const { people, room } = await table('Ana');
	assert.deepEqual(
		await call('leave', { body: {}, token: people[0].token }),
		{
			status: 200,
			data: { saved: false, code: room.code },
		}
	);
	refused(
		await call('join', {
			body: { code: room.code },
			token: people[0].token,
		}),
		404,
		'There is no table with that code.'
	);
	refused(
		await call('leave', { body: {}, token: people[0].token }),
		400,
		"You aren't at this table."
	);
});

/**
 * The first open decision a room view lets its viewer answer, or undefined.
 * @param {any} room
 */
function openFor(room) {
	return room.game.pending
		.flatMap((/** @type {any} */ op) =>
			op.kind === 'group'
				? op.lanes.flatMap((/** @type {any} */ lane) => lane.stack)
				: [op]
		)
		.find((/** @type {any} */ op) => op.answers?.length > 0);
}

test('two clients play a whole game over HTTP, each answering only its own decisions', async () => {
	const { people, room: lobby } = await table('Ana', 'Bo');
	await call('start', {
		body: { version: lobby.version },
		token: people[0].token,
	});
	let moves = 0;
	let stale = 0;
	/**
	 * One client: long-polls its own view and answers its own open decisions with their first answer, at the same
	 * time as the other client, until the game is over.
	 * @param {{ token: string }} person
	 * @param {number} other - The other client's seat
	 */
	async function client(person, other) {
		let since = -1;
		for (let step = 0; step < 3000; step++) {
			const polled = await call(`state?since=${since}`, {
				token: person.token,
			});
			assert.equal(polled.status, 200, JSON.stringify(polled.data));
			const room = polled.data;
			const theirs = room.game.seats[other - 1];
			assert.ok(
				!('hand' in theirs),
				"the other seat's hand stays hidden"
			);
			assert.ok(
				!('picks' in theirs),
				"the other seat's picks stay hidden"
			);
			if (room.game.phase === 'over') {
				return room;
			}
			const open = openFor(room);
			since = room.version;
			if (!open) {
				continue;
			}
			const moved = await call('move', {
				body: {
					version: room.version,
					action: { decision: open.id, ...open.answers[0] },
				},
				token: person.token,
			});
			if (moved.status === 409) {
				stale += 1;
			} else {
				assert.equal(moved.status, 200, JSON.stringify(moved.data));
				moves += 1;
			}
			// Look again at once: the table has changed, by this move or the other client's.
			since = room.version - 1;
		}
		throw new Error('The game never ended.');
	}
	const [first, second] = await Promise.all([
		client(people[0], 2),
		client(people[1], 1),
	]);
	assert.equal(first.phase, 'finished');
	assert.deepEqual(first.game.result, second.game.result);
	assert.ok(moves > 10, `${moves} moves (${stale} stale)`);
});

test('a hot-seat host plays every seat through one session', async () => {
	const host = await login('Ana');
	const { token } = host;
	let room = (
		await call('create', { body: { options: { mode: 'hotseat' } }, token })
	).data;
	room = (
		await call('add-seat', {
			body: { version: room.version, name: 'Bo' },
			token,
		})
	).data;
	assert.deepEqual(room.you, [1, 2]);
	refused(
		await call('join', {
			body: { code: room.code },
			token: (await login('Cy')).token,
		}),
		400,
		'This table is played on one screen.'
	);
	room = (await call('start', { body: { version: room.version }, token }))
		.data;
	assert.equal(
		room.viewing,
		null,
		'the public view until a seat is asked for'
	);
	assert.ok(room.game.seats.every((/** @type {any} */ s) => !('picks' in s)));
	const second = (await call('state?seat=2', { token })).data;
	assert.equal(second.viewing, 2);
	assert.ok('picks' in second.game.seats[1]);
	assert.ok(!('picks' in second.game.seats[0]));
	refused(
		await call('state?seat=3', { token }),
		400,
		"That seat isn't yours."
	);
	const open = openFor(second);
	const action = { decision: open.id, ...open.answers[0] };
	refused(
		await call('move', {
			body: { version: second.version, action },
			token,
		}),
		400,
		'Choose the seat you are playing.'
	);
	const moved = await call('move', {
		body: { version: second.version, seat: 2, action },
		token,
	});
	assert.equal(moved.status, 200, JSON.stringify(moved.data));
	assert.equal(moved.data.viewing, 2);
});

test('creating tables and signing in are limited per address', async () => {
	// Forget this address's counts from the earlier tests.
	api.sweep(Date.now() + 3 * 60_000);
	config.createLimit = 2;
	config.loginLimit = 3;
	try {
		const { token } = await login('Ana');
		for (let i = 0; i < 2; i++) {
			assert.equal(
				(await call('create', { body: {}, token })).status,
				200
			);
			await call('leave', { body: {}, token });
		}
		refused(
			await call('create', { body: {}, token }),
			429,
			'Too many requests. Try again shortly.'
		);
		await login('Bo');
		await login('Cy');
		refused(
			await call('login', { body: { name: 'Dee' } }),
			429,
			'Too many requests. Try again shortly.'
		);
	} finally {
		config.createLimit = 10_000;
		config.loginLimit = 10_000;
	}
});

test('a session at no table ends after an hour unused, one at a table after a day', async () => {
	config.idleSessionMs = 50;
	config.sessionMs = 400;
	try {
		const idle = await login('Ana');
		const seated = await login('Bo');
		await call('create', { body: {}, token: seated.token });
		await new Promise((resolve) => setTimeout(resolve, 100));
		refused(await call('me', { token: idle.token }), 401, 'Sign in again.');
		assert.equal((await call('me', { token: seated.token })).status, 200);
		await new Promise((resolve) => setTimeout(resolve, 500));
		refused(
			await call('me', { token: seated.token }),
			401,
			'Sign in again.'
		);
	} finally {
		config.idleSessionMs = defaults.idleSessionMs;
		config.sessionMs = defaults.sessionMs;
	}
	assert.equal(defaults.idleSessionMs, 60 * 60 * 1000);
});

test('at the session cap a login replaces the longest unused session at no table', async () => {
	// Every earlier session ends, so the cap counts only this test's.
	api.sweep(Date.now() + 3 * 24 * 60 * 60 * 1000);
	config.maxSessions = 2;
	try {
		const seated = await login('Ana');
		await call('create', { body: {}, token: seated.token });
		const idle = await login('Bo');
		const newcomer = await login('Cy');
		refused(await call('me', { token: idle.token }), 401, 'Sign in again.');
		assert.equal((await call('me', { token: seated.token })).status, 200);
		await call('create', { body: {}, token: newcomer.token });
		refused(
			await call('login', { body: { name: 'Dee' } }),
			503,
			'The server is full. Try again later.'
		);
	} finally {
		config.maxSessions = defaults.maxSessions;
	}
});

test('one address keeps at most 10 tables open', async () => {
	// Every earlier table closes, so the cap counts only this test's.
	api.sweep(Date.now() + 3 * 24 * 60 * 60 * 1000);
	config.tablesPerAddress = 2;
	try {
		for (const name of ['Ana', 'Bo']) {
			const { token } = await login(name);
			assert.equal(
				(await call('create', { body: {}, token })).status,
				200
			);
		}
		const third = await login('Cy');
		refused(
			await call('create', { body: {}, token: third.token }),
			429,
			'Too many tables are open from your address. Close one first.'
		);
	} finally {
		config.tablesPerAddress = 10_000;
	}
	assert.equal(defaults.tablesPerAddress, 10);
});
