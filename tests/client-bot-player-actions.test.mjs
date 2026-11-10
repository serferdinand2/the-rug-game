// Bot action reports display the public pair, never hidden deck state (#31).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import '../src/lib/engine/game.js';
import { actionsOf } from '../src/lib/player-actions.js';
import { AUTOMA_CARDS } from '../src/lib/engine/data/automa-cards.js';

const game = {
	seats: [
		{ seat: 1, name: 'Lazar', kind: 'player', civs: [] },
		{
			seat: 2,
			name: 'Egypt',
			kind: 'automa',
			favouriteTrack: 'science',
			currentPair: { trackCard: 21, tiebreakerCard: 22 },
		},
		{
			seat: 3,
			name: 'Mesopotamia',
			kind: 'shadow',
			favouriteTrack: 'military',
		},
	],
};
const reveal = {
	seq: 2,
	type: 'botDecisionCards',
	player: 2,
	bot: 'automa',
	pair: { trackCard: 4, tiebreakerCard: 3 },
};
const advance = {
	seq: 3,
	type: 'tokenMoved',
	player: 2,
	track: 'exploration',
	from: 0,
	to: 1,
};

test('an old report keeps the favourite captured with its public decision pair', () => {
	const [item] = actionsOf(
		[{ ...reveal, favourites: { 2: 'exploration' } }, advance],
		game,
		1
	);
	assert.equal(item.bot.favouriteTrack, 'exploration');
	assert.equal(game.seats[1].favouriteTrack, 'science');
});

test('a public reveal supplies the exact canonical pair to the following bot action for every human viewer', () => {
	for (const viewer of [1, null]) {
		const [item] = actionsOf([reveal, advance], game, viewer);
		assert.equal(item.kind, 'advance');
		assert.equal(item.bot.kind, 'automa');
		assert.equal(item.bot.favouriteTrack, 'science');
		assert.deepEqual(
			item.bot.cards.map((card) => card.id),
			[4, 3]
		);
		assert.equal(item.bot.cards[0], AUTOMA_CARDS[3]);
		assert.equal(item.bot.cards[1], AUTOMA_CARDS[2]);
		assert.deepEqual(item.picture, {
			track: 'exploration',
			space: 1,
			from: 0,
			landmark: null,
		});
	}
});

test('a reveal before a response batch is recovered from public history, and a solo Shadow shares that pair', () => {
	const [item] = actionsOf([{ ...advance, player: 3 }], game, 1, [
		{ seq: 1, type: 'turnStarted', player: 2 },
		reveal,
	]);
	assert.equal(item.bot.kind, 'shadow');
	assert.equal(item.bot.favouriteTrack, 'military');
	assert.deepEqual(
		item.bot.cards.map((card) => card.id),
		[4, 3]
	);
});

test('the next turn clears a previous bot pair and human actions keep their existing shape', () => {
	const [human] = actionsOf(
		[
			reveal,
			{ seq: 3, type: 'turnStarted', player: 1 },
			{ ...advance, seq: 4, player: 1 },
		],
		game,
		null
	);
	assert.equal(Object.hasOwn(human, 'bot'), false);
	const [bot] = actionsOf([{ ...advance, seq: 6 }], game, 1, [
		reveal,
		{ seq: 5, type: 'turnStarted', player: 2 },
	]);
	assert.deepEqual(bot.bot.cards, []);
});

test('unknown or missing public card IDs never substitute a hidden current pair or a fallback card', () => {
	for (const pair of [
		{ trackCard: 99, tiebreakerCard: 3 },
		{ trackCard: 4 },
		null,
	]) {
		const [item] = actionsOf([{ ...reveal, pair }, advance], game, 1);
		assert.deepEqual(item.bot.cards, []);
	}
});
