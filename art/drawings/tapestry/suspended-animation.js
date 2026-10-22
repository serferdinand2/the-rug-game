// Suspended Animation: seen from above, a sleeper lies with closed eyes under the frosted lid of a cryo pod in an icy vault, more pods glowing dimly behind.
import {
	createCanvas,
	get,
	set,
	rect,
	paint,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The pod's centre line (between two columns), its shell's top row and sides, and the corner radius of its head end. */
const CX = 31.5;
const POD = { top: 15, left: 4, right: 59, radius: 14 };

/** The lid's glass, set inside the shell's rim. */
const LID = { top: 19, left: 8, right: 55, radius: 10 };

/** The clear patch of glass over the face: its centre and radii. */
const CLEAR = { x: 31.5, y: 29, rx: 10, ry: 11 };

/** The vault's ice colours, from the palette's pale sky blues, snow and the deep night sea. */
const ICE = {
	white: C.white,
	snow: C.snow,
	pale: C.cloudShade,
	frost: C.snowShade,
	blue: C.daySky5,
	mid: C.daySky4,
	deep: C.nightSea2,
	dark: mix(C.nightSea3, C.nightSky1, 0.5),
};

/**
 * The sleeper's head on the pillow, seen from above: face up, eyes closed, hair spread round it.
 * H hair, h hair frosted, S skin, s skin shade, b brow, e closed eye, n nose shade, m mouth.
 */
const HEAD = [
	'....HHHHHH....',
	'..HHHHHHHHHH..',
	'.HHHhHHHHHhHH.',
	'.HHHHSSSSHHHH.',
	'HHHSSSSSSSSHHH',
	'HHSSbbSSbbSSHH',
	'HHSSSSSSSSSSHH',
	'HhSeeeSSeeeShH',
	'HHSSSSSSSSSSHH',
	'.HSSSSnSSSSSH.',
	'.HSSSSnnSSSSH.',
	'..SSSSSSSSSS..',
	'..SSSmmmmSSS..',
	'...SSSSSSSS...',
	'....ssssss....',
	'.....ssss.....',
];

/**
 * The sleeper's body under the lid: shoulders in a pale suit, arms folded on the chest.
 * U suit, u suit shade, c collar seam, a sleeve, S hand.
 */
const BODY = [
	'......UUUccUUUU.......',
	'...UUUUUUUcUUUUUUUu...',
	'.UUUUUUUUUcUUUUUUUUuu.',
	'UUUUUUUUUUcUUUUUUUUUuu',
	'UUUUUUUUUUcUUUUUUUUUuu',
	'UUUUUUUUUUcUUUUUUUUUuu',
	'UUUUaaaaaaaaaaaaaSSUuu',
	'UUSSaaaaaaaaaaaaaaaUuu',
	'UUUUUUUUUUcUUUUUUUUUuu',
	'UUUUUUUUUUcUUUUUUUUUuu',
	'UUUUUUUUUUcUUUUUUUUUuu',
	'UUUUUUUUUUcUUUUUUUUUuu',
	'UUUUUUUUUUcUUUUUUUUUuu',
	'UUUUUUUUUUcUUUUUUUUUuu',
	'UUUUUUUUUUcUUUUUUUUUuu',
	'UUUUUUUUUUcUUUUUUUUUuu',
	'UUUUUUUUUUcUUUUUUUUUuu',
];

/** A star of ice crystal. w ice. */
const CRYSTAL = ['w.w.w', '.www.', 'wwwww', '.www.', 'w.w.w'];

/**
 * Draws the Suspended Animation scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(733);

	drawVault(layer, random);

	// The far pods stand behind the main one, so they get their own outline, then sink into the dark.
	const far = createCanvas(64, 64);
	drawFarPod(far, 1, 18);
	drawFarPod(far, 23, 40);
	drawFarPod(far, 45, 62);
	outline(far, C.ink);
	dim(far);
	underlay(far, layer);
	glow(far, {
		x: 32,
		y: 40,
		radius: 40,
		colour: ICE.blue,
		strength: 0.3,
		steps: 4,
	});

	drawShell(scene);
	drawInside(scene);
	outline(scene, C.ink);
	underlay(scene, far);
	drawFrost(scene, random);
	drawRime(scene, random);
	drawCrystals(scene);
	drawMist(scene);
	return scene;
}

/**
 * The vault's floor seen from above: dark steel plates with icy seams, frost patches and blue light strips.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawVault(layer, random) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = ICE.dark;
			if (y % 8 === 0 || x % 10 === 0) {
				colour = mix(ICE.dark, ICE.deep, 0.5);
			}
			set(layer, x, y, colour);
		}
	}
	// Light strips set in the floor along the pod's sides.
	for (let y = 12; y < 64; y++) {
		set(layer, 1, y, ICE.blue);
		set(layer, 62, y, ICE.blue);
	}
	for (let i = 0; i < 40; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.floor(random() * 64);
		set(layer, x, y, mix(ICE.dark, ICE.frost, 0.35));
	}
}

/**
 * A far pod in the row behind, its foot end towards the viewer and its head running out of the top of the scene:
 * a frosted lid in a white rim, with a blue light at its foot.
 * @param {Canvas} canvas
 * @param {number} left - Its first column
 * @param {number} right - Its last column
 */
function drawFarPod(canvas, left, right) {
	const bottom = 11;
	const radius = 5;
	for (let y = 0; y <= bottom; y++) {
		for (let x = left; x <= right; x++) {
			const cx = Math.min(right - radius, Math.max(left + radius, x));
			const cy = bottom - radius;
			if (y > cy && Math.hypot(x - cx, y - cy) > radius + 0.3) {
				continue;
			}
			const inner =
				x > left + 1 &&
				x < right - 1 &&
				(y <= cy - 2 || Math.hypot(x - cx, y - cy) <= radius - 1.7);
			let colour = inner ? ICE.blue : ICE.snow;
			if (inner && (x + y) % 3 === 0) {
				colour = ICE.pale;
			}
			set(canvas, x, y, colour);
		}
	}
	rect(
		canvas,
		Math.floor((left + right) / 2) - 1,
		bottom - 1,
		3,
		1,
		ICE.white
	);
}

/**
 * Sinks the far pods into the vault's dark.
 * @param {Canvas} canvas
 */
function dim(canvas) {
	for (let i = 0; i < canvas.p.length; i++) {
		const colour = canvas.p[i];
		if (colour) {
			canvas.p[i] = mix(colour, ICE.dark, 0.5);
		}
	}
}

/**
 * Whether a pixel lies inside a capsule with rounded corners at its head end, running off the bottom of the scene.
 * @param {number} x
 * @param {number} y
 * @param {{ top: number, left: number, right: number, radius: number }} box
 * @returns {boolean}
 */
function inCapsule(x, y, { top, left, right, radius }) {
	if (x < left || x > right || y < top) {
		return false;
	}
	const cy = top + radius;
	if (y >= cy) {
		return true;
	}
	const cx =
		x < left + radius
			? left + radius
			: x > right - radius
				? right - radius
				: x;
	return Math.hypot(x - cx, y - cy) <= radius + 0.3;
}

/**
 * The pod's white shell round the lid: lit on the left, shaded on the right, with hinges and a blue light at its head.
 * @param {Canvas} canvas
 */
function drawShell(canvas) {
	for (let y = POD.top; y < 64; y++) {
		for (let x = POD.left; x <= POD.right; x++) {
			if (!inCapsule(x, y, POD) || inCapsule(x, y, LID)) {
				continue;
			}
			let colour = ICE.snow;
			if (x <= POD.left + 1 || y <= POD.top + 1) {
				colour = ICE.white;
			} else if (x >= POD.right - 1) {
				colour = ICE.frost;
			} else if (x >= CX + 18) {
				colour = ICE.pale;
			}
			set(canvas, x, y, colour);
		}
	}
	// Hinges down both sides, and the head lamp.
	for (const y of [34, 50]) {
		rect(canvas, POD.left + 1, y, 2, 3, ICE.mid);
		rect(canvas, POD.right - 2, y, 2, 3, ICE.mid);
	}
	rect(canvas, 29, POD.top + 1, 6, 2, ICE.blue);
	rect(canvas, 30, POD.top + 1, 4, 1, C.white);
}

/**
 * Everything under the lid: the pale blue lining, the pillow and the sleeper, who alone is outlined dark to read through the glass.
 * @param {Canvas} canvas
 */
function drawInside(canvas) {
	const inside = createCanvas(64, 64);
	const skin = mix(C.skin, C.daySky6, 0.2);
	paint(inside, 21, 41, BODY, {
		U: mix(C.white, C.daySky5, 0.35),
		u: ICE.mid,
		c: ICE.mid,
		a: mix(ICE.blue, ICE.mid, 0.5),
		S: skin,
	});
	paint(inside, 25, 21, HEAD, {
		H: C.timberShade,
		h: ICE.frost,
		S: skin,
		s: mix(C.skinShade, C.daySky4, 0.25),
		b: C.timberShade,
		e: C.wood,
		n: mix(C.skinShade, C.daySky4, 0.25),
		m: mix(C.skinShade, C.brickRedShade, 0.45),
	});
	outline(inside, ICE.deep);
	for (let y = LID.top; y < 64; y++) {
		for (let x = LID.left; x <= LID.right; x++) {
			if (inCapsule(x, y, LID)) {
				const own = get(inside, x, y);
				set(
					canvas,
					x,
					y,
					own ?? ((x + y) % 4 === 0 ? ICE.mid : ICE.blue)
				);
			}
		}
	}
}

/**
 * How far a pixel lies from the clear patch over the face: below 1 inside it.
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function fromFace(x, y) {
	return Math.hypot((x - CLEAR.x) / CLEAR.rx, (y - CLEAR.y) / CLEAR.ry);
}

/**
 * Frost on the lid: a milky film thickening away from the face and towards the foot, with scattered specks.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawFrost(scene, random) {
	for (let y = LID.top; y < 64; y++) {
		for (let x = LID.left; x <= LID.right; x++) {
			const d = fromFace(x, y);
			if (!inCapsule(x, y, LID) || d < 1) {
				continue;
			}
			const behind = /** @type {Colour} */ (get(scene, x, y));
			const thickness = Math.min(
				0.8,
				(d - 1) * 0.35 + (y > 52 ? 0.25 : 0)
			);
			const band = Math.round(thickness * 4) / 4;
			let colour = mix(behind, ICE.white, band);
			if (random() < 0.08) {
				colour = ICE.white;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * Rime on the lid's edges: a ragged white crust where the glass meets the shell.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawRime(scene, random) {
	for (let y = LID.top; y < 64; y++) {
		for (let x = LID.left; x <= LID.right; x++) {
			if (!inCapsule(x, y, LID)) {
				continue;
			}
			const edge = [-2, -1, 1, 2].some(
				(d) => !inCapsule(x + d, y, LID) || !inCapsule(x, y + d, LID)
			);
			const rim = [-1, 1].some(
				(d) => !inCapsule(x + d, y, LID) || !inCapsule(x, y + d, LID)
			);
			if (rim || (edge && random() < 0.55)) {
				set(scene, x, y, rim ? ICE.white : ICE.snow);
			}
		}
	}
}

/**
 * Star-shaped ice crystals grown on the lid, clear of the face.
 * @param {Canvas} scene
 */
function drawCrystals(scene) {
	for (const [x, y] of [
		[11, 24],
		[47, 27],
		[13, 46],
		[45, 51],
		[29, 56],
	]) {
		paint(scene, x, y, CRYSTAL, { w: ICE.white });
	}
}

/**
 * Cold mist breathing out of the pod's seams and drifting over the floor.
 * @param {Canvas} scene
 */
function drawMist(scene) {
	for (let y = 10; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const sway = Math.sin(y * 0.5) * 1.5;
			const left = Math.abs(x - (POD.left - 1) - sway);
			const right = Math.abs(x - (POD.right + 1) + sway);
			const d = Math.min(left, right);
			const reach = 1.5 + (y > 20 ? 1 : 0);
			if (d < reach && (x + y) % 3 !== 0) {
				const behind = /** @type {Colour} */ (get(scene, x, y));
				set(scene, x, y, mix(behind, ICE.pale, d < 1 ? 0.4 : 0.2));
			}
		}
	}
}
