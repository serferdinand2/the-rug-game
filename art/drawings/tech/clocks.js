// Clocks: an open gold pocket watch close up on dark velvet by lamplight, its lid raised, its gears showing through the dial.
import {
	createCanvas,
	get,
	set,
	rect,
	line,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The watch's centre and radii: the case, the bezel inside it and the dial. */
const WATCH = { x: 40, y: 35, case: 19, bezel: 17, dial: 15.5 };

/** The open-heart window in the dial, onto the balance wheel and a gear. */
const HEART = { x: 40, y: 43, r: 6.5 };

/** The raised lid, hinged on the case's left side and seen edge-on as a tall ellipse. */
const LID = { x: 12, y: 34, rx: 6, ry: 18 };

/** Where the lamp stands, off the top-right corner. */
const LAMP = { x: 63, y: 0 };

/** The velvet: a deep crimson pile in three tones, and the shadow the watch casts on it. */
const VELVET = mix(C.brickRedShade, C.night, 0.45);
const VELVET_LIGHT = mix(C.brickRedShade, C.brickRed, 0.35);
const VELVET_DARK = mix(C.brickRedShade, C.ink, 0.7);
const SHADOW = mix(VELVET_DARK, C.ink, 0.45);

/** The dark works behind the open heart. */
const WORKS = mix(C.wood, C.ink, 0.4);

/**
 * Draws the Clocks tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(1656);

	drawVelvet(layer, random);
	drawShadows(layer);

	drawChain(scene);
	drawLid(scene);
	drawCase(scene);
	drawDial(scene);
	drawHeart(scene);
	drawHands(scene);
	drawLooseGear(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	glow(scene, {
		x: LAMP.x,
		y: LAMP.y,
		radius: 58,
		colour: C.lampGlow,
		strength: 0.3,
		steps: 4,
		skip: [C.ink],
	});
	drawGleams(scene);
	return scene;
}

/**
 * The velvet cloth: soft diagonal folds with a fine pile.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawVelvet(layer, random) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const fold = Math.sin(
				(x * 0.55 + y * 0.85) / 3.4 + Math.sin(y / 9) * 1.6
			);
			let colour = VELVET;
			if (fold > 0.6) {
				colour = VELVET_LIGHT;
			} else if (fold < -0.55) {
				colour = VELVET_DARK;
			}
			set(layer, x, y, colour);
		}
	}
	// The pile: a sprinkle of the neighbouring tone.
	for (let i = 0; i < 120; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.floor(random() * 64);
		const colour = get(layer, x, y);
		set(layer, x, y, colour === VELVET ? VELVET_DARK : VELVET);
	}
}

/**
 * The watch and its lid cast their shadows down and to the left, away from the lamp.
 * @param {Canvas} layer
 */
function drawShadows(layer) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const watch = Math.hypot(x - (WATCH.x - 3), y - (WATCH.y + 4));
			const lid =
				((x - (LID.x - 3)) / LID.rx) ** 2 +
				((y - (LID.y + 3)) / LID.ry) ** 2;
			if (watch < WATCH.case + 1 || lid < 1) {
				set(layer, x, y, SHADOW);
			}
		}
	}
}

/**
 * Picks a gold tone for a point on a round surface by how much it faces the lamp.
 * @param {number} dx - Column offset from the centre
 * @param {number} dy - Row offset from the centre
 * @param {number} [shift=0] - Darkens the result by this many tones
 * @returns {Colour}
 */
function goldTone(dx, dy, shift = 0) {
	const length = Math.hypot(dx, dy) || 1;
	const facing = (dx - dy) / (length * Math.SQRT2);
	const tones = [C.lampGlow, C.gold, C.brass, C.amber, C.lampFrame];
	let index = facing > 0.75 ? 0 : facing > 0.2 ? 1 : facing > -0.35 ? 2 : 3;
	index = Math.min(index + shift, tones.length - 1);
	return tones[index];
}

