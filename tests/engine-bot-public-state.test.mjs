// Bot privacy, non-winning Shadow Empire ranking and cross-seat invention (#31).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { newGame } from './helpers/engine.mjs';
import { createBotSeat } from '../src/lib/engine/state.js';
import { resolveEffects, contextFor, run } from '../src/lib/engine/loop.js';
import { botEffects } from '../src/lib/engine/effects/bot.js';
import { view } from '../src/lib/engine/view.js';
import { rankPlayers, tiebreakValues } from '../src/lib/engine/ranking.js';
import { HEIGHT_RANKING } from '../src/lib/engine/data/landmarks.js';
import { SCIENCE_DIE } from '../src/lib/engine/data/dice.js';

function fixture() {
	const { state, random } = newGame(1);
	state.pending.length = 0;
	const tracks = ['exploration', 'science', 'technology', 'military'];
	state.seats.push(
		Object.assign(createBotSeat(2, 'automa', 'Egypt', tracks, 8), {
			decisionDeck: [1, 2, 3, 4],
			progressDeck: [8, 9],
			decisionDiscard: [5, 6],
			progressDiscard: [10],
			trapCards: ['academia'],
			multiplierCards: ['socialism'],
			currentPair: { trackCard: 7, tiebreakerCard: 11 },
			incomePair: { trackCard: 12, tiebreakerCard: 13 },
		}),
		Object.assign(createBotSeat(3, 'shadow', 'Mesopotamia', tracks, 10), {
			decisionDeck: [1, 2],
			discard: [3, 4],
			currentPair: { trackCard: 5, tiebreakerCard: 6 },
		})
	);
	return { state, random };
}

test('all viewers see bot deck counts and revealed pairs, never unseen card identities', () => {
	const { state } = fixture();
	const before = structuredClone(state);
	for (const viewer of [null, 1, 2, 3]) {
		const shown = view(state, viewer);
		const automa = shown.seats[1];
		for (const [field, count] of [
			['decisionDeck', 4],
			['progressDeck', 2],
			['trapCards', 1],
			['multiplierCards', 1],
		]) {
			assert.equal(Object.hasOwn(automa, field), false);
			assert.equal(automa[`${field}Count`], count);
		}
		assert.equal(Object.hasOwn(automa, 'incomePair'), false);
		assert.deepEqual(automa.currentPair, before.seats[1].currentPair);
		assert.deepEqual(automa.decisionDiscard, [5, 6]);
		assert.deepEqual(automa.progressDiscard, [10]);
		assert.equal(Object.hasOwn(shown.seats[2], 'decisionDeck'), false);
		assert.equal(shown.seats[2].decisionDeckCount, 2);
		assert.deepEqual(shown.seats[2].discard, [3, 4]);
	}
	assert.deepEqual(state, before);
});

test('Shadow Empire never receives a placing or changes the human/Automa tie order', () => {
	const { state } = fixture();
	state.seats[0].vp = 20;
	state.seats[1].vp = 30;
	state.seats[2].vp = 999;
	assert.deepEqual(rankPlayers(state).ranking, [
		{ seat: 2, place: 1, vp: 30 },
		{ seat: 1, place: 2, vp: 20 },
	]);
	state.seats[0].vp = 30;
	state.seats[0].capital.landmarks = [
		{ landmark: HEIGHT_RANKING.at(-1), row: 0, col: 0, rotation: 0 },
	];
	state.seats[1].landmarks = [HEIGHT_RANKING[0]];
	assert.equal(
		tiebreakValues(state.seats[1]).tallestLandmark,
		HEIGHT_RANKING[0]
	);
	assert.equal(rankPlayers(state).ranking[0].seat, 2);
	assert.deepEqual(rankPlayers(state).ties[0].seats, [1, 2]);
});

test('a neighbour invention refreshes for Automa and gives Shadow Empire no cards or prompt', () => {
	const { state, random } = fixture();
	const before = structuredClone(state);
	const next = resolveEffects(
		state,
		1,
		[
			{
				others: {
					who: 'neighbours',
					effects: [{ invent: { deckOnly: true } }],
				},
			},
		],
		random
	);
	assert.deepEqual(state, before);
	assert.deepEqual(next.pending, []);
	assert.equal(
		next.events.filter((event) => event.type === 'techDisplayRefreshed')
			.length,
		1
	);
	assert.deepEqual(
		next.events
			.filter((event) => event.type === 'techRefreshed')
			.map((event) => event.player),
		[2]
	);
	assert.equal(Object.hasOwn(next.seats[1], 'tech'), false);
	assert.equal(Object.hasOwn(next.seats[2], 'tech'), false);
	const shadowOnly = resolveEffects(
		state,
		3,
		[{ invent: { deckOnly: true } }],
		random
	);
	assert.deepEqual(shadowOnly.supply.tech, before.supply.tech);
	assert.deepEqual(shadowOnly.events, before.events);
	assert.deepEqual(shadowOnly.pending, []);
});

test('an ordered bot advance resolves its landmark before a following invention refresh', () => {
	const { state, random } = fixture();
	state.seats[1].tracks.exploration = [3];
	const ctx = contextFor(state, random, state.pending);
	botEffects(ctx, {
		player: 2,
		kind: 'effects',
		effects: [
			{ advance: { tracks: ['exploration'], noBenefit: true } },
			{ invent: {} },
		],
		ordered: true,
	});
	assert.equal(
		state.events.some((event) => event.type === 'techDisplayRefreshed'),
		false
	);
	run(state, random);
	const landmark = state.events.findIndex(
		(event) => event.type === 'landmarkGained' && event.player === 2
	);
	const refresh = state.events.findIndex(
		(event) => event.type === 'techDisplayRefreshed'
	);
	assert.ok(landmark >= 0);
	assert.ok(refresh > landmark);
});

test('a cross-seat science roll without benefit advances Automa without refreshing technology', () => {
	const { state } = fixture();
	const rolledTechnology = () => SCIENCE_DIE.indexOf('technology');
	const next = resolveEffects(
		state,
		2,
		[{ research: { noBenefit: true } }],
		rolledTechnology
	);
	assert.deepEqual(next.seats[1].tracks.technology, [1]);
	assert.deepEqual(next.supply.tech, state.supply.tech);
	assert.equal(
		next.events.some((event) => event.type === 'techDisplayRefreshed'),
		false
	);
	assert.deepEqual(next.pending, []);
});
