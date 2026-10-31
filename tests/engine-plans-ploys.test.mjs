// Plans & Ploys rules (#32): landmark cards with their draft and goals, the four new space tiles, and the expansion switch.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { view } from '../src/lib/engine/game.js';
import { checkOptions, createGame } from '../src/lib/engine/setup.js';
import { seededRandom } from '../src/lib/engine/random.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { contextFor, run } from '../src/lib/engine/loop.js';
import { rankPlayers } from '../src/lib/engine/ranking.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { play } from '../src/lib/engine/play.js';
import { cityPlots } from '../src/lib/engine/city.js';
import { landmarkGoal } from '../src/lib/engine/landmark-cards.js';
import { LANDMARK_CARDS } from '../src/lib/engine/data/landmark-cards.js';
import {
	EXPANSION_LANDMARKS,
	LANDMARKS,
	landmarksFor,
} from '../src/lib/engine/data/landmarks.js';
import {
	SPACE_TILES,
	EXPANSION_SPACE_TILES,
	spaceTile,
	spaceTilesFor,
} from '../src/lib/engine/data/space-tiles.js';
import { FOOTPRINTS } from '../src/lib/art/footprints.js';
import { groupsOf } from '../src/lib/capital.js';
import { newGame, readyTurn, startedGame } from './helpers/engine.mjs';
import { checkState } from './helpers/invariants.mjs';

const PP = { expansions: ['pp'] };

/**
 * Answers open decisions with their first answer while `player`'s turn lasts, then returns the state.
 * @param {any} state
 * @param {import('../src/lib/engine/random.js').Random} random
 * @param {number} player
 * @param {(decision: any) => Record<string, any> | undefined} [pick] - An answer to give instead of the first
 */
function finishTurn(state, random, player, pick = () => undefined) {
	for (let step = 0; step < 200; step++) {
		if (state.current !== player || state.phase !== 'play') {
			return state;
		}
		const [open] = openDecisions(state);
		if (!open) {
			return state;
		}
		const answer =
			pick(open) ?? DECISIONS[open.kind].answers(state, open)[0];
		state = play(
			state,
			open.player,
			{ decision: open.id, ...answer },
			random
		);
	}
	throw new Error('The turn never ended.');
}

/** @param {any} state @param {number} player */
const seatOf = (state, player) => state.seats[player - 1];

/** Takes an income turn: chooses income, then answers the rest with the first answers. */
const incomeTurn = (/** @type {any} */ decision) =>
	decision.kind === 'chooseTurn' ? { turn: 'income' } : undefined;

/**
 * Builds on every empty plot of one capital row of a seat, so the row is complete.
 * @param {any} seat
 * @param {number} row
 */
function completeRow(seat, row) {
	const plots = cityPlots(seat);
	for (const index of groupsOf('rows')[row]) {
		if (plots[index] === 'empty') {
			seat.capital.buildings.push({
				building: 'house',
				row,
				col: index % 9,
			});
		}
	}
}

// Data

test('Plans & Ploys has 5 landmark cards, each naming its own landmark and goal (03 §1.6)', () => {
	assert.deepEqual(
		LANDMARK_CARDS.map((card) => [card.id, card.landmark, card.goal]),
		[
			['game-store', 'game-store', { kind: 'topTech', need: 1 }],
			['tv-station', 'tv-station', { kind: 'sameBuildings', need: 3 }],
			[
				'digital-studio',
				'digital-studio',
				{ kind: 'districts', need: 2 },
			],
			['skyscraper', 'skyscraper', { kind: 'lines', need: 1 }],
			['urban-farm', 'urban-farm', { kind: 'territoryTiles', need: 6 }],
		]
	);
	assert.ok(LANDMARK_CARDS.every((card) => card.expansion === 'pp'));
	assert.ok(Object.isFrozen(LANDMARK_CARDS[0].goal));
});

test("Plans & Ploys adds 6 landmarks with the shared footprints: the 5 cards' and the Monolith", () => {
	assert.deepEqual(
		EXPANSION_LANDMARKS.map((l) => [l.id, l.source, l.expansion]),
		[
			['game-store', { card: 'game-store' }, 'pp'],
			['tv-station', { card: 'tv-station' }, 'pp'],
			['digital-studio', { card: 'digital-studio' }, 'pp'],
			['skyscraper', { card: 'skyscraper' }, 'pp'],
			['urban-farm', { card: 'urban-farm' }, 'pp'],
			['monolith', { spaceTile: 19 }, 'pp'],
		]
	);
	for (const landmark of EXPANSION_LANDMARKS) {
		assert.equal(landmark.footprint, FOOTPRINTS[landmark.id], landmark.id);
	}
	assert.equal(landmarksFor([]).length, 18);
	assert.deepEqual(landmarksFor([]), LANDMARKS);
	assert.equal(landmarksFor(['pp']).length, 24);
});

