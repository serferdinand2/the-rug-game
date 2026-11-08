// The masterpiece deck's back (#35 part 4): the arts track's brush on a cream medallion, framed in gold on the violet
// the masterpiece pieces share; no lettering. Drawn at a quarter of the card's 319 × 259 px.
import { createCanvas, get, set } from '../../painter.js';
import { draw as artsSymbol } from '../track/arts.js';

/** The canvas: the card's 319 × 259 px, a quarter of the size. */
const W = 80;
const H = 65;

/** The masterpieces' violet, as tokens.css names it, and the gold and paper of the cards. */
const VIOLET = '#5f3a9e';
const MID = '#4b2f7c';
const DEEP = '#3a2463';
const GOLD = '#e2b857';
const GOLD_DARK = '#a8873c';
const CREAM = '#f0e2bf';
const INK = '#120c1e';

/** The medallion's centre and radius. */
const CX = 40;
const CY = 29;
const RADIUS = 16;

/**
 * The ground: violet at the upper left to deep violet at the lower right, in three bands dithered where they meet.
 * @param {number} x
 * @param {number} y
 * @returns {string}
 */
function ground(x, y) {
	const t = (x / W + y / H) / 2 + ((x + y) % 2 ? 0.03 : -0.03);
	if (t < 0.38) {
		return VIOLET;
	}
	return t < 0.66 ? MID : DEEP;
}

/** @returns {import('../../painter.js').Canvas} */
export function draw() {
	const canvas = createCanvas(W, H);
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const edge = x === 0 || y === 0 || x === W - 1 || y === H - 1;
			set(canvas, x, y, edge ? INK : ground(x, y));
		}
	}
	// The gold frame, inset 3, with its darker inner line.
	for (let x = 3; x < W - 3; x++) {
		set(canvas, x, 3, GOLD);
		set(canvas, x, H - 4, GOLD);
		if (x > 3 && x < W - 4) {
			set(canvas, x, 4, GOLD_DARK);
			set(canvas, x, H - 5, GOLD_DARK);
		}
	}
	for (let y = 3; y < H - 3; y++) {
		set(canvas, 3, y, GOLD);
		set(canvas, W - 4, y, GOLD);
		if (y > 3 && y < H - 4) {
			set(canvas, 4, y, GOLD_DARK);
			set(canvas, W - 5, y, GOLD_DARK);
		}
	}
	// A gold diamond on each of the frame's corners.
	for (const [x, y] of [
		[3, 3],
		[W - 4, 3],
		[3, H - 4],
		[W - 4, H - 4],
	]) {
		for (const [dx, dy] of [
			[0, -1],
			[-1, 0],
			[1, 0],
			[0, 1],
		]) {
			set(canvas, x + dx, y + dy, GOLD);
		}
		set(canvas, x, y, CREAM);
	}
	// The medallion: cream, ringed in gold and ink.
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const d = Math.hypot(x + 0.5 - CX, y + 0.5 - CY);
			if (d < RADIUS - 1.5) {
				set(canvas, x, y, CREAM);
			} else if (d < RADIUS - 0.5) {
				set(canvas, x, y, GOLD);
			} else if (d < RADIUS + 0.5) {
				set(canvas, x, y, INK);
			}
		}
	}
	// The arts track's brush on it.
	const symbol = artsSymbol();
	for (let y = 0; y < symbol.h; y++) {
		for (let x = 0; x < symbol.w; x++) {
			set(
				canvas,
				CX - symbol.w / 2 + x,
				CY - symbol.h / 2 + y,
				get(symbol, x, y)
			);
		}
	}
	return canvas;
}
