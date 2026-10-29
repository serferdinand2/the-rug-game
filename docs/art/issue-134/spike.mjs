// A throwaway spike for #134's sketches: the map's terrain in #82's 2.5D style, for the owner to compare. Not run by the tests or the build.
import { writeFileSync } from 'node:fs';
import { createCanvas, overlay, toSvg } from '../../../tools/art/painter.js';
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
import { drawNaturalGround } from '../../../tools/art/parts/capital-relief/ground.js';
import { paintMountains } from '../../../tools/art/parts/capital-relief/mountain.js';
import { paintForest } from '../../../tools/art/parts/capital-relief/forest.js';
import { paintDesert } from '../../../tools/art/parts/capital-relief/desert.js';
import { TERRITORY_TILES } from '../../../src/lib/engine/data/territory-tiles.js';
import { volcanoCorner } from '../../../src/lib/art/hex-overlays.js';

const OUT = process.argv[2] ?? new URL('./spike.html', import.meta.url);
const N = HEX_W * HEX_H;

/** A region of the hex: one byte per pixel. */
function region(test) {
	const m = new Uint8Array(N);
	for (let y = 0; y < HEX_H; y++) {
		for (let x = 0; x < HEX_W; x++) {
			if (inHex(x, y) && test(x, y)) {
				m[y * HEX_W + x] = 1;
			}
		}
	}
	return m;
}

/** The region shrunk by `by` pixels from every edge that faces another region or the hex's rim. */
function inset(m, by) {
	const out = new Uint8Array(N);
	for (let y = 0; y < HEX_H; y++) {
		for (let x = 0; x < HEX_W; x++) {
			let ok = m[y * HEX_W + x] === 1;
			for (let d = -by; ok && d <= by; d++) {
				for (const [dx, dy] of [
					[d, 0],
					[0, d],
				]) {
					const nx = x + dx;
					const ny = y + dy;
					if (
						nx < 0 ||
						ny < 0 ||
						nx >= HEX_W ||
						ny >= HEX_H ||
						!m[ny * HEX_W + nx]
					) {
						ok = false;
					}
				}
			}
			out[y * HEX_W + x] = ok ? 1 : 0;
		}
	}
	return out;
}

/** A Footprint for #82's relief painters: the region, with no plots or corner joins. */
function hexFootprint(m) {
	return {
		rows: 0,
		cols: 0,
		w: HEX_W,
		h: HEX_H,
		mask: inset(m, 2),
		plots: m,
		reach: m,
		corners: [],
	};
}

const GROUND_OF = {
	mountain: 'mountain',
	forest: 'forest',
	desert: 'desert',
	grassland: 'grassland',
};
const RELIEF_OF = {
	mountain: paintMountains,
	forest: paintForest,
	desert: paintDesert,
};

/** Paints one terrain, 2.5D, over a region of a canvas. */
function paint25d(canvas, terrain, m, seed) {
	if (terrain === 'sea' || terrain === 'unexplored') {
		const flat = drawHexTerrain(terrain, seed);
		for (let i = 0; i < N; i++) {
			if (m[i]) {
				canvas.p[i] = flat.p[i];
			}
		}
		return;
	}
	// The natural ground, four plots of it laid across the hex.
	const ground = createCanvas(64, 64);
	for (let k = 0; k < 4; k++) {
		drawNaturalGround(ground, {
			biome: GROUND_OF[terrain],
			variant: (seed + k) % 8,
			x: (k % 2) * 32,
			y: Math.floor(k / 2) * 32,
		});
	}
	for (let i = 0; i < N; i++) {
		if (m[i]) {
			canvas.p[i] = ground.p[i];
		}
	}
	const painter = RELIEF_OF[terrain];
	if (painter) {
		const relief = createCanvas(HEX_W, HEX_H);
		painter(relief, hexFootprint(m), seed);
		overlay(canvas, relief);
	}
}

