// Tests for moving a token: landmarks, activating a space, and the optional bonus (#14).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { contextFor, run } from '../src/lib/engine/loop.js';
import { moveToken, isActivated } from '../src/lib/engine/movement.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { play } from '../src/lib/engine/play.js';
import { startedGame, placeAll } from './helpers/engine.mjs';

/**
 * A started 2-player game, changed by `fill` (given seat 1 and the state).
 * @param {(seat: any, state: any) => void} [fill]
 */
function game(fill = () => {}) {
	const { state, random } = startedGame(2);
	const next = structuredClone(state);
	fill(next.seats[0], next);
	return { state: next, random };
}

/**
 * Moves a seat's token and runs until the next decision.
 * @param {any} state - Changed
 * @param {any} random
 * @param {number} player
 * @param {{ track: any, from: number, to: number, benefit: boolean }} move
 */
function move(state, random, player, move) {
	moveToken(contextFor(state, random, state.pending), player, move);
	run(state, random);
	return state;
}

/** The event types after index `from`. */
const typesSince = (/** @type {any} */ state, /** @type {number} */ from) =>
	state.events.slice(from).map((/** @type {any} */ e) => e.type);

test('the first player into tier II gains its landmark, and it is placed before the benefit (FAQ #1)', () => {
	const { state, random } = game((seat) => {
		seat.tracks.exploration = [3];
	});
	const before = state.events.length;
	move(state, random, 1, {
		track: 'exploration',
		from: 3,
		to: 4,
		benefit: true,
	});
	assert.deepEqual(state.seats[0].tracks.exploration, [4]);
	assert.ok(!state.landmarks.includes('lighthouse'));
	// The landmark waits for its spot, and the space's benefit waits behind it (FAQ #1).
	assert.deepEqual(
		openDecisions(state).map((d) => [d.kind, d.player, d.landmark]),
		[['choosePlacement', 1, 'lighthouse']]
	);
	assert.deepEqual(typesSince(state, before), [
		'tokenMoved',
		'landmarkGained',
		'spaceActivated',
	]);
	const placed = placeAll(state, random);
	// The explore after the Lighthouse has the tile Navigation just gave, so its player is asked where (#17).
	assert.deepEqual(
		openDecisions(placed).map((d) => [d.kind, d.player, d.anywhere]),
		[['chooseExplore', 1, false]]
	);
	assert.deepEqual(
		placed.seats[0].capital.landmarks.map((p) => p.landmark),
		['lighthouse']
	);
	assert.deepEqual(typesSince(placed, before), [
		'tokenMoved',
		'landmarkGained',
		'spaceActivated',
		'landmarkPlaced',
		'tilesGained',
	]);
	assert.deepEqual(
		state.events.find(
			(/** @type {any} */ e) => e.type === 'landmarkGained'
		),
		{
			seq: state.events[before + 1].seq,
			type: 'landmarkGained',
			player: 1,
			landmark: 'lighthouse',
			track: 'exploration',
		}
	);
});

test('a landmark someone already gained is not gained again', () => {
	const { state, random } = game((seat, s) => {
		seat.tracks.exploration = [3];
		s.seats[1].tracks.exploration = [3];
	});
	const step = { track: 'exploration', from: 3, to: 4, benefit: false };
	move(state, random, 1, step);
	move(state, random, 2, step);
	assert.deepEqual(
		openDecisions(state).map((d) => [d.kind, d.player, d.landmark]),
		[['choosePlacement', 1, 'lighthouse']]
	);
	assert.equal(
		state.events.filter((e) => e.type === 'landmarkGained').length,
		1
	);
});

test('R9: a move past several first spaces gains each landmark still there, lowest tier first', () => {
	const { state, random } = game((seat, s) => {
		seat.tracks.military = [3];
		s.landmarks = s.landmarks.filter(
			(/** @type {string} */ id) => id !== 'tank-factory'
		);
	});
	move(state, random, 1, {
		track: 'military',
		from: 3,
		to: 10,
		benefit: false,
	});
	assert.deepEqual(
		state.events
			.filter((e) => e.type === 'landmarkGained')
			.map((e) => e.landmark),
		['barracks', 'fusion-reactor']
	);
	// They are placed in turn, lowest tier first.
	const first = openDecisions(state);
	assert.deepEqual(
		first.map((d) => d.landmark),
		['barracks']
	);
	const next = play(
		state,
		1,
		{
			decision: first[0].id,
			...DECISIONS.choosePlacement.answers(state, first[0])[0],
		},
		random
	);
	assert.deepEqual(
		openDecisions(next).map((d) => d.landmark),
		['fusion-reactor']
	);
});

test('R9: regressing never gains a landmark', () => {
	const { state, random } = game((seat) => {
		seat.tracks.exploration = [5];
	});
	move(state, random, 1, {
		track: 'exploration',
		from: 5,
		to: 4,
		benefit: false,
	});
	assert.ok(state.landmarks.includes('lighthouse'));
	assert.ok(!openDecisions(state).some((d) => d.kind === 'choosePlacement'));
});

