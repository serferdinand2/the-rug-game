// The turn timer and undo over HTTP (#24): the settings and undo endpoints, the table timers and late requests, on a server at port 0.
import { afterAll, afterEach, beforeAll, test, vi } from 'vitest';
import assert from 'node:assert/strict';
import http from 'node:http';
import { server, config, api } from '../server.mjs';
import { createApi } from '../api.mjs';
import { TIMERS } from '../rooms.mjs';

/** @typedef {{ status: number, data: any }} Answer */

let base = '';
/** The settings as the server starts with them, restored after each test that changes one. */
const defaults = { ...config };

/** A day, in milliseconds. */
const DAY = 24 * 60 * 60 * 1000;

/** Listens on a free port and points the requests at it. */
async function listen() {
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
	const address = /** @type {import('node:net').AddressInfo} */ (
		server.address()
	);
	base = `http://127.0.0.1:${address.port}/api/`;
}

beforeAll(async () => {
	await listen();
	// Every test here comes from one address, so the per-address limits are raised.
	config.createLimit = 10_000;
	config.loginLimit = 10_000;
	config.apiLimit = 100_000;
	config.tablesPerAddress = 10_000;
});
afterAll(() => {
	server.closeAllConnections();
	server.close();
});

// node:test reset its mocked clock after each test; Vitest's fake timers stay until they are put back.
afterEach(() => {
	vi.useRealTimers();
});

/**
 * Calls the API.
 * @param {string} path - After /api/, with any query
 * @param {{ body?: unknown, token?: string, method?: string }} [options]
 * @returns {Promise<Answer>}
 */
