// TilePicker draws the Terrain tab's pickable tiles too (#93): only the pickable tiles are buttons, at the size asked
// for, with their own hooks, and the Terrain tab has no tile button of its own.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { render } from 'svelte/server';
import TilePicker from '../src/lib/components/prompts/TilePicker.svelte';
import { tilePreview, tileWords } from '../src/lib/area/explore.js';

/**
 * The picker's tiles, as its callers build them.
 * @param {number[]} ids
 */
const tilesOf = (ids) =>
	ids.map((id) => ({ id, label: tileWords(id), ...tilePreview(id, 0) }));

/**
 * A TilePicker drawn on the server, as HTML.
 * @param {Record<string, any>} props
 * @returns {string}
 */
function draw(props) {
	return render(TilePicker, {
		props: { tiles: tilesOf([3, 17, 40]), ...props },
	}).body;
}

/**
 * The opening tags of the buttons, in order.
 * @param {string} html
 * @returns {string[]}
 */
const buttons = (html) => [...html.matchAll(/<button\s[^>]*>/g)].map(String);

/**
 * The width each territory tile is drawn at, in order: twice its size.
 * @param {string} html
 * @returns {string[]}
 */
const tileSizes = (html) =>
	[...html.matchAll(/<svg\s[^>]*class="rg-territory-tile[^>]*>/g)].map(
		(m) => /\swidth="(\d+)"/.exec(m[0])?.[1] ?? ''
	);

test('every tile can be pressed by default, hooked as tile-{id}', () => {
	const html = draw({});
	const tags = buttons(html);
	assert.equal(tags.length, 3);
	assert.deepEqual(
		tags.map((tag) => /data-id="([^"]*)"/.exec(tag)?.[1]),
		['tile-3', 'tile-17', 'tile-40']
	);
});

test('only the pickable tiles are buttons; the others are drawn plain', () => {
	const html = draw({ pickable: [17], selected: 17 });
	const tags = buttons(html);
	assert.equal(tags.length, 1);
	assert.match(tags[0], /data-id="tile-17"/);
	assert.match(tags[0], /aria-pressed="true"/);
	assert.equal(tileSizes(html).length, 3, 'all three tiles are drawn');

	assert.equal(buttons(draw({ pickable: [] })).length, 0);
});

test('a picker hooks its buttons with its own prefix', () => {
	const tags = buttons(
		draw({
			pickable: [3, 40],
			dataIdPrefix: 'terrain-tile',
			disabled: [40],
		})
	);
	assert.deepEqual(
		tags.map((tag) => /data-id="([^"]*)"/.exec(tag)?.[1]),
		['terrain-tile-3', 'terrain-tile-40']
	);
	assert.match(tags[1], /\sdisabled/);
});

test('a small picker draws 34px tiles in its frames, a large one the tiles at their own 36px', () => {
	assert.deepEqual(tileSizes(draw({})), ['68', '68', '68']);
	const large = draw({ size: 'large', pickable: [17] });
	assert.deepEqual(tileSizes(large), ['72', '72', '72']);
	assert.match(
		large,
		/class="rg-tile-picker\b[^"]*\brg-tile-picker--large\b/
	);
});

test('the Terrain tab draws its territory tiles with TilePicker, not a button of its own', () => {
	const source = readFileSync(
		new URL('../src/screens/game/PlayerTabs.svelte', import.meta.url),
		'utf8'
	);
	assert.match(source, /<TilePicker\b/);
	assert.doesNotMatch(source, /aria-pressed/);
	assert.doesNotMatch(source, /rg-player-tabs--pick\b/);
	assert.match(source, /dataIdPrefix="terrain-tile"/);
});
