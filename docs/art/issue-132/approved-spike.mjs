// The approved sketches of the six Arts & Architecture reliefs (#132), built on the #82 relief pipeline. Not run by the build or the tests.
// Run from the repository: node docs/art/issue-132/approved-spike.mjs <out dir> [1|2|approved]. Round 1 drew all six; round 2 redrew the
// Mesa, the Archipelago and Cloud City after the owner's review (2026-10-31). `approved` draws the six the owner approved.
import { mkdirSync, writeFileSync } from 'node:fs';

const REPO = new URL('../../..', import.meta.url).pathname.replace(/\/$/, '');
const OUT = process.argv[2];
const { createCanvas, overlay, toSvg, seededRandom, mix } = await import(
	`${REPO}/src/lib/art/paint/painter.js`
);
const { PALETTE: C } = await import(`${REPO}/src/lib/art/paint/palette.js`);
const { PLOT, PITCH } = await import(`${REPO}/src/lib/art/relief.js`);
const { footprint, distanceInside, withCornerPatches, isImpassable } =
	await import(`${REPO}/src/lib/art/paint/relief/footprint.js`);
const { BAYER, hash, noise } = await import(
	`${REPO}/src/lib/art/paint/relief/ground.js`
);
const { put, cast, shadow } = await import(
	`${REPO}/src/lib/art/paint/relief/canvas.js`
);
const { paintSea } = await import(`${REPO}/src/lib/art/paint/sea.js`);
const { paintMountains } = await import(`${REPO}/src/lib/art/paint/relief/mountain.js`);
const { SPECIMEN_LAYOUT } = await import(
	`${REPO}/tools/art/parts/capital-relief/index.js`
);
const { BIOMES } = await import(
	`${REPO}/tools/art/parts/capital-biomes/index.js`
);
const { VOLCANOES } = await import(
	`${REPO}/tools/art/parts/capital-biomes/archipelago.js`
);
const { CLOUDS, CLOUD_TINTS } = await import(
	`${REPO}/tools/art/parts/capital-biomes/cloud-city.js`
);

// ---------- Shared helpers ----------

const dither = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const AROUND = [
	[1, 0],
	[-1, 0],
	[0, 1],
	[0, -1],
	[2, 0],
	[-2, 0],
	[0, 2],
	[0, -2],
];
const EIGHT = [
	[1, 0],
	[-1, 0],
	[0, 1],
	[0, -1],
	[1, 1],
	[-1, 1],
	[1, -1],
	[-1, -1],
];

/** A soft floor under each group, ragged at its edge so it fades into the ground. */
function drawFloor(canvas, area, seed, pick) {
	const { w, h } = canvas;
	const ragged = noise(seed + 3, 3);
	const rand = seededRandom(hash(seed, 77));
	for (let y = 1; y < h - 1; y++) {
		for (let x = 1; x < w - 1; x++) {
			const i = y * w + x;
			if (!area[i]) continue;
			let edge = 0;
			for (const [dx, dy] of AROUND) if (!area[i + dy * w + dx]) edge++;
			if (edge && ragged(x, y) < 0.5) continue;
			put(canvas, area, x, y, pick(rand(), x, y));
		}
	}
}

/** Base spots from the front row back, each row shuffled. */
function frontToBack(W, H, rand) {
	const spots = [];
	for (let by = H - 1; by >= 4; by -= 2) {
		const row = [];
		for (let bx = 0; bx < W; bx += 2) row.push([bx, by]);
		for (let i = row.length - 1; i > 0; i--) {
			const j = Math.floor(rand() * (i + 1));
			[row[i], row[j]] = [row[j], row[i]];
		}
		spots.push(...row);
	}
	return spots;
}

const blockedOf = (fp) => (r, c) =>
	r >= 0 &&
	c >= 0 &&
	r < fp.rows &&
	c < fp.cols &&
	fp.plots[(r * PITCH + 16) * fp.w + c * PITCH + 16] === 1;

function* rowPixels(rows) {
	for (const [y, a, b] of rows) for (let x = a; x <= b; x++) yield [x, y];
}

function fitsIn(rows, area, W, H) {
	for (const [x, y] of rowPixels(rows)) {
		if (x < 0 || y < 0 || x >= W || y >= H || !area[y * W + x]) return false;
	}
	return true;
}

/** A soft shadow to the right of a foot, on every other pixel so it fades. */
function footShadow(canvas, ok, own, [x0, x1, y0, y1], darker, alpha = 0.3) {
	const { w, h } = canvas;
	for (let x = x0; x <= x1; x++) {
		for (let y = y0; y <= y1; y++) {
			if (x < 0 || y < 0 || x >= w || y >= h) continue;
			const i = y * w + x;
			if (!ok[i] || own.has(i)) continue;
			if (dither(x, y) < 0.15) cast(canvas, x, y, alpha, darker);
		}
	}
}

function moundRows({ bx, by, hw, ph }) {
	const rows = [];
	for (let y = by - ph; y <= by; y++) {
		const v = (by - y) / ph;
		const half = Math.round(hw * Math.sqrt(Math.max(0, 1 - v * v)));
		rows.push([y, bx - half, bx + half]);
	}
	return rows;
}

/** A low mound lit on the left. tones: [rim, light, mid, shade, deep]. */
function drawMound(canvas, ok, m, tones, darker, dots) {
	const W = canvas.w;
	const rows = moundRows(m);
	const own = new Set();
	for (const [x, y] of rowPixels(rows)) own.add(y * W + x);
	const grain = noise(hash(m.bx, m.by, 31), 2);
	footShadow(canvas, ok, own, [m.bx, m.bx + m.hw + 2, m.by - 1, m.by + 1], darker);
	for (const [x, y] of rowPixels(rows)) {
		const u = (x - m.bx) / m.hw;
		const v = (m.by - y) / m.ph;
		const light =
			-u * 0.8 + v * 0.6 + (grain(x, y) - 0.5) * 0.6 + dither(x, y) * 0.3;
		let col =
			light > 0.35
				? tones[1]
				: light > -0.15
					? tones[2]
					: light > -0.55
						? tones[3]
						: tones[4];
		if (!own.has(y * W + x - W)) col = u < 0.2 ? tones[0] : tones[3];
		put(canvas, ok, x, y, col);
	}
	if (dots) {
		const rand = seededRandom(hash(m.bx, m.by, 5));
		for (let k = 0; k < Math.floor(m.hw / 4); k++) {
			const x = m.bx + Math.round((rand() - 0.5) * m.hw);
			const y = m.by - Math.round(rand() * m.ph * 0.6);
			if (own.has(y * W + x) && own.has(y * W + x + 1)) {
				put(canvas, ok, x, y, dots[0]);
				put(canvas, ok, x + 1, y, dots[1]);
			}
		}
	}
	return own;
}

/** Mounds along every open side of each impassable plot and below each corner join, like #82's foothills. */
function edgeMounds(fp, seed, [hw0, hwr, ph0, phr] = [7, 4, 5, 3]) {
	const blocked = blockedOf(fp);
	const out = [];
	for (let r = 0; r < fp.rows; r++) {
		for (let c = 0; c < fp.cols; c++) {
			if (!blocked(r, c)) continue;
			const x0 = c * PITCH;
			const y0 = r * PITCH;
			const hr = seededRandom(hash(r, c, seed, 17));
			const size = () => ({
				hw: hw0 + Math.floor(hr() * hwr),
				ph: ph0 + Math.floor(hr() * phr),
			});
			if (!blocked(r + 1, c)) {
				out.push({ bx: x0 + 8 + Math.floor(hr() * 3), by: y0 + 31 - Math.floor(hr() * 2), ...size(), area: fp.plots });
				out.push({ bx: x0 + 22 + Math.floor(hr() * 3), by: y0 + 31 - Math.floor(hr() * 2), ...size(), area: fp.plots });
			}
			if (!blocked(r, c - 1)) {
				out.push({ bx: x0 + 6, by: y0 + 20 + Math.floor(hr() * 8), hw: 6, ph: ph0 + Math.floor(hr() * 2), area: fp.plots });
			}
			if (!blocked(r, c + 1)) {
				out.push({ bx: x0 + 25, by: y0 + 20 + Math.floor(hr() * 8), hw: 6, ph: ph0 + Math.floor(hr() * 2), area: fp.plots });
			}
		}
	}
	for (const { gx, gy, down } of fp.corners) {
		const f = down ? 1 : -1;
		out.push({ bx: gx - 5 * f, by: gy + 13, hw: 5, ph: 4, area: fp.reach });
		out.push({ bx: gx + 4 * f, by: gy + 11, hw: 5, ph: 5, area: fp.reach });
	}
	return out.filter((m) => fitsIn(moundRows(m), m.area, fp.w, fp.h));
}

function ellipse(canvas, cx, cy, rx, ry, col, clip) {
	for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
		for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
			const q = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
			if (q > 1 || x < 0 || y < 0 || x >= canvas.w || y >= canvas.h) continue;
			if (clip && !clip(x, y)) continue;
			canvas.p[y * canvas.w + x] = col;
		}
	}
}

/** A jagged edge from (x0, y0) to (x1, y1), as the x on each row (from #82's mountains). */
function jagged(rand, x0, y0, x1, y1, rough) {
	let pts = [
		[x0, y0],
		[x1, y1],
	];
	for (let pass = 0; pass < 4; pass++) {
		const next = [pts[0]];
		for (let i = 1; i < pts.length; i++) {
			const [ax, ay] = pts[i - 1];
			const [bx, by] = pts[i];
			next.push(
				[(ax + bx) / 2 + (rand() - 0.5) * Math.hypot(bx - ax, by - ay) * rough, (ay + by) / 2],
				[bx, by]
			);
		}
		pts = next;
	}
	const xs = new Map();
	for (let i = 1; i < pts.length; i++) {
		const [ax, ay] = pts[i - 1];
		const [bx, by] = pts[i];
		for (let y = Math.ceil(Math.min(ay, by)); y <= Math.floor(Math.max(ay, by)); y++) {
			xs.set(y, ax + (bx - ax) * (by === ay ? 0 : (y - ay) / (by - ay)));
		}
	}
	return (y) => xs.get(y) ?? (y <= y0 ? x0 : x1);
}

/** A jagged peak's outline: its rows as [y, left, right], its ridge, and its random stream. */
function peakShape(p, seed, { rough = 0.35, flat = 0 } = {}) {
	const rand = seededRandom(hash(p.bx, p.by, p.hw, seed));
	const sx = p.bx + Math.round((rand() - 0.5) * p.hw * 0.4);
	const sy = p.by - p.ph;
	const left = jagged(rand, sx - flat, sy, p.bx - p.hw, p.by, rough);
	const right = jagged(rand, sx + flat, sy, p.bx + p.hw, p.by, rough);
	const ridge = jagged(rand, sx, sy, p.bx + Math.round((rand() - 0.3) * p.hw * 0.5), p.by, 0.5);
	const rows = [];
	for (let y = sy; y <= p.by; y++) {
		const a = Math.round(Math.min(left(y), right(y)));
		const b = Math.round(Math.max(left(y), right(y)));
		rows.push([y, a, b]);
	}
	return { ...p, sx, sy, ridge, rows, rand };
}

/** Coverage bookkeeping for packing pieces into a footprint. */
function packer(fp) {
	const { w: W, h: H, mask } = fp;
	const covered = new Uint8Array(W * H);
	return {
		covered,
		fresh(rows, ok) {
			let n = 0;
			let total = 0;
			for (const [x, y] of rowPixels(rows)) {
				if (x < 0 || y < 0 || x >= W || y >= H || !ok[y * W + x]) return -1;
				total++;
				if (mask[y * W + x] && !covered[y * W + x]) n++;
			}
			return n / total;
		},
		cover(rows) {
			for (const [x, y] of rowPixels(rows)) covered[y * W + x] = 1;
		},
		/** Whether nothing already placed stands just in front of the base. */
		clearInFront(bx, by, hw) {
			for (let y = by + 1; y <= Math.min(H - 1, by + 3); y++) {
				for (let x = bx - hw; x <= bx + hw; x++) if (covered[y * W + x]) return false;
			}
			return true;
		},
	};
}

// ---------- Natural ground ----------

const CAVE = {
	base: mix(C.stoneShade, C.night, 0.42),
	dark: mix(C.stoneShade, C.night, 0.68),
	light: mix(C.stoneShade, C.stone, 0.12),
	detail: mix(C.stone, C.stoneShade, 0.55),
};

const TINTS = [
	{ base: mix(C.white, C.cloudShade, 0.35), light: C.white, dark: C.cloudShade, rim: mix(C.cloudShade, C.daySky3, 0.55) },
	{ base: mix(C.cloudShade, C.stone, 0.4), light: mix(C.cloudShade, C.stone, 0.2), dark: mix(C.cloudShade, C.stone, 0.62), rim: mix(C.stone, C.stoneShade, 0.5) },
	{ base: mix(C.sandLight, C.cloudShade, 0.25), light: C.creamLight, dark: mix(C.sandLight, C.sandShade, 0.5), rim: mix(C.sandShade, C.timber, 0.4) },
	{ base: mix(C.cream, C.white, 0.35), light: C.creamLight, dark: C.creamShade, rim: mix(C.creamShade, C.plasterShade, 0.5) },
];

function scatterMesa(p, px, py, roll, rand) {
	if (roll < 0.3) {
		// A sage shrub.
		p(px, py, C.mesaSage);
		p(px - 1, py, C.mesaSage);
		p(px + 1, py, C.alpineMeadowShade);
		p(px, py - 1, C.alpineMeadowLight);
		p(px, py + 1, C.mesaSoilShade);
		p(px + 1, py + 1, C.mesaSoilShade);
	} else if (roll < 0.55) {
		// A red pebble.
		p(px, py, C.mesaRockLight);
		p(px + 1, py, C.mesaRock);
		p(px, py + 1, C.mesaRockShade);
		p(px + 1, py + 1, C.mesaSoilDark);
	} else if (roll < 0.72) {
		// A crack in the hardpan.
		let x = px;
		let y = py;
		for (let i = 0; i < 4 + rand() * 4; i++) {
			p(x, y, C.mesaSoilShade);
			x++;
			if (rand() < 0.4) y += rand() < 0.5 ? -1 : 1;
		}
	}
}

