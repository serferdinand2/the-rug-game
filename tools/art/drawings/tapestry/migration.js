// Migration: a long line of travellers with bundles walking a riverside track towards far mountains, geese flying the same way.
import {
	createCanvas,
	set,
	rect,
	paint,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';
import { drawTerrain } from '../../parts/terrain.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The horizon row, and the far point where the track and the river meet it. */
const HORIZON = 29;
const VX = 46;

/**
 * Draws the Migration scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(713);

	drawSky(layer, { time: 'day', horizon: HORIZON, random });
	drawMountains(layer);
	drawTerrain(layer, { kind: 'grassland', top: HORIZON + 1, random });
	drawRiver(layer, random);
	drawTrack(layer);
	drawCopse(layer);
	drawFarWalkers(layer);

	drawTravellers(scene);
	outline(scene, C.ink);
	underlay(scene, layer);
	drawGeese(scene);
	return scene;
}

/**
 * Pale blue mountains on the horizon where the journey leads, a snowy peak above the far point.
 * @param {Canvas} layer
 */
function drawMountains(layer) {
	const far = mix(C.stoneLight, C.daySky5, 0.55);
	const farShade = mix(C.stone, C.daySky4, 0.5);
	const near = mix(C.grassShade, C.daySky4, 0.55);
	for (let x = 0; x < 64; x++) {
		const peak =
			HORIZON -
			Math.max(
				0,
				11 - Math.abs(x - 50) * 0.7,
				7 - Math.abs(x - 30) * 0.5,
				5 - Math.abs(x - 8) * 0.4
			);
		const top = Math.round(peak + Math.sin(x * 0.9) * 0.6);
		for (let y = top; y <= HORIZON; y++) {
			let colour = x > 50 || (x > 30 && x < 38) ? farShade : far;
			if (y - top < 2 && top < HORIZON - 7) {
				colour = x > 50 ? C.snowShade : C.snow;
			}
			set(layer, x, y, colour);
		}
		const hill = Math.round(HORIZON - 2 - Math.sin(x * 0.18 + 1) * 1.5);
		for (let y = hill; y <= HORIZON; y++) {
			set(layer, x, y, near);
		}
	}
}

/**
 * The river's left and right banks at one row, widening from the far point towards the viewer.
 * @param {number} y
 * @returns {[number, number]} The first and last water columns.
 */
function riverBanks(y) {
	const t = (y - HORIZON) / (63 - HORIZON);
	const centre = VX + 2 + t * 4 + Math.sin(t * 5) * 3 * t;
	const half = 0.6 + t * 19;
	return [Math.round(centre - half), Math.round(centre + half)];
}

/**
 * The river: bright where it meets the sky, deepening towards the viewer, with ripples running along its flow.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawRiver(layer, random) {
	for (let y = HORIZON + 1; y < 64; y++) {
		const [left, right] = riverBanks(y);
		const t = (y - HORIZON) / (63 - HORIZON);
		for (let x = left - 1; x <= right; x++) {
			let colour = t < 0.2 ? C.daySea1 : t < 0.55 ? C.daySea2 : C.daySea3;
			if (x === left - 1) {
				colour = C.sandLight;
			} else if (x === left) {
				colour = C.daySeaLine;
			}
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 26; i++) {
		const y = HORIZON + 3 + Math.floor(random() * (63 - HORIZON - 3));
		const [left, right] = riverBanks(y);
		const n = 2 + Math.floor(random() * 3);
		const x =
			left + 2 + Math.floor(random() * Math.max(1, right - left - n - 2));
		rect(layer, x, y, n, 1, y < 44 ? C.dayWave : C.dayWaveDeep);
	}
	// Reeds along the near bank.
	for (const [x, y] of [
		[41, 40],
		[37, 46],
		[38, 46],
		[31, 55],
		[30, 56],
		[32, 54],
	]) {
		set(layer, x, y, C.grassShade);
		set(layer, x, y - 1, C.grass);
	}
}

/**
 * The track's middle column at one row, running from the bottom left to the far point.
 * @param {number} y
 * @returns {number}
 */
function trackCentre(y) {
	const t = (y - HORIZON) / (63 - HORIZON);
	return Math.round(VX - 2 - t * 30 + Math.sin(t * 4) * 2);
}

/**
 * The trodden earth track between the grass and the river.
 * @param {Canvas} layer
 */
function drawTrack(layer) {
	for (let y = HORIZON + 1; y < 64; y++) {
		const t = (y - HORIZON) / (63 - HORIZON);
		const half = 0.5 + t * 6;
		const centre = trackCentre(y);
		for (
			let x = Math.round(centre - half);
			x <= Math.round(centre + half);
			x++
		) {
			const colour =
				(x + y * 3) % 7 === 0
					? C.sandShade
					: y % 5 === 0 && x % 3 === 0
						? C.sandLight
						: C.sand;
			set(layer, x, y, colour);
		}
	}
}

/**
 * The furthest travellers, tiny specks on the track where it meets the far hills.
 * @param {Canvas} layer
 */
function drawFarWalkers(layer) {
	for (const [x, y, h] of [
		[44, 30, 1],
		[42, 32, 2],
	]) {
		for (let j = 0; j < h; j++) {
			set(layer, x, y - j, j === h - 1 ? C.skinShade : C.wood);
		}
		set(layer, x - 1, y - h + 2, C.timberLight);
	}
}

/**
 * A copse of round trees on the far left, the land the travellers have left behind.
 * @param {Canvas} layer
 */
function drawCopse(layer) {
	const leaf = mix(C.pine, C.daySky4, 0.25);
	const leafLight = mix(C.pineLight, C.daySky4, 0.25);
	const leafShade = mix(C.pineShade, C.daySky4, 0.25);
	for (const [cx, cy, r] of [
		[3, 31, 3],
		[8, 30, 4],
		[13, 32, 3],
		[17, 33, 2],
	]) {
		for (let y = cy - r; y <= cy + r; y++) {
			for (let x = cx - r; x <= cx + r; x++) {
				if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r + 1) {
					const colour =
						x - cx < -r / 3 && y < cy
							? leafLight
							: x > cx || y > cy + 1
								? leafShade
								: leaf;
					set(layer, x, y, colour);
				}
			}
		}
		set(layer, cx, cy + r + 1, C.wood);
	}
}