/**
 * The case: its side wall showing below, the polished rim, the bezel, and the crown and bow on top.
 * @param {Canvas} scene
 */
function drawCase(scene) {
	const { x: cx, y: cy } = WATCH;
	// The side wall, seen below the rim because the watch lies tilted towards us.
	for (let y = cy - WATCH.case; y <= cy + WATCH.case + 3; y++) {
		for (let x = cx - WATCH.case; x <= cx + WATCH.case; x++) {
			if (Math.hypot(x - cx, y - (cy + 2)) < WATCH.case) {
				set(scene, x, y, x > cx + 6 ? C.amber : C.lampFrame);
			}
		}
	}
	for (let y = cy - WATCH.case; y <= cy + WATCH.case; y++) {
		for (let x = cx - WATCH.case; x <= cx + WATCH.case; x++) {
			const d = Math.hypot(x - cx, y - cy);
			if (d >= WATCH.case || d < WATCH.dial) {
				continue;
			}
			const shift = d < WATCH.bezel ? 1 : 0;
			set(scene, x, y, goldTone(x - cx, y - cy, shift));
		}
	}
	// A groove between the rim and the bezel.
	for (let y = cy - WATCH.case; y <= cy + WATCH.case; y++) {
		for (let x = cx - WATCH.case; x <= cx + WATCH.case; x++) {
			const d = Math.hypot(x - cx, y - cy);
			if (
				d >= WATCH.bezel - 0.5 &&
				d < WATCH.bezel &&
				x - cx - (y - cy) < 0
			) {
				set(scene, x, y, C.lampFrame);
			}
		}
	}
	// The crown: a knurled button on a short stem.
	rect(scene, cx - 2, cy - WATCH.case - 2, 5, 2, C.brass);
	for (let x = cx - 3; x <= cx + 3; x++) {
		for (let y = cy - WATCH.case - 6; y <= cy - WATCH.case - 3; y++) {
			set(scene, x, y, (x - cx) % 2 === 0 ? C.gold : C.amber);
		}
	}
	set(scene, cx + 2, cy - WATCH.case - 5, C.lampGlow);
	// The bow: a ring the chain hangs from.
	const bow = { x: cx, y: cy - WATCH.case - 10 };
	for (let y = bow.y - 4; y <= bow.y + 4; y++) {
		for (let x = bow.x - 4; x <= bow.x + 4; x++) {
			const d = Math.hypot(x - bow.x, y - bow.y);
			if (d >= 2.4 && d < 4.2) {
				set(scene, x, y, goldTone(x - bow.x, y - bow.y));
			}
		}
	}
}

/**
 * The enamel dial: cream, shaded under the bezel on the lamp side, with twelve tick marks and no numerals.
 * @param {Canvas} scene
 */
function drawDial(scene) {
	const { x: cx, y: cy } = WATCH;
	for (let y = cy - WATCH.dial; y <= cy + WATCH.dial; y++) {
		for (let x = cx - WATCH.dial; x <= cx + WATCH.dial; x++) {
			const dx = x - cx;
			const dy = y - cy;
			const d = Math.hypot(dx, dy);
			if (d >= WATCH.dial) {
				continue;
			}
			let colour = C.creamLight;
			if (d >= WATCH.dial - 1.2 && dx - dy > 0) {
				colour = C.creamShade;
			} else if (d >= WATCH.dial - 2.2 && dx - dy > 4) {
				colour = C.cream;
			} else if (dx - dy < -14) {
				colour = C.cream;
			}
			set(scene, Math.round(x), Math.round(y), colour);
		}
	}
	// The tick marks: long at the quarters, short between. The open heart takes six o'clock's place.
	for (let hour = 0; hour < 12; hour++) {
		if (hour === 6) {
			continue;
		}
		const angle = (hour / 12) * Math.PI * 2;
		const inner = hour % 3 === 0 ? 10.5 : 12;
		for (let r = inner; r <= 13.6; r += 0.5) {
			const x = Math.round(cx + Math.sin(angle) * r);
			const y = Math.round(cy - Math.cos(angle) * r);
			set(scene, x, y, C.wood);
		}
	}
}