function scatterCanyon(p, px, py, roll, rand) {
	if (roll < 0.35) {
		// A dry tuft.
		p(px, py, C.savannaGoldShade);
		p(px - 1, py - 1, C.savannaGold);
		p(px + 1, py - 1, C.savannaGoldShade);
		p(px, py - 2, rand() < 0.5 ? C.savannaGoldLight : C.savannaGold);
	} else if (roll < 0.6) {
		p(px, py, C.mesaSoil);
		p(px + 1, py, C.mesaSoilShade);
		p(px, py + 1, C.mesaSoilShade);
	} else if (roll < 0.68) {
		p(px, py, C.mesaSage);
		p(px + 1, py, C.alpineMeadowShade);
	}
}

function scatterCave(p, px, py, roll, rand) {
	if (roll < 0.35) {
		p(px, py, CAVE.detail);
		p(px + 1, py, CAVE.dark);
	} else if (roll < 0.47) {
		// A still puddle with a glint.
		const n = 3 + Math.floor(rand() * 3);
		for (let i = 0; i < n; i++) p(px + i, py, i === 1 ? C.nightSea2 : C.nightSea3);
		for (let i = 1; i < n - 1; i++) p(px + i, py + 1, CAVE.dark);
	} else if (roll < 0.54) {
		p(px, py, C.tealShade);
		p(px, py - 1, C.teal);
	} else if (roll < 0.8) {
		p(px, py - 1, C.stoneMid);
		p(px, py, C.stoneShade);
		p(px + 1, py, C.roofShade);
	}
}

function scatterSwamp(p, px, py, roll, rand) {
	if (roll < 0.3) {
		// A moss tuft.
		p(px, py, C.swampMoss);
		p(px + 1, py, C.quagMoss);
		p(px, py - 1, C.quagMossLight);
	} else if (roll < 0.42) {
		const n = 3 + Math.floor(rand() * 3);
		for (let i = 0; i < n; i++) p(px + i, py, i === 1 ? C.swampWaterLight : C.swampWater);
		for (let i = 1; i < n - 1; i++) p(px + i, py - 1, C.swampWaterDeep);
	} else if (roll < 0.6) {
		// Sedge.
		p(px, py, C.quagReedShade);
		p(px - 1, py - 1, C.quagReed);
		p(px + 1, py - 1, C.quagReedShade);
		p(px, py - 2, C.swampReed);
	} else if (roll < 0.72) {
		// A fallen twig.
		p(px, py, C.timberShade);
		p(px + 1, py, C.timberShade);
		p(px + 2, py + 1, C.timberShade);
	}
}

function scatterIsland(p, px, py, roll, rand) {
	if (roll < 0.5) {
		p(px, py, C.grassShade);
		p(px - 1, py - 1, C.grassShade);
		p(px + 1, py - 1, C.forestFloorLight);
		p(px, py - 2, C.grassLight);
	} else if (roll < 0.7) {
		p(px, py, rand() < 0.5 ? C.cream : C.gold);
		p(px, py + 1, C.grassShade);
	}
}

const cloudScatter = (t) => (p, px, py, roll, rand) => {
	if (roll < 0.45) {
		// A little puff, lit on top.
		p(px, py, t.light);
		p(px + 1, py, t.light);
		p(px - 1, py + 1, t.light);
		p(px, py + 1, t.base);
		p(px + 1, py + 1, t.base);
		p(px + 2, py + 1, t.dark);
		p(px, py + 2, t.dark);
		p(px + 1, py + 2, t.dark);
	} else if (roll < 0.7) {
		const n = 3 + Math.floor(rand() * 4);
		for (let i = 0; i < n; i++) p(px + i, py, t.light);
	}
};

const GROUNDS = {
	mesa: { seed: 7103, base: C.mesaSoil, light: C.mesaSoilLight, dark: C.mesaSoilShade, scatter: scatterMesa },
	canyon: { seed: 7211, base: C.mesaSoilLight, light: C.sandLight, dark: C.mesaSoil, scatter: scatterCanyon },
	cavern: { seed: 7307, base: CAVE.base, light: CAVE.light, dark: CAVE.dark, scatter: scatterCave },
	swamp: { seed: 7411, base: C.swampMud, light: C.swampMudLight, dark: C.swampMudShade, scatter: scatterSwamp },
	archipelago: { seed: 7507, base: C.grass, light: C.grassLight, dark: C.grassShade, scatter: scatterIsland },
	...Object.fromEntries(
		TINTS.map((t, k) => [`cloud${k}`, { seed: 7600 + k, base: t.base, light: t.light, dark: t.dark, scatter: cloudScatter(t), count: 10 }])
	),
};

function drawGround(canvas, g, variant, x, y) {
	const seed = hash(g.seed, variant);
	const broad = noise(seed + 7, 6);
	const fine = noise(seed + 8, 3);
	const rand = seededRandom(hash(seed, 41));
	const p = (px, py, col) => {
		if (px >= 0 && py >= 0 && px < PLOT && py < PLOT) canvas.p[(y + py) * canvas.w + x + px] = col;
	};
	for (let py = 0; py < PLOT; py++) {
		for (let px = 0; px < PLOT; px++) {
			const n = broad(px, py) * 0.6 + fine(px, py) * 0.4 + BAYER[(py % 4) * 4 + (px % 4)] * 0.1;
			p(px, py, n > 0.74 ? g.light : n < 0.24 ? g.dark : g.base);
		}
	}
	for (let i = 0; i < (g.count ?? 14); i++) {
		g.scatter(p, Math.floor(rand() * PLOT), Math.floor(rand() * PLOT), rand(), rand);
	}
}

// ---------- Red rock: buttes, hoodoos and boulders (Mesa, and Canyon's rims) ----------

const ROCK = [C.mesaStrata, C.mesaRockLight, C.mesaRock, C.mesaRockShade, C.mesaRockDark];
const RED_DARKER = {
	[C.mesaSoilLight]: C.mesaSoil,
	[C.mesaSoil]: C.mesaSoilShade,
	[C.mesaSoilShade]: C.mesaSoilDark,
	[C.mesaStrata]: C.mesaRockLight,
	[C.mesaRockLight]: C.mesaRock,
	[C.mesaRock]: C.mesaRockShade,
	[C.mesaRockShade]: C.mesaRockDark,
	[C.sandLight]: C.mesaSoilLight,
	[C.mesaSage]: C.alpineMeadowShade,
};

function tone5(light) {
	if (light > 0.55) return 0;
	if (light > 0.1) return 1;
	if (light > -0.3) return 2;
	return light > -0.7 ? 3 : 4;
}

function wander(at, rand) {
	const step = rand() < 0.4 ? (rand() < 0.5 ? -1 : 1) : 0;
	return Math.max(-1, Math.min(1, at + step));
}

function jointAt(j, y) {
	return j.xs.get(Math.max(j.from, Math.min(j.to, y)));
}

/** A red rock's rows: a butte (flat top, jointed cliffs, scree), a hoodoo (cap rock on a thin neck) or a boulder. */
function rockShape(r, seed) {
	const rand = seededRandom(hash(r.bx, r.by, r.hw, r.ph, seed));
	const sy = r.by - r.ph;
	const butte = r.kind === 'butte';
	const hoodoo = r.kind === 'hoodoo';
	const tw = butte
		? Math.max(3, Math.round(r.hw * (0.55 + rand() * 0.15)))
		: hoodoo
			? Math.max(2, Math.round(r.hw * 0.7))
			: 0;
	const cap = butte ? Math.max(1, Math.round(tw * 0.2)) : hoodoo ? 1 : 0;
	const knee = butte
		? sy + 2 * cap + Math.round((r.ph - 2 * cap) * (0.58 + rand() * 0.12))
		: hoodoo
			? r.by - Math.round(r.ph * 0.28)
			: sy + Math.round(r.ph * 0.55);
	const cliff = tw + (knee - sy - cap) * 0.12;
	const rows = [];
	let left = 0;
	let right = 0;
	for (let y = sy; y <= r.by; y++) {
		let half;
		const t = y - sy;
		if (hoodoo) {
			if (t <= 2) half = tw - (t === 0 ? 1 : 0);
			else if (y < knee) half = Math.max(1, tw * 0.45 + (t - 3) * 0.06);
			else half = tw * 0.5 + (r.hw - tw * 0.5) * ((y - knee) / Math.max(1, r.by - knee)) ** 1.3;
		} else if (butte && y < sy + cap) {
			const v = (sy + cap - y) / (cap + 0.5);
			half = tw * (1 - v * v) ** 0.25;
		} else if (butte && y < knee) {
			half = tw + (y - sy - cap) * 0.12;
		} else if (butte) {
			const s = (y - knee) / Math.max(1, r.by - knee);
			half = cliff + (r.hw - cliff) * s ** 1.4;
		} else if (y < knee) {
			const v = (knee - y) / (knee - sy + 0.5);
			half = r.hw * Math.sqrt(1 - v * v);
		} else {
			half = r.hw * (1 + ((y - knee) / Math.max(1, r.by - knee)) * 0.15);
		}
		if (!(butte && y < sy + cap) && !(hoodoo && t <= 2)) {
			left = wander(left, rand);
			right = wander(right, rand);
		}
		rows.push([y, Math.round(r.bx - half) - left, Math.round(r.bx + half) + right]);
	}
	const joints = [];
	const count = butte ? 1 + Math.floor(tw / 6) : !hoodoo && r.hw >= 5 ? 1 : 0;
	for (let k = 0; k < count; k++) {
		let x = butte
			? Math.round(r.bx - tw + ((k + 1) / (count + 1)) * 2 * tw + rand() * 2 - 1)
			: r.bx + Math.round((rand() - 0.6) * r.hw * 0.6);
		const from = butte ? sy + 2 * cap + 1 : sy + 1;
		const to = butte ? knee + 2 : sy + Math.round(r.ph * 0.6);
		const drift = butte ? 0 : rand() < 0.5 ? -1 : 1;
		const xs = new Map();
		for (let y = from; y <= to; y++) {
			xs.set(y, x);
			if (rand() < (butte ? 0.2 : 0.45)) x += drift || (rand() < 0.5 ? -1 : 1);
		}
		joints.push({ from, to, xs });
	}
	const blocks = [];
	for (let k = 0; butte && k < 1 + Math.floor(r.hw / 8); k++) {
		const side = k % 2 === 0 ? -1 : 1;
		const out = tw + 1 + Math.floor(rand() * Math.max(1, r.hw - tw - 3));
		blocks.push([r.bx + side * out, knee + 2 + Math.floor(rand() * Math.max(1, r.by - knee - 4)), 1.5 + rand()]);
	}
	const bare = butte || hoodoo ? (knee - sy) / r.ph : 0.8;
	return { ...r, sy, tw, cap, knee, bare, rows, joints, blocks };
}

/** Draws a red rock lit from the left: banded cliffs, a soil-and-sage top, an outline on the upper rock only. */
function drawRock(canvas, s, ok, strata = true) {
	const W = canvas.w;
	const own = new Set();
	const span = new Map();
	for (const [y, a, b] of s.rows) {
		span.set(y, [a, b]);
		for (let x = a; x <= b; x++) own.add(y * W + x);
	}
	const grain = noise(hash(s.bx, s.by, 9), 2.5);
	const capY = s.sy + s.cap;
	const onTop = (x, y) => {
		if (s.kind !== 'butte') return false;
		const u = (x - s.bx) / (s.tw + 0.5);
		const v = (y - capY) / (s.cap + 0.5);
		return u ** 4 + v * v <= 1;
	};
	footShadow(canvas, ok, own, [s.bx, s.bx + s.hw + 3, s.by - 2, s.by + 1], RED_DARKER);
	for (const [x, y] of rowPixels(s.rows)) {
		if (x < 0 || y < 0 || x >= W || y >= canvas.h) continue;
		const i = y * W + x;
		const [a, b] = span.get(y);
		const u = (x - (a + b) / 2) / Math.max(1, (b - a) / 2);
		const depth = (y - s.sy) / s.ph;
		const n = grain(x, y) - 0.5 + dither(x, y) * 0.5;
		let col;
		if (onTop(x, y)) {
			// The flat top: red soil and scrub, its front rim catching the light.
			col = !onTop(x, y + 1) ? C.mesaStrata : hash(x, y, 3) % 19 === 0 ? C.mesaSage : n > 0.12 ? C.mesaSoilLight : C.mesaSoil;
		} else if (s.kind === 'boulder') {
			const crack = s.joints.some((j) => y >= j.from && y <= j.to && j.xs.get(y) === x);
			const k = tone5(-u * 0.75 + (0.3 - depth) * 1.2 + n * 0.4);
			col = ROCK[crack ? Math.min(4, k + 2) : k];
		} else {
			const facet = s.joints.filter((j) => jointAt(j, y) < x).length;
			const at = (facet + 0.5) / (s.joints.length + 1);
			let k = tone5(0.6 - at * 1.3 - u * 0.3 + n * 0.5);
			if (s.kind === 'hoodoo' && y - s.sy <= 2) {
				// A hoodoo's cap rock: harder, darker stone.
				k = u < -0.2 ? 2 : 3;
			} else if (strata) {
				// The same layers run through every rock: a pale band every five rows, a dark seam now and then.
				const band = (y + 400) % 5;
				if (band === 0) k = Math.max(0, k - 1);
				else if (band === 2 && hash(x >> 3, y) % 3 === 0) k = Math.min(4, k + 1);
			}
			if (s.joints.some((j) => jointAt(j, y) === x && y >= j.from)) k = Math.min(4, k + 2);
			else if (s.joints.some((j) => jointAt(j, y) === x + 1 && y >= j.from)) k = Math.max(0, k - 1);
			if (onTop(x, y - 1)) k = Math.min(4, k + 1);
			col = ROCK[k];
		}
		// The foot turns to red soil: more of it the nearer the ground, dithered.
		const soil = Math.max(0, (depth - s.bare) / (1 - s.bare));
		if (soil ** 1.2 > 0.5 - dither(x, y) + (grain(x + 50, y) - 0.5) * 0.5) {
			col = u < 0 ? (n > 0.1 ? C.mesaSoilLight : C.mesaSoil) : n > 0 ? C.mesaSoil : C.mesaSoilShade;
		}
		const edge = !own.has(i - 1) || !own.has(i + 1) || !own.has(i - W);
		if (edge && depth < s.bare) col = C.ink;
		else if (edge && !own.has(i + 1) && soil < 0.6) col = C.mesaSoilDark;
		put(canvas, ok, x, y, col);
	}
	for (const [bx, by, r] of s.blocks) {
		const reach = Math.ceil(r);
		for (let dy = -reach; dy <= reach; dy++) {
			for (let dx = -reach; dx <= reach; dx++) {
				const q = (dx * dx) / (r * r) + (dy * dy) / (r * r * 0.55);
				const x = bx + dx;
				const y = by + dy;
				if (q > 1 || !own.has(y * W + x)) continue;
				const rim = q > 0.5 && dx + dy > 0;
				const lit = -dx - dy * 1.5;
				put(canvas, ok, x, y, rim ? C.mesaRockDark : ROCK[lit > 1 ? 0 : lit > -0.5 ? 1 : 3]);
			}
		}
	}
}

