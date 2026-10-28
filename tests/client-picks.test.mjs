// The pick model (#75): rows of resources, cards and tiles chosen one by one, matched to the decision's own answers.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { DECISIONS, play, view } from '../src/lib/engine/game.js';
import { push } from '../src/lib/engine/stack.js';
import { seededRandom } from '../src/lib/engine/random.js';
import {
	advanceModel,
	canPick,
	canPickItem,
	emptySelection,
	matchIndex,
	offerModel,
	pendingCounts,
	pickModel,
	pickStatus,
	rowView,
	toggleItem,
	togglePick,
	tradeOffers,
} from '../src/lib/picks.js';
import { advanceOptions, myDecision } from '../src/lib/turn.js';
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

/** Guilds' six trades, as the card offers them. */
const GUILDS = [
	{ pay: { vp: 5 }, gain: [{ gain: { any: 1 } }] },
	{ pay: { vp: 10 }, gain: [{ gain: { any: 2 } }] },
	{ pay: { vp: 15 }, gain: [{ gain: { any: 3 } }] },
	{ pay: { any: 1 }, gain: [{ vp: 5 }] },
	{ pay: { any: 2 }, gain: [{ vp: 10 }] },
	{ pay: { any: 3 }, gain: [{ vp: 15 }] },
];

/**
 * A trade opened on seat 1's stack, as the viewer's view shows it, with seat 1 holding `vp` and `resources`.
 * @param {Record<string, any>} fields - The chooseTrade's offers and whether it is optional
 * @param {number} vp
 * @param {Record<string, number>} resources
 */
function tradeOf(fields, vp, resources) {
	const { state } = startedGame(2);
	const random = seededRandom(5);
	const seat = state.seats[0];
	seat.vp = vp;
	seat.resources = { coin: 0, worker: 0, food: 0, culture: 0, ...resources };
	state.pending.length = 0;
	push(state, state.pending, [{ player: 1, kind: 'chooseTrade', ...fields }]);
	const game = view(state, 1);
	const decision = /** @type {Record<string, any>} */ (myDecision(game, 1));
	assert.equal(decision?.kind, 'chooseTrade');
	return { state, random, game, decision };
}

/**
 * Seat 1's tiles or cards set, and a bonus paying some of them.
 * @param {Record<string, number>} cost
 */
function bonusOf(cost) {
	const { state } = startedGame(2);
	const seat = state.seats[0];
	seat.territoryTiles = [4, 16, 17, 24, 35, 44];
	seat.hand = ['trade-economy', 'technocracy', 'boast-of-superiority'];
	const decision = /** @type {Record<string, any>} */ ({
		id: 99,
		player: 1,
		kind: 'chooseBonus',
		track: 'exploration',
		space: 10,
		cost,
		gain: [{ vp: 10 }],
	});
	decision.answers = DECISIONS.chooseBonus.answers(state, decision);
	return { decision, game: state };
}

test('a bonus paying 3 territory tiles picks 3 of the tiles held', () => {
	const { decision, game } = bonusOf({ territory: 3 });
	const model = pickModel(decision, game, 1);
	assert.ok(model);
	assert.deepEqual(model.rows, []);
	assert.deepEqual(model.items, {
		kind: 'territory',
		ids: [4, 16, 17, 24, 35, 44],
		count: 3,
	});
	assert.equal(
		model.lead,
		'Pay 3 territory tiles. Pick them here or on your Terrain tab.'
	);
	assert.equal(model.decline, 0);
});

test('once 3 tiles are chosen the others wait', () => {
	const { decision, game } = bonusOf({ territory: 3 });
	const model = /** @type {any} */ (pickModel(decision, game, 1));
	let selection = emptySelection(model);
	assert.deepEqual(pickStatus(model, selection, {}), {
		text: 'Choose 3 more tiles.',
		warn: false,
	});
	selection = toggleItem(model, selection, 35);
	selection = toggleItem(model, selection, 16);
	assert.deepEqual(pickStatus(model, selection, {}), {
		text: 'Choose 1 more tile.',
		warn: false,
	});
	selection = toggleItem(model, selection, 24);
	for (const id of [4, 17, 44]) {
		assert.equal(canPickItem(model, selection, id), false, `tile ${id}`);
	}
	assert.equal(canPickItem(model, selection, 16), true);
	assert.equal(
		toggleItem(model, selection, 4),
		selection,
		'a fourth tile is refused'
	);
	const wanted = decision.answers.findIndex(
		(/** @type {any} */ a) =>
			a.pay && [16, 24, 35].every((id) => a.pay.territory.includes(id))
	);
	assert.equal(matchIndex(model, selection), wanted);
	assert.equal(
		pickStatus(model, selection, {}).text,
		model.candidates.find((/** @type {any} */ c) => c.index === wanted)
			.label
	);
	selection = toggleItem(model, selection, 16);
	assert.deepEqual(selection.items, [35, 24]);
	assert.equal(matchIndex(model, selection), -1);
});

test('tapestry cards to pay are picked the same way', () => {
	const { decision, game } = bonusOf({ tapestry: 2 });
	const model = /** @type {any} */ (pickModel(decision, game, 1));
	assert.equal(model.items.kind, 'tapestry');
	assert.equal(model.lead, 'Pay 2 tapestry cards. Pick them above.');
	assert.deepEqual(pickStatus(model, emptySelection(model), {}), {
		text: 'Choose 2 more cards.',
		warn: false,
	});
});

