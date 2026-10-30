// The keyboard shortcuts How to play lists (#42, #83): every group and shortcut has words, and every hotkey is there.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { SHORTCUTS } from '../src/lib/shortcuts.js';
import { TAB_KEYS, TRACK_KEYS, TURN_KEYS } from '../src/lib/hotkeys.js';
import {
	CONFIRM_KEY,
	MOVE_KEYS,
	RETURN_KEYS,
	keyName,
} from '../src/lib/landmark-keys.js';

test('every group has a title and shortcuts, and every shortcut has keys and an action (#42)', () => {
	assert.ok(SHORTCUTS.length >= 4);
	for (const group of SHORTCUTS) {
		assert.ok(group.title.length > 0);
		assert.ok(group.shortcuts.length > 0, group.title);
		for (const { keys, action } of group.shortcuts) {
			assert.ok(keys.length > 0, action);
			assert.ok(
				keys.every((combo) => combo.length > 0 && combo.every(Boolean)),
				action
			);
			assert.match(action, /^[A-Z].*\.$/, action);
		}
	}
});

test('the list names every hotkey the game and a landmark piece answer to (#83, #111)', () => {
	const keys = new Set(
		SHORTCUTS.flatMap((group) =>
			group.shortcuts.flatMap((shortcut) =>
				shortcut.keys.map((combo) => combo.join('+'))
			)
		)
	);
	for (const key of [
		'I',
		'A',
		`1–${TRACK_KEYS.length}`,
		'Enter',
		'Z',
		'Esc',
		'M',
		'1–5',
		'Tab',
		'L',
		...Object.keys(TAB_KEYS).map((tab) => tab.toUpperCase()),
		TURN_KEYS.back,
		TURN_KEYS.forward,
		...Object.keys(MOVE_KEYS).map(keyName),
		CONFIRM_KEY,
		...RETURN_KEYS,
		'H',
		'K',
	]) {
		assert.ok(keys.has(key), key);
	}
});

test("the track answers and the player tabs are listed from the hotkeys' own keys (#127)", () => {
	const turn = SHORTCUTS.find((group) => group.title === 'Your turn');
	const tracks = turn?.shortcuts.find(
		(shortcut) => shortcut.keys[0][0] === `1–${TRACK_KEYS.length}`
	);
	assert.equal(
		tracks?.action,
		'Then answer it: 1 Exploration, 2 Science, 3 Technology or 4 Military.'
	);
	const area = SHORTCUTS.find((group) => group.title === 'Your player area');
	assert.deepEqual(
		area?.shortcuts.map((shortcut) => [
			shortcut.keys[0][0],
			shortcut.action,
		]),
		[
			['Q', 'Capital.'],
			['W', 'Hand.'],
			['E', 'Income.'],
			['R', 'Eras.'],
			['T', 'Civ.'],
			['Y', 'Tech.'],
			['U', 'Terrain.'],
		]
	);
});

test("the placing keys are listed from the explore's and the landmark piece's own keys, as before (#111)", () => {
	const placing = SHORTCUTS.find(
		(group) => group.title === 'Exploring and placing'
	);
	assert.deepEqual(
		placing?.shortcuts.map((shortcut) => shortcut.keys),
		[
			[[','], ['.']],
			[['←'], ['↑'], ['→'], ['↓']],
			[['Enter']],
			[['Backspace'], ['Delete']],
		]
	);
});
