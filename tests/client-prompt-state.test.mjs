// The decision prompt's state (#79): what the viewer has chosen in the open decision, keyed to it, and what the board, the player area and the dice tray read from it.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { openDecisions, view } from '../src/lib/engine/game.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { push } from '../src/lib/engine/stack.js';
import { run } from '../src/lib/engine/loop.js';
import { exploreIndex, tileScores } from '../src/lib/area/explore.js';
import { matchIndex, pickModel } from '../src/lib/picks.js';
import { myDecision } from '../src/lib/turn.js';
import { PromptState } from '../src/lib/prompt-state.svelte.js';
import { newGame, startedGame } from './helpers/engine.mjs';
import { promptSource } from './helpers/prompt-source.svelte.js';

/** A 2-player game with seat 1 holding tiles 2, 5 and 17 and an explore open, as seat 1 sees it. */
function exploring(effects = [{ explore: {} }]) {
	const { state, random } = startedGame(2);
	for (const hex of Object.values(state.hexes)) {
		hex.outposts = [];
	}
	state.hexes['-2_-2'].outposts = [{ seat: 1, toppled: false }];
	state.seats[0].territoryTiles = [2, 5, 17];
	state.pending.length = 0;
	push(state, state.pending, [{ player: 1, kind: 'effects', effects }]);
	run(state, random);
	const game = view(state, 1);
	const decision = openDecisions(game).find(
		(op) => op.kind === 'chooseExplore'
	);
	assert.ok(decision);
	return { game, decision };
}

/**
 * A decision of a kind for seat 1, with the engine's own answers, in a started game where seat 1 holds `resources`.
 * @param {Record<string, any>} fields
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
	return {
		decision,
		game: view(state, 1),
		held: { coin: 0, food: 0, worker: 0, culture: 0, ...seat.resources },
	};
}

test('a new decision starts with nothing chosen', () => {
	const { game, decision } = exploring();
	const source = promptSource({ game, decision, board: 'map' });
	const prompt = new PromptState(source);
	prompt.selectHex(decision.answers[0].hex);
	assert.equal(prompt.hex, decision.answers[0].hex);
	assert.equal(prompt.tile, 2);
	source.decision = { ...decision, id: decision.id + 100 };
	assert.equal(prompt.hex, null);
	assert.equal(prompt.tile, null);
	assert.equal(prompt.picked, null);
});

test('an explore offering one tile starts with it chosen, and its status line stays empty', () => {
	const { game, decision } = exploring([{ explore: { tile: 5 } }]);
	const prompt = new PromptState(promptSource({ game, decision }));
	assert.deepEqual(prompt.offeredTiles, [5]);
	assert.equal(prompt.tile, 5);
	assert.equal(prompt.controls?.status, '');
	assert.equal(prompt.controls?.confirmLabel, 'Explore');
});

test('a lit hex takes the first tile at its best turn, and Confirm sends that answer', async () => {
	const { game, decision } = exploring();
	const source = promptSource({ game, decision, board: 'map' });
	const prompt = new PromptState(source);
	const hex = decision.answers[0].hex;
	prompt.selectHex(hex);
	const best = tileScores(game, decision, hex)[2];
	assert.equal(prompt.tile, 2);
	assert.equal(prompt.orient, best.orient);
	const index = exploreIndex(decision, { tile: 2, hex, orient: best.orient });
	assert.equal(prompt.picked, index);
	assert.equal(prompt.scores[hex], best.vp);
	assert.deepEqual(prompt.preview?.hex, hex);
	assert.equal(prompt.docked, true);
	assert.equal(prompt.canTurn, true);
	assert.equal(prompt.controls?.confirmDisabled, false);
	await prompt.confirm();
	assert.deepEqual(source.sent, [
		{ decision: decision.id, ...decision.answers[index] },
	]);
});

test("turning the tile steps through the six turns and follows the answer, and the Terrain tab offers the explore's tiles", () => {
	const { game, decision } = exploring();
	const prompt = new PromptState(promptSource({ game, decision }));
	const hex = decision.answers[0].hex;
	prompt.selectHex(hex);
	const start = prompt.orient;
	prompt.turnTile(-1);
	assert.equal(prompt.orient, (start + 5) % 6);
	assert.equal(
		prompt.picked,
		exploreIndex(decision, { tile: 2, hex, orient: (start + 5) % 6 })
	);
	assert.deepEqual(prompt.tilePick, { tiles: [2, 5, 17], selected: 2 });
	prompt.pickTile(17);
	assert.equal(prompt.tile, 17);
	assert.equal(prompt.tilePick?.selected, 17);
});

test('a pick of resource rows shows the counts after the picks, and Confirm sends the answer they match (#75)', async () => {
	const { game, decision, held } = decisionOf(
		{ kind: 'chooseResource', count: 2, from: 'any' },
		{ coin: 1 }
	);
	const source = promptSource({ game, decision, held });
	const prompt = new PromptState(source);
	assert.ok(prompt.pick);
	assert.equal(prompt.controls?.confirmDisabled, true);
	prompt.pickRow(0, 'coin');
	assert.equal(prompt.resources.coin, 2);
	assert.deepEqual(prompt.changed, ['coin']);
	prompt.pickRow(1, 'food');
	assert.deepEqual(prompt.changed, ['coin', 'food']);
	assert.equal(prompt.controls?.confirmDisabled, false);
	assert.equal(prompt.controls?.confirm, 'pick');
	await prompt.confirm();
	const model = /** @type {any} */ (pickModel(decision, game, 1));
	const answer =
		decision.answers[
			matchIndex(model, { rows: ['coin', 'food'], items: [] })
		];
	assert.deepEqual(source.sent, [{ decision: decision.id, ...answer }]);
});

