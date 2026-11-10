// Fantasies & Futures' rules (#39): the expansion switch, its seats' fields, and the rules every game already has.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { EXPANSIONS_BUILT } from '../src/lib/engine/setup.js';
import { currentEra } from '../src/lib/engine/tapestry.js';
import { techCard } from '../src/lib/engine/data/tech-cards.js';
import { FOOTPRINTS } from '../src/lib/art/footprints.js';
import { resolveEffects } from '../src/lib/engine/loop.js';
import { newGame, readyTurn } from './helpers/engine.mjs';
import { checkState } from './helpers/invariants.mjs';

test('F&F is offered, and its seats start with no charmed card played and no card flipped', () => {
	assert.ok(EXPANSIONS_BUILT.includes('ff'));
	const { state } = newGame(3, { expansions: ['ff'] });
	for (const seat of /** @type {any[]} */ (state.seats)) {
		assert.equal(seat.playedCharmed, false);
		assert.deepEqual(seat.flippedTech, []);
	}
	checkState(state);
});

test('a game without F&F is unchanged, seed for seed', () => {
	const base = newGame(3, { seed: 7 }).state;
	for (const seat of /** @type {any[]} */ (base.seats)) {
		assert.ok(!('playedCharmed' in seat));
		assert.ok(!('flippedTech' in seat));
	}
	const pp = newGame(3, { seed: 7, expansions: ['pp'] }).state;
	assert.deepEqual(base.supply.tech, pp.supply.tech);
});

test('R118: an advance listing the arts track skips it when the arts track is out of play', () => {
	const { state, random, player } = readyTurn(2);
	const next = resolveEffects(
		state,
		player,
		[{ advance: { tracks: ['arts', 'technology'], noBenefit: true } }],
		random
	);
	assert.deepEqual(
		/** @type {any} */ (next.seats[player - 1]).tracks.technology,
		[1]
	);
	checkState(next);
});

test('R25 with F&F: a card played in or after income turn 5 goes onto the era-4 stack, none in the original rules', () => {
	const { state } = newGame(2, { expansions: ['ff'] });
	state.seats[0].incomeTurns = 5;
	assert.equal(currentEra(state, 1), 4);
	const original = newGame(2, {
		expansions: ['ff'],
		version: 'original',
	}).state;
	original.seats[0].incomeTurns = 5;
	assert.equal(currentEra(original, 1), null);
});

test("F&F's replacement cards: the corrected footprints, and Oil Paint's neighbours (R125)", () => {
	assert.deepEqual([...FOOTPRINTS.villa], ['X..', 'XXX', 'XXX']);
	assert.deepEqual([...FOOTPRINTS['birdwatching-perch']], ['.XXX', 'XXX.']);
	assert.deepEqual([...FOOTPRINTS.castle], ['.XXX', 'XXXX', '.XXX', '.XX.']);
	assert.deepEqual(techCard('oil-paint').requires, {
		track: 'arts',
		tier: 2,
		selfInOriginal: true,
	});
});
