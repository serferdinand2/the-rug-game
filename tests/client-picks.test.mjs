// The pick model (#75): rows of resources, cards and tiles chosen one by one, matched to the decision's own answers.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { DECISIONS, view } from '../src/lib/engine/game.js';
import {
	advanceModel,
	canPick,
	emptySelection,
	matchIndex,
	pendingCounts,
	pickModel,
	pickStatus,
	togglePick,
} from '../src/lib/picks.js';
import { advanceOptions } from '../src/lib/turn.js';
import { readyTurn, startedGame } from './helpers/engine.mjs';

const ALL = ['coin', 'food', 'worker', 'culture'];
const FREE = { fixed: null, offers: ALL };

/**
 * A decision of a kind for seat 1, with the engine's own answers, in a started game where seat 1 holds `resources`.
 * @param {Record<string, any>} fields - The decision's kind and fields
 * @param {Record<string, number>} [resources]
 */
function decisionOf(fields, resources = {}) {
	const { state } = startedGame(2);
	const seat = state.seats[0];
	seat.resources = { coin: 0, worker: 0, food: 0, culture: 0, ...resources };
	const decision = /** @type {Record<string, any>} */ ({
		id: 99,
		player: 1,
		...fields,
	});
	decision.answers = DECISIONS[decision.kind].answers(state, decision);
	return { decision, game: state, held: { ...seat.resources } };
}

/**
 * The advance option of seat 1's turn for a track, its token at `from`, holding `resources`.
 * @param {string} track
 * @param {number} from
 * @param {Record<string, number>} resources
 */
function advanceOf(track, from, resources) {
	const { state, player } = readyTurn(2, (seat) => {
		seat.tracks = {
			exploration: [0],
			science: [0],
			technology: [0],
			military: [0],
			[track]: [from],
		};
		seat.resources = {
			coin: 0,
			worker: 0,
			food: 0,
			culture: 0,
			...resources,
		};
	});
	const game = view(state, player);
	const option = advanceOptions(game, player).find(
		(o) => o.track === track && o.from === from
	);
	assert.ok(option, `no advance on ${track} from ${from}`);
	return {
		option,
		game,
		held: { coin: 0, worker: 0, food: 0, culture: 0, ...resources },
	};
}

/**
 * Picks resources into the free rows in order, from an empty selection.
 * @param {import('../src/lib/picks.js').PickModel} model
 * @param {string[]} resources
 */
function picked(model, resources) {
	let selection = emptySelection(model);
	let next = 0;
	for (const resource of resources) {
		while (model.rows[next].fixed !== null) {
			next++;
		}
		selection = togglePick(model, selection, next, resource);
		next++;
	}
	return selection;
}

test('choose 3 resources is three free rows offering every resource', () => {
	const { decision, game } = decisionOf({
		kind: 'chooseResource',
		count: 3,
		from: 'any',
	});
	const model = pickModel(decision, game, 1);
	assert.ok(model);
	assert.equal(model.mode, 'gain');
	assert.deepEqual(model.rows, [FREE, FREE, FREE]);
	assert.equal(model.lead, 'Pick one resource in each row.');
	assert.equal(model.candidates.length, 20);
	assert.equal(model.items, null);
	assert.equal(model.decline, null);
});

test('a gain from a short list offers only those resources', () => {
	const { decision, game } = decisionOf({
		kind: 'chooseResource',
		count: 2,
		from: ['coin', 'worker'],
	});
	const model = pickModel(decision, game, 1);
	assert.ok(model);
	for (const row of model.rows) {
		assert.deepEqual(row, { fixed: null, offers: ['coin', 'worker'] });
	}
});

test('a single resource is one row', () => {
	const { decision, game } = decisionOf({
		kind: 'chooseResource',
		count: 1,
		from: 'any',
	});
	const model = pickModel(decision, game, 1);
	assert.ok(model);
	assert.deepEqual(model.rows, [FREE]);
	assert.equal(model.lead, 'Pick a resource.');
});

