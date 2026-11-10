// A&A's landmark cards (#35 part 3): the data, the deal and draft, and each goal (03 §2.10, §7).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createGame } from '../src/lib/engine/setup.js';
import { seededRandom } from '../src/lib/engine/random.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { play } from '../src/lib/engine/play.js';
import {
	landmarkCardDeal,
	landmarkGoal,
} from '../src/lib/engine/landmark-cards.js';
import { contextFor, resolveEffects, run } from '../src/lib/engine/loop.js';
import { moveToken } from '../src/lib/engine/movement.js';
import { controlledTerritories } from '../src/lib/engine/control.js';
import { hexNeighbours } from '../src/lib/engine/data/maps.js';
import { TRACKS } from '../src/lib/engine/data/tracks.js';
import { landmarkCardsFor } from '../src/lib/engine/data/landmark-cards.js';
import {
	EXPANSION_LANDMARKS,
	landmarksFor,
} from '../src/lib/engine/data/landmarks.js';
import { FOOTPRINTS } from '../src/lib/art/footprints.js';
import { newGame, readyTurn, startedGame } from './helpers/engine.mjs';
import { AA } from './helpers/arts.mjs';
import { checkState } from './helpers/invariants.mjs';

/** A&A's landmark cards, in the order of 03 §2.10. */
const AA_CARDS = [
	'villa',
	'birdwatching-perch',
	'castle',
	'windmill',
	'bridge',
];

// The data

test('A&A has 5 landmark cards, each naming its own landmark and goal (03 §2.10)', () => {
	const cards = landmarkCardsFor(['aa']);
	assert.deepEqual(
		cards.map((card) => [card.id, card.landmark, card.goal]),
		[
			['villa', 'villa', { kind: 'buildingTypes', need: 3 }],
			[
				'birdwatching-perch',
				'birdwatching-perch',
				{ kind: 'inventedTech', need: 3 },
			],
			['castle', 'castle', { kind: 'takenTier', need: 1 }],
			['windmill', 'windmill', { kind: 'tierTwoTracks', need: 2 }],
			['bridge', 'bridge', { kind: 'startNeighbours', need: 3 }],
		]
	);
	assert.ok(cards.every((card) => card.expansion === 'aa'));
	assert.equal(landmarkCardsFor(['pp', 'aa']).length, 10);
});

test('A&A adds its 5 card landmarks with the shared footprints, also without the arts track (R63, R65)', () => {
	for (const id of AA_CARDS) {
		const landmark = EXPANSION_LANDMARKS.find((l) => l.id === id);
		assert.deepEqual(landmark?.source, { card: id }, id);
		assert.equal(landmark?.expansion, 'aa', id);
		assert.equal(landmark?.arts, undefined, id);
		assert.equal(landmark?.footprint, FOOTPRINTS[id], id);
	}
	const off = landmarksFor(['aa'], ['no-arts-track']).map((l) => l.id);
	assert.ok(AA_CARDS.every((id) => off.includes(id)));
	const castle = EXPANSION_LANDMARKS.find((l) => l.id === 'castle');
	assert.equal(castle?.footprint.join('').replaceAll('.', '').length, 12);
});

// The deal and the draft

/**
 * A new game played through every setup pick but the landmark draft.
 * @param {number} count
 * @param {string[]} expansions
 * @param {string[]} [variants]
 */
