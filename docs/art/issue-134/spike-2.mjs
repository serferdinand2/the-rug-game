// A throwaway spike for #134's round 2 sketches: dunes, a 2.5D sea, and terrain joined across hexes. Not run by the tests or the build.
import { writeFileSync } from 'node:fs';
import {
	createCanvas,
	overlay,
	toSvg,
	mix,
} from '../../../tools/art/painter.js';
import { PALETTE as C } from '../../../tools/art/palette.js';
import {
	HEX_W,
	HEX_H,
	inHex,
	wedgeOf,
	islandPartOf,
	drawHexTerrain,
	drawTerritory,
	drawCloud,
	drawVolcano,
	volcanoSpot,
	HEX_SEED,
	CLOUD_SPOT,
} from '../../../tools/art/parts/territory.js';
import {
	drawNaturalGround,
	noise,
	hash,
	BAYER,
} from '../../../tools/art/parts/capital-relief/ground.js';
import { paintMountains } from '../../../tools/art/parts/capital-relief/mountain.js';
import { paintForest } from '../../../tools/art/parts/capital-relief/forest.js';
import { seededRandom } from '../../../tools/art/painter.js';
import { TERRITORY_TILES } from '../../../src/lib/engine/data/territory-tiles.js';
import { volcanoCorner } from '../../../src/lib/art/hex-overlays.js';

const OUT = process.argv[2] ?? new URL('./spike-2.html', import.meta.url);
const SIDES = [
	[1, 0],
	[-1, 0],
	[0, 1],
	[0, -1],
];
const LAND = new Set(['desert', 'forest', 'grassland', 'mountain']);
const dither = (x, y) => BAYER[(y % 4) * 4 + (x % 4)];

/** The mask shrunk by `by` pixels from every edge. */
function inset(c, m, by) {
	const out = new Uint8Array(m.length);
	for (let y = 0; y < c.h; y++) {
		for (let x = 0; x < c.w; x++) {
			let ok = m[y * c.w + x] === 1;
			for (let d = -by; ok && d <= by; d++) {
				for (const [nx, ny] of [
					[x + d, y],
					[x, y + d],
				]) {
					if (
						nx < 0 ||
						ny < 0 ||
						nx >= c.w ||
						ny >= c.h ||
						!m[ny * c.w + nx]
					) {
						ok = false;
					}
				}
			}
			out[y * c.w + x] = ok ? 1 : 0;
		}
	}
	return out;
}

/** #82's footprint for a free-form region: no plots, no corner joins. */
const footprintOf = (c, m) => ({
	rows: 0,
	cols: 0,
	w: c.w,
	h: c.h,
	mask: inset(c, m, 2),
	plots: m,
	reach: m,
	corners: [],
});

/** #82's natural ground over a region, a 32-px plot of it at a time. */
function groundOver(c, biome, m, seed) {
	const g = createCanvas(Math.ceil(c.w / 32) * 32, Math.ceil(c.h / 32) * 32);
	for (let y = 0; y < g.h; y += 32) {
		for (let x = 0; x < g.w; x += 32) {
			drawNaturalGround(g, {
				biome,
				variant: hash(x, y, seed) % 8,
				x,
				y,
			});
		}
	}
	for (let y = 0; y < c.h; y++) {
		for (let x = 0; x < c.w; x++) {
			if (m[y * c.w + x]) {
				c.p[y * c.w + x] = g.p[y * g.w + x];
			}
		}
	}
}

