// Throwaway concept sketches for the six Arts & Architecture reliefs (#132).
import { mkdirSync, writeFileSync } from 'node:fs';
import { createCanvas, toSvg } from '../../../tools/art/painter.js';
import { PALETTE as C } from '../../../tools/art/palette.js';
import { BIOMES } from '../../../tools/art/parts/capital-biomes/index.js';
import { VOLCANOES } from '../../../tools/art/parts/capital-biomes/archipelago.js';
import {
	CLOUDS,
	CLOUD_TINTS,
} from '../../../tools/art/parts/capital-biomes/cloud-city.js';
import { PITCH, PLOT, reliefSize } from '../../../src/lib/art/relief.js';
import {
	footprint,
	impassableGroups,
} from '../../../src/lib/art/paint/relief/footprint.js';

const ROOT = new URL('.', import.meta.url);
const OUT = new URL('sketches.html', ROOT);
const SPECIMEN = [
	'000000000',
	'010011000',
	'000000000',
	'010000100',
	'001001000',
	'000000000',
	'011000110',
	'010000110',
	'000000000',
];
const IDS = ['archipelago', 'canyon', 'cavern', 'cloud-city', 'mesa', 'swamp'];
const FEATURE_NOTES = {
	archipelago:
		'Open plots keep their grass, sand and island-edge beaches; the three printed volcanoes remain distinct land peaks within the sea mass.',
	canyon: 'Red cliff layers form one connected gorge. The six cacti stay on their printed open plots.',
	cavern: 'One cave-rock mass uses shadowed stone, with crystals and stalagmites as sparse raised details.',
	'cloud-city':
		'Cloud districts retain their four printed tints. Scalloped pale rims remain visible where the cloud mass meets the sky.',
	mesa: 'The top row reads as one continuous red mesa, with stepped strata and flat sunlit plateaus.',
	swamp: 'Black-water pools join into one mass, while dead trees and every printed lily pond stay legible.',
};
const STYLES = {
	archipelago: {
		base: C.daySea2,
		dark: C.nightSea2,
		deep: C.nightSea3,
		light: C.dayWave,
		rim: C.foam,
	},
	canyon: {
		base: C.mesaRock,
		dark: C.mesaRockShade,
		deep: C.mesaRockDark,
		light: C.mesaStrata,
		rim: C.mesaRockLight,
	},
	cavern: {
		base: C.stoneShade,
		dark: C.roofShade,
		deep: C.night,
		light: C.stoneMid,
		rim: C.tealLight,
	},
	'cloud-city': {
		base: C.white,
		dark: C.cloudShade,
		deep: C.stoneShade,
		light: C.creamLight,
		rim: C.white,
	},
	mesa: {
		base: C.mesaRock,
		dark: C.mesaRockShade,
		deep: C.mesaRockDark,
		light: C.mesaStrata,
		rim: C.mesaRockLight,
	},
	swamp: {
		base: C.swampWater,
		dark: C.swampWaterDeep,
		deep: C.night,
		light: C.swampWaterLight,
		rim: C.swampReed,
	},
};
const CLOUD_COLOURS = [
	{ base: C.white, light: C.creamLight, shade: C.cloudShade },
	{ base: C.stoneLight, light: C.cloudShade, shade: C.stone },
	{ base: C.sandLight, light: C.creamLight, shade: C.sandShade },
	{ base: C.cream, light: C.white, shade: C.creamShade },
];

function setPixel(canvas, x, y, colour) {
	if (x >= 0 && y >= 0 && x < canvas.w && y < canvas.h) {
		canvas.p[y * canvas.w + x] = colour;
	}
}

function copyTile(canvas, tile, x, y) {
	for (let py = 0; py < PLOT; py++) {
		for (let px = 0; px < PLOT; px++) {
			setPixel(canvas, x + px, y + py, tile.p[py * PLOT + px]);
		}
	}
}

function cloudTint(row, col) {
	return CLOUD_TINTS[Number(CLOUDS[row][col])];
}

function hash(x, y, seed = 0) {
	let value = Math.imul(x + seed + 0x9e3779b9, 0x85ebca6b);
	value = Math.imul(value ^ (y + 0x9e3779b9), 0xc2b2ae35);
	return (value ^ (value >>> 16)) >>> 0;
}

