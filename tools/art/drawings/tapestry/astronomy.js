// Astronomy: a domed observatory on a snowy summit, its brass telescope trained on a comet streaking across the stars.
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
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The last sky row, the dome's centre column, base row and radius, and the comet's head. */
const HORIZON = 46;
const DOME = { x: 22, y: 35, r: 16 };
const COMET = { x: 53, y: 11 };

/** The telescope tube: where it leaves the slit and where its mouth ends. */
const TUBE = { x0: 26, y0: 27, x1: 45, y1: 15 };

/** A cold, clear blue that the night sky is tinted towards, so this sky differs from the purple nights. */
const COLD = mix(C.nightSea3, C.ink, 0.35);

/**
 * Draws the Astronomy scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(211);

	drawSky(layer, {
		time: 'night',
		horizon: HORIZON,
		random,
		stars: 64,
		starRows: 40,
		sparkles: [
			[8, 30],
			[58, 34],
			[30, 6],
		],
	});
	tintSky(layer);
	drawComet(layer);
	glow(layer, {
		x: COMET.x,
		y: COMET.y,
		radius: 7,
		colour: C.foam,
		strength: 0.35,
	});
	drawRange(layer);
	drawSummit(layer, random);

	drawDrum(scene);
	drawDome(scene);
	drawTelescope(scene);
	outline(scene, C.ink);
	underlay(scene, layer);
	drawLights(scene);
	drawCometHead(scene);
	return scene;
}

/**
 * Cools the night sky towards a clear blue, more strongly near the horizon.
 * @param {Canvas} layer
 */
function tintSky(layer) {
	for (let y = 0; y <= HORIZON; y++) {
		for (let x = 0; x < 64; x++) {
			const colour = get(layer, x, y);
			if (colour && colour !== C.white && colour !== C.starDim) {
				set(layer, x, y, mix(colour, COLD, 0.25 + (y / HORIZON) * 0.2));
			}
		}
	}
}

/**
 * The comet's tail: a fan of pale light streaming up and to the left from the head, fading and widening as it goes.
 * @param {Canvas} layer
 */
function drawComet(layer) {
	// The tail's direction, from the head towards its far end.
	const dx = -0.94;
	const dy = -0.34;
	const length = 48;
	for (let y = 0; y <= HORIZON; y++) {
		for (let x = 0; x < 64; x++) {
			const rx = x - COMET.x;
			const ry = y - COMET.y;
			const along = rx * dx + ry * dy;
			const across = Math.abs(rx * -dy + ry * dx);
			const width = 1.2 + along * 0.15;
			if (along < 0 || along > length || across > width) {
				continue;
			}
			const fade = 1 - along / length;
			const core = 1 - across / width;
			const level = Math.ceil(fade * (0.4 + core * 0.6) * 4);
			const behind = get(layer, x, y);
			if (!behind || level < 2) {
				continue;
			}
			const colour =
				level >= 4 ? C.white : level === 3 ? C.foam : C.nightWave;
			set(layer, x, y, mix(behind, colour, 0.3 + level * 0.15));
		}
	}
}

/**
 * A far range of snowy peaks around the summit, their right faces catching the comet's light.
 * @param {Canvas} layer
 */
