// Throwaway sketches of the six Fantasies & Futures reliefs (#133), on the #82 relief pipeline and #132's pieces. Not run by the build or the tests.
// Run from the repository: node docs/art/issue-133/spike.mjs <out dir>. It writes each biome's specimen sheet and real mat as SVG, and
// sketches.html, which shows them beside today's example mat. The mats' printed features are drawn with their own sprites, as a layer
// above the relief (below it for the Quagmire's reeds); the inner sprite functions are loaded from a copy of each biome module in <out dir>.
// The owner approved round 1 on 2026-11-06: "Polar B is better. Everything else looks okay." So Polar is `polar-ridges` (option B, the
// Mountain's ridges in ice), and `polar` (option A, blocky seracs) was not chosen. The approved pictures are docs/art/issue-133/approved-*.png.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const REPO = new URL('../../..', import.meta.url).pathname.replace(/\/$/, '');
const OUT = resolve(process.argv[2] ?? 'out');
mkdirSync(OUT, { recursive: true });
const lib = (/** @type {string} */ p) => import(`${REPO}/${p}`);

const { createCanvas, overlay, toSvg, seededRandom, rect, mix } = await lib('src/lib/art/paint/painter.js');
const { PALETTE: C } = await lib('src/lib/art/paint/palette.js');
const { PLOT, PITCH } = await lib('src/lib/art/relief.js');
const { footprint, distanceInside, withCornerPatches, isImpassable } = await lib('src/lib/art/paint/relief/footprint.js');
const { BAYER, hash, noise } = await lib('src/lib/art/paint/relief/ground.js');
const { put, cast } = await lib('src/lib/art/paint/relief/canvas.js');
const { drawFloor } = await lib('tools/art/parts/capital-relief/floor.js');
const { drawMound, edgeMounds } = await lib('tools/art/parts/capital-relief/mounds.js');
const { frontToBack } = await lib('tools/art/parts/capital-relief/pack.js');
const { rockShape, drawRock, rowPixels, dither } = await lib('tools/art/parts/capital-relief/rock.js');
const { SPECIMEN_LAYOUT } = await lib('tools/art/parts/capital-relief/index.js');

/**
 * A module with some of its inner functions exported too: a copy in OUT whose relative imports point at the repository.
 * @param {string} file
 * @param {string[]} names
 */
async function internals(file, names) {
	const path = `${REPO}/${file}`;
	const here = pathToFileURL(path);
	const src =
		readFileSync(path, 'utf8').replace(/from '(\.{1,2}\/[^']+)'/g, (_, p) => `from '${new URL(p, here).href}'`) +
		`\nexport { ${names.join(', ')} };\n`;
	const copy = join(OUT, `_${basename(file)}`);
	writeFileSync(copy, src);
	return import(pathToFileURL(copy).href);
}

const BIOME = 'tools/art/parts/capital-biomes';
const Q = await internals(`${BIOME}/quagmire.js`, ['wisp', 'reed']);
const V = await internals(`${BIOME}/veil.js`, ['drawVeil', 'drawIcon']);
const S = await internals(`${BIOME}/savanna.js`, ['unicorn']);
const P = await internals(`${BIOME}/polar.js`, ['dashed', 'ring', 'LINES']);
const N = await internals(`${BIOME}/netherworld.js`, ['drawImp', 'drawCentre']);

// ---------- Shared pieces ----------

const centre = (/** @type {number} */ n) => n * PITCH + PLOT / 2;

/** The footprint's water: deeper inside than a wobbling shore. */
function pool(fp, seed, depthMin, wobbleBy) {
	const { w: W, h: H, mask } = fp;
	const depth = distanceInside(mask, W, H);
	const wobble = noise(seed + 6, 4);
	const water = new Uint8Array(W * H);
	for (let i = 0; i < W * H; i++) {
		if (mask[i] && depth[i] > depthMin + wobble(i % W, (i / W) | 0) * wobbleBy) water[i] = 1;
	}
	return { water, depth };
}

/**
 * Rocks packed into the footprint from the front back, biggest first, and an outcrop over each corner join.
 * @param {any} fp
 * @param {number} seed
 * @param {any} style - A rock.js RockStyle
 * @param {{ sizes?: number[], butteFrom?: number, tall?: number[], corner?: any[], ok?: Uint8Array, base?: (i: number) => boolean, fresh?: number }} [o]
 */
function packRocks(fp, seed, style, o = {}) {
	const { w: W, h: H, mask, reach, corners } = fp;
	const ok = o.ok ?? fp.plots;
	const sizes = o.sizes ?? [18, 14, 11, 8, 6, 4];
	const butteFrom = o.butteFrom ?? 9;
	const tall = o.tall ?? [0.95, 0.6];
	const rand = seededRandom(hash(seed, 23));
	const covered = new Uint8Array(W * H);
	/** @type {{ s: any, ok: Uint8Array }[]} */
	const rocks = [];
	const fresh = (s, area) => {
		let n = 0;
		let total = 0;
		for (const [x, y] of rowPixels(s.rows)) {
			if (x < 0 || y < 0 || x >= W || y >= H || !area[y * W + x]) return -1;
			total++;
			if (mask[y * W + x] && !covered[y * W + x]) n++;
		}
		return n / total;
	};
	const add = (s, area) => {
		rocks.push({ s, ok: area });
		for (const [x, y] of rowPixels(s.rows)) covered[y * W + x] = 1;
	};
	for (const { gx, gy, down } of corners) {
		const f = down ? 1 : -1;
		for (const [kind, dx, dy, hw, ph] of o.corner ?? [
			['butte', 0, 9, 9, 15],
			['boulder', -6, 11, 4, 4],
		]) {
			const s = rockShape({ kind, bx: gx + dx * f, by: gy + dy, hw, ph }, seed, style);
			if (fresh(s, reach) >= 0) add(s, reach);
		}
	}
	for (const hw of sizes) {
		const butte = hw >= butteFrom;
		for (const [bx, by] of frontToBack(W, H, rand)) {
			const i = by * W + bx;
			if (!mask[i] || (o.base && !o.base(i))) continue;
			const t = rand();
			const ph = butte ? Math.round(Math.min(hw * (tall[0] + t * tall[1]), 10 + hw * 0.8)) : Math.round(hw * (0.8 + t * 0.2));
			if (bx - hw < 0 || bx + hw >= W || by - ph < 0 || !ok[i - hw] || !ok[i + hw] || !ok[(by - ph) * W + bx]) continue;
			const s = rockShape({ kind: butte ? 'butte' : 'boulder', bx, by, hw, ph }, seed, style);
			if (fresh(s, ok) < (o.fresh ?? 0.65)) continue;
			add(s, ok);
		}
	}
	return rocks;
}