function massColour(id, mask, x, y, row, col) {
	const at = y * mask.w + x;
	const right = !mask.mask[at + 1];
	const below = !mask.mask[at + mask.w];
	const above = !mask.mask[at - mask.w];
	const left = !mask.mask[at - 1];
	const pixel = hash(Math.floor(x / 3), Math.floor(y / 3));
	const style = STYLES[id];

	if (id === 'cloud-city') {
		const tint = CLOUD_COLOURS[cloudTint(row, col)];
		if ((above || left) && pixel % 5 !== 0) {
			return tint.light;
		}
		if ((right || below) && pixel % 4 !== 0) {
			return tint.shade;
		}
		if (pixel % 41 === 0) {
			return tint.light;
		}
		return tint.base;
	}
	if (id === 'archipelago') {
		if ((above || left) && pixel % 3 === 0) {
			return style.light;
		}
		if ((right || below) && pixel % 2 === 0) {
			return style.deep;
		}
		const wave =
			(y + Math.floor(x / 6) * 2 + (hash(Math.floor(x / 16), row) % 5)) %
			17;
		if (wave === 5 || wave === 6) {
			return style.rim;
		}
		if (wave === 4 || wave === 7) {
			return style.light;
		}
		return pixel % 11 === 0 ? style.dark : style.base;
	}
	if (id === 'canyon') {
		if (below && pixel % 3 !== 0) {
			return style.deep;
		}
		if (right && pixel % 3 !== 0) {
			return style.dark;
		}
		if (above && pixel % 2 === 0) {
			return style.light;
		}
		const band = (y + Math.floor(x / 11) * 3 + (hash(col, row) % 7)) % 16;
		if (band === 4 || band === 5) {
			return style.light;
		}
		if (band === 6 || band === 7) {
			return style.rim;
		}
		return pixel % 13 === 0 ? style.dark : style.base;
	}
	if (id === 'mesa') {
		if ((right || below) && pixel % 4 !== 0) {
			return right ? style.deep : style.dark;
		}
		if ((above || left) && pixel % 3 !== 0) {
			return style.light;
		}
		const strata = (y + Math.floor(x / 13) * 2 + (hash(col, row) % 5)) % 19;
		if (strata === 8 || strata === 9) {
			return style.rim;
		}
		if (strata === 10) {
			return style.dark;
		}
		return pixel % 17 === 0 ? style.light : style.base;
	}
	if (id === 'cavern') {
		if ((below || right) && pixel % 3 !== 0) {
			return style.deep;
		}
		if ((above || left) && pixel % 3 === 0) {
			return style.light;
		}
		const facet =
			(x + y * 2 + hash(Math.floor(x / 8), Math.floor(y / 8))) % 27;
		if (facet < 3) {
			return facet === 0 ? style.light : style.dark;
		}
		if (pixel % 53 === 0) {
			return style.rim;
		}
		return pixel % 19 === 0 ? style.dark : style.base;
	}
	if ((right || below) && pixel % 4 !== 0) {
		return style.deep;
	}
	if ((above || left) && pixel % 3 === 0) {
		return style.light;
	}
	return pixel % 29 === 0
		? style.light
		: pixel % 9 === 0
			? style.dark
			: style.base;
}