function draftGame(count, expansions, variants = []) {
	let { state, random } = newGame(count, { expansions, variants });
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

/**
 * Plays the whole draft, each drafter keeping the first card offered, and returns the state and the offers' sizes.
 * @param {any} state
 * @param {any} random
 * @returns {{ state: any, offers: { player: number, options: number, drafters: number[] }[] }}
 */
function draftAll(state, random) {
	const offers = [];
	for (let step = 0; step < 10; step++) {
		const open = openDecisions(state).find(
			(d) => d.kind === 'chooseLandmarkCard'
		);
		if (!open) {
			break;
		}
		offers.push({
			player: open.player,
			options: open.options.length,
			drafters: open.drafters,
		});
		state = play(
			state,
			open.player,
			{ decision: open.id, card: open.options[0] },
			random
		);
	}
	return { state, offers };
}

for (const [count, variants] of [
	[2, []],
	[4, []],
	[3, ['no-arts-track']],
]) {
	test(`with A&A alone at ${count} players${variants.length ? ', the arts track off,' : ''} the last player draws one card per player, and each keeps one`, () => {
		const drafting = draftGame(
			/** @type {number} */ (count),
			['aa'],
			/** @type {string[]} */ (variants)
		);
		const { state, offers } = draftAll(drafting.state, drafting.random);
		assert.equal(offers[0].options, count);
		// The Urban Planners take one more card from what is left (#37).
		const planners = state.seats.filter((/** @type {any} */ s) =>
			s.civs.includes('urban-planners')
		).length;
		assert.equal(
			state.supply.landmarkCards.length,
			Math.max(0, 5 - Number(count) - planners)
		);
		const kept = state.seats.map(
			(/** @type {any} */ s) => s.landmarkCard.card
		);
		assert.equal(new Set(kept).size, count);
		assert.ok(kept.every((card) => AA_CARDS.includes(card)));
		assert.equal(state.phase, 'play');
		checkState(state);
	});
}

for (const count of [2, 3, 5]) {
	test(`with both expansions at ${count} players the draft deals ${count + 1}, and the last drafter chooses from 2 (03 §7)`, () => {
		const drafting = draftGame(count, ['pp', 'aa']);
		const { state, offers } = draftAll(drafting.state, drafting.random);
		assert.equal(offers[0].options, count + 1);
		assert.equal(offers.length, count);
		const last = offers[offers.length - 1];
		assert.deepEqual(last, {
			player: state.first,
			options: 2,
			drafters: [],
		});
		const kept = state.seats.map(
			(/** @type {any} */ s) => s.landmarkCard.card
		);
		assert.equal(new Set(kept).size, count);
		assert.equal(state.supply.landmarkCards.length, 10 - count);
		checkState(state);
	});
}

test('alone a player draws 2 whatever the expansions; otherwise one per player, and one more with both', () => {
	assert.equal(landmarkCardDeal(['pp', 'aa'], 1), 2);
	assert.equal(landmarkCardDeal(['aa'], 1), 2);
	assert.equal(landmarkCardDeal(['pp'], 3), 3);
	assert.equal(landmarkCardDeal(['aa'], 3), 3);
	assert.equal(landmarkCardDeal(['pp', 'aa'], 3), 4);
});

test('a P&P game deals as before, with the same random draws', () => {
	const state = createGame({
		players: [{ name: 'Ana' }, { name: 'Bo' }],
		version: 'current',
		expansions: ['pp'],
		random: seededRandom(7),
	});
	// Recorded before part 3 changed setup.
	assert.deepEqual(state.supply.landmarkCards, [
		'digital-studio',
		'tv-station',
		'urban-farm',
		'game-store',
		'skyscraper',
	]);
	assert.deepEqual(state.supply.tech.deck.slice(0, 5), [
		'siegecraft',
		'zeppelins',
		'irrigation',
		'the-nail',
		'time-travel',
	]);
});

// The goals

/** @param {any} state @param {number} player */
const seatOf = (state, player) => state.seats[player - 1];

/**
 * Gives a seat a landmark card, swapping it with the card the seat drafted wherever it lies, so every card stays in
 * exactly one place for the invariants.
 * @param {any} state
 * @param {any} seat
 * @param {string} card
 */
function holding(state, seat, card) {
	const old = seat.landmarkCard?.card;
	if (old !== undefined && old !== card) {
		const deck = state.supply.landmarkCards;
		const other = state.seats.find(
			(/** @type {any} */ s) =>
				s !== seat && s.landmarkCard?.card === card
		);
		if (other) {
			other.landmarkCard = { ...other.landmarkCard, card: old };
		} else if (deck.includes(card)) {
			deck[deck.indexOf(card)] = old;
		}
	}
	seat.landmarkCard = { card, gained: false };
}

/**
 * Takes a track tier's landmark out of the supply, beside another seat's mat, as if that seat had gained it.
 * @param {any} state
 * @param {import('../src/lib/engine/data/ids.js').TrackId} track
 * @param {2 | 3 | 4} tier
 * @param {any} by - The seat that has it
 */
function taken(state, track, tier, by) {
	const landmark = TRACKS[track][[4, 7, 10][tier - 2]].landmark;
	state.landmarks.splice(state.landmarks.indexOf(landmark), 1);
	by.besideMat.push(landmark);
}

/**
 * Answers open decisions with their first answer while `player`'s turn lasts, taking an income turn, then returns
 * the state.
 * @param {any} state
 * @param {any} random
 * @param {number} player
 */
function finishTurn(state, random, player) {
	for (let step = 0; step < 300; step++) {
		if (state.current !== player || state.phase !== 'play') {
			return state;
		}
		const [open] = openDecisions(state);
		if (!open) {
			return state;
		}
		const answer =
			open.kind === 'chooseTurn'
				? { turn: 'income' }
				: DECISIONS[open.kind].answers(state, open)[0];
		state = play(
			state,
			open.player,
			{ decision: open.id, ...answer },
			random
		);
	}
	throw new Error('The turn never ended.');
}

test('Villa counts the types of income building in the capital, not beside the mat (R64)', () => {
	const { state } = startedGame(2, AA);
	const seat = seatOf(state, 1);
	seat.capital.buildings.push(
		{ building: 'farm', row: 8, col: 0 },
		{ building: 'farm', row: 8, col: 1 },
		{ building: 'house', row: 8, col: 2 }
	);
	seat.besideMat.push('armory');
	assert.deepEqual(landmarkGoal(seat, 'villa', state), {
		have: 2,
		need: 3,
		met: false,
	});
	seat.capital.buildings.push({ building: 'market', row: 7, col: 0 });
	assert.deepEqual(landmarkGoal(seat, 'villa', state), {
		have: 3,
		need: 3,
		met: true,
	});
});

test('Birdwatching Perch counts the tech cards held in every row', () => {
	const { state } = startedGame(2, AA);
	const seat = seatOf(state, 1);
	seat.tech = { bottom: ['clocks'], middle: ['bakery'], top: [] };
	assert.deepEqual(landmarkGoal(seat, 'birdwatching-perch', state), {
		have: 2,
		need: 3,
		met: false,
	});
	seat.tech.top.push('radio');
	assert.deepEqual(landmarkGoal(seat, 'birdwatching-perch', state), {
		have: 3,
		need: 3,
		met: true,
	});
});

test('Windmill counts the tracks at tier II or higher, the arts track included (R118)', () => {
	const { state } = startedGame(2, AA);
	const seat = seatOf(state, 1);
	for (const track of Object.keys(seat.tracks)) {
		seat.tracks[track] = [3];
	}
	assert.equal(landmarkGoal(seat, 'windmill', state).have, 0);
	seat.tracks.arts = [4];
	assert.deepEqual(landmarkGoal(seat, 'windmill', state), {
		have: 1,
		need: 2,
		met: false,
	});
	seat.tracks.exploration = [4];
	assert.equal(landmarkGoal(seat, 'windmill', state).met, true);
	// A track AI Singularity restarted still counts as 12 spaces (FAQ #9).
	seat.tracks.exploration = [0];
	seat.restartedTracks = ['exploration'];
	assert.equal(landmarkGoal(seat, 'windmill', state).have, 2);
});

test('Windmill without the arts track counts the 4 tracks', () => {
	const { state } = startedGame(2, {
		expansions: ['aa'],
		variants: ['no-arts-track'],
	});
	const seat = seatOf(state, 1);
	assert.deepEqual(Object.keys(seat.tracks).length, 4);
	seat.tracks.science = [10];
	seat.tracks.military = [7];
	assert.equal(landmarkGoal(seat, 'windmill', state).have, 2);
});

test('Bridge counts the territories controlled next to the starting territory', () => {
	const { state } = startedGame(2, AA);
	const seat = seatOf(state, 1);
	const around = hexNeighbours(seat.start).filter(
		(key) => key in state.hexes
	);
	assert.ok(around.length >= 3, 'the start has 3 neighbours on the map');
	const outpost = (/** @type {string} */ key, /** @type {number} */ by) =>
		state.hexes[key].outposts.push({ seat: by, toppled: false });
	// The starting territory itself is controlled, but isn't next to itself.
	assert.ok(controlledTerritories(state, 1).includes(seat.start));
	assert.equal(landmarkGoal(seat, 'bridge', state).have, 0);
	outpost(around[0], 1);
	outpost(around[1], 1);
	assert.deepEqual(landmarkGoal(seat, 'bridge', state), {
		have: 2,
		need: 3,
		met: false,
	});
	// An opponent's territory there doesn't count, nor one both stand on.
	outpost(around[2], 2);
	assert.equal(landmarkGoal(seat, 'bridge', state).have, 2);
	outpost(around[2], 1);
	assert.equal(landmarkGoal(seat, 'bridge', state).have, 2);
	state.hexes[around[2]].outposts = [{ seat: 1, toppled: false }];
	assert.deepEqual(landmarkGoal(seat, 'bridge', state), {
		have: 3,
		need: 3,
		met: true,
	});
	assert.equal(
		landmarkGoal({ ...seat, start: null }, 'bridge', state).have,
		0
	);
	assert.throws(() => landmarkGoal(seat, 'bridge'), /needs the game/);
	assert.throws(() => landmarkGoal(seat, 'castle'), /needs the game/);
});

test('Castle: advancing on your turn into a tier whose landmark is taken records it', () => {
	const {
		state: ready,
		random,
		player,
	} = readyTurn(
		2,
		(seat, state) => {
			seat.tracks.exploration = [3];
			taken(
				state,
				'exploration',
				2,
				state.seats.find((/** @type {any} */ s) => s !== seat)
			);
		},
		AA
	);
	assert.deepEqual(ready.takenTiers, []);
	const state = resolveEffects(
		ready,
		player,
		[{ advance: { tracks: ['exploration'] } }],
		random
	);
	assert.deepEqual(state.takenTiers, [
		{ player, track: 'exploration', tier: 2 },
	]);
	assert.deepEqual(landmarkGoal(seatOf(state, player), 'castle', state), {
		have: 1,
		need: 1,
		met: true,
	});
});

/**
 * A ready A&A turn whose player stands on exploration `from`, with the landmarks of `tiers` taken by the other seat,
 * whose token stands on exploration 3.
 * @param {number} from
 * @param {(2 | 3 | 4)[]} tiers
 */
function castleTurn(from, tiers) {
	const ready = readyTurn(
		2,
		(seat, state) => {
			const other = state.seats.find(
				(/** @type {any} */ s) => s !== seat
			);
			seat.tracks.exploration = [from];
			other.tracks.exploration = [3];
			for (const tier of tiers) {
				taken(state, 'exploration', tier, other);
			}
		},
		AA
	);
	return { ...ready, other: ready.player === 1 ? 2 : 1 };
}

/**
 * Moves a token on exploration and runs what follows, then gives the Castle's record.
 * @param {ReturnType<typeof castleTurn>} turn
 * @param {number} mover
 * @param {{ from: number, to: number, jump?: boolean }} move
 */
function recorded({ state: ready, random }, mover, { from, to, jump }) {
	const state = structuredClone(ready);
	moveToken(contextFor(state, random, state.pending), mover, {
		track: 'exploration',
		from,
		to,
		benefit: false,
		jump,
	});
	run(state, random);
	return state.takenTiers;
}

test('Castle: a move that passes two taken tiers records both (R9)', () => {
	const turn = castleTurn(3, [2, 3]);
	assert.deepEqual(recorded(turn, turn.player, { from: 3, to: 7 }), [
		{ player: turn.player, track: 'exploration', tier: 2 },
		{ player: turn.player, track: 'exploration', tier: 3 },
	]);
});

test("Castle: a tier whose landmark is there, a regress, a jump, or another player's move records nothing", () => {
	const open = castleTurn(3, []);
	assert.deepEqual(recorded(open, open.player, { from: 3, to: 4 }), []);
	const back = castleTurn(7, [2]);
	assert.deepEqual(recorded(back, back.player, { from: 7, to: 6 }), []);
	const jump = castleTurn(3, [2]);
	assert.deepEqual(
		recorded(jump, jump.player, { from: 3, to: 7, jump: true }),
		[]
	);
	const theirs = castleTurn(3, [2]);
	assert.deepEqual(recorded(theirs, theirs.other, { from: 3, to: 4 }), []);
});

test("the Castle's landmark is gained at the end of the turn its goal is met, and the record clears with the next turn", () => {
	const turn = castleTurn(3, [2]);
	holding(turn.state, seatOf(turn.state, turn.player), 'castle');
	const moved = resolveEffects(
		turn.state,
		turn.player,
		[{ advance: { tracks: ['exploration'] } }],
		turn.random
	);
	const state = finishTurn(moved, turn.random, turn.player);
	const seat = seatOf(state, turn.player);
	assert.equal(seat.landmarkCard.gained, true);
	assert.ok(
		seat.capital.landmarks.some(
			(/** @type {any} */ l) => l.landmark === 'castle'
		) || seat.besideMat.includes('castle'),
		'the Castle is placed'
	);
	assert.equal(state.current, turn.other);
	assert.deepEqual(state.takenTiers, []);
	checkState(state);
});

test('Birdwatching Perch and Bridge are gained at the end of the turn too', () => {
	const perch = readyTurn(
		2,
		(seat, state) => {
			holding(state, seat, 'birdwatching-perch');
			seat.tech.bottom.push(...state.supply.tech.deck.splice(0, 3));
		},
		AA
	);
	const after = finishTurn(perch.state, perch.random, perch.player);
	assert.equal(seatOf(after, perch.player).landmarkCard.gained, true);
	checkState(after);

	const bridge = readyTurn(
		2,
		(seat, state) => {
			holding(state, seat, 'bridge');
			const around = hexNeighbours(seat.start).filter(
				(key) => key in state.hexes
			);
			for (const key of around.slice(0, 3)) {
				state.hexes[key].outposts.push({
					seat: seat.seat,
					toppled: false,
				});
				seat.outposts -= 1;
			}
		},
		AA
	);
	const done = finishTurn(bridge.state, bridge.random, bridge.player);
	assert.equal(seatOf(done, bridge.player).landmarkCard.gained, true);
	checkState(done);
});