/**
 * The open heart: a brass-ringed window in the dial onto the dark works, a toothed gear and the gold balance wheel with its ruby.
 * @param {Canvas} scene
 */
function drawHeart(scene) {
	const { x: hx, y: hy, r } = HEART;
	const reach = Math.ceil(r);
	for (let y = hy - reach; y <= hy + reach; y++) {
		for (let x = hx - reach; x <= hx + reach; x++) {
			const d = Math.hypot(x - hx, y - hy);
			if (d < r - 0.8) {
				set(scene, x, y, WORKS);
			} else if (d < r + 0.4) {
				set(scene, x, y, goldTone(x - hx, y - hy, 1));
			}
		}
	}
	// A gear on the left, its teeth catching the light.
	const gear = { x: hx - 2, y: hy + 2 };
	for (let y = gear.y - 5; y <= gear.y + 5; y++) {
		for (let x = gear.x - 5; x <= gear.x + 5; x++) {
			const d = Math.hypot(x - gear.x, y - gear.y);
			const angle = Math.atan2(y - gear.y, x - gear.x);
			const tooth = Math.cos(angle * 8) > 0.2;
			const inWindow = Math.hypot(x - hx, y - hy) < r - 0.8;
			if (!inWindow) {
				continue;
			}
			if (d < 1.2) {
				set(scene, x, y, C.lampFrame);
			} else if (d < 3.2 || (d < 4.4 && tooth)) {
				set(
					scene,
					x,
					y,
					x - gear.x - (y - gear.y) > 0 ? C.gold : C.brass
				);
			}
		}
	}
	// The balance wheel on the right: a gold ring with two crossed spokes and a ruby at its hub.
	const wheel = { x: hx + 2, y: hy - 2 };
	for (let y = wheel.y - 4; y <= wheel.y + 4; y++) {
		for (let x = wheel.x - 4; x <= wheel.x + 4; x++) {
			const d = Math.hypot(x - wheel.x, y - wheel.y);
			if (d >= 2.4 && d < 3.5) {
				set(scene, x, y, goldTone(x - wheel.x, y - wheel.y));
			} else if (d < 2.4) {
				set(scene, x, y, WORKS);
			}
		}
	}
	for (let k = -2; k <= 2; k++) {
		set(scene, wheel.x + k, wheel.y, C.amber);
		set(scene, wheel.x, wheel.y + k, C.amber);
	}
	set(scene, wheel.x, wheel.y, C.brickRedLight);
	set(scene, wheel.x + 1, wheel.y - 1, C.lampGlow);
}

/**
 * The hands at ten past ten: a broad hour hand, a long minute hand and a gold centre pin.
 * @param {Canvas} scene
 */
function drawHands(scene) {
	const { x: cx, y: cy } = WATCH;
	/**
	 * One hand from the centre out to its tip.
	 * @param {number} hours - Where it points, in hours round the dial
	 * @param {number} length
	 * @param {boolean} broad - Two pixels wide near the centre
	 */
	const hand = (hours, length, broad) => {
		const angle = (hours / 12) * Math.PI * 2;
		const tx = Math.round(cx + Math.sin(angle) * length);
		const ty = Math.round(cy - Math.cos(angle) * length);
		line(scene, cx, cy, tx, ty, C.ink);
		if (broad) {
			const mx = Math.round(cx + Math.sin(angle) * (length - 2));
			const my = Math.round(cy - Math.cos(angle) * (length - 2));
			line(scene, cx, cy - 1, mx, my - 1, C.ink);
		}
	};
	hand(10.2, 8, true);
	hand(2, 12, false);
	set(scene, cx, cy, C.gold);
}

/**
 * The raised lid, seen edge-on: its polished inside lit by the lamp, an engraved ring, and the hinge to the case.
 * @param {Canvas} scene
 */