test('picking food twice and a coin matches the answer with 2 food and 1 coin', () => {
	const { decision, game } = decisionOf({
		kind: 'chooseResource',
		count: 3,
		from: 'any',
	});
	const model = /** @type {any} */ (pickModel(decision, game, 1));
	const selection = picked(model, ['food', 'food', 'coin']);
	const wanted = decision.answers.findIndex(
		(/** @type {any} */ a) =>
			a.resources.coin === 1 &&
			a.resources.food === 2 &&
			Object.keys(a.resources).length === 2
	);
	assert.ok(wanted >= 0);
	assert.equal(matchIndex(model, selection), wanted);
});

test('picking the chosen resource again clears its row', () => {
	const { decision, game } = decisionOf({
		kind: 'chooseResource',
		count: 2,
		from: 'any',
	});
	const model = /** @type {any} */ (pickModel(decision, game, 1));
	let selection = togglePick(model, emptySelection(model), 0, 'food');
	selection = togglePick(model, selection, 0, 'food');
	assert.equal(selection.rows[0], null);
	assert.equal(matchIndex(model, selection), -1);
});

test('a tier III advance has its track resource fixed first and two free rows', () => {
	const { option, game } = advanceOf('military', 6, {
		coin: 2,
		food: 1,
		worker: 0,
		culture: 3,
	});
	const model = advanceModel(option, game);
	assert.ok(model);
	assert.equal(model.mode, 'pay');
	assert.deepEqual(model.rows, [
		{ fixed: 'culture', offers: [] },
		FREE,
		FREE,
	]);
	assert.equal(
		model.lead,
		'Tier III costs 1 culture and 2 resources of your choice. Pick one in each empty row.'
	);
	assert.deepEqual(emptySelection(model).rows, ['culture', null, null]);
});

test('a payment row offers only what is still held', () => {
	const { option, game } = advanceOf('military', 6, {
		coin: 2,
		food: 1,
		worker: 0,
		culture: 3,
	});
	const model = /** @type {any} */ (advanceModel(option, game));
	let selection = emptySelection(model);
	assert.equal(canPick(model, selection, 1, 'worker'), false);
	assert.equal(canPick(model, selection, 0, 'coin'), false, 'a fixed row');
	selection = togglePick(model, selection, 1, 'food');
	assert.equal(canPick(model, selection, 2, 'food'), false);
	assert.equal(canPick(model, selection, 2, 'culture'), true);
	assert.equal(
		canPick(model, selection, 1, 'coin'),
		true,
		'the row can change its pick'
	);
	selection = togglePick(model, selection, 2, 'culture');
	assert.equal(option.payments[matchIndex(model, selection)].culture, 2);
});

test('an advance with one legal payment needs no rows', () => {
	const { option, game } = advanceOf('military', 6, { culture: 1, coin: 2 });
	assert.equal(option.payments.length, 1);
	assert.equal(advanceModel(option, game), null);
});

test('a bonus paying 1 resource of your choice is one row with Decline', () => {
	const { decision, game } = decisionOf(
		{
			kind: 'chooseBonus',
			track: 'science',
			space: 2,
			cost: { any: 1 },
			gain: [{ building: 'house' }],
		},
		{ coin: 1, food: 1 }
	);
	const model = pickModel(decision, game, 1);
	assert.ok(model);
	assert.deepEqual(model.rows, [FREE]);
	assert.equal(
		model.decline,
		decision.answers.findIndex((/** @type {any} */ a) => a.pay === null)
	);
	assert.equal(
		model.lead,
		'Pay 1 resource of your choice. Pick one in each empty row.'
	);
});

test('Mercantilism gives one row per food it may convert, food keeping it', () => {
	const { decision, game } = decisionOf(
		{ kind: 'chooseConversion', max: 2 },
		{ food: 1 }
	);
	const model = /** @type {any} */ (pickModel(decision, game, 1));
	assert.ok(model);
	assert.equal(model.mode, 'convert');
	assert.deepEqual(model.rows, [FREE]);
	assert.equal(model.lead, 'Pick what each food becomes; food keeps it.');
	const none = decision.answers.findIndex(
		(/** @type {any} */ a) => Object.keys(a.resources).length === 0
	);
	const coin = decision.answers.findIndex(
		(/** @type {any} */ a) => a.resources.coin === 1
	);
	assert.equal(model.decline, none);
	assert.equal(matchIndex(model, picked(model, ['food'])), none);
	assert.equal(matchIndex(model, picked(model, ['coin'])), coin);
});

