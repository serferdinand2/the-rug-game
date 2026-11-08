// Tests for Automa and Shadow Empire seat boundaries and public views (#31).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	botSeat,
	createBotSeat,
	isBotSeat,
	isPlayerSeat,
	neighbours,
	playerSeat,
	seatOf,
} from '../src/lib/engine/state.js';
import { view } from '../src/lib/engine/view.js';
import { newGame } from './helpers/engine.mjs';

const TRACKS = ['exploration', 'science', 'technology', 'military'];
const PLAYER_FIELDS = [
	'resources',
	'incomeMat',
	'capital',
	'besideMat',
	'hand',
	'tech',
	'territoryTiles',
	'spaceTiles',
	'exploredSpace',
	'civs',
	'civData',
	'era',
	'picks',
	'landmarkCard',
	'start',
	'masterpieces',
	'inspired',
];

for (const kind of ['automa', 'shadow']) {
	test(`${kind} seats start with shared pieces and no player-only holdings`, () => {
		const bot = createBotSeat(2, kind, 'Bot', TRACKS, 10);
		assert.equal(bot.kind, kind);
		assert.equal(bot.seat, 2);
		assert.equal(bot.name, 'Bot');
		assert.equal(bot.vp, 0);
		assert.deepEqual(bot.vpSources, {});
		assert.deepEqual(bot.tracks, {
			exploration: [0],
			science: [0],
			technology: [0],
			military: [0],
		});
		assert.equal(bot.outposts, 10);
		assert.equal(bot.incomeTurns, 0);
		assert.equal(bot.finished, false);
		assert.deepEqual(bot.restartedTracks, []);
		for (const field of PLAYER_FIELDS) {
			assert.equal(Object.hasOwn(bot, field), false, field);
		}
		assert.deepEqual(JSON.parse(JSON.stringify(bot)), bot);
	});

	test(`${kind} seats can be found as bots but never as players`, () => {
		const { state } = newGame(1);
		const bot = createBotSeat(2, kind, 'Bot', TRACKS, 10);
		state.seats.push(bot);
		assert.equal(seatOf(state, 2), bot);
		assert.equal(botSeat(state, 2), bot);
		assert.equal(isBotSeat(state, 2), true);
		assert.equal(isPlayerSeat(state, 2), false);
		assert.throws(() => playerSeat(state, 2), /not a player/);
		assert.equal(isBotSeat(state, 1), false);
		assert.throws(() => botSeat(state, 1), /not a bot/);
		for (const invalid of [null, undefined, '2', 0, -1, 1.5, NaN, 3]) {
			assert.equal(isBotSeat(state, invalid), false);
		}
		assert.throws(() => botSeat(state, 3), /There is no seat/);
	});

	test(`${kind} is a neighbour in a two-seat game and appears only once`, () => {
		const { state } = newGame(1);
		state.seats.push(createBotSeat(2, kind, 'Bot', TRACKS, 10));
		assert.deepEqual(neighbours(state, 1), [2]);
		assert.deepEqual(neighbours(state, 2), [1]);
	});

	test(`${kind} state is public while bot viewers cannot see human secrets`, () => {
		const { state } = newGame(1);
		const human = playerSeat(state, 1);
		human.hand = ['trap'];
		human.picks = { capital: 3, civ: 'leaders' };
		const bot = createBotSeat(2, kind, 'Bot', TRACKS, 10);
		bot.tracks.science = [3];
		bot.incomeTurns = 2;
		state.seats.push(bot);
		// Even an event addressed to a bot cannot grant that seat private access.
		state.events.push({
			seq: ++state.seq,
			type: 'privateFixture',
			player: 2,
			secret: { cards: ['hidden-bot-fixture'] },
		});
		state.events.push({
			seq: ++state.seq,
			type: 'privateFixture',
			player: 1,
			secret: { cards: ['trap'] },
		});
		const before = structuredClone(state);
		const publicView = view(state, null);
		assert.deepEqual(view(state, 2), publicView);
		assert.deepEqual(publicView.seats[1], bot);
		assert.deepEqual(view(state, 1).seats[1], bot);
		assert.equal(publicView.seats[0].handCount, 1);
		assert.equal(Object.hasOwn(publicView.seats[0], 'hand'), false);
		assert.equal(Object.hasOwn(publicView.seats[0], 'picks'), false);
		assert.ok(
			publicView.events.every((event) => !Object.hasOwn(event, 'secret'))
		);
		for (const op of publicView.pending.flatMap((entry) =>
			entry.kind === 'group'
				? entry.lanes.flatMap((lane) => lane.stack)
				: [entry]
		)) {
			assert.equal(Object.hasOwn(op, 'answers'), false);
		}
		assert.deepEqual(view(state, 1).seats[0].hand, ['trap']);
		assert.deepEqual(view(state, 1).events.at(-1).secret, {
			cards: ['trap'],
		});
		assert.deepEqual(state, before);
	});

	test(`${kind} viewers cannot see a bot-owned decision's hidden options or answers`, () => {
		const { state } = newGame(1);
		state.seats.push(createBotSeat(2, kind, 'Bot', TRACKS, 10));
		// chooseCiv is a real registered decision with hidden options. A bot must
		// never receive it in play, but an addressed decision must stay private.
		state.pending = [
			{
				id: state.nextId++,
				batch: 1,
				kind: 'chooseCiv',
				player: 2,
				options: ['leaders', 'inventors'],
			},
			{
				id: state.nextId++,
				batch: 1,
				kind: 'chooseCiv',
				player: 1,
				options: ['historians', 'craftsmen'],
			},
		];
		const before = structuredClone(state);
		const botView = view(state, 2);
		assert.deepEqual(botView, view(state, null));
		for (const decision of botView.pending) {
			assert.equal(Object.hasOwn(decision, 'options'), false);
			assert.equal(Object.hasOwn(decision, 'answers'), false);
		}
		const humanView = view(state, 1);
		assert.equal(Object.hasOwn(humanView.pending[0], 'options'), false);
		assert.equal(Object.hasOwn(humanView.pending[0], 'answers'), false);
		assert.deepEqual(humanView.pending[1].options, [
			'historians',
			'craftsmen',
		]);
		assert.deepEqual(humanView.pending[1].answers, [
			{ civ: 'historians' },
			{ civ: 'craftsmen' },
		]);
		assert.deepEqual(state, before);
	});
}

test('bot construction preserves the validated outpost supply chosen by setup', () => {
	for (const kind of ['automa', 'shadow']) {
		for (const outposts of [0, 6, 10]) {
			const bot = createBotSeat(2, kind, 'Bot', TRACKS, outposts);
			assert.equal(bot.outposts, outposts);
		}
	}
});

test('neighbour order includes a Shadow Empire between two human players', () => {
	const { state } = newGame(2);
	state.seats.push(createBotSeat(3, 'shadow', 'Shadow Empire', TRACKS, 10));
	assert.deepEqual(neighbours(state, 1), [3, 2]);
	assert.deepEqual(neighbours(state, 2), [1, 3]);
	assert.deepEqual(neighbours(state, 3), [2, 1]);
});

test('separate bot seats never share mutable track tokens or score records', () => {
	const first = createBotSeat(2, 'automa', 'Automa', TRACKS, 10);
	const second = createBotSeat(3, 'shadow', 'Shadow Empire', TRACKS, 10);
	first.tracks.science[0] = 4;
	first.vpSources.tracks = 3;
	first.restartedTracks.push('military');
	assert.deepEqual(second.tracks.science, [0]);
	assert.deepEqual(second.vpSources, {});
	assert.deepEqual(second.restartedTracks, []);
});
