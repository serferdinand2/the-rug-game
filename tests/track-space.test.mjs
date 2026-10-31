// Every real track space draws in TrackSpace, and science's progress spaces show each track they may move on (#85).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { render } from 'svelte/server';
import TrackSpace from '../src/lib/components/board/TrackSpace.svelte';
import { TRACK_IDS } from '../src/lib/engine/data/ids.js';
import { TRACKS } from '../src/lib/engine/data/tracks.js';
import { bonusGlyphs, spaceGlyphs } from '../src/lib/glyphs.js';

/**
 * A real track space drawn on the server, as HTML, with the glyphs the board gives it.
 * @param {import('../src/lib/ui.js').TrackId} track
 * @param {number} space
 * @returns {string}
 */
function draw(track, space) {
	const { name, benefit, bonus } = TRACKS[track][space];
	return render(TrackSpace, {
		props: {
			track,
			space,
			name,
			benefit: spaceGlyphs(benefit),
			bonus: bonusGlyphs(bonus),
		},
	}).body;
}

/**
 * The tracks in each of a space's progress columns, in order.
 * @param {string} html
 * @returns {string[][]}
 */
function progressColumns(html) {
	return [
		...html.matchAll(
			/rg-track-space--progress-tracks[^>]*>(.*?)<\/span>/gs
		),
	].map((column) =>
		[...column[1].matchAll(/\/art\/track\/([a-z]+)\.svg/g)].map(
			(image) => image[1]
		)
	);
}

test('every space of the four tracks draws (#85)', () => {
	for (const track of TRACK_IDS) {
		for (const { space } of TRACKS[track].slice(1)) {
			assert.doesNotThrow(() => draw(track, space), `${track} ${space}`);
		}
	}
});

test('Physics, Neuroscience and Quantum Physics show a column of each track they may move on, Quantum Physics twice (#85)', () => {
	const all = ['exploration', 'technology', 'military'];
	assert.deepEqual(progressColumns(draw('science', 9)), [all]);
	assert.deepEqual(progressColumns(draw('science', 10)), [
		['technology', 'military'],
	]);
	assert.deepEqual(progressColumns(draw('science', 11)), [all, all]);
});

test('the issue 136 paired benefits show a plus only between their two effects', () => {
	for (const [track, space] of [
		['technology', 8],
		['science', 8],
		['technology', 11],
	]) {
		const html = draw(track, space);
		assert.match(
			html,
			/rg-space-glyphs--joint[^>]*>\+<\/span>/,
			`${track} ${space}`
		);
	}
});

test('Science 7 and 11 mark their names for the two-line treatment (#136)', () => {
	for (const space of [7, 11]) {
		const html = draw('science', space);
		assert.match(html, /rg-track-space--name-lines/);
		assert.match(html, /rg-track-space--name-line/);
	}
});

test('Nanotechnology and Drone Assassins use the requested two-line names', () => {
	const nano = draw('technology', 11);
	assert.match(nano, /rg-track-space--name-line">Nano-<\/span>/);
	assert.match(nano, /rg-track-space--name-line">technology<\/span>/);
	const drones = draw('military', 11);
	assert.match(drones, /rg-track-space--name-line">Drone<\/span>/);
	assert.match(drones, /rg-track-space--name-line">Assassins<\/span>/);
});

test('Military 12, Science 12 and Tech 12 use their requested symbol sizes (#136)', () => {
	const military = draw('military', 12);
	assert.match(military, /rg-track-space--large-civ/);
	const science = draw('science', 12);
	assert.match(science, /rg-track-space--alien-biology/);
	const technology = draw('technology', 12);
	assert.match(technology, /rg-track-space--ai-singularity/);
	const css = readFileSync(
		new URL(
			'../src/lib/components/board/TrackSpace.svelte',
			import.meta.url
		),
		'utf8'
	);
	assert.match(css, /alien-rolls img[\s\S]*?width:\s*24px/);
	assert.match(
		css,
		/ai-singularity \.rg-track-space--ai-resources[\s\S]*?width:\s*18px/
	);
	assert.match(
		css,
		/repeat-large[\s\S]*?font-size:\s*calc\(var\(--font-size-3xl\) \* 1\.3\)/
	);
	assert.match(css, /grid-template-columns:\s*32px 12px 34px/);
	assert.match(css, /grid-template-rows:\s*36px 14px/);
	assert.match(css, /large-civ[\s\S]*?width:\s*34px;[\s\S]*?height:\s*34px/);
	assert.match(
		css,
		/\.rg-track-space\.rg-track-space--last \.rg-track-space--benefit[\s\S]*?translate:\s*calc\(var\(--track-tip\) \/ 2 - 6px\) 0/
	);
	assert.match(
		css,
		/rg-track-space--last::after[\s\S]*?z-index:\s*5;[\s\S]*?top:\s*0;[\s\S]*?bottom:\s*0;[\s\S]*?width:\s*3px/
	);
});
