import { test } from 'vitest';
import assert from 'node:assert/strict';
import { seededRandom } from '../src/lib/engine/random.js';
import {
	dealCharmerDeck,
	revealCharmerIncome,
	exchangeCharmerCard,
	timeTravelersDiscard,
	timeTravelersLandmarks,
	erraticsAdvance,
	ffDecisionPairAdvances,
} from '../src/lib/engine/automa-expansion-ff.js';

test('Charmers set aside charmed cards and score all the visible cards', () => {
	const cards = dealCharmerDeck(
		['monarchy', 'astral-expeditions', 'ghost-towns'],
		seededRandom(1)
	);
	assert.deepEqual(cards.tapestryDeck, ['monarchy']);
	assert.equal(revealCharmerIncome(cards).vp, 2);
	assert.equal(revealCharmerIncome(cards).vp, 2);
	const hand = ['monarchy'],
		discard = [];
	const choice = cards.faceUpCharms[0];
	assert.equal(
		exchangeCharmerCard(
			hand,
			discard,
			cards.faceUpCharms,
			'monarchy',
			choice
		),
		true
	);
	assert.deepEqual(hand, [choice]);
	assert.deepEqual(discard, ['monarchy']);
	assert.equal(revealCharmerIncome(cards).vp, 1);
	assert.equal(
		exchangeCharmerCard(
			hand,
			discard,
			cards.faceUpCharms,
			'monarchy',
			choice
		),
		false
	);
});

test('Time Travelers select the first named tech across rows and eligible 2x2 landmarks', () => {
	assert.deepEqual(
		timeTravelersDiscard({
			bottom: ['warships'],
			middle: ['bakery'],
			top: ['clocks'],
		}),
		{ row: 'middle', index: 0, card: 'bakery' }
	);
	assert.equal(
		timeTravelersDiscard({ bottom: [], middle: [], top: [] }),
		null
	);
	assert.deepEqual(
		timeTravelersLandmarks(['bakery', 'monolith', 'forge'], []),
		['bakery']
	);
	assert.deepEqual(
		timeTravelersLandmarks(['bakery', 'monolith', 'forge'], ['pp']),
		['bakery', 'monolith']
	);
});

test('Erratics check each advance against the human and exempt their favourite', () => {
	const bot = {
		civilization: 'erratics',
		favouriteTrack: 'science',
		tracks: { science: [5], exploration: [4] },
		restartedTracks: [],
	};
	const human = {
		tracks: { science: [0], exploration: [2] },
		restartedTracks: [],
	};
	assert.deepEqual(erraticsAdvance(bot, human, 'exploration'), {
		skip: true,
		vp: 3,
	});
	assert.deepEqual(erraticsAdvance(bot, human, 'science'), {
		skip: false,
		vp: 0,
	});
	bot.tracks.exploration = [3];
	assert.deepEqual(erraticsAdvance(bot, human, 'exploration'), {
		skip: false,
		vp: 0,
	});
	assert.equal(ffDecisionPairAdvances(bot), 2);
	bot.secondCivilization = 'time-travelers';
	assert.equal(ffDecisionPairAdvances(bot), 3);
});
