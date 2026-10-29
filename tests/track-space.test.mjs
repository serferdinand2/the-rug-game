// Every real track space draws in TrackSpace, and science's progress spaces show each track they may move on (#85).
import { test } from 'vitest';
import assert from 'node:assert/strict';
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
