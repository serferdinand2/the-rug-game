// Tests for the map's 2.5D terrain painter (#134): regions across hexes, stability, the overlays, the new desert and sea, and speed.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createCanvas, mix } from '../src/lib/art/paint/painter.js';
import { PALETTE } from '../src/lib/art/paint/palette.js';
import {
	HEX_W,
	HEX_H,
	inHex,
	drawCloud,
	drawVolcano,
	volcanoSpot,
} from '../src/lib/art/paint/hex.js';
import { paintDunes } from '../src/lib/art/paint/dunes.js';
import { paintSea } from '../src/lib/art/paint/sea.js';
import {
	hexOrigin,
	mapRegions,
	paintMap,
	paintTerritory,
} from '../src/lib/art/paint/map.js';
import { CLOUD_SPOT, volcanoCorner } from '../src/lib/art/hex-overlays.js';
import { TERRITORY_TILES } from '../src/lib/engine/data/territory-tiles.js';
import { MAPS } from '../src/lib/engine/data/maps.js';
import { turned } from '../src/lib/engine/terrain.js';

const COLOURS = new Set(Object.values(PALETTE));

/** Ink's opacity in #82's shadows (mountain 0.3, forest 0.25) and in the map's faint rim (0.6). */
const SHADOWS = [0.25, 0.3];
const RIM = 0.6;

/** The palette, and each colour darkened by a shadow, by the rim, or by a shadow over the rim. */
const BLENDED = new Set(
	[...COLOURS].flatMap((c) => {
		const rim = mix(c, PALETTE.ink, RIM);
		return [
			c,
			rim,
			...SHADOWS.flatMap((a) => [
				mix(c, PALETTE.ink, a),
				mix(rim, PALETTE.ink, a),
			]),
		];
	})
);
const TERRAINS = ['sea', 'desert', 'forest', 'grassland', 'mountain'];

/** @param {number} id */
const tile = (id) => {
	const found = TERRITORY_TILES.find((t) => t.id === id);
	assert.ok(found);
	return found;
};

/** A placed tile, turned. @param {string} key @param {number} id @param {number} [orient] */
const placed = (key, id, orient = 0) => ({
	key,
	corners: turned(tile(id).corners, orient),
	island: tile(id).island,
	clouds: tile(id).clouds,
	volcano: tile(id).volcano,
});

/** A hex of one terrain all round. @param {string} key @param {string} terrain */
const plain = (key, terrain) => ({
	key,
	corners: Array(6).fill(terrain),
	island: [],
	clouds: false,
	volcano: false,
});

/** A whole hex's pixels from a painted map, at its place. */
function hexPixels(painted, key) {
	const [ox, oy] = hexOrigin(key);
	const out = [];
	for (let y = 0; y < HEX_H; y++) {
		for (let x = 0; x < HEX_W; x++) {
			if (inHex(x, y)) {
				const px = ox + x - painted.left;
				const py = oy + y - painted.top;
				out.push(painted.canvas.p[py * painted.canvas.w + px]);
			}
		}
	}
	return out;
}

test('a territory is painted the same every time, inside its hex, in palette colours or their ink shadows', () => {
	const a = paintTerritory(placed('0_0', 42));
	const b = paintTerritory(placed('0_0', 42));
	assert.equal(a.w, HEX_W);
	assert.equal(a.h, HEX_H);
	assert.deepEqual(a.p, b.p);
	for (let y = 0; y < HEX_H; y++) {
		for (let x = 0; x < HEX_W; x++) {
			const colour = a.p[y * HEX_W + x];
			if (inHex(x, y)) {
				assert.ok(
					BLENDED.has(/** @type {string} */ (colour)),
					`${colour} at ${x},${y}`
				);
			} else {
				assert.equal(colour, null);
			}
		}
	}
	assert.ok(!a.alpha || a.alpha.every((v, i) => v === 1 || a.p[i] === null));
});

test('same-terrain wedges in a tile are one region', () => {
	// Tile 42: sea, then three forest corners, then two mountain corners.
	const regions = mapRegions([placed('0_0', 42)]);
	assert.deepEqual(regions.map((r) => r.terrain).sort(), [
		'forest',
		'mountain',
		'sea',
	]);
});

