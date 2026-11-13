// Decision causes stay separate from rules sources, and do not expose hidden cards (#60).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { push } from '../src/lib/engine/stack.js';
import { view } from '../src/lib/engine/view.js';
import { decisionSource } from '../src/lib/decision-source.js';
import {
	checkDecisionSources,
	checkViews,
	setupFacts,
} from './helpers/views.mjs';
import { newGame, startedGame } from './helpers/engine.mjs';

test('nested decisions inherit a track explanation without changing their rules source', () => {
	const { state } = newGame(2);
	const stack = [];
	const [op] = push(state, stack, [{ player: 1, kind: 'chooseResource' }], {
		id: 9,
		batch: 9,
		player: 1,
		kind: 'effects',
		source: { track: 'exploration', space: 3 },
	});
	assert.equal(op.source, undefined);
	assert.deepEqual(op.cause, { track: 'exploration', space: 3 });
	const model = decisionSource(op.cause, { seats: [] }, 1);
	assert.equal(model.name, 'Wagons');
	assert.equal(model.trackName, 'Exploration');
	assert.equal(model.space, 3);
	const [bonus] = push(
		state,
		[],
		[
			{
				player: 1,
				kind: 'chooseResource',
				source: { track: 'exploration', space: 3 },
			},
		],
		{
			...op,
			source: { track: 'exploration', space: 3 },
			cause: { track: 'exploration', space: 3, bonus: true },
		}
	);
	assert.equal(bonus.cause.bonus, true);
});

test('other players cannot read a decision cause or a hidden card through it', () => {
	const { state } = newGame(2);
	state.pending = [];
	push(state, state.pending, [
		{
			player: 1,
			kind: 'effects',
			effects: [],
			cause: { tapestry: 'secret-unrevealed-card' },
		},
	]);
	checkViews(state, setupFacts(state), { before: state });
	const own = view(state, 1);
	const other = view(state, 2);
	assert.equal(own.pending[0].cause.tapestry, undefined);
	assert.equal(own.pending[0].cause.hiddenCard, true);
	assert.equal(other.pending[0].cause, undefined);
});

test('public card, territory and capital causes have distinct readable forms', () => {
	const game = {
		seats: [
			{ name: 'Ana', civs: ['merrymakers'], tech: { top: ['bakery'] } },
		],
		supply: { tech: { faceUp: ['bakery'] } },
	};
	assert.equal(
		decisionSource({ tech: 'bakery', icon: 'square' }, game, 1).name,
		'Bakery'
	);
	assert.match(
		decisionSource({ tech: 'bakery', icon: 'square' }, game, 1).suffix,
		/square/
	);
	assert.equal(
		decisionSource({ capital: 'district' }, game, 1).text,
		'From completing a district in your capital'
	);
	assert.equal(
		decisionSource({ hex: '0_1', conquest: true }, game, 1).kind,
		'territory'
	);
	assert.equal(
		decisionSource({ incomeReason: 'From the Savanna' }, game, 1).text,
		'From the Savanna'
	);
});

test('every supported cause kind has a displayable line', () => {
	const game = {
		seats: [
			{
				name: 'Ana',
				civs: ['merrymakers'],
				hand: ['monarchy'],
				tech: { top: ['bakery'] },
				landmarkCards: ['urban-farm'],
			},
			{ name: 'Vera', civs: ['leaders'] },
		],
		supply: {
			tech: { faceUp: ['bakery'] },
			masterpieces: { faceUp: ['painting'] },
		},
	};
	const causes = [
		{ track: 'exploration', space: 3 },
		{ track: 'exploration', space: 5, bonus: true },
		{ civ: 'merrymakers', part: 'setup', player: 1 },
		{ civ: 'merrymakers', part: 'adjustment', player: 1 },
		{ civ: 'leaders', part: 'ability', player: 2 },
		{ tech: 'bakery', icon: 'square', player: 1 },
		{ tapestry: 'monarchy', player: 1 },
		{ masterpiece: 'painting', player: 1 },
		{ landmarkCard: 'urban-farm', player: 1 },
		{ capital: 'district' },
		{ capital: 'row' },
		{ capital: 'column' },
		{ hex: '0_1', tile: 17 },
		{ hex: '0_1', conquest: true, player: 2 },
		{ spaceTile: 3 },
		{ trap: true },
		{ achievement: 'complete-track' },
		{ incomeReason: 'From completed districts on your Savanna mat' },
		{ incomeTurn: 3, step: 'income' },
		{ hiddenCard: true },
	];
	for (const cause of causes) {
		assert.ok(
			decisionSource(cause, game, 1),
			`cause has no line: ${JSON.stringify(cause)}`
		);
	}
	assert.equal(
		decisionSource({ incomeTurn: 3, step: 'income' }, game, 1).text,
		'From income turn 3: income'
	);
});

test('the random-game source check rejects an effect decision without a public cause', () => {
	const { state } = startedGame(2);
	state.pending = [];
	push(state, state.pending, [
		{ player: 1, kind: 'chooseResource', from: 'any', count: 1 },
	]);
	assert.throws(
		() => checkDecisionSources(state),
		/chooseResource.*no public source/
	);
});