/** Rolling 2.5D dunes: a lit windward slope up to a crest, a shaded slip face, a soft shadow at the foot; and a few low rocks. */
function paintDunes(c, m, seed) {
	const rand = seededRandom(hash(seed, 91));
	const ok = inset(c, m, 1);
	const dunes = [];
	for (let gy = 4, row = 0; gy < c.h + 8; gy += 12, row++) {
		for (let gx = row % 2 ? 6 : 0; gx < c.w + 10; gx += 22) {
			const bx = gx + Math.floor((rand() - 0.5) * 6);
			const by = gy + Math.floor((rand() - 0.5) * 3);
			const hw = 9 + Math.floor(rand() * 6);
			dunes.push({
				bx,
				by,
				hw,
				ph: 4 + Math.floor(hw / 5),
				crest: 0.35 + rand() * 0.25,
			});
		}
	}
	dunes.sort((a, b) => a.by - b.by);
	const put = (x, y, col) => {
		if (x >= 0 && y >= 0 && x < c.w && y < c.h && ok[y * c.w + x]) {
			c.p[y * c.w + x] = col;
		}
	};
	for (const d of dunes) {
		if (!ok[d.by * c.w + d.bx]) {
			continue;
		}
		// A gentle windward slope up to the crest, then a steeper slip face down, both easing into the ground.
		const left = d.bx - d.hw;
		const right = d.bx + d.hw;
		const cx = left + Math.round(2 * d.hw * (0.55 + d.crest * 0.3));
		for (let x = left; x <= right; x++) {
			const h =
				x <= cx
					? d.ph * ((x - left) / (cx - left)) ** 1.4
					: d.ph *
						Math.cos(((Math.PI / 2) * (x - cx)) / (right - cx));
			const top = d.by - Math.round(h);
			for (let y = top; y <= d.by; y++) {
				const depth = (y - top + 1) / (d.by - top + 1);
				let col;
				if (y === top) {
					col = C.sandLight;
				} else if (x <= cx) {
					col = depth + dither(x, y) * 0.5 < 0.8 ? C.sandLight : null;
				} else {
					col =
						y - top === 1 && x - cx < 3
							? C.mesaSoilShade
							: depth + dither(x, y) * 0.5 < 0.95
								? C.sandShade
								: null;
				}
				if (col) {
					put(x, y, col);
				}
			}
		}
		// A soft shadow beyond the slip face.
		for (let x = cx + 1; x <= d.bx + d.hw + 2; x++) {
			const y = d.by + 1;
			if (dither(x, y) < 0.1 && ok[y * c.w + x]) {
				c.p[y * c.w + x] = C.sandShade;
			}
		}
	}
	// A few low rocks, lit from the upper left.
	for (let k = 0; k < (c.w * c.h) / 1400; k++) {
		const x = Math.floor(rand() * c.w);
		const y = Math.floor(rand() * c.h);
		if (!ok[y * c.w + x] || !ok[(y + 1) * c.w + x + 2]) {
			continue;
		}
		put(x, y, C.sandLight);
		put(x + 1, y, C.sandShade);
		put(x, y + 1, C.sandShade);
		put(x + 1, y + 1, C.mesaSoilShade);
	}
}

/** A 2.5D sea: long bands of light and depth, wave crests lit on top with a trough below, and pale shallows by the shore. */
function paintSea(c, m, terrains, seed) {
	const bands = noise(seed + 3, 9);
	const fine = noise(seed + 4, 3);
	const rand = seededRandom(hash(seed, 13));
	const shore = new Uint8Array(m.length).fill(99);
	for (let y = 0; y < c.h; y++) {
		for (let x = 0; x < c.w; x++) {
			if (!m[y * c.w + x]) {
				continue;
			}
			for (let r = 1; r <= 4 && shore[y * c.w + x] === 99; r++) {
				for (const [dx, dy] of SIDES) {
					const t = terrains[(y + dy * r) * c.w + x + dx * r];
					if (t && t !== 'sea' && t !== 'unexplored') {
						shore[y * c.w + x] = r;
					}
				}
			}
			// Bands stretched across, as the sea is seen from the front and above.
			const n =
				bands(x / 2.2, y) * 0.75 +
				fine(x / 2, y) * 0.25 +
				dither(x, y) * 0.06;
			let col = n > 0.66 ? C.daySea1 : n < 0.34 ? C.daySea3 : C.daySea2;
			if (
				shore[y * c.w + x] <= 3 &&
				dither(x, y) + 0.5 > shore[y * c.w + x] / 4
			) {
				col = shore[y * c.w + x] <= 1 ? C.dayWaveDeep : C.daySea1;
			}
			c.p[y * c.w + x] = col;
		}
	}
	const put = (x, y, col) => {
		if (
			x >= 0 &&
			y >= 0 &&
			x < c.w &&
			y < c.h &&
			m[y * c.w + x] &&
			shore[y * c.w + x] > 2
		) {
			c.p[y * c.w + x] = col;
		}
	};
	for (let gy = 2, row = 0; gy < c.h; gy += 5, row++) {
		for (let gx = row % 2 ? 4 : 0; gx < c.w; gx += 9) {
			if (rand() < 0.55) {
				continue;
			}
			const x = gx + Math.floor((rand() - 0.5) * 4);
			const y = gy + Math.floor((rand() - 0.5) * 2);
			const len = 2 + Math.floor(rand() * 3);
			for (let i = 0; i < len; i++) {
				put(
					x + i,
					y - (i === 0 || i === len - 1 ? 0 : 1),
					i === 1 ? C.dayWave : C.dayWaveDeep
				);
				put(x + i + 1, y + 1, C.daySea3);
			}
		}
	}
}