test('a terrain that runs across two hexes is one region; fog joins nothing', () => {
	const regions = mapRegions([
		plain('0_0', 'mountain'),
		plain('0_1', 'mountain'),
		{ key: '1_0' },
	]);
	assert.equal(regions.length, 1);
	assert.deepEqual([...regions[0].hexes].sort(), ['0_0', '0_1']);
});

test('hexes that meet on different terrains stay apart', () => {
	const regions = mapRegions([
		plain('0_0', 'mountain'),
		plain('0_1', 'forest'),
	]);
	assert.equal(regions.length, 2);
});

test('placing a tile leaves the regions it does not touch as they were', () => {
	const before = paintMap([placed('0_0', 42), placed('3_0', 2)]);
	const after = paintMap([
		placed('0_0', 42),
		placed('3_0', 2),
		placed('3_1', 8),
	]);
	assert.deepEqual(hexPixels(after, '0_0'), hexPixels(before, '0_0'));
});

test('the cloud and the volcano sit where hex-overlays.js puts them', () => {
	const cloudy = TERRITORY_TILES.find((t) => t.clouds && !t.volcano);
	assert.ok(cloudy);
	const withCloud = paintTerritory(placed('0_0', cloudy.id));
	const cloud = drawCloud();
	for (let y = 0; y < cloud.h; y++) {
		for (let x = 0; x < cloud.w; x++) {
			const colour = cloud.p[y * cloud.w + x];
			if (colour) {
				const px = CLOUD_SPOT[0] + x;
				const py = CLOUD_SPOT[1] + y;
				assert.equal(withCloud.p[py * HEX_W + px], colour);
			}
		}
	}
	const hot = placed('0_0', 47);
	const withVolcano = paintTerritory(hot);
	const volcano = drawVolcano();
	const [vx, vy] = volcanoSpot(volcanoCorner(hot.corners));
	for (let y = 0; y < volcano.h; y++) {
		for (let x = 0; x < volcano.w; x++) {
			const colour = volcano.p[y * volcano.w + x];
			if (colour) {
				assert.equal(withVolcano.p[(vy + y) * HEX_W + vx + x], colour);
			}
		}
	}
});

test("every terrain's main colour differs from every other's", () => {
	/** @param {(string | null)[]} pixels */
	const main = (pixels) => {
		/** @type {Map<string, number>} */
		const counts = new Map();
		for (const c of pixels) {
			if (c) {
				counts.set(c, (counts.get(c) ?? 0) + 1);
			}
		}
		return [...counts].sort((a, b) => b[1] - a[1])[0][0];
	};
	const colours = TERRAINS.map((t) =>
		main(paintTerritory(plain('0_0', t)).p)
	);
	assert.equal(new Set(colours).size, TERRAINS.length, colours.join(' '));
});

test('dunes and the sea keep to their region', () => {
	const w = 40;
	const h = 30;
	const mask = new Uint8Array(w * h);
	for (let y = 5; y < 25; y++) {
		for (let x = 5; x < 35; x++) {
			mask[y * w + x] = 1;
		}
	}
	const sand = createCanvas(w, h);
	paintDunes(sand, mask, 3);
	const sea = createCanvas(w, h);
	paintSea(sea, mask, new Uint8Array(w * h), 3);
	for (let i = 0; i < w * h; i++) {
		if (!mask[i]) {
			assert.equal(sand.p[i], null);
			assert.equal(sea.p[i], null);
		} else {
			assert.ok(COLOURS.has(/** @type {string} */ (sea.p[i])));
		}
	}
	const again = createCanvas(w, h);
	paintDunes(again, mask, 3);
	assert.deepEqual(again.p, sand.p);
});

test('a full 61-hex board paints within its budget', () => {
	const map = MAPS.large;
	const hexes = map.hexes.map((key, i) => {
		const t = TERRITORY_TILES[i % TERRITORY_TILES.length];
		return placed(key, t.id, i % 6);
	});
	const start = performance.now();
	const painted = paintMap(hexes);
	const took = performance.now() - start;
	assert.ok(painted.canvas.w > 0);
	assert.ok(took < 3000, `took ${Math.round(took)} ms`);
});