test("a trade's offer opens its rows, Back returns to the offers, and Decline declines (#75)", async () => {
	const GUILDS = [
		{ pay: { vp: 5 }, gain: [{ gain: { any: 1 } }] },
		{ pay: { vp: 10 }, gain: [{ gain: { any: 2 } }] },
		{ pay: { any: 1 }, gain: [{ vp: 5 }] },
		{ pay: { any: 2 }, gain: [{ vp: 10 }] },
	];
	const { state } = startedGame(2);
	state.seats[0].vp = 12;
	state.seats[0].resources = { coin: 0, worker: 0, food: 2, culture: 1 };
	state.pending.length = 0;
	push(state, state.pending, [
		{ player: 1, kind: 'chooseTrade', offers: GUILDS, optional: true },
	]);
	const game = view(state, 1);
	const decision = /** @type {any} */ (myDecision(game, 1));
	const source = promptSource({ game, decision });
	const prompt = new PromptState(source);
	assert.ok(prompt.offering);
	assert.equal(prompt.controls?.status, 'Choose a trade.');
	assert.equal(prompt.controls?.cancel, 'decline');
	prompt.chooseOffer(3);
	assert.equal(prompt.offering, null);
	assert.ok(prompt.pick);
	assert.equal(prompt.controls?.cancel, 'back');
	prompt.cancel();
	assert.ok(prompt.offering);
	prompt.cancel();
	await Promise.resolve();
	assert.equal(source.sent.length, 1);
	assert.equal(source.sent[0].decision, decision.id);
	assert.equal(source.sent[0].offer, null);
});

test('cards on the shelf open the stack with a shelf, and a card chosen there is the answer', () => {
	const { state } = newGame(2);
	const game = view(state, 1);
	const decision = /** @type {any} */ (myDecision(game, 1));
	assert.ok(['chooseCiv', 'chooseCapital'].includes(decision.kind));
	const prompt = new PromptState(promptSource({ game, decision }));
	assert.equal(prompt.panel, 'shelf');
	assert.equal(prompt.shelfCards.length, decision.answers.length);
	assert.equal(prompt.controls?.content, false);
	prompt.choose(1);
	assert.equal(prompt.picked, 1);
	assert.equal(prompt.controls?.confirmDisabled, false);
	assert.equal(prompt.inspectShelf(1), null);
});

test("placing a landmark offers the capital's places, and the piece's own confirm sends it", async () => {
	const { state, random } = startedGame(2);
	const player = /** @type {number} */ (state.current);
	state.pending.length = 0;
	push(state, state.pending, [
		{ player, kind: 'choosePlacement', landmark: 'lighthouse' },
	]);
	run(state, random);
	const game = view(state, player);
	const decision = /** @type {any} */ (myDecision(game, player));
	const source = promptSource({ game, decision, seat: player });
	const prompt = new PromptState(source);
	assert.deepEqual(prompt.placement?.piece, { landmark: 'lighthouse' });
	const option = /** @type {any} */ (prompt.placement).options[0];
	prompt.place(option.index, false);
	assert.equal(prompt.placement?.picked, option.index);
	assert.equal(source.sent.length, 0);
	await prompt.place(option.index, true);
	assert.deepEqual(source.sent, [
		{ decision: decision.id, ...decision.answers[option.index] },
	]);
});