test('Plans & Ploys adds space tiles 16 to 19: three ongoing +5 VP tiles and the Monolith (03 §1.5)', () => {
	assert.equal(SPACE_TILES.length, 15);
	assert.deepEqual(
		EXPANSION_SPACE_TILES.map((t) => [
			t.id,
			t.art,
			t.ongoing ?? null,
			t.benefit,
		]),
		[
			[16, 'technology-5-vp', { track: 'technology', vp: 5 }, []],
			[17, 'science-5-vp', { track: 'science', vp: 5 }, []],
			[18, 'military-5-vp', { track: 'military', vp: 5 }, []],
			[19, 'monolith', null, [{ landmark: 'monolith' }]],
		]
	);
	assert.equal(spaceTilesFor([]).length, 15);
	assert.equal(spaceTilesFor(['pp']).length, 19);
	assert.equal(spaceTile(19).id, 19);
	assert.equal(spaceTile(3), SPACE_TILES[2]);
});

// The expansion switch and setup

test('a table may switch on Plans & Ploys, but not an expansion not built yet', () => {
	assert.doesNotThrow(() =>
		checkOptions({ version: 'current', expansions: ['pp'] })
	);
	assert.throws(
		() => checkOptions({ version: 'current', expansions: ['aa'] }),
		/isn't available yet/
	);
});

test('a base game deals 15 space tiles, the 18 base landmarks and no landmark cards', () => {
	const { state } = newGame(3);
	assert.equal(state.supply.space.length, 15);
	assert.equal(state.landmarks.length, 18);
	assert.deepEqual(state.supply.landmarkCards, []);
	assert.ok(state.seats.every((seat) => seat.landmarkCard === null));
	assert.ok(
		!openDecisions(state).some((d) => d.kind === 'chooseLandmarkCard')
	);
});

test('with Plans & Ploys, the space stack holds 19 tiles and the landmark supply 24', () => {
	const { state } = newGame(3, PP);
	assert.deepEqual(
		[...state.supply.space].sort((a, b) => a - b),
		Array.from({ length: 19 }, (_, i) => i + 1)
	);
	assert.equal(state.landmarks.length, 24);
	assert.ok(state.landmarks.includes('monolith'));
	assert.ok(state.landmarks.includes('skyscraper'));
	assert.ok(!state.landmarks.includes('stadium'));
});

/**
 * A new P&P game played through every setup pick but the landmark draft.
 * @param {number} count
 * @param {number} [seed]
 */
function draftGame(count, seed = 1) {
	let { state, random } = newGame(count, { ...PP, seed });
	for (let step = 0; step < 100; step++) {
		const open = openDecisions(state).filter(
			(d) => d.kind !== 'chooseLandmarkCard'
		);
		if (open.length === 0) {
			break;
		}
		const [decision] = open;
		const answer = DECISIONS[decision.kind].answers(state, decision)[0];
		state = play(
			state,
			decision.player,
			{ decision: decision.id, ...answer },
			random
		);
	}
	return { state, random };
}

for (const count of [2, 3, 4, 5]) {
	test(`at ${count} players the last player draws ${count} landmark cards, and each keeps one, the first player last`, () => {
		let { state, random } = draftGame(count);
		const first = state.first;
		const order = Array.from(
			{ length: count },
			(_, i) => ((first - 2 - i + 2 * count) % count) + 1
		);
		assert.equal(order[order.length - 1], first);
		const deck = state.supply.landmarkCards.length;
		assert.equal(deck, 5 - count);
		for (const [i, player] of order.entries()) {
			const open = openDecisions(state).find(
				(d) => d.kind === 'chooseLandmarkCard'
			);
			if (i === count - 1) {
				// The first player is left one card, kept without a question.
				assert.equal(open, undefined);
				break;
			}
			assert.equal(open?.player, player);
			assert.equal(open?.options.length, count - i);
			state = play(
				state,
				player,
				{ decision: open.id, card: open.options[1] },
				random
			);
			assert.equal(
				seatOf(state, player).landmarkCard.card,
				open.options[1]
			);
		}
		const kept = state.seats.map(
			(/** @type {any} */ s) => s.landmarkCard.card
		);
		assert.equal(new Set(kept).size, count);
		assert.ok(
			state.seats.every((/** @type {any} */ s) => !s.landmarkCard.gained)
		);
		assert.equal(state.phase, 'play');
		checkState(state);
	});
}