test('the counts follow the choices', () => {
	const gain = decisionOf(
		{ kind: 'chooseResource', count: 2, from: 'any' },
		{ food: 7 }
	);
	const gainModel = /** @type {any} */ (
		pickModel(gain.decision, gain.game, 1)
	);
	assert.equal(
		pendingCounts(gainModel, picked(gainModel, ['food', 'food']), gain.held)
			.food,
		9
	);

	const advance = advanceOf('military', 6, { coin: 2, food: 1, culture: 3 });
	const payModel = /** @type {any} */ (
		advanceModel(advance.option, advance.game)
	);
	const paid = pendingCounts(
		payModel,
		picked(payModel, ['coin']),
		advance.held
	);
	assert.equal(paid.culture, 2);
	assert.equal(paid.coin, 1);

	const convert = decisionOf(
		{ kind: 'chooseConversion', max: 1 },
		{ food: 1, coin: 2 }
	);
	const convertModel = /** @type {any} */ (
		pickModel(convert.decision, convert.game, 1)
	);
	const turned = pendingCounts(
		convertModel,
		picked(convertModel, ['coin']),
		convert.held
	);
	assert.equal(turned.food, 0);
	assert.equal(turned.coin, 3);
});

test('the status counts down, then says what happens, and warns at the cap', () => {
	const { decision, game, held } = decisionOf(
		{ kind: 'chooseResource', count: 3, from: 'any' },
		{ coin: 2, food: 7 }
	);
	const model = /** @type {any} */ (pickModel(decision, game, 1));
	assert.deepEqual(pickStatus(model, emptySelection(model), held), {
		text: 'Pick a resource in each row.',
		warn: false,
	});
	assert.deepEqual(pickStatus(model, picked(model, ['coin']), held), {
		text: 'Choose 2 more.',
		warn: false,
	});
	assert.deepEqual(
		pickStatus(model, picked(model, ['coin', 'food', 'food']), held),
		{
			text: 'You gain 1 coin and 2 food. You can hold 8 of each: 1 food would be lost.',
			warn: true,
		}
	);
	const full = { ...held, coin: 8 };
	const both = pickStatus(
		model,
		picked(model, ['coin', 'food', 'food']),
		full
	);
	assert.ok(
		both.text.endsWith('1 coin and 1 food would be lost.'),
		both.text
	);
	assert.deepEqual(
		pickStatus(model, picked(model, ['coin', 'worker', 'culture']), held),
		{
			text: 'You gain 1 coin, 1 worker and 1 culture.',
			warn: false,
		}
	);

	const advance = advanceOf('military', 6, { coin: 2, food: 1, culture: 3 });
	const payModel = /** @type {any} */ (
		advanceModel(advance.option, advance.game)
	);
	const selection = picked(payModel, ['coin', 'food']);
	const index = matchIndex(payModel, selection);
	assert.deepEqual(pickStatus(payModel, selection, advance.held), {
		text: payModel.candidates.find(
			(/** @type {any} */ c) => c.index === index
		).label,
		warn: false,
	});
});

test('a selection shaped for another model never matches', () => {
	const two = decisionOf({ kind: 'chooseResource', count: 2, from: 'any' });
	const three = decisionOf({ kind: 'chooseResource', count: 3, from: 'any' });
	const twoModel = /** @type {any} */ (pickModel(two.decision, two.game, 1));
	const threeModel = /** @type {any} */ (
		pickModel(three.decision, three.game, 1)
	);
	assert.equal(
		matchIndex(threeModel, picked(twoModel, ['coin', 'food'])),
		-1
	);
});
