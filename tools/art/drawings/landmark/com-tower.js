// The Com Tower landmark at night: a lattice radio mast with dishes, guy wires and blinking red lights over the city.
import {
	createCanvas,
	get,
	set,
	rect,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';
import { drawSkyline } from '../../parts/skyline.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The picture fills the tower's 3×2 plots at 32 pixels each. */
const W = 96;
const H = 64;

/** The mast's centre column and its top row. */
const MAST_X = 47.5;
const TOP = 4;

/**
 * Draws the Com Tower scene.
 * @returns {Canvas} A 96×64 canvas, the shape of its 3×2 footprint.
 */
export function draw() {
	const scene = createCanvas(W, H);
	const layer = createCanvas(W, H);
	const random = seededRandom(83);

	drawSky(layer, {
		time: 'night',
		horizon: 50,
		random,
		moon: { x: 16, y: 12 },
	});
	drawSkyline(layer, { base: 50, time: 'night', random, height: 16 });
	drawGround(layer);
	drawWaves(layer);

	drawMast(scene);
	drawHut(scene);
	outline(scene, C.ink);
	drawGuyWires(scene);
	for (const y of [TOP - 1, 22, 38]) {
		set(scene, Math.floor(MAST_X), y, C.brickRedLight);
	}
	underlay(scene, layer);
	return scene;
}

/**
 * A dark yard around the mast.
 * @param {Canvas} layer
 */
function drawGround(layer) {
	for (let y = 51; y < H; y++) {
		for (let x = 0; x < W; x++) {
			set(layer, x, y, (x * 3 + y) % 7 === 0 ? C.roof : C.night);
		}
	}
}

/**
 * Faint signal rings spreading from the top of the mast.
 * @param {Canvas} layer
 */
function drawWaves(layer) {
	for (const r of [8, 13, 18]) {
		for (let a = -0.9; a <= 0.9; a += 0.04) {
			for (const side of [1, -1]) {
				const x = Math.round(MAST_X + side * Math.cos(a) * r);
				const y = Math.round(TOP + 2 + Math.sin(a) * r);
				const behind = get(layer, x, y);
				if (behind && y < 50) {
					set(layer, x, y, mix(behind, C.daySky5, 0.35));
				}
			}
		}
	}
}

/**
 * The lattice mast: two legs narrowing to the top, cross-bracing, and two dish platforms.
 * @param {Canvas} scene
 */
function drawMast(scene) {
	for (let y = TOP; y <= 50; y++) {
		const half = 1 + Math.round(((y - TOP) / (50 - TOP)) * 5);
		const left = Math.round(MAST_X - half);
		const right = Math.round(MAST_X + half);
		set(scene, left, y, C.stoneLight);
		set(scene, right, y, C.stoneShade);
		const k = (y - TOP) % 6;
		const span = right - left;
		if (span > 1) {
			set(scene, left + Math.round((k / 5) * span), y, C.stoneMid);
			set(scene, right - Math.round((k / 5) * span), y, C.stoneMid);
		}
		if (k === 0) {
			rect(scene, left, y, span + 1, 1, C.stoneMid);
		}
	}
	for (const [y, side] of [
		[20, -1],
		[34, 1],
	]) {
		const cx = Math.round(MAST_X + side * 8);
		for (let dy = -3; dy <= 3; dy++) {
			const w = 3 - Math.abs(dy);
			rect(
				scene,
				cx - side * w,
				y + dy,
				2,
				1,
				Math.abs(dy) === 3 ? C.stoneMid : C.stoneLight
			);
		}
		rect(
			scene,
			Math.min(cx, Math.round(MAST_X)),
			y,
			Math.abs(cx - Math.round(MAST_X)),
			1,
			C.stoneMid
		);
	}
}

/**
 * The equipment hut at the foot of the mast, with a lit door.
 * @param {Canvas} scene
 */
function drawHut(scene) {
	rect(scene, 34, 47, 28, 10, C.stone);
	rect(scene, 34, 47, 1, 10, C.stoneLight);
	rect(scene, 60, 47, 2, 10, C.stoneShade);
	rect(scene, 33, 46, 30, 1, C.stoneLight);
	rect(scene, 52, 50, 4, 7, C.lampGlow);
	rect(scene, 38, 50, 8, 3, C.daySky4);
}

/**
 * Thin guy wires from the mast down to anchors; drawn after the outline so they stay one pixel thin.
 * @param {Canvas} scene
 */
function drawGuyWires(scene) {
	for (const [fromY, toX] of [
		[12, 6],
		[12, 89],
		[28, 14],
		[28, 81],
	]) {
		const steps = 60;
		for (let i = 0; i <= steps; i++) {
			const t = i / steps;
			const x = Math.round(MAST_X + (toX - MAST_X) * t);
			const y = Math.round(fromY + (52 - fromY) * t);
			if (!get(scene, x, y)) {
				set(scene, x, y, C.stoneShade);
			}
		}
	}
}