test('alone, a player draws 2 landmark cards, keeps 1 and the other goes under the deck', () => {
	let { state, random } = draftGame(1);
	const open = openDecisions(state).find(
		(d) => d.kind === 'chooseLandmarkCard'
	);
	assert.equal(open?.options.length, 2);
	const [kept, other] = open.options;
	state = play(state, 1, { decision: open.id, card: kept }, random);
	assert.equal(seatOf(state, 1).landmarkCard.card, kept);
	assert.equal(state.supply.landmarkCards.length, 4);
	assert.equal(state.supply.landmarkCards.at(-1), other);
	checkState(state);
});

test('the landmark cards offered are hidden from the other players, and the deck from everyone; a kept card is public', () => {
	let { state, random } = draftGame(3);
	const open = openDecisions(state).find(
		(d) => d.kind === 'chooseLandmarkCard'
	);
	const drafter = open.player;
	const other = (drafter % 3) + 1;
	/** @param {any} v */
	const offer = (v) =>
		JSON.stringify(v.pending).includes(open.options[0]) ||
		JSON.stringify(
			v.events.filter((/** @type {any} */ e) => e.secret)
		).includes(open.options[0]);
	assert.equal(offer(view(state, other)), false);
	assert.equal(typeof view(state, drafter).supply.landmarkCards, 'number');
	assert.ok(
		JSON.stringify(view(state, drafter).pending).includes(open.options[0])
	);
	state = play(
		state,
		drafter,
		{ decision: open.id, card: open.options[0] },
		random
	);
	assert.equal(
		view(state, other).seats[drafter - 1].landmarkCard.card,
		open.options[0]
	);
});

test('a card offered must be the one kept', () => {
	const { state, random } = draftGame(2);
	const open = openDecisions(state).find(
		(d) => d.kind === 'chooseLandmarkCard'
	);
	const notOffered = LANDMARK_CARDS.map((c) => c.id).find(
		(id) => !open.options.includes(id)
	);
	assert.throws(
		() =>
			play(
				state,
				open.player,
				{ decision: open.id, card: notOffered },
				random
			),
		/Keep one of the landmark cards/
	);
});

// The goal

/** @param {any} seat @param {string} card */
const holding = (seat, card) => {
	seat.landmarkCard = { card, gained: false };
};

test('each goal counts what the card asks for, and is met at its number', () => {
	const { state } = startedGame(2, PP);
	const seat = seatOf(state, 1);
	assert.deepEqual(landmarkGoal(seat, 'game-store'), {
		have: 0,
		need: 1,
		met: false,
	});
	seat.tech.top.push('clocks');
	assert.deepEqual(landmarkGoal(seat, 'game-store'), {
		have: 1,
		need: 1,
		met: true,
	});

	seat.capital.buildings.push(
		{ building: 'farm', row: 8, col: 0 },
		{ building: 'farm', row: 8, col: 1 },
		{ building: 'house', row: 8, col: 2 }
	);
	assert.deepEqual(landmarkGoal(seat, 'tv-station'), {
		have: 2,
		need: 3,
		met: false,
	});
	seat.capital.buildings.push({ building: 'farm', row: 7, col: 0 });
	assert.equal(landmarkGoal(seat, 'tv-station').met, true);

	assert.equal(landmarkGoal(seat, 'skyscraper').met, false);
	completeRow(seat, 4);
	assert.deepEqual(landmarkGoal(seat, 'skyscraper'), {
		have: 1,
		need: 1,
		met: true,
	});

	seat.territoryTiles = [1, 2, 3, 4, 5];
	assert.deepEqual(landmarkGoal(seat, 'urban-farm'), {
		have: 5,
		need: 6,
		met: false,
	});
	seat.territoryTiles.push(6);
	assert.equal(landmarkGoal(seat, 'urban-farm').met, true);
});