test('a move without the benefit still gains the landmark', () => {
	const { state, random } = game((seat) => {
		seat.tracks.science = [3];
	});
	const before = state.events.length;
	move(state, random, 1, {
		track: 'science',
		from: 3,
		to: 4,
		benefit: false,
	});
	assert.deepEqual(typesSince(state, before), [
		'tokenMoved',
		'landmarkGained',
	]);
	assert.equal(isActivated(state, 1, 'science', 4), false);
});

test('R19: a space activated this turn gives nothing the second time, but the token still moves', () => {
	const { state, random } = game();
	const step = { track: 'exploration', from: 0, to: 1, benefit: true };
	move(state, random, 1, step);
	assert.equal(isActivated(state, 1, 'exploration', 1), true);
	assert.equal(isActivated(state, 2, 'exploration', 1), false);
	state.seats[0].tracks.exploration = [0];
	const before = state.events.length;
	move(state, random, 1, step);
	assert.deepEqual(state.seats[0].tracks.exploration, [1]);
	assert.equal(state.seats[0].territoryTiles.length, 2);
	assert.deepEqual(typesSince(state, before), ['tokenMoved']);
});

test('the bonus is offered after the benefit, declined by default, and only when payable', () => {
	const rafts = { track: 'exploration', from: 1, to: 2, benefit: true };
	const poor = game((seat) => {
		seat.tracks.exploration = [1];
	});
	move(poor.state, poor.random, 1, rafts);
	assert.ok(!openDecisions(poor.state).some((d) => d.kind === 'chooseBonus'));

	const { state, random } = game((seat) => {
		seat.tracks.exploration = [1];
		seat.resources.coin = 1;
	});
	move(state, random, 1, rafts);
	const [bonus] = openDecisions(state);
	assert.equal(bonus.kind, 'chooseBonus');
	assert.deepEqual(
		[bonus.track, bonus.space, bonus.cost, bonus.gain],
		['exploration', 2, { any: 1 }, [{ gain: { tapestry: 1 } }]]
	);
	assert.deepEqual(DECISIONS.chooseBonus.answers(state, bonus), [
		{ pay: null },
		{ pay: { coin: 1 } },
	]);
	// Rafts explores with no tile in hand (#17), in both games: the benefit came first.
	for (const { state: played } of [poor, { state }]) {
		assert.equal(
			played.events.filter((e) => e.type === 'noExplore').length,
			1,
			'the benefit came first'
		);
	}
});

test('paying a bonus discards and gains its effects once', () => {
	const { state, random } = game((seat) => {
		seat.tracks.exploration = [7];
		seat.territoryTiles = [1, 2, 3];
	});
	move(state, random, 1, {
		track: 'exploration',
		from: 7,
		to: 8,
		benefit: true,
	});
	// Cars gains a farm first; the bonus follows its placement.
	assert.equal(openDecisions(state)[0].kind, 'choosePlacement');
	const placed = placeAll(state, random);
	const [bonus] = openDecisions(placed);
	assert.equal(bonus.kind, 'chooseBonus');
	const next = play(
		placed,
		1,
		{ decision: bonus.id, pay: { territory: [1, 3] } },
		random
	);
	// Cars: 1 farm, then 1 VP per farm; the bonus adds 5 VP.
	assert.equal(next.seats[0].vp, 6);
	assert.deepEqual(next.seats[0].territoryTiles, [2]);
	assert.deepEqual(next.supply.territoryDiscard, [1, 3]);
	assert.ok(!openDecisions(next).some((d) => d.kind === 'chooseBonus'));
	assert.deepEqual(
		next.events
			.filter((e) => e.type === 'bonusPaid')
			.map(({ seq: _seq, ...e }) => e),
		[{ type: 'bonusPaid', player: 1, track: 'exploration', space: 8 }]
	);
});

test('declining the bonus gains nothing, and a bonus answer must pay or decline', () => {
	const { state, random } = game((seat) => {
		seat.tracks.exploration = [1];
		seat.resources.coin = 1;
	});
	move(state, random, 1, {
		track: 'exploration',
		from: 1,
		to: 2,
		benefit: true,
	});
	const [bonus] = openDecisions(state);
	for (const answer of [{}, { pay: { coin: 2 } }, { pay: { food: 1 } }]) {
		assert.throws(
			() => play(state, 1, { decision: bonus.id, ...answer }, random),
			{ name: 'PlayerError' },
			JSON.stringify(answer)
		);
	}
	const next = play(state, 1, { decision: bonus.id, pay: null }, random);
	assert.equal(next.seats[0].resources.coin, 1);
	assert.equal(next.seats[0].hand.length, 0);
});

test('a new game has activated nothing', () => {
	const { state } = startedGame(2);
	assert.deepEqual(state.activated, []);
});
