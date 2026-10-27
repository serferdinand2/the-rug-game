// Inspiration tiles (#11): one 192×32 strip per income row, six framed spaces, the improved ones in gold.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { DRAWINGS_DIR, listDrawingIds } from '../art/build.mjs';
import { get } from '../art/painter.js';
import {
	FRAME,
	GROUND,
	IMPROVED,
	INSIDE,
	SPACE,
	SPACES,
	drawInspirationTile,
} from '../art/parts/inspiration-tile.js';
import { ASSETS, EXPANSIONS } from '../src/lib/art/catalog.js';

/** The sets whose every inspiration tile must be drawn. */
const FINISHED = ['aa'];

/** How much of each space's inside its innovation must cover: one big subject. */
const MIN_COVER = 0.2;

const drawn = (await listDrawingIds()).filter((id) =>
	id.startsWith('inspiration-tile/')
);

/**
 * Loads a drawing module by its asset id.
 * @param {string} id
 */
function load(id) {
	return import(pathToFileURL(join(DRAWINGS_DIR, `${id}.js`)).href);
}

/** Each drawn tile's canvas, by id. */
const canvases = new Map();
for (const id of drawn) {
	canvases.set(id, (await load(id)).draw());
}

/**
 * The pixels of one space, frame included, row by row.
 * @param {import('../art/painter.js').Canvas} canvas
 * @param {number} space - Numbered from 1
 * @returns {(string | null | undefined)[]}
 */
function spacePixels(canvas, space) {
	const left = (space - 1) * SPACE;
	const pixels = [];
	for (let y = 0; y < SPACE; y++) {
		for (let x = 0; x < SPACE; x++) {
			pixels.push(get(canvas, left + x, y));
		}
	}
	return pixels;
}

test('every inspiration tile is six 32×32 spaces and paints all 6,144 pixels', () => {
	for (const [id, canvas] of canvases) {
		assert.equal(
			`${canvas.w}×${canvas.h}`,
			`${SPACE * SPACES}×${SPACE}`,
			id
		);
		const empty = canvas.p.findIndex((colour) => !colour);
		assert.equal(
			empty,
			-1,
			`${id}: pixel (${empty % canvas.w}, ${Math.floor(empty / canvas.w)}) is empty`
		);
	}
});

test('the improved spaces have a gold frame and the others an ink one', () => {
	for (const [id, canvas] of canvases) {
		for (let space = 1; space <= SPACES; space++) {
			const frame = IMPROVED.includes(space)
				? FRAME.improved
				: FRAME.plain;
			const pixels = spacePixels(canvas, space);
			for (let i = 0; i < SPACE; i++) {
				for (const at of [
					i,
					(SPACE - 1) * SPACE + i,
					i * SPACE,
					i * SPACE + SPACE - 1,
				]) {
					assert.equal(pixels[at], frame, `${id}: space ${space}`);
				}
			}
		}
	}
});

test('every space shows its innovation as one big subject', () => {
	const ground = new Set([...GROUND.plain, ...GROUND.improved]);
	for (const [id, canvas] of canvases) {
		for (let space = 1; space <= SPACES; space++) {
			const left = (space - 1) * SPACE + 1;
			let cover = 0;
			for (let y = 1; y <= INSIDE; y++) {
				for (let x = left; x < left + INSIDE; x++) {
					if (
						!ground.has(/** @type {string} */ (get(canvas, x, y)))
					) {
						cover++;
					}
				}
			}
			assert.ok(
				cover >= MIN_COVER * INSIDE * INSIDE,
				`${id}: space ${space} covers only ${cover} of ${INSIDE * INSIDE} pixels`
			);
		}
	}
});

test('no two spaces are the same, on one tile or across tiles', () => {
	/** @type {Map<string, string>} */
	const seen = new Map();
	for (const [id, canvas] of canvases) {
		for (let space = 1; space <= SPACES; space++) {
			const key = spacePixels(canvas, space).join();
			const name = `${id} space ${space}`;
			assert.ok(
				!seen.has(key),
				`${name} is the same as ${seen.get(key)}`
			);
			seen.set(key, name);
		}
	}
});

test('a tile has exactly six spaces', () => {
	const blank = () => {};
	assert.throws(
		() => drawInspirationTile([blank, blank, blank, blank, blank]),
		/6 spaces, not 5/
	);
});

test('every finished set is a known expansion', () => {
	const codes = EXPANSIONS.map((expansion) => expansion.code);
	for (const code of FINISHED) {
		assert.ok(codes.includes(code), `"${code}" is not an expansion code`);
	}
});

test('every inspiration tile of each finished set is drawn', () => {
	for (const code of FINISHED) {
		const missing = ASSETS.filter(
			(asset) =>
				asset.group === 'inspiration-tile' && asset.expansion === code
		)
			.map((asset) => asset.id)
			.filter((id) => !drawn.includes(id));
		assert.deepEqual(
			missing,
			[],
			`${code}: inspiration tiles not drawn yet`
		);
	}
});
