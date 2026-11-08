// #35 and #36 on one branch (#36 design §5): Cloud City's moves join the masterpieces' order (R121), the Swamp's lily
// pads count after the masterpieces, Ballet and Modern Dance count the advanced mats' lines, and setup deals both.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { capitalMat } from '../src/lib/engine/data/capitals.js';
import { countVp } from '../src/lib/engine/effects/vp.js';
import { run } from '../src/lib/engine/loop.js';
import { openDecisions, push } from '../src/lib/engine/stack.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { play } from '../src/lib/engine/play.js';
import { INCOME_STEP_KINDS } from '../src/lib/engine/income.js';
import { answerSetup, startedGame } from './helpers/engine.mjs';
import { newGame } from './helpers/engine.mjs';

/** Arts & Architecture with the arts track. */
const AA = { expansions: ['aa'] };

/**
 * A started 2-player A&A game with nothing pending, seat 1 on the given mat and holding the given masterpieces.
 * @param {number} mat
 * @param {string[]} [masterpieces]
 * @param {{ variants?: string[] }} [options]
 */
function onMat(mat, masterpieces = [], options = {}) {
	const { state: started, random } = startedGame(2, { ...AA, ...options });
	const state = structuredClone(started);
	state.pending.length = 0;
	const seat = state.seats[0];
	seat.capital.mat = mat;
	seat.masterpieces = masterpieces.map((card) => ({ card, used: false }));
	return { state, random, seat };
}

/**
 * Puts farms on plots of a seat's capital directly.
 * @param {any} seat
 * @param {number[][]} cells - [row, column] pairs
 */
function farms(seat, cells) {
	for (const [row, col] of cells) {
		seat.capital.buildings.push({ building: 'farm', row, col });
	}
}

/**
 * Runs some of seat 1's income steps for an income turn until the next decision.
 * @param {ReturnType<typeof onMat>} game
 * @param {number} turn
 * @param {string[]} steps
 */
function incomeSteps({ state, random }, turn, steps) {
	push(state, state.pending, [
		{ player: 1, kind: 'incomeSteps', turn, steps, origin: 'income' },
	]);
	run(state, random);
}

/**
 * Seat 1's open decision of a kind, if any.
 * @param {ReturnType<typeof onMat>} game
 * @param {string} kind
 */
function asked({ state }, kind) {
	return openDecisions(state).find((d) => d.player === 1 && d.kind === kind);
}

/**
 * Answers seat 1's open decision of a kind, then runs on.
 * @param {ReturnType<typeof onMat>} game
 * @param {string} kind
 * @param {Record<string, unknown>} answer
 */
function answerAsked(game, kind, answer) {
	const decision = asked(game, kind);
	assert.ok(decision, `${kind} is asked`);
	game.state = play(
		game.state,
		1,
		{ decision: decision.id, ...answer },
		game.random
	);
	game.seat = game.state.seats[0];
}

/** The types of seat 1's events from `at` on, of the given types. */
const typesOf = (/** @type {any} */ { state }, /** @type {string[]} */ types) =>
	state.events.filter((e) => types.includes(e.type)).map((e) => e.type);

test('R121: with the arts track, Cloud City has no step of its own; without it, it is the first step as before', () => {
	const { state } = onMat(10);
	assert.equal(INCOME_STEP_KINDS.cloudMoves.when?.(state), false);
	const off = onMat(10, [], { variants: ['no-arts-track'] });
	assert.equal(INCOME_STEP_KINDS.cloudMoves.when?.(off.state), true);
	assert.equal(INCOME_STEP_KINDS.masterpieces.when?.(off.state), false);
});

test("R121: Cloud City's moves are one more item in the masterpieces' order, and may come first", () => {
	const game = onMat(10, ['krav-maga']);
	farms(game.seat, [[0, 0]]);
	incomeSteps(game, 2, ['masterpieces']);
	const decision = asked(game, 'chooseMasterpiece');
	assert.ok(decision, 'the order is asked, though one masterpiece is held');
	assert.equal(decision.cloud, 2);
	assert.deepEqual(
		DECISIONS.chooseMasterpiece.answers(game.state, decision),
		[{ seat: 1, card: 'krav-maga' }, { cloudMove: true }]
	);
	answerAsked(game, 'chooseMasterpiece', { cloudMove: true });
	assert.equal(asked(game, 'chooseCloudMove')?.left, 2);
	answerAsked(game, 'chooseCloudMove', { row: 0, col: 0 });
	answerAsked(game, 'chooseCloudPlot', { row: 0, col: 3 });
	answerAsked(game, 'chooseCloudMove', { stop: true });
	// The last masterpiece fires without another question once the moves are done.
	assert.equal(asked(game, 'chooseMasterpiece'), undefined);
	assert.deepEqual(typesOf(game, ['buildingMoved', 'masterpieceFired']), [
		'buildingMoved',
		'masterpieceFired',
	]);
});

