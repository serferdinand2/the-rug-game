// Automation: a jointed steel robot arm lifting a brass gear off a moving conveyor belt in a sunlit workshop.
import {
	createCanvas,
	set,
	rect,
	line,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The arm's joints, from the shoulder on its pedestal to the wrist over the belt. */
const SHOULDER = { x: 52, y: 29 };
const ELBOW = { x: 41, y: 9 };
const WRIST = { x: 23, y: 20 };

/** The gear in the gripper: its centre and the radius of its teeth. */
const GEAR = { x: 23, y: 35, r: 8 };

/** The rows of the belt's top, its front edge, the frame and the floor. */
const ROWS = { dado: 30, belt: 45, front: 49, frame: 51, floor: 57 };

/** The workshop wall: pale mint above, a darker green-grey dado below, and a sunbeam from a window on the left. */
const WALL = mix(C.cream, C.grassLight, 0.22);
const SUNBEAM = mix(WALL, C.white, 0.45);
const SUNBEAM_DADO = mix(C.grassShade, C.stoneMid, 0.3);
const DADO = mix(C.grassShade, C.stoneMid, 0.55);
const DADO_RAIL = mix(DADO, C.cream, 0.35);

/** The concrete floor and the shadows on it. */
const FLOOR = mix(C.stone, C.creamShade, 0.4);
const FLOOR_SHADE = mix(FLOOR, C.ink, 0.3);

/** The rubber belt and its ribs. */
const BELT = mix(C.stoneShade, C.ink, 0.5);
const BELT_RIB = mix(C.stoneShade, C.ink, 0.15);

/** The dark steel of the joints and the gripper, and the black air hose. */
const DARK_STEEL = mix(C.stoneShade, C.ink, 0.35);
const HOSE = mix(C.ink, C.stoneShade, 0.3);

/** The sunken web of the gear, between its rim and its hub. */
const GEAR_WEB = mix(C.brass, C.lampFrame, 0.45);

/** The arm's shadow on the wall and the dado. */
const WALL_SHADOW = mix(WALL, C.stoneMid, 0.5);
const DADO_SHADOW = mix(DADO, C.ink, 0.3);

/**
 * Draws the Automation tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(2659);

	drawRoom(layer);

	const arm = createCanvas(64, 64);
	drawPedestal(arm);
	drawArm(arm);
	drawGripper(arm);
	drawGear(arm, GEAR.x, GEAR.y, GEAR.r);
	drawArmShadow(layer, arm);

	drawBelt(scene, random);
	drawGear(scene, 6, 40, 5.6);
	for (let i = 0; i < arm.p.length; i++) {
		if (arm.p[i] && (i < ROWS.belt * 64 || !scene.p[i])) {
			scene.p[i] = arm.p[i];
		}
	}
	drawHose(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	drawSunOnArm(scene, arm);
	drawGleams(scene);
	return scene;
}

/**
 * The workshop: the two-tone wall with a slanting sunbeam, and the concrete floor.
 * @param {Canvas} layer
 */
function drawRoom(layer) {
	rect(layer, 0, 0, 64, ROWS.dado, WALL);
	for (let y = 0; y < ROWS.dado; y++) {
		const left = Math.round(2 + y * 0.5);
		rect(layer, left, y, 10, 1, SUNBEAM);
	}
	rect(layer, 0, ROWS.dado, 64, 1, DADO_RAIL);
	rect(layer, 0, ROWS.dado + 1, 64, ROWS.floor - ROWS.dado - 1, DADO);
	for (let y = ROWS.dado + 1; y < ROWS.belt; y++) {
		rect(layer, Math.round(2 + y * 0.5), y, 10, 1, SUNBEAM_DADO);
	}
	rect(layer, 0, ROWS.floor, 64, 64 - ROWS.floor, FLOOR);
	rect(layer, 0, ROWS.floor, 64, 1, FLOOR_SHADE);
}

/**
 * The arm's amber pedestal behind the belt: a drum with a lit top and a shaded right side.
 * @param {Canvas} scene
 */
function drawPedestal(scene) {
	const left = 45;
	const right = 59;
	for (let y = 32; y < ROWS.belt; y++) {
		for (let x = left; x <= right; x++) {
			let colour = C.amber;
			if (x < left + 3) {
				colour = C.gold;
			} else if (x > right - 4) {
				colour = mix(C.amber, C.lampFrame, 0.5);
			}
			set(scene, x, y, colour);
		}
	}
	// The turntable's top, an ellipse seen from a little above.
	for (let y = 29; y <= 34; y++) {
		for (let x = left; x <= right; x++) {
			const u = (x - (left + right) / 2) / 7.5;
			const v = (y - 31.5) / 2.6;
			if (u * u + v * v <= 1) {
				set(scene, x, y, y < 32 ? C.gold : C.amber);
			}
		}
	}
}

/**
 * The conveyor: the dark rubber belt with ribs, its rounded front edge, and the steel frame with rollers and legs.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawBelt(scene, random) {
	rect(scene, 0, ROWS.belt, 64, ROWS.front - ROWS.belt, BELT);
	rect(scene, 0, ROWS.belt, 64, 1, BELT_RIB);
	for (let x = 1 + Math.floor(random() * 3); x < 64; x += 5) {
		rect(scene, x, ROWS.belt, 1, ROWS.front - ROWS.belt, BELT_RIB);
	}
	rect(scene, 0, ROWS.front, 64, 2, mix(BELT, C.ink, 0.4));
	// The frame: a steel channel, lit along its top, with round rollers showing through.
	rect(scene, 0, ROWS.frame, 64, ROWS.floor - ROWS.frame - 1, C.stone);
	rect(scene, 0, ROWS.frame, 64, 1, C.stoneLight);
	rect(scene, 0, ROWS.floor - 2, 64, 1, C.stoneShade);
	for (let x = 4; x < 64; x += 10) {
		rect(scene, x, ROWS.frame + 1, 3, 3, C.stoneShade);
		set(scene, x + 1, ROWS.frame + 2, DARK_STEEL);
		set(scene, x, ROWS.frame + 1, C.stoneMid);
	}
	for (const x of [10, 52]) {
		rect(scene, x, ROWS.floor - 1, 3, 64 - ROWS.floor + 1, C.stoneShade);
		rect(scene, x, ROWS.floor - 1, 1, 64 - ROWS.floor + 1, C.stone);
	}
}

/**
 * Paints a thick steel limb between two joints, lit on the side that faces the window.
 * @param {Canvas} scene
 * @param {{ x: number, y: number }} a
 * @param {{ x: number, y: number }} b
 * @param {number} half - Half the limb's thickness
 */
function drawLimb(scene, a, b, half) {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	const length = Math.hypot(dx, dy);
	// The normal that points up and to the left, towards the light.
	let nx = -dy / length;
	let ny = dx / length;
	if (nx + ny > 0) {
		nx = -nx;
		ny = -ny;
	}
	const minX = Math.floor(Math.min(a.x, b.x) - half - 1);
	const maxX = Math.ceil(Math.max(a.x, b.x) + half + 1);
	const minY = Math.floor(Math.min(a.y, b.y) - half - 1);
	const maxY = Math.ceil(Math.max(a.y, b.y) + half + 1);
	for (let y = minY; y <= maxY; y++) {
		for (let x = minX; x <= maxX; x++) {
			const px = x - a.x;
			const py = y - a.y;
			const along = (px * dx + py * dy) / length;
			if (along < 0 || along > length) {
				continue;
			}
			const across = px * nx + py * ny;
			if (Math.abs(across) > half) {
				continue;
			}
			let colour = C.stone;
			if (across > half * 0.35) {
				colour = C.stoneLight;
			} else if (across < -half * 0.4) {
				colour = C.stoneShade;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * Paints a round joint: a dark steel hub with a lit rim and a red cap in the middle.
 * @param {Canvas} scene
 * @param {{ x: number, y: number }} at
 * @param {number} r
 */
function drawJoint(scene, at, r) {
	for (let y = Math.floor(at.y - r); y <= Math.ceil(at.y + r); y++) {
		for (let x = Math.floor(at.x - r); x <= Math.ceil(at.x + r); x++) {
			const dx = x - at.x;
			const dy = y - at.y;
			const d = Math.hypot(dx, dy);
			if (d > r) {
				continue;
			}
			let colour = DARK_STEEL;
			if (d > r - 1.2 && dx + dy < -1) {
				colour = C.stone;
			} else if (d < r * 0.45) {
				colour = dx + dy < 0 ? C.brickRedLight : C.brickRed;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The arm: the upper limb rising from the shoulder, the forearm reaching down over the belt, and the three joints.
 * @param {Canvas} scene
 */
function drawArm(scene) {
	drawLimb(scene, SHOULDER, ELBOW, 4);
	drawLimb(scene, ELBOW, WRIST, 3.4);
	drawJoint(scene, SHOULDER, 5.2);
	drawJoint(scene, ELBOW, 4.6);
	drawJoint(scene, WRIST, 3.6);
}

/**
 * The gripper: a short wrist post, a crossbar, and two fingers closing on the gear's rim.
 * @param {Canvas} scene
 */
function drawGripper(scene) {
	const { x, y } = WRIST;
	rect(scene, x - 2, y + 3, 5, 3, C.stone);
	rect(scene, x - 2, y + 3, 1, 3, C.stoneLight);
	rect(scene, x - 11, y + 5, 23, 3, DARK_STEEL);
	rect(scene, x - 11, y + 5, 23, 1, C.stoneMid);
	for (const side of [-1, 1]) {
		const fx = side < 0 ? x - 11 : x + 10;
		rect(scene, fx, y + 8, 2, 8, C.stone);
		rect(
			scene,
			fx + (side < 0 ? 0 : 1),
			y + 8,
			1,
			8,
			side < 0 ? C.stoneLight : C.stoneShade
		);
		// The finger's tip, turned in against the gear.
		rect(scene, side < 0 ? fx + 1 : fx - 1, y + 13, 2, 3, DARK_STEEL);
	}
}

/**
 * A brass gear seen face on: square teeth round its rim, a sunken web, a raised hub and a dark axle hole.
 * @param {Canvas} scene
 * @param {number} cx
 * @param {number} cy
 * @param {number} r - The radius at the tips of its teeth
 */
function drawGear(scene, cx, cy, r) {
	const teeth = 8;
	for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
		for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
			const dx = x - cx;
			const dy = y - cy;
			const d = Math.hypot(dx, dy);
			const angle = Math.atan2(dy, dx) + Math.PI / teeth / 2;
			const tooth = ((((angle / (Math.PI * 2)) * teeth) % 1) + 1) % 1;
			const reach = tooth < 0.5 ? r + 0.4 : r - 1.6;
			if (d > reach) {
				continue;
			}
			const lit = dx + dy;
			let colour = C.brass;
			if (d < 1.5) {
				colour = C.lampFrame;
			} else if (d < 3.2) {
				colour = lit < 0 ? C.gold : C.brass;
			} else if (d < r - 2.6) {
				colour = GEAR_WEB;
			} else if (lit < -2) {
				colour = C.gold;
			} else if (lit > 3) {
				colour = C.lampFrame;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The arm's shadow, thrown onto the wall to the lower right of it, away from the window.
 * @param {Canvas} layer
 * @param {Canvas} scene - The arm, already painted
 */
function drawArmShadow(layer, scene) {
	for (let y = 0; y < ROWS.belt; y++) {
		for (let x = 0; x < 64; x++) {
			const from = scene.p[(y - 3) * 64 + (x - 4)];
			if (y < 3 || x < 4 || !from) {
				continue;
			}
			set(
				layer,
				x,
				y,
				y < ROWS.dado
					? WALL_SHADOW
					: y > ROWS.dado
						? DADO_SHADOW
						: DADO_RAIL
			);
		}
	}
}

/**
 * The black air hose looping from the pedestal up along the upper limb to the elbow.
 * @param {Canvas} scene
 */
function drawHose(scene) {
	/** @type {[number, number][]} */
	const points = [
		[58, 33],
		[59, 28],
		[58, 22],
		[55, 16],
		[51, 10],
		[47, 6],
		[44, 5],
	];
	for (let i = 1; i < points.length; i++) {
		const [x0, y0] = points[i - 1];
		const [x1, y1] = points[i];
		line(scene, x0, y0, x1, y1, HOSE);
	}
}

/**
 * Whether a pixel lies in the sunbeam slanting in from the window on the left.
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function inSunbeam(x, y) {
	const left = Math.round(2 + y * 0.5);
	return y < ROWS.belt && x >= left && x < left + 10;
}

/**
 * Brightens the parts of the arm and the gear that stand in the sunbeam.
 * @param {Canvas} scene
 * @param {Canvas} arm - The arm alone, to tell its pixels from the wall's
 */
function drawSunOnArm(scene, arm) {
	for (let y = 0; y < ROWS.belt; y++) {
		for (let x = 0; x < 64; x++) {
			const i = y * 64 + x;
			if (inSunbeam(x, y) && arm.p[i] && scene.p[i] !== C.ink) {
				scene.p[i] = mix(scene.p[i] ?? C.white, C.white, 0.2);
			}
		}
	}
}

/**
 * Sunlit gleams on the steel and the gear, painted over the outline.
 * @param {Canvas} scene
 */
function drawGleams(scene) {
	for (const [x, y] of [
		[45, 15],
		[30, 13],
		[19, 31],
		[4, 37],
	]) {
		set(scene, x, y, C.white);
	}
	// A long sheen down the lit edge of the upper limb.
	for (const [x, y] of [
		[46, 16],
		[47, 18],
		[48, 20],
		[37, 10],
		[35, 11],
	]) {
		set(scene, x, y, mix(C.stoneLight, C.white, 0.5));
	}
}