/** The colours shared by the travellers' sprites. */
const KEYS = {
	H: C.wood,
	S: C.skin,
	s: C.skinShade,
	e: C.wood,
	L: C.roofShade,
	F: C.wood,
	T: C.timberLight,
};

/**
 * The line of travellers, from the furthest to the nearest, each smaller as the track nears the far point.
 * @param {Canvas} scene
 */
function drawTravellers(scene) {
	// Two small walkers far down the track.
	paint(scene, 39, 31, ['.H.', 'BSS', 'BCC', 'L.L'], {
		...KEYS,
		B: C.cream,
		C: C.brickRed,
	});
	paint(scene, 36, 32, ['.H.', 'BSS', 'BCC', 'BCC', '.L.', 'L.L'], {
		...KEYS,
		B: C.creamShade,
		C: C.amber,
	});
	// A man with a sack on his back.
	paint(
		scene,
		30,
		35,
		[
			'...HH.',
			'BB.SS.',
			'BBBCC.',
			'BBBCCS',
			'BBBCC.',
			'.BBCC.',
			'..CCC.',
			'..L.L.',
			'..L.L.',
			'.L...L',
		],
		{ ...KEYS, B: C.timberLight, C: C.daySea2 }
	);
	// A mother with a bundle on her head, holding her child's hand.
	paint(
		scene,
		21,
		39,
		[
			'.bBBBb...',
			'.BBBBB...',
			'..HSSs...',
			'..HSSS...',
			'...Ss....',
			'..CCCC...',
			'.CCCCCC..',
			'.CCCCCSS.',
			'.CCCCC...',
			'.CCCCCC..',
			'.CCCCCC..',
			'.CCCCCC..',
			'..L..L...',
			'..L...L..',
		],
		{ ...KEYS, B: C.amber, b: C.gold, C: C.roofLight }
	);
	paint(
		scene,
		29,
		45,
		['.HH.', 'HSS.', '.Ss.', 'SCCC', '.CCC', '.CCC', '.L.L', 'L..L'],
		{ ...KEYS, C: C.brickRedLight }
	);
	// The nearest: a man in a wide hat, bent under a great pack with a blanket roll, his staff planted ahead.
	paint(
		scene,
		6,
		42,
		[
			'.........hh..T',
			'..RRRR..hhhh.T',
			'.RRrRRRbbbbbbT',
			'.RRrRRR.HSSS.T',
			'..PPPP..HSeSST',
			'.PPPPPP..SSs.T',
			'.PPPPPP..Ss..T',
			'.PPPPPP.CCC..T',
			'.PPPPPPCCCC..T',
			'.PPppPPCCCCC.T',
			'.PPPPPPCCCSSST',
			'.PPPPPPCCCC..T',
			'.PPPPPPCCCC..T',
			'..PPPPPcccc..T',
			'...CCCCCCCC..T',
			'...CCCCCCCC..T',
			'....CCCCCC...T',
			'....LL..LL...T',
			'...LL....LL..T',
			'...LL.....LL.T',
			'..FFF.....FFFT',
		],
		{
			...KEYS,
			R: C.brickRed,
			r: C.brickRedLight,
			P: C.timberLight,
			p: C.timber,
			h: C.sandShade,
			b: C.sand,
			C: C.pine,
			c: C.wood,
		}
	);
}

/**
 * A skein of geese in a V, flying ahead of the travellers towards the mountains.
 * @param {Canvas} scene
 */
function drawGeese(scene) {
	const goose = ['k....', '.k.kk', '..kk.'];
	for (const [x, y] of [
		[50, 9],
		[45, 6],
		[40, 3],
		[35, 0],
		[45, 12],
		[40, 15],
		[35, 18],
	]) {
		paint(scene, x, y, goose, { k: C.wood });
	}
}