function drawDecorations(canvas, id, layout, mask) {
	const width = canvas.w;
	const putIfMass = (x, y, colour) => {
		const i = y * width + x;
		if (x >= 0 && y >= 0 && x < width && y < canvas.h && mask.mask[i]) {
			canvas.p[i] = colour;
		}
	};
	const groups = impassableGroups(layout);
	const centers = groups.map((group) => {
		const cells = group.map((index) => ({
			row: Math.floor(index / layout[0].length),
			col: index % layout[0].length,
		}));
		const meanRow =
			cells.reduce((sum, cell) => sum + cell.row, 0) / cells.length;
		const meanCol =
			cells.reduce((sum, cell) => sum + cell.col, 0) / cells.length;
		const anchor = cells.reduce((best, cell) =>
			(cell.row - meanRow) ** 2 + (cell.col - meanCol) ** 2 <
			(best.row - meanRow) ** 2 + (best.col - meanCol) ** 2
				? cell
				: best
		);
		return {
			cells,
			anchor,
			x: anchor.col * PITCH + 16,
			y: anchor.row * PITCH + 16,
		};
	});
	if (id === 'swamp') {
		for (const { cells, anchor, x: cx, y: cy } of centers) {
			const lean = (hash(anchor.col, anchor.row, 31) % 3) - 1;
			const height = cells.length > 1 ? 14 : 10;
			for (let y = -height; y <= 4; y++) {
				const trunkX = cx + Math.round((y + height) * lean * 0.12);
				putIfMass(trunkX, cy + y, y < 1 ? C.timberLight : C.wood);
				if (y < -2 && (y + anchor.row) % 2 === 0) {
					const branch = y % 2 === 0 ? -1 : 1;
					for (let branchX = 1; branchX <= 5; branchX++) {
						putIfMass(
							trunkX + branch * branchX,
							cy + y + branchX,
							branchX === 1 ? C.timber : C.wood
						);
					}
				}
			}
			putIfMass(cx + lean - 1, cy - height + 1, C.swampReed);
			putIfMass(cx + lean, cy - height, C.timberShade);
		}
	}
	if (id === 'cavern') {
		for (const { cells, anchor, x, y } of centers) {
			const cx = x + (hash(anchor.col, anchor.row, 83) % 5) - 2;
			const cy = y + 5;
			const crystals = [
				{ x: cx - 6, h: cells.length > 2 ? 10 : 7 },
				{ x: cx, h: cells.length > 1 ? 14 : 10 },
				{ x: cx + 7, h: cells.length > 2 ? 9 : 6 },
			];
			for (const crystal of crystals) {
				const width = Math.max(2, Math.floor(crystal.h * 0.42));
				for (let step = 0; step < crystal.h; step++) {
					const half = Math.max(
						0,
						Math.floor((step + 1) * (width / crystal.h))
					);
					for (let dx = -half; dx <= half; dx++) {
						const edge = Math.abs(dx) === half;
						putIfMass(
							crystal.x + dx,
							cy - crystal.h + step,
							edge
								? C.arcaneShade
								: dx < 0
									? C.tealLight
									: C.arcane
						);
					}
				}
				putIfMass(crystal.x, cy + 1, C.night);
				putIfMass(crystal.x + 1, cy + 1, C.night);
			}
		}
	}
	if (id === 'archipelago') {
		for (const [row, col] of VOLCANOES) {
			const cx = col * PITCH + 16;
			const shore = row * PITCH + 25;
			for (let y = -3; y <= 3; y++) {
				for (let x = -10; x <= 10; x++) {
					if ((x * x) / 100 + (y * y) / 18 <= 1) {
						putIfMass(
							cx + x,
							shore + y,
							Math.abs(x) > 7 ? C.sandLight : C.sand
						);
					}
				}
			}
			for (let height = 0; height < 12; height++) {
				const half = Math.floor((height + 1) * 0.8);
				for (let x = -half; x <= half; x++) {
					const y = shore - height;
					putIfMass(cx + x, y, x < 0 ? C.basaltLight : C.basalt);
					putIfMass(cx + x, y + 1, x < 0 ? C.basalt : C.basaltShade);
				}
			}
			for (let x = -2; x <= 2; x++) {
				putIfMass(cx + x, shore - 12, C.lava);
				if (Math.abs(x) < 2) {
					putIfMass(cx + x, shore - 13, C.ember);
				}
			}
		}
	}
}