/** The fog, as today: each hex's own picture. */
function paintFog(c, m, hexOf) {
	const fog = drawHexTerrain('unexplored', HEX_SEED);
	for (let i = 0; i < m.length; i++) {
		if (m[i]) {
			const [ox, oy] = hexOf[i];
			const x = (i % c.w) - ox;
			const y = Math.floor(i / c.w) - oy;
			c.p[i] = fog.p[y * HEX_W + x];
		}
	}
}

/** Paints a land region's features over its ground. */
function features(c, terrain, m, seed) {
	if (terrain === 'mountain' || terrain === 'forest') {
		const relief = createCanvas(c.w, c.h);
		(terrain === 'mountain' ? paintMountains : paintForest)(
			relief,
			footprintOf(c, m),
			seed
		);
		overlay(c, relief);
	} else if (terrain === 'desert') {
		paintDunes(c, m, seed);
	}
}

/** The coast: beach on the land, surf on the sea. */
function coast(c, terrains) {
	const out = [];
	for (let y = 0; y < c.h; y++) {
		for (let x = 0; x < c.w; x++) {
			const here = terrains[y * c.w + x];
			if (!here || here === 'unexplored') {
				continue;
			}
			const sea = here === 'sea';
			const other = (dx, dy) => {
				const t =
					x + dx < 0 || x + dx >= c.w
						? null
						: terrains[(y + dy) * c.w + x + dx];
				return t && t !== 'unexplored' && (t === 'sea') !== sea;
			};
			if (SIDES.some(([dx, dy]) => other(dx, dy))) {
				out.push([
					x,
					y,
					sea
						? (x + 2 * y) % 7 === 0
							? C.dayWave
							: C.foam
						: C.sandLight,
				]);
			}
		}
	}
	for (const [x, y, col] of out) {
		c.p[y * c.w + x] = col;
	}
}

/** The connected pixels of one terrain, within `keep`. */
function components(c, terrains, keep) {
	const seen = new Uint8Array(terrains.length);
	const out = [];
	for (let i = 0; i < terrains.length; i++) {
		if (!terrains[i] || seen[i]) {
			continue;
		}
		const t = terrains[i];
		const m = new Uint8Array(terrains.length);
		const stack = [i];
		seen[i] = 1;
		while (stack.length) {
			const j = stack.pop();
			m[j] = 1;
			const x = j % c.w;
			const y = (j - x) / c.w;
			for (const [dx, dy] of SIDES) {
				const nx = x + dx;
				const ny = y + dy;
				const k = ny * c.w + nx;
				if (
					nx >= 0 &&
					ny >= 0 &&
					nx < c.w &&
					ny < c.h &&
					!seen[k] &&
					terrains[k] === t &&
					keep(j, k)
				) {
					seen[k] = 1;
					stack.push(k);
				}
			}
		}
		out.push({ terrain: t, m });
	}
	return out;
}

