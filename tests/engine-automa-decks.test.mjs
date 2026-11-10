import assert from 'node:assert/strict';
import test from 'node:test';
import { seededRandom } from '../src/lib/engine/random.js';
import {
	createAutomaDecks,
	createShadowEmpireDeck,
	drawAutomaPair,
	drawShadowEmpirePair,
} from '../src/lib/engine/automa-decks.js';
import { createGame } from '../src/lib/engine/setup.js';

test('Automa starts with cards 1–7 and one random progress card in its decision deck', () => {
	const decks = createAutomaDecks(seededRandom(31));
	assert.equal(decks.decisionDeck.length, 8);
	assert.equal(decks.progressDeck.length, 14);
	assert.deepEqual(
		decks.decisionDeck
			.filter((id) => id >= 1 && id <= 7)
			.sort((a, b) => a - b),
		[1, 2, 3, 4, 5, 6, 7]
	);
	assert.equal(decks.decisionDeck.filter((id) => id >= 8).length, 1);
	assert.equal(decks.decisionDeck.includes(0), false);
	assert.deepEqual(decks.decisionDiscard, []);
	assert.deepEqual(decks.progressDiscard, []);
	assert.equal(decks.currentPair, null);
});

test('Automa setup preserves every base card exactly once across both decks', () => {
	const decks = createAutomaDecks(seededRandom(301));
	assert.deepEqual(
		[...decks.decisionDeck, ...decks.progressDeck].sort((a, b) => a - b),
		Array.from({ length: 22 }, (_, i) => i + 1)
	);
});

test('standalone Shadow Empire starts with the twelve-card base variant deck', () => {
	const decks = createShadowEmpireDeck(seededRandom(85));
	assert.equal(decks.decisionDeck.length, 12);
	assert.deepEqual(
		[...decks.decisionDeck].sort((a, b) => a - b),
		Array.from({ length: 12 }, (_, i) => i + 1)
	);
	assert.deepEqual(decks.discard, []);
	assert.equal(decks.currentPair, null);
	assert.equal(decks.previousTiebreaker, null);
});

test('bot deck shuffles are reproducible and do not mutate canonical cards', () => {
	assert.deepEqual(
		createAutomaDecks(seededRandom(8)),
		createAutomaDecks(seededRandom(8))
	);
	assert.deepEqual(
		createShadowEmpireDeck(seededRandom(8)),
		createShadowEmpireDeck(seededRandom(8))
	);
});

test('setup gives the solo Automa pair one shared deck and standalone Shadow its own deck', () => {
	const solo = createGame({
		participants: [
			{ kind: 'player', name: 'Ana' },
			{ kind: 'automa', name: 'Automa', level: 2 },
			{ kind: 'shadow', name: 'Shadow Empire' },
		],
		version: 'current',
		random: seededRandom(31),
	});
	assert.equal(solo.seats[1].decisionDeck.length, 8);
	assert.equal(solo.seats[2].decisionDeck, undefined);

	const standalone = createGame({
		participants: [
			{ kind: 'player', name: 'Ana' },
			{ kind: 'player', name: 'Bo' },
			{ kind: 'shadow', name: 'Shadow Empire' },
		],
		version: 'current',
		random: seededRandom(85),
	});
	assert.equal(standalone.seats[2].decisionDeck.length, 12);
	assert.equal(standalone.seats[1].decisionDeck, undefined);
});

test('Automa draws a randomly oriented pair and discards it only before a later draw', () => {
	const automa = createAutomaDecks(seededRandom(31));
	const firstDraw = [...automa.decisionDeck];
	const first = drawAutomaPair(automa, () => 1);
	assert.equal(first.trackCard, firstDraw[1]);
	assert.equal(first.tiebreakerCard, firstDraw[0]);
	assert.equal(automa.decisionDeck.length, 6);
	assert.deepEqual(automa.decisionDiscard, []);
	assert.deepEqual(automa.currentPair, first);

	const second = drawAutomaPair(automa, () => 0);
	assert.equal(automa.decisionDeck.length, 4);
	assert.deepEqual(
		new Set(automa.decisionDiscard),
		new Set([first.trackCard, first.tiebreakerCard])
	);
	assert.notDeepEqual(second, first);

	const lastPair = automa.currentPair;
	automa.decisionDeck.length = 0;
	assert.equal(
		drawAutomaPair(automa, () => 0),
		null
	);
	assert.deepEqual(automa.currentPair, lastPair);
	assert.equal(automa.decisionDiscard.includes(lastPair.trackCard), false);
});

test('standalone Shadow discards each pair and reshuffles its full deck after six turns', () => {
	const shadow = createShadowEmpireDeck(seededRandom(19));
	const seen = [];
	for (let turn = 0; turn < 6; turn += 1) {
		const pair = drawShadowEmpirePair(shadow, () => 0);
		seen.push(pair.trackCard, pair.tiebreakerCard);
		assert.equal(shadow.decisionDeck.length, 10 - turn * 2);
	}
	assert.deepEqual(
		seen.sort((a, b) => a - b),
		Array.from({ length: 12 }, (_, i) => i + 1)
	);
	assert.equal(shadow.decisionDeck.length, 0);
	assert.deepEqual(shadow.discard, []);
	const previous = shadow.currentPair;
	const next = drawShadowEmpirePair(shadow, () => 0);
	assert.equal(shadow.previousTiebreaker, previous.tiebreakerCard);
	assert.equal(shadow.decisionDeck.length, 10);
	assert.deepEqual(shadow.discard, []);
	assert.equal(shadow.currentPair.trackCard, next.trackCard);
	assert.equal(shadow.currentPair.tiebreakerCard, next.tiebreakerCard);
});