/** Shards in a cluster, each lit on the left, outlined, standing on a dark foot. */
function drawShards(canvas, { cx, by, h }, ok, [light, mid, dark], outline) {
	for (let dy = -2; dy <= 2; dy++) {
		for (let dx = -6; dx <= 6; dx++) {
			if ((dx * dx) / 36 + (dy * dy) / 4 <= 1 && dither(cx + dx, by + dy) > 0.1) put(canvas, ok, cx + dx, by + dy, dark);
		}
	}
	for (const [x0, b0, hw, hh, lean] of [
		[cx - 4, by, 2, Math.round(h * 0.55), -2],
		[cx - 1, by + 1, 2, Math.round(h * 0.85), -1],
		[cx + 4, by, 2, Math.round(h * 0.6), 2],
		[cx + 1, by + 2, 3, h, 0],
	]) {
		for (let t = 0; t <= hh; t++) {
			const half = Math.round(hw * (1 - t / (hh + 1)));
			const x = x0 + Math.round((lean * t) / 5);
			for (let dx = -half - 1; dx <= half + 1; dx++) {
				const edge = Math.abs(dx) === half + 1 || t === hh;
				put(canvas, ok, x + dx, b0 - t, edge ? outline : dx < 0 ? light : dx === 0 ? mid : dark);
			}
		}
		put(canvas, ok, x0 + Math.round((lean * hh) / 5), b0 - hh - 1, outline);
	}
}

/** A natural ground: three tones over two noises, and small things lying on it. */
function drawGround(canvas, g, variant, x, y) {
	const seed = hash(g.seed, variant);
	const broad = noise(seed + 7, 6);
	const fine = noise(seed + 8, 3);
	const rand = seededRandom(hash(seed, 41));
	const at = (px, py, col) => {
		if (px >= 0 && py >= 0 && px < PLOT && py < PLOT) canvas.p[(y + py) * canvas.w + x + px] = col;
	};
	for (let py = 0; py < PLOT; py++) {
		for (let px = 0; px < PLOT; px++) {
			const n = broad(px, py) * 0.6 + fine(px, py) * 0.4 + BAYER[(py % 4) * 4 + (px % 4)] * 0.1;
			at(px, py, n > 0.74 ? g.light : n < 0.24 ? g.dark : g.base);
		}
	}
	for (let i = 0; i < 14; i++) g.scatter(at, Math.floor(rand() * PLOT), Math.floor(rand() * PLOT), rand(), rand);
}

const GROUNDS = {
	quagmire: {
		seed: 8101,
		base: C.quagMud,
		light: C.quagMudLight,
		dark: C.quagMudShade,
		scatter: (at, px, py, roll, rand) => {
			if (roll < 0.3) {
				at(px, py, C.quagMoss);
				at(px + 1, py, C.quagMossLight);
			} else if (roll < 0.45) {
				const n = 3 + Math.floor(rand() * 3);
				for (let i = 0; i < n; i++) at(px + i, py, i === 1 ? C.quagPuddleLight : C.quagPuddle);
			} else if (roll < 0.65) {
				at(px, py, C.quagReedShade);
				at(px - 1, py - 1, C.quagReed);
				at(px + 1, py - 1, C.quagReedShade);
			}
		},
	},
	bottle: {
		seed: 8202,
		base: C.bottleSand,
		light: C.bottleSandLight,
		dark: C.bottleSandShade,
		scatter: (at, px, py, roll) => {
			if (roll < 0.3) {
				at(px, py, C.bottlePebbleLight);
				at(px + 1, py, C.bottlePebble);
			} else if (roll < 0.45) {
				at(px, py, C.bottleGlassLight);
				at(px + 1, py + 1, C.bottleGlass);
			} else if (roll < 0.6) {
				for (let i = 0; i < 4; i++) at(px + i, py, C.bottleSandShade);
			}
		},
	},
	worldly: {
		seed: 8303,
		base: C.veilMeadow,
		light: C.veilMeadowLight,
		dark: C.veilMeadowShade,
		scatter: (at, px, py, roll) => {
			if (roll < 0.25) {
				at(px, py, C.creamLight);
				at(px, py + 1, C.veilMeadowShade);
			} else if (roll < 0.4) {
				at(px, py, C.amber);
			} else if (roll < 0.7) {
				at(px, py, C.veilMeadowShade);
				at(px - 1, py - 1, C.veilMeadowLight);
				at(px + 1, py - 1, C.veilMeadowShade);
			}
		},
	},
	charmed: {
		seed: 8404,
		base: C.veilNight,
		light: C.veilNightLight,
		dark: C.veilNightShade,
		scatter: (at, px, py, roll) => {
			if (roll < 0.3) {
				at(px, py, C.ghostLight);
			} else if (roll < 0.5) {
				at(px, py, C.arcaneLight);
				at(px + 1, py, C.arcane);
			} else if (roll < 0.7) {
				at(px, py, C.veilNightLight);
				at(px - 1, py - 1, C.arcaneShade);
			}
		},
	},
	dust: {
		seed: 8505,
		base: C.savannaDust,
		light: C.savannaDustLight,
		dark: C.savannaDustShade,
		scatter: (at, px, py, roll) => {
			if (roll < 0.35) {
				at(px, py, C.stoneLight);
				at(px + 1, py, C.stoneShade);
			} else if (roll < 0.6) {
				at(px, py, C.savannaDryBlade);
				at(px + 1, py - 1, C.savannaDustShade);
			}
		},
	},
	gold: {
		seed: 8606,
		base: C.savannaGold,
		light: C.savannaGoldLight,
		dark: C.savannaGoldShade,
		scatter: (at, px, py, roll) => {
			if (roll < 0.55) {
				at(px, py, C.savannaDryBlade);
				at(px - 1, py - 1, C.savannaGoldLight);
				at(px + 1, py - 1, C.savannaDryBlade);
			} else if (roll < 0.7) {
				at(px, py, C.stoneLight);
			}
		},
	},
	snow: {
		seed: 8707,
		base: C.snow,
		light: C.white,
		dark: C.snowShade,
		scatter: (at, px, py, roll, rand) => {
			if (roll < 0.35) {
				const n = 3 + Math.floor(rand() * 4);
				for (let i = 0; i < n; i++) at(px + i, py + (i > 1 ? 1 : 0), C.iceMid);
			} else if (roll < 0.5) {
				at(px, py, C.stoneLight);
				at(px + 1, py, C.stoneShade);
			} else if (roll < 0.7) {
				at(px, py, C.iceLight);
			}
		},
	},
	nether: {
		seed: 8808,
		base: C.hellRock,
		light: C.hellRockLight,
		dark: C.hellRockShade,
		scatter: (at, px, py, roll, rand) => {
			if (roll < 0.3) {
				const n = 3 + Math.floor(rand() * 4);
				for (let i = 0; i < n; i++) at(px + i, py + (i % 3 === 2 ? 1 : 0), i === 1 ? C.lava : C.ember);
			} else if (roll < 0.45) {
				at(px, py, C.creamShade);
				at(px + 1, py, C.cream);
			} else if (roll < 0.65) {
				at(px, py, C.hellRockDeep);
				at(px + 1, py, C.hellRockShade);
			}
		},
	},
};

