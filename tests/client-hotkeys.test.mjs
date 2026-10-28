// The game's hotkeys (#83): each key's action in each context of the game screen.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { hotkeyAction } from '../src/lib/hotkeys.js';

/** A turn on which everything is possible. */
const OPEN = {
	canIncome: true,
	canAdvance: true,
	canUndo: true,
	players: 3,
	board: /** @type {'tracks'} */ ('tracks'),
	exploring: false,
};

test('I asks before taking income, and I or Enter then confirms it (#83, owner)', () => {
	assert.deepEqual(hotkeyAction('i', OPEN), { type: 'income' });
	assert.deepEqual(hotkeyAction('I', OPEN), { type: 'income' });
	assert.equal(hotkeyAction('i', { ...OPEN, canIncome: false }), null);
	const confirming = { ...OPEN, confirming: true };
	assert.deepEqual(hotkeyAction('i', confirming), { type: 'incomeConfirm' });
	assert.deepEqual(hotkeyAction('Enter', confirming), {
		type: 'incomeConfirm',
	});
	assert.deepEqual(hotkeyAction('Escape', confirming), { type: 'cancel' });
});

test('A asks which track, and 1 to 4 answer in the board order (#83, owner)', () => {
	assert.deepEqual(hotkeyAction('a', OPEN), { type: 'advance' });
	assert.equal(hotkeyAction('a', { ...OPEN, canAdvance: false }), null);
	const asking = {
		...OPEN,
		asking: true,
		tracks: ['exploration', 'science', 'technology', 'military'],
	};
	assert.deepEqual(hotkeyAction('1', asking), {
		type: 'track',
		track: 'exploration',
	});
	assert.deepEqual(hotkeyAction('2', asking), {
		type: 'track',
		track: 'science',
	});
	assert.deepEqual(hotkeyAction('3', asking), {
		type: 'track',
		track: 'technology',
	});
	assert.deepEqual(hotkeyAction('4', asking), {
		type: 'track',
		track: 'military',
	});
	// No arts track in the base game, and a track with nothing to pay for is no answer.
	assert.equal(hotkeyAction('5', asking), null);
	assert.equal(
		hotkeyAction('2', { ...asking, tracks: ['exploration'] }),
		null
	);
	assert.deepEqual(hotkeyAction('Escape', asking), { type: 'cancel' });
});

test('1 to 5 open the players overview on a player, outside the track question (#83, owner)', () => {
	assert.deepEqual(hotkeyAction('1', OPEN), { type: 'player', seat: 1 });
	assert.deepEqual(hotkeyAction('3', OPEN), { type: 'player', seat: 3 });
	assert.equal(hotkeyAction('4', OPEN), null);
	assert.deepEqual(hotkeyAction('5', { ...OPEN, players: 5 }), {
		type: 'player',
		seat: 5,
	});
});

test('Q to U pick the player tabs in order (#83, owner)', () => {
	const tabs = [
		'capital',
		'hand',
		'income',
		'eras',
		'civ',
		'tech',
		'terrain',
	];
	[...'qwertyu'].forEach((key, at) => {
		assert.deepEqual(hotkeyAction(key, OPEN), {
			type: 'tab',
			tab: tabs[at],
		});
		assert.deepEqual(hotkeyAction(key.toUpperCase(), OPEN), {
			type: 'tab',
			tab: tabs[at],
		});
	});
});

test('M goes to the map, and back to the tracks from it (#83, owner)', () => {
	assert.deepEqual(hotkeyAction('m', OPEN), { type: 'board', board: 'map' });
	assert.deepEqual(hotkeyAction('m', { ...OPEN, board: 'map' }), {
		type: 'board',
		board: 'tracks',
	});
});

test('the other keys: Z, L, H, K, Enter, and comma and full stop while exploring (#83)', () => {
	assert.deepEqual(hotkeyAction('z', OPEN), { type: 'undo' });
	assert.equal(hotkeyAction('z', { ...OPEN, canUndo: false }), null);
	assert.deepEqual(hotkeyAction('l', OPEN), { type: 'log' });
	assert.deepEqual(hotkeyAction('h', OPEN), { type: 'help' });
	assert.deepEqual(hotkeyAction('k', OPEN), { type: 'keys' });
	assert.deepEqual(hotkeyAction('Enter', OPEN), { type: 'confirm' });
	assert.equal(hotkeyAction(',', OPEN), null);
	assert.deepEqual(hotkeyAction(',', { ...OPEN, exploring: true }), {
		type: 'turn',
		step: -1,
	});
	assert.deepEqual(hotkeyAction('.', { ...OPEN, exploring: true }), {
		type: 'turn',
		step: 1,
	});
	assert.equal(hotkeyAction('Escape', OPEN), null);
	assert.equal(hotkeyAction('x', OPEN), null);
});