function drawBoard(id, layout, source, isMat) {
	const rows = layout.length;
	const cols = layout[0].length;
	const { w, h } = reliefSize(rows, cols);
	const canvas = createCanvas(w, h);
	canvas.p.fill(C.ink);
	const module = BIOMES[id];
	const openVariants = module.FEATURES.pools.open;
	const openAt = (row, col) =>
		module.drawBiomeTile(
			false,
			openVariants[(row * 7 + col * 5) % openVariants.length]
		);
	const matCell = createCanvas(PLOT, PLOT);

	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			const char = layout[row][col];
			if (
				char === 'X' &&
				isMat &&
				id === 'archipelago' &&
				VOLCANOES.some(
					([volcanoRow, volcanoCol]) =>
						volcanoRow === row && volcanoCol === col
				)
			) {
				for (let y = 0; y < PLOT; y++) {
					for (let x = 0; x < PLOT; x++) {
						matCell.p[y * PLOT + x] =
							source.p[
								(row * PLOT + y) * source.w + col * PLOT + x
							];
					}
				}
				copyTile(canvas, matCell, col * PITCH, row * PITCH);
				continue;
			}
			if (char === 'X') {
				copyTile(canvas, openAt(row, col), col * PITCH, row * PITCH);
				continue;
			}
			if (isMat) {
				for (let y = 0; y < PLOT; y++) {
					for (let x = 0; x < PLOT; x++) {
						matCell.p[y * PLOT + x] =
							source.p[
								(row * PLOT + y) * source.w + col * PLOT + x
							];
					}
				}
				copyTile(canvas, matCell, col * PITCH, row * PITCH);
			} else {
				copyTile(canvas, openAt(row, col), col * PITCH, row * PITCH);
			}
		}
	}

	const mask = footprint(layout);
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			if (!mask.mask[y * w + x]) {
				continue;
			}
			const row = Math.min(rows - 1, Math.floor(y / PITCH));
			const col = Math.min(cols - 1, Math.floor(x / PITCH));
			setPixel(canvas, x, y, massColour(id, mask, x, y, row, col));
		}
	}
	drawDecorations(canvas, id, layout, mask);
	return canvas;
}

function makeCard(id) {
	const module = BIOMES[id];
	const index = IDS.indexOf(id) + 1;
	const source = module.drawBiomeMat();
	const specimen = drawBoard(id, SPECIMEN, null, false);
	const mat = drawBoard(id, module.LAYOUT, source, true);
	const current = toSvg(source);
	const concept = toSvg(mat);
	const sample = toSvg(specimen);
	const title = id
		.replaceAll('-', ' ')
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
	const matDimensions = `${source.w} × ${source.h} px`;

	return `<article class="card card--${id}" id="${id}">
		<header><p class="eyebrow">Landscape study · ${String(index).padStart(2, '0')} / 06</p><h2>${title}</h2><p class="description">${FEATURE_NOTES[id]}</p></header>
		<div class="pair">
			<figure><figcaption><span>01</span> Join study <small>lone · side · corner · L · 2×2</small></figcaption><div class="art specimen">${sample}</div></figure>
			<figure><figcaption><span>02</span> Capital mat <small>${matDimensions} · shown at 425 px</small></figcaption><div class="art mat">${concept}</div></figure>
		</div>
		<details><summary>Compare with the printed mat</summary><div class="art mat current">${current}</div></details>
	</article>`;
}