/** Draws a 32-pixel-pitch layer, as the example mats are drawn, onto the relief's 33-pixel pitch. */
function repitch(src, dst) {
	for (let y = 0; y < src.h; y++) {
		for (let x = 0; x < src.w; x++) {
			const col = src.p[y * src.w + x];
			if (!col) continue;
			const X = x + Math.floor(x / PLOT);
			const Y = y + Math.floor(y / PLOT);
			if (X < dst.w && Y < dst.h) dst.p[Y * dst.w + X] = col;
		}
	}
}

/** A 32×32 sprite drawn by `draw`, put on a plot of the relief's canvas. */
function onPlot(canvas, r, c, draw) {
	const tile = createCanvas(PLOT, PLOT);
	draw(tile);
	for (let y = 0; y < PLOT; y++) {
		for (let x = 0; x < PLOT; x++) {
			const col = tile.p[y * PLOT + x];
			if (col) canvas.p[(r * PITCH + y) * canvas.w + c * PITCH + x] = col;
		}
	}
}

// ---------- Quagmire: a scummed bog, cattails, sunken logs and the wisps ----------

const QUAG_DARKER = {
	[C.quagMudLight]: C.quagMud,
	[C.quagMud]: C.quagMudShade,
	[C.quagMudShade]: C.quagPeat,
	[C.quagWater]: C.quagWaterDeep,
	[C.quagSlime]: C.quagWater,
	[C.quagMoss]: C.quagMudShade,
};
const PEAT = [C.quagMossLight, C.quagMoss, C.quagMudShade, C.quagPeat, C.quagPeat];

function paintQuagmire(canvas, fp, seed, data) {
	const { w: W, h: H, mask, plots } = fp;
	drawFloor(canvas, withCornerPatches(fp, 8), seed, (roll) => (roll < 0.3 ? C.quagPeat : roll < 0.45 ? C.quagMoss : C.quagMudShade));
	const { water, depth } = pool(fp, seed, 2.5, 4);
	const scum = noise(seed + 9, 6);
	const ripple = noise(seed + 8, 4);
	for (let i = 0; i < water.length; i++) {
		if (!water[i]) continue;
		const x = i % W;
		const y = (i / W) | 0;
		let col;
		if (!water[i - W]) col = C.quagPeat;
		else if (!water[i - 2 * W]) col = dither(x, y) > 0 ? C.quagPeat : C.quagWaterDeep;
		else if (!water[i + W]) col = C.quagMudShade;
		else {
			const s = scum(x, y) + dither(x, y) * 0.15;
			const n = ripple(x / 2, y) + dither(x, y) * 0.12;
			col = s > 0.66 ? (s > 0.78 ? C.quagWeed : C.quagSlime) : n > 0.68 ? C.quagWaterLight : n < 0.3 ? C.quagWaterDeep : C.quagWater;
		}
		put(canvas, water, x, y, col);
	}
	const rand = seededRandom(hash(seed, 3));
	const scene = [];
	// Half-sunk logs lying across the water.
	for (let i = 0; i < W * H; i += 11) {
		const x = i % W;
		const y = (i / W) | 0;
		if (!water[i] || depth[i] < 7 || hash(x, y, 2) % 9 !== 0) continue;
		const len = 7 + (hash(x, y) % 6);
		if (!water[i + len] || !water[i + len - W]) continue;
		scene.push({
			by: y,
			draw: () => {
				for (let k = 0; k < len; k++) {
					put(canvas, water, x + k, y - 1, k === 0 ? C.timberLight : C.timber);
					put(canvas, water, x + k, y, k % 4 === 1 ? C.quagMoss : C.timberShade);
				}
				put(canvas, water, x + len, y - 1, C.timberShade);
			},
		});
	}
	// Cattails thick on the far banks and in tufts on the near ones.
	for (let i = W; i < W * H - 3 * W; i += 2) {
		const x = i % W;
		const y = (i / W) | 0;
		if (!mask[i] || water[i]) continue;
		const far = water[i + W] && water[i + 3 * W];
		if ((far && hash(x, y, 9) % 2 === 0) || (water[i - 2 * W] && hash(x, y, 9) % 17 === 0)) {
			scene.push({
				by: y,
				draw: () => {
					for (let k = 0; k < 2; k++) {
						const h = (far ? 8 : 5) + Math.floor(rand() * 4);
						const lean = rand() < 0.5 ? -1 : 1;
						for (let t = 0; t < h; t++) put(canvas, plots, x + k * 2 + (t > h - 3 ? lean : 0), y - t, t < 2 ? C.quagReedShade : k ? C.quagReed : C.swampReed);
						if (rand() < 0.6) {
							put(canvas, plots, x + k * 2 + lean, y - h, C.quagCattail);
							put(canvas, plots, x + k * 2 + lean, y - h - 1, C.quagCattail);
						}
					}
				},
			});
		}
	}
	for (const m of edgeMounds(fp, seed, [5, 4, 3, 2])) {
		scene.push({ by: m.by, draw: () => drawMound(canvas, m, PEAT, QUAG_DARKER, [C.quagMossLight, C.quagMoss]) });
	}
	scene.sort((a, b) => a.by - b.by).forEach((s) => s.draw());
	// Each wisp floats over its plot's water, its light falling on the scum below.
	for (const [r, c] of data.wisps ?? []) {
		const cx = centre(c);
		const cy = centre(r) - 2;
		for (let dy = 6; dy <= 10; dy++) {
			for (let dx = -6; dx <= 6; dx++) {
				if ((dx * dx) / 36 + ((dy - 8) * (dy - 8)) / 4 <= 1 && (dx + dy) % 2 === 0) put(canvas, water, cx + dx, cy + dy, C.quagWaterLight);
			}
		}
		Q.wisp(canvas, cx, cy);
	}
}

function quagmireReeds(canvas, reeds) {
	for (const [r, c] of reeds) {
		onPlot(canvas, r, c, (tile) => {
			const rr = seededRandom(hash(r, c, 61));
			for (let i = 0; i < 9; i++) Q.reed(tile, 4 + Math.floor(rr() * 22), 20 + Math.floor(rr() * 10), 7 + Math.floor(rr() * 6), i % 3 === 0, Math.floor(rr() * 5) - 2);
		});
	}
}

// ---------- City in a Bottle: reefs of rock, coral and sea glass on the sand ----------

const BOTTLE_ROCK = {
	tones: [C.bottleRockLight, C.bottleRockLight, C.bottleRock, C.bottleRockShade, C.bottleOutline],
	darker: {
		[C.bottleSandLight]: C.bottleSand,
		[C.bottleSand]: C.bottleSandShade,
		[C.bottleSandShade]: C.bottleSandDark,
		[C.bottleRockLight]: C.bottleRock,
		[C.bottleRock]: C.bottleRockShade,
		[C.bottleRockShade]: C.bottleOutline,
		[C.bottleMoss]: C.bottleMossDark,
	},
	foot: [C.bottleSandLight, C.bottleSand, C.bottleSand, C.bottleSandShade],
	rim: C.bottleOutline,
	top: { rim: C.bottleRockLight, light: C.bottleMoss, base: C.bottleMossDark, scrub: C.bottleMoss },
	width: [0.5, 0.2],
	cap: 0.25,
	knee: [0.55, 0.15],
	slope: 0.16,
	strata: false,
};

