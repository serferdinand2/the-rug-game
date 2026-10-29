// The throwaway spike the owner approved for #82 on 2026-10-28: reference only, not run by the tests or the build.
import { writeFileSync } from 'node:fs';
import {
	createCanvas,
	seededRandom,
	toSvg,
	mix,
} from '../../../tools/art/painter.js';
import { PALETTE as C } from '../../../tools/art/palette.js';
import { CAPITAL_GRIDS } from '../../../tools/art/parts/capital-terrain.js';

const S = 32;
const PITCH = 33;
const N = 9;
const W = N * PITCH - 1;
const M = 2;
const R = 8;
const SADDLE = 6;
const CORNER = 16; // how far a corner join may reach into the buildable plots beside it

const blocked = (grid, r, c) =>
	r >= 0 && c >= 0 && r < N && c < N && grid[r][c] === '1';
const hash = (...n) =>
	n.reduce(
		(h, k) => Math.imul(h ^ (k + 0x9e37), 0x01000193) >>> 0,
		0x811c9dc5
	);
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(
	(v) => v / 16 - 0.5
);

function shape(grid, r, c, qy, qx) {
	const v = blocked(grid, r + qy, c);
	const h = blocked(grid, r, c + qx);
	const d = blocked(grid, r + qy, c + qx);
	if (!v && !h) return d ? 'bridge' : 'outer';
	if (h && !v) return 'edgeH';
	if (v && !h) return 'edgeV';
	return d ? 'full' : 'inner';
}

function inShape(s, u, v) {
	const outer = () => {
		if (u < M || v < M) return false;
		const du = u - M;
		const dv = v - M;
		if (du < R && dv < R) {
			const a = R - du - 0.5;
			const b = R - dv - 0.5;
			return a * a + b * b <= R * R + 0.5;
		}
		return true;
	};
	switch (s) {
		case 'outer':
			return outer();
		case 'bridge':
			return outer() || (u + v < 18 && Math.abs(u - v) <= SADDLE);
		case 'edgeH':
			return v >= M;
		case 'edgeV':
			return u >= M;
		case 'inner':
			return !(u < M && v < M);
		default:
			return true;
	}
}

function noise(seed, scale) {
	const cell = (i, j) => (hash(i, j, seed) % 1000) / 1000;
	return (x, y) => {
		const fx = x / scale;
		const fy = y / scale;
		const i = Math.floor(fx);
		const j = Math.floor(fy);
		const tx = fx - i;
		const ty = fy - j;
		const sx = tx * tx * (3 - 2 * tx);
		const sy = ty * ty * (3 - 2 * ty);
		const a = cell(i, j) + (cell(i + 1, j) - cell(i, j)) * sx;
		const b = cell(i, j + 1) + (cell(i + 1, j + 1) - cell(i, j + 1)) * sx;
		return a + (b - a) * sy;
	};
}

/** The joined footprint, where each group's floor lies, and the corner joins. */
function footprint(grid) {
	const mask = new Uint8Array(W * W);
	const corners = [];
	const inPlot = (r, c, x, y) => {
		if (!blocked(grid, r, c)) return false;
		const qx = x < 16 ? -1 : 1;
		const qy = y < 16 ? -1 : 1;
		return inShape(
			shape(grid, r, c, qy, qx),
			x < 16 ? x : S - 1 - x,
			y < 16 ? y : S - 1 - y
		);
	};
	for (let r = 0; r < N; r++)
		for (let c = 0; c < N; c++)
			for (let y = 0; y < S; y++)
				for (let x = 0; x < S; x++)
					if (inPlot(r, c, x, y))
						mask[(r * PITCH + y) * W + c * PITCH + x] = 1;
	for (let r = 0; r < N; r++)
		for (let c = 0; c < N; c++) {
			const gx = (c + 1) * PITCH - 1;
			const gy = (r + 1) * PITCH - 1;
			for (let i = 0; i < S; i++) {
				if (
					c < N - 1 &&
					inPlot(r, c, S - 1, i) &&
					inPlot(r, c + 1, 0, i)
				)
					mask[(r * PITCH + i) * W + gx] = 1;
				if (
					r < N - 1 &&
					inPlot(r, c, i, S - 1) &&
					inPlot(r + 1, c, i, 0)
				)
					mask[gy * W + c * PITCH + i] = 1;
			}
			const tl = blocked(grid, r, c);
			const tr = blocked(grid, r, c + 1);
			const bl = blocked(grid, r + 1, c);
			const br = blocked(grid, r + 1, c + 1);
			if (tl && tr && bl && br) mask[gy * W + gx] = 1;
			const down = tl && br && !tr && !bl;
			const up = tr && bl && !tl && !br;
			if (down || up) {
				corners.push({ gx, gy, down });
				for (let dy = -8; dy <= 8; dy++)
					for (let dx = -8; dx <= 8; dx++)
						if (Math.abs(down ? dx - dy : dx + dy) <= SADDLE)
							mask[(gy + dy) * W + gx + dx] = 1;
			}
		}
	return { mask, corners };
}

