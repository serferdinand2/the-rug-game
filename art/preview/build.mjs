// The asset gallery: every scene part and every catalog asset, drawn or not, on one page (npm run art).
import { writeFile } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createCanvas, outline, seededRandom, toSvg } from '../painter.js';
import { PALETTE } from '../palette.js';
import { drawSky } from '../parts/sky.js';
import { drawSea } from '../parts/sea.js';
import { drawTerrain } from '../parts/terrain.js';
import { drawBuilding } from '../parts/buildings.js';
import { drawFigure } from '../parts/figures.js';
import { drawSmoke } from '../parts/smoke.js';
import { drawClassical } from '../parts/classical.js';
import { drawFactory } from '../parts/factory.js';
import { drawSkyline } from '../parts/skyline.js';
import { drawStreet } from '../parts/street.js';
import { ASSETS, GROUPS, EXPANSIONS } from '../catalog.js';
import { PLOT_SIZE, FOOTPRINTS } from '../footprints.js';
import { DRAWINGS_DIR, listDrawingIds, renderAsset } from '../build.mjs';

/** @typedef {import('../painter.js').Canvas} Canvas */
/** @typedef {import('../catalog.js').Asset} Asset */

/** Where the gallery is written. It is git-ignored, self-contained and opens straight from disk. */
export const GALLERY_FILE = fileURLToPath(
	new URL('./index.html', import.meta.url)
);

/** Each drawn asset is shown at these scales. */
const SCALES = [2, 4];

/**
 * One sample per scene part, each alone on a 64×64 canvas.
 * Foreground parts get the outline pass, as they would in a scene.
 * @type {{ label: string, draw: () => Canvas }[]}
 */
const PART_SAMPLES = [
	...['night', 'day', 'dusk'].map((time) => ({
		label: `sky: ${time}`,
		draw: () => {
			const c = createCanvas(64, 64);
			drawSky(c, {
				time: /** @type {'night' | 'day' | 'dusk'} */ (time),
				horizon: 63,
				random: seededRandom(7),
				sparkles: [[12, 8]],
				moon: { x: 46, y: 14 },
			});
			return c;
		},
	})),
	...['night', 'day'].map((time) => ({
		label: `sea: ${time}`,
		draw: () => {
			const c = createCanvas(64, 64);
			drawSea(c, {
				time: /** @type {'night' | 'day'} */ (time),
				top: 0,
				random: seededRandom(7),
			});
			return c;
		},
	})),
	...['forest', 'mountain', 'desert', 'grassland'].map((kind) => ({
		label: `terrain: ${kind}`,
		draw: () => {
			const c = createCanvas(64, 64);
			drawTerrain(c, {
				kind: /** @type {'forest' | 'mountain' | 'desert' | 'grassland'} */ (
					kind
				),
				top: 40,
				random: seededRandom(7),
			});
			return c;
		},
	})),
	...['house', 'tower', 'wall'].map((kind) => ({
		label: `building: ${kind}`,
		draw: () => {
			const c = createCanvas(64, 64);
			drawBuilding(c, {
				kind: /** @type {'house' | 'tower' | 'wall'} */ (kind),
				x: 22,
				y: 58,
			});
			outline(c, PALETTE.ink);
			return c;
		},
	})),
	{
		label: 'figure',
		draw: () => {
			const c = createCanvas(64, 64);
			drawFigure(c, { x: 25, y: 58 });
			drawFigure(c, {
				x: 33,
				y: 58,
				facing: 'left',
				clothes: PALETTE.roofLight,
			});
			outline(c, PALETTE.ink);
			return c;
		},
	},
	...['smoke', 'steam'].map((tone) => ({
		label: `smoke: ${tone}`,
		draw: () => {
			const c = createCanvas(64, 64);
			drawSmoke(c, {
				x: 24,
				y: 58,
				tone: /** @type {'smoke' | 'steam'} */ (tone),
				puffs: 4,
			});
			return c;
		},
	})),
	...['pediment', 'flat'].map((roof) => ({
		label: `classical: ${roof}`,
		draw: () => {
			const c = createCanvas(64, 64);
			drawClassical(c, {
				x: 6,
				y: 58,
				width: 52,
				columns: 6,
				roof: /** @type {'pediment' | 'flat'} */ (roof),
			});
			outline(c, PALETTE.ink);
			return c;
		},
	})),
	{
		label: 'factory',
		draw: () => {
			const c = createCanvas(64, 64);
			drawFactory(c, { x: 6, y: 58, width: 52 });
			outline(c, PALETTE.ink);
			return c;
		},
	},
	...['night', 'dusk', 'day'].map((time) => ({
		label: `skyline: ${time}`,
		draw: () => {
			const c = createCanvas(64, 64);
			drawSkyline(c, {
				base: 63,
				time: /** @type {'night' | 'dusk' | 'day'} */ (time),
				random: seededRandom(7),
				height: 40,
			});
			return c;
		},
	})),
	{
		label: 'street',
		draw: () => {
			const c = createCanvas(64, 64);
			drawStreet(c, { top: 40 });
			return c;
		},
	},
];