function drawCoral(canvas, ok, bx, by, h, rand) {
	const tips = [];
	const grow = (x, y, len, dir) => {
		for (let t = 0; t < len; t++) {
			put(canvas, ok, x, y, t < 1 ? C.bottleCoralShade : C.bottleCoral);
			put(canvas, ok, x + 1, y, C.bottleCoralShade);
			if (t > 1 && rand() < 0.3 && len > 3) grow(x + dir * 2, y - 1, Math.floor(len * 0.6), dir);
			y--;
			if (rand() < 0.35) x += dir;
		}
		tips.push([x, y]);
	};
	grow(bx, by, h, -1);
	grow(bx + 2, by, h - 1, 1);
	for (const [x, y] of tips) put(canvas, ok, x, y, C.bottleCoralLight);
}

function paintBottle(canvas, fp, seed) {
	const { w: W, h: H, plots, mask } = fp;
	drawFloor(canvas, withCornerPatches(fp, 8), seed, (roll) => (roll < 0.35 ? C.bottleSandShade : roll < 0.45 ? C.bottleMossDark : C.bottleSand));
	const rocks = packRocks(fp, seed, BOTTLE_ROCK, { sizes: [12, 9, 7, 5, 4], butteFrom: 99, fresh: 0.5, corner: [['boulder', 0, 10, 8, 8], ['boulder', -6, 12, 4, 4]] });
	const rand = seededRandom(hash(seed, 31));
	const scene = rocks.map(({ s, ok }) => ({ by: s.by, draw: () => drawRock(canvas, s, ok, BOTTLE_ROCK) }));
	let pieces = 0;
	for (let i = 0; i < W * H; i += 5) {
		const x = i % W;
		const y = (i / W) | 0;
		if (!mask[i] || y < 16 || hash(x, y, 4) % 26 !== 0) continue;
		const roll = pieces++ % 3;
		scene.push({
			by: y + 1,
			draw: () =>
				roll === 0
					? drawShards(canvas, { cx: x, by: y, h: 11 + (hash(x, y) % 5) }, plots, [C.bottleGlassLight, C.bottleGlass, C.bottleGlassDeep], C.bottleOutline)
					: drawCoral(canvas, plots, x, y, 9 + (hash(x, y) % 5), rand),
		});
	}
	for (const m of edgeMounds(fp, seed, [5, 3, 3, 2])) {
		scene.push({ by: m.by, draw: () => drawMound(canvas, m, [C.bottleSandLight, C.bottleSandLight, C.bottleSand, C.bottleSandShade, C.bottleSandDark], BOTTLE_ROCK.darker, [C.cream, C.creamShade]) });
	}
	scene.sort((a, b) => a.by - b.by).forEach((s) => s.draw());
}

/** The bottle's glass: a teal rim, a long reflection down the left and glints at the bottom right, tinting what is under it. */
function bottleGlass(mat) {
	const { w, h } = mat;
	const tint = (x, y, col, t) => {
		const i = y * w + x;
		if (mat.p[i]) mat.p[i] = mix(mat.p[i], col, t);
	};
	for (let i = 0; i < w; i++) {
		tint(i, 0, C.bottleGlassDeep, 0.55);
		tint(i, h - 1, C.bottleGlassDeep, 0.55);
		tint(i, 1, C.bottleGlass, 0.25);
		tint(i, h - 2, C.bottleGlass, 0.25);
	}
	for (let j = 0; j < h; j++) {
		tint(0, j, C.bottleGlassDeep, 0.55);
		tint(w - 1, j, C.bottleGlassDeep, 0.55);
		tint(1, j, C.bottleGlass, 0.25);
		tint(w - 2, j, C.bottleGlass, 0.25);
	}
	for (let j = 14; j < 74; j++) {
		if (j % 11 < 8) {
			tint(2, j, C.white, 0.55);
			tint(3, j, C.white, 0.25);
		}
	}
	for (let i = 8; i < 30; i++) tint(i, 2, C.white, 0.4);
	for (let i = 0; i < 5; i++) {
		tint(w - 3, h - 14 - i, C.white, 0.45);
		tint(w - 4 - i, h - 3, C.white, 0.45);
	}
}


// ---------- Veil: stone and bramble on the worldly side, crystals and glowing mushrooms on the charmed side ----------

const VEIL_STONE = {
	tones: [C.stoneLight, C.stoneLight, C.stone, C.stoneMid, C.stoneShade],
	darker: {
		[C.veilMeadowLight]: C.veilMeadow,
		[C.veilMeadow]: C.veilMeadowShade,
		[C.stoneLight]: C.stone,
		[C.stone]: C.stoneMid,
		[C.stoneMid]: C.stoneShade,
		[C.pine]: C.pineShade,
	},
	foot: [C.veilMeadowLight, C.veilMeadow, C.veilMeadow, C.veilMeadowShade],
	rim: C.stoneShade,
	top: { rim: C.veilMeadowLight, light: C.veilMeadowLight, base: C.veilMeadow, scrub: C.pine },
	width: [0.5, 0.2],
	cap: 0.25,
	knee: [0.55, 0.15],
	slope: 0.14,
	strata: false,
};
const NIGHT_DARKER = {
	[C.veilNightLight]: C.veilNight,
	[C.veilNight]: C.veilNightShade,
	[C.arcaneLight]: C.arcane,
	[C.arcane]: C.arcaneShade,
};
const BRAMBLE = [C.veilMeadowLight, C.pineLight, C.pine, C.pineShade, C.veilMeadowShade];
const MOSS_NIGHT = [C.veilNightLight, C.veilNightLight, C.veilNight, C.veilNightShade, C.veilNightShade];

/** A giant toadstool: a pale stem and a violet cap with glowing spots. */
function drawMushroom(canvas, ok, bx, by, h, r) {
	for (let t = 0; t < h; t++) {
		put(canvas, ok, bx - 1, by - t, C.creamLight);
		put(canvas, ok, bx, by - t, C.cream);
		put(canvas, ok, bx + 1, by - t, C.creamShade);
	}
	const top = by - h;
	for (let y = -Math.round(r * 0.7); y <= 1; y++) {
		const half = Math.round(r * Math.sqrt(Math.max(0, 1 - (y * y) / (r * r * 0.49))));
		for (let x = -half; x <= half; x++) {
			const edge = y === 1 || Math.abs(x) === half;
			put(canvas, ok, bx + x, top + y, edge ? C.arcaneShade : x < -half / 3 && y < 0 ? C.arcaneLight : C.arcane);
		}
	}
	for (const [dx, dy] of [[-2, -2], [2, -1], [0, -3], [-4, 0], [4, 0]]) put(canvas, ok, bx + dx, top + dy, C.ghostLight);
}