/** Where art may reach: impassable plots, the gaps between joined ones, and a round patch over each corner join. */
function reach(grid, mask, corners, withCorners = true) {
	const ok = new Uint8Array(W * W);
	for (let Y = 0; Y < W; Y++)
		for (let X = 0; X < W; X++) {
			const c = Math.floor(X / PITCH);
			const r = Math.floor(Y / PITCH);
			const vGap = X - c * PITCH >= S;
			const hGap = Y - r * PITCH >= S;
			const joined =
				vGap && hGap
					? [
							[0, 0],
							[0, 1],
							[1, 0],
							[1, 1],
						].every(([a, b]) => blocked(grid, r + a, c + b))
					: vGap
						? blocked(grid, r, c) && blocked(grid, r, c + 1)
						: hGap
							? blocked(grid, r, c) && blocked(grid, r + 1, c)
							: blocked(grid, r, c);
			if (joined) ok[Y * W + X] = 1;
		}
	if (withCorners)
		for (const { gx, gy } of corners)
			for (let dy = -CORNER; dy <= CORNER; dy++)
				for (let dx = -CORNER; dx <= CORNER; dx++)
					if (dx * dx + dy * dy <= CORNER * CORNER)
						ok[(gy + dy) * W + gx + dx] = 1;
	return ok;
}

const GROUNDS = {
	mountain: {
		base: C.mesaSage,
		light: C.bottleSandShade,
		dark: C.swampMudLight,
	},
	forest: { base: C.grass, light: C.grassLight, dark: C.grassShade },
};

/** Buildable ground: broad soft patches that run on across plots, and a few small things lying on it. */
function naturalGround(grid, biome, seed) {
	const g = GROUNDS[biome];
	const mat = createCanvas(W, W);
	mat.p.fill(C.ink);
	const broad = noise(seed + 7, 6);
	const fine = noise(seed + 8, 3);
	const rand = seededRandom(hash(seed, 41));
	const onPlot = (X, Y) => X % PITCH < S && Y % PITCH < S;
	const joinedGap = (X, Y) => {
		const c = Math.floor(X / PITCH);
		const r = Math.floor(Y / PITCH);
		if (X % PITCH >= S && Y % PITCH < S)
			return blocked(grid, r, c) && blocked(grid, r, c + 1);
		if (Y % PITCH >= S && X % PITCH < S)
			return blocked(grid, r, c) && blocked(grid, r + 1, c);
		return [
			[0, 0],
			[0, 1],
			[1, 0],
			[1, 1],
		].every(([a, b]) => blocked(grid, r + a, c + b));
	};
	for (let Y = 0; Y < W; Y++)
		for (let X = 0; X < W; X++) {
			if (!onPlot(X, Y) && !joinedGap(X, Y)) continue;
			// Mostly one tone; small, sparse patches of the darker and lighter tones, dithered at their edges.
			const n =
				broad(X, Y) * 0.6 +
				fine(X, Y) * 0.4 +
				BAYER[(Y % 4) * 4 + (X % 4)] * 0.1;
			mat.p[Y * W + X] = n > 0.74 ? g.light : n < 0.24 ? g.dark : g.base;
		}
	const put = (x, y, col) => {
		if (x >= 0 && y >= 0 && x < W && y < W && onPlot(x, y))
			mat.p[y * W + x] = col;
	};
	for (let i = 0; i < (W * W) / 70; i++) {
		const x = Math.floor(rand() * W);
		const y = Math.floor(rand() * W);
		const roll = rand();
		if (biome === 'mountain') {
			if (roll < 0.55) {
				// A pebble, lit from the upper left.
				put(x, y, C.stoneLight);
				put(x + 1, y, C.stone);
				put(x, y + 1, C.stone);
				put(x + 1, y + 1, C.stoneShade);
				put(
					x + 2,
					y + 1,
					mix(mat.p[y * W + x + 2] ?? g.base, C.ink, 0.3)
				);
			} else if (roll < 0.8) {
				put(x, y, C.swampMud);
				put(x + 1, y - 1, C.swampMoss);
				put(x + 2, y, C.swampMud);
			} else put(x, y, rand() < 0.5 ? C.cream : C.swampMudShade);
		} else if (roll < 0.5) {
			// A grass tuft.
			put(x, y, C.grassShade);
			put(x - 1, y - 1, C.grassShade);
			put(x + 1, y - 1, C.forestFloorLight);
			put(x, y - 2, C.grassLight);
		} else if (roll < 0.72) {
			put(x, y, rand() < 0.5 ? C.cream : C.gold);
			put(x, y + 1, C.grassShade);
		} else if (roll < 0.8) {
			put(x, y, C.forestFloor);
			put(x + 1, y, C.forestFloor);
		}
	}
	return mat;
}

