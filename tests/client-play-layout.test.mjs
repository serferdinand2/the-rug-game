// The play screen's frame (#105): Game and Results draw it through one PlayLayout and keep no copy of its grid.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * A file's source, from the project root.
 * @param {string} path
 * @returns {string}
 */
function source(path) {
	return readFileSync(
		fileURLToPath(new URL(`../${path}`, import.meta.url)),
		'utf8'
	);
}

for (const [screen, block] of [
	['src/screens/Game.svelte', 'rg-game'],
	['src/screens/Results.svelte', 'rg-results'],
]) {
	test(`${screen} draws its frame with one PlayLayout and keeps none of its grid`, () => {
		const text = source(screen);
		const style = text.slice(text.indexOf('<style>'));
		assert.equal(text.match(/<PlayLayout\b/g)?.length, 1);
		assert.doesNotMatch(text, new RegExp(`${block}--middle`));
		assert.doesNotMatch(style, /grid-template-rows: var\(--bar-height\)/);
		assert.doesNotMatch(style, /var\(--play-columns\)/);
		assert.doesNotMatch(style, /height: 100vh/);
	});
}

test('PlayLayout holds the frame: the bars, the 3/4 + 1/4 split and its regions', () => {
	const text = source('src/lib/components/ui/PlayLayout.svelte');
	assert.match(
		text,
		/grid-template-rows: var\(--bar-height\) minmax\(0, 1fr\)/
	);
	assert.match(text, /grid-template-columns: var\(--play-columns\)/);
	assert.match(text, /gap: var\(--play-gap\)/);
	assert.match(text, /background: var\(--texture\) var\(--surface\)/);
	for (const snippet of [
		'header',
		'shared',
		'player',
		'footer',
		'overlays',
	]) {
		assert.match(text, new RegExp(`@render ${snippet}\\b`));
	}
});

test('the results footer is a TurnBar in the complete tone, with its actions and no bar of its own (owner, 2026-10-30)', () => {
	const text = source('src/screens/Results.svelte');
	assert.equal(text.match(/<TurnBar\b/g)?.length, 1);
	assert.match(text, /tone="complete"/);
	assert.match(text, /label="Game complete"/);
	for (const action of [
		'Review game board',
		'Return to tables',
		'Deal again',
	]) {
		assert.match(text, new RegExp(action));
	}
	assert.doesNotMatch(
		text,
		/<footer\b|rg-results--footer|rg-results--actions/
	);
});

test('TurnBar has a complete tone, its label upright in Cinzel as the header names the finished game', () => {
	const text = source('src/lib/components/prompts/TurnBar.svelte');
	assert.match(text, /'income' \| 'complete'\} TurnBarTone/);
	assert.match(text, /\.rg-turn-bar--complete \.rg-turn-bar--label \{/);
	const library = source('src/library/sections/prompts/TurnBar.svelte');
	assert.match(library, /tone="complete"/);
});