function paintVeil(canvas, fp, seed, data) {
	const { w: W, h: H, mask, plots, reach } = fp;
	const charmedAt = (x, y) => data.charmed(Math.floor(y / PITCH), Math.floor(x / PITCH));
	const side = (want) => {
		const a = new Uint8Array(W * H);
		for (let i = 0; i < W * H; i++) a[i] = charmedAt(i % W, (i / W) | 0) === want ? 1 : 0;
		return a;
	};
	const charmed = side(true);
	const worldly = side(false);
	const and = (a, b) => a.map((v, i) => v & b[i]);
	const patches = withCornerPatches(fp, 8);
	drawFloor(canvas, and(patches, worldly), seed, (roll) => (roll < 0.35 ? C.veilMeadowShade : C.veilMeadow));
	drawFloor(canvas, and(patches, charmed), seed, (roll) => (roll < 0.35 ? C.veilNightShade : roll < 0.45 ? C.arcaneShade : C.veilNight));
	const okW = and(plots, worldly);
	const okC = and(plots, charmed);
	const fpW = { ...fp, mask: and(mask, worldly), plots: okW, reach: and(reach, worldly) };
	const rocks = packRocks(fpW, seed, VEIL_STONE, { sizes: [16, 12, 9, 7, 5], butteFrom: 11, tall: [0.7, 0.4], fresh: 0.6 });
	const scene = rocks.map(({ s, ok }) => ({ by: s.by, draw: () => drawRock(canvas, s, ok, VEIL_STONE) }));
	for (const m of edgeMounds(fp, seed, [6, 4, 4, 3])) {
		const night = charmedAt(m.bx, m.by);
		const area = and(m.area, night ? charmed : worldly);
		scene.push({ by: m.by, draw: () => drawMound(canvas, { ...m, area }, night ? MOSS_NIGHT : BRAMBLE, night ? NIGHT_DARKER : VEIL_STONE.darker, night ? [C.ghostLight, C.arcaneLight] : [C.brickRedLight, C.brickRed]) });
	}
	// The charmed side: crystal clusters and giant toadstools, the biggest in front.
	const rand = seededRandom(hash(seed, 37));
	const taken = new Uint8Array(W * H);
	for (const [bx, by] of frontToBack(W, H, rand)) {
		const i = by * W + bx;
		if (!okC[i] || taken[i] || by < 16) continue;
		const mush = rand() < 0.45;
		const r = mush ? 5 + Math.floor(rand() * 4) : 6;
		let room = true;
		for (let y = by - 18; y <= by + 1 && room; y += 2) for (let x = bx - r - 1; x <= bx + r + 1; x += 2) if (x < 0 || y < 0 || x >= W || !okC[y * W + x] || taken[y * W + x]) room = false;
		if (!room) continue;
		for (let y = by - 6; y <= by + 2; y++) for (let x = bx - r; x <= bx + r; x++) if (x >= 0 && x < W && y < H) taken[y * W + x] = 1;
		scene.push({
			by,
			draw: () => (mush ? drawMushroom(canvas, okC, bx, by, 6 + Math.floor(rand() * 6), r) : drawShards(canvas, { cx: bx, by, h: 11 + Math.floor(rand() * 6) }, okC, [C.arcaneLight, C.arcane, C.arcaneShade], C.ink)),
		});
	}
	scene.sort((a, b) => a.by - b.by).forEach((s) => s.draw());
}

// ---------- Savanna: granite kopjes and acacias in dry grass, with a clearing for each herd ----------

const GRANITE = {
	tones: [C.creamLight, C.stoneLight, C.stone, C.stoneMid, C.stoneShade],
	darker: {
		[C.savannaGoldLight]: C.savannaGold,
		[C.savannaGold]: C.savannaGoldShade,
		[C.savannaDustLight]: C.savannaDust,
		[C.savannaDust]: C.savannaDustShade,
		[C.stoneLight]: C.stone,
		[C.stone]: C.stoneMid,
		[C.stoneMid]: C.stoneShade,
		[C.creamLight]: C.stoneLight,
	},
	foot: [C.savannaGoldLight, C.savannaGold, C.savannaGold, C.savannaGoldShade],
	rim: C.stoneShade,
	top: null,
	width: [0.45, 0.2],
	cap: 0.3,
	knee: [0.5, 0.15],
	slope: 0.18,
	strata: false,
};
const GRASS_MOUND = [C.savannaGoldLight, C.savannaGoldLight, C.savannaGold, C.savannaGoldShade, C.savannaDustShade];

function drawAcacia(canvas, ok, bx, by, h, hw) {
	for (let t = 0; t < h; t++) {
		const x = bx + (t > h * 0.5 ? 1 : 0);
		put(canvas, ok, x, by - t, C.timberShade);
		if (t < h * 0.4) put(canvas, ok, x + 1, by - t, C.timber);
	}
	put(canvas, ok, bx - 2, by - h + 2, C.timberShade);
	put(canvas, ok, bx - 3, by - h + 1, C.timberShade);
	put(canvas, ok, bx + 3, by - h + 1, C.timberShade);
	const top = by - h;
	for (let y = -4; y <= 1; y++) {
		const half = Math.round(hw * (y === -4 ? 0.55 : y === -3 ? 0.85 : y === 1 ? 0.75 : 1));
		for (let x = -half; x <= half; x++) {
			const col = y === 1 ? C.pineShade : y <= -3 ? C.pineLight : x > half * 0.4 ? C.pineShade : dither(bx + x, top + y) > 0.25 ? C.pineLight : C.pine;
			put(canvas, ok, bx + x + 1, top + y, col);
		}
	}
	for (let dx = -hw; dx <= hw; dx++) if (dither(bx + dx, by + 1) < 0.2) cast(canvas, bx + dx + 3, by + 1, 0.3, GRANITE.darker);
}

