// A&A's tapestry cards that hold pieces (#37 part 2b): Commercial Center, Monuments, Star Chamber (CONTINUOUS), Space
// Race, Trade Routes and National Parks (THIS ERA), numbers as 03 §2.5.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { resolveEffects } from '../src/lib/engine/loop.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { placements } from '../src/lib/engine/placing.js';
import { tapestryCard } from '../src/lib/engine/data/tapestry-cards.js';
import { landmarksOwned } from '../src/lib/engine/effects/vp.js';
import { landmarksInCity } from '../src/lib/engine/ranking.js';
import {
	answer,
	answerDefaults,
	resolveTapestry,
	startedGame,
} from './helpers/engine.mjs';
import { AA } from './helpers/arts.mjs';

/**
 * A started A&A game for 3 players, its pending stack cleared, seat 1 in era 2 with `card` played on its era-2 slot.
 * @param {string} card
 * @param {(state: any) => void} [fill]
 */
function holding(card, fill = () => {}) {
	const { state: started, random } = startedGame(3, AA);
	started.pending.length = 0;
	started.seats[0].incomeTurns = 2;
	started.seats[0].resources = { coin: 2, worker: 2, food: 2, culture: 2 };
	fill(started);
	return { state: resolveTapestry(started, random, 1, card), random };
}

/**
 * The places on cards a gained piece is offered.
 * @param {any} state
 * @param {import('../src/lib/engine/placing.js').Piece} piece
 * @returns {any[]}
 */
const onCards = (state, piece) =>
	placements(state, 1, piece).filter((place) => 'card' in place);

/**
 * Gains a piece for seat 1 and places it with `place`, answering what follows by default.
 * @param {any} state
 * @param {any} random
 * @param {import('../src/lib/engine/placing.js').Piece} piece
 * @param {Record<string, any>} place
 */
function placeOn(state, random, piece, place) {
	const gained = resolveEffects(
		state,
		1,
		[
			'building' in piece
				? { building: piece.building }
				: { landmark: piece.landmark },
		],
		random
	);
	const [decision] = openDecisions(gained);
	assert.equal(decision.kind, 'choosePlacement');
	return answer(gained, random, 1, 'choosePlacement', place);
}

// Commercial Center

test('Commercial Center is CONTINUOUS: its 4 open squares take buildings, and nobody may copy it', () => {
	const { state } = holding('commercial-center');
	assert.equal(tapestryCard('commercial-center').timing, 'continuous');
	assert.deepEqual(onCards(state, { building: 'farm' }), [
		{ card: 'commercial-center', row: 0, col: 0 },
		{ card: 'commercial-center', row: 0, col: 1 },
		{ card: 'commercial-center', row: 1, col: 0 },
		{ card: 'commercial-center', row: 1, col: 1 },
	]);
	assert.equal(state.seats[0].era, null);
});

test('Commercial Center: each square newly covered gives its printed benefit or 3 VP (Jamey, 03 §2.12)', () => {
	let { state, random } = holding('commercial-center');
	const vp = state.seats[0].vp;
	state = placeOn(
		state,
		random,
		{ building: 'farm' },
		{
			card: 'commercial-center',
			row: 0,
			col: 0,
		}
	);
	assert.deepEqual(state.seats[0].onCards['commercial-center'], [
		{ building: 'farm', row: 0, col: 0 },
	]);
	const [choice] = openDecisions(state);
	assert.equal(choice.kind, 'chooseOption');
	// The top-left square prints 1 coin.
	assert.deepEqual(choice.options, [[{ gain: { coin: 1 } }], [{ vp: 3 }]]);
	state = answer(state, random, 1, 'chooseOption', { option: 1 });
	assert.equal(state.seats[0].vp, vp + 3);
	// That square is taken now.
	assert.deepEqual(
		onCards(state, { building: 'house' }).map((p) => [p.row, p.col]),
		[
			[0, 1],
			[1, 0],
			[1, 1],
		]
	);
	// It isn't in the capital, but it is the player's.
	assert.ok(
		!state.seats[0].capital.buildings.some(
			(/** @type {any} */ b) => b.building === 'farm'
		)
	);
});

test('Commercial Center: a landmark gives a choice for each square it covers, and may hang off the card', () => {
	let { state, random } = holding('commercial-center');
	// The Barracks is 2 by 2: at the top left it covers all 4 squares.
	const spots = onCards(state, { landmark: 'barracks' });
	const all = spots.find(
		(p) => p.row === 0 && p.col === 0 && p.rotation === 0
	);
	assert.ok(all, 'the whole card');
	// Hanging off: a spot covering only the bottom-right square.
	assert.ok(spots.some((p) => p.row === 1 && p.col === 1));
	state = placeOn(state, random, { landmark: 'barracks' }, all);
	const vp = state.seats[0].vp;
	for (const _ of [1, 2, 3, 4]) {
		const [choice] = openDecisions(state);
		assert.equal(choice.kind, 'chooseOption');
		assert.deepEqual(choice.options[1], [{ vp: 3 }]);
		state = answer(state, random, 1, 'chooseOption', { option: 1 });
	}
	assert.equal(state.seats[0].vp, vp + 12);
	assert.deepEqual(landmarksOwned(state, 1), ['barracks']);
	assert.deepEqual(landmarksInCity(state.seats[0]), []);
	assert.deepEqual(onCards(state, { building: 'farm' }), []);
});

test('a card covered by another tapestry card sends what it holds beside the capital mat, where it still counts', () => {
	let { state, random } = holding('commercial-center');
	state = answerDefaults(
		placeOn(
			state,
			random,
			{ building: 'farm' },
			{
				card: 'commercial-center',
				row: 0,
				col: 0,
			}
		),
		random
	);
	const covered = resolveTapestry(state, random, 1, 'steam', 2);
	assert.deepEqual(covered.seats[0].onCards['commercial-center'], undefined);
	assert.ok(covered.seats[0].besideMat.includes('farm'));
	assert.deepEqual(onCards(covered, { building: 'house' }), []);
});