/** A soft floor under each group: ragged at its edge, so it fades into the ground instead of ending in a line. */
function drawFloor(mat, mask, biome, seed) {
	const ragged = noise(seed + 3, 3);
	const rand = seededRandom(hash(seed, 77));
	for (let Y = 1; Y < W - 1; Y++)
		for (let X = 1; X < W - 1; X++) {
			const i = Y * W + X;
			if (!mask[i]) continue;
			let edge = 0;
			for (const [dx, dy] of [
				[1, 0],
				[-1, 0],
				[0, 1],
				[0, -1],
				[2, 0],
				[-2, 0],
				[0, 2],
				[0, -2],
			])
				if (!mask[i + dy * W + dx]) edge++;
			if (edge && ragged(X, Y) < 0.5) continue;
			if (biome === 'mountain')
				mat.p[i] =
					rand() < 0.25
						? C.swampMud
						: rand() < 0.15
							? C.stoneMid
							: C.swampMudLight;
			else mat.p[i] = rand() < 0.3 ? C.forestFloor : C.forestFloorShade;
		}
}

function jagged(rand, x0, y0, x1, y1, rough) {
	const pts = [
		[x0, y0],
		[x1, y1],
	];
	for (let pass = 0; pass < 4; pass++) {
		const next = [pts[0]];
		for (let i = 1; i < pts.length; i++) {
			const [ax, ay] = pts[i - 1];
			const [bx, by] = pts[i];
			next.push(
				[
					(ax + bx) / 2 +
						(rand() - 0.5) * Math.hypot(bx - ax, by - ay) * rough,
					(ay + by) / 2,
				],
				[bx, by]
			);
		}
		pts.splice(0, pts.length, ...next);
	}
	const xs = new Map();
	for (let i = 1; i < pts.length; i++) {
		const [ax, ay] = pts[i - 1];
		const [bx, by] = pts[i];
		for (
			let y = Math.ceil(Math.min(ay, by));
			y <= Math.floor(Math.max(ay, by));
			y++
		)
			xs.set(y, ax + (bx - ax) * (by === ay ? 0 : (y - ay) / (by - ay)));
	}
	return (y) => xs.get(y) ?? (y <= y0 ? x0 : x1);
}

function peakShape(p, seed) {
	const rand = seededRandom(hash(p.bx, p.by, p.hw, seed));
	const sx = p.bx + Math.round((rand() - 0.5) * p.hw * 0.4);
	const sy = p.by - p.ph;
	const left = jagged(rand, sx, sy, p.bx - p.hw, p.by, 0.35);
	const right = jagged(rand, sx, sy, p.bx + p.hw, p.by, 0.35);
	const ridge = jagged(
		rand,
		sx,
		sy,
		p.bx + Math.round((rand() - 0.3) * p.hw * 0.5),
		p.by,
		0.5
	);
	const snowDepth = Math.max(0, p.ph - 9) * (0.42 + rand() * 0.12);
	const line = new Map();
	let walk = 0;
	for (let x = p.bx - p.hw - 1; x <= p.bx + p.hw + 1; x++) {
		walk = Math.max(-3, Math.min(3, walk + (rand() < 0.5 ? -1 : 1)));
		line.set(x, sy + snowDepth + walk + Math.abs(x - sx) * 0.25);
	}
	const snow = (x) => (snowDepth > 0 ? (line.get(x) ?? sy) : sy - 1);
	return { ...p, sx, sy, left, right, ridge, snow, rand };
}