function paintSavanna(canvas, fp, seed, data) {
	const { w: W, h: H, mask, plots } = fp;
	const herd = new Uint8Array(W * H);
	for (const [r, c] of data.unicorns ?? []) {
		for (let y = r * PITCH - 2; y < r * PITCH + PLOT + 2; y++) for (let x = c * PITCH - 2; x < c * PITCH + PLOT + 2; x++) if (x >= 0 && y >= 0 && x < W && y < H) herd[y * W + x] = 1;
	}
	const ok = plots.map((v, i) => (v && !herd[i] ? 1 : 0));
	drawFloor(canvas, withCornerPatches(fp, 8), seed, (roll) => (roll < 0.3 ? C.savannaGoldShade : C.savannaGold));
	const rocks = packRocks({ ...fp, plots: ok }, seed, GRANITE, { sizes: [13, 10, 8, 6, 4], butteFrom: 99, fresh: 0.5, base: (i) => !herd[i] });
	const scene = rocks.map(({ s, ok: area }) => ({ by: s.by, draw: () => drawRock(canvas, s, area, GRANITE) }));
	const rand = seededRandom(hash(seed, 51));
	for (let r = 0; r < fp.rows; r++) {
		for (let c = 0; c < fp.cols; c++) {
			const i = (r * PITCH + 16) * W + c * PITCH + 16;
			if (!plots[i] || herd[i] || hash(r, c, seed) % 2) continue;
			const bx = c * PITCH + 10 + Math.floor(rand() * 12);
			const by = r * PITCH + 29;
			scene.push({ by: by + 4, draw: () => drawAcacia(canvas, ok, bx, by, 16 + Math.floor(rand() * 5), 10 + Math.floor(rand() * 3)) });
		}
	}
	for (const m of edgeMounds(fp, seed, [6, 4, 3, 3])) scene.push({ by: m.by, draw: () => drawMound(canvas, m, GRASS_MOUND, GRANITE.darker, [C.savannaDryBlade, C.savannaGoldShade]) });
	scene.sort((a, b) => a.by - b.by).forEach((s) => s.draw());
	// Tall dry grass in each herd's clearing.
	for (let i = 0; i < W * H; i += 3) {
		if (!herd[i] || !mask[i] || hash(i, 7) % 3) continue;
		const x = i % W;
		const y = (i / W) | 0;
		put(canvas, plots, x, y, C.savannaDryBlade);
		put(canvas, plots, x, y - 1, C.savannaGoldLight);
	}
}

/** The districts' brass borders, on the outer edge of their plots. */
function savannaBorders(canvas, districts) {
	for (let r = 0; r < districts.length; r++) {
		for (let c = 0; c < districts[0].length; c++) {
			const d = districts[r][c];
			if (d === '.') continue;
			const x = c * PITCH;
			const y = r * PITCH;
			if (districts[r][c + 1] !== d) rect(canvas, x + 31, y, 1, PLOT, C.brass);
			if (districts[r][c - 1] !== d) rect(canvas, x, y, 1, PLOT, C.brass);
			if (districts[r + 1]?.[c] !== d) rect(canvas, x, y + 31, PLOT, 1, C.brass);
			if (districts[r - 1]?.[c] !== d) rect(canvas, x, y, PLOT, 1, C.brass);
		}
	}
}

// ---------- Polar: ice seracs and spires round leads of dark open water, in snowdrifts ----------

const ICE = {
	tones: [C.white, C.iceLight, C.ice, C.iceShade, C.iceDeep],
	darker: {
		[C.white]: C.snow,
		[C.snow]: C.snowShade,
		[C.snowShade]: C.iceMid,
		[C.iceLight]: C.ice,
		[C.ice]: C.iceShade,
		[C.iceShade]: C.iceDeep,
		[C.nightSea]: C.ink,
	},
	foot: [C.white, C.snow, C.snow, C.snowShade],
	rim: C.iceDeep,
	top: { rim: C.white, light: C.white, base: C.snow, scrub: C.snowShade },
	width: [0.5, 0.2],
	cap: 0.3,
	knee: [0.65, 0.12],
	slope: 0.06,
	strata: true,
};
const DRIFT = [C.white, C.white, C.snow, C.snowShade, C.iceMid];

function paintPolar(canvas, fp, seed) {
	const { w: W, h: H, plots } = fp;
	drawFloor(canvas, withCornerPatches(fp, 8), seed, (roll) => (roll < 0.35 ? C.snowShade : roll < 0.45 ? C.iceMid : C.snow));
	const { water } = pool(fp, seed, 9, 6);
	const lap = noise(seed + 4, 3);
	for (let i = 0; i < water.length; i++) {
		if (!water[i]) continue;
		const x = i % W;
		const y = (i / W) | 0;
		const col = !water[i - W] ? C.iceDeep : !water[i + W] ? C.white : lap(x, y) > 0.72 ? C.nightSeaLine : C.nightSea;
		put(canvas, water, x, y, col);
	}
	const bank = plots.map((v, i) => (v && !water[i] ? 1 : 0));
	const rocks = packRocks(fp, seed, ICE, { sizes: [15, 12, 9, 7, 5], butteFrom: 7, tall: [1.1, 0.7], fresh: 0.6, base: (i) => !water[i] });
	const scene = rocks.map(({ s, ok }) => ({ by: s.by, draw: () => drawRock(canvas, s, ok, ICE) }));
	const rand = seededRandom(hash(seed, 71));
	for (let i = 0; i < W * H; i += 7) {
		const x = i % W;
		const y = (i / W) | 0;
		if (!bank[i] || y < 18 || hash(x, y, 6) % 19 !== 0) continue;
		scene.push({ by: y + 1, draw: () => drawShards(canvas, { cx: x, by: y, h: 12 + Math.floor(rand() * 6) }, plots, [C.white, C.iceLight, C.ice], C.iceDeep) });
	}
	for (const m of edgeMounds(fp, seed, [6, 4, 3, 3])) scene.push({ by: m.by, draw: () => drawMound(canvas, m, DRIFT, ICE.darker) });
	scene.sort((a, b) => a.by - b.by).forEach((s) => s.draw());
}

const { paintMountains } = await lib('src/lib/art/paint/relief/mountain.js');
/** The Mountain's rock, foothills and snow, turned to blue ice and snow. */
const TO_ICE = {
	[C.stoneLight]: C.iceLight,
	[C.stone]: C.ice,
	[C.stoneMid]: C.iceMid,
	[C.stoneShade]: C.iceShade,
	[C.roofShade]: C.iceDeep,
	[C.snow]: C.white,
	[C.snowShade]: C.snow,
	[C.swampMudLight]: C.snow,
	[C.swampMud]: C.snowShade,
	[C.swampMudShade]: C.iceMid,
	[C.alpineMeadow]: C.snowShade,
	[C.bottleSand]: C.white,
	[C.bottleSandShade]: C.snowShade,
};

function paintIceRidges(canvas, fp, seed) {
	paintMountains(canvas, fp, seed);
	for (let i = 0; i < canvas.p.length; i++) {
		const col = canvas.p[i];
		if (col && (!canvas.alpha || canvas.alpha[i] === 1) && TO_ICE[col]) canvas.p[i] = TO_ICE[col];
	}
}

function polarLines(canvas, layout) {
	for (const plots of Object.values(P.LINES)) {
		for (let i = 1; i < plots.length; i++) {
			const [r0, c0] = plots[i - 1];
			const [r1, c1] = plots[i];
			const ringed = (r, c) => layout[r][c] !== 'X';
			P.dashed(canvas, centre(c0), centre(r0), centre(c1), centre(r1), ringed(r0, c0) ? 10 : 0, ringed(r1, c1) ? 10 : 0);
		}
	}
	layout.forEach((text, r) => [...text].forEach((ch, c) => ch >= 'A' && ch <= 'F' && P.ring(canvas, centre(c), centre(r))));
}