test('a building beside the mat is not in the capital city for TV Station', () => {
	const { state } = startedGame(2, PP);
	const seat = seatOf(state, 1);
	seat.capital.buildings.push(
		{ building: 'farm', row: 8, col: 0 },
		{ building: 'farm', row: 8, col: 1 }
	);
	seat.besideMat.push('farm');
	assert.equal(landmarkGoal(seat, 'tv-station').have, 2);
});

test('a goal met at the end of your turn gains its landmark, placed in your capital, and the next player goes on', () => {
	const {
		state: ready,
		random,
		player,
	} = readyTurn(
		2,
		(seat, s) => {
			holding(seat, 'urban-farm');
			seat.territoryTiles = s.supply.territory.splice(0, 6);
		},
		PP
	);
	let state = finishTurn(ready, random, player, incomeTurn);
	const seat = seatOf(state, player);
	assert.equal(seat.landmarkCard.gained, true);
	const placed =
		seat.capital.landmarks.some(
			(/** @type {any} */ l) => l.landmark === 'urban-farm'
		) || seat.besideMat.includes('urban-farm');
	assert.ok(placed, 'the Urban Farm is placed');
	assert.ok(!state.landmarks.includes('urban-farm'));
	assert.notEqual(state.current, player);
	const kinds = state.events.map((/** @type {any} */ e) => e.type);
	assert.ok(kinds.includes('landmarkCardGoalMet'));
	checkState(state);
});

test('the placement of a card landmark names its card, for the placing prompt', () => {
	const {
		state: ready,
		random,
		player,
	} = readyTurn(
		2,
		(seat) => {
			holding(seat, 'skyscraper');
			completeRow(seat, 4);
		},
		PP
	);
	const state = finishTurn(ready, random, player, (decision) =>
		decision.kind === 'choosePlacement' ? undefined : incomeTurn(decision)
	);
	const placing = openDecisions(state).find(
		(d) => d.kind === 'choosePlacement'
	);
	if (placing) {
		assert.deepEqual(placing.source, { landmarkCard: 'skyscraper' });
	} else {
		assert.equal(seatOf(state, player).landmarkCard.gained, true);
	}
});

test("a goal not met leaves the card, and a goal met on another player's turn waits for your own", () => {
	const {
		state: ready,
		random,
		player,
	} = readyTurn(
		2,
		(seat, s) => {
			holding(seat, 'game-store');
			// The other player meets their goal, but it is not their turn.
			const other = s.seats.find((/** @type {any} */ x) => x !== seat);
			holding(other, 'urban-farm');
			other.territoryTiles = s.supply.territory.splice(0, 6);
		},
		PP
	);
	const other = player === 1 ? 2 : 1;
	let state = finishTurn(ready, random, player, incomeTurn);
	assert.equal(seatOf(state, player).landmarkCard.gained, false);
	assert.equal(seatOf(state, other).landmarkCard.gained, false);
	assert.equal(state.current, other);
	state = finishTurn(state, random, other, incomeTurn);
	assert.equal(seatOf(state, other).landmarkCard.gained, true);
});

test('a card landmark is gained once only', () => {
	const {
		state: ready,
		random,
		player,
	} = readyTurn(
		2,
		(seat, s) => {
			holding(seat, 'urban-farm');
			seat.territoryTiles = s.supply.territory.splice(0, 6);
		},
		PP
	);
	let state = finishTurn(ready, random, player, incomeTurn);
	const other = player === 1 ? 2 : 1;
	state = finishTurn(state, random, other, incomeTurn);
	state = finishTurn(state, random, player, incomeTurn);
	const gains = state.events.filter(
		(/** @type {any} */ e) => e.type === 'landmarkCardGoalMet'
	);
	assert.equal(gains.length, 1);
});

test('R111: the goal is checked at the end of the final income turn too', () => {
	const {
		state: ready,
		random,
		player,
	} = readyTurn(
		2,
		(seat, s) => {
			holding(seat, 'urban-farm');
			seat.territoryTiles = s.supply.territory.splice(0, 6);
			seat.incomeTurns = 4;
		},
		PP
	);
	const state = finishTurn(ready, random, player, incomeTurn);
	const seat = seatOf(state, player);
	assert.equal(seat.finished, true);
	assert.equal(seat.landmarkCard.gained, true);
});

