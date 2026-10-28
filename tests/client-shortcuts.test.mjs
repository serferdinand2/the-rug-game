// The keyboard shortcuts How to play lists (#42): every group and shortcut has words, and the keys the game handles
// are all there.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { SHORTCUTS } from '../src/lib/shortcuts.js';

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

test('the list names every key the game answers to (#42)', () => {
	const keys = new Set(
		SHORTCUTS.flatMap((group) =>
			group.shortcuts.flatMap((shortcut) =>
				shortcut.keys.map((combo) => combo.join('+'))
			)
		)
	);
	for (const key of [
		'Tab',
		'Shift+Tab',
		'Enter',
		'Space',
		'Esc',
		'←',
		'→',
		'↑',
		'↓',
		'Home',
		'End',
		'R',
		'Shift+R',
		'Backspace',
		'Delete',
	]) {
		assert.ok(keys.has(key), key);
	}
});