/**
 * Escapes text for HTML.
 * @param {string} text
 * @returns {string}
 */
function escape(text) {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/**
 * Sets an SVG's displayed size to its own size times a scale, without cropping or padding it.
 * @param {string} svg - As written by toSvg
 * @param {number} scale
 * @param {boolean} [plots] - Lay the plot grid (PLOT_SIZE pixels per plot) over it, so a footprint can be checked by eye
 * @returns {string}
 */
function sized(svg, scale, plots = false) {
	const box = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
	const w = Number(box?.[1] ?? 64) * scale;
	const h = Number(box?.[2] ?? 64) * scale;
	const picture = svg.replace('<svg ', `<svg width="${w}" height="${h}" `);
	return plots
		? `<span class="board" style="--plot:${PLOT_SIZE * scale}px">${picture}</span>`
		: picture;
}

/**
 * One scene-part tile.
 * @param {string} label
 * @param {string} svg
 * @returns {string}
 */
function partTile(label, svg) {
	const pictures = SCALES.map((scale) => sized(svg, scale)).join('');
	return `<figure class="part">${pictures}<figcaption><b>${escape(label)}</b></figcaption></figure>`;
}

/**
 * One asset tile: the drawing at each scale, or a labelled empty slot.
 * @param {Asset} asset
 * @param {string | undefined} svg - The asset's SVG, when it is drawn
 * @param {boolean} [showExpansion] - Name the expansion, for lists that mix them
 * @returns {string}
 */
function assetTile(asset, svg, showExpansion = false) {
	const id = escape(asset.id);
	const name = escape(asset.name);
	const expansion = showExpansion
		? `<span>${escape(EXPANSION_NAMES.get(asset.expansion) ?? asset.expansion)}</span>`
		: '';
	if (!svg) {
		return `<figure class="asset" data-id="${id}" data-drawn="no"><div class="slot"><span>${id}</span><b>${name}</b>${expansion}<i>#${asset.issue}</i></div></figure>`;
	}
	const plots = asset.group === 'landmark';
	const pictures = SCALES.map((scale) => sized(svg, scale, plots)).join('');
	const classes = plots ? 'asset plots' : 'asset';
	return `<figure class="${classes}" data-id="${id}" data-drawn="yes">${pictures}<figcaption><b>${name}</b>${expansion}<span>${id}</span></figcaption></figure>`;
}

/** Expansion names by code, for tile captions. */
const EXPANSION_NAMES = new Map(
	EXPANSIONS.map(({ code, name }) => [code, name])
);

/**
 * Orders landmarks by footprint size: most plots first, then the larger bounding box,
 * then the catalog's order. A landmark without a footprint goes last.
 * @param {Asset[]} landmarks
 * @returns {Asset[]}
 */
function bySize(landmarks) {
	const size = (/** @type {Asset} */ asset) => {
		const rows = Object.hasOwn(FOOTPRINTS, asset.id.split('/')[1])
			? FOOTPRINTS[asset.id.split('/')[1]]
			: [];
		const plots = rows.join('').split('X').length - 1;
		const box = rows.length * (rows[0]?.length ?? 0);
		return { plots, box };
	};
	return landmarks
		.map((asset, index) => ({ asset, index, ...size(asset) }))
		.sort((a, b) => b.plots - a.plots || b.box - a.box || a.index - b.index)
		.map(({ asset }) => asset);
}

/**
 * Builds the gallery page.
 * @param {{ drawingsDir?: string, assets?: readonly Asset[] }} [options]
 * @returns {Promise<string>} A self-contained HTML page, with every SVG inline.
 */
export async function buildGallery({
	drawingsDir = DRAWINGS_DIR,
	assets = ASSETS,
} = {}) {
	const drawn = new Set(await listDrawingIds(drawingsDir));
	/** @type {Map<string, string>} */
	const svgs = new Map();
	for (const asset of assets) {
		if (drawn.has(asset.id)) {
			svgs.set(asset.id, await renderAsset(asset.id, drawingsDir));
		}
	}
	const parts = PART_SAMPLES.map((sample) =>
		partTile(sample.label, toSvg(sample.draw()))
	).join('');
	const sections = GROUPS.map((group) => {
		const members = assets.filter((asset) => asset.group === group.id);
		if (members.length === 0) {
			return '';
		}
		const done = members.filter((asset) => svgs.has(asset.id)).length;
		const heading = `<h2>${escape(group.label)} · ${members.length} · ${done} drawn</h2>`;
		if (group.id === 'landmark') {
			// Landmarks are reviewed by size, largest footprint first, across all expansions.
			const tiles = bySize(members)
				.map((asset) => assetTile(asset, svgs.get(asset.id), true))
				.join('');
			return `<section data-group="landmark">${heading}<div class="grid">${tiles}</div></section>`;
		}
		const byExpansion = EXPANSIONS.map(({ code, name }) => {
			const list = members.filter((asset) => asset.expansion === code);
			if (list.length === 0) {
				return '';
			}
			const tiles = list
				.map((asset) => assetTile(asset, svgs.get(asset.id)))
				.join('');
			return `<h3>${escape(name)}</h3><div class="grid">${tiles}</div>`;
		}).join('');
		return `<section data-group="${escape(group.id)}">${heading}${byExpansion}</section>`;
	}).join('\n');
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Asset gallery</title>
<style>
body{margin:0;padding:24px;background:#18121f;color:#efe6d2;font:14px/1.4 ui-monospace,monospace}
h1{font-size:20px;margin:0 0 4px}h2{font-size:17px;margin:32px 0 4px;color:#f2d58c}h3{font-size:13px;margin:14px 0 8px;color:#c9bfe0;font-weight:normal}
p{margin:0;color:#c9bfe0}
.grid{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-start}
figure{margin:0;padding:10px;background:#2b2142;border-radius:6px;display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;max-width:100%}
svg{display:block;image-rendering:pixelated;background:repeating-conic-gradient(#3a2c55 0 25%,#30233c 0 50%) 0 0/16px 16px}
.board{position:relative;display:block;outline:1px solid #f2d58c88}
.board::after{content:"";position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(#f2d58c66 1px,transparent 1px),linear-gradient(90deg,#f2d58c66 1px,transparent 1px);background-size:var(--plot) var(--plot)}
figcaption{flex-basis:100%;display:flex;flex-direction:column}figcaption span{color:#a99cc4;font-size:12px}
.slot{width:128px;height:128px;border:2px dashed #4b3a63;border-radius:4px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:4px;padding:6px;box-sizing:border-box;text-align:center;color:#a99cc4;font-size:11px;overflow-wrap:anywhere}
.slot b{color:#efe6d2;font-weight:normal;font-size:12px}.slot i{font-style:normal;color:#f2d58c}
</style>
</head>
<body>
<h1>Asset gallery</h1>
<p>Generated by npm run art. Every asset in the catalog: drawn ones at 2× and 4×, the rest as empty slots naming the issue that draws them. Landmarks are drawn in their footprint's shape, at 32 pixels per plot, with the plot grid laid over them.</p>
<h2>Scene parts</h2>
<div class="grid">${parts}</div>
${sections}
</body>
</html>
`;
}

// Write the gallery only when this file is the entry point, not when tests import it.
if (
	process.argv[1] &&
	realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
	await writeFile(GALLERY_FILE, await buildGallery());
	console.log('art: wrote art/preview/index.html');
}
