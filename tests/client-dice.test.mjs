// The dice tray's rolls (#61): which events roll which dice, landing on which faces, under which caption.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	BLACK_DIE,
	RED_DIE,
	SCIENCE_DIE,
} from '../src/lib/engine/data/dice.js';
import { faceOf, rollsOf } from '../src/lib/dice.js';

const GAME = {
	seats: [
		{ seat: 1, name: 'Vera' },
		{ seat: 2, name: 'Ana' },
	],
};

test('a science die roll is one science die landing on its track', () => {
	const [roll] = rollsOf(
		[{ seq: 7, type: 'scienceDieRolled', player: 1, track: 'military' }],
		GAME,
		2
	);
	assert.equal(roll.id, '7');
	assert.equal(roll.player, 1);
	assert.deepEqual(roll.dice, [
		{ die: 'science', face: SCIENCE_DIE.indexOf('military') },
	]);
	assert.equal(roll.caption, 'Vera rolls the science die');
	assert.equal(roll.spoken, 'Vera rolled Military on the science die.');
	assert.equal(roll.bust, false);
});

test('the conquer dice are the red die, then the black', () => {
	const [roll] = rollsOf(
		[{ seq: 3, type: 'conquerDiceRolled', player: 2, red: 1, black: 2 }],
		GAME,
		2
	);
	assert.deepEqual(roll.dice, [
		{ die: 'red', face: 1 },
		{ die: 'black', face: 2 },
	]);
	assert.equal(roll.caption, 'You roll the conquer dice');
	assert.equal(
		roll.spoken,
		'Ana rolled the conquer dice: red 5 VP, black 1 food.'
	);
});

test('the Alchemists roll the science die, and a bust says so', () => {
	const rolls = rollsOf(
		[
			{
				seq: 1,
				type: 'alchemistsRolled',
				player: 1,
				track: 'science',
				marked: ['science'],
			},
			{ seq: 2, type: 'alchemistsBust', player: 1, track: 'science' },
		],
		GAME,
		null
	);
	assert.deepEqual(
		rolls.map((r) => [r.caption, r.bust, r.dice[0].face]),
		[
			[
				'Vera rolls for the Alchemists',
				false,
				SCIENCE_DIE.indexOf('science'),
			],
			[
				'Vera rolls for the Alchemists and busts',
				true,
				SCIENCE_DIE.indexOf('science'),
			],
		]
	);
});

test('several rolls in one batch keep their order, and other events roll nothing', () => {
	const rolls = rollsOf(
		[
			{ seq: 1, type: 'tokenMoved', player: 1 },
			{
				seq: 2,
				type: 'scienceDieRolled',
				player: 1,
				track: 'exploration',
			},
			{
				seq: 3,
				type: 'scienceDieRolled',
				player: 1,
				track: 'technology',
			},
			{ seq: 4, type: 'turnStarted', player: 2 },
		],
		GAME,
		1
	);
	assert.deepEqual(
		rolls.map((r) => [r.id, r.caption, r.dice[0].face]),
		[
			[
				'2',
				'You roll the science die',
				SCIENCE_DIE.indexOf('exploration'),
			],
			[
				'3',
				'You roll the science die',
				SCIENCE_DIE.indexOf('technology'),
			],
		]
	);
});

test('every face of every die shows what the dice data says', () => {
	SCIENCE_DIE.forEach((track, face) => {
		assert.deepEqual(faceOf('science', face), { kind: 'track', id: track });
	});
	assert.deepEqual(
		RED_DIE.map((_, face) => faceOf('red', face)),
		[
			{ kind: 'vp', words: '4 VP' },
			{ kind: 'vp', words: '5 VP' },
			{ kind: 'vp', words: '6 VP' },
			{ kind: 'vp', words: '7 VP' },
			{ kind: 'vp', words: '1 VP / territory' },
			{ kind: 'vp', words: '1 VP / territory' },
		]
	);
	assert.deepEqual(
		BLACK_DIE.map((_, face) => faceOf('black', face)),
		[
			{ kind: 'resource', id: 'coin' },
			{ kind: 'resource', id: 'worker' },
			{ kind: 'resource', id: 'food' },
			{ kind: 'resource', id: 'culture' },
			{ kind: 'tile' },
			{ kind: 'tile' },
		]
	);
});
