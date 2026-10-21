// Landmarks (#7): each one is a single picture drawn in its footprint's shape, used on its card and on the board.
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { DRAWINGS_DIR, listDrawingIds } from '../art/build.mjs';
import { FOOTPRINTS, footprintMismatches } from '../art/footprints.js';

const drawings = await listDrawingIds();
const landmarks = drawings.filter((id) => id.startsWith('landmark/'));

/**
 * Lists the landmark pictures still missing.
 * @param {string[]} slugs
 */
function missing(slugs) {
	return slugs
		.map((slug) => `landmark/${slug}`)
		.filter((id) => !drawings.includes(id));
}

test('the sample landmarks are drawn', () => {
	assert.deepEqual(missing(['forge', 'train-station', 'launch-pad']), []);
});

test('every drawn landmark covers exactly its footprint', async () => {
	assert.ok(landmarks.length > 0);
	for (const id of landmarks) {
		const drawing = await import(
			pathToFileURL(join(DRAWINGS_DIR, `${id}.js`)).href
		);
		const slug = id.split('/')[1];
		assert.deepEqual(
			footprintMismatches(drawing.draw(), FOOTPRINTS[slug]),
			[],
			id
		);
	}
});

test('there are no separate board pieces any more', () => {
	assert.deepEqual(
		drawings.filter((id) => id.startsWith('landmark-marker/')),
		[]
	);
});