test('a free bonus keeps today’s prompt', () => {
	const { decision, game } = decisionOf({
		kind: 'chooseBonus',
		track: 'science',
		space: 2,
		cost: {},
		gain: [{ vp: 3 }],
	});
	assert.equal(pickModel(decision, game, 1), null);
});

test('a trade with one legal payment keeps today’s prompt', () => {
	const { decision, game } = tradeOf(
		{
			offers: [{ pay: { worker: 1 }, gain: [{ vp: 10 }] }],
			optional: true,
		},
		0,
		{ worker: 2 }
	);
	assert.equal(pickModel(decision, game, 1), null);
	assert.equal(tradeOffers(decision, game, 1), null);
});

test('Guilds offers six trades, the unaffordable ones disabled', () => {
	const { decision, game } = tradeOf(
		{ offers: GUILDS, optional: false },
		12,
		{ food: 2, culture: 1 }
	);
	const offers = tradeOffers(decision, game, 1);
	assert.ok(offers);
	assert.equal(offers.length, 6);
	assert.deepEqual(
		offers.map((o) => o.enabled),
		[true, true, false, true, true, true]
	);
	assert.deepEqual(
		offers.map((o) => o.label),
		[
			'Pay 5 VP for 1 resource of your choice',
			'Pay 10 VP for 2 resources of your choice',
			'Pay 15 VP for 3 resources of your choice',
			'Pay 1 resource of your choice for 5 VP',
			'Pay 2 resources of your choice for 10 VP',
			'Pay 3 resources of your choice for 15 VP',
		]
	);
	assert.deepEqual(offers[1].gain, { any: 2 });
	assert.deepEqual(offers[4].pay, { any: 2 });
});

test('a trade paying resources picks them in rows', () => {
	const { decision, game } = tradeOf(
		{ offers: GUILDS, optional: false },
		12,
		{ food: 2, culture: 1 }
	);
	const model = /** @type {any} */ (offerModel(decision, 4, game, 1));
	assert.equal(model.mode, 'pay');
	assert.deepEqual(model.rows, [FREE, FREE]);
	assert.equal(
		model.lead,
		'Gain 10 VP. Pick the 2 resources you pay, one in each row.'
	);
	const selection = picked(model, ['food', 'culture']);
	const answer = decision.answers[matchIndex(model, selection)];
	assert.deepEqual(answer, { offer: 4, pay: { food: 1, culture: 1 } });
	assert.equal(canPick(model, emptySelection(model), 0, 'coin'), false);
});

test('a trade paying VP picks what it gains, then answers the chooseResource it opens', () => {
	const { state, random, decision, game } = tradeOf(
		{ offers: GUILDS, optional: false },
		12,
		{ food: 2, culture: 1 }
	);
	const model = /** @type {any} */ (offerModel(decision, 1, game, 1));
	assert.equal(model.mode, 'gain');
	assert.deepEqual(model.rows, [FREE, FREE]);
	assert.equal(model.then, 'chooseResource');
	assert.equal(
		model.lead,
		'Pay 10 VP. Pick the 2 resources you gain, one in each row.'
	);
	const trade = decision.answers.findIndex(
		(/** @type {any} */ a) => a.offer === 1
	);
	const selection = picked(model, ['worker', 'coin']);
	assert.equal(matchIndex(model, selection), trade);
	assert.equal(matchIndex(model, picked(model, ['food', 'food'])), trade);

	const after = play(
		state,
		1,
		{ decision: decision.id, ...decision.answers[trade] },
		random
	);
	const next = view(after, 1);
	const gain = /** @type {Record<string, any>} */ (myDecision(next, 1));
	assert.equal(gain?.kind, 'chooseResource');
	const gainModel = /** @type {any} */ (pickModel(gain, next, 1));
	assert.deepEqual(gain.answers[matchIndex(gainModel, selection)].resources, {
		coin: 1,
		worker: 1,
	});
});

test('the rows as drawn: counts after the choices so far, and why a resource is off', () => {
	const { option, game, held } = advanceOf('military', 6, {
		coin: 2,
		food: 1,
		worker: 0,
		culture: 3,
	});
	const model = /** @type {any} */ (advanceModel(option, game));
	let selection = emptySelection(model);
	let rows = rowView(model, selection, held);
	assert.deepEqual(rows[0], {
		fixed: 'culture',
		picked: 'culture',
		choices: [{ id: 'culture', count: 2, disabled: false }],
	});
	assert.deepEqual(
		rows[1].choices.map((c) => [c.id, c.count, c.disabled]),
		[
			['coin', 2, false],
			['food', 1, false],
			['worker', 0, true],
			['culture', 2, false],
		]
	);
	assert.equal(rows[1].choices[2].reason, 'You have no worker left');
	selection = togglePick(model, selection, 1, 'food');
	rows = rowView(model, selection, held);
	assert.equal(rows[1].picked, 'food');
	assert.equal(
		rows[1].choices[1].disabled,
		false,
		'the chosen one can be cleared'
	);
	assert.equal(rows[2].choices[1].count, 0);
	assert.equal(rows[2].choices[1].disabled, true);

	const gain = decisionOf(
		{ kind: 'chooseResource', count: 2, from: 'any' },
		{ food: 8 }
	);
	const gainModel = /** @type {any} */ (
		pickModel(gain.decision, gain.game, 1)
	);
	const shown = rowView(gainModel, picked(gainModel, ['food']), gain.held);
	assert.equal(shown[1].choices[1].count, 8, 'never above the cap');
});