function* pixels(s) {
	for (let y = s.sy; y <= s.by; y++) {
		const a = Math.round(Math.min(s.left(y), s.right(y)));
		const b = Math.round(Math.max(s.left(y), s.right(y)));
		for (let x = a; x <= b; x++) yield [x, y, a, b];
	}
}

/** A soft shadow to the right of a foot: every other pixel, so it fades rather than ends. */
function footShadow(mat, own, x0, x1, y0, y1) {
	for (let x = x0; x <= x1; x++)
		for (let y = y0; y <= y1; y++) {
			if (x < 0 || y < 0 || x >= W || y >= W || own.has(y * W + x))
				continue;
			if (BAYER[(y % 4) * 4 + (x % 4)] < 0.15)
				mat.p[y * W + x] = mix(mat.p[y * W + x], C.swampMudShade, 0.55);
		}
}

function drawPeak(mat, s) {
	const own = new Set();
	for (const [x, y] of pixels(s)) own.add(y * W + x);
	const grain = noise(hash(s.bx, s.by, 9), 2.5);
	// Secondary ridges: lines running down and out from the main ridge, darker below, lit above.
	const ribs = new Map();
	for (let k = 0; k < 1 + Math.floor(s.hw / 10); k++) {
		let y = s.sy + Math.round(s.ph * (0.2 + s.rand() * 0.4));
		let x = Math.round(s.ridge(y));
		const dir = s.rand() < 0.55 ? -1 : 1;
		for (let step = 0; step < s.hw * 0.6; step++) {
			ribs.set(y * W + x, dir);
			x += dir;
			if (s.rand() < 0.6) y += 1;
		}
	}
	footShadow(mat, own, s.bx, s.bx + s.hw + 3, s.by - 2, s.by + 1);
	for (const [x, y] of pixels(s)) {
		if (x < 0 || y < 0 || x >= W || y >= W) continue;
		const i = y * W + x;
		const lit = x < s.ridge(y);
		const depth = (y - s.sy) / s.ph;
		const n = grain(x, y) + BAYER[(y % 4) * 4 + (x % 4)] * 0.25;
		let col;
		if (y < s.snow(x))
			col = lit
				? n > 0.3
					? C.snow
					: C.snowShade
				: n > 0.75
					? C.snow
					: C.snowShade;
		else if (lit)
			col = n > 0.66 ? C.stoneLight : n > 0.32 ? C.stone : C.stoneMid;
		else col = n > 0.62 ? C.stoneMid : n > 0.3 ? C.stoneShade : C.roofShade;
		const rib = ribs.get(i);
		if (rib !== undefined)
			col = y < s.snow(x) ? C.snowShade : lit ? C.stoneMid : C.roofShade;
		else if (ribs.has(i + W) && y >= s.snow(x))
			col = lit ? C.stoneLight : C.stoneMid;
		// The lower slopes turn to meadow: more of it the nearer the foot, dithered.
		const green = Math.max(0, (depth - 0.5) / 0.5);
		if (
			green ** 1.2 >
			0.5 - BAYER[(y % 4) * 4 + (x % 4)] + (grain(x + 50, y) - 0.5) * 0.5
		)
			col = lit
				? n > 0.55
					? C.bottleSandShade
					: C.mesaSage
				: n > 0.5
					? C.swampMudLight
					: C.swampMud;
		// Outline only the rock; the foot has none, so it sinks into the ground.
		const edge = !own.has(i - 1) || !own.has(i + 1) || !own.has(i - W);
		if (edge && depth < 0.55) col = C.ink;
		else if (edge && !own.has(i + 1) && depth < 0.85) col = C.swampMudShade;
		mat.p[i] = col;
	}
}