const TALUS = [C.mesaSoilLight, C.mesaSoilLight, C.mesaSoil, C.mesaSoilShade, C.mesaSoilDark];

// ---------- Mesa: red buttes with banded rock ----------

function paintMesa(canvas, fp, seed) {
	const { w: W, h: H, mask, plots, reach, corners } = fp;
	drawFloor(canvas, mask, seed, (roll) => (roll < 0.22 ? C.mesaSoil : roll < 0.27 ? C.mesaSoilDark : C.mesaSoilShade));
	const mounds = edgeMounds(fp, seed, [6, 4, 3, 3]);
	const bank = new Uint8Array(W * H);
	for (const m of mounds) for (const [x, y] of rowPixels(moundRows(m))) bank[y * W + x] = 1;
	const rand = seededRandom(hash(seed, 23));
	const pack = packer(fp);
	const rocks = [];
	const add = (s, ok) => {
		rocks.push({ s, ok });
		pack.cover(s.rows);
	};
	for (const { gx, gy, down } of corners) {
		const f = down ? 1 : -1;
		for (const [kind, dx, dy, hw, ph] of [
			['butte', 0, 9, 9, 16],
			['hoodoo', -8, 13, 3, 11],
		]) {
			const s = rockShape({ kind, bx: gx + dx * f, by: gy + dy, hw, ph }, seed);
			if (pack.fresh(s.rows, reach) >= 0) add(s, reach);
		}
	}
	for (const hw of [30, 25, 20, 16, 12, 6, 5, 4, 3]) {
		const kind = hw >= 12 ? 'butte' : hw >= 5 ? 'hoodoo' : 'boulder';
		for (const [bx, by] of frontToBack(W, H, rand)) {
			if (!mask[by * W + bx]) continue;
			const tall = rand();
			const ph =
				kind === 'butte'
					? Math.round(Math.min(hw * (0.85 + tall * 0.45), 12 + hw * 0.7))
					: kind === 'hoodoo'
						? 9 + Math.floor(tall * 6)
						: Math.round(hw * (0.8 + tall * 0.2));
			if (bx - hw < 0 || bx + hw >= W || by - ph < 0 || !plots[by * W + bx - hw] || !plots[by * W + bx + hw] || !plots[(by - ph) * W + bx]) continue;
			const s = rockShape({ kind, bx, by, hw, ph }, seed);
			if (kind === 'butte') {
				if (pack.fresh(s.rows, plots) < 0.62) continue;
			} else {
				if (!pack.clearInFront(bx, by, hw)) continue;
				let banked = 0;
				let total = 0;
				for (const [x, y] of rowPixels(s.rows)) {
					total++;
					banked += bank[y * W + x];
				}
				if (banked > 0.15 * total || pack.fresh(s.rows, plots) < (kind === 'hoodoo' ? 0.5 : 0.35)) continue;
			}
			add(s, plots);
		}
	}
	const scene = [
		...rocks.map(({ s, ok }) => ({ s, ok, by: s.by, order: 0 })),
		...mounds.map((m) => ({ m, by: m.by, order: 1 })),
	].sort((a, b) => a.by - b.by || a.order - b.order);
	// Leave out a rock the rocks in front of it would mostly hide.
	const inFront = new Uint8Array(W * H);
	const hidden = new Set();
	for (const item of [...scene].reverse()) {
		const rows = item.s ? item.s.rows : moundRows(item.m);
		if (item.s && item.ok !== reach) {
			let seen = 0;
			let total = 0;
			for (const [x, y] of rowPixels(rows)) {
				total++;
				seen += inFront[y * W + x] ? 0 : 1;
			}
			if (seen < (item.s.kind === 'butte' ? 0.6 : 0.9) * total) {
				hidden.add(item.s);
				continue;
			}
		}
		for (const [x, y] of rowPixels(rows)) inFront[y * W + x] = 1;
	}
	for (const item of scene) {
		if (item.s && !hidden.has(item.s)) drawRock(canvas, item.s, item.ok);
		else if (item.m) drawMound(canvas, item.m.area, item.m, TALUS, RED_DARKER, [C.mesaRockLight, C.mesaRockShade]);
	}
}

// ---------- Canyon: a gorge cut into the plain ----------

function paintCanyon(canvas, fp, seed) {
	const { w: W, h: H, mask, plots, reach, corners } = fp;
	const wear = noise(seed + 5, 2.5);
	const d0 = distanceInside(mask, W, H);
	const hole = new Uint8Array(W * H);
	for (let i = 0; i < W * H; i++) {
		if (mask[i] && d0[i] > 1.5 + wear(i % W, (i / W) | 0) * 2.5) hole[i] = 1;
	}
	// At a corner join the gorge bends through the corner, cutting into the two buildable corners.
	for (const { gx, gy } of corners) {
		for (let dy = -9; dy <= 9; dy++) {
			for (let dx = -9; dx <= 9; dx++) {
				const i = (gy + dy) * W + gx + dx;
				if (dx * dx + dy * dy <= 8.5 * 8.5 + wear(gx + dx, gy + dy) * 10 && reach[i]) hole[i] = 1;
			}
		}
	}
	// The rim: dusty soil around the drop, ragged where it meets the plain.
	drawFloor(canvas, withCornerPatches(fp, 12), seed, (roll) => (roll < 0.35 ? C.mesaSoil : roll < 0.42 ? C.mesaSoilShade : C.mesaSoilLight));
	// The gorge from the front and above: its far and side walls step down in banded terraces that follow
	// the rim, the near wall faces away out of sight, and a river runs along the floor's middle.
	const dep = distanceInside(hole, W, H);
	const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : dep[y * W + x]);
	const ridge = new Uint8Array(W * H);
	for (let i = 0; i < W * H; i++) {
		if (!hole[i]) continue;
		const x = i % W;
		const y = (i / W) | 0;
		if (dep[i] >= 2 && !EIGHT.some(([dx, dy]) => at(x + dx, y + dy) > dep[i] + 0.01)) ridge[i] = 1;
	}
	// How far each pixel lies from the floor's middle.
	const mid = new Float32Array(W * H).fill(Infinity);
	const queue = [];
	for (let i = 0; i < W * H; i++) {
		if (ridge[i]) {
			mid[i] = 0;
			queue.push(i);
		}
	}
	for (let q = 0; q < queue.length; q++) {
		const i = queue[q];
		const x = i % W;
		const y = (i / W) | 0;
		for (const [dx, dy] of [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1],
		]) {
			const j = (y + dy) * W + x + dx;
			if (x + dx < 0 || y + dy < 0 || x + dx >= W || y + dy >= H || !hole[j] || mid[j] <= mid[i] + 1) continue;
			mid[j] = mid[i] + 1;
			queue.push(j);
		}
	}
	const grain = noise(seed + 9, 2);
	for (let i = 0; i < W * H; i++) {
		if (!hole[i]) continue;
		const x = i % W;
		const y = (i / W) | 0;
		const d = dep[i];
		const gx = at(x + 1, y) - at(x - 1, y);
		const gy = at(x, y + 1) - at(x, y - 1);
		const n = grain(x, y) - 0.5 + dither(x, y) * 0.5;
		let col;
		if (mid[i] <= 1.5) {
			// The floor, in deep shade, with the river along its middle.
			col = mid[i] === 0 ? (dither(x, y) > 0.3 ? C.dayWaveDeep : C.daySea3) : n > 0.2 ? C.mesaRockShade : C.mesaRockDark;
		} else if (gy < -0.5 && Math.abs(gy) >= Math.abs(gx)) {
			// Below the near rim: the near wall faces away, so this is floor in its shadow.
			col = d <= 1 ? C.mesaSoilDark : d <= 2.5 ? C.night : n > 0.15 ? C.mesaRockShade : C.mesaRockDark;
		} else if (d <= 1) {
			col = C.mesaSoilLight; // the rim's lit lip
		} else {
			// The far and side walls in terraces: each step's ledge catches the light, and deeper is darker.
			const facing = Math.abs(gx) > Math.abs(gy) ? (gx > 0 ? 1 : -1) : 0; // 1: the west wall, in shade; -1: the east wall, lit
			let k = 1 + facing + Math.floor(d / 6);
			const step = d % 3.2;
			if (step < 1) k -= 1;
			else if (step > 2.4) k += 1;
			if (hash(x >> 1, y >> 2, 7) % 9 === 0) k += 1;
			if (n > 0.3) k -= 1;
			col = ROCK[clamp(k, 0, 4)];
		}
		put(canvas, hole, x, y, col);
	}
	// Boulders on the rims, and a hoodoo and a boulder beside each corner join.
	const rand = seededRandom(hash(seed, 31));
	const rocks = [];
	const blocked = blockedOf(fp);
	for (let r = 0; r < fp.rows; r++) {
		for (let c = 0; c < fp.cols; c++) {
			if (!blocked(r, c)) continue;
			for (let k = 0; k < 2; k++) {
				if (rand() < 0.45) continue;
				const x = c * PITCH + 5 + Math.floor(rand() * 22);
				// The near rim below this column, or the far rim above it.
				const far = rand() < 0.4;
				let y = far ? r * PITCH : r * PITCH + PLOT - 1;
				if (far) {
					while (y < r * PITCH + PLOT && !hole[y * W + x]) y++;
					y -= 1;
				} else {
					while (y > r * PITCH && !hole[y * W + x]) y--;
					y += 3;
				}
				const hw = 2 + Math.floor(rand() * 3);
				const s = rockShape({ kind: 'boulder', bx: x, by: y, hw, ph: hw + 1 }, seed);
				if (fitsIn(s.rows, plots, W, H)) rocks.push({ s, ok: plots });
			}
		}
	}
	for (const { gx, gy, down } of corners) {
		const f = down ? 1 : -1;
		const hoodoo = rockShape({ kind: 'hoodoo', bx: gx + 8 * f, by: gy - 1, hw: 4, ph: 13 }, seed);
		const boulder = rockShape({ kind: 'boulder', bx: gx - 8 * f, by: gy + 9, hw: 3, ph: 4 }, seed);
		for (const s of [hoodoo, boulder]) if (fitsIn(s.rows, reach, W, H)) rocks.push({ s, ok: reach });
	}
	rocks.sort((a, b) => a.s.by - b.s.by);
	for (const { s, ok } of rocks) drawRock(canvas, s, ok, false);
}

// ---------- Cavern: cave rock, stalagmites and crystals ----------

const CAVE_DARKER = {
	[CAVE.light]: CAVE.base,
	[CAVE.base]: CAVE.dark,
	[CAVE.dark]: C.night,
	[C.stoneShade]: C.roofShade,
	[C.stoneMid]: C.stoneShade,
};

function drawCaveRock(canvas, s, ok) {
	const W = canvas.w;
	const own = new Set();
	for (const [x, y] of rowPixels(s.rows)) own.add(y * W + x);
	const grain = noise(hash(s.bx, s.by, 9), 2.5);
	const ribs = new Map();
	for (let k = 0; k < 1 + Math.floor(s.hw / 9); k++) {
		let y = s.sy + Math.round(s.ph * (0.2 + s.rand() * 0.4));
		let x = Math.round(s.ridge(y));
		const dir = s.rand() < 0.55 ? -1 : 1;
		for (let step = 0; step < s.hw * 0.6; step++) {
			ribs.set(y * W + x, dir);
			x += dir;
			if (s.rand() < 0.6) y += 1;
		}
	}
	footShadow(canvas, ok, own, [s.bx, s.bx + s.hw + 3, s.by - 2, s.by + 1], CAVE_DARKER, 0.35);
	for (const [x, y] of rowPixels(s.rows)) {
		if (x < 0 || y < 0 || x >= W || y >= canvas.h) continue;
		const i = y * W + x;
		const lit = x < s.ridge(y);
		const depth = (y - s.sy) / s.ph;
		const n = grain(x, y) + dither(x, y) * 0.25;
		let col = lit
			? n > 0.66 ? C.stoneLight : n > 0.32 ? C.stone : C.stoneMid
			: n > 0.62 ? C.stoneMid : n > 0.3 ? C.stoneShade : C.roofShade;
		if (ribs.has(i)) col = lit ? C.stoneMid : C.roofShade;
		else if (ribs.has(i + W)) col = lit ? C.stoneLight : C.stoneMid;
		// A vein of crystal in the rock, here and there.
		if (hash(x, y, s.bx) % 97 === 0 && depth < 0.6) col = C.teal;
		// The lower slopes darken into the cave floor.
		const low = Math.max(0, (depth - 0.5) / 0.5);
		if (low ** 1.2 > 0.5 - dither(x, y) + (grain(x + 50, y) - 0.5) * 0.5) {
			col = lit ? (n > 0.55 ? CAVE.light : CAVE.base) : n > 0.5 ? CAVE.base : CAVE.dark;
		}
		const edge = !own.has(i - 1) || !own.has(i + 1) || !own.has(i - W);
		if (edge && depth < 0.55) col = C.ink;
		else if (edge && !own.has(i + 1) && depth < 0.85) col = C.night;
		put(canvas, ok, x, y, col);
	}
}