function drawLid(scene) {
	const { x: lx, y: ly, rx, ry } = LID;
	for (let y = ly - ry; y <= ly + ry; y++) {
		for (let x = lx - rx; x <= lx + rx; x++) {
			const e = ((x - lx) / rx) ** 2 + ((y - ly) / ry) ** 2;
			if (e >= 1) {
				continue;
			}
			let colour = C.gold;
			if (e > 0.72) {
				colour = x > lx ? C.brass : C.amber;
			} else if (x - lx >= 1 && x - lx <= 2 && y < ly + 6) {
				colour = C.lampGlow;
			} else if (x < lx - 2) {
				colour = C.brass;
			}
			set(scene, x, y, colour);
		}
	}
	// The engraved ring on the lid's inside.
	for (let y = ly - ry; y <= ly + ry; y++) {
		for (let x = lx - rx; x <= lx + rx; x++) {
			const e = ((x - lx) / (rx - 2.5)) ** 2 + ((y - ly) / (ry - 6)) ** 2;
			if (e >= 0.8 && e < 1) {
				set(scene, x, y, C.amber);
			}
		}
	}
	// The hinge joining the lid to the case.
	rect(
		scene,
		lx + rx - 1,
		ly - 2,
		WATCH.x - WATCH.case - (lx + rx) + 2,
		5,
		C.brass
	);
	rect(
		scene,
		lx + rx - 1,
		ly - 2,
		WATCH.x - WATCH.case - (lx + rx) + 2,
		1,
		C.gold
	);
}

/**
 * The chain: from the bow round the left of the lid, coiling along the front of the velvet to a bar.
 * @param {Canvas} scene
 */
function drawChain(scene) {
	const points = [
		[36, 6],
		[27, 3],
		[15, 5],
		[6, 11],
		[2, 22],
		[2, 38],
		[4, 50],
		[10, 58],
		[22, 61],
		[34, 60],
		[44, 61],
		[50, 60],
	];
	let step = 0;
	for (let i = 0; i < points.length - 1; i++) {
		const [x0, y0] = points[i];
		const [x1, y1] = points[i + 1];
		const length = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
		for (let k = 0; k < length; k++) {
			const x = Math.round(x0 + ((x1 - x0) * k) / length);
			const y = Math.round(y0 + ((y1 - y0) * k) / length);
			const link = step % 3;
			set(
				scene,
				x,
				y,
				link === 0 ? C.gold : link === 1 ? C.amber : C.brass
			);
			if (link === 0) {
				set(scene, x + 1, y, C.amber);
			}
			step++;
		}
	}
	// The bar at the chain's end.
	rect(scene, 50, 58, 2, 5, C.gold);
	set(scene, 51, 58, C.lampGlow);
}

/**
 * A small loose gear lying on the velvet, waiting to go back in.
 * @param {Canvas} scene
 */
function drawLooseGear(scene) {
	const gear = { x: 58, y: 52 };
	for (let y = gear.y - 4; y <= gear.y + 4; y++) {
		for (let x = gear.x - 4; x <= gear.x + 4; x++) {
			const d = Math.hypot(x - gear.x, y - gear.y);
			const angle = Math.atan2(y - gear.y, x - gear.x);
			const tooth = Math.cos(angle * 6) > 0.1;
			if (d < 1.2) {
				continue;
			}
			if (d < 2.6 || (d < 3.7 && tooth)) {
				set(scene, x, y, goldTone(x - gear.x, y - gear.y));
			}
		}
	}
}

/**
 * The last gleams of lamplight on the rim, the crown and the lid, painted over the outline.
 * @param {Canvas} scene
 */
function drawGleams(scene) {
	for (const [x, y] of [
		[51, 21],
		[52, 22],
		[53, 23],
		[50, 20],
		[13, 22],
		[13, 23],
		[42, 6],
	]) {
		set(scene, x, y, C.white);
	}
}