mkdirSync(new URL('.', OUT), { recursive: true });
const cards = IDS.map(makeCard).join('\n');
const html = `<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Issue #132 · Arts & Architecture relief sketches</title>
	<style>
		:root { color-scheme: dark; font-family: ui-sans-serif, system-ui, sans-serif; background: #15151b; color: #f2efe9; }
		* { box-sizing: border-box; }
		body { max-width: 1120px; margin: 0 auto; padding: 36px 28px 64px; }
		.hero { position: relative; overflow: hidden; padding: 34px 38px; border: 1px solid #45434b; border-radius: 18px; background: linear-gradient(120deg, #24232b 0%, #1c1c23 64%, #29252a 100%); }
		.hero::after { position: absolute; right: -24px; bottom: -96px; width: 300px; height: 190px; border: 1px solid #5b5148; border-radius: 50%; box-shadow: 0 0 0 18px #211f25, 0 0 0 19px #494039, 0 0 0 38px #211f25, 0 0 0 39px #494039; content: ''; opacity: .42; transform: rotate(-18deg); }
		.kicker, .eyebrow { color: #d7b783; font-size: 11px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
		h1 { max-width: 700px; margin: 12px 0; font-family: Georgia, serif; font-size: clamp(32px, 5vw, 48px); font-weight: 500; letter-spacing: -.035em; line-height: 1.05; }
		.intro { max-width: 730px; margin: 0; color: #c5c0ba; font-size: 15px; line-height: 1.65; }
		.review { display: inline-flex; gap: 10px; align-items: center; margin-top: 22px; padding: 9px 13px; border: 1px solid #615449; border-radius: 999px; background: #201f24; color: #e8dfd2; font-size: 12px; }
		.review b { color: #e5bc7b; }
		.index { display: flex; flex-wrap: wrap; gap: 8px; margin: 20px 0 38px; }
		.index a { padding: 7px 11px; border: 1px solid #39383f; border-radius: 999px; color: #d5d0c8; font-size: 12px; text-decoration: none; transition: background .15s, border-color .15s; }
		.index a:hover { border-color: #b4976b; background: #25232a; }
		.grid { display: grid; gap: 24px; }
		.card { --accent: #c99b65; overflow: hidden; padding: 26px; border: 1px solid #45434b; border-radius: 16px; background: linear-gradient(145deg, #24232a, #1d1d23 75%); box-shadow: 0 14px 35px #09090c44; }
		.card::before { display: block; width: 42px; height: 2px; margin-bottom: 17px; background: var(--accent); content: ''; }
		.card--archipelago { --accent: #6cb6c0; }
		.card--canyon { --accent: #d47a55; }
		.card--cavern { --accent: #a796d0; }
		.card--cloud-city { --accent: #d7d4cb; }
		.card--mesa { --accent: #e18b60; }
		.card--swamp { --accent: #92a879; }
		.card header { max-width: 780px; }
		.eyebrow { margin: 0 0 8px; color: var(--accent); }
		.card h2 { margin: 0 0 7px; font-family: Georgia, serif; font-size: 30px; font-weight: 500; letter-spacing: -.025em; text-transform: capitalize; }
		.description { margin: 0; color: #c5c0ba; line-height: 1.55; }
		.pair { display: flex; flex-wrap: wrap; align-items: start; gap: 22px; margin-top: 22px; }
		figure { width: min(100%, 425px); margin: 0; }
		figcaption { min-height: 42px; color: #eee8dd; font-size: 13px; font-weight: 650; }
		figcaption span { display: inline-grid; width: 23px; height: 23px; margin-right: 7px; place-items: center; border: 1px solid var(--accent); border-radius: 50%; color: var(--accent); font-size: 10px; }
		figcaption small { display: block; margin: 4px 0 0 33px; color: #aaa59f; font-size: 11px; font-weight: 400; }
		.art { display: flex; justify-content: center; padding: 12px; border: 1px solid #444149; border-radius: 10px; background: #121218; box-shadow: inset 0 1px #ffffff0a, 0 8px 18px #09090c55; }
		.art svg { display: block; width: 100%; height: auto; image-rendering: pixelated; }
		.mat, .current { max-width: 425px; }
		.specimen { max-width: 425px; }
		details { margin-top: 18px; color: #d5d0c8; }
		details summary { display: inline-flex; cursor: pointer; color: var(--accent); font-size: 12px; }
		.current { margin-top: 10px; }
		.footer { margin-top: 28px; color: #99949c; font-size: 12px; line-height: 1.6; }
		@media (max-width: 560px) { body { padding: 16px 14px 40px; } .hero { padding: 26px 22px; } .card { padding: 20px 16px; } .pair { gap: 18px; } }
	</style>
</head>
<body>
	<header class="hero">
		<p class="kicker">Arts & Architecture · visual review</p>
		<h1>Six landscapes.<br>One connected world.</h1>
		<p class="intro">Relief concepts for the six advanced capital mats. Each study tests how joined impassable plots can become a single place with its own material, light and silhouette—while keeping the printed mat's defining features intact.</p>
		<div class="review"><b>Concepts only</b><span>Final art and implementation wait for approval.</span></div>
	</header>
	<nav class="index">${IDS.map((id) => `<a href="#${id}">${id.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())}</a>`).join('')}</nav>
	<main class="grid">${cards}</main>
	<p class="footer">Each specimen uses the same nine-by-nine join study: lone plot, side pair, both corner joins, L and 2×2. Capital mats are compared at the 425 px player-tab width; the original printed artwork is available under each concept.</p>
</body>
</html>`;
writeFileSync(OUT, html);
console.log(`Wrote ${OUT.pathname}`);