// ---------- Netherworld: basalt crags round a glowing lava pool, with bones on its banks ----------

const BASALT = {
	tones: [C.hellRockLight, C.hellRock, C.hellRockShade, C.hellRockDeep, C.ink],
	darker: {
		[C.hellRockLight]: C.hellRock,
		[C.hellRock]: C.hellRockShade,
		[C.hellRockShade]: C.hellRockDeep,
		[C.hellRockDeep]: C.ink,
		[C.lava]: C.lavaDeep,
		[C.ember]: C.lava,
		[C.amber]: C.ember,
	},
	foot: [C.hellRockLight, C.hellRock, C.hellRockShade, C.hellRockDeep],
	rim: C.ink,
	top: null,
	width: [0.25, 0.15],
	cap: 0.2,
	knee: [0.4, 0.15],
	slope: 0.2,
	strata: false,
};
const ASH = [C.hellRockLight, C.hellRockLight, C.hellRock, C.hellRockShade, C.hellRockDeep];

function drawSkull(canvas, ok, x, y) {
	for (const [dx, dy, col] of [
		[0, -2, C.creamLight], [1, -2, C.cream], [2, -2, C.creamShade],
		[-1, -1, C.creamLight], [0, -1, C.ink], [1, -1, C.cream], [2, -1, C.ink], [3, -1, C.creamShade],
		[0, 0, C.cream], [1, 0, C.creamShade], [2, 0, C.cream],
	]) put(canvas, ok, x + dx, y + dy, col);
}

function paintNetherworld(canvas, fp, seed) {
	const { w: W, h: H, plots } = fp;
	drawFloor(canvas, withCornerPatches(fp, 8), seed, (roll) => (roll < 0.3 ? C.hellRockDeep : roll < 0.4 ? C.lavaDeep : C.hellRockShade));
	const { water: lava } = pool(fp, seed, 5, 6);
	const flow = noise(seed + 12, 5);
	for (let i = 0; i < lava.length; i++) {
		if (!lava[i]) continue;
		const x = i % W;
		const y = (i / W) | 0;
		const n = flow(x / 1.5, y) + dither(x, y) * 0.15;
		const col = !lava[i - W] ? C.hellRockDeep : !lava[i + W] ? C.lavaDeep : n > 0.75 ? C.amber : n > 0.5 ? C.ember : n < 0.2 ? C.hellRockDeep : C.lava;
		put(canvas, lava, x, y, col);
	}
	const rocks = packRocks(fp, seed, BASALT, { sizes: [14, 11, 9, 7, 5, 4], butteFrom: 8, tall: [1.3, 0.8], fresh: 0.6, base: (i) => !lava[i], corner: [['butte', 0, 9, 7, 18], ['boulder', -6, 11, 4, 4]] });
	const scene = rocks.map(({ s, ok }) => ({ by: s.by, draw: () => drawRock(canvas, s, ok, BASALT) }));
	for (const m of edgeMounds(fp, seed, [5, 4, 3, 2])) scene.push({ by: m.by, draw: () => drawMound(canvas, m, ASH, BASALT.darker, [C.ember, C.lavaDeep]) });
	for (let i = 0; i < W * H; i += 13) {
		const x = i % W;
		const y = (i / W) | 0;
		if (plots[i] && !lava[i] && hash(x, y, 3) % 29 === 0) scene.push({ by: y, draw: () => drawSkull(canvas, plots, x, y) });
	}
	scene.sort((a, b) => a.by - b.by).forEach((s) => s.draw());
}

// ---------- Composing a mat ----------

function compose(layout, m, seed = 5) {
	const fp = footprint(layout);
	const relief = createCanvas(fp.w, fp.h);
	m.paint(relief, fp, seed, m.data ?? {});
	const canvas = createCanvas(fp.w, fp.h);
	canvas.p.fill(C.ink);
	const rows = layout.length;
	const cols = layout[0].length;
	for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) drawGround(canvas, m.ground(r, c), hash(r, c, 7) % 8, c * PITCH, r * PITCH);
	const copy = (x, y, fx, fy) => {
		canvas.p[y * canvas.w + x] = canvas.p[fy * canvas.w + fx];
	};
	const blocked = (r, c) => isImpassable(layout, r, c);
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			if (!blocked(r, c)) continue;
			const right = c * PITCH + PLOT;
			const below = r * PITCH + PLOT;
			for (let i = 0; i < PLOT; i++) {
				if (blocked(r, c + 1)) copy(right, r * PITCH + i, right - 1, r * PITCH + i);
				if (blocked(r + 1, c)) copy(c * PITCH + i, below, c * PITCH + i, below - 1);
			}
			if (blocked(r, c + 1) && blocked(r + 1, c) && blocked(r + 1, c + 1)) copy(right, below, right - 1, below - 1);
		}
	}
	m.under?.(canvas, layout);
	overlay(canvas, relief);
	m.over?.(canvas, layout);
	return { canvas, relief, fp };
}

const QUAG = (await lib(`${BIOME}/quagmire.js`));
const SAV = (await lib(`${BIOME}/savanna.js`));
const VEIL = (await lib(`${BIOME}/veil.js`));
const POLAR = (await lib(`${BIOME}/polar.js`));
const NETHER = (await lib(`${BIOME}/netherworld.js`));
const BOTTLE = (await lib(`${BIOME}/city-in-a-bottle.js`));

/** Specimen sheets: the veil splits it at column 4|5, so its side pair crosses the veil. */
const specimenCharmed = (_r, c) => c >= 5;

