// Your overview (#26): the viewer's name, era, VP, resources and counts, from their own view.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { view } from '../src/lib/engine/game.js';
import { areaSummary, selfSummary } from '../src/lib/overview.js';
import { startedGame } from './helpers/engine.mjs';

test("a started game's summary has the seat's name, VP, resources and counts", () => {
	const { state } = startedGame(2);
	const summary = selfSummary(view(state, 1), 1);
	assert.equal(summary.name, state.seats[0].name);
	assert.equal(summary.seat, 1);
	assert.equal(summary.vp, state.seats[0].vp);
	assert.deepEqual(summary.resources, state.seats[0].resources);
	assert.equal(summary.hand, state.seats[0].hand.length);
	assert.equal(summary.tech, 0);
	assert.equal(summary.territories, 1, 'the start territory');
	assert.equal(summary.lines, 0);
	assert.equal(summary.era, 1);
});

test('the summary follows the seat whose tabs are shown', () => {
	const { state } = startedGame(2);
	const viewer = /** @type {any} */ (state.seats[0]);
	const opponent = /** @type {any} */ (state.seats[1]);
	opponent.name = 'Asterdoria';
	opponent.resources = { coin: 2, worker: 3, food: 4, culture: 5 };
	opponent.vp = 17;

	const summary = selfSummary(view(state, 1), 2);

	assert.equal(summary?.name, 'Asterdoria');
	assert.equal(summary?.seat, 2);
	assert.equal(summary?.vp, 17);
	assert.deepEqual(summary?.resources, opponent.resources);
	assert.notDeepEqual(summary?.resources, viewer.resources);
});

test('tech counts every row, and complete rows and columns count as lines', () => {
	const { state } = startedGame(2);
	const seat = /** @type {any} */ (state.seats[0]);
	seat.tech = { bottom: ['clocks'], middle: ['bakery'], top: [] };
	const summary = selfSummary(view(state, 1), 1);
	assert.equal(summary.tech, 2);
});

test('no summary for the public view or a seat that is not a player', () => {
	const { state } = startedGame(2);
	assert.equal(selfSummary(view(state, null), null), null);
});

test('during setup, before a capital mat is dealt, the summary counts no lines', async () => {
	const { newGame } = await import('./helpers/engine.mjs');
	const { state } = newGame(2);
	const summary = selfSummary(view(state, 1), 1);
	assert.equal(summary?.lines, 0);
});

test("the summary follows the seat on show: another player's own counts, without your prompt's preview (#157)", () => {
	const { state } = startedGame(2);
	/** @type {any} */ (state.seats[1]).resources = {
		coin: 4,
		worker: 3,
		food: 2,
		culture: 1,
	};
	/** @type {any} */ (state.seats[1]).vp = 7;
	const game = view(state, 1);
	const preview = {
		resources: { coin: 0, worker: 1, food: 1, culture: 1 },
		changed: ['coin'],
	};
	const theirs = areaSummary(game, 2, 1, preview);
	assert.equal(theirs?.seat, 2);
	assert.equal(theirs?.name, state.seats[1].name);
	assert.equal(theirs?.vp, 7);
	assert.deepEqual(theirs?.resources, {
		coin: 4,
		worker: 3,
		food: 2,
		culture: 1,
	});
	assert.deepEqual(theirs?.changed, []);
	// Your own shows your prompt's preview of your resources.
	const mine = areaSummary(game, 1, 1, preview);
	assert.equal(mine?.seat, 1);
	assert.equal(mine?.name, state.seats[0].name);
	assert.deepEqual(mine?.resources, preview.resources);
	assert.deepEqual(mine?.changed, ['coin']);
	// The public view shows the seat a chip opened, and nothing otherwise.
	const shared = view(state, null);
	assert.equal(areaSummary(shared, 2, null, preview)?.seat, 2);
	assert.deepEqual(areaSummary(shared, 2, null, preview)?.changed, []);
	assert.equal(areaSummary(shared, null, null, preview), null);
});