function stalagmiteRows({ bx, by, hw, ph }) {
	const rows = [];
	for (let y = by - ph; y <= by; y++) {
		const t = (y - (by - ph)) / ph;
		const half = Math.round(hw * t ** 0.8);
		rows.push([y, bx - half, bx + half]);
	}
	return rows;
}

function drawStalagmite(canvas, m, ok) {
	const W = canvas.w;
	const rows = stalagmiteRows(m);
	const own = new Set();
	for (const [x, y] of rowPixels(rows)) own.add(y * W + x);
	footShadow(canvas, ok, own, [m.bx, m.bx + m.hw + 3, m.by - 1, m.by + 1], CAVE_DARKER, 0.35);
	for (const [y, a, b] of rows) {
		for (let x = a; x <= b; x++) {
			const i = y * W + x;
			const depth = (y - (m.by - m.ph)) / m.ph;
			const u = (x - m.bx) / Math.max(1, m.hw);
			let col = u < -0.2 ? C.stoneLight : u < 0.3 ? C.stone : C.stoneShade;
			// Drip rings.
			if ((y + m.bx) % 4 === 0) col = u < 0.3 ? C.stoneMid : C.roofShade;
			if (depth > 0.7 && dither(x, y) + (depth - 0.7) * 2 > 0.4) col = u < 0 ? CAVE.light : CAVE.base;
			const edge = !own.has(i - 1) || !own.has(i + 1) || !own.has(i - W);
			if (edge && depth < 0.7) col = C.ink;
			put(canvas, ok, x, y, col);
		}
	}
}

function drawCrystals(canvas, cx, by, h, ok, hue) {
	const [light, mid, dark] = hue ? [C.arcaneLight, C.arcane, C.arcaneShade] : [C.tealLight, C.teal, C.tealShade];
	// The glow on the floor round its foot.
	for (let dy = -2; dy <= 2; dy++) {
		for (let dx = -7; dx <= 7; dx++) {
			const x = cx + dx;
			const y = by + dy;
			if ((dx * dx) / 49 + (dy * dy) / 4 > 1 || x < 0 || y < 0 || x >= canvas.w || y >= canvas.h) continue;
			if (ok[y * canvas.w + x] && canvas.p[y * canvas.w + x] && dither(x, y) > 0.1) put(canvas, ok, x, y, dark);
		}
	}
	const shards = [
		[cx - 5, by, 2, Math.round(h * 0.5), -2],
		[cx - 2, by + 1, 3, Math.round(h * 0.8), -1],
		[cx + 4, by, 2, Math.round(h * 0.65), 2],
		[cx + 1, by + 2, 3, h, 0],
	];
	for (const [x0, b0, hw, hh, lean] of shards) {
		for (let t = 0; t <= hh; t++) {
			const y = b0 - t;
			const half = Math.round(hw * (1 - t / (hh + 1)));
			const x = x0 + Math.round((lean * t) / 5);
			for (let dx = -half - 1; dx <= half + 1; dx++) {
				const edge = Math.abs(dx) === half + 1 || t === hh;
				put(canvas, ok, x + dx, y, edge ? C.ink : dx < 0 ? light : dx === 0 ? mid : dark);
			}
		}
		put(canvas, ok, x0 + Math.round((lean * hh) / 5), b0 - hh - 1, C.ink);
	}
}

function paintCavern(canvas, fp, seed) {
	const { w: W, h: H, mask, plots, reach, corners } = fp;
	drawFloor(canvas, mask, seed, (roll) => (roll < 0.15 ? C.night : roll < 0.25 ? CAVE.base : CAVE.dark));
	const rand = seededRandom(hash(seed, 21));
	const pack = packer(fp);
	const rocks = [];
	for (const { gx, gy } of corners) {
		const s = peakShape({ bx: gx, by: gy + 10, hw: 11, ph: 15 }, seed, { rough: 0.3, flat: 2 });
		if (pack.fresh(s.rows, reach) >= 0) {
			rocks.push({ s, ok: reach });
			pack.cover(s.rows);
		}
	}
	// One formation of cave rock to each plot, of its own size and place, with a smaller one behind it
	// now and then, so a run of plots never repeats the same shape.
	const isBlocked = blockedOf(fp);
	for (let r = 0; r < fp.rows; r++) {
		for (let c = 0; c < fp.cols; c++) {
			if (!isBlocked(r, c)) continue;
			const x0 = c * PITCH;
			const y0 = r * PITCH;
			const pr = seededRandom(hash(r, c, seed, 29));
			const tries = [
				{ bx: x0 + 16 + Math.round((pr() - 0.5) * 8), by: y0 + 27 + Math.floor(pr() * 4), hw: 10 + Math.floor(pr() * 6), ph: 12 + Math.floor(pr() * 8) },
				{ bx: x0 + 10 + Math.floor(pr() * 12), by: y0 + 14 + Math.floor(pr() * 5), hw: 6 + Math.floor(pr() * 5), ph: 9 + Math.floor(pr() * 6) },
			];
			for (const [k, t] of tries.entries()) {
				if (k === 1 && pr() < 0.4) continue;
				for (let shrink = 0; shrink < 4; shrink++) {
					const s = peakShape({ ...t, hw: t.hw - shrink * 2, ph: t.ph - shrink * 2 }, seed, { rough: 0.3, flat: Math.round(t.hw * 0.2) });
					if (pack.fresh(s.rows, plots) < 0) continue;
					rocks.push({ s, ok: plots });
					pack.cover(s.rows);
					break;
				}
			}
		}
	}
	// Stalagmites and crystals stand in front of the rock, where they would show.
	const spikes = [];
	for (const hw of [5, 4, 3]) {
		for (const [bx, by] of frontToBack(W, H, rand)) {
			if (!mask[by * W + bx] || rand() < 0.75) continue;
			const m = { bx, by, hw, ph: 8 + Math.round(hw * 2.5) + Math.floor(rand() * 6) };
			const rows = stalagmiteRows(m);
			if (!pack.clearInFront(bx, by, hw + 2) || pack.fresh(rows, plots) < 0.5) continue;
			spikes.push(m);
			pack.cover(rows);
		}
	}
	const blocked = blockedOf(fp);
	const crystals = [];
	let k = 0;
	for (let r = 0; r < fp.rows; r++) {
		for (let c = 0; c < fp.cols; c++) {
			if (!blocked(r, c) || k++ % 3 === 2) continue;
			const cx = c * PITCH + 9 + Math.floor(rand() * 14);
			const by = r * PITCH + 25 + Math.floor(rand() * 4);
			if (by < H && mask[by * W + cx] && plots[(by - 16) * W + cx]) crystals.push({ cx, by, h: 11 + Math.floor(rand() * 5), hue: rand() < 0.3 });
		}
	}
	const mounds = edgeMounds(fp, seed, [6, 4, 3, 3]);
	const scene = [
		...rocks.map(({ s, ok }) => ({ by: s.by, draw: () => drawCaveRock(canvas, s, ok) })),
		...spikes.map((m) => ({ by: m.by, draw: () => drawStalagmite(canvas, m, plots) })),
		...mounds.map((m) => ({ by: m.by, draw: () => drawMound(canvas, m.area, m, [C.stoneShade, CAVE.light, CAVE.base, CAVE.dark, C.night], CAVE_DARKER, [C.stoneMid, C.roofShade]) })),
		...crystals.map((x) => ({ by: x.by + 0.5, draw: () => drawCrystals(canvas, x.cx, x.by, x.h, plots, x.hue) })),
	].sort((a, b) => a.by - b.by);
	for (const item of scene) item.draw();
}

// ---------- Swamp: black water and dead trees ----------

const SWAMP_DARKER = {
	[C.swampMudLight]: C.swampMud,
	[C.swampMud]: C.swampMudShade,
	[C.swampMudShade]: C.quagPeat,
	[C.quagWater]: C.quagWaterDeep,
	[C.swampWaterDeep]: C.quagWater,
	[C.quagMoss]: C.quagMudShade,
	[C.swampMoss]: C.quagMoss,
};

function drawDeadTree(canvas, ok, t, pool) {
	const W = canvas.w;
	const rand = seededRandom(hash(t.bx, t.by, 13));
	// Bleached dead wood, warm grey, lit from the left.
	const lit = C.creamShade;
	const mid = C.plasterShade;
	const dark = C.timberShade;
	// Its reflection in the black water.
	const px = [];
	const add = (x, y, col) => px.push([x, y, col]);
	// Flared roots.
	for (let dx = -3; dx <= 3; dx++) add(t.bx + dx, t.by, Math.abs(dx) === 3 ? C.wood : dx < 0 ? mid : dark);
	for (let dx = -2; dx <= 2; dx++) add(t.bx + dx, t.by - 1, dx < 0 ? lit : dx === 0 ? mid : dark);
	let x = t.bx;
	const branches = [];
	for (let y = t.by - 2; y >= t.by - t.h; y--) {
		const up = t.by - y;
		const width = up < t.h * 0.3 ? 4 : up < t.h * 0.65 ? 3 : 2;
		add(x - 1, y, lit);
		for (let k = 0; k < width - 2; k++) add(x + k, y, (y + k) % 5 === 0 ? dark : mid);
		add(x + width - 2, y, dark);
		if (up > t.h * 0.4 && rand() < 0.14) branches.push([x, y]);
		if (rand() < 0.14) x += rand() < 0.5 ? -1 : 1;
	}
	// A split top.
	add(x - 2, t.by - t.h - 1, mid);
	add(x + 1, t.by - t.h - 1, dark);
	add(x - 3, t.by - t.h - 2, mid);
	add(x + 2, t.by - t.h - 3, dark);
	const moss = [];
	for (const [bx0, by0] of branches) {
		const dir = rand() < 0.5 ? -1 : 1;
		let bx = bx0 + dir;
		let by = by0;
		const len = 3 + Math.floor(rand() * 4);
		for (let s = 0; s < len; s++) {
			add(bx, by, s === 0 ? mid : dark);
			add(bx, by - 1, s < len - 1 && rand() < 0.4 ? lit : null);
			if (rand() < 0.5) moss.push([bx, by + 1]);
			bx += dir;
			if (rand() < 0.55) by -= 1;
		}
		add(bx, by - 1, dark);
	}
	// Moss hanging from the branches.
	for (const [mx, my] of moss) {
		const n = 2 + Math.floor(rand() * 3);
		for (let k = 0; k < n; k++) add(mx, my + k, k % 2 ? C.quagMoss : C.swampMoss);
	}
	if (pool[t.by * W + t.bx]) {
		for (const [rx, ry, col] of px) {
			const y = 2 * t.by - ry + 1;
			if (!col || ry > t.by - 1 || y >= canvas.h || !pool[y * W + rx]) continue;
			if (y - t.by > 6 || dither(rx, y) < 0) continue;
			put(canvas, ok, rx, y, C.quagPeat);
		}
	}
	for (let dx = 1; dx <= 5; dx++) {
		for (let dy = 0; dy <= 1; dy++) {
			if (dither(t.bx + dx, t.by + dy) < 0.15) cast(canvas, t.bx + dx, t.by + dy, 0.3, SWAMP_DARKER);
		}
	}
	for (const [px0, py0, col] of px) if (col) put(canvas, ok, px0, py0, col);
}

function drawReeds(canvas, ok, bx, by, n, tall, rand) {
	for (let k = 0; k < n; k++) {
		const x = bx + k * 2 - n + Math.floor(rand() * 2);
		const h = tall - 1 + Math.floor(rand() * 3);
		const lean = rand() < 0.5 ? -1 : 1;
		for (let t = 0; t < h; t++) {
			put(canvas, ok, x + (t > h - 3 ? lean : 0), by - t, t === h - 1 ? C.quagReedLight : t < 2 ? C.quagReedShade : k % 2 ? C.swampReed : C.quagReed);
		}
	}
}