const SKETCHES = {
	quagmire: {
		title: 'Quagmire',
		layout: QUAG.LAYOUT,
		real: { paint: paintQuagmire, data: { wisps: QUAG.WISPS }, ground: () => GROUNDS.quagmire, under: (cv) => quagmireReeds(cv, QUAG.REEDS) },
		specimen: { paint: paintQuagmire, data: { wisps: [[1, 1]] }, ground: () => GROUNDS.quagmire, under: (cv) => quagmireReeds(cv, [[0, 1], [2, 1]]) },
		notes: [
			'Each group is one bog: green-scummed water, half-sunk logs, cattails on the far banks and peat hummocks on the near ones.',
			"Proposed for its features: the four will-o'-the-wisps drawn into the relief, floating over the water of their plots; the reeds stay their own art on the open plots beside a wisp.",
		],
	},
	'city-in-a-bottle': {
		title: 'City in a Bottle',
		layout: BOTTLE.LAYOUT,
		real: { paint: paintBottle, ground: () => GROUNDS.bottle, over: (cv) => bottleGlass(cv) },
		specimen: { paint: paintBottle, ground: () => GROUNDS.bottle, over: (cv) => bottleGlass(cv) },
		notes: ['Each group is one reef: rounded seabed rocks with moss on top, coral and sea-glass crystals, rising from the sand.', 'Proposed: the bottle glass (rim, reflection, glints) stays its own layer over everything.'],
	},
	veil: {
		title: 'Veil',
		layout: VEIL.LAYOUT,
		real: {
			paint: paintVeil,
			data: { charmed: VEIL.isCharmed },
			ground: (r, c) => (VEIL.isCharmed(r, c) ? GROUNDS.charmed : GROUNDS.worldly),
			over: (cv) => {
				const layer = createCanvas(9 * PLOT, 9 * PLOT);
				V.drawVeil(layer);
				V.drawIcon(layer, 'tech', 8 * PLOT + 16, 1 * PLOT + 16);
				V.drawIcon(layer, 'die', 8 * PLOT + 16, 5 * PLOT);
				V.drawIcon(layer, 'building', 5 * PLOT + 16, 8 * PLOT + 16);
				repitch(layer, cv);
			},
		},
		specimen: { paint: paintVeil, data: { charmed: specimenCharmed }, ground: (r, c) => (specimenCharmed(r, c) ? GROUNDS.charmed : GROUNDS.worldly) },
		notes: [
			'Worldly side: grey boulders with grassy tops and bramble mounds. Charmed side: violet crystal clusters and giant glowing toadstools. A group that crosses the veil changes look at the veil line.',
			'Proposed: the veil line with its sparkles, and the three pocket icons, stay their own art over the relief.',
		],
	},
	savanna: {
		title: 'Savanna',
		layout: SAV.LAYOUT,
		real: {
			paint: paintSavanna,
			data: { unicorns: SAV.UNICORNS },
			ground: (r, c) => (SAV.DISTRICTS[r][c] === '.' ? GROUNDS.dust : GROUNDS.gold),
			over: (cv) => {
				for (const [r, c] of SAV.UNICORNS) onPlot(cv, r, c, (t) => S.unicorn(t));
				savannaBorders(cv, SAV.DISTRICTS);
			},
		},
		specimen: { paint: paintSavanna, data: { unicorns: [[1, 1]] }, ground: () => GROUNDS.gold, over: (cv) => onPlot(cv, 1, 1, (t) => S.unicorn(t)) },
		notes: [
			'Each group is a kopje: piled granite boulders and flat-topped acacias in dry grass. Grey ground outside the districts, gold inside.',
			'Proposed: each unicorn herd keeps its sprite, standing in a grassy clearing the relief leaves on its plot; the brass district borders stay over everything.',
		],
	},
	polar: {
		title: 'Polar · option A',
		layout: POLAR.LAYOUT,
		real: { paint: paintPolar, ground: () => GROUNDS.snow, over: (cv, layout) => polarLines(cv, layout) },
		specimen: { paint: paintPolar, ground: () => GROUNDS.snow },
		notes: ['Each group is one frozen mass: snow-capped seracs banded with old ice, ice spires, snowdrifts at the foot, and a lead of dark open water in the bigger ones.', 'Proposed: the teal rings and the dashed field lines stay their own art over the relief, running through it as printed.'],
	},
	'polar-ridges': {
		title: 'Polar · option B',
		base: 'polar',
		layout: POLAR.LAYOUT,
		real: { paint: paintIceRidges, ground: () => GROUNDS.snow, over: (cv, layout) => polarLines(cv, layout) },
		specimen: { paint: paintIceRidges, ground: () => GROUNDS.snow },
		notes: ["Option B: the base Mountain's joined ridges and foothills, recoloured as blue ice under snow, so each group is one ice ridge. Option A above is blocky seracs."],
	},
	netherworld: {
		title: 'Netherworld',
		layout: NETHER.LAYOUT,
		real: {
			paint: paintNetherworld,
			ground: () => GROUNDS.nether,
			over: (cv, layout) =>
				layout.forEach((text, r) =>
					[...text].forEach((ch, c) => {
						if (ch === 'I') N.drawImp(cv, centre(c), centre(r));
						if (ch === 'C') N.drawCentre(cv, centre(c), centre(r));
					})
				),
		},
		specimen: { paint: paintNetherworld, ground: () => GROUNDS.nether },
		notes: ['Each group is a nest of black basalt crags round a pool of glowing lava, with ash mounds and skulls on its banks.', "Proposed: the four imps and the city centre's gold ring keep their own art (they stand on open plots)."],
	},
};

const report = {};
for (const [id, s] of Object.entries(SKETCHES)) {
	const spec = compose(SPECIMEN_LAYOUT, s.specimen);
	const mat = compose(s.layout, s.real);
	writeFileSync(`${OUT}/${id}-specimen.svg`, toSvg(spec.canvas));
	writeFileSync(`${OUT}/${id}-mat.svg`, toSvg(mat.canvas));
	// Checks the build's tests would make: inside the reach, every impassable plot's middle covered.
	let outside = 0;
	for (let i = 0; i < mat.relief.p.length; i++) if (mat.relief.p[i] && !mat.fp.reach[i]) outside++;
	let bare = 0;
	for (let r = 0; r < s.layout.length; r++) {
		for (let c = 0; c < s.layout[0].length; c++) {
			if (isImpassable(s.layout, r, c) && !mat.relief.p[(r * PITCH + 16) * mat.fp.w + c * PITCH + 16]) bare++;
		}
	}
	report[id] = { outside, bare, w: mat.fp.w, h: mat.fp.h };
}

const html = `<!doctype html><meta charset="utf-8"><title>#133 sketches</title>
<style>
body { background: #1b1d1f; color: #ddd; font: 15px/1.45 system-ui, sans-serif; margin: 24px; }
h1 { font-size: 22px; margin: 0 0 6px; } h2 { font-size: 18px; margin: 28px 0 4px; }
.row { display: flex; gap: 18px; align-items: flex-start; }
figure { margin: 0; } figcaption { color: #9a9; font-size: 13px; margin-top: 4px; }
img { width: 425px; image-rendering: pixelated; display: block; }
p { margin: 2px 0; max-width: 1310px; }
</style>
<h1>#133 · Fantasies &amp; Futures reliefs · round 1 sketches</h1>
<p>Each row: the specimen sheet (a lone plot, a side pair, two corner-only pairs, an L of three and a 2×2), the real mat at the Capital tab's size, and today's example mat.</p>
${Object.entries(SKETCHES)
	.map(
		([id, s]) => `<h2>${s.title}</h2>${s.notes.map((n) => `<p>${n}</p>`).join('')}
<div class="row">
<figure><img src="${id}-specimen.svg"><figcaption>specimen</figcaption></figure>
<figure><img src="${id}-mat.svg"><figcaption>the real mat, sketched</figcaption></figure>
<figure><img src="${pathToFileURL(`${REPO}/static/art/capital-mat/${s.base ?? id}.svg`).href}"><figcaption>today</figcaption></figure>
</div>`
	)
	.join('\n')}`;
writeFileSync(`${OUT}/sketches.html`, html);
console.log(JSON.stringify(report));