/** A low foothill: a rounded mound in the meadow's colours, lit on the left, with a few stones. */
function hillShape(h) {
	const rows = [];
	for (let y = h.by - h.ph; y <= h.by; y++) {
		const v = (h.by - y) / h.ph;
		const half = Math.round(h.hw * Math.sqrt(Math.max(0, 1 - v * v)));
		rows.push([y, h.bx - half, h.bx + half]);
	}
	return { ...h, rows };
}

function* hillPixels(h) {
	for (const [y, a, b] of h.rows) for (let x = a; x <= b; x++) yield [x, y];
}

function drawHill(mat, h) {
	const own = new Set();
	for (const [x, y] of hillPixels(h)) own.add(y * W + x);
	const grain = noise(hash(h.bx, h.by, 31), 2);
	const rand = seededRandom(hash(h.bx, h.by, 5));
	footShadow(mat, own, h.bx, h.bx + h.hw + 2, h.by - 1, h.by + 1);
	for (const [x, y] of hillPixels(h)) {
		if (x < 0 || y < 0 || x >= W || y >= W) continue;
		const i = y * W + x;
		const u = (x - h.bx) / h.hw;
		const v = (h.by - y) / h.ph;
		const light =
			-u * 0.8 +
			v * 0.6 +
			(grain(x, y) - 0.5) * 0.6 +
			BAYER[(y % 4) * 4 + (x % 4)] * 0.3;
		let col =
			light > 0.35
				? C.bottleSandShade
				: light > -0.15
					? C.mesaSage
					: light > -0.55
						? C.swampMudLight
						: C.swampMud;
		// A lit rim along the top, darker where it turns away.
		if (!own.has(i - W)) col = u < 0.2 ? C.bottleSand : C.swampMudLight;
		mat.p[i] = col;
	}
	for (let k = 0; k < Math.floor(h.hw / 4); k++) {
		const x = h.bx + Math.round((rand() - 0.5) * h.hw);
		const y = h.by - Math.round(rand() * h.ph * 0.6);
		if (own.has(y * W + x) && own.has(y * W + x + 1)) {
			mat.p[y * W + x] = C.stoneLight;
			mat.p[y * W + x + 1] = C.stoneShade;
		}
	}
}