test('Espionage never copies a CONTINUOUS card', () => {
	const { state, random } = holding('commercial-center');
	const spy = resolveTapestry(state, random, 2, 'espionage');
	assert.ok(
		!openDecisions(spy).some(
			(d) =>
				d.kind === 'chooseCopy' &&
				d.options.some(
					(/** @type {any} */ o) => o.card === 'commercial-center'
				)
		)
	);
});

// Monuments and Star Chamber

test('Monuments: once its 6 squares are covered, 8 VP or 1 each of culture, coin, food and worker', () => {
	let { state, random } = holding('monuments');
	const squares = onCards(state, { building: 'farm' }).map((p) => [
		p.row,
		p.col,
	]);
	assert.deepEqual(squares, [
		[0, 2],
		[1, 1],
		[1, 2],
		[2, 0],
		[2, 1],
		[2, 2],
	]);
	for (const [row, col] of squares) {
		const building = row === 0 ? 'market' : row === 1 ? 'house' : 'farm';
		state = placeOn(
			state,
			random,
			{ building },
			{ card: 'monuments', row, col }
		);
		if (row === 2 && col === 2) {
			break;
		}
		state = answerDefaults(state, random);
	}
	const [reward] = openDecisions(state);
	assert.equal(reward.kind, 'chooseOption');
	assert.deepEqual(reward.options, [
		[{ vp: 8 }],
		[{ gain: { culture: 1, coin: 1, food: 1, worker: 1 } }],
	]);
});

test('Star Chamber: once its 5 squares are covered, advance once on any track, its bonus free', () => {
	let { state, random } = holding('star-chamber');
	const squares = onCards(state, { building: 'farm' }).map((p) => [
		p.row,
		p.col,
	]);
	assert.deepEqual(squares, [
		[0, 1],
		[1, 0],
		[1, 1],
		[1, 2],
		[2, 1],
	]);
	squares.forEach(([row, col], i) => {
		state = placeOn(
			state,
			random,
			{ building: 'farm' },
			{
				card: 'star-chamber',
				row,
				col,
			}
		);
		if (i < squares.length - 1) {
			state = answerDefaults(state, random);
		}
	});
	const [advance] = openDecisions(state);
	assert.equal(advance.kind, 'chooseMove');
	assert.equal(advance.freeBonus, true);
	assert.deepEqual(
		advance.options.map((/** @type {any} */ o) => o.track),
		['exploration', 'science', 'technology', 'military', 'arts']
	);
});

// Space Race and Trade Routes

test('Space Race: a landmark gained may go on it while it holds none, for 1 space tile explored', () => {
	let { state, random } = holding('space-race', (s) => {
		s.seats[0].spaceTiles = [];
	});
	assert.deepEqual(onCards(state, { landmark: 'barracks' }), [
		{ card: 'space-race' },
	]);
	state = answerDefaults(
		placeOn(
			state,
			random,
			{ landmark: 'barracks' },
			{ card: 'space-race' }
		),
		random
	);
	assert.deepEqual(state.seats[0].onCards['space-race'], [
		{ landmark: 'barracks' },
	]);
	assert.equal(state.seats[0].exploredSpace.length, 1);
	assert.deepEqual(onCards(state, { landmark: 'forge' }), []);
	assert.deepEqual(landmarksOwned(state, 1), ['barracks']);
});

test('Trade Routes: every landmark gained may go on it, for a conquer with both dice and 5 VP per landmark there', () => {
	let { state, random } = holding('trade-routes');
	state = placeOn(
		state,
		random,
		{ landmark: 'barracks' },
		{
			card: 'trade-routes',
		}
	);
	const vp = state.seats[0].vp;
	assert.deepEqual(state.seats[0].onCards['trade-routes'], [
		{ landmark: 'barracks' },
	]);
	assert.ok(vp >= 5);
	assert.deepEqual(onCards(state, { landmark: 'forge' }), [
		{ card: 'trade-routes' },
	]);
	const [conquer] = openDecisions(state);
	assert.ok(
		conquer === undefined || conquer.kind === 'chooseConquer',
		'a conquer follows when a territory can be conquered'
	);
});

// National Parks

test('National Parks: a piece may go on a territory you control holding only your outpost, then a die of your choice', () => {
	let { state, random } = holding('national-parks');
	const start = /** @type {string} */ (state.seats[0].start);
	const parks = placements(state, 1, { building: 'farm' }).filter(
		(p) => 'parks' in p
	);
	// The start territory holds 2 outposts: only 1 item is allowed.
	assert.deepEqual(parks, []);
	state.hexes[start].outposts.pop();
	const one = placements(state, 1, { building: 'farm' }).filter(
		(p) => 'parks' in p
	);
	assert.deepEqual(one, [{ hex: start, parks: true }]);
	state = placeOn(
		state,
		random,
		{ building: 'farm' },
		{ hex: start, parks: true }
	);
	assert.deepEqual(
		state.hexes[start].outposts.map(
			(/** @type {any} */ o) => o.piece ?? null
		),
		[null, { building: 'farm' }]
	);
	const [die] = openDecisions(state);
	assert.equal(die.kind, 'chooseSlot');
	assert.equal(die.purpose, 'nationalParks');
	assert.deepEqual(die.options, ['black', 'red']);
	const rolled = answer(state, random, 1, 'chooseSlot', { slot: 'red' });
	assert.equal(
		rolled.events.filter(
			(/** @type {any} */ e) => e.type === 'parksDieRolled'
		).length,
		1
	);
});
