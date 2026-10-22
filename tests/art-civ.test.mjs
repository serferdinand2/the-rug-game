// Civilization portraits (#8): one full 64×64 portrait per civilization, no two alike.
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { DRAWINGS_DIR, listDrawingIds } from '../art/build.mjs';
import { ASSETS, EXPANSIONS } from '../src/lib/art/catalog.js';

/** The sets whose every civilization must be drawn. Each set adds its code once it has been reviewed. */
const FINISHED = ['base'];

const drawn = (await listDrawingIds()).filter((id) => id.startsWith('civ/'));

/** Each drawn civilization portrait's canvas, by id. */
const canvases = new Map();
for (const id of drawn) {
	const drawing = await import(
		pathToFileURL(join(DRAWINGS_DIR, `${id}.js`)).href
	);
	canvases.set(id, drawing.draw());
}

test('every civilization portrait paints all 4,096 pixels', () => {
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

test('no two civilization portraits are the same', () => {
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

test('every civilization of each finished set is drawn', () => {
	for (const code of FINISHED) {
		const missing = ASSETS.filter(
			(asset) => asset.group === 'civ' && asset.expansion === code
		)
			.map((asset) => asset.id)
			.filter((id) => !drawn.includes(id));
		assert.deepEqual(missing, [], `${code}: civilizations not drawn yet`);
	}
});