const tile = (id) => TERRITORY_TILES.find((t) => t.id === id);
const turnedCorners = (t, turn) => [
	...t.corners.slice(turn),
	...t.corners.slice(0, turn),
];

/**
 * A board of placed tiles. Each entry: [axial a, b, tile id or null for fog, turn].
 * mode: 'today' | 'tile' (B: joined inside a tile) | 'edges' (B plus join pieces where two hexes meet on the same terrain) | 'whole' (one picture across the map)
 */
function board(placed, mode) {
	const centres = placed.map(([a, b]) => [48 * (b - a), 28 * (a + b)]);
	const minX = Math.min(...centres.map(([x]) => x));
	const minY = Math.min(...centres.map(([, y]) => y));
	const W = Math.max(...centres.map(([x]) => x)) - minX + HEX_W + 8;
	const H = Math.max(...centres.map(([, y]) => y)) - minY + HEX_H + 8;
	const c = createCanvas(W, H);
	c.p.fill(C.night);
	const origin = centres.map(([x, y]) => [x - minX + 4, y - minY + 4]);
	if (mode === 'today') {
		placed.forEach(([, , id, turn], i) => {
			const pic = id
				? drawTerritory({
						corners: turnedCorners(tile(id), turn),
						island: tile(id).island,
						clouds: tile(id).clouds,
						volcano: tile(id).volcano,
						seed: id,
					})
				: drawHexTerrain('unexplored', HEX_SEED);
			lay(c, pic, origin[i]);
		});
		return c;
	}
	const terrains = new Array(W * H).fill(null);
	const hexIndex = new Int16Array(W * H).fill(-1);
	const hexOf = [];
	placed.forEach(([, , id, turn], i) => {
		const [ox, oy] = origin[i];
		const corners = id ? turnedCorners(tile(id), turn) : null;
		const island = id ? tile(id).island : [];
		for (let y = 0; y < HEX_H; y++) {
			for (let x = 0; x < HEX_W; x++) {
				if (!inHex(x, y)) {
					continue;
				}
				const k = (oy + y) * W + ox + x;
				const part = islandPartOf(x, y, island.length);
				terrains[k] = !corners
					? 'unexplored'
					: part >= 0
						? island[part]
						: corners[wedgeOf(x, y)];
				hexIndex[k] = i;
				hexOf[k] = [ox, oy];
			}
		}
	});
	const sameHex = (j, k) => hexIndex[j] === hexIndex[k];
	const regions = components(
		c,
		terrains,
		mode === 'whole' ? () => true : sameHex
	);
	// Ground first, everywhere.
	regions.forEach(({ terrain, m }, k) => {
		if (terrain === 'sea') {
			paintSea(c, m, terrains, k + 1);
		} else if (terrain === 'unexplored') {
			paintFog(c, m, hexOf);
		} else {
			groundOver(c, terrain, m, k + 1);
		}
	});
	// The hexes' rims, under the features so that a join can run over them.
	for (let k = 0; k < W * H; k++) {
		const x = k % W;
		if (hexIndex[k] < 0) {
			continue;
		}
		if (
			SIDES.some(
				([dx, dy]) =>
					x + dx >= 0 &&
					x + dx < W &&
					hexIndex[k + dy * W + dx] >= 0 &&
					hexIndex[k + dy * W + dx] !== hexIndex[k] &&
					(dx > 0 || dy > 0)
			)
		) {
			c.p[k] = mix(c.p[k], C.ink, 0.6);
		}
	}
	regions.forEach(({ terrain, m }, k) => features(c, terrain, m, 7 * k + 3));
	if (mode === 'edges') {
		// A join piece on each half edge where both hexes show the same land: the terrain's own features, painted over a
		// lens around the half edge's middle. In the game these would be fixed pictures, one set per terrain and edge direction.
		placed.forEach((_, i) => {
			placed.forEach((__, j) => {
				if (j <= i) {
					return;
				}
				const [ax, ay] = origin[i];
				const [bx, by] = origin[j];
				const dx = bx - ax;
				const dy = by - ay;
				if (Math.hypot(dx, dy) > 60) {
					return;
				}
				const mx = ax + HEX_W / 2 + dx / 2;
				const my = ay + HEX_H / 2 + dy / 2;
				// The edge runs across the line between the centres; its half edges' middles lie a quarter of it either side.
				const len = Math.hypot(dx, dy);
				const ex = (-dy / len) * 8;
				const ey = (dx / len) * 8;
				for (const s of [-1, 1]) {
					const qx = Math.round(mx + s * ex);
					const qy = Math.round(my + s * ey);
					const tA =
						terrains[
							Math.round(qy - (dy / len) * 3) * W +
								Math.round(qx - (dx / len) * 3)
						];
					const tB =
						terrains[
							Math.round(qy + (dy / len) * 3) * W +
								Math.round(qx + (dx / len) * 3)
						];
					if (tA !== tB || !LAND.has(tA) || tA === 'grassland') {
						continue;
					}
					const m = new Uint8Array(W * H);
					for (let y = qy - 11; y <= qy + 11; y++) {
						for (let x = qx - 11; x <= qx + 11; x++) {
							if (
								(x - qx) ** 2 + ((y - qy) * 1.2) ** 2 <= 100 &&
								terrains[y * W + x] === tA
							) {
								m[y * W + x] = 1;
							}
						}
					}
					features(c, tA, m, hash(qx, qy));
				}
			});
		});
	}
	coast(c, terrains);
	placed.forEach(([, , id, turn], i) => {
		if (!id) {
			return;
		}
		const t = tile(id);
		const [ox, oy] = origin[i];
		if (t.volcano) {
			const [vx, vy] = volcanoSpot(volcanoCorner(turnedCorners(t, turn)));
			lay(c, drawVolcano(), [ox + vx, oy + vy]);
		}
		if (t.clouds) {
			lay(c, drawCloud(), [ox + CLOUD_SPOT[0], oy + CLOUD_SPOT[1]]);
		}
	});
	return c;
}