function paintSwamp(canvas, fp, seed) {
	const { w: W, h: H, mask, plots, reach, corners } = fp;
	const area = withCornerPatches(fp, 8);
	drawFloor(canvas, area, seed, (roll) => (roll < 0.25 ? C.swampMud : roll < 0.33 ? C.quagPeat : C.swampMudShade));
	const d = distanceInside(mask, W, H);
	const wob = noise(seed + 6, 4);
	const pool = new Uint8Array(W * H);
	for (let i = 0; i < W * H; i++) {
		if (mask[i] && d[i] > 2.5 + wob(i % W, (i / W) | 0) * 5) pool[i] = 1;
	}
	const ripple = noise(seed + 8, 5);
	for (let i = 0; i < W * H; i++) {
		if (!pool[i]) continue;
		const x = i % W;
		const y = (i / W) | 0;
		let col;
		if (!pool[i - W]) col = C.quagPeat; // the far bank's face
		else if (!pool[i - 2 * W]) col = dither(x, y) > 0 ? C.quagPeat : C.quagWaterDeep;
		else if (!pool[i + W]) col = C.swampMudShade; // the near bank's lip
		else {
			const n = ripple(x / 2.5, y) + dither(x, y) * 0.12;
			col = n > 0.7 ? C.swampWaterDeep : n < 0.3 ? C.quagWaterDeep : C.quagWater;
			if (hash(x >> 2, y) % 41 === 0) col = C.swampWater;
			if (d[i] < 6 && hash(x, y, 4) % 13 === 0) col = C.quagSlime;
		}
		put(canvas, pool, x, y, col);
	}
	const rand = seededRandom(hash(seed, 3));
	const trees = [];
	// A few big dead trees, not a thicket: about one to every two plots.
	for (let y = 14; y < H; y += 21) {
		for (let x = Math.floor(y / 21) % 2 ? 14 : 3; x < W; x += 23) {
			const bx = x + Math.floor(rand() * 7) - 3;
			const by = y + Math.floor(rand() * 7) - 3;
			if (bx < 4 || by < 0 || bx >= W - 4 || by >= H || !pool[by * W + bx] || rand() < 0.35) continue;
			trees.push({ bx, by, h: 16 + Math.floor(rand() * 9), ok: plots });
		}
	}
	for (const { gx, gy } of corners) trees.push({ bx: gx, by: gy + 9, h: 14, ok: reach });
	const fits = (t) => {
		for (let y = t.by - t.h - 4; y <= t.by; y++) {
			for (let x = t.bx - 4; x <= t.bx + 4; x++) {
				if (x < 0 || y < 0 || x >= W || y >= H || !t.ok[y * W + x]) return false;
			}
		}
		return true;
	};
	const placed = trees.filter((t) => {
		if (fits(t)) return true;
		t.h = 9;
		return fits(t);
	});
	// Cypress knees in the water, and reeds along the banks.
	const knees = [];
	for (let i = 0; i < W * H; i += 7) {
		if (pool[i] && pool[i - 2 * W] && pool[i + W] && hash(i, 5) % 14 === 0) knees.push([i % W, (i / W) | 0]);
	}
	// A bed of tall reeds on the far bank, standing up behind the water, and a few on the near bank.
	const reeds = [];
	for (let i = W; i < W * H - 3 * W; i += 2) {
		const x = i % W;
		const y = (i / W) | 0;
		if (mask[i] && !pool[i] && pool[i + W] && pool[i + 3 * W] && hash(x, y, 9) % 3 === 0) reeds.push([x, y, 7]);
		else if (mask[i] && !pool[i] && pool[i - W * 2] && hash(x, y, 9) % 23 === 0) reeds.push([x, y, 4]);
	}
	const mounds = edgeMounds(fp, seed, [5, 4, 3, 2]);
	const scene = [
		...placed.map((t) => ({ by: t.by, draw: () => drawDeadTree(canvas, t.ok, t, pool) })),
		...knees.map(([x, y]) => ({
			by: y,
			draw: () => {
				put(canvas, pool, x, y - 2, C.timberLight);
				put(canvas, pool, x, y - 1, C.timberShade);
				put(canvas, pool, x + 1, y - 1, C.wood);
				put(canvas, pool, x, y, C.wood);
				put(canvas, pool, x + 1, y, C.quagPeat);
			},
		})),
		...reeds.map(([x, y, tall]) => ({ by: y, draw: () => drawReeds(canvas, plots, x, y, tall > 5 ? 2 : 3, tall, rand) })),
		...mounds.map((m) => ({
			by: m.by,
			draw: () => {
				drawMound(canvas, m.area, m, [C.swampMudLight, C.swampMudLight, C.swampMud, C.swampMudShade, C.quagPeat], SWAMP_DARKER, [C.swampMoss, C.quagMoss]);
				drawReeds(canvas, m.area, m.bx, m.by - m.ph + 1, 2, 4, rand);
			},
		})),
	].sort((a, b) => a.by - b.by);
	for (const item of scene) item.draw();
}

// ---------- Archipelago: a sea with rocky islets, and the volcano islands ----------

function paintArchipelago(canvas, fp, seed, opts = {}) {
	const { w: W, h: H, mask, plots } = fp;
	const volcanoes = opts.volcanoes ?? [];
	const isVolcano = (r, c) => volcanoes.some(([vr, vc]) => vr === r && vc === c);
	// The volcanoes' island: an oval in each volcano plot, joined between touching ones.
	const island = new Uint8Array(W * H);
	for (const [r, c] of volcanoes) {
		const cx = c * PITCH + 16;
		const cy = r * PITCH + 17;
		for (let y = cy - 14; y <= cy + 14; y++) {
			for (let x = cx - 15; x <= cx + 15; x++) {
				if (((x - cx) / 13) ** 2 + ((y - cy) / 12) ** 2 <= 1) island[y * W + x] = 1;
			}
		}
		if (isVolcano(r + 1, c)) {
			for (let y = cy; y <= cy + PITCH; y++) for (let x = cx - 11; x <= cx + 11; x++) island[y * W + x] = 1;
		}
	}
	const sea = new Uint8Array(W * H);
	for (let i = 0; i < W * H; i++) {
		if (mask[i] && !island[i] && !EIGHT.some(([dx, dy]) => island[i + dy * W + dx])) sea[i] = 1;
	}
	// At a corner join the water bends through the corner as a strait, not a pipe.
	const wear = noise(seed + 5, 3);
	const shore = new Uint8Array(W * H);
	for (const { gx, gy } of fp.corners) {
		for (let dy = -12; dy <= 12; dy++) {
			for (let dx = -12; dx <= 12; dx++) {
				const i = (gy + dy) * W + gx + dx;
				const r2 = dx * dx + dy * dy;
				const lim = 8 + wear(gx + dx, gy + dy) * 2;
				if (!fp.reach[i] || island[i]) continue;
				if (r2 <= lim * lim) sea[i] = 1;
				else if (r2 <= (lim + 3) * (lim + 3) && !plots[i]) shore[i] = 1;
			}
		}
	}
	// The sand round the water's edge, inside the water plots and round each strait.
	for (let i = 0; i < W * H; i++) {
		if ((plots[i] || shore[i]) && !sea[i] && !island[i]) {
			const x = i % W;
			const y = (i / W) | 0;
			canvas.p[i] = dither(x, y) > 0.2 ? C.sandShade : C.sand;
		}
	}
	const land = new Uint8Array(W * H);
	for (let i = 0; i < W * H; i++) land[i] = sea[i] ? 0 : 1;
	paintSea(canvas, sea, land, seed);
	// The far shore's wet face and surf, and foam along the near shore.
	for (let i = W; i < W * H - W; i++) {
		if (!sea[i]) continue;
		const x = i % W;
		const y = (i / W) | 0;
		if (!sea[i - W]) canvas.p[i] = C.sandShade;
		else if (!sea[i - 2 * W]) canvas.p[i] = dither(x, y) > -0.2 ? C.foam : C.dayWave;
		else if (!sea[i + W] && dither(x, y) > -0.1) canvas.p[i] = C.foam;
		else if ((!sea[i - 1] || !sea[i + 1]) && dither(x, y) > 0.2) canvas.p[i] = C.dayWave;
	}
	// Rocky islets far out in the open water.
	const dep = distanceInside(sea, W, H);
	const rand = seededRandom(hash(seed, 41));
	const islets = [];
	// One islet to about every eight water plots, only where the water is wide.
	const waterPlots = fp.plots.reduce((n, v) => n + v, 0) / (PLOT * PLOT);
	for (const [bx, by] of frontToBack(W, H, rand)) {
		if (islets.length >= Math.max(1, Math.floor(waterPlots / 8))) break;
		if (dep[by * W + bx] < 11 || rand() < 0.9) continue;
		if (islets.some((s) => Math.hypot(s.bx - bx, s.by - by) < 70)) continue;
		islets.push(peakShape({ bx, by, hw: 6 + Math.floor(rand() * 3), ph: 7 + Math.floor(rand() * 4) }, seed, { rough: 0.4, flat: 2 }));
	}
	islets.sort((a, b) => a.by - b.by);
	for (const s of islets) {
		ellipse(canvas, s.bx, s.by, s.hw + 2.5, 2, C.foam, (x, y) => sea[y * W + x]);
		const own = new Set();
		for (const [x, y] of rowPixels(s.rows)) own.add(y * W + x);
		for (const [x, y] of rowPixels(s.rows)) {
			const i = y * W + x;
			const lit = x < s.ridge(y);
			const depth = (y - s.sy) / s.ph;
			let col = lit ? (dither(x, y) > 0 ? C.stoneLight : C.stone) : dither(x, y) > 0.1 ? C.stoneMid : C.stoneShade;
			if (depth < 0.25 && lit) col = C.grassLight;
			else if (depth < 0.3) col = C.grassShade;
			if (depth > 0.85) col = C.foam;
			const edge = !own.has(i - 1) || !own.has(i + 1) || !own.has(i - W);
			if (edge && depth < 0.8) col = C.ink;
			put(canvas, plots, x, y, col);
		}
	}
	// Each volcano island: a beach, green lower slopes and the cones.
	const isle = distanceInside(island, W, H);
	for (let i = 0; i < W * H; i++) {
		if (!island[i]) continue;
		const x = i % W;
		const y = (i / W) | 0;
		const e = isle[i];
		canvas.p[i] = e <= 1 ? C.foam : e <= 3.5 ? (dither(x, y) > 0.1 ? C.sandLight : C.sand) : dither(x, y) > 0.25 ? C.grassLight : C.grass;
	}
	const cones = [];
	for (const [r, c] of volcanoes) {
		const twinBelow = isVolcano(r + 1, c);
		const twinAbove = isVolcano(r - 1, c);
		const big = !twinBelow;
		cones.push(
			peakShape(
				{ bx: c * PITCH + 16 + (twinAbove ? 1 : twinBelow ? -2 : 0), by: r * PITCH + (big ? 27 : 25), hw: big ? 14 : 11, ph: big ? 24 : 21 },
				seed,
				{ rough: 0.22, flat: 3 }
			)
		);
	}
	cones.sort((a, b) => a.by - b.by);
	for (const s of cones) drawVolcano(canvas, s, plots);
}

function drawVolcano(canvas, s, ok) {
	const W = canvas.w;
	const own = new Set();
	for (const [x, y] of rowPixels(s.rows)) own.add(y * W + x);
	const grain = noise(hash(s.bx, s.by, 7), 2.5);
	// A lava stream down the shaded flank.
	const lava = new Map();
	let lx = s.sx + 2;
	for (let y = s.sy + 2; y < s.sy + s.ph * 0.6; y++) {
		lava.set(y, lx);
		if (s.rand() < 0.45) lx += 1;
	}
	for (const [x, y] of rowPixels(s.rows)) {
		const i = y * W + x;
		const lit = x < s.ridge(y);
		const depth = (y - s.sy) / s.ph;
		const n = grain(x, y) + dither(x, y) * 0.25;
		let col = lit ? (n > 0.6 ? C.basaltLight : C.basalt) : n > 0.6 ? C.basalt : C.basaltShade;
		if (y - s.sy <= 1) col = y === s.sy ? C.lavaDeep : n > 0.5 ? C.ember : C.lava; // the crater's glow
		if (lava.get(y) === x) col = y - s.sy < 5 ? C.ember : C.lava;
		else if (lava.get(y) === x - 1 && y - s.sy > 3) col = C.lavaDeep;
		const green = Math.max(0, (depth - 0.55) / 0.45);
		if (green ** 1.2 > 0.5 - dither(x, y) + (grain(x + 50, y) - 0.5) * 0.5) {
			col = lit ? (n > 0.55 ? C.grassLight : C.grass) : n > 0.5 ? C.grass : C.grassShade;
		}
		const edge = !own.has(i - 1) || !own.has(i + 1) || !own.has(i - W);
		if (edge && depth < 0.6) col = C.ink;
		else if (edge && !own.has(i + 1) && depth < 0.85) col = C.grassShade;
		put(canvas, ok, x, y, col);
	}
	// Smoke rising from the crater.
	for (const [dx, dy, r, k] of [
		[1, -3, 2, 0],
		[3, -6, 2.5, 1],
		[2, -10, 2, 2],
	]) {
		const cx = s.sx + dx;
		const cy = s.sy + dy;
		for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
			for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
				if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) continue;
				put(canvas, ok, x, y, x - cx + (y - cy) < 0 ? (k === 2 ? C.stoneLight : C.cloudShade) : C.stone);
			}
		}
	}
}

// ---------- Cloud City: banks of cloud ----------

