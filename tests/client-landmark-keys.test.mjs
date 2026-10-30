// A landmark piece's keys and words (#111): what each key asks of it, its label and titles, and that How to play lists its keys.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
	CONFIRM_KEY,
	LANDMARK_TITLES,
	MOVE_KEYS,
	RETURN_KEYS,
	ROTATE_KEYS,
	keyName,
	landmarkKeyAction,
	landmarkLabel,
} from '../src/lib/landmark-keys.js';
import { TURN_KEYS } from '../src/lib/hotkeys.js';
import { SHORTCUTS } from '../src/lib/shortcuts.js';

/** Every key the tests press: the piece's, and some it ignores. */
const KEYS = [
	'ArrowUp',
	'ArrowDown',
	'ArrowLeft',
	'ArrowRight',
	' ',
	'Enter',
	'.',
	',',
	'Backspace',
	'Delete',
	'r',
	'R',
	'Escape',
	'Tab',
	'a',
];

/** The keys How to play lists for exploring and placing, as it shows them. */
function placingKeys() {
	const group = SHORTCUTS.find(
		(candidate) => candidate.title === 'Exploring and placing'
	);
	return new Set(
		group?.shortcuts.flatMap((shortcut) =>
			shortcut.keys.map((combo) => combo.join('+'))
		)
	);
}

test('an arrow moves the piece one plot, in the tray and on the grid (#111)', () => {
	for (const state of /** @type {const} */ (['tray', 'placed'])) {
		assert.deepEqual(landmarkKeyAction('ArrowUp', state), {
			type: 'move',
			row: -1,
			col: 0,
		});
		assert.deepEqual(landmarkKeyAction('ArrowDown', state), {
			type: 'move',
			row: 1,
			col: 0,
		});
		assert.deepEqual(landmarkKeyAction('ArrowLeft', state), {
			type: 'move',
			row: 0,
			col: -1,
		});
		assert.deepEqual(landmarkKeyAction('ArrowRight', state), {
			type: 'move',
			row: 0,
			col: 1,
		});
	}
});

test('in the tray Space and Enter select the piece, and nothing else is asked (#111)', () => {
	assert.deepEqual(landmarkKeyAction(' ', 'tray'), { type: 'select' });
	assert.deepEqual(landmarkKeyAction('Enter', 'tray'), { type: 'select' });
	for (const key of ['.', ',', 'Backspace', 'Delete', 'r', 'Escape']) {
		assert.equal(landmarkKeyAction(key, 'tray'), null, key);
	}
});

test('on the grid Enter confirms, the full stop and comma rotate, and Backspace and Delete return it (#111)', () => {
	assert.deepEqual(landmarkKeyAction(' ', 'placed'), { type: 'select' });
	assert.deepEqual(landmarkKeyAction('Enter', 'placed'), {
		type: 'confirm',
	});
	assert.deepEqual(landmarkKeyAction('.', 'placed'), { type: 'rotate' });
	assert.deepEqual(landmarkKeyAction(',', 'placed'), { type: 'rotate' });
	assert.deepEqual(landmarkKeyAction('Backspace', 'placed'), {
		type: 'return',
	});
	assert.deepEqual(landmarkKeyAction('Delete', 'placed'), {
		type: 'return',
	});
	// R is the Eras tab since #83.
	assert.equal(landmarkKeyAction('r', 'placed'), null);
	assert.equal(landmarkKeyAction('R', 'placed'), null);
	assert.equal(landmarkKeyAction('Escape', 'placed'), null);
});

test('a locked piece, and a key pressed with Ctrl, Alt or Cmd, ask for nothing (#111)', () => {
	for (const key of KEYS) {
		assert.equal(landmarkKeyAction(key, 'locked'), null, key);
		for (const state of /** @type {const} */ (['tray', 'placed'])) {
			for (const modifier of ['ctrlKey', 'altKey', 'metaKey']) {
				assert.equal(
					landmarkKeyAction(key, state, { [modifier]: true }),
					null,
					`${modifier} ${key}`
				);
			}
		}
	}
	assert.deepEqual(
		landmarkKeyAction('Enter', 'placed', { shiftKey: true }),
		{ type: 'confirm' },
		'Shift is not a browser shortcut'
	);
});

