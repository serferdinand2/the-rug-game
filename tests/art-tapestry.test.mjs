// Tapestry cards (#9): one full 64×64 scene per card, no two alike.
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { DRAWINGS_DIR, listDrawingIds } from '../art/build.mjs';
import { ASSETS, EXPANSIONS } from '../src/lib/art/catalog.js';

/** The sets whose every card must be drawn. Each batch adds its code once the owner has it to review. */
const FINISHED = ['base', 'pp', 'aa', 'ff'];

const drawn = (await listDrawingIds()).filter((id) =>
	id.startsWith('tapestry/')
);

/** Each drawn tapestry picture's canvas, by id. */
const canvases = new Map();
for (const id of drawn) {
	const drawing = await import(
		pathToFileURL(join(DRAWINGS_DIR, `${id}.js`)).href
	);
	canvases.set(id, drawing.draw());
}

test('every tapestry picture paints all 4,096 pixels', () => {
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

test('no two tapestry pictures are the same', () => {
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

test('every card of each finished set is drawn', () => {
	for (const code of FINISHED) {
		const missing = ASSETS.filter(
			(asset) => asset.group === 'tapestry' && asset.expansion === code
		)
			.map((asset) => asset.id)
			.filter((id) => !drawn.includes(id));
		assert.deepEqual(missing, [], `${code}: cards not drawn yet`);
	}
});
