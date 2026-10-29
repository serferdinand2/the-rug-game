// The players overview's cards (#27 design §4): public facts only, the viewer and host marked.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { capitalScore, view } from '../src/lib/engine/game.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { playerCards, playerChips } from '../src/lib/area/players.js';
import { civilizationName } from '../src/lib/describe.js';
import { civAbilityText } from '../src/lib/civ-rules.js';
import { startedGame } from './helpers/engine.mjs';

test('one card per player, the viewer and the host marked', () => {
	const { state } = startedGame(3);
	const cards = playerCards(view(state, 2), 2, 1);
	assert.deepEqual(
		cards.map((c) => [c.seat, c.name, c.you, c.host]),
		[
			[1, state.seats[0].name, false, true],
			[2, state.seats[1].name, true, false],
			[3, state.seats[2].name, false, false],
		]
	);
});

test('a card carries the public facts: VP, resources, furthest tokens and counts', () => {
	const { state } = startedGame(2);
	const seat = /** @type {any} */ (state.seats[0]);
	seat.vp = 12;
	seat.resources = { coin: 1, worker: 2, food: 3, culture: 4 };
	seat.tracks.science = [2, 5];
	seat.tech = { bottom: ['clocks'], middle: [], top: ['bakery'] };
	const [card] = playerCards(view(state, 2), 2, 1);
	assert.equal(card.vp, 12);
	assert.deepEqual(card.resources, {
		coin: 1,
		worker: 2,
		food: 3,
		culture: 4,
	});
	assert.equal(card.tracks.science, 5);
	assert.equal(card.tech, 2);
	assert.equal(card.handSize, state.seats[0].hand.length);
	assert.equal(card.civilization, 'Setting up');
});

test("an opponent's card holds no hand, only its size", () => {
	const { state } = startedGame(2);
	/** @type {any} */ (state.seats[0]).hand = ['trap-1', 'monarchy'];
	const [card] = playerCards(view(state, 2), 2, 1);
	assert.equal(card.handSize, 2);
	assert.ok(!JSON.stringify(card).includes('monarchy'));
});

test("a card names the land terrains of the player's territories, and its capital points are what the capital scores", () => {
	const { state } = startedGame(2);
	const [card] = playerCards(view(state, 2), 2, 1);
	// Every start territory is printed with land terrain; the sea never counts.
	assert.ok(card.terrain.length > 0);
	assert.ok(!card.terrain.includes('Sea'));
	assert.deepEqual(card.terrain, [...new Set(card.terrain)]);
	assert.equal(card.capitalPoints, 0);
});

test("an Architects card's capital points are the engine's capital score, uniform lines included (#128)", () => {
	const { state } = startedGame(2);
	const seat = /** @type {any} */ (state.seats[0]);
	seat.civs = ['architects'];
	// Row 0 filled with houses where it is open: complete, and uniform unless the mat blocks a plot with something else.
	for (let col = 0; col < 9; col++) {
		seat.capital.buildings.push({ building: 'house', row: 0, col });
	}
	const score = capitalScore(seat);
	assert.ok(score.uniform > 0, 'the row of houses is uniform');
	const [card] = playerCards(view(state, 2), 2, 1);
	assert.equal(card.capitalPoints, score.vp);
});

test("the header's chips name each player, their VP and whose turn it is, in seat order (#90)", () => {
	const { state } = startedGame(3);
	/** @type {any} */ (state.seats[1]).vp = 7;
	const game = view(state, 2);
	const chips = playerChips(game);
	assert.deepEqual(
		chips.map((chip) => [chip.seat, chip.name, chip.vp, chip.current]),
		[
			[1, state.seats[0].name, state.seats[0].vp, state.current === 1],
			[2, state.seats[1].name, 7, state.current === 2],
			[3, state.seats[2].name, state.seats[2].vp, state.current === 3],
		]
	);
});

test('a chip says "Setting up" and has no ability until its player has a civilization, as the cards do (#90)', () => {
	const { state } = startedGame(2);
	const [bare] = playerChips(view(state, 1));
	assert.equal(bare.civilization, 'Setting up');
	assert.equal(bare.ability, undefined);
	/** @type {any} */ (state.seats[0]).civs = ['alchemists'];
	const game = view(state, 1);
	const [chip] = playerChips(game);
	const [card] = playerCards(game, 1, 1);
	assert.equal(chip.civilization, civilizationName('alchemists'));
	assert.equal(chip.civilization, card.civilization);
	assert.equal(chip.ability, civAbilityText('alchemists', game.version));
	assert.ok(chip.ability);
});

test('Game.svelte renders one GameHeader and draws no chip, clock or log button of its own (#90)', () => {
	const source = readFileSync(
		fileURLToPath(new URL('../src/screens/Game.svelte', import.meta.url)),
		'utf8'
	);
	assert.match(source, /<GameHeader\b/);
	assert.doesNotMatch(source, /<PageHeader\b|<PlayerChip\b|<TurnClock\b/);
	assert.doesNotMatch(source, /rg-game--unread|Setting up/);
});