function paintCloudCity(canvas, fp, seed, opts = {}) {
	const { w: W, h: H, mask, plots, reach, corners } = fp;
	const tintAt = (x, y) => TINTS[opts.tintAt ? opts.tintAt(Math.min(fp.rows - 1, Math.floor(y / PITCH)), Math.min(fp.cols - 1, Math.floor(x / PITCH))) : 0];
	drawFloor(canvas, mask, seed, (roll, x, y) => (roll < 0.3 ? tintAt(x, y).base : tintAt(x, y).dark));
	const rand = seededRandom(hash(seed, 11));
	const pack = packer(fp);
	const discRows = (p) => {
		const rows = [];
		for (let y = Math.round(p.cy - p.r); y <= Math.round(p.cy + p.r * 0.6); y++) {
			const v = (y - p.cy) / p.r;
			const half = Math.round(p.r * Math.sqrt(Math.max(0, 1 - v * v)));
			rows.push([y, p.cx - half, p.cx + half]);
		}
		return rows;
	};
	const puffs = [];
	for (const { gx, gy, down } of corners) {
		const f = down ? 1 : -1;
		for (const [dx, dy, r] of [
			[0, 1, 7],
			[-5, 6, 5],
			[5, -3, 5],
			[4, 8, 4],
		]) {
			const p = { cx: gx + dx * f, cy: gy + dy, r, ok: reach };
			if (pack.fresh(discRows(p), reach) >= 0) {
				puffs.push(p);
				pack.cover(discRows(p));
			}
		}
	}
	// Billows of every size on a loose grid, each as big as its room allows or smaller, so a long
	// bank is a lumpy cauliflower, not a row of equal balls.
	const room = distanceInside(plots, W, H);
	for (let y = 4; y < H; y += 6) {
		for (let x = (y / 6) % 2 ? 3 : 0; x < W; x += 7) {
			const cx = x + Math.floor(rand() * 5) - 2;
			const cy = y + Math.floor(rand() * 5) - 2;
			if (cx < 0 || cy < 0 || cx >= W || cy >= H || !mask[cy * W + cx]) continue;
			const r = Math.round(clamp(Math.min(room[cy * W + cx] - 1, 3 + rand() * rand() * 13), 3, 15));
			const p = { cx, cy, r, ok: plots };
			if (!fitsIn(discRows(p), plots, W, H)) continue;
			puffs.push(p);
		}
	}
	void pack;
	// Low puffs along the front edges, where the bank meets the deck.
	const blocked = blockedOf(fp);
	for (let r = 0; r < fp.rows; r++) {
		for (let c = 0; c < fp.cols; c++) {
			if (!blocked(r, c) || blocked(r + 1, c)) continue;
			for (const dx of [8, 20]) {
				const p = { cx: c * PITCH + dx + Math.floor(rand() * 4), cy: r * PITCH + 27, r: 4, ok: plots };
				if (fitsIn(discRows(p), plots, W, H)) puffs.push(p);
			}
		}
	}
	puffs.sort((a, b) => a.cy + a.r * 0.6 - (b.cy + b.r * 0.6));
	// Each puff's shadow on the deck first, then the puffs from the back to the front.
	for (const p of puffs) {
		const by = Math.round(p.cy + p.r * 0.6);
		for (let x = p.cx; x <= p.cx + p.r + 3; x++) {
			for (let y = by; y <= by + 2; y++) {
				if (x < W && y < H && p.ok[y * W + x] && dither(x, y) < 0.15 && !canvas.p[y * W + x]) shadow(canvas, x, y, 0.18);
			}
		}
	}
	// Where any puff lies: an outline goes only round the bank's outside, so the billows inside read
	// as one cloud, parted by soft shade.
	const bank = new Uint8Array(W * H);
	for (const p of puffs) for (const [x, y] of rowPixels(discRows(p))) if (x >= 0 && y >= 0 && x < W && y < H && p.ok[y * W + x]) bank[y * W + x] = 1;
	for (const p of puffs) {
		const rows = discRows(p);
		const own = new Set();
		for (const [x, y] of rowPixels(rows)) own.add(y * W + x);
		const grain = noise(hash(p.cx, p.cy, 3), 2);
		const t = tintAt(p.cx, p.cy);
		const ramp = [C.white, t.light, t.base, t.dark, t.rim];
		for (const [x, y] of rowPixels(rows)) {
			const i = y * W + x;
			const u = (x - p.cx) / p.r;
			const v = (y - p.cy) / p.r;
			const light = -u * 0.45 - v * 1.0 + (grain(x, y) - 0.5) * 0.35 + dither(x, y) * 0.2;
			let k = light > 0.55 ? 0 : light > 0.05 ? 1 : light > -0.4 ? 2 : light > -0.8 ? 3 : 4;
			// The belly is in shade, and the base melts into the deck below.
			if (v > 0.25 && dither(x, y) + (v - 0.25) * 2.4 > 0.45) k = Math.max(k, 3);
			let col = ramp[k];
			const out = !bank[i - 1] || !bank[i + 1] || !bank[i - W];
			const seam = !own.has(i - W) && v < 0;
			if (out && v < 0.35) col = t.rim;
			else if (seam) col = t.dark;
			put(canvas, p.ok, x, y, col);
		}
	}
}

// ---------- Round 2 (owner, 2026-10-31) ----------

const lift = (col, t = 0.18) => mix(col, C.white, t);
const sink = (col, t = 0.25) => mix(col, C.ink, t);

/** The painted layers of the Mesa's cliffs, from the cap rock down, repeating. */
const STRATA = [
	C.plasterShade, C.plasterShade,
	C.mesaRockLight, C.mesaRockLight, C.mesaRockLight,
	C.creamShade,
	C.mesaRock, C.mesaRock, C.mesaRock,
	C.mesaStrata, C.mesaStrata,
	C.mesaRockShade, C.mesaRockShade,
	C.brickRedShade,
	C.mesaRock, C.mesaRock,
	C.creamShade, C.mesaRockLight,
];

/** Mesa, round 2: one long tableland, its cliffs in painted layers, a talus skirt with gullies at its foot. */
function paintMesaTable(canvas, fp, seed) {
	const { w: W, h: H, mask, plots, reach, corners } = fp;
	const edge = noise(seed + 2, 7);
	const grain = noise(seed + 4, 2);
	const topEnd = new Int16Array(W * H).fill(-1);
	const runs = [];
	// The tableland's plan is worn ragged, so its outline is never a rounded box.
	const wear = noise(seed + 6, 3);
	const d0 = distanceInside(mask, W, H);
	const land = new Uint8Array(W * H);
	for (let i = 0; i < W * H; i++) if (mask[i] && d0[i] > wear(i % W, (i / W) | 0) * 3.2) land[i] = 1;
	const onLand = (i) => land[i] === 1;
	for (let x = 0; x < W; x++) {
		let y = 0;
		while (y < H) {
			if (!onLand(y * W + x)) {
				y++;
				continue;
			}
			let y1 = y;
			while (y1 + 1 < H && onLand((y1 + 1) * W + x)) y1++;
			const len = y1 - y + 1;
			const talus = clamp(Math.round(len * 0.18), 3, 7);
			const cliff = clamp(Math.round(len * 0.55), 8, 19);
			const notch = hash(Math.floor((x + 3) / 11), y1, seed) % 6 === 0 ? 4 : 0;
			const end = clamp(y1 - talus - cliff + Math.round((edge(x, y1) - 0.5) * 6) - notch, y + 1, y1 - talus - 3);
			const foot = y1 - talus + Math.round((edge(x + 99, y1) - 0.5) * 3);
			runs.push({ x, y0: y, y1, end, foot });
			for (let k = y; k <= y1; k++) topEnd[k * W + x] = end;
			y = y1 + 1;
		}
	}
	const endAt = (x, y) => (x < 0 || x >= W ? -1 : topEnd[y * W + x]);
	for (const { x, y0, y1, end, foot } of runs) {
		for (let y = y0; y <= y1; y++) {
			const i = y * W + x;
			const n = grain(x, y) - 0.5 + dither(x, y) * 0.4;
			const outsideL = !land[i - 1];
			const outsideR = !land[i + 1];
			let col;
			if (y <= end) {
				// The tabletop: red soil, scrub and juniper, with a lit rim along its front.
				if (y === y0 || outsideL || outsideR) col = C.ink;
				else if (y === end) col = C.mesaStrata;
				else if (y === y0 + 1) col = C.mesaSoilLight;
				else if (hash(x >> 1, y >> 1, seed) % 23 === 0) col = (x + y) % 2 ? C.pine : C.pineShade;
				else if (hash(x, y, 5) % 29 === 0) col = C.mesaSage;
				else col = n > 0.1 ? C.mesaSoilLight : C.mesaSoil;
			} else if (y <= foot) {
				// The cliff: layers parallel to its rim, lit where it turns to the left, fluted by rain.
				const band = STRATA[(y - end - 1) % STRATA.length];
				const slope = endAt(x - 1, y) - endAt(x + 1, y);
				let c2 = slope > 1 ? lift(band) : slope < -1 ? sink(band) : band;
				if (hash(x, seed, 3) % 5 === 0) c2 = sink(c2, 0.15);
				if (outsideR) c2 = sink(band, 0.35);
				else if (outsideL) c2 = lift(band, 0.22);
				col = (outsideL || outsideR) && y - end < (foot - end) * 0.7 ? C.ink : c2;
				if (y === end + 1) col = sink(C.plasterShade, 0.3); // the shade under the cap rock
			} else {
				// The talus: soil and rubble fanning out, cut by gullies, fading into the plain.
				const t = (y - foot) / Math.max(1, y1 - foot);
				if (t > 0.6 && dither(x, y) + (t - 0.6) * 2 > 0.45) continue;
				const gully = hash(Math.floor(x / 4), seed, 11) % 3 === 0 && x % 4 === 1;
				col = gully ? C.mesaSoilDark : n > 0.15 ? C.mesaSoilLight : n > -0.15 ? C.mesaSoil : C.mesaSoilShade;
				if (hash(x, y, 13) % 17 === 0) col = C.mesaRock;
			}
			put(canvas, plots, x, y, col);
		}
	}
	// A butte stands over each corner join, as a remnant of the same tableland.
	for (const { gx, gy, down } of corners) {
		const f = down ? 1 : -1;
		const s = rockShape({ kind: 'butte', bx: gx + f, by: gy + 10, hw: 10, ph: 17 }, seed);
		if (fitsIn(s.rows, reach, W, H)) drawRock(canvas, s, reach);
	}
}

/** Archipelago, round 2: each volcano is a volcanic island, a broad dark cone with a black-sand shore. */
function paintArchipelago2(canvas, fp, seed, opts = {}) {
	paintArchipelago(canvas, fp, seed, { ...opts, volcanoes: [] });
	const { w: W, plots } = fp;
	const volcanoes = opts.volcanoes ?? [];
	const isVolcano = (r, c) => volcanoes.some(([vr, vc]) => vr === r && vc === c);
	const island = new Uint8Array(W * fp.h);
	for (const [r, c] of volcanoes) {
		const cx = c * PITCH + 16;
		const cy = r * PITCH + 16;
		for (let y = cy - 16; y <= cy + 16; y++) {
			for (let x = cx - 16; x <= cx + 16; x++) {
				const wob = (hash(x >> 1, y >> 1, 3) % 100) / 100;
				if (((x - cx) / (14.5 + wob)) ** 2 + ((y - cy) / (13.5 + wob)) ** 2 <= 1 && plots[y * W + x]) island[y * W + x] = 1;
			}
		}
		if (isVolcano(r + 1, c)) {
			for (let y = cy; y <= cy + PITCH; y++) for (let x = cx - 13; x <= cx + 13; x++) if (plots[y * W + x]) island[y * W + x] = 1;
		}
	}
	const e = distanceInside(island, W, fp.h);
	for (let i = 0; i < island.length; i++) {
		if (!island[i]) continue;
		const x = i % W;
		const y = (i / W) | 0;
		// Foam, then black sand, then dark rock with a fringe of green.
		canvas.p[i] = e[i] <= 1 ? C.foam : e[i] <= 3.5 ? (dither(x, y) > 0.1 ? C.ash : C.ashShade) : dither(x, y) > 0.25 ? C.forestFloorLight : dither(x, y) > -0.2 ? C.forestFloor : C.forestFloorShade;
		if (canvas.alpha) canvas.alpha[i] = 1;
	}
	// Two touching volcano plots are one volcanic massif: the big cone stands behind, its foot reaching
	// into the lower plot, and a smaller cone stands in front of it.
	const cones = [];
	for (const [r, c] of volcanoes) {
		const behind = isVolcano(r + 1, c);
		const front = isVolcano(r - 1, c);
		const x = c * PITCH + 16;
		if (behind) cones.push(peakShape({ bx: x - 1, by: r * PITCH + 38, hw: 12, ph: 34 }, seed, { rough: 0.14, flat: 2 }));
		else if (front) cones.push(peakShape({ bx: x + 2, by: r * PITCH + 27, hw: 10, ph: 14 }, seed + 1, { rough: 0.16, flat: 2 }));
		else cones.push(peakShape({ bx: x, by: r * PITCH + 26, hw: 12, ph: 22 }, seed, { rough: 0.14, flat: 2 }));
	}
	cones.sort((a, b) => a.by - b.by);
	for (const s of cones) drawVolcano2(canvas, s, island, plots);
}

function drawVolcano2(canvas, s, island, plots) {
	const W = canvas.w;
	const own = new Set();
	for (const [x, y] of rowPixels(s.rows)) own.add(y * W + x);
	const grain = noise(hash(s.bx, s.by, 7), 2.5);
	// A lava flow from the crater down the shaded flank, to the shore.
	const lava = new Map();
	let lx = s.sx + 2;
	for (let y = s.sy + 1; y <= s.by + 3; y++) {
		lava.set(y, lx);
		if (s.rand() < 0.4) lx += 1;
	}
	for (const [x, y] of rowPixels(s.rows)) {
		const i = y * W + x;
		const lit = x < s.ridge(y);
		const depth = (y - s.sy) / s.ph;
		const n = grain(x, y) + dither(x, y) * 0.25;
		let col = lit ? (n > 0.62 ? C.basaltLight : n > 0.3 ? C.basalt : C.basaltShade) : n > 0.66 ? C.basalt : n > 0.3 ? C.basaltShade : C.hellRockDeep;
		// Old flows streak the slopes.
		if (hash(x >> 1, y, 9) % 13 === 0) col = lit ? C.ashLight : C.ash;
		if (y - s.sy <= 1) col = y === s.sy ? C.lavaDeep : n > 0.5 ? C.ember : C.lava;
		if (lava.get(y) === x) col = y - s.sy < 6 ? C.ember : C.lava;
		else if (lava.get(y) === x - 1 && y - s.sy > 2) col = C.lavaDeep;
		const green = Math.max(0, (depth - 0.62) / 0.38);
		if (lava.get(y) !== x && green ** 1.3 > 0.5 - dither(x, y) + (grain(x + 50, y) - 0.5) * 0.5) {
			col = lit ? (n > 0.5 ? C.forestFloorLight : C.forestFloor) : C.forestFloorShade;
		}
		const edgePx = !own.has(i - 1) || !own.has(i + 1) || !own.has(i - W);
		if (edgePx && depth < 0.62) col = C.ink;
		put(canvas, island, x, y, col);
	}
	// Where the lava meets the sea it steams; a plume of smoke leans off the crater.
	const lastY = Math.max(...[...lava.keys()].filter((y) => island[y * W + lava.get(y)]));
	const sx = lava.get(lastY);
	for (const [dx, dy, r, col] of [
		[0, -1, 2.5, C.cloudShade],
		[2, -3, 2, C.white],
		[s.sx - sx + 1, s.sy - lastY - 3, 2.5, C.stoneMid],
		[s.sx - sx + 4, s.sy - lastY - 6, 3.2, C.stone],
		[s.sx - sx + 8, s.sy - lastY - 8, 2.8, C.stoneLight],
	]) {
		const cx = sx + dx;
		const cy = lastY + dy;
		for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
			for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
				if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) continue;
				put(canvas, plots, x, y, x - cx + (y - cy) < -0.5 ? lift(col, 0.3) : col);
			}
		}
	}
}