function drawRange(layer) {
	const rock = mix(C.headland, COLD, 0.4);
	const rockLit = mix(C.headlandRidge, COLD, 0.15);
	const snowLit = mix(C.snowShade, C.nightSky6, 0.12);
	const snowShade = mix(C.snowShade, C.nightSky5, 0.55);
	const peaks = [
		[3, 33],
		[17, 38],
		[44, 30],
		[56, 36],
		[64, 31],
	];
	for (let x = 0; x < 64; x++) {
		let top = HORIZON + 4;
		let peak = peaks[0];
		for (const p of peaks) {
			const height = p[1] + Math.abs(x - p[0]) * 1.1;
			if (height < top) {
				top = height;
				peak = p;
			}
		}
		top = Math.round(top);
		const lit = x >= peak[0];
		const cap = Math.max(0, Math.round((40 - top) * 0.7));
		for (let y = top; y < 64; y++) {
			let colour = lit ? rockLit : rock;
			if (y - top < cap) {
				colour = lit ? snowLit : snowShade;
			} else if (y - top === cap && (x + y) % 2 === 0 && cap > 0) {
				colour = lit ? snowLit : snowShade;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The snowy summit the observatory stands on, sloping away to the right, with dark rocks breaking the snow.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawSummit(layer, random) {
	const lit = mix(C.snow, C.starDim, 0.35);
	const snow = mix(C.snowShade, C.nightSky6, 0.35);
	const shade = mix(C.snowShade, C.nightSky4, 0.6);
	const rock = mix(C.stoneShade, C.nightSky2, 0.4);
	for (let x = 0; x < 64; x++) {
		const top = Math.round(
			49 + Math.max(0, x - 36) * 0.32 + Math.sin(x * 0.5) * 0.6
		);
		for (let y = top; y < 64; y++) {
			const t = (y - top) / (64 - top);
			let colour = y === top ? lit : snow;
			if (t > 0.6 || (t > 0.35 && (x + y) % 2 === 0)) {
				colour = shade;
			}
			set(layer, x, y, colour);
		}
	}
	// Wind-blown drifts catching the starlight.
	for (let i = 0; i < 9; i++) {
		const x = Math.floor(random() * 58);
		const y = 53 + Math.floor(random() * 8);
		rect(layer, x, y, 3 + Math.floor(random() * 3), 1, lit);
	}
	// Dark rocks breaking through the snow.
	for (let i = 0; i < 6; i++) {
		const x = Math.floor(random() * 60);
		const y = 55 + Math.floor(random() * 7);
		rect(layer, x, y, 3, 1, rock);
		set(layer, x + 1, y - 1, rock);
	}
}

/**
 * The observatory's round stone drum under the dome, with an arched door and two small windows.
 * @param {Canvas} scene
 */
function drawDrum(scene) {
	const left = DOME.x - DOME.r + 2;
	const right = DOME.x + DOME.r - 2;
	for (let y = DOME.y + 1; y <= 50; y++) {
		for (let x = left; x <= right; x++) {
			const u = (x - left) / (right - left);
			let colour = C.stone;
			if (u > 0.7) {
				colour = C.stoneLight;
			} else if (u < 0.15) {
				colour = C.stoneShade;
			} else if (u < 0.3) {
				colour = C.stoneMid;
			}
			// The courses curve round the drum.
			const bow = Math.round(1.6 * (1 - (2 * u - 1) ** 2));
			if ((y - DOME.y - bow) % 4 === 0 && u > 0.1 && u < 0.92) {
				colour = colour === C.stoneLight ? C.stone : C.stoneMid;
			}
			set(scene, x, y, colour);
		}
	}
	// The cornice the dome turns on.
	rect(scene, left - 1, DOME.y + 1, right - left + 3, 1, C.stoneLight);
	rect(scene, left - 1, DOME.y + 2, right - left + 3, 1, C.stoneShade);
	// The arched door, open and lit.
	for (let y = 41; y <= 50; y++) {
		for (let x = DOME.x - 3; x <= DOME.x + 2; x++) {
			const arch = y < 43 && Math.hypot(x - DOME.x + 0.5, y - 43) > 3;
			if (!arch) {
				set(scene, x, y, y < 44 ? C.lampGlow : C.gold);
			}
		}
	}
	// Two small windows.
	rect(scene, DOME.x - 10, 41, 2, 3, C.amber);
	rect(scene, DOME.x + 9, 41, 2, 3, C.gold);
}

/**
 * The dome: a silvery half sphere lit from the comet's side, its ribs curving over it, and the open slit.
 * @param {Canvas} scene
 */
function drawDome(scene) {
	const { x: cx, y: cy, r } = DOME;
	for (let y = cy - r; y <= cy; y++) {
		for (let x = cx - r; x <= cx + r; x++) {
			const d2 = (x - cx) ** 2 + (y - cy) ** 2;
			if (d2 > r * r + r * 0.6) {
				continue;
			}
			const nx = (x - cx) / r;
			const ny = (y - cy) / r;
			const light = nx * 0.55 - ny * 0.8;
			let colour = C.stone;
			if (light > 0.85) {
				colour = C.snow;
			} else if (light > 0.55) {
				colour = C.snowShade;
			} else if (light > 0.25) {
				colour = C.stoneLight;
			} else if (light < -0.2) {
				colour = C.stoneMid;
			}
			set(scene, x, y, colour);
		}
	}
	// The ribs: meridians curving over the dome.
	for (const angle of [-1.05, -0.5, 0.95]) {
		for (let y = cy - r + 1; y <= cy; y++) {
			const spread = Math.sqrt(Math.max(0, 1 - ((cy - y) / r) ** 2));
			const x = Math.round(cx + r * spread * Math.sin(angle));
			const behind = get(scene, x, y);
			if (behind) {
				set(scene, x, y, mix(behind, C.stoneShade, 0.55));
			}
		}
	}
	// The open slit, running up over the top of the dome, dark inside.
	for (let y = cy - r; y <= cy; y++) {
		for (let x = cx + 2; x <= cx + 5; x++) {
			if (get(scene, x, y)) {
				set(scene, x, y, x === cx + 2 ? C.roofShade : C.night);
			}
		}
	}
	// A rim band where the dome meets the cornice.
	rect(scene, cx - r + 1, cy, r * 2 - 1, 1, C.stoneShade);
}

/**
 * The telescope: a brass tube leaving the slit and pointing up at the comet, with a dark dew cap and a ring.
 * @param {Canvas} scene
 */
function drawTelescope(scene) {
	const { x0, y0, x1, y1 } = TUBE;
	const length = Math.hypot(x1 - x0, y1 - y0);
	const ux = (x1 - x0) / length;
	const uy = (y1 - y0) / length;
	for (let y = y1 - 4; y <= y0 + 4; y++) {
		for (let x = x0 - 2; x <= x1 + 3; x++) {
			const rx = x - x0;
			const ry = y - y0;
			const along = rx * ux + ry * uy;
			const side = rx * -uy + ry * ux;
			const mouth = along > length - 4;
			const half = mouth ? 2.3 : 1.7;
			if (along < 0 || along > length || Math.abs(side) > half) {
				continue;
			}
			let colour = side < -0.6 ? C.gold : side > 0.8 ? C.amber : C.brass;
			if (mouth) {
				colour = side < -0.6 ? C.stone : C.stoneShade;
			} else if (Math.abs(along - length * 0.45) < 0.8) {
				colour = C.lampFrame;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * Warm light spilling from the open door and the slit, and the astronomer in the doorway, painted after the outline.
 * @param {Canvas} scene
 */
function drawLights(scene) {
	glow(scene, {
		x: DOME.x - 1,
		y: 47,
		radius: 9,
		colour: C.gold,
		strength: 0.4,
		skip: [C.ink, C.lampGlow, C.gold],
	});
	for (let y = DOME.y - 3; y <= DOME.y - 1; y++) {
		set(scene, DOME.x + 3, y, C.amber);
		set(scene, DOME.x + 4, y, C.amber);
	}
	// The astronomer, a small dark figure in the doorway, looking up.
	paint(
		scene,
		DOME.x - 2,
		44,
		['.k.', 'kkk', 'kkk', 'kkk', 'kkk', 'k.k', 'k.k'],
		{ k: C.timberShade }
	);
}

/**
 * The comet's head: a bright white core with a pale halo, painted last so nothing dims it.
 * @param {Canvas} scene
 */
function drawCometHead(scene) {
	const { x, y } = COMET;
	for (const [dx, dy] of [
		[0, -1],
		[-1, 0],
		[1, 0],
		[0, 1],
		[-1, -1],
		[-2, 0],
	]) {
		set(scene, x + dx, y + dy, C.foam);
	}
	set(scene, x, y, C.white);
	set(scene, x - 1, y, C.white);
	set(scene, x + 1, y + 1, C.starDim);
}