test('the label names the piece, its plots and, on the grid, its keys (#111)', () => {
	assert.equal(
		landmarkLabel('Lighthouse', 4, 'tray'),
		'Lighthouse, 4 plots, to be placed'
	);
	assert.equal(
		landmarkLabel('Lighthouse', 4, 'placed'),
		'Lighthouse, 4 plots, not confirmed. Arrow keys move it, full stop or comma rotates it, Enter confirms it, Delete returns it'
	);
	assert.equal(
		landmarkLabel('Lighthouse', 4, 'locked'),
		'Lighthouse, locked in place'
	);
});

test('the control titles name their keys as they always have (#84, #111)', () => {
	assert.deepEqual(
		{ ...LANDMARK_TITLES },
		{
			rotate: 'Rotate (. or ,)',
			confirm: 'Confirm (Enter)',
			return: 'Return (Delete)',
		}
	);
});

test('How to play lists every key the piece answers to, but Space, and every key its titles name (#111)', () => {
	const listed = placingKeys();
	const answered = KEYS.filter(
		(key) =>
			key !== ' ' &&
			(landmarkKeyAction(key, 'tray') || landmarkKeyAction(key, 'placed'))
	);
	assert.deepEqual(
		new Set(answered),
		new Set([
			...Object.keys(MOVE_KEYS),
			...ROTATE_KEYS,
			CONFIRM_KEY,
			...RETURN_KEYS,
		])
	);
	for (const key of answered) {
		assert.ok(listed.has(keyName(key)), key);
	}
	for (const title of Object.values(LANDMARK_TITLES)) {
		const keys = title.match(/\((.*)\)$/)?.[1].split(' or ') ?? [];
		assert.ok(keys.length > 0, title);
		for (const key of keys) {
			assert.ok(listed.has(key), `${title}: ${key}`);
		}
	}
});

test('the piece rotates with the keys that turn an explore, and the arrows show as symbols (#83, #111)', () => {
	assert.deepEqual(TURN_KEYS, { back: ',', forward: '.' });
	assert.deepEqual(ROTATE_KEYS, [TURN_KEYS.forward, TURN_KEYS.back]);
	assert.deepEqual(Object.keys(MOVE_KEYS).map(keyName), ['←', '↑', '→', '↓']);
	assert.equal(keyName('Delete'), 'Delete');
});

test('no parent reaches into the piece, and no title types its keys (#111)', () => {
	for (const file of ['CapitalGrid', 'PlacementTray']) {
		const source = readFileSync(
			`src/lib/components/player/${file}.svelte`,
			'utf8'
		);
		assert.doesNotMatch(source, /querySelector\([^)]*(tabindex|svg)/, file);
		assert.doesNotMatch(source, /data-item|setDragImage|setData/, file);
		assert.doesNotMatch(source, /GRAB_TYPE|TRAY_PLOT_SIZE/, file);
		// Its pictures and plots stay draggable="false"; the piece decides its own.
		assert.doesNotMatch(
			source,
			/\bondragstart=|draggable=("true"|\{)/,
			file
		);
	}
	const piece = readFileSync(
		'src/lib/components/player/LandmarkPiece.svelte',
		'utf8'
	);
	assert.doesNotMatch(piece, /title="/);
	assert.doesNotMatch(piece, /ArrowUp|'Backspace'|'Delete'/);
	const turn = readFileSync(
		'src/lib/components/prompts/TurnControl.svelte',
		'utf8'
	);
	assert.doesNotMatch(turn, /\([.,]\)|[.,] and [.,] turn/);
	assert.match(turn, /TURN_KEYS\.back/);
});
