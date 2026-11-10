// Room bot seats retain official identities without becoming connected people (#31).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	configure,
	createRoom,
	end,
	join,
	leave,
	play,
	ready,
	removeSeat,
	roomView,
	seatsOf,
	start,
} from '../api/rooms.mjs';
import { seededRandom } from '../src/lib/engine/random.js';
import {
	botSelections,
	nextBotKind,
	nextBotName,
	withoutBot,
} from '../src/lib/lobby-bots.js';

const host = { id: 'ana', name: 'Ana' };
const bots = [
	{ seat: 2, kind: 'automa', level: 3 },
	{ seat: 3, kind: 'shadow' },
];
const lobby = () =>
	configure(createRoom('1234abcd', host, {}, 0), host.id, { bots });

test('lobby bot controls round-trip names, levels and removal through the real room configuration', () => {
	let room = createRoom('1234abcd', host, {}, 0);
	for (let i = 0; i < 2; i++) {
		const shown = roomView(room, host.id);
		const kind = nextBotKind(shown.seats);
		room = configure(room, host.id, {
			bots: [
				...botSelections(shown.seats),
				{
					seat: shown.seats.length + 1,
					kind,
					name: nextBotName(shown.seats),
					...(kind === 'automa' && { level: 2 }),
				},
			],
		});
	}
	assert.deepEqual(
		roomView(room, host.id).seats.map((seat) => seat.name),
		['Ana', 'Egypt', 'Mesopotamia']
	);
	const selections = botSelections(roomView(room, host.id).seats);
	selections[0].level = 6;
	room = configure(room, host.id, { bots: selections });
	assert.equal(roomView(room, host.id).seats[1].level, 6);
	room = configure(room, host.id, {
		bots: withoutBot(roomView(room, host.id).seats, 2),
	});
	const remaining = roomView(room, host.id);
	assert.deepEqual(
		remaining.seats.map((seat) => [seat.seat, seat.name, seat.kind]),
		[
			[1, 'Ana', undefined],
			[2, 'Mesopotamia', 'shadow'],
		]
	);
	assert.deepEqual(remaining.you, [1]);
	assert.deepEqual(botSelections(remaining.seats), [
		{ seat: 2, name: 'Mesopotamia', kind: 'shadow' },
	]);
	assert.throws(
		() =>
			configure(room, host.id, {
				bots: [{ seat: 4, kind: 'automa', level: 2 }],
			}),
		/consecutive/i
	);
});

test('the host selects typed bot seats and changes the Automa level without a new table mode', () => {
	let room = lobby();
	assert.equal(room.mode, 'online');
	assert.deepEqual(seatsOf(room, host.id), [1]);
	assert.deepEqual(
		room.seats.slice(1).map((s) => s.player),
		[null, null]
	);
	room = ready(room, host.id, true);
	room = configure(room, host.id, {
		bots: [{ ...bots[0], level: 6 }, bots[1]],
	});
	assert.equal(room.seats[0].ready, undefined);
	const shown = roomView(room, host.id);
	assert.equal(shown.seats[1].kind, 'automa');
	assert.equal(shown.seats[1].level, 6);
	assert.equal(shown.seats[2].kind, 'shadow');
	assert.deepEqual(shown.you, [1]);
	assert.throws(() => roomView(room, host.id, 2), /yours/);
});

test('bot seats preserve their settings across deal/end and cannot be played by the host', () => {
	let room = start(lobby(), host.id, seededRandom(31));
	assert.deepEqual(
		room.game.seats.map((s) => s.kind),
		['player', 'automa', 'shadow']
	);
	assert.equal(room.game.seats[1].level, 3);
	assert.throws(
		() =>
			play(
				room,
				host.id,
				2,
				{ decision: 1, turn: 'income' },
				seededRandom(1)
			),
		/yours/
	);
	room = end(room, host.id);
	assert.equal(room.seats[1].kind, 'automa');
	assert.equal(room.seats[1].level, 3);
	assert.equal(leave(room, host.id).room, null);
});

test('two humans can add Shadow Empire but cannot start an incomplete solo composition', () => {
	let room = createRoom('1234abcd', host, {}, 0);
	room = configure(room, host.id, {
		bots: [{ seat: 2, kind: 'automa', level: 2 }],
	});
	assert.throws(
		() => start(room, host.id, seededRandom(1)),
		/human|Shadow|composition/i
	);
	room = configure(room, host.id, { bots: [] });
	room = join(room, { id: 'bo', name: 'Bo' });
	room = configure(room, host.id, { bots: [{ seat: 3, kind: 'shadow' }] });
	assert.equal(
		start(room, host.id, seededRandom(1)).game.seats[2].kind,
		'shadow'
	);
	assert.throws(
		() =>
			removeSeat(
				configure(
					createRoom('1234abcd', host, { mode: 'hotseat' }, 0),
					host.id,
					{ bots }
				),
				host.id,
				1
			),
		/at least one|human/i
	);
});

test('room bot choices validate host, seats, types, level and base-only options', () => {
	const room = lobby();
	assert.throws(() => configure(room, 'stranger', { bots }), /host/);
	for (const selections of [
		[{ seat: 1, kind: 'shadow' }],
		[{ seat: 4, kind: 'shadow' }],
		[{ seat: 2, kind: 'robot' }],
		[{ seat: 2, kind: 'automa', level: 7 }],
		[{ seat: 2, kind: 'shadow', level: 2 }],
		[
			{ seat: 2, kind: 'shadow' },
			{ seat: 3, kind: 'shadow' },
		],
	]) {
		assert.throws(() => configure(room, host.id, { bots: selections }));
	}
	assert.throws(
		() => configure(room, host.id, { expansions: ['pp'] }),
		/base/i
	);
	assert.throws(
		() =>
			configure(start(room, host.id, seededRandom(1)), host.id, {
				bots: [],
			}),
		/started/i
	);
});

test('a finished game retains dealt seat positions when the host tries to remove bots', () => {
	let room = createRoom('1234abcd', host, {}, 0);
	room = configure(room, host.id, { bots: [{ seat: 2, kind: 'shadow' }] });
	room = join(room, { id: 'bo', name: 'Bo' });
	room = start(room, host.id, seededRandom(31));
	const finished = { ...room, game: { ...room.game, phase: 'over' } };
	const before = structuredClone(finished);
	const shown = roomView(finished, 'bo');
	assert.deepEqual(shown.you, [3]);
	assert.equal(shown.viewing, 3);
	assert.equal(shown.game.seats[2].name, 'Bo');
	assert.throws(
		() => configure(finished, host.id, { bots: [] }),
		/new table.*bot seats/i
	);
	assert.deepEqual(finished, before);
	assert.deepEqual(roomView(finished, 'bo'), shown);
	// Ordinary next-deal settings still work without changing who owns the displayed finished seats.
	const configured = configure(finished, host.id, { version: 'original' });
	assert.deepEqual(seatsOf(configured, 'bo'), [3]);
	assert.equal(roomView(configured, 'bo').game.seats[2].name, 'Bo');
});
