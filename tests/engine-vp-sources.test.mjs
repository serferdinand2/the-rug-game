// Where each player's VP came from (#29 design §2): every award is credited to its source, and the sources add up.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { play } from '../src/lib/engine/game.js';
import { push, openDecisions } from '../src/lib/engine/stack.js';
import { contextFor, run } from '../src/lib/engine/loop.js';
import { claimAchievement } from '../src/lib/engine/achievements.js';
import { pay } from '../src/lib/engine/payment.js';
import { newGame, startedGame } from './helpers/engine.mjs';
import { simulate } from './helpers/simulation.mjs';

/**
 * Runs one operation on a copy of a started two-player game and returns the copy.
 * @param {Record<string, any>} op - Without its id
 * @param {any} [state]
 */
function runOp(op, state) {
	const { state: started, random } = state
		? { state, random: startedGame(2).random }
		: startedGame(2);
	const next = structuredClone(started);
	next.pending.length = 0;
	push(next, next.pending, [/** @type {any} */ ({ player: 1, ...op })]);
	run(next, random);
	return { state: next, random };
}

test('a new game starts every seat with no VP from anywhere', () => {
	const { state } = newGame(3);
	for (const seat of state.seats) {
		assert.deepEqual(seat.vpSources, {});
	}
});

test('VP is credited to the source of the operation that gave it', () => {
	const cases = [
		[{ source: { track: 'exploration', space: 5 } }, 'tracks'],
		[{ source: { tapestry: 'monarchy', card: 'monarchy' } }, 'tapestry'],
		[{ source: { tech: 'clocks', icon: 'square' } }, 'tech'],
		[{ source: { hex: '0_1' } }, 'map'],
		[{ source: { spaceTile: 3 } }, 'map'],
		[{ origin: 'income' }, 'income'],
		[{ passive: true }, 'civ'],
		[{}, 'other'],
	];
	for (const [extra, source] of cases) {
		const { state } = runOp({
			kind: 'effects',
			effects: [{ vp: 3 }],
			...extra,
		});
		assert.deepEqual(state.seats[0].vpSources, { [source]: 3 }, source);
		assert.equal(state.seats[0].vp, 3);
		const gained = state.events.findLast((e) => e.type === 'vpGained');
		assert.equal(gained?.source, source, source);
	}
});

test('an operation inherits its source through a decision and its answer', () => {
	const { state, random } = runOp({
		kind: 'effects',
		effects: [{ choice: [[{ vp: 2 }], [{ vp: 5 }]] }],
		origin: 'income',
	});
	const decision = openDecisions(state).find((d) => d.player === 1);
	assert.ok(decision, 'the choice is asked');
	assert.equal(decision.origin, 'income');
	const after = play(state, 1, { decision: decision.id, option: 1 }, random);
	assert.equal(after.seats[0].vp, 5);
	assert.deepEqual(after.seats[0].vpSources, { income: 5 });
});

test("a child that copies its parent's source keeps the parent's origin", () => {
	// The Traders' VP comes from a hook marked civ, though it names the hex where the token went; a choice copies
	// the source to its question and its answer.
	const { state, random } = runOp({
		kind: 'effects',
		effects: [{ choice: [[{ vp: 4 }], [{ vp: 1 }]] }],
		source: { hex: '0_1' },
		origin: 'civ',
	});
	const decision = openDecisions(state).find((d) => d.player === 1);
	assert.ok(decision, 'the choice is asked');
	assert.deepEqual(decision.source, { hex: '0_1' });
	assert.equal(decision.origin, 'civ');
	const after = play(state, 1, { decision: decision.id, option: 0 }, random);
	assert.deepEqual(after.seats[0].vpSources, { civ: 4 });
});

test('a new source under a parent takes over: an explore inside a track space is the map', () => {
	const { state, random } = runOp({
		kind: 'effects',
		effects: [{ choice: [[{ vp: 2 }]] }],
		source: { track: 'exploration', space: 2 },
	});
	const decision = openDecisions(state).find((d) => d.player === 1);
	assert.equal(decision?.origin, 'tracks');
	const ctxState = structuredClone(state);
	ctxState.pending.length = 0;
	push(
		ctxState,
		ctxState.pending,
		[
			{
				player: 1,
				kind: 'effects',
				effects: [{ vp: 3 }],
				source: { hex: '1_1' },
			},
		],
		/** @type {any} */ ({
			origin: 'tracks',
			source: { track: 'exploration', space: 2 },
		})
	);
	run(ctxState, random);
	assert.equal(ctxState.seats[0].vpSources.map, 3);
});

test('scoring the capital counts as the capital, an achievement as achievements, VP paid as paid', () => {
	const { state: started, random } = startedGame(2);
	const state = structuredClone(started);
	state.pending.length = 0;
	const ctx = contextFor(state, random, state.pending);
	claimAchievement(ctx, 1, 'complete-track');
	assert.equal(state.seats[0].vpSources.achievements, state.seats[0].vp);
	pay(ctx, 1, { vp: 2 });
	assert.equal(state.seats[0].vpSources.paid, -2);
	const { state: scored } = runOp(
		{ kind: 'effects', effects: [{ scoreCapital: {} }], origin: 'tracks' },
		state
	);
	assert.equal(scored.seats[0].vpSources.capital ?? 0, 0);
	assert.ok(!('tracks' in scored.seats[0].vpSources));
});

test("each seat's sources add up to its VP", () => {
	const { state } = runOp({
		kind: 'effects',
		effects: [{ vp: 7 }],
		source: { track: 'military', space: 4 },
	});
	for (const seat of state.seats) {
		const sum = Object.values(seat.vpSources).reduce((a, b) => a + b, 0);
		assert.equal(sum, seat.vp);
	}
});

test('in random games every VP gained is credited to a named source, never other', () => {
	for (let index = 0; index < 10; index++) {
		let seen = 0;
		/** @type {any[]} */
		const unnamed = [];
		simulate(index * 7, {
			check: (state) => {
				for (const event of state.events) {
					if (event.seq <= seen) {
						continue;
					}
					seen = event.seq;
					if (
						event.type === 'vpGained' &&
						event.vp !== 0 &&
						event.source === 'other'
					) {
						unnamed.push(event);
					}
				}
			},
		});
		assert.deepEqual(unnamed, [], `game ${index * 7}`);
	}
});

test("Mercantilism's conversion and Age of Sail's gift count as the tapestry's, inside an income turn or an advance", () => {
	const { state: started, random } = startedGame(2);
	const state = structuredClone(started);
	state.pending.length = 0;
	state.seats[0].era = { card: null, ability: 'mercantilism' };
	state.seats[0].resources.food = 3;
	push(state, state.pending, [
		{
			player: 1,
			kind: 'incomeSteps',
			turn: 2,
			steps: ['income'],
			origin: 'income',
		},
	]);
	run(state, random);
	const conversion = openDecisions(state).find(
		(d) => d.kind === 'chooseConversion'
	);
	assert.ok(conversion, 'Mercantilism offers the conversion');
	assert.equal(conversion.origin, 'tapestry');

	const sailing = structuredClone(started);
	sailing.pending.length = 0;
	sailing.seats[0].era = { card: null, ability: 'age-of-sail' };
	push(sailing, sailing.pending, [
		{
			player: 1,
			kind: 'effects',
			effects: [{ explore: {} }],
			source: { track: 'exploration', space: 2 },
		},
	]);
	run(sailing, random);
	const gift = openDecisions(sailing).find((d) => d.kind === 'chooseGift');
	assert.ok(gift, 'Age of Sail offers the gift');
	assert.equal(gift.origin, 'tapestry');
});
