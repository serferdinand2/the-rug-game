// Plea for Aid: a beacon fire blazing on a hilltop tower at night, answered by a far beacon on a distant peak across a misty valley.
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

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The valley floor's row, the beacon tower's centre column, and the far beacon's position. */
const VALLEY = 46;
const TOWER = 47;
const FAR = { x: 13, y: 22 };

/**
 * Draws the Plea for Aid scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(617);

	drawSky(layer, {
		time: 'night',
		horizon: VALLEY,
		random,
		stars: 40,
		starRows: 28,
		sparkles: [
			[30, 4],
			[5, 9],
		],
	});
	drawPlume(layer);
	drawGlow(layer, TOWER, 12, 26, 0.55);
	drawRange(layer);
	drawFarBeacon(layer);
	drawGlow(layer, FAR.x, FAR.y - 3, 9, 0.5);
	drawMist(layer, random);

	drawHill(scene, random);
	drawTower(scene);
	outline(scene, C.ink);
	underlay(scene, layer);
	drawFire(scene, TOWER, 21);
	drawSparks(scene, random);
	return scene;
}

/**
 * Warms the sky around a fire, fading with distance.
 * @param {Canvas} layer
 * @param {number} cx - The fire's column
 * @param {number} cy - The fire's row
 * @param {number} radius - How far the glow reaches
 * @param {number} strength - The glow at the fire itself, 0 to 1
 */
function drawGlow(layer, cx, cy, radius, strength) {
	for (let y = cy - radius; y <= cy + radius; y++) {
		for (let x = cx - radius; x <= cx + radius; x++) {
			const behind = get(layer, x, y);
			const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
			if (
				!behind ||
				d > radius ||
				behind === C.white ||
				behind === C.starDim
			) {
				continue;
			}
			// Three stepped rings, so the glow keeps a pixel-art look.
			const t = Math.ceil((1 - d / radius) * 3) / 3;
			set(
				layer,
				x,
				y,
				mix(behind, mix(C.brickRed, C.amber, t), t * strength)
			);
		}
	}
}

/**
 * The beacon's smoke, a band drifting away to the left on the wind and spreading as it goes.
 * @param {Canvas} layer
 */
function drawPlume(layer) {
	const smoke = mix(C.nightSky4, C.stoneShade, 0.45);
	const smokeLight = mix(C.nightSky5, C.stone, 0.4);
	for (let x = TOWER - 2; x >= 14; x--) {
		const d = TOWER - 2 - x;
		const centre = 5 - d * 0.22 + Math.sin(d * 0.35) * 1.2;
		const half = 1.5 + d * 0.12;
		for (let y = Math.floor(centre - half); y <= centre + half; y++) {
			set(layer, x, y, y < centre - half + 1.2 ? smokeLight : smoke);
		}
	}
}

/**
 * The far mountain range across the valley, ridges faintly lit by the stars, the left peak tallest.
 * @param {Canvas} layer
 */
