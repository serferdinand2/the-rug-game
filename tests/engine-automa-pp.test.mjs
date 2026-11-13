// Plans & Ploys Automa civilization primitives (#34).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createGame } from '../src/lib/engine/setup.js';
import { seededRandom } from '../src/lib/engine/random.js';
import { contextFor } from '../src/lib/engine/loop.js';
import {
	equalizerTracks,
	equalizerTrack,
	equalizersIncome,
	setupHucksters,
	addHuckstersIncomeItem,
	huckstersOffers,
	huckstersScoreCount,
	takeHuckstersOffer,
} from '../src/lib/engine/automa-expansion-pp.js';

function solo() {
	const random = seededRandom(31);
	const state = createGame({
		version: 'current',
		random,
		participants: [
			{ kind: 'player', name: 'Ana' },
			{ kind: 'automa', name: 'Automa', level: 2 },
			{ kind: 'shadow', name: 'Shadow' },
		],
	});
	state.pending = [];
	return { state, random, ctx: contextFor(state, random, state.pending) };
}

test('Equalizers consider only tracks one or two spaces behind and use card tiebreaks', () => {
	const { state } = solo();
	const [human, bot] = state.seats;
	human.tracks.exploration = [4];
	bot.tracks.exploration = [2];
	human.tracks.science = [5];
	bot.tracks.science = [4];
	human.tracks.technology = [5];
	bot.tracks.technology = [2];
	assert.deepEqual(equalizerTracks(state, 2, 1), ['exploration', 'science']);
	assert.equal(
		equalizerTrack(state, 2, 1, [
			'science',
			'exploration',
			'technology',
			'military',
		]),
		'science'
	);
});

test('Equalizers score five when no track qualifies', () => {
	const { state, ctx } = solo();
	state.seats[1].incomePair = { trackCard: 1, tiebreakerCard: 2 };
	const before = state.seats[1].vp;
	equalizersIncome(ctx, 2);
	assert.equal(state.seats[1].vp, before + 5);
});

test('Hucksters pool starts face up, uses the favourite and offers items only on a human advance', () => {
	const { state, ctx } = solo();
	const bot = state.seats[1];
	bot.civilization = 'hucksters';
	bot.favouriteTrack = 'exploration';
	setupHucksters(ctx, 2);
	assert.equal(huckstersScoreCount(state, 2), 3);
	assert.equal(bot.huckstersPool.space.length, 1);
	assert.equal(bot.huckstersPool.tapestry.length, 1);
	assert.equal(bot.huckstersPool.territory.length, 1);
	bot.favouriteTrack = 'technology';
	addHuckstersIncomeItem(ctx, 2);
	assert.equal(bot.huckstersPool.tech.length, 1);
	state.current = 1;
	state.turnKind = 'income';
	assert.deepEqual(huckstersOffers(state, 1, 'tech'), []);
	state.turnKind = 'advance';
	const [offer] = huckstersOffers(state, 1, 'tech');
	assert.equal(offer.player, 2);
	assert.equal(takeHuckstersOffer(state, 1, 2, 'tech', offer.item), true);
	assert.equal(takeHuckstersOffer(state, 1, 2, 'tech', offer.item), false);
	assert.equal(huckstersScoreCount(state, 2), 3);
});