function lay(c, top, [left, topY]) {
	for (let y = 0; y < top.h; y++) {
		for (let x = 0; x < top.w; x++) {
			const col = top.p[y * top.w + x];
			if (
				col &&
				left + x >= 0 &&
				topY + y >= 0 &&
				left + x < c.w &&
				topY + y < c.h
			) {
				c.p[(topY + y) * c.w + left + x] = col;
			}
		}
	}
}

// Seven tiles and their fog, turned so that mountain, forest and desert meet across hexes.
const CLUSTER = [
	[0, 0, 42, 0],
	[-1, 0, 8, 3],
	[0, -1, 46, 4],
	[1, 0, 12, 0],
	[0, 1, 47, 1],
	[1, -1, 32, 2],
	[-1, 1, 19, 5],
	[-1, -1, null, 0],
	[1, 1, null, 0],
	[2, -1, null, 0],
	[-2, 1, null, 0],
];

/** Turns each tile to share the most land with the tiles placed before it, so the sketch shows joins. */
function arrange(list) {
	const placed = [];
	for (const [a, b, id] of list) {
		if (!id) {
			placed.push([a, b, id, 0]);
			continue;
		}
		let best = [0, -1];
		for (let turn = 0; turn < 6; turn++) {
			const trial = [...placed, [a, b, id, turn]];
			const score = countJoins(trial);
			if (score > best[1]) {
				best = [turn, score];
			}
		}
		placed.push([a, b, id, best[0]]);
	}
	return placed;
}