function drawRange(layer) {
	for (let x = 0; x < 64; x++) {
		const peak = 27 + Math.abs(x - FAR.x) * 0.9;
		const far = 33 + Math.sin(x * 0.35) * 2 + Math.sin(x * 0.13) * 2;
		const top = Math.round(Math.min(peak, far));
		for (let y = top; y <= VALLEY; y++) {
			let colour = C.headland;
			if (y === top) {
				colour = C.headlandRidge;
			} else if (y > top + 2 && (x * 2 + y) % 13 === 0) {
				colour = C.headlandRidge;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The answering beacon: a small dark tower on the far peak with its fire burning on top.
 * @param {Canvas} layer
 */
function drawFarBeacon(layer) {
	const { x, y } = FAR;
	rect(layer, x - 2, y + 1, 5, 6, C.ink);
	rect(layer, x - 1, y + 2, 3, 5, C.roof);
	rect(layer, x - 1, y + 2, 1, 5, C.roofLight);
	/** @type {[number, number, Colour][]} */
	const flame = [
		[-1, 0, C.brickRed],
		[0, 0, C.amber],
		[1, 0, C.brickRed],
		[-1, -1, C.amber],
		[0, -1, C.lampGlow],
		[1, -1, C.gold],
		[0, -2, C.gold],
		[-1, -3, C.amber],
		[1, -3, C.brickRedLight],
	];
	for (const [dx, dy, colour] of flame) {
		set(layer, x + dx, y + dy, colour);
	}
}

/**
 * Bands of pale mist lying in the valley.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawMist(layer, random) {
	const mist = mix(C.nightSky5, C.starDim, 0.35);
	const mistFaint = mix(C.nightSky4, C.starDim, 0.2);
	for (let y = 40; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const wave = Math.sin(x * 0.18 + y * 0.9) + Math.sin(x * 0.07 - y);
			if (wave > 0.9) {
				set(layer, x, y, mist);
			} else if (wave > 0.2) {
				set(layer, x, y, mistFaint);
			} else if (y > VALLEY) {
				set(layer, x, y, mix(C.headland, C.nightSky5, 0.3));
			}
		}
	}
	for (let i = 0; i < 10; i++) {
		const x = Math.floor(random() * 60);
		const y = 41 + Math.floor(random() * 10);
		rect(layer, x, y, 4, 1, mist);
	}
}

/**
 * The near hill the beacon tower stands on, rising from the valley to the right, its crest lit by the fire.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawHill(scene, random) {
	const grass = mix(C.forestFloorShade, C.nightSky3, 0.45);
	const grassLit = mix(C.forestFloor, C.amber, 0.35);
	const earth = mix(C.pineShade, C.nightSky1, 0.55);
	for (let x = 0; x < 64; x++) {
		const top = Math.round(
			x < 30
				? 60 - x * 0.35 + Math.sin(x * 0.4)
				: 50 - Math.min(x - 30, 14) * 0.12
		);
		for (let y = top; y < 64; y++) {
			let colour = y - top > 5 ? earth : grass;
			if (y === top) {
				colour = Math.abs(x - TOWER) < 16 ? grassLit : grass;
			}
			set(scene, x, y, colour);
		}
	}
	for (let i = 0; i < 18; i++) {
		const x = Math.floor(random() * 64);
		const y = 52 + Math.floor(random() * 11);
		if (get(scene, x, y) === earth) {
			set(scene, x, y, grass);
		}
	}
}

/**
 * The beacon tower: a stocky square watchtower of stone blocks, warmed by the fire above,
 * with battlements and a bonfire of logs on its roof.
 * @param {Canvas} scene
 */
function drawTower(scene) {
	const top = 27;
	const foot = 50;
	const left = TOWER - 7;
	const right = TOWER + 6;
	for (let y = top; y <= foot; y++) {
		const warmth =
			(Math.ceil(Math.max(0, 1 - (y - top) / 22) * 3) / 3) * 0.45;
		const course = Math.floor((y - top) / 3);
		for (let x = left; x <= right; x++) {
			let colour = C.stone;
			if (x === left) {
				colour = C.stoneLight;
			} else if (x >= right - 3) {
				colour = x >= right - 1 ? C.stoneShade : C.stoneMid;
			}
			const joint =
				(y - top) % 3 === 2 || (x - left + (course % 2) * 3) % 6 === 5;
			if (joint && x > left) {
				colour = x >= right - 3 ? C.stoneShade : C.stoneMid;
			}
			set(
				scene,
				x,
				y,
				mix(mix(colour, C.nightSky4, 0.2), C.amber, warmth)
			);
		}
	}
	// The battlements, their tops lit gold by the fire.
	for (let x = left - 1; x <= right + 1; x++) {
		const merlon = (x - left + 1) % 4 < 2;
		set(scene, x, top - 1, mix(C.stone, C.amber, 0.45));
		if (merlon) {
			set(scene, x, top - 2, mix(C.stone, C.amber, 0.45));
			set(scene, x, top - 3, mix(C.stoneLight, C.gold, 0.55));
		}
	}
	// An arrow slit and a door at the foot.
	rect(scene, TOWER - 1, 32, 1, 4, C.ink);
	rect(scene, TOWER - 2, foot - 5, 4, 6, C.wood);
	rect(scene, TOWER - 2, foot - 5, 4, 1, C.timberShade);
	// The bonfire's stacked logs.
	for (let i = 0; i < 9; i++) {
		set(scene, TOWER - 5 + i, top - 4 - Math.floor(i / 3), C.timber);
		set(scene, TOWER + 4 - i, top - 4 - Math.floor(i / 3), C.timberShade);
	}
}

/**
 * The beacon's fire: a ragged bonfire of three tongues, the middle one tallest with a white-hot heart,
 * drawn after the outline so it glows.
 * @param {Canvas} scene
 * @param {number} cx - The fire's centre column
 * @param {number} base - The fire's bottom row
 */
function drawFire(scene, cx, base) {
	/** @type {[number, number, number, boolean][]} */
	const tongues = [
		[-4, 9, 3, false],
		[4, 11, 3, false],
		[0, 16, 5, true],
	];
	for (const [dx, height, width, heart] of tongues) {
		const fx = cx + dx;
		for (let y = base - height; y <= base; y++) {
			const t = (y - (base - height)) / height;
			const half = Math.round(
				width * Math.sin(t * Math.PI * 0.6) +
					Math.sin(y * 1.3 + fx) * 0.9
			);
			for (let x = fx - half; x <= fx + half; x++) {
				const edge = Math.abs(x - fx) / Math.max(1, half);
				let colour = C.brickRed;
				if (heart && edge < 0.3 && t > 0.5) {
					colour = C.white;
				} else if (edge < 0.45 && t > 0.35) {
					colour = C.lampGlow;
				} else if (edge < 0.7 && t > 0.2) {
					colour = C.gold;
				} else if (edge < 0.95) {
					colour = C.amber;
				}
				set(scene, x, y, colour);
			}
		}
	}
	// Tongues breaking off the top of the blaze.
	/** @type {[number, number, Colour][]} */
	const sparks = [
		[-1, -17, C.amber],
		[-2, -18, C.brickRedLight],
		[1, -18, C.gold],
		[2, -20, C.amber],
		[-5, -11, C.brickRedLight],
		[5, -13, C.amber],
	];
	for (const [dx, dy, colour] of sparks) {
		set(scene, cx + dx, base + dy, colour);
	}
}

/**
 * Sparks whirling up from the beacon on the wind.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawSparks(scene, random) {
	for (let i = 0; i < 12; i++) {
		const x = TOWER - 14 + Math.floor(random() * 22);
		const y = Math.floor(random() * 14);
		if (Math.abs(x - TOWER) > 5 || y < 1) {
			set(scene, x, y, random() > 0.5 ? C.gold : C.amber);
		}
	}
}
