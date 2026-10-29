// The header menu's entries for each screen (#99): one module builds them, and PageHeader handles sound and leaving.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { menuItems } from '../src/lib/menu.js';

const SRC = fileURLToPath(new URL('../src/', import.meta.url));

/** @param {{ label: string }[]} items */
const labels = (items) => items.map((item) => item.label);

test('the landing page and the lobby offer How to play, the card gallery and About', () => {
	assert.deepEqual(labels(menuItems('start')), [
		'How to play',
		'Card gallery',
		'About this project',
	]);
});

test('the pass screen and the results offer How to play, the card gallery and Leave table', () => {
	for (const screen of /** @type {const} */ (['passing', 'results'])) {
		assert.deepEqual(labels(menuItems(screen)), [
			'How to play',
			'Card gallery',
			'Leave table',
		]);
	}
});

test('the game adds the keyboard shortcuts, and Table settings for the host only', () => {
	assert.deepEqual(labels(menuItems('game', { hosting: true })), [
		'How to play',
		'Card gallery',
		'Keyboard shortcuts',
		'Table settings',
		'Leave table',
	]);
	assert.deepEqual(labels(menuItems('game', { hosting: false })), [
		'How to play',
		'Card gallery',
		'Keyboard shortcuts',
		'Leave table',
	]);
	assert.deepEqual(
		menuItems('game', { hosting: true }).map((item) => item.id),
		['help', 'gallery', 'keys', 'settings', 'leave']
	);
});

test('the card gallery opens in a new tab', () => {
	for (const screen of /** @type {const} */ ([
		'start',
		'passing',
		'results',
		'game',
	])) {
		const gallery = menuItems(screen).find((item) => item.id === 'gallery');
		assert.deepEqual(gallery, {
			id: 'gallery',
			label: 'Card gallery',
			href: '/cards.html',
			target: '_blank',
		});
	}
});

test('no screen lists menu entries or wires sound and leaving itself', () => {
	const files = readdirSync(SRC, { recursive: true })
		.map(String)
		.filter(
			(file) =>
				/\.(svelte|js)$/.test(file) &&
				!file.startsWith('library/') &&
				file !== 'lib/menu.js' &&
				file !== 'lib/game.svelte.js'
		);
	assert.ok(files.length > 100, 'the source files are found');
	for (const file of files) {
		const source = readFileSync(`${SRC}${file}`, 'utf8');
		assert.doesNotMatch(source, /onPageHeaderSound/, `${file} wires sound`);
		if (file.startsWith('screens/') || file === 'App.svelte') {
			assert.doesNotMatch(
				source,
				/label: '(?:How to play|Leave table|Card gallery)'/,
				`${file} lists menu entries`
			);
		}
		if (file !== 'screens/PageHeader.svelte') {
			assert.doesNotMatch(source, /setSound\(/, `${file} sets sound`);
			assert.doesNotMatch(
				source,
				/event\.value === 'leave'/,
				`${file} handles Leave table`
			);
		}
	}
	const header = readFileSync(`${SRC}screens/PageHeader.svelte`, 'utf8');
	assert.doesNotMatch(header, /splice|findIndex/);
});