test("R121: a masterpiece may fire before Cloud City's moves, which then follow without asking the order", () => {
	const game = onMat(10, ['krav-maga']);
	farms(game.seat, [[0, 0]]);
	incomeSteps(game, 3, ['masterpieces']);
	answerAsked(game, 'chooseMasterpiece', { seat: 1, card: 'krav-maga' });
	assert.equal(asked(game, 'chooseMasterpiece'), undefined);
	assert.equal(asked(game, 'chooseCloudMove')?.left, 2);
	answerAsked(game, 'chooseCloudMove', { stop: true });
	assert.deepEqual(typesOf(game, ['masterpieceFired']), ['masterpieceFired']);
});

test("R121: without masterpieces, Cloud City's moves come first, with no question about the order", () => {
	const game = onMat(10);
	farms(game.seat, [[0, 0]]);
	incomeSteps(game, 2, ['masterpieces']);
	assert.equal(asked(game, 'chooseMasterpiece'), undefined);
	assert.equal(asked(game, 'chooseCloudMove')?.left, 2);
});

test('R121: the moves are offered only while a building can move', () => {
	// No building on the mat: nothing can move, so the one masterpiece fires without a question.
	const game = onMat(10, ['krav-maga']);
	incomeSteps(game, 2, ['masterpieces']);
	assert.equal(asked(game, 'chooseMasterpiece'), undefined);
	assert.equal(asked(game, 'chooseCloudMove'), undefined);
	assert.deepEqual(typesOf(game, ['masterpieceFired']), ['masterpieceFired']);
});

test('R121: the moves are no item of Broadcast or Streaming Implants', () => {
	const game = onMat(10, ['krav-maga', 'mapmaking']);
	farms(game.seat, [[0, 0]]);
	push(game.state, game.state.pending, [
		{ player: 1, kind: 'effects', effects: [{ broadcast: {} }] },
	]);
	run(game.state, game.random);
	const decision = asked(game, 'chooseMasterpiece');
	assert.equal(decision?.purpose, 'broadcast');
	assert.equal(decision?.cloud, undefined);
	assert.ok(
		!DECISIONS.chooseMasterpiece
			.answers(game.state, decision)
			.some((a) => a.cloudMove)
	);
});

test("the Swamp's lily pads are counted after the masterpieces fire on income turn 5 (#36 design §3.4)", () => {
	const game = onMat(12, ['krav-maga']);
	incomeSteps(game, 5, ['masterpieces', 'lilyPads']);
	assert.deepEqual(typesOf(game, ['masterpieceFired', 'lilyPadsCounted']), [
		'masterpieceFired',
		'lilyPadsCounted',
	]);
});

test("Ballet and Modern Dance count the advanced mat's complete rows and columns, not its capital-scoring values", () => {
	/**
	 * The buildable plots of a mat's grid that `pick` selects, as [row, column] pairs.
	 * @param {number} mat
	 * @param {(row: number, col: number) => boolean} pick
	 */
	const open = (mat, pick) =>
		capitalMat(mat).grid.flatMap((line, row) =>
			[...line].flatMap((plot, col) =>
				plot === '0' && pick(row, col) ? [[row, col]] : []
			)
		);
	// The Cavern's columns score 0 VP in capital scoring (R51), but Modern Dance still counts a complete one.
	assert.equal(capitalMat(9).columnValue, 0);
	const cavern = onMat(9);
	farms(
		cavern.seat,
		open(9, (row, col) => col === 0)
	);
	assert.equal(countVp(cavern.state, 1, 'capitalColumn'), 1);
	// The Archipelago has 11 rows: a complete eleventh row counts for Ballet.
	assert.equal(capitalMat(7).grid.length, 11);
	const isles = onMat(7);
	farms(
		isles.seat,
		open(7, (row) => row === 10)
	);
	assert.equal(countVp(isles.state, 1, 'capitalRow'), 1);
});

test('an A&A game with the arts track deals the masterpieces, the joint pick of a mat and a civilization, then the landmark draft', () => {
	const { state, random } = newGame(3, AA);
	assert.equal(state.supply.masterpieces?.faceUp.length, 3);
	const kinds = openDecisions(state).map((d) => d.kind);
	assert.ok(kinds.includes('chooseMatAndCiv'));
	const started = answerSetup(state, random);
	assert.equal(started.phase, 'play');
	assert.ok(started.seats.every((s) => s.capital.mat !== null));
	assert.ok(started.seats.every((s) => s.landmarkCard !== null));
	assert.ok(started.seats.every((s) => Array.isArray(s.masterpieces)));
});
