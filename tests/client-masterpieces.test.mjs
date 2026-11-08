// Masterpieces and inspiration tiles in the client (#35 part 4): the cards' words and faces, the masterpiece row on
// the arts track's line, each player's masterpieces and spare tiles, and the inspired rows of the income mat.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { view } from '../src/lib/engine/game.js';
import { MASTERPIECES } from '../src/lib/engine/data/masterpieces.js';
import {
	masterpieceCardData,
	masterpieceText,
} from '../src/lib/cards/masterpiece-text.js';
import { masterpieceRow } from '../src/lib/area/masterpieces.js';
import { startedGame } from './helpers/engine.mjs';
import { AA } from './helpers/arts.mjs';

/** The first player's view of a started game with these options. */
const viewOf = (/** @type {any} */ options) =>
	view(startedGame(2, options).state, 1);

test('every masterpiece has its effect in words, as one or more sentences', () => {
	for (const card of MASTERPIECES) {
		const text = masterpieceText(card.id);
		assert.match(text, /^[A-Z].*\.$/, card.id);
		assert.doesNotMatch(text, /face down,|undefined|one$/, card.id);
	}
});

test('the masterpieces read as the cards print them', () => {
	assert.equal(
		masterpieceText('theater'),
		'Gain 1 VP for each space you have advanced on Arts.'
	);
	assert.equal(
		masterpieceText('painting'),
		'Gain 1 resource of your choice and 4 VP.'
	);
	assert.equal(
		masterpieceText('costuming'),
		'You may make one trade: pay 1 resource of your choice to advance on Arts.'
	);
});

test('Art Deco and Mime say they are used once, and their benefit no longer names the turning', () => {
	assert.equal(
		masterpieceText('art-deco'),
		'Gain an income building of your choice and gain 1 resource of your choice. Used once: then it turns face down.'
	);
	assert.match(
		masterpieceText('mime'),
		/^You may make one trade: pay 1 resource of your choice to repeat the benefit of a track space you are on.*\. Used once: then it turns face down\.$/
	);
});

test("a masterpiece's card face: its name, picture and words", () => {
	assert.deepEqual(masterpieceCardData('ballet'), {
		id: 'ballet',
		title: 'Ballet',
		artwork: '/art/masterpiece/ballet.svg',
		text: masterpieceText('ballet'),
	});
});

test('the masterpiece row: the 3 face-up cards and the deck count of a game with the arts track', () => {
	const game = viewOf(AA);
	const row = masterpieceRow(game);
	assert.deepEqual(row?.faceUp, game.supply.masterpieces.faceUp);
	assert.equal(row?.faceUp.length, 3);
	assert.equal(row?.deck, 17);
});

test('no masterpiece row without the arts track', () => {
	assert.equal(masterpieceRow(viewOf({})), null);
	assert.equal(
		masterpieceRow(viewOf({ ...AA, variants: ['no-arts-track'] })),
		null
	);
});