test('an advance with a choice of payment opens its panel, and the rows pick the payment Advance pays (#75)', () => {
	const { game } = decisionOf({
		kind: 'chooseResource',
		count: 1,
		from: 'any',
	});
	const source = promptSource({
		game,
		held: { coin: 2, food: 1, worker: 0, culture: 0 },
		advance: {
			track: 'exploration',
			from: 0,
			to: 1,
			payments: [{ coin: 1 }, { food: 1 }],
		},
	});
	const prompt = new PromptState(source);
	assert.equal(prompt.paying, true);
	assert.equal(prompt.panel, 'panel');
	assert.equal(prompt.payIndex, -1);
	assert.equal(prompt.payControls?.confirmDisabled, true);
	prompt.payRow(0, 'food');
	assert.equal(prompt.payIndex, 1);
	assert.equal(prompt.resources.food, 0);
	assert.equal(prompt.payControls?.confirmDisabled, false);
	prompt.clearPayment();
	assert.equal(prompt.payIndex, -1);
	source.advance = null;
	assert.equal(prompt.paying, false);
	assert.equal(prompt.panel, 'none');
});

test('nothing is chosen or sent while a move is being sent', async () => {
	const { game, decision } = exploring();
	const source = promptSource({ game, decision });
	const prompt = new PromptState(source);
	source.busy = true;
	prompt.selectHex(decision.answers[0].hex);
	assert.equal(prompt.hex, null);
	source.busy = false;
	prompt.selectHex(decision.answers[0].hex);
	source.busy = true;
	await prompt.confirm();
	assert.equal(source.sent.length, 0);
});

/**
 * An open slot decision of the given purpose for seat 1, holding `civ`, in a game of `players`.
 * @param {string} civ
 * @param {Record<string, any>} fields - The decision's purpose and options
 * @param {number} [players]
 */
function cardDecision(civ, fields, players = 2) {
	const { state } = startedGame(players);
	const seat = /** @type {any} */ (state.seats[0]);
	seat.civs = [civ];
	seat.civData = {
		historians: { squares: [true, true, true, true], given: {} },
	};
	const decision = /** @type {Record<string, any>} */ ({
		id: 99,
		player: 1,
		kind: 'chooseSlot',
		then: { kind: 'effects' },
		...fields,
	});
	decision.answers = DECISIONS.chooseSlot.answers(state, decision);
	return { decision, game: view(state, 1) };
}

test('a choice on the civilization card lists no buttons; a spot picked there is the answer, worded by what it gives (#78)', async () => {
	const { decision, game } = cardDecision('entertainers', {
		purpose: 'entertainers',
		options: ['c1r1', 'c1r2', 'c1r3', 'c1r4'],
	});
	const source = promptSource({ game, decision });
	const prompt = new PromptState(source);
	assert.equal(prompt.prompt?.layout, 'card');
	assert.deepEqual(prompt.panelOptions, []);
	assert.equal(prompt.civPick?.civ, 'entertainers');
	assert.deepEqual(Object.keys(prompt.civPick?.view.choices ?? {}), [
		'c1r1',
		'c1r2',
		'c1r3',
		'c1r4',
	]);
	assert.equal(prompt.civPick?.selected, null);
	assert.equal(prompt.controls?.confirmDisabled, true);
	prompt.selectSpot('c1r2');
	assert.equal(prompt.spot, 'c1r2');
	assert.equal(prompt.civPick?.selected, 'c1r2');
	assert.equal(prompt.picked, 1);
	assert.equal(prompt.controls?.status, 'Gain 1 culture');
	assert.equal(prompt.controls?.confirmDisabled, false);
	await prompt.confirm();
	assert.deepEqual(source.sent, [{ decision: 99, slot: 'c1r2' }]);
});

test('a spot several answers share lists them in the panel, as a hex does (#78)', () => {
	const { decision, game } = cardDecision(
		'historians',
		{
			purpose: 'historians',
			options: [
				{ to: 2, square: 0 },
				{ to: 3, square: 0 },
			],
		},
		3
	);
	const prompt = new PromptState(promptSource({ game, decision }));
	assert.deepEqual(Object.keys(prompt.civPick?.view.choices ?? {}), [
		'square0',
	]);
	assert.deepEqual(prompt.panelOptions, []);
	prompt.selectSpot('square0');
	assert.equal(prompt.picked, null);
	assert.deepEqual(
		prompt.panelOptions.map((o) => o.index),
		[0, 1]
	);
});

test('an optional choice on the card keeps its decline in the panel (#78)', () => {
	const { decision, game } = cardDecision('leaders', {
		purpose: 'leaders',
		options: ['science', 'military'],
		optional: true,
	});
	const prompt = new PromptState(promptSource({ game, decision }));
	assert.deepEqual(
		prompt.panelOptions.map((o) => decision.answers[o.index].slot),
		[null]
	);
	assert.deepEqual(Object.keys(prompt.civPick?.view.choices ?? {}), [
		'science',
		'military',
	]);
});

test('a decision answered elsewhere offers nothing on the card (#78)', () => {
	const { decision, game } = decisionOf({
		kind: 'chooseSlot',
		purpose: 'loseResource',
		options: ['coin', 'food'],
		then: { kind: 'effects' },
	});
	const prompt = new PromptState(promptSource({ game, decision }));
	assert.equal(prompt.civPick, null);
});
