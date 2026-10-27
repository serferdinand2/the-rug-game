// The players overview's cards (#27 design §4): public facts only, the viewer and host marked.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { view } from '../src/lib/engine/game.js';
import { playerCards } from '../src/lib/area/players.js';
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