/** How many half edges two land hexes share with the same terrain. */
function countJoins(placed) {
	// The corner terrains at each side of each edge: edge k runs from corner k to k + 1; across the board, the hex
	// at direction k sees it as its edge k + 3.
	const DIRS = [
		[-1, 0],
		[-1, 1],
		[0, 1],
		[1, 0],
		[1, -1],
		[0, -1],
	];
	let n = 0;
	for (const [a, b, id, turn] of placed) {
		if (!id) {
			continue;
		}
		const cs = turnedCorners(tile(id), turn);
		DIRS.forEach(([da, db], e) => {
			const other = placed.find(
				([oa, ob, oid]) => oid && oa === a + da && ob === b + db
			);
			if (!other) {
				return;
			}
			const os = turnedCorners(tile(other[2]), other[3]);
			const o = (e + 3) % 6;
			if (cs[e] === os[(o + 1) % 6] && LAND.has(cs[e])) {
				n++;
			}
			if (cs[(e + 1) % 6] === os[o] && LAND.has(cs[(e + 1) % 6])) {
				n++;
			}
		});
	}
	return n;
}

const cluster = arrange(CLUSTER);

const img = (c, px) =>
	`<img class="px" width="${px}" src="data:image/svg+xml;base64,${Buffer.from(toSvg(c)).toString('base64')}">`;
const figure = (c, caption, scale = 2.4) =>
	`<figure>${img(c, Math.round(c.w * scale))}<figcaption>${caption}</figcaption></figure>`;

function soloHex(t) {
	const c = createCanvas(HEX_W, HEX_H);
	const m = new Uint8Array(HEX_W * HEX_H);
	const terrains = new Array(HEX_W * HEX_H).fill(null);
	for (let y = 0; y < HEX_H; y++) {
		for (let x = 0; x < HEX_W; x++) {
			if (inHex(x, y)) {
				m[y * HEX_W + x] = 1;
				terrains[y * HEX_W + x] = t;
			}
		}
	}
	if (t === 'sea') {
		paintSea(c, m, terrains, 1);
	} else {
		groundOver(c, t, m, 1);
		features(c, t, m, 3);
	}
	return c;
}

const html = `<!doctype html><html><head><meta charset="utf-8"><title>#134 round 2</title><style>
body{background:#14161c;color:#e8e4d8;font:14px system-ui;margin:24px;}
h2{font-size:16px;margin:28px 0 8px;color:#e9c46a}
p{max-width:1000px;color:#b9b4a6;margin:4px 0 12px}
.row{display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start;margin-bottom:12px}
figure{margin:0;text-align:center}figcaption{font-size:12px;color:#b9b4a6;margin-top:4px}
.px{image-rendering:pixelated;display:block}
</style></head><body>
<h1 style="font-size:20px">#134 · World map terrain · round 2 sketches</h1>
<p>Your round 1 answers: same-terrain wedges join inside a tile (B), terrain also joins across hexes, the desert is mostly dunes, and the sea is redrawn.</p>
<h2>1 · The new desert and sea, beside today's</h2>
<div class="row">${figure(drawHexTerrain('desert', HEX_SEED), 'desert today', 3)}${figure(soloHex('desert'), 'desert · rolling dunes, a few low rocks', 3)}${figure(drawHexTerrain('sea', HEX_SEED), 'sea today', 3)}${figure(soloHex('sea'), 'sea · bands of depth, lit wave crests', 3)}</div>
<h2>2 · Joining across hexes: two ways to build it</h2>
<p><b>Join pieces</b> (C): each tile is its own picture (B), and where two placed hexes meet on the same mountain, forest or desert, a small join piece is laid over their shared edge: peaks, trees or dunes that run across it. The pieces are fixed pictures, a few per terrain and edge direction, so the map still uses only drawn art.</p>
<p><b>One picture</b> (D): the whole explored map is painted as one picture, every range and wood across hexes as one mass. This means the game itself paints the terrain while it is played, which the conventions rule out today: art is drawn by the toolkit at build time and the game shows it by its asset id. It would need your ruling to change that.</p>
<div class="row">${figure(board(cluster, 'today'), 'today')}${figure(board(cluster, 'tile'), 'B · joined inside each tile only')}</div>
<div class="row">${figure(board(cluster, 'edges'), 'C · B plus join pieces across hexes')}${figure(board(cluster, 'whole'), 'D · one picture across the map')}</div>
</body></html>`;
writeFileSync(OUT, html);
console.log('wrote', String(OUT));
