// Tests for the VP counters, territory control and gaining income buildings (#14).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { openDecisions } from '../src/lib/engine/stack.js';
import { resolveEffects } from '../src/lib/engine/loop.js';
import { controlledTerritories } from '../src/lib/engine/control.js';
import { spacesAdvanced } from '../src/lib/engine/movement.js';
import { landmarksOwned } from '../src/lib/engine/effects/vp.js';
import { startedGame } from './helpers/engine.mjs';

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
 * Seat 1's VP after resolving one vp effect.
 * @param {any} state
 * @param {any} random
 * @param {object} value
 */
function vpFor(state, random, value) {
	return resolveEffects(state, 1, [{ vp: value }], random).seats[0].vp;
}

test('a player controls a territory where every upright outpost is theirs (01 §7.3)', () => {
	const { state, random } = game();
	const start = Object.keys(state.hexes).find((key) =>
		state.hexes[key].outposts.some((o) => o.seat === 1)
	);
	const [a, b, c] = Object.keys(state.hexes).filter(
		(key) =>
			state.hexes[key].tile !== null &&
			state.hexes[key].outposts.length === 0
	);
	state.hexes[a].outposts = [
		{ seat: 1, toppled: false },
		{ seat: 2, toppled: true },
	];
	state.hexes[b].outposts = [
		{ seat: 1, toppled: true },
		{ seat: 2, toppled: false },
	];
	state.hexes[c].outposts = [{ seat: 1, toppled: true }];
	assert.deepEqual(controlledTerritories(state, 1).sort(), [start, a].sort());
	assert.equal(vpFor(state, random, { per: 'territory' }), 2);
});

test('territory tiles in the supply count for territoryTile', () => {
	const { state, random } = game((seat) => {
		seat.territoryTiles = [4, 8, 15];
	});
	assert.equal(vpFor(state, random, { per: 'territoryTile' }), 3);
});

test('tech cards in every row count for techCard', () => {
	const { state, random } = game((seat) => {
		seat.tech = {
			bottom: ['pottery', 'clocks'],
			middle: ['radio'],
			top: ['irrigation'],
		};
	});
	assert.equal(vpFor(state, random, { per: 'techCard' }), 4);
});

test('tapestry cards in the hand and on the income mat, covered ones included, count for tapestryCard', () => {
	const { state, random } = game((seat) => {
		seat.hand = ['trap-1', 'trap-2'];
		seat.incomeMat.tapestry = [
			['age-of-sail', 'trap-3'],
			['capitalism'],
			[],
			[],
		];
	});
	assert.equal(vpFor(state, random, { per: 'tapestryCard' }), 5);
});

test('trackSpace counts the most advanced token, and 12 on a track AI Singularity left (FAQ #9)', () => {
	const { state, random } = game((seat) => {
		seat.tracks.technology = [3, 7];
		seat.tracks.military = [];
		seat.restartedTracks = ['military'];
	});
	const seat = /** @type {any} */ (state.seats[0]);
	assert.equal(spacesAdvanced(seat, 'technology'), 7);
	assert.equal(spacesAdvanced(seat, 'military'), 12);
	assert.equal(spacesAdvanced(seat, 'science'), 0);
	assert.equal(
		vpFor(state, random, { per: 'trackSpace', track: 'technology' }),
		7
	);
	assert.equal(
		vpFor(state, random, { per: 'trackSpace', track: 'military' }),
		12
	);
});

test('R71: building counts are the buildings that have left the income mat', () => {
	const { state, random } = game((seat) => {
		seat.incomeMat.buildings.farm = 3;
	});
	assert.equal(vpFor(state, random, { per: 'farm' }), 2);
	assert.equal(vpFor(state, random, { per: 'house' }), 0);
});

test('vp each multiplies the count', () => {
	const { state, random } = game((seat) => {
		seat.territoryTiles = [4, 8, 15];
	});
	assert.equal(vpFor(state, random, { per: 'territoryTile', each: 2 }), 6);
});

test('a new seat has left no track', () => {
	const { state } = startedGame(2);
	assert.deepEqual(
		state.seats.map((s) => s.restartedTracks),
		[[], []]
	);
});

test('gaining a building takes it off the income mat and asks its player where to place it (#16)', () => {
	const { state, random } = game();
	const next = resolveEffects(state, 1, [{ building: 'farm' }], random);
	assert.equal(next.seats[0].incomeMat.buildings.farm, 4);
	const [placement] = openDecisions(next).filter(
		(d) => d.kind === 'choosePlacement'
	);
	assert.equal(placement.player, 1);
	assert.equal(placement.building, 'farm');
	assert.deepEqual(next.seats[0].capital.buildings, []);
	const { seq: _seq, ...event } = next.events.at(-1);
	assert.deepEqual(event, {
		type: 'buildingGained',
		player: 1,
		building: 'farm',
	});
});

test('a used-up building type gives nothing (FAQ #23)', () => {
	const { state, random } = game((seat) => {
		seat.incomeMat.buildings.farm = 0;
	});
	const next = resolveEffects(state, 1, [{ building: 'farm' }], random);
	assert.equal(next.seats[0].incomeMat.buildings.farm, 0);
	const { seq: _seq, ...event } = next.events.at(-1);
	assert.deepEqual(event, {
		type: 'noBuildingLeft',
		player: 1,
		building: 'farm',
	});
});

test('trackLead counts tracks where nobody is ahead, ties included', () => {
	const { state, random } = game((seat, s) => {
		seat.tracks.exploration = [3];
		seat.tracks.science = [5];
		seat.tracks.technology = [1];
		seat.tracks.military = [0];
		s.seats[1].tracks.exploration = [3];
		s.seats[1].tracks.science = [2];
		s.seats[1].tracks.technology = [4];
		s.seats[1].tracks.military = [0];
	});
	assert.equal(vpFor(state, random, { per: 'trackLead' }), 3);
	assert.equal(vpFor(state, random, { per: 'trackLead', each: 4 }), 12);
});

test('trackLead counts a track AI Singularity restarted as 12 for everyone', () => {
	const { state, random } = game((seat, s) => {
		for (const id of Object.keys(seat.tracks)) {
			seat.tracks[id] = [0];
			s.seats[1].tracks[id] = [0];
		}
		s.seats[1].tracks.science = [8];
		seat.tracks.science = [];
		seat.restartedTracks = ['science'];
		s.seats[1].tracks.military = [];
		s.seats[1].restartedTracks = ['military'];
	});
	// Science: 12 against 8, a lead. Military: 0 against 12, behind. The other two tie at 0.
	assert.equal(vpFor(state, random, { per: 'trackLead' }), 3);
});

test('landmark counts landmarks in the capital and beside the mat, not buildings (R71)', () => {
	const { state, random } = game((seat) => {
		seat.capital.landmarks = [
			{ landmark: 'lighthouse', row: 0, col: 0, rotation: 0 },
		];
		seat.besideMat = ['farm', 'apothecary', 'train-station'];
	});
	assert.equal(vpFor(state, random, { per: 'landmark' }), 3);
	assert.equal(vpFor(state, random, { per: 'landmark', each: 3 }), 9);
	assert.deepEqual(landmarksOwned(state, 1), [
		'lighthouse',
		'apothecary',
		'train-station',
	]);
});

test('opponent counts the other seats', () => {
	const { state, random } = startedGame(3);
	assert.equal(vpFor(state, random, { per: 'opponent' }), 2);
});