/** The coast where land meets sea, as territory.js draws it. */
function coast(canvas, terrains) {
	const at = (x, y) =>
		x < 0 || y < 0 || x >= HEX_W || y >= HEX_H
			? null
			: terrains[y * HEX_W + x];
	const sides = [
		[1, 0],
		[-1, 0],
		[0, 1],
		[0, -1],
	];
	const out = [];
	for (let y = 0; y < HEX_H; y++) {
		for (let x = 0; x < HEX_W; x++) {
			const here = at(x, y);
			if (!here) {
				continue;
			}
			const sea = here === 'sea';
			const other = (dx, dy) => {
				const t = at(x + dx, y + dy);
				return t !== null && (t === 'sea') !== sea;
			};
			if (sides.some(([dx, dy]) => other(dx, dy))) {
				out.push([
					x,
					y,
					sea
						? (x + 2 * y) % 7 === 0
							? C.dayWave
							: C.foam
						: C.sandLight,
				]);
			} else if (
				sea &&
				sides.some(([dx, dy]) => other(2 * dx, 2 * dy)) &&
				(x + y) % 2 === 0
			) {
				out.push([x, y, C.daySea1]);
			}
		}
	}
	for (const [x, y, c] of out) {
		canvas.p[y * HEX_W + x] = c;
	}
}

function lay(canvas, top, [left, topY]) {
	for (let y = 0; y < top.h; y++) {
		for (let x = 0; x < top.w; x++) {
			const c = top.p[y * top.w + x];
			if (
				c &&
				left + x >= 0 &&
				topY + y >= 0 &&
				left + x < canvas.w &&
				topY + y < canvas.h
			) {
				canvas.p[(topY + y) * canvas.w + left + x] = c;
			}
		}
	}
}

/**
 * A territory in the new style.
 * joined: same-terrain wedges side by side are painted as one region (option B); otherwise each wedge alone (option A).
 */
function territory25d({ corners, island = [], clouds, volcano, seed }, joined) {
	const canvas = createCanvas(HEX_W, HEX_H);
	const terrains = new Array(N).fill(null);
	for (let y = 0; y < HEX_H; y++) {
		for (let x = 0; x < HEX_W; x++) {
			if (!inHex(x, y)) {
				continue;
			}
			const part = islandPartOf(x, y, island.length);
			terrains[y * HEX_W + x] =
				part >= 0 ? island[part] : corners[wedgeOf(x, y)];
		}
	}
	/** @type {{ terrain: string, m: Uint8Array }[]} */
	const regions = [];
	if (joined) {
		for (const t of new Set(terrains.filter(Boolean))) {
			// One region per run of same-terrain wedges: pixels of that terrain that are connected.
			const all = region((x, y) => terrains[y * HEX_W + x] === t);
			const seen = new Uint8Array(N);
			for (let i = 0; i < N; i++) {
				if (!all[i] || seen[i]) {
					continue;
				}
				const m = new Uint8Array(N);
				const stack = [i];
				seen[i] = 1;
				while (stack.length) {
					const j = stack.pop();
					m[j] = 1;
					const x = j % HEX_W;
					const y = (j - x) / HEX_W;
					for (const [dx, dy] of [
						[1, 0],
						[-1, 0],
						[0, 1],
						[0, -1],
					]) {
						const nx = x + dx;
						const ny = y + dy;
						const k = ny * HEX_W + nx;
						if (
							nx >= 0 &&
							ny >= 0 &&
							nx < HEX_W &&
							ny < HEX_H &&
							all[k] &&
							!seen[k]
						) {
							seen[k] = 1;
							stack.push(k);
						}
					}
				}
				regions.push({ terrain: t, m });
			}
		}
	} else {
		for (let w = 0; w < 6; w++) {
			regions.push({
				terrain: corners[w],
				m: region(
					(x, y) =>
						islandPartOf(x, y, island.length) < 0 &&
						wedgeOf(x, y) === w
				),
			});
		}
		island.forEach((t, p) => {
			regions.push({
				terrain: t,
				m: region((x, y) => islandPartOf(x, y, island.length) === p),
			});
		});
	}
	regions.forEach(({ terrain, m }, k) =>
		paint25d(canvas, terrain, m, seed * 7 + k)
	);
	coast(canvas, terrains);
	if (volcano) {
		lay(canvas, drawVolcano(), volcanoSpot(volcanoCorner(corners)));
	}
	if (clouds) {
		lay(canvas, drawCloud(), CLOUD_SPOT);
	}
	return canvas;
}

