// Masterpieces (#11): one full 64×64 picture per masterpiece card, no two alike.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { DRAWINGS_DIR, listDrawingIds } from '../art/build.mjs';
import { ASSETS, EXPANSIONS } from '../src/lib/art/catalog.js';

/** The sets whose every masterpiece must be drawn. */
const FINISHED = ['aa'];

const drawn = (await listDrawingIds()).filter((id) =>
	id.startsWith('masterpiece/')
);

/**
 * Loads a drawing module by its asset id.
 * @param {string} id
 */
function load(id) {
	return import(pathToFileURL(join(DRAWINGS_DIR, `${id}.js`)).href);
}

/** Each drawn masterpiece's canvas, by id. */
const canvases = new Map();
for (const id of drawn) {
	canvases.set(id, (await load(id)).draw());
}

test('every masterpiece paints all 4,096 pixels', () => {
	for (const [id, canvas] of canvases) {
		assert.equal(`${canvas.w}×${canvas.h}`, '64×64', id);
		const empty = canvas.p.findIndex((colour) => !colour);
		assert.equal(
			empty,
			-1,
			`${id}: pixel (${empty % 64}, ${Math.floor(empty / 64)}) is empty`
		);
	}
});

test('no two masterpieces are the same', () => {
	/** @type {Map<string, string>} */
	const seen = new Map();
	for (const [id, canvas] of canvases) {
		const key = canvas.p.join();
		assert.ok(
			!seen.has(key),
			`${id} is the same picture as ${seen.get(key)}`
		);
		seen.set(key, id);
	}
});

test('every finished set is a known expansion', () => {
	const codes = EXPANSIONS.map((expansion) => expansion.code);
	for (const code of FINISHED) {
		assert.ok(codes.includes(code), `"${code}" is not an expansion code`);
	}
});

test('every masterpiece of each finished set is drawn', () => {
	for (const code of FINISHED) {
		const missing = ASSETS.filter(
			(asset) => asset.group === 'masterpiece' && asset.expansion === code
		)
			.map((asset) => asset.id)
			.filter((id) => !drawn.includes(id));
		assert.deepEqual(missing, [], `${code}: masterpieces not drawn yet`);
	}
});