export function drawMountains(grid, seed = 5) {
	const mat = naturalGround(grid, 'mountain', seed);
	const { mask, corners } = footprint(grid);
	const okAll = reach(grid, mask, corners);
	let ok = okAll;
	drawFloor(mat, mask, 'mountain', seed);
	const rand = seededRandom(hash(seed, 21));
	const covered = new Uint8Array(W * W);
	const peaks = [];
	const fresh = (s) => {
		let n = 0;
		let total = 0;
		for (const [x, y] of pixels(s)) {
			if (x < 0 || y < 0 || x >= W || y >= W || !ok[y * W + x]) return -1;
			total++;
			if (mask[y * W + x] && !covered[y * W + x]) n++;
		}
		return n / total;
	};
	const add = (s) => {
		peaks.push(s);
		for (const [x, y] of pixels(s)) covered[y * W + x] = 1;
	};
	// A peak stands over each corner join, so the two sides read as one range.
	for (const { gx, gy } of corners) {
		const s = peakShape({ bx: gx, by: gy + 10, hw: 11, ph: 18 }, seed);
		if (fresh(s) >= 0) add(s);
	}
	ok = reach(grid, mask, corners, false);
	for (const hw of [30, 25, 21, 17, 14, 11, 9, 7]) {
		const spots = [];
		for (let by = W - 1; by >= 4; by -= 2) {
			const row = [];
			for (let bx = 0; bx < W; bx += 2) row.push([bx, by]);
			for (let i = row.length - 1; i > 0; i--) {
				const j = Math.floor(rand() * (i + 1));
				[row[i], row[j]] = [row[j], row[i]];
			}
			spots.push(...row);
		}
		for (const [bx, by] of spots) {
			if (!mask[by * W + bx]) continue;
			const s = peakShape(
				{ bx, by, hw, ph: Math.round(hw * (1.05 + rand() * 0.25)) },
				seed
			);
			if (fresh(s) < 0.45) continue;
			add(s);
		}
	}
	// Foothills along every open side, in front of the peaks' feet, and below each corner join.
	const hills = [];
	const tryHill = (h, where) => {
		const shape = hillShape(h);
		for (const [x, y] of hillPixels(shape))
			if (x < 0 || y < 0 || x >= W || y >= W || !where[y * W + x]) return;
		hills.push(shape);
	};
	for (let r = 0; r < N; r++)
		for (let c = 0; c < N; c++) {
			if (!blocked(grid, r, c)) continue;
			const x0 = c * PITCH;
			const y0 = r * PITCH;
			const hr = seededRandom(hash(r, c, seed, 17));
			const size = () => ({
				hw: 7 + Math.floor(hr() * 4),
				ph: 5 + Math.floor(hr() * 3),
			});
			if (!blocked(grid, r + 1, c)) {
				tryHill(
					{
						bx: x0 + 8 + Math.floor(hr() * 3),
						by: y0 + 31 - Math.floor(hr() * 2),
						...size(),
					},
					ok
				);
				tryHill(
					{
						bx: x0 + 22 + Math.floor(hr() * 3),
						by: y0 + 31 - Math.floor(hr() * 2),
						...size(),
					},
					ok
				);
			}
			if (!blocked(grid, r, c - 1))
				tryHill(
					{
						bx: x0 + 6,
						by: y0 + 20 + Math.floor(hr() * 8),
						hw: 6,
						ph: 5 + Math.floor(hr() * 2),
					},
					ok
				);
			if (!blocked(grid, r, c + 1))
				tryHill(
					{
						bx: x0 + 25,
						by: y0 + 20 + Math.floor(hr() * 8),
						hw: 6,
						ph: 5 + Math.floor(hr() * 2),
					},
					ok
				);
		}
	for (const { gx, gy, down } of corners) {
		const f = down ? 1 : -1;
		tryHill({ bx: gx - 5 * f, by: gy + 13, hw: 5, ph: 4 }, okAll);
		tryHill({ bx: gx + 4 * f, by: gy + 11, hw: 5, ph: 5 }, okAll);
	}
	const scene = [
		...peaks.map((p) => ({ p, by: p.by, order: 0 })),
		...hills.map((h) => ({ h, by: h.by, order: 1 })),
	];
	scene.sort((a, b) => a.by - b.by || a.order - b.order);
	for (const item of scene) {
		if (item.p) drawPeak(mat, item.p);
		else drawHill(mat, item.h);
	}
	return toSvg(mat);
}

const LEAF = [
	[C.pineShade, C.pine, C.pineLight, C.grassLight],
	[C.forestFloorShade, C.forestFloor, C.forestFloorLight, C.grassLight],
];

function broadleaf(mat, ok, bx, by, r, tone, rand) {
	const put = (x, y, col) => {
		if (x >= 0 && y >= 0 && x < W && y < W && ok[y * W + x])
			mat.p[y * W + x] = col;
	};
	const cy = by - 3 - r;
	for (let y = by - 3; y <= by; y++)
		for (let x = bx - 1; x <= bx; x++)
			put(x, y, x === bx ? C.timberShade : C.timber);
	for (let y = -r - 1; y <= r + 1; y++)
		for (let x = -r - 1; x <= r + 1; x++) {
			const q =
				(x * x) / ((r + 0.4) * (r + 0.4)) +
				(y * y) / ((r - 0.2) * (r - 0.2));
			if (q > 1 + rand() * 0.1) continue;
			const shade = -x * 0.55 - y * 0.75 + (rand() - 0.5) * 2.2;
			const k =
				shade > r * 0.55 ? 3 : shade > 0 ? 2 : shade > -r * 0.6 ? 1 : 0;
			put(
				bx + x,
				cy + y,
				q > 0.82 ? (k >= 2 ? LEAF[tone][1] : C.night) : LEAF[tone][k]
			);
		}
}