const tile = (id) => TERRITORY_TILES.find((t) => t.id === id);
const opts = (t, turn = 0) => ({
	corners: [...t.corners.slice(turn), ...t.corners.slice(0, turn)],
	island: t.island,
	clouds: t.clouds,
	volcano: t.volcano,
	seed: t.id,
});

const svg = (canvas, px) =>
	`<img class="px" width="${px}" src="data:image/svg+xml;base64,${Buffer.from(toSvg(canvas)).toString('base64')}">`;

const solo = (t) => {
	const all = { corners: Array(6).fill(t), island: [], seed: HEX_SEED };
	return territory25d(all, true);
};

const TERRAINS = [
	'sea',
	'desert',
	'forest',
	'grassland',
	'mountain',
	'unexplored',
];

const figure = (canvas, caption, px = 192) =>
	`<figure>${svg(canvas, px)}<figcaption>${caption}</figcaption></figure>`;

// Sections.
const terrainsToday = TERRAINS.map((t) =>
	figure(drawHexTerrain(t, HEX_SEED), t)
).join('');
const terrainsNew = TERRAINS.map((t) => figure(solo(t), t)).join('');

const MIXED = [2, 42, 25, 47];
const mixed = MIXED.map(
	(id) =>
		`<div class="trio">${figure(drawTerritory(opts(tile(id))), `#${id} today`)}${figure(
			territory25d(opts(tile(id)), false),
			`#${id} A · each wedge alone`
		)}${figure(territory25d(opts(tile(id)), true), `#${id} B · same terrain joined`)}</div>`
).join('');

// A few tiles together, as the board lays them out (flat-topped hexes 48 across, 28 down), at the game's size (~2.4×).
const CLUSTER = [
	[0, 0, 8, 0],
	[48, -28, 42, 1],
	[48, 28, 19, 2],
	[0, 56, 25, 3],
	[-48, 28, 47, 4],
	[-48, -28, 12, 5],
	[0, -56, 16, 0],
];
function board(joined) {
	const W = 64 + 96;
	const H = 56 + 112;
	const canvas = createCanvas(W, H);
	canvas.p.fill(C.night);
	for (const [dx, dy, id, turn] of CLUSTER) {
		const pic =
			joined === null
				? drawTerritory(opts(tile(id), turn))
				: territory25d(opts(tile(id), turn), joined);
		lay(canvas, pic, [48 + dx, 56 + dy]);
	}
	return canvas;
}
const W_GAME = Math.round((64 + 96) * 2.4);
const boards = `<div class="trio">${figure(board(null), 'today', W_GAME)}${figure(board(false), 'A · each wedge alone', W_GAME)}${figure(board(true), 'B · same terrain joined in a tile', W_GAME)}</div>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><title>#134 sketches</title><style>
body{background:#14161c;color:#e8e4d8;font:14px system-ui;margin:24px;}
h2{font-size:16px;margin:28px 0 8px;color:#e9c46a}
p{max-width:900px;color:#b9b4a6;margin:4px 0 12px}
.row,.trio{display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start;margin-bottom:12px}
figure{margin:0;text-align:center}figcaption{font-size:12px;color:#b9b4a6;margin-top:4px}
.px{image-rendering:pixelated;display:block}
</style></head><body>
<h1 style="font-size:20px">#134 · World map terrain in the 2.5D style · round 1 sketches</h1>
<h2>1 · Each terrain alone, today</h2><div class="row">${terrainsToday}</div>
<h2>2 · Each terrain alone, redrawn with #82's parts</h2>
<p>Mountain: #82's snow-capped peaks. Forest: #82's broadleaf trees and pines. Desert: #82's sandstone buttes and dunes. Grassland: #82's golden meadow, no relief (it is open land on the map). Sea and the unexplored fog unchanged for now.</p>
<div class="row">${terrainsNew}</div>
<h2>3 · Mixed tiles and same-terrain wedges side by side</h2>
<p>A paints each wedge on its own, so the game can keep composing the map from one picture per terrain. B joins same-terrain wedges inside a tile into one picture, drawn per tile at build time (48 tile pictures; WorldMap changes).</p>
${mixed}
<h2>4 · Seven tiles together at the game's size</h2>${boards}
</body></html>`;
writeFileSync(OUT, html);
console.log('wrote', String(OUT));
