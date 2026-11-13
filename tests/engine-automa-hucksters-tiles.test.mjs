// Hucksters tile choices happen before drawing, once for each tile (#34).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createGame } from '../src/lib/engine/game.js';
import { seededRandom } from '../src/lib/engine/random.js';
import { contextFor } from '../src/lib/engine/loop.js';
import {
	gain,
	gainTiles,
	sampleTiles,
} from '../src/lib/engine/effects/gain.js';
import {
	huckstersTileGain,
	chooseHuckstersTile,
} from '../src/lib/engine/decisions/choose-hucksters-tile.js';

function setup() {
	const random = seededRandom(31);
	const state = createGame({
		version: 'current',
		random,
		participants: [
			{ kind: 'player', name: 'Ana' },
			{ kind: 'automa', name: 'Automa', level: 2 },
			{ kind: 'shadow', name: 'Shadow' },
		],
	});
	state.pending = [];
	state.current = 1;
	state.turnKind = 'advance';
	state.seats[1].civilization = 'hucksters';
	state.seats[1].huckstersPool = {
		territory: [17],
		space: [3],
		tapestry: [],
		tech: [],
		masterpiece: [],
	};
	state.supply.territory = [1, 2, 4];
	state.supply.space = [5, 6];
	return { state, ctx: contextFor(state, random, state.pending) };
}

test('a gain with several tiles asks before drawing and preserves its remaining gain', () => {
	const { state, ctx } = setup();
	gain(ctx, 1, { territory: 2, space: 1, any: 1 });
	assert.deepEqual(state.supply.territory, [1, 2, 4]);
	assert.equal(state.pending[0].kind, 'huckstersTileGain');
	assert.equal(state.pending[1].kind, 'effects');
	const first = state.pending.shift();
	huckstersTileGain(ctx, first);
	const decision = state.pending.shift();
	assert.equal(decision.kind, 'chooseHuckstersTile');
	const answers = chooseHuckstersTile.answers(state, decision);
	assert.deepEqual(answers[0], { pile: 'supply' });
	assert.ok(answers.some((a) => a.pile === 'hucksters' && a.item === 17));
	chooseHuckstersTile.resolve(ctx, decision, {
		pile: 'hucksters',
		owner: 2,
		item: 17,
	});
	assert.ok(state.seats[0].territoryTiles.includes(17));
	assert.deepEqual(state.supply.territory, [1, 2, 4]);
	assert.deepEqual(state.seats[1].huckstersPool.territory, []);
	assert.ok(
		state.events.some(
			(e) => e.type === 'tilesGained' && e.tiles.includes(17)
		)
	);
	assert.equal(state.pending[0].kind, 'huckstersTileGain');
	assert.deepEqual(state.pending[0].steps, [
		{ stack: 'territory', count: 1 },
		{ stack: 'space', count: 1 },
	]);
});

test('declining a pool tile draws from the normal supply and leaves the pool untouched', () => {
	const { state, ctx } = setup();
	gain(ctx, 1, { territory: 1 });
	huckstersTileGain(ctx, state.pending.shift());
	const decision = state.pending.shift();
	chooseHuckstersTile.check(state, decision, { pile: 'supply' });
	chooseHuckstersTile.resolve(ctx, decision, { pile: 'supply' });
	assert.ok(state.seats[0].territoryTiles.includes(1));
	assert.deepEqual(state.seats[1].huckstersPool.territory, [17]);
});

test('the Time Travelers blocked Monolith is discarded and normal and Psionics draws continue', () => {
	const { state, ctx } = setup();
	state.seats[1].civilization = 'time-travelers';
	state.seats[1].timeTravelersLandmark = 'monolith';
	state.supply.space = [19, 3, 19, 4, 5];
	assert.deepEqual(gainTiles(ctx, 1, 'space', 1), [3]);
	assert.deepEqual(state.supply.spaceDiscard, [19]);
	sampleTiles(ctx, 1, 'space', 1);
	assert.deepEqual(state.supply.spaceDiscard, [19, 19]);
	assert.deepEqual(state.pending[0].options, [4, 5]);
});
