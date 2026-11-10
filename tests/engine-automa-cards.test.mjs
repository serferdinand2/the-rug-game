// The 22 base decision cards preserve every printed selector and icon (02 §9.4).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { AUTOMA_CARDS } from '../src/lib/engine/data/automa-cards.js';

// Independently transcribed from docs/research/02-base-content.md §9.4.
const CARD_ROWS = [
	[
		1,
		'decision',
		'END',
		'ALL',
		'favourite military exploration technology science',
		1,
		true,
		true,
	],
	[
		2,
		'decision',
		'ALL',
		'LMK',
		'military exploration favourite science technology',
		2,
		true,
		false,
	],
	[
		3,
		'decision',
		'LMK',
		'END',
		'science technology military exploration favourite',
		1,
		false,
		true,
	],
	[
		4,
		'decision',
		'LMK',
		'ALL',
		'technology science favourite military exploration',
		3,
		true,
		false,
	],
	[
		5,
		'decision',
		'ALL',
		'LMK',
		'exploration military technology science favourite',
		10,
		false,
		false,
	],
	[
		6,
		'decision',
		'ALL',
		'ALL',
		'military science favourite technology exploration',
		1,
		false,
		true,
	],
	[
		7,
		'decision',
		'ALL',
		'ALL',
		'favourite technology exploration military science',
		5,
		false,
		false,
	],
	[
		8,
		'progress',
		'ALL',
		'ALL',
		'exploration military technology favourite science',
		6,
		true,
		false,
	],
	[
		9,
		'progress',
		'ALL',
		'ALL',
		'technology science favourite exploration military',
		4,
		true,
		true,
	],
	[
		10,
		'progress',
		'LMK',
		'ALL',
		'military exploration technology science favourite',
		9,
		false,
		true,
	],
	[
		11,
		'progress',
		'ALL',
		'LMK',
		'favourite exploration military science technology',
		7,
		false,
		false,
	],
	[
		12,
		'progress',
		'ALL',
		'ALL',
		'science technology favourite military exploration',
		8,
		true,
		true,
	],
	[
		13,
		'progress',
		'ALL',
		'LMK',
		'science technology military favourite exploration',
		6,
		false,
		false,
	],
	[
		14,
		'progress',
		'LMK',
		'ALL',
		'exploration favourite science military technology',
		4,
		true,
		true,
	],
	[
		15,
		'progress',
		'LMK',
		'LMK',
		'favourite military technology exploration science',
		9,
		false,
		true,
	],
	[
		16,
		'progress',
		'ALL',
		'LMK',
		'technology exploration favourite science military',
		7,
		true,
		false,
	],
	[
		17,
		'progress',
		'ALL',
		'ALL',
		'exploration favourite technology military science',
		5,
		true,
		false,
	],
	[
		18,
		'progress',
		'LMK',
		'ALL',
		'favourite exploration military science technology',
		1,
		false,
		false,
	],
	[
		19,
		'progress',
		'ALL',
		'ALL',
		'military technology science exploration favourite',
		2,
		true,
		true,
	],
	[
		20,
		'progress',
		'ALL',
		'ALL',
		'technology exploration science military favourite',
		1,
		false,
		false,
	],
	[
		21,
		'progress',
		'ALL',
		'END',
		'exploration technology favourite science military',
		3,
		true,
		true,
	],
	[
		22,
		'progress',
		'END',
		'ALL',
		'military exploration technology favourite science',
		1,
		false,
		true,
	],
];

test('the base deck has exactly cards 1 through 22 in ID order', () => {
	assert.deepEqual(
		AUTOMA_CARDS.map((card) => card.id),
		[
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
			20, 21, 22,
		]
	);
});

for (const [
	id,
	deck,
	automaTrack,
	shadowEmpireTrack,
	tracks,
	hexPattern,
	income,
	topple,
] of CARD_ROWS) {
	test(`base card ${id} preserves its selectors, tiebreakers and icons`, () => {
		assert.deepEqual(
			AUTOMA_CARDS.find((card) => card.id === id),
			{
				id,
				deck,
				automaTrack,
				shadowEmpireTrack,
				trackTiebreakers: tracks.split(' '),
				hexPattern,
				income,
				topple,
			}
		);
	});
}

test('card records and their shared top-to-bottom tiebreakers cannot be mutated', () => {
	assert.ok(Object.isFrozen(AUTOMA_CARDS));
	for (const card of AUTOMA_CARDS) {
		assert.ok(Object.isFrozen(card));
		assert.ok(Object.isFrozen(card.trackTiebreakers));
	}
	assert.throws(() => {
		AUTOMA_CARDS[0].topple = false;
	}, TypeError);
	assert.throws(() => AUTOMA_CARDS[0].trackTiebreakers.reverse(), TypeError);
});