function pine(mat, ok, bx, by, hgt) {
	const put = (x, y, col) => {
		if (x >= 0 && y >= 0 && x < W && y < W && ok[y * W + x])
			mat.p[y * W + x] = col;
	};
	put(bx, by, C.timberShade);
	put(bx, by - 1, C.timberShade);
	for (let y = 0; y < hgt; y++) {
		const half = Math.floor(((hgt - y) / hgt) * 4 + ((y % 4) / 4) * 1.2);
		for (let x = -half; x <= half; x++) {
			const col =
				x === -half || x === half
					? C.night
					: x < 0
						? C.pine
						: C.pineShade;
			put(
				bx + x,
				by - 2 - y,
				y === hgt - 1
					? C.night
					: x < 0 && y % 4 === 1
						? C.pineLight
						: col
			);
		}
	}
}

export function drawForest(grid, seed = 5) {
	const mat = naturalGround(grid, 'forest', seed);
	const { mask, corners } = footprint(grid);
	const ok = reach(grid, mask, corners);
	const okPlots = reach(grid, mask, corners, false);
	// Corner joins carry trees too, so their floor reaches into the patch.
	for (const { gx, gy } of corners)
		for (let dy = -7; dy <= 7; dy++)
			for (let dx = -7; dx <= 7; dx++)
				if (dx * dx + dy * dy <= 49) mask[(gy + dy) * W + gx + dx] = 1;
	drawFloor(mat, mask, 'forest', seed);
	const rand = seededRandom(hash(seed, 3));
	const trees = [];
	for (let y = 0; y < W; y += 5)
		for (let x = (y / 5) % 2 ? 3 : 0; x < W; x += 6) {
			const bx = x + Math.floor(rand() * 3) - 1;
			const by = y + Math.floor(rand() * 3) - 1;
			if (
				bx < 0 ||
				by < 0 ||
				bx >= W ||
				by >= W ||
				!mask[by * W + bx] ||
				!okPlots[by * W + bx]
			)
				continue;
			trees.push({
				corner: false,
				bx,
				by,
				r: 3 + Math.floor(rand() * 2.4),
				tone: rand() < 0.6 ? 0 : 1,
				kind: rand() < 0.22 ? 'pine' : 'leaf',
			});
		}
	for (const { gx, gy, down } of corners) {
		const f = down ? 1 : -1;
		for (const [dx, dy, r, tone] of [
			[-8, -1, 3, 1],
			[5, -3, 3, 0],
			[-3, 1, 3, 0],
			[3, 3, 3, 1],
			[-9, 6, 3, 1],
			[-5, 7, 4, 0],
			[2, 8, 4, 0],
			[7, 10, 3, 1],
		])
			trees.push({
				corner: true,
				bx: gx + dx * f,
				by: gy + dy,
				r,
				tone,
				kind: 'leaf',
			});
	}
	const fits = (t) => {
		const top = t.kind === 'pine' ? t.by - 11 - t.r : t.by - 4 - 2 * t.r;
		const half = t.kind === 'pine' ? 5 : t.r + 1;
		for (let y = top; y <= t.by; y++)
			for (let x = t.bx - half; x <= t.bx + half; x++)
				if (
					x < 0 ||
					y < 0 ||
					x >= W ||
					y >= W ||
					!(t.corner ? ok : okPlots)[y * W + x]
				)
					return false;
		return true;
	};
	const placed = trees.filter((t) => {
		if (fits(t)) return true;
		t.r = 2;
		t.kind = 'leaf';
		return fits(t);
	});
	placed.sort((a, b) => a.by - b.by);
	// Each tree's shadow first, then the trees from the back to the front.
	for (const t of placed)
		for (let dy = -1; dy <= 1; dy++)
			for (let dx = 0; dx <= t.r + 2; dx++) {
				const x = t.bx + dx;
				const y = t.by + dy;
				if (x < W && y < W)
					mat.p[y * W + x] = mix(mat.p[y * W + x], C.ink, 0.25);
			}
	for (const t of placed) {
		if (t.kind === 'pine') pine(mat, ok, t.bx, t.by, 9 + t.r);
		else broadleaf(mat, ok, t.bx, t.by, t.r, t.tone, rand);
	}
	return toSvg(mat);
}

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
const out = {
	mountain: {
		specimen: drawMountains(SPECIMEN),
		mat: drawMountains(CAPITAL_GRIDS.mountain),
	},
	forest: {
		specimen: drawForest(SPECIMEN),
		mat: drawForest(CAPITAL_GRIDS.forest),
	},
};
writeFileSync(new URL('./spike.json', import.meta.url), JSON.stringify(out));
console.log('ok');
