// A track space's glyphs draw in SpaceGlyphs, and TrackSpace keeps only its shell, name, landmark and number (#115).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { render } from 'svelte/server';
import SpaceGlyphs from '../src/lib/components/board/SpaceGlyphs.svelte';
import TrackSpace from '../src/lib/components/board/TrackSpace.svelte';
import { TRACK_IDS } from '../src/lib/engine/data/ids.js';
import { TRACKS } from '../src/lib/engine/data/tracks.js';
import { bonusGlyphs, spaceGlyphs } from '../src/lib/glyphs.js';

/**
 * Glyphs drawn on the server, as HTML.
 * @param {import('../src/lib/glyphs.js').Glyph[]} glyphs
 * @param {Record<string, unknown>} [props]
 * @returns {string}
 */
function draw(glyphs, props = {}) {
	return render(SpaceGlyphs, { props: { glyphs, ...props } }).body;
}

/**
 * How many times a piece of text appears in a string.
 * @param {string} html
 * @param {string} text
 */
function count(html, text) {
	return html.split(text).length - 1;
}

test('resources, buildings and tracks draw their art, with a count over one', () => {
	const html = draw([
		{ kind: 'resource', id: 'coin', count: 2 },
		{ kind: 'building', id: 'house', count: 1 },
		{ kind: 'track', id: 'science' },
	]);
	assert.match(
		html,
		/rg-space-glyphs--resource[^"]*"><img src="[^"]*resource-24\/coin\.svg"/
	);
	assert.match(
		html,
		/rg-space-glyphs--building[^"]*"><img src="[^"]*building\/house\.svg"/
	);
	assert.match(
		html,
		/class="rg-space-glyphs--track[^"]*" src="[^"]*track\/science\.svg"/
	);
	assert.equal(count(html, '×2'), 1);
	assert.doesNotMatch(html, /×1/);
});

test('tiles and inventions repeat their picture, other words count with ×N', () => {
	const tiles = draw([{ kind: 'word', text: 'Tile', count: 3 }]);
	assert.equal(count(tiles, 'symbol/territory-tile.svg'), 3);
	assert.doesNotMatch(tiles, /×3/);
	const tapestry = draw([{ kind: 'word', text: 'Tapestry', count: 2 }]);
	assert.equal(count(tapestry, 'rg-space-glyphs--card-icon'), 1);
	assert.match(tapestry, /×2/);
	const invent = draw([{ kind: 'word', text: 'Invent', count: 2 }]);
	assert.match(invent, /rg-space-glyphs--invent-stack/);
});

test('words without a symbol draw as words, and a crossed one carries the X', () => {
	const html = draw([
		{ kind: 'word', text: 'Both dice', count: 1 },
		{ kind: 'word', text: 'Science die', count: 1, cross: true },
	]);
	assert.match(
		html,
		/rg-space-glyphs--word[^"]*rg-space-glyphs--small-note[^"]*">Both dice</
	);
	assert.match(
		html,
		/rg-space-glyphs--symbol-group[^"]*rg-space-glyphs--crossed/
	);
});

test('the game symbols draw their own shapes', () => {
	const html = draw([
		{ kind: 'word', text: 'Advance', count: 2 },
		{ kind: 'word', text: 'Upgrade', count: 1 },
		{ kind: 'word', text: 'Circle benefit', count: 1 },
		{ kind: 'word', text: 'Score capital', count: 1 },
		{ kind: 'word', text: 'Restart', count: 1 },
		{ kind: 'word', text: 'Repeat', count: 1 },
		{ kind: 'word', text: 'May refresh', count: 1 },
		{ kind: 'word', text: 'Conquer', count: 1 },
		{ kind: 'vp', count: 5 },
		{ kind: 'vp', count: null },
		{ kind: 'per' },
		{ kind: 'plus' },
		{ kind: 'or' },
	]);
	for (const part of [
		'direction',
		'upgrade',
		'benefit-shape--circle',
		'capital-score',
		'restart-icon',
		'repeat',
		'refresh',
		'outpost-icon',
	]) {
		assert.match(html, new RegExp(`rg-space-glyphs--${part}\\b`), part);
	}
	assert.equal(count(html, 'class="rg-space-glyphs--vp'), 2);
	assert.match(html, />5<\/b>/);
	assert.equal(count(html, 'rg-space-glyphs--joint'), 3);
	assert.match(
		html,
		/rg-space-glyphs--joint[^"]*rg-space-glyphs--or[^"]*">\//
	);
});

test('the variants set their class on the root, which merges a given class', () => {
	assert.match(
		draw([], { variant: 'dense' }),
		/class="rg-space-glyphs [^"]*rg-space-glyphs--dense"/
	);
	assert.match(
		draw([], { variant: 'bonus', class: 'extra' }),
		/class="rg-space-glyphs extra [^"]*rg-space-glyphs--bonus"/
	);
	assert.doesNotMatch(draw([]), /rg-space-glyphs--(dense|bonus)/);
});

test('every real space draws its glyphs through SpaceGlyphs (#115)', () => {
	const glyphClass =
		/rg-track-space--(resource|building|track|word|vp|joint|direction|symbol-group|symbol-icon|count|crossed|upgrade|refresh|repeat|capital-score|benefit-shape)(?![\w-])/;
	for (const track of TRACK_IDS.filter((id) => id !== 'exploration')) {
		for (const { space, name, benefit, bonus } of TRACKS[track].slice(1)) {
			const html = render(TrackSpace, {
				props: {
					track,
					space,
					name,
					benefit: spaceGlyphs(benefit),
					bonus: bonusGlyphs(bonus),
				},
			}).body;
			assert.match(html, /rg-space-glyphs/, `${track} ${space}`);
			assert.doesNotMatch(html, glyphClass, `${track} ${space}`);
		}
	}
});

test('TrackSpace keeps no glyph snippet, and its shell and fill share one shape (#115)', () => {
	const source = readFileSync(
		new URL(
			'../src/lib/components/board/TrackSpace.svelte',
			import.meta.url
		),
		'utf8'
	);
	assert.doesNotMatch(source, /\{#snippet symbol/);
	assert.doesNotMatch(source, /iconForWord/);
	const style = source.match(/<style>([\s\S]*)<\/style>/)?.[1] ?? '';
	for (const part of ['shell', 'fill']) {
		const rules = [
			...style.matchAll(
				new RegExp(`\\.rg-track-space--${part} \\{([^}]*)\\}`, 'g')
			),
		].map((rule) => rule[1]);
		assert.ok(
			rules.some((rule) =>
				/clip-path: var\(--rg-track-space-shape\)/.test(rule)
			),
			part
		);
		assert.doesNotMatch(
			style,
			new RegExp(`--${part} \\{[^}]*polygon`),
			`${part} writes its own polygon`
		);
	}
});