test('R112: an original-rules table with Plans & Ploys still breaks ties by resources (R10)', () => {
	const { state } = startedGame(2, { ...PP, version: 'original' });
	for (const seat of state.seats) {
		seat.vp = 20;
	}
	seatOf(state, 1).capital.landmarks.push({
		landmark: 'skyscraper',
		row: 0,
		col: 0,
		rotation: 0,
	});
	seatOf(state, 2).resources.coin = 3;
	const result = rankPlayers(state);
	assert.equal(result.ranking[0].seat, 2);
	assert.deepEqual(
		result.ties[0].steps.map((step) => step.by),
		['resources']
	);
});

// The space tiles

/**
 * A ready turn whose player has explored the given space tiles.
 * @param {number[]} explored
 */
function exploredTiles(explored) {
	return readyTurn(
		2,
		(seat, s) => {
			seat.exploredSpace = [...explored];
			s.supply.space = s.supply.space.filter(
				(/** @type {number} */ t) => !explored.includes(t)
			);
			seat.resources = { coin: 9, worker: 9, food: 9, culture: 9 };
		},
		PP
	);
}

test('an explored "+5 VP" tile gains 5 VP once per advance on its track, a jump of several spaces included', () => {
	const { state: ready, random, player } = exploredTiles([16]);
	const before = seatOf(ready, player).vp;
	const state = finishTurn(ready, random, player, (decision) => {
		if (decision.kind === 'chooseTurn') {
			return { turn: 'advance' };
		}
		if (decision.kind === 'chooseAdvance') {
			return DECISIONS.chooseAdvance
				.answers(ready, decision)
				.find((/** @type {any} */ a) => a.track === 'technology');
		}
		return undefined;
	});
	const tileVp = state.events.filter(
		(/** @type {any} */ e) =>
			e.type === 'vpGained' &&
			e.player === player &&
			e.vp === 5 &&
			e.source === 'map'
	);
	assert.equal(tileVp.length, 1);
	assert.ok(seatOf(state, player).vp >= before + 5);
});

test('an explored "+5 VP" tile ignores advances on other tracks', () => {
	const { state: ready, random, player } = exploredTiles([17]);
	const state = finishTurn(ready, random, player, (decision) => {
		if (decision.kind === 'chooseTurn') {
			return { turn: 'advance' };
		}
		if (decision.kind === 'chooseAdvance') {
			return DECISIONS.chooseAdvance
				.answers(ready, decision)
				.find((/** @type {any} */ a) => a.track === 'military');
		}
		return undefined;
	});
	const tileVp = state.events.filter(
		(/** @type {any} */ e) =>
			e.type === 'vpGained' &&
			e.player === player &&
			e.vp === 5 &&
			e.source === 'map'
	);
	assert.equal(tileVp.length, 0);
});

test('exploring the Monolith tile gains the Monolith landmark', () => {
	const {
		state: ready,
		random,
		player,
	} = readyTurn(
		2,
		(seat, s) => {
			seat.spaceTiles = [19];
			s.supply.space = s.supply.space.filter(
				(/** @type {number} */ t) => t !== 19
			);
		},
		PP
	);
	const state = structuredClone(ready);
	state.pending.length = 0;
	const ctx = contextFor(state, random, state.pending);
	ctx.push([{ player, kind: 'effects', effects: [{ exploreSpace: {} }] }]);
	run(state, random);
	const seat = seatOf(state, player);
	assert.deepEqual(seat.exploredSpace, [19]);
	assert.ok(!state.landmarks.includes('monolith'));
	const gained = state.events.find(
		(/** @type {any} */ e) =>
			e.type === 'landmarkGained' && e.landmark === 'monolith'
	);
	assert.deepEqual(gained.spaceTile, 19);
	assert.equal(gained.tech, undefined);
});

test('a base game never seeds a landmark card or a Plans & Ploys tile, with the same random draws as before', () => {
	const random = seededRandom(7);
	const state = createGame({
		players: [{ name: 'Ana' }, { name: 'Bo' }],
		version: 'current',
		random,
	});
	assert.ok(state.supply.space.every((/** @type {number} */ t) => t <= 15));
	const again = createGame({
		players: [{ name: 'Ana' }, { name: 'Bo' }],
		version: 'current',
		expansions: [],
		random: seededRandom(7),
	});
	assert.deepEqual(again.supply.tech, state.supply.tech);
	assert.deepEqual(again.supply.civs, state.supply.civs);
});
