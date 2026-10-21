// Landmarks (#7): each one has a 64×64 card picture and a board piece that covers its footprint.
import test from 'node:test';
import assert from 'node:assert/strict';
import { listDrawingIds } from '../art/build.mjs';

const drawings = new Set(await listDrawingIds());

/**
 * Lists the pictures and board pieces still missing for some landmarks.
 * @param {string[]} slugs
 */
function missing(slugs) {
	return slugs.flatMap((slug) =>
		[`landmark/${slug}`, `landmark-marker/${slug}`].filter(
			(id) => !drawings.has(id)
		)
	);
}

test('the sample landmarks have a picture and a board piece', () => {
	assert.deepEqual(missing(['forge', 'train-station', 'launch-pad']), []);
});
