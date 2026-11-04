// The card fans beside the landing page's and the lobby's panels (#174): real art, picked with the injected random.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { artFans } from '../src/lib/art-fans.js';
import { ASSETS } from '../src/lib/art/catalog.js';

test('the left fan shows three civilizations, the right a landmark and two tapestry cards (#174)', () => {
	const fans = artFans(() => 0);
	assert.deepEqual(
		fans.left.map((card) => card.art.split('/')[0]),
		['civ', 'civ', 'civ']
	);
	assert.deepEqual(
		fans.right.map((card) => card.art.split('/')[0]),
		['landmark', 'tapestry', 'tapestry']
	);
	for (const card of [...fans.left, ...fans.right]) {
		assert.equal(
			ASSETS.find((asset) => asset.id === card.art)?.name,
			card.name
		);
	}
});

test('a fan never shows one picture twice, and follows the random it is given (#174)', () => {
	let n = 7;
	const fans = artFans((size) => (n = (n * 31 + 11) % 97) % size);
	const arts = [...fans.left, ...fans.right].map((card) => card.art);
	assert.equal(new Set(arts).size, arts.length);
	const again = (() => {
		let m = 7;
		return artFans((size) => (m = (m * 31 + 11) % 97) % size);
	})();
	assert.deepEqual(again, fans);
});