async function call(path, { body, token, method } = {}) {
	const res = await fetch(base + path, {
		method: method ?? (body === undefined ? 'GET' : 'POST'),
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
 * An online table whose host set the timer, then dealt the game.
 * @param {string[]} names
 * @param {number} [timer] - Minutes
 * @returns {Promise<{ people: { token: string }[], room: any }>}
 */
async function timedGame(names, timer = 1) {
	const { people, room } = await table(...names);
	const timed = await call('settings', {
		body: { version: room.version, timer },
		token: people[0].token,
	});
	assert.equal(timed.status, 200, JSON.stringify(timed.data));
	const started = await call('start', {
		body: { version: timed.data.version },
		token: people[0].token,
	});
	assert.equal(started.status, 200, JSON.stringify(started.data));
	return { people, room: started.data };
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

/**
 * The seats a room view's log says the timer played for.
 * @param {any} room
 * @returns {number[]}
 */
const timedOut = (room) =>
	room.game.events
		.filter((/** @type {any} */ event) => event.type === 'timedOut')
		.map((/** @type {any} */ event) => event.player);

/** Closes every table and ends every session, so a test starts with none of the earlier ones. */
const closeAll = () => api.sweep(Date.now() + 3 * DAY);

/** @param {number} ms */
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Serves another table API on a port of its own, and sends every request there while `run` runs.
 * @param {ReturnType<typeof createApi>} other
 * @param {() => Promise<void>} run
 */
async function serving(other, run) {
	const own = http.createServer((req, res) => {
		other.handle(req, res, 'test').catch(() => {
			res.writeHead(500);
			res.end();
		});
	});
	await new Promise((resolve) => own.listen(0, '127.0.0.1', resolve));
	const kept = base;
	const address = /** @type {import('node:net').AddressInfo} */ (
		own.address()
	);
	base = `http://127.0.0.1:${address.port}/api/`;
	try {
		await run();
	} finally {
		base = kept;
		own.closeAllConnections();
		own.close();
		other.close();
	}
}

test('the room view has the timer, undo, clocks, now and canUndo, and the config the timers', async () => {
	const choices = await call('config');
	assert.deepEqual(choices.data.timers, [...TIMERS]);
	assert.deepEqual(choices.data.timers, [0, 1, 2, 5]);
	const { room } = await table('Ana', 'Bo');
	assert.equal(room.timer, 0);
	assert.equal(room.undo, true);
	assert.deepEqual(room.clocks, []);
	assert.equal(room.canUndo, false);
	assert.ok(Number.isInteger(room.now), 'the server says what time it is');
	assert.ok(Math.abs(room.now - Date.now()) < 5000);
	const { room: timed } = await timedGame(['Cy', 'Dee']);
	assert.equal(timed.timer, 1);
	assert.deepEqual(
		timed.clocks.map((/** @type {any} */ clock) => Object.keys(clock)),
		[
			['seat', 'ends', 'expired'],
			['seat', 'ends', 'expired'],
		],
		'one running clock for each seat in setup, without its scope'
	);
	for (const [i, clock] of timed.clocks.entries()) {
		assert.equal(clock.seat, i + 1);
		assert.equal(clock.expired, false);
		assert.ok(clock.ends > timed.now + 55_000);
		assert.ok(clock.ends <= timed.now + 60_000);
	}
	for (const view of [room, timed]) {
		for (const hidden of ['history', 'declines', 'touched']) {
			assert.ok(!(hidden in view), `the view has no ${hidden}`);
		}
	}
});

test('the host changes the timer and undo over HTTP, with the table version', async () => {
	const { people, room } = await table('Ana', 'Bo');
	const [ana, bo] = people;
	const changed = await call('settings', {
		body: { version: room.version, timer: 2, undo: false },
		token: ana.token,
	});
	assert.equal(changed.status, 200, JSON.stringify(changed.data));
	assert.equal(changed.data.timer, 2);
	assert.equal(changed.data.undo, false);
	assert.equal(changed.data.version, room.version + 1);
	const seen = (await call('state', { token: bo.token })).data;
	assert.equal(seen.timer, 2);
	assert.equal(seen.undo, false);
	const version = changed.data.version;
	refused(
		await call('settings', {
			body: { version: room.version, timer: 5 },
			token: ana.token,
		}),
		409,
		'The table changed. Try again.'
	);
	refused(
		await call('settings', { body: { timer: 5 }, token: ana.token }),
		400,
		'Send the table version.'
	);
	refused(
		await call('settings', {
			body: { version, timer: 5 },
			token: bo.token,
		}),
		400,
		'Only the host can change the table.'
	);
	refused(
		await call('settings', {
			body: { version, timer: 3 },
			token: ana.token,
		}),
		400,
		'Choose a timer of off, 1, 2 or 5 minutes.'
	);
	refused(
		await call('settings', {
			body: { version, undo: 'yes' },
			token: ana.token,
		}),
		400,
		'Choose whether undo is on.'
	);
	refused(
		await call('settings', { method: 'GET', token: ana.token }),
		405,
		'Use POST for this request.'
	);
	const same = await call('settings', {
		body: { version, timer: 2 },
		token: ana.token,
	});
	assert.equal(same.status, 200);
	assert.equal(same.data.version, version, 'no change, no new version');
	// During a game: the timer starts the clocks, and off clears them.
	const started = (
		await call('start', { body: { version }, token: ana.token })
	).data;
	assert.equal(started.clocks.length, 2);
	const off = await call('settings', {
		body: { version: started.version, timer: 0, undo: true },
		token: ana.token,
	});
	assert.equal(off.status, 200, JSON.stringify(off.data));
	assert.equal(off.data.version, started.version + 1);
	assert.deepEqual(off.data.clocks, []);
	assert.equal(off.data.undo, true);
});

/**
 * Plays a started 2-player game, one choice at a time, until a choice can be taken back. Each answer is the first
 * legal one, except that an advance turn is taken whenever one is offered: income turns draw cards, so they can
 * never be taken back.
 * @param {{ token: string }[]} people
 * @returns {Promise<{ person: { token: string }, room: any, decision: number }>} Who chose, their view after it, and
 *   the decision they answered
 */
async function untilUndoable(people) {
	for (let round = 0; round < 200; round++) {
		for (const person of people) {
			const room = (await call('state', { token: person.token })).data;
			const open = openFor(room);
			if (!open) {
				continue;
			}
			const answer =
				(open.kind === 'chooseTurn' &&
					open.answers.find(
						(/** @type {any} */ a) => a.turn === 'advance'
					)) ||
				open.answers[0];
			const moved = await call('move', {
				body: {
					version: room.version,
					action: { decision: open.id, ...answer },
				},
				token: person.token,
			});
			assert.equal(moved.status, 200, JSON.stringify(moved.data));
			if (moved.data.canUndo) {
				return { person, room: moved.data, decision: open.id };
			}
		}
	}
	throw new Error('No choice could be taken back.');
}

test('a choice is taken back over HTTP', async () => {
	const { people, room: lobby } = await table('Ana', 'Bo');
	refused(
		await call('undo', {
			body: { version: lobby.version },
			token: people[0].token,
		}),
		400,
		'Start the game first.'
	);
	await call('start', {
		body: { version: lobby.version },
		token: people[0].token,
	});
	const { person, room, decision } = await untilUndoable(people);
	const other = /** @type {{ token: string }} */ (
		people.find((p) => p !== person)
	);
	const theirs = (await call('state', { token: other.token })).data;
	assert.equal(theirs.canUndo, false, 'only the seat who chose can undo');
	refused(
		await call('undo', {
			body: { version: room.version },
			token: other.token,
		}),
		400,
		'You can only take back your own choices.'
	);
	refused(
		await call('undo', {
			body: { version: room.version - 1 },
			token: person.token,
		}),
		409,
		'The table changed. Try again.'
	);
	refused(
		await call('undo', { body: {}, token: person.token }),
		400,
		'Send the table version.'
	);
	const undone = await call('undo', {
		body: { version: room.version },
		token: person.token,
	});
	assert.equal(undone.status, 200, JSON.stringify(undone.data));
	assert.equal(undone.data.version, room.version + 1);
	assert.equal(undone.data.canUndo, false);
	assert.equal(undone.data.game.events.at(-1).type, 'undone');
	assert.equal(openFor(undone.data).id, decision, 'the choice is open again');
	refused(
		await call('undo', {
			body: { version: undone.data.version },
			token: person.token,
		}),
		400,
		'There is nothing to undo.'
	);
	const off = await call('settings', {
		body: { version: undone.data.version, undo: false },
		token: people[0].token,
	});
	assert.equal(off.status, 200, JSON.stringify(off.data));
	refused(
		await call('undo', {
			body: { version: off.data.version },
			token: person.token,
		}),
		400,
		'Undo is off at this table.'
	);
});

test('when a clock runs out the server plays the turn and wakes the long polls', async () => {
	config.minuteMs = 20;
	try {
		const { people, room } = await timedGame(['Ana', 'Bo']);
		const started = Date.now();
		const woken = await Promise.all(
			people.map((person) =>
				call(`state?since=${room.version}`, { token: person.token })
			)
		);
		assert.ok(
			Date.now() - started < 5000,
			'woken by the timer, not the long-poll wait'
		);
		for (const answer of woken) {
			assert.equal(answer.status, 200, JSON.stringify(answer.data));
			assert.ok(answer.data.version > room.version);
			assert.notEqual(answer.data.game.phase, 'setup');
			assert.ok(timedOut(answer.data).includes(1));
			assert.ok(timedOut(answer.data).includes(2));
		}
	} finally {
		config.minuteMs = defaults.minuteMs;
		closeAll();
	}
});

test(
	'two clients who never answer see their game played to the end',
	{
		timeout: 70_000,
	},
	async (t) => {
		const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
		config.minuteMs = 5;
		config.declineMinMs = 1;
		config.declineMaxMs = 2;
		config.longPollMs = 1000;
		try {
			const { people, room } = await timedGame(['Ana', 'Bo']);
			const giveUp = Date.now() + 60_000;
			const ends = await Promise.all(
				people.map(async (person) => {
					let since = room.version;
					while (Date.now() < giveUp) {
						const polled = await call(`state?since=${since}`, {
							token: person.token,
						});
						assert.equal(
							polled.status,
							200,
							JSON.stringify(polled.data)
						);
						if (polled.data.phase === 'finished') {
							return polled.data;
						}
						since = polled.data.version;
					}
					throw new Error('The game was not played to the end.');
				})
			);
			assert.deepEqual(ends[0].game.result, ends[1].game.result);
			assert.ok(timedOut(ends[0]).includes(1));
			assert.ok(timedOut(ends[0]).includes(2));
			assert.equal(
				errors.mock.calls.length,
				0,
				errors.mock.calls
					.map((call) => String(call[0]?.stack ?? call[0]))
					.join('\n')
			);
		} finally {
			config.minuteMs = defaults.minuteMs;
			config.declineMinMs = defaults.declineMinMs;
			config.declineMaxMs = defaults.declineMaxMs;
			config.longPollMs = defaults.longPollMs;
			closeAll();
		}
		assert.equal(defaults.minuteMs, 60_000);
		assert.equal(defaults.declineMinMs, 3_000);
		assert.equal(defaults.declineMaxMs, 10_000);
	}
);

test('a move that arrives after the clock ran out gets 409', async (t) => {
	// The server's clock is frozen and moved on by hand, so the table's own timer, a real one, hasn't fired yet when
	// the late requests arrive: the requests themselves must let the timeout happen first.
	vi.useFakeTimers({ toFake: ['Date'], now: Date.now() });
	const { people, room } = await timedGame(['Ana', 'Bo']);
	const [ana] = people;
	const open = openFor(room);
	vi.advanceTimersByTime(61_000);
	refused(
		await call('move', {
			body: {
				version: room.version,
				action: { decision: open.id, ...open.answers[0] },
			},
			token: ana.token,
		}),
		409,
		'The table changed. Try again.'
	);
	const played = (await call('state', { token: ana.token })).data;
	assert.equal(played.version, room.version + 1);
	assert.notEqual(played.game.phase, 'setup');
	assert.deepEqual(timedOut(played), [1, 2]);
	assert.ok(played.clocks.some((/** @type {any} */ c) => !c.expired));
	vi.advanceTimersByTime(61_000);
	refused(
		await call('undo', {
			body: { version: played.version },
			token: ana.token,
		}),
		409,
		'The table changed. Try again.'
	);
	const later = (await call('state', { token: ana.token })).data;
	assert.equal(later.version, played.version + 1);
	assert.equal(timedOut(later).length, 3);
});

test('a timeout that answers nothing is never committed, so late requests go on as usual', async (t) => {
	const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
	vi.useFakeTimers({ toFake: ['Date'], now: Date.now() });
	let timeouts = 0;
	// Only a bug does this: something has run out, and the timeout answers nothing, in a new room all the same.
	const other = createApi(
		{ ...config },
		{
			timeout: (room) => {
				timeouts += 1;
				return { ...room };
			},
		}
	);
	await serving(other, async () => {
		const { people, room } = await timedGame(['Ana', 'Bo']);
		const [ana] = people;
		assert.equal(other.timers(), 1);
		vi.advanceTimersByTime(61_000);
		for (let attempt = 1; attempt <= 2; attempt++) {
			refused(
				await call('undo', {
					body: { version: room.version },
					token: ana.token,
				}),
				400,
				'There is nothing to undo.'
			);
			assert.equal(timeouts, attempt);
			assert.equal(errors.mock.calls.length, attempt, 'logged once each');
			assert.equal(other.timers(), 0, 'no timer until the table changes');
		}
		assert.match(String(errors.mock.calls[0][0]), /could answer nothing/);
		const open = openFor(room);
		const moved = await call('move', {
			body: {
				version: room.version,
				action: { decision: open.id, ...open.answers[0] },
			},
			token: ana.token,
		});
		assert.equal(moved.status, 200, JSON.stringify(moved.data));
		assert.equal(
			moved.data.version,
			room.version + 1,
			"the move's own version, and none from the timeout"
		);
		// The move changed the table, so its timer tries once more, then waits for the next change.
		await pause(50);
		assert.equal(timeouts, 4);
		assert.equal(errors.mock.calls.length, 4);
		assert.equal(other.timers(), 0);
		const seen = (await call('state', { token: ana.token })).data;
		assert.equal(seen.version, room.version + 1, 'nothing spins');
	});
});

test('a timeout that fails is logged, and a late move goes on as usual', async (t) => {
	const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
	vi.useFakeTimers({ toFake: ['Date'], now: Date.now() });
	const other = createApi(
		{ ...config },
		{
			timeout: () => {
				throw new Error('The timer could not finish the turn.');
			},
		}
	);
	await serving(other, async () => {
		const { people, room } = await timedGame(['Ana', 'Bo']);
		vi.advanceTimersByTime(61_000);
		const open = openFor(room);
		const moved = await call('move', {
			body: {
				version: room.version,
				action: { decision: open.id, ...open.answers[0] },
			},
			token: people[0].token,
		});
		assert.equal(moved.status, 200, JSON.stringify(moved.data));
		assert.equal(moved.data.version, room.version + 1);
		await pause(50);
		assert.equal(errors.mock.calls.length, 2, 'before the move, and after');
		assert.match(
			String(errors.mock.calls[1][0]),
			/could not finish the turn/
		);
		assert.equal(other.timers(), 0);
	});
});

test('the table timers are cleared when a table closes, when it expires and when the server closes', async (t) => {
	closeAll();
	assert.equal(api.timers(), 0, 'every earlier table has gone');

	// The game ends, so the lobby has no clock, and the last one out closes the table.
	const closing = await timedGame(['Ana', 'Bo']);
	const [ana, bo] = closing.people;
	assert.equal(api.timers(), 1);
	await call('leave', { body: {}, token: bo.token });
	assert.equal(api.timers(), 1, 'a game in progress keeps its clocks');
	const left = (await call('state', { token: ana.token })).data;
	const ended = await call('end', {
		body: { version: left.version },
		token: ana.token,
	});
	assert.equal(ended.status, 200, JSON.stringify(ended.data));
	assert.equal(api.timers(), 0);
	await call('leave', { body: {}, token: ana.token });
	refused(
		await call('join', { body: { code: left.code }, token: ana.token }),
		404
	);
	assert.equal(api.timers(), 0);

	// It expires at the minute's sweep.
	await timedGame(['Cy', 'Dee']);
	assert.equal(api.timers(), 1);
	api.sweep(Date.now() + 2 * DAY);
	assert.equal(api.timers(), 0);

	// Or when someone creates a table a day later.
	vi.useFakeTimers({ toFake: ['Date'], now: Date.now() });
	await timedGame(['Eve', 'Fay']);
	assert.equal(api.timers(), 1);
	vi.advanceTimersByTime(2 * DAY);
	const late = await login('Gus');
	const created = await call('create', { body: {}, token: late.token });
	assert.equal(created.status, 200, JSON.stringify(created.data));
	assert.equal(api.timers(), 0);
	vi.useRealTimers();

	// The server closes.
	await timedGame(['Hal', 'Ivy']);
	assert.equal(api.timers(), 1);
	server.closeAllConnections();
	await new Promise((resolve) => server.close(resolve));
	assert.equal(api.timers(), 0);
	await listen();
});