/** The mountain terraces of Cloud City: alpine ground veiled in the tint of its cloud. */
const MIST_GROUNDS = TINTS.map((t, k) => ({
	seed: 7700 + k,
	base: mix(C.alpineMeadowLight, t.base, 0.55),
	light: mix(C.alpineMeadowPale, t.light, 0.6),
	dark: mix(C.alpineMeadowShade, t.dark, 0.5),
	count: 12,
	scatter: (p, px, py, roll, rand) => {
		if (roll < 0.3) {
			p(px, py, mix(C.stoneLight, t.light, 0.3));
			p(px + 1, py, mix(C.stone, t.base, 0.3));
			p(px + 1, py + 1, mix(C.stoneShade, t.dark, 0.3));
		} else if (roll < 0.55) {
			const n = 4 + Math.floor(rand() * 5);
			for (let i = 0; i < n; i++) p(px + i, py, t.light); // a wisp of mist
		} else if (roll < 0.75) {
			p(px, py, mix(C.alpineMeadowShade, t.dark, 0.3));
			p(px - 1, py - 1, mix(C.alpineMoss, t.base, 0.4));
			p(px + 1, py - 1, mix(C.alpineMeadowShade, t.dark, 0.3));
		}
	},
}));

/** The cloud ramp of a tint, light to dark. */
const cloudRamp = (t) => [C.white, t.light, t.base, t.dark, t.rim];

/** A puff of cloud with its outline only round the bank's outside. */
function drawPuffs(canvas, puffs, tintAt) {
	const { w: W, h: H } = canvas;
	const discRows = (p) => {
		const rows = [];
		for (let y = Math.round(p.cy - p.r); y <= Math.round(p.cy + p.r * 0.6); y++) {
			const v = (y - p.cy) / p.r;
			const half = Math.round(p.r * Math.sqrt(Math.max(0, 1 - v * v)));
			rows.push([y, p.cx - half, p.cx + half]);
		}
		return rows;
	};
	const bank = new Uint8Array(W * H);
	for (const p of puffs) for (const [x, y] of rowPixels(discRows(p))) if (x >= 0 && y >= 0 && x < W && y < H && p.ok[y * W + x]) bank[y * W + x] = 1;
	return (p) => {
		const rows = discRows(p);
		const own = new Set();
		for (const [x, y] of rowPixels(rows)) own.add(y * W + x);
		const grain = noise(hash(p.cx, p.cy, 3), 2);
		const ramp = cloudRamp(tintAt(p.cx, p.cy));
		for (const [x, y] of rowPixels(rows)) {
			const i = y * W + x;
			const u = (x - p.cx) / p.r;
			const v = (y - p.cy) / p.r;
			const light = -u * 0.45 - v * 1.0 + (grain(x, y) - 0.5) * 0.35 + dither(x, y) * 0.2;
			let k = light > 0.55 ? 0 : light > 0.05 ? 1 : light > -0.4 ? 2 : light > -0.8 ? 3 : 4;
			if (v > 0.25 && dither(x, y) + (v - 0.25) * 2.4 > 0.45) k = Math.max(k, 3);
			let col = ramp[k];
			if ((!bank[i - 1] || !bank[i + 1] || !bank[i - W]) && v < 0.35) col = ramp[4];
			else if (!own.has(i - W) && v < 0) col = ramp[3];
			put(canvas, p.ok, x, y, col);
		}
	};
}

const tintFor = (fp, opts) => (x, y) =>
	TINTS[opts.tintAt ? opts.tintAt(Math.min(fp.rows - 1, Math.floor(y / PITCH)), Math.min(fp.cols - 1, Math.floor(x / PITCH))) : 0];

/** A tall stone pillar with a flat, pine-topped summit. */
function pillarRows(s) {
	const rows = [];
	for (let y = s.by - s.ph; y <= s.by; y++) {
		const t = (y - (s.by - s.ph)) / s.ph;
		const half = t < 0.06 ? s.hw - 2 : t < 0.12 ? s.hw - 1 : Math.round(s.hw * (0.85 + 0.3 * t ** 1.5) + ((hash(y >> 2, s.bx) % 3) - 1) * 0.6);
		rows.push([y, s.bx - half + (s.lean * t > 0 ? Math.round(s.lean * (1 - t)) : 0), s.bx + half + Math.round(s.lean * (1 - t))]);
	}
	return rows;
}

function drawPillar(canvas, s, ok) {
	const W = canvas.w;
	const rows = pillarRows(s);
	const own = new Set();
	const span = new Map();
	for (const [y, a, b] of rows) {
		span.set(y, [a, b]);
		for (let x = a; x <= b; x++) own.add(y * W + x);
	}
	const grain = noise(hash(s.bx, s.by, 5), 2);
	for (const [x, y] of rowPixels(rows)) {
		const i = y * W + x;
		const [a, b] = span.get(y);
		const u = (x - (a + b) / 2) / Math.max(1, (b - a) / 2);
		const t = (y - (s.by - s.ph)) / s.ph;
		const n = grain(x, y) - 0.5 + dither(x, y) * 0.4;
		let col = u < -0.35 ? (n > 0 ? C.stoneLight : C.stone) : u < 0.35 ? (n > 0.1 ? C.stone : C.stoneMid) : n > 0.2 ? C.stoneShade : C.roofShade;
		if (hash(x, s.bx, 2) % 6 === 0 && t > 0.15) col = C.stoneShade; // vertical cracks
		if (t < 0.1) col = n > 0 ? C.alpineMeadowLight : C.alpineMeadow; // the grassy summit
		const edgePx = !own.has(i - 1) || !own.has(i + 1) || !own.has(i - W);
		if (edgePx && t < 0.8) col = C.ink;
		put(canvas, ok, x, y, col);
	}
	// A pine or two on the summit.
	const top = s.by - s.ph;
	for (const dx of s.hw >= 6 ? [-2, 2] : [0]) {
		const px = s.bx + dx + Math.round(s.lean);
		for (let k = 0; k < 6; k++) {
			const half = Math.floor((k + 1) / 2.5);
			for (let x = -half; x <= half; x++) put(canvas, ok, px + x, top - 6 + k + 1, x === -half || x === half ? C.pineShade : x < 0 ? C.pineLight : C.pine);
		}
		put(canvas, ok, px, top - 6, C.pineShade);
	}
}

/** Cloud City (approved as option B, round 2): stone pillars rise out of banks of cloud. */
function paintCloudPeaks(canvas, fp, seed, opts = {}) {
	const { w: W, h: H, mask, plots, reach, corners } = fp;
	const tintAt = tintFor(fp, opts);
	drawFloor(canvas, mask, seed, (roll, x, y) => (roll < 0.4 ? tintAt(x, y).base : tintAt(x, y).dark));
	const rand = seededRandom(hash(seed, 17));
	const room = distanceInside(plots, W, H);
	const pillars = [];
	for (let y = 22; y < H; y += 17) {
		for (let x = Math.floor(y / 17) % 2 ? 11 : 3; x < W; x += 17) {
			const bx = x + Math.floor(rand() * 7) - 3;
			const by = y + Math.floor(rand() * 7) - 3;
			if (bx < 0 || by < 0 || bx >= W || by >= H || !mask[by * W + bx] || rand() < 0.2) continue;
			const s = { bx, by, hw: clamp(Math.floor(5 + rand() * 5), 3, Math.floor(room[by * W + bx]) - 1), ph: 24 + Math.floor(rand() * 18), lean: (rand() - 0.5) * 3 };
			while (s.ph > 10 && !fitsIn(pillarRows(s), plots, W, H)) s.ph -= 3;
			if (s.hw >= 3 && fitsIn(pillarRows({ ...s, ph: s.ph + 7 }), plots, W, H)) pillars.push(s);
		}
	}
	for (const { gx, gy } of corners) {
		const s = { bx: gx, by: gy + 6, hw: 5, ph: 18, lean: 0 };
		if (fitsIn(pillarRows({ ...s, ph: s.ph + 7 }), reach, W, H)) pillars.push({ ...s, ok: reach });
	}
	// Cloud puffs fill the footprint round the pillars' feet.
	const puffs = [];
	for (let y = 4; y < H; y += 6) {
		for (let x = (y / 6) % 2 ? 3 : 0; x < W; x += 7) {
			const cx = x + Math.floor(rand() * 5) - 2;
			const cy = y + Math.floor(rand() * 5) - 2;
			if (cx < 0 || cy < 0 || cx >= W || cy >= H || !mask[cy * W + cx]) continue;
			const r = Math.round(clamp(Math.min(room[cy * W + cx] - 1, 3 + rand() * 6), 3, 9));
			puffs.push({ cx, cy, r, ok: plots });
		}
	}
	for (const { gx, gy } of corners) puffs.push({ cx: gx, cy: gy + 5, r: 6, ok: reach }, { cx: gx - 4, cy: gy + 8, r: 4, ok: reach });
	const drawPuff = drawPuffs(canvas, puffs, tintAt);
	// A pillar stands behind the puffs in front of its foot, so the clouds wrap round its base.
	const scene = [
		...pillars.map((s) => ({ by: s.by - 6, draw: () => drawPillar(canvas, s, s.ok ?? plots) })),
		...puffs.map((p) => ({ by: p.cy + p.r * 0.6, draw: () => drawPuff(p) })),
	].sort((a, b) => a.by - b.by);
	for (const item of scene) item.draw();
}

/** Cloud City, rejected option A (round 2): the approved #82 peaks, their feet and flanks wrapped in banks of tinted cloud. */
function paintCloudMountains(canvas, fp, seed, opts = {}) {
	const { w: W, h: H, plots, reach, corners } = fp;
	const tintAt = tintFor(fp, opts);
	paintMountains(canvas, fp, seed);
	const rand = seededRandom(hash(seed, 23));
	const blocked = blockedOf(fp);
	const puffs = [];
	for (let r = 0; r < fp.rows; r++) {
		for (let c = 0; c < fp.cols; c++) {
			if (!blocked(r, c)) continue;
			const x0 = c * PITCH;
			const y0 = r * PITCH;
			// A bank along the foot of every plot that faces open ground below, and a belt across the
			// flanks of the plots behind.
			const front = !blocked(r + 1, c);
			for (let x = 2; x < PLOT; x += 6) {
				const p = front
					? { cx: x0 + x + Math.floor(rand() * 3), cy: y0 + 25 + Math.floor(rand() * 3), r: 4 + Math.floor(rand() * 4), ok: plots }
					: { cx: x0 + x + Math.floor(rand() * 3), cy: y0 + 18 + Math.floor(rand() * 6), r: 3 + Math.floor(rand() * 3), ok: plots };
				if (!front && rand() < 0.45) continue;
				if (fitsIn([[Math.round(p.cy + p.r * 0.6), p.cx - p.r, p.cx + p.r], [Math.round(p.cy - p.r), p.cx, p.cx]], plots, W, H)) puffs.push(p);
			}
		}
	}
	for (const { gx, gy } of corners) puffs.push({ cx: gx, cy: gy + 9, r: 5, ok: reach }, { cx: gx + 5, cy: gy + 11, r: 4, ok: reach }, { cx: gx - 5, cy: gy + 12, r: 4, ok: reach });
	const drawPuff = drawPuffs(canvas, puffs, tintAt);
	puffs.sort((a, b) => a.cy - b.cy);
	for (const p of puffs) drawPuff(p);
}

/** Cloud City, an idea not shown: the ground drops away in grey cliffs to a sea of cloud far below. */
function paintCloudDrop(canvas, fp, seed, opts = {}) {
	const { w: W, h: H, mask, reach, corners } = fp;
	const tintAt = tintFor(fp, opts);
	const wear = noise(seed + 5, 2.5);
	const d0 = distanceInside(mask, W, H);
	const hole = new Uint8Array(W * H);
	for (let i = 0; i < W * H; i++) if (mask[i] && d0[i] > 1.5 + wear(i % W, (i / W) | 0) * 2.5) hole[i] = 1;
	for (const { gx, gy } of corners) {
		for (let dy = -9; dy <= 9; dy++) {
			for (let dx = -9; dx <= 9; dx++) {
				const i = (gy + dy) * W + gx + dx;
				if (dx * dx + dy * dy <= 8.5 * 8.5 + wear(gx + dx, gy + dy) * 10 && reach[i]) hole[i] = 1;
			}
		}
	}
	drawFloor(canvas, withCornerPatches(fp, 12), seed, (roll, x, y) => (roll < 0.5 ? mix(C.stone, tintAt(x, y).base, 0.4) : mix(C.stoneMid, tintAt(x, y).dark, 0.4)));
	const dep = distanceInside(hole, W, H);
	const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : dep[y * W + x]);
	const sea = noise(seed + 12, 5);
	const fine = noise(seed + 13, 2);
	const peaks = [];
	for (let i = 0; i < W * H; i += 5) if (dep[i] >= 9 && hash(i, 3) % 61 === 0) peaks.push([i % W, (i / W) | 0]);
	for (let i = 0; i < W * H; i++) {
		if (!hole[i]) continue;
		const x = i % W;
		const y = (i / W) | 0;
		const d = dep[i];
		const gx = at(x + 1, y) - at(x - 1, y);
		const gy = at(x, y + 1) - at(x, y - 1);
		const ramp = cloudRamp(tintAt(x, y));
		let col;
		const near = gy < -0.5 && Math.abs(gy) >= Math.abs(gx);
		if (d <= 1) col = near ? C.stoneShade : C.stoneLight;
		else if (!near && d < 6) {
			// The cliffs: grey rock stepping down, lit on the east wall, in shade on the west.
			const facing = Math.abs(gx) > Math.abs(gy) ? (gx > 0 ? 1 : -1) : 0;
			let k = 1 + facing + Math.floor(d / 3);
			if (d % 2.6 < 0.9) k -= 1;
			col = [C.stoneLight, C.stone, C.stoneMid, C.stoneShade, C.roofShade][clamp(k, 0, 4)];
			// Mist curls up the lower cliff.
			if (d > 4 && dither(x, y) > 0.2) col = ramp[2];
		} else if (near && d < 2.5) col = ramp[4];
		else {
			// The sea of cloud below: soft lumps, lit from the upper left.
			const n = sea(x, y * 1.6) * 0.7 + fine(x, y) * 0.3 + dither(x, y) * 0.12;
			const lump = n - sea(x + 2, y * 1.6 + 3) * 0.5;
			col = ramp[lump > 0.28 ? 0 : lump > 0.15 ? 1 : lump > 0 ? 2 : 3];
		}
		put(canvas, hole, x, y, col);
	}
	// A distant peak pokes through the clouds here and there.
	for (const [px, py] of peaks) {
		for (let k = 0; k <= 6; k++) {
			for (let dx = -k; dx <= k; dx++) {
				const x = px + dx;
				const y = py - 6 + k;
				put(canvas, hole, x, y, k < 2 ? C.snow : dx < 0 ? C.stoneMid : C.stoneShade);
			}
		}
	}
}

