// Steam Tycoon: a green steam locomotive crossing a timber trestle bridge over a river gorge, trailing plumes of steam.
import {
	createCanvas,
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

/** The sky's last row, the rail's row (the wheels stand on the row above) and the river's first row. */
const HORIZON = 30;
const RAIL = 42;
const RIVER = 57;

/**
 * Draws the Steam Tycoon scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(345);

	drawSky(layer, { time: 'day', horizon: HORIZON, random });
	drawMountains(layer);
	drawGorge(layer, random);
	drawTrestle(layer);
	drawPlume(layer);

	drawDeck(scene);
	drawTender(scene);
	drawLocomotive(scene);
	outline(scene, C.ink);
	underlay(scene, layer);
	drawRods(scene);
	drawCylinderSteam(scene);
	return scene;
}

/**
 * Hazy blue mountains on the far side of the valley.
 * @param {Canvas} layer
 */
function drawMountains(layer) {
	const far = mix(C.daySky4, C.stoneMid, 0.35);
	const farLight = mix(C.daySky5, C.stoneLight, 0.3);
	for (let x = 0; x < 64; x++) {
		const top = Math.round(
			22 + Math.abs(((x + 6) % 26) - 13) * 0.55 + Math.sin(x * 0.9) * 0.6
		);
		for (let y = top; y <= HORIZON + 4; y++) {
			set(layer, x, y, (x + 6) % 26 < 13 && y < top + 3 ? farLight : far);
		}
	}
}

/**
 * The valley below the bridge: green hills, a rocky gorge falling to a river, and grassy near slopes.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawGorge(layer, random) {
	for (let x = 0; x < 64; x++) {
		const hill = Math.round(33 + Math.sin(x * 0.15 + 1) * 1.5);
		for (let y = hill; y < 64; y++) {
			let colour = y === hill ? C.grassLight : C.grass;
			if (y > hill + 5) {
				colour = (x + y) % 2 === 0 ? C.grassShade : C.grass;
			}
			if (y > hill + 8) {
				// The far wall of the gorge: rock in shadow.
				colour =
					y % 3 === 0 && (x + y) % 5 === 0
						? C.stoneShade
						: C.stoneMid;
				if (y > 50) {
					colour = (x + y) % 4 === 0 ? C.stoneMid : C.stoneShade;
				}
			}
			set(layer, x, y, colour);
		}
	}
	// The river at the bottom of the gorge.
	for (let y = RIVER; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const colour =
				y === RIVER
					? C.daySeaLine
					: y < RIVER + 3
						? C.daySea1
						: C.daySea2;
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 9; i++) {
		const x = Math.floor(random() * 60);
		const y = RIVER + 2 + Math.floor(random() * 6);
		rect(layer, x, y, 3, 1, C.dayWave);
	}
	// Near slopes on both sides, framing the gorge.
	for (let x = 0; x < 64; x++) {
		const left = 47 + Math.round(x * 0.9);
		const right = 47 + Math.round((63 - x) * 0.9);
		const top = Math.min(left, right);
		for (let y = top; y < 64; y++) {
			const colour =
				y === top
					? C.grassLight
					: y > top + 4 && (x + y) % 2 === 0
						? C.grassShade
						: C.grass;
			set(layer, x, y, colour);
		}
	}
}

/**
 * The trestle under the deck: battered timber bents tied by walings and cross-braced.
 * Drawn on the background layer, so the lattice stays light instead of turning to ink.
 * @param {Canvas} layer
 */
function drawTrestle(layer) {
	const bents = [2, 16, 30, 44, 58];
	// Cross-braces between neighbouring bents.
	for (let i = 0; i + 1 < bents.length; i++) {
		for (const [y0, y1] of [
			[RAIL + 3, 51],
			[51, 63],
		]) {
			line(layer, bents[i] + 1, y0, bents[i + 1] - 1, y1, C.timber);
			line(layer, bents[i] + 1, y1, bents[i + 1] - 1, y0, C.timber);
		}
	}
	// Walings: horizontal ties across the whole trestle.
	for (const y of [51, 60]) {
		rect(layer, 0, y, 64, 1, C.timber);
		rect(layer, 0, y + 1, 64, 1, C.wood);
	}
	// The bents: a pair of legs splaying outwards towards the ground.
	for (const bx of bents) {
		for (let y = RAIL + 3; y < 64; y++) {
			const splay = Math.floor((y - RAIL - 3) / 7);
			for (const x of [bx - 1 - splay, bx + 1 + splay]) {
				set(layer, x, y, C.timberLight);
				set(layer, x + 1, y, C.timberShade);
			}
			set(layer, bx, y, C.timber);
			set(layer, bx + 1, y, C.wood);
		}
	}
}

/**
 * Draws a one-pixel line between two points.
 * @param {Canvas} canvas
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @param {Colour} colour
 */
function line(canvas, x0, y0, x1, y1, colour) {
	const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
	for (let i = 0; i <= steps; i++) {
		const t = steps === 0 ? 0 : i / steps;
		set(
			canvas,
			Math.round(x0 + (x1 - x0) * t),
			Math.round(y0 + (y1 - y0) * t),
			colour
		);
	}
}

/**
 * The plume from the funnel: coal-grey where it leaves the funnel, whitening as it streams
 * back over the cab and the tender and out of the picture.
 * @param {Canvas} layer
 */
function drawPlume(layer) {
	[
		[11, 6, 2],
		[13, 3, 3],
		[17, 1, 3],
		[22, 1, 4],
		[29, 2, 4],
		[35, 1, 5],
		[42, 3, 5],
		[49, 2, 5],
		[56, 4, 5],
		[62, 3, 4],
	].forEach(([cx, cy, r], i) => {
		puff(layer, cx, cy, r, i < 3);
	});
}

/**
 * One round puff, light on top and shaded underneath.
 * @param {Canvas} canvas
 * @param {number} cx
 * @param {number} cy
 * @param {number} r
 * @param {boolean} smoky - Grey coal smoke rather than white steam
 */
function puff(canvas, cx, cy, r, smoky) {
	const [light, mid, shade] = smoky
		? [C.cloudShade, C.stoneLight, C.stone]
		: [C.white, C.cloudShade, C.stoneLight];
	for (let y = cy - r; y <= cy + r; y++) {
		for (let x = cx - r; x <= cx + r; x++) {
			const d = (x - cx) ** 2 + (y - cy) ** 2;
			if (d > r * r + r) {
				continue;
			}
			let colour = light;
			if (y > cy + r / 2) {
				colour = d > r * r - r ? shade : mid;
			} else if (y > cy) {
				colour = mid;
			}
			set(canvas, x, y, colour);
		}
	}
}

/**
 * The bridge deck: a rail on sleepers over a heavy timber stringer, running edge to edge.
 * @param {Canvas} scene
 */
function drawDeck(scene) {
	for (let x = 0; x < 64; x++) {
		set(scene, x, RAIL, C.stoneLight);
		set(scene, x, RAIL + 1, x % 3 === 0 ? C.timberShade : C.timberLight);
		set(scene, x, RAIL + 2, C.timber);
		set(scene, x, RAIL + 3, C.timberShade);
	}
}

/**
 * The tender behind the cab, heaped with coal, running off the right edge.
 * @param {Canvas} scene
 */
function drawTender(scene) {
	const left = 47;
	for (let y = 22; y <= 36; y++) {
		for (let x = left; x < 64; x++) {
			let colour = C.pine;
			if (y === 22 || y === 36) {
				colour = C.brass;
			} else if (x === left) {
				colour = C.pineLight;
			} else if (y > 33) {
				colour = C.pineShade;
			}
			set(scene, x, y, colour);
		}
	}
	// A brass-lined panel on its side.
	for (let x = left + 3; x < 64; x++) {
		set(scene, x, 25, C.brass);
		set(scene, x, 32, C.brass);
	}
	rect(scene, left + 3, 25, 1, 8, C.brass);
	// The coal heap.
	for (let x = left + 1; x < 64; x++) {
		const top = 20 - (x % 3 === 1 ? 1 : 0);
		for (let y = top; y < 22; y++) {
			set(scene, x, y, (x + y) % 4 === 0 ? C.stoneShade : C.night);
		}
	}
	wheel(scene, 52, 38, 3);
	wheel(scene, 60, 38, 3);
}

/**
 * The locomotive, facing left: funnel, smokebox, green boiler with brass bands and domes,
 * a cab with a lit window, a red running board, a cowcatcher and big spoked driving wheels.
 * @param {Canvas} scene
 */
function drawLocomotive(scene) {
	const smoke = mix(C.ink, C.stoneShade, 0.45);
	const smokeLight = mix(C.ink, C.stoneShade, 0.85);
	// The dark underframe, then the wheels, so the running board and cylinder sit in front of them.
	rect(scene, 7, 32, 40, 4, C.night);
	wheel(scene, 10, 38, 3);
	wheel(scene, 22, 36, 5);
	wheel(scene, 34, 36, 5);
	wheel(scene, 43, 39, 2);
	// The funnel, with a flared brass cap.
	for (let y = 10; y <= 19; y++) {
		const flare = y <= 11 ? 1 : 0;
		for (let x = 9 - flare; x <= 12 + flare; x++) {
			set(scene, x, y, x <= 9 - flare + 1 ? smokeLight : smoke);
		}
	}
	rect(scene, 8, 9, 6, 1, C.gold);
	// The smokebox at the front of the boiler.
	for (let y = 19; y <= 30; y++) {
		for (let x = 7; x <= 13; x++) {
			set(scene, x, y, x <= 8 || y === 19 ? smokeLight : smoke);
		}
	}
	// The headlamp on the smokebox front.
	rect(scene, 4, 20, 3, 3, C.lampGlow);
	set(scene, 4, 20, C.white);
	rect(scene, 4, 23, 3, 1, C.lampFrame);
	// The boiler: lit along the top, shaded underneath, banded in brass.
	for (let y = 19; y <= 29; y++) {
		for (let x = 14; x <= 35; x++) {
			let colour = C.pine;
			if (y <= 20) {
				colour = C.pineLight;
			} else if (y >= 27) {
				colour = C.pineShade;
			}
			if (x === 14 || x === 21 || x === 28) {
				colour = y <= 20 ? C.gold : C.brass;
			}
			set(scene, x, y, colour);
		}
	}
	// The steam dome and the sand dome, in polished brass.
	brassDome(scene, 24, [2, 3, 3, 3, 4]);
	brassDome(scene, 32, [1, 2, 2, 3]);
	// The cab: a green box under an overhanging roof, a lit window and a lined panel.
	for (let y = 12; y <= 31; y++) {
		for (let x = 36; x <= 46; x++) {
			const colour =
				x === 36 ? C.pineLight : x >= 45 ? C.pineShade : C.pine;
			set(scene, x, y, colour);
		}
	}
	rect(scene, 35, 10, 13, 2, C.night);
	rect(scene, 35, 10, 13, 1, smokeLight);
	rect(scene, 38, 14, 6, 5, C.lampGlow);
	rect(scene, 38, 17, 6, 2, C.gold);
	for (let y = 21; y <= 28; y++) {
		for (let x = 38; x <= 43; x++) {
			if (y === 21 || y === 28 || x === 38 || x === 43) {
				set(scene, x, y, C.brass);
			}
		}
	}
	// The red running board along the whole engine, and the buffer beam.
	rect(scene, 4, 30, 43, 2, C.brickRed);
	rect(scene, 4, 30, 43, 1, C.brickRedLight);
	rect(scene, 3, 30, 4, 4, C.brickRed);
	rect(scene, 3, 30, 1, 4, C.brickRedLight);
	// The cylinder between the leading wheel and the first driver.
	rect(scene, 12, 32, 6, 4, C.pineShade);
	rect(scene, 12, 32, 6, 1, C.pine);
	rect(scene, 12, 32, 1, 4, C.brass);
	// The cowcatcher: red bars sloping down to the rail.
	for (let y = 34; y <= RAIL - 1; y++) {
		const left = 3 - Math.floor((y - 34) / 2);
		for (let x = left; x <= 6; x++) {
			set(scene, x, y, x % 2 === 0 ? C.brickRedShade : C.brickRed);
		}
	}
}

/**
 * A rounded brass dome on top of the boiler, lit on its left.
 * @param {Canvas} scene
 * @param {number} cx - The column just right of its centre
 * @param {number[]} widths - Its half-widths from the top row down; the last row sits on the boiler
 */
function brassDome(scene, cx, widths) {
	const top = 19 - widths.length;
	widths.forEach((half, j) => {
		for (let x = cx - half; x < cx + half; x++) {
			set(
				scene,
				x,
				top + j,
				x <= cx - half + (j === 0 ? 0 : 1) ? C.gold : C.brass
			);
		}
	});
}

/**
 * A wheel with a steel tyre, red spokes against the dark between them and a red hub,
 * resting its bottom row on the row above the rail.
 * @param {Canvas} scene
 * @param {number} cx
 * @param {number} cy
 * @param {number} r
 */
function wheel(scene, cx, cy, r) {
	const gap = mix(C.ink, C.roofShade, 0.5);
	for (let y = cy - r; y <= cy + r; y++) {
		for (let x = cx - r; x <= cx + r; x++) {
			const dx = x - cx;
			const dy = y - cy;
			const d = dx * dx + dy * dy;
			if (d > r * r + r * 0.6) {
				continue;
			}
			let colour = gap;
			if (d >= (r - 1) * (r - 1) + 1) {
				// The steel tyre, lit on its upper left.
				colour = dx + dy < 0 ? C.stoneLight : C.stone;
			} else if (d <= 1) {
				colour = C.brickRed;
			} else if (
				dx === 0 ||
				dy === 0 ||
				(r >= 4 && Math.abs(dx) === Math.abs(dy))
			) {
				colour = dx + dy < 0 ? C.brickRedLight : C.brickRed;
			}
			set(scene, x, y, colour);
		}
	}
	set(scene, cx, cy, C.brass);
}

/**
 * The coupling rod joining the driving wheels and the piston rod from the cylinder, in bright steel.
 * Drawn after the outline so it sits on top of the wheels.
 * @param {Canvas} scene
 */
function drawRods(scene) {
	rect(scene, 22, 38, 13, 1, C.stoneLight);
	set(scene, 22, 38, C.brass);
	set(scene, 34, 38, C.brass);
	rect(scene, 18, 34, 4, 1, C.stoneLight);
	set(scene, 21, 35, C.stoneLight);
	set(scene, 22, 36, C.stoneLight);
}

/**
 * Little puffs of steam escaping round the cylinder, low by the rail.
 * @param {Canvas} scene
 */
function drawCylinderSteam(scene) {
	/** @type {[number, number, Colour][]} */
	const puffs = [
		[0, 39, C.cloudShade],
		[1, 39, C.white],
		[1, 40, C.white],
		[0, 40, C.white],
		[2, 40, C.cloudShade],
		[0, 41, C.cloudShade],
		[1, 41, C.cloudShade],
		[15, 40, C.white],
		[16, 40, C.white],
		[14, 41, C.cloudShade],
		[15, 41, C.white],
		[16, 41, C.cloudShade],
		[17, 41, C.cloudShade],
	];
	for (const [x, y, colour] of puffs) {
		set(scene, x, y, colour);
	}
}