// ---------- Mat features drawn on the ground (not the relief) ----------

function drawCactus(canvas, ox, oy) {
	const at = (x, y) => (oy + y) * canvas.w + ox + x;
	const set = (x, y, col) => {
		canvas.p[at(x, y)] = col;
	};
	for (let x = 15; x <= 24; x++) for (let y = 26; y <= 28; y++) if (dither(ox + x, oy + y) < 0.2) canvas.p[at(x, y)] = mix(canvas.p[at(x, y)], C.ink, 0.25);
	const body = [];
	const rect = (x, y, w, h) => {
		for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) body.push([xx, yy]);
	};
	rect(14, 6, 5, 21);
	rect(9, 13, 5, 3);
	rect(9, 8, 3, 6);
	rect(19, 16, 5, 3);
	rect(21, 11, 3, 6);
	const own = new Set(body.map(([x, y]) => y * 64 + x));
	for (const [x, y] of body) {
		const inside = (dx, dy) => own.has((y + dy) * 64 + x + dx);
		let col = !inside(-1, 0) ? C.pineLight : !inside(1, 0) ? C.pineShade : (x + y) % 5 === 0 ? C.pineShade : C.pine;
		if (!inside(0, -1) || !inside(-1, 0) || !inside(1, 0)) {
			if (!inside(0, -1)) col = C.pineLight;
		}
		set(x, y, col);
	}
	for (const [x, y] of body) {
		for (const [dx, dy] of [
			[1, 0],
			[-1, 0],
			[0, -1],
		]) {
			if (!own.has((y + dy) * 64 + x + dx)) set(x + dx, y + dy, C.ink);
		}
	}
	set(16, 5, C.brickRedLight);
	set(17, 5, C.gold);
}

function drawLilyPond(canvas, ox, oy) {
	const cx = ox + 16;
	const cy = oy + 17;
	ellipse(canvas, cx, cy, 13.5, 9.5, C.swampMudShade);
	ellipse(canvas, cx, cy, 12.5, 8.5, C.swampWater);
	ellipse(canvas, cx + 0.5, cy + 1, 10, 6, C.swampWaterDeep);
	for (let x = cx - 12; x <= cx + 12; x++) {
		for (let y = cy - 9; y <= cy; y++) {
			const q = ((x - cx) / 12.5) ** 2 + ((y - cy) / 8.5) ** 2;
			const above = ((x - cx) / 12.5) ** 2 + ((y - 1 - cy) / 8.5) ** 2;
			if (q <= 1 && above > 1) canvas.p[y * canvas.w + x] = C.quagPeat;
		}
	}
	const pad = (px, py, rx, ry, flower) => {
		ellipse(canvas, px, py + 1, rx + 0.6, ry + 0.6, C.swampWaterDeep);
		ellipse(canvas, px, py, rx, ry, C.lilyPadShade);
		ellipse(canvas, px - 0.5, py - 0.5, rx - 1, ry - 1, C.lilyPad);
		for (let k = 0; k <= rx; k++) canvas.p[(py - (k > rx / 2 ? 1 : 0)) * canvas.w + px + k] = C.swampWater;
		if (flower) {
			for (const [dx, dy, col] of [
				[-1, -1, C.lilyFlower],
				[0, -2, C.lilyFlower],
				[1, -1, C.lilyFlower],
				[0, -1, C.creamLight],
			]) {
				canvas.p[(py + dy) * canvas.w + px + dx] = col;
			}
		}
	};
	pad(cx - 5, cy - 1, 4, 3, false);
	pad(cx + 5, cy - 3, 3.5, 2.5, true);
	pad(cx + 3, cy + 4, 4, 2.5, false);
	canvas.p[(cy + 2) * canvas.w + cx - 9] = C.swampWaterLight;
	canvas.p[(cy + 2) * canvas.w + cx - 8] = C.swampWaterLight;
}

function drawBeaches(canvas, layout, volcanoes) {
	const rows = layout.length;
	const cols = layout[0].length;
	const water = (r, c) => r >= 0 && c >= 0 && r < rows && c < cols && isImpassable(layout, r, c) && !volcanoes.some(([vr, vc]) => vr === r && vc === c);
	const edge = noise(911, 3);
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			if (isImpassable(layout, r, c)) continue;
			const ox = c * PITCH;
			const oy = r * PITCH;
			for (let y = 0; y < PLOT; y++) {
				for (let x = 0; x < PLOT; x++) {
					let d = Infinity;
					if (water(r - 1, c)) d = Math.min(d, y);
					if (water(r + 1, c)) d = Math.min(d, PLOT - 1 - y);
					if (water(r, c - 1)) d = Math.min(d, x);
					if (water(r, c + 1)) d = Math.min(d, PLOT - 1 - x);
					for (const [dr, dc, cx, cy] of [
						[-1, -1, 0, 0],
						[-1, 1, PLOT - 1, 0],
						[1, -1, 0, PLOT - 1],
						[1, 1, PLOT - 1, PLOT - 1],
					]) {
						if (water(r + dr, c + dc) && !water(r + dr, c) && !water(r, c + dc)) d = Math.min(d, Math.hypot(x - cx, y - cy) - 1);
					}
					const lim = 3.5 + (edge(ox + x, oy + y) - 0.5) * 2.5;
					if (d > lim) continue;
					const i = (oy + y) * canvas.w + ox + x;
					canvas.p[i] = d < 1 ? C.sandShade : d > lim - 1 && dither(ox + x, oy + y) > 0 ? C.grassShade : dither(ox + x, oy + y) > 0.25 ? C.sandLight : C.sand;
				}
			}
		}
	}
}

function drawCloudRims(canvas, rows, cols, clouds) {
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			const here = clouds[r][c];
			const t = TINTS[CLOUD_TINTS[Number(here)]];
			const set = (x, y, col) => {
				if (x >= 0 && y >= 0 && x < canvas.w && y < canvas.h) canvas.p[y * canvas.w + x] = col;
			};
			if (c + 1 < cols && clouds[r][c + 1] !== here) {
				const e = c * PITCH + PLOT - 1;
				for (let k = 0; k < PLOT; k++) {
					const d = Math.round(1.2 * Math.sin((r * PITCH + k) * 0.55));
					set(e - 1 + Math.min(0, d), r * PITCH + k, t.rim);
					set(e - 2 + Math.min(0, d), r * PITCH + k, t.light);
					set(e + 2 + Math.max(0, d), r * PITCH + k, TINTS[CLOUD_TINTS[Number(clouds[r][c + 1])]].rim);
				}
			}
			if (r + 1 < rows && clouds[r + 1][c] !== here) {
				const e = r * PITCH + PLOT - 1;
				for (let k = 0; k < PLOT; k++) {
					const d = Math.round(1.2 * Math.sin((c * PITCH + k) * 0.55));
					set(c * PITCH + k, e - 1 + Math.min(0, d), t.rim);
					set(c * PITCH + k, e - 2 + Math.min(0, d), t.light);
					set(c * PITCH + k, e + 2 + Math.max(0, d), TINTS[CLOUD_TINTS[Number(clouds[r + 1][c])]].rim);
				}
			}
		}
	}
}

// ---------- Composing a mat ----------

const PAINTERS = {
	archipelago: paintArchipelago,
	canyon: paintCanyon,
	cavern: paintCavern,
	'cloud-city': paintCloudCity,
	mesa: paintMesa,
	swamp: paintSwamp,
	'mesa-2': paintMesaTable,
	'archipelago-2': paintArchipelago2,
	'cloud-city-pillars': paintCloudPeaks,
	'cloud-city-b': paintCloudDrop,
	'cloud-city-peaks': paintCloudMountains,
};

function groundFor(id, r, c, opts) {
	const tint = opts.tintAt ? opts.tintAt(r, c) : 0;
	if (id === 'cloud-city') return GROUNDS[`cloud${tint}`];
	if (id.startsWith('cloud-city-')) return MIST_GROUNDS[tint];
	return GROUNDS[id.replace(/-2$/, '')];
}

function compose(id, layout, opts = {}) {
	const fp = footprint(layout);
	const relief = createCanvas(fp.w, fp.h);
	PAINTERS[id](relief, fp, 5, opts);
	const canvas = createCanvas(fp.w, fp.h);
	canvas.p.fill(C.ink);
	const rows = layout.length;
	const cols = layout[0].length;
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) drawGround(canvas, groundFor(id, r, c, opts), hash(r, c, 7) % 8, c * PITCH, r * PITCH);
	}
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
	opts.features?.(canvas, layout);
	overlay(canvas, relief);
	return { canvas, relief, fp };
}

const plotsWith = (layout, ch) => layout.flatMap((row, r) => [...row].flatMap((k, c) => (k === ch ? [[r, c]] : [])));
const cloudOpts = {
	tintAt: (r, c) => CLOUD_TINTS[Number(CLOUDS[r][c])],
	features: (canvas) => drawCloudRims(canvas, CLOUDS.length, CLOUDS[0].length, CLOUDS),
};

const ROUND1 = {
	mesa: { biome: 'mesa', real: {} },
	canyon: { biome: 'canyon', real: { features: (canvas, layout) => plotsWith(layout, 'C').forEach(([r, c]) => drawCactus(canvas, c * PITCH, r * PITCH)) } },
	cavern: { biome: 'cavern', real: {} },
	swamp: { biome: 'swamp', real: { features: (canvas, layout) => plotsWith(layout, 'L').forEach(([r, c]) => drawLilyPond(canvas, c * PITCH, r * PITCH)) } },
	archipelago: {
		biome: 'archipelago',
		real: { volcanoes: VOLCANOES, features: (canvas, layout) => drawBeaches(canvas, layout, VOLCANOES) },
		specimen: { features: (canvas, layout) => drawBeaches(canvas, layout, []) },
	},
	'cloud-city': { biome: 'cloud-city', real: cloudOpts, specimen: cloudOpts },
};

const ROUND2 = {
	'mesa-2': { biome: 'mesa', real: {} },
	'archipelago-2': {
		biome: 'archipelago',
		real: { volcanoes: VOLCANOES, features: (canvas, layout) => drawBeaches(canvas, layout, VOLCANOES) },
		// The specimen's lone plot is a volcano, so the sheet shows one too.
		specimen: { volcanoes: [[1, 1]], features: (canvas, layout) => drawBeaches(canvas, layout, [[1, 1]]) },
	},
	'cloud-city-pillars': { biome: 'cloud-city', real: cloudOpts, specimen: cloudOpts },
	'cloud-city-peaks': { biome: 'cloud-city', real: cloudOpts, specimen: cloudOpts },
};

// The six the owner approved: Canyon, Cavern and Swamp from round 1; Mesa, Archipelago and Cloud City's pillars from round 2.
const APPROVED = {
	mesa: ROUND2['mesa-2'],
	canyon: ROUND1.canyon,
	cavern: ROUND1.cavern,
	swamp: ROUND1.swamp,
	archipelago: ROUND2['archipelago-2'],
	'cloud-city': ROUND2['cloud-city-pillars'],
};
const PAINTED = { mesa: 'mesa-2', archipelago: 'archipelago-2', 'cloud-city': 'cloud-city-pillars' };

const ROUND = process.argv[3] === '2' ? ROUND2 : process.argv[3] === 'approved' ? APPROVED : ROUND1;
mkdirSync(OUT, { recursive: true });
const report = {};
for (const [id, m] of Object.entries(ROUND)) {
	const painter = ROUND === APPROVED ? (PAINTED[id] ?? id) : id;
	const spec = compose(painter, SPECIMEN_LAYOUT, m.specimen ?? {});
	const mat = compose(painter, BIOMES[m.biome].LAYOUT, m.real);
	writeFileSync(`${OUT}/${id}-specimen.svg`, toSvg(spec.canvas));
	writeFileSync(`${OUT}/${id}-mat.svg`, toSvg(mat.canvas));
	writeFileSync(`${OUT}/${id}-relief.svg`, toSvg(mat.relief));
	// Checks the build's tests would make: inside the reach, every impassable plot's middle covered.
	let outside = 0;
	for (let i = 0; i < mat.relief.p.length; i++) if (mat.relief.p[i] && !mat.fp.reach[i]) outside++;
	const layout = BIOMES[m.biome].LAYOUT;
	let bare = 0;
	for (let r = 0; r < layout.length; r++) {
		for (let c = 0; c < layout[0].length; c++) {
			if (isImpassable(layout, r, c) && !mat.relief.p[(r * PITCH + 16) * mat.fp.w + c * PITCH + 16]) bare++;
		}
	}
	report[id] = { outside, bare, w: mat.fp.w, h: mat.fp.h };
}
console.log(JSON.stringify(report));
