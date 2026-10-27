// Dream Monitors: a sleeper in bed wearing a wired headset, the machine beside her showing her dream of a whale swimming through the clouds.
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
import { drawInterior } from '../../parts/interior.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The floor's first row, the sleeper's face centre, and the screen's box (inside its bezel). */
const FLOOR = 52;
const FACE = { x: 16, y: 39 };
const SCREEN = { x: 37, y: 8, w: 22, h: 21 };

/** The night room's cold blue, and the screen's colours, which the glow leaves alone. */
const COLD = mix(C.nightSea3, C.ink, 0.35);
const DREAM = {
	top: mix(C.arcaneShade, C.nightSea2, 0.4),
	mid: mix(C.arcane, C.teal, 0.45),
	low: mix(C.tealLight, C.arcaneLight, 0.35),
	scan: mix(C.arcaneShade, C.nightSea3, 0.55),
};

/**
 * Draws the Dream Monitors scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(9307);

	drawInterior(layer, {
		floor: FLOOR,
		random,
		wall: 'plaster',
		window: { x: 4, y: 4, w: 13, h: 13, time: 'night' },
	});
	chillRoom(layer);

	drawBed(scene);
	drawSleeper(scene);
	drawConsole(scene);
	drawWires(scene);
	outline(scene, C.ink);
	underlay(scene, layer);
	const lit = scene.p.slice();
	glow(scene, {
		x: SCREEN.x + 10,
		y: SCREEN.y + 12,
		radius: 34,
		colour: C.teal,
		strength: 0.35,
		steps: 4,
		skip: [C.ink],
	});
	keepScreen(scene, lit);
	drawDream(scene, random);
	drawSensors(scene);
	drawLights(scene);
	return scene;
}

/**
 * Cools the room to a dim night blue, leaving the panes of the window as they are.
 * @param {Canvas} layer
 */
function chillRoom(layer) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const pane =
				x > 4 && x < 16 && y > 4 && y < 16 && x !== 10 && y !== 10;
			const colour = get(layer, x, y);
			if (colour && !pane) {
				set(layer, x, y, mix(colour, COLD, 0.78));
			}
		}
	}
}

/**
 * The bed against the back wall: a wooden headboard, a white pillow and a red quilt pulled up to the chin.
 * @param {Canvas} scene
 */
function drawBed(scene) {
	// The headboard, with a rounded top.
	for (let y = 30; y < 44; y++) {
		for (let x = 3; x <= 29; x++) {
			if (y < 33 && Math.abs(x - 16) > 13 - (33 - y) * 3) {
				continue;
			}
			const colour =
				x === 3 || y === 30
					? C.timberLight
					: x >= 28
						? C.timberShade
						: (x - 3) % 6 === 0
							? C.timberShade
							: C.timber;
			set(scene, x, y, colour);
		}
	}
	// The pillow.
	for (let y = 37; y <= 43; y++) {
		for (let x = 6; x <= 26; x++) {
			if ((y === 37 || y === 43) && (x < 8 || x > 24)) {
				continue;
			}
			set(scene, x, y, y < 39 ? C.white : C.creamLight);
		}
	}
	// The quilt, its turned-down sheet, and the side falling to the floor.
	for (let y = 43; y <= 58; y++) {
		for (let x = 1; x <= 31; x++) {
			let colour =
				(x + Math.floor((y - 43) / 4) * 4) % 8 < 4
					? C.brickRed
					: C.brickRedLight;
			if (y <= 44) {
				colour = y === 43 ? C.white : C.cream;
			} else if (y >= 56) {
				colour = C.brickRedShade;
			} else if ((y - 45) % 4 === 3) {
				colour = C.brickRedShade;
			}
			set(scene, x, y, colour);
		}
	}
	// A wooden foot under the quilt.
	rect(scene, 2, 59, 3, 4, C.timberShade);
	rect(scene, 27, 59, 3, 4, C.timberShade);
}

/**
 * The sleeper's face on the pillow, eyes closed, wearing a metal headset studded with teal sensors.
 * @param {Canvas} scene
 */
function drawSleeper(scene) {
	paint(
		scene,
		FACE.x - 5,
		FACE.y - 6,
		[
			'...mmmmm...',
			'..mHHHHHm..',
			'.mHHHHHHHm.',
			'.HHSSSSSHH.',
			'.HSSSSSSSH.',
			'.HSkkSkkSH.',
			'.HSSSSSSSH.',
			'.HSSSsSSSH.',
			'..SSSSSSS..',
			'...SsssS...',
		],
		{
			m: C.stoneLight,
			H: C.timberShade,
			S: C.skin,
			s: C.skinShade,
			k: C.skinShade,
		}
	);
}

/**
 * The dream machine: a tall metal cabinet with a large screen, dials, a row of lamps and a small scope.
 * @param {Canvas} scene
 */
function drawConsole(scene) {
	const left = 34;
	const right = 61;
	for (let y = 4; y <= 55; y++) {
		for (let x = left; x <= right; x++) {
			let colour = C.stone;
			if (x === left || y === 4) {
				colour = C.stoneLight;
			} else if (x >= right - 1) {
				colour = C.stoneShade;
			} else if (y === 32 || y === 33) {
				colour = y === 32 ? C.stoneShade : C.stoneLight;
			}
			set(scene, x, y, colour);
		}
	}
	// The screen's dark bezel; the screen itself is painted after the glow.
	rect(
		scene,
		SCREEN.x - 1,
		SCREEN.y - 1,
		SCREEN.w + 2,
		SCREEN.h + 2,
		C.night
	);
	rect(scene, SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h, DREAM.mid);
	// Three dials.
	for (const cx of [39, 46, 53]) {
		paint(
			scene,
			cx - 2,
			36,
			['.www.', 'wwwww', 'wwkww', 'wwwww', '.www.'],
			{ w: C.creamLight, k: C.ink }
		);
	}
	// The scope's dark glass.
	rect(scene, 37, 45, 20, 7, C.night);
	// Feet.
	rect(scene, left + 1, 56, 3, 3, C.stoneShade);
	rect(scene, right - 3, 56, 3, 3, C.stoneShade);
}

/**
 * Keeps the screen's own pixels as they were before the glow, so the dream stays sharp.
 * @param {Canvas} scene
 * @param {(string | null)[]} lit - The scene's pixels before the glow
 */
function keepScreen(scene, lit) {
	for (let y = SCREEN.y - 1; y <= SCREEN.y + SCREEN.h; y++) {
		for (let x = SCREEN.x - 1; x <= SCREEN.x + SCREEN.w; x++) {
			scene.p[y * 64 + x] = lit[y * 64 + x];
		}
	}
}

/**
 * The dream on the screen: a whale swimming through a violet sky above a bank of clouds, with stars, on faint scan lines.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawDream(scene, random) {
	const { x: sx, y: sy, w, h } = SCREEN;
	for (let j = 0; j < h; j++) {
		const t = j / (h - 1);
		const band = t < 0.35 ? DREAM.top : t < 0.7 ? DREAM.mid : DREAM.low;
		for (let i = 0; i < w; i++) {
			set(
				scene,
				sx + i,
				sy + j,
				j % 3 === 2 ? mix(band, DREAM.scan, 0.3) : band
			);
		}
	}
	for (let i = 0; i < 6; i++) {
		set(
			scene,
			sx + 1 + Math.floor(random() * (w - 2)),
			sy + 1 + Math.floor(random() * 5),
			C.white
		);
	}
	// The cloud bank along the bottom.
	for (let i = 0; i < w; i++) {
		const top = sy + h - 4 - Math.round(1.5 + Math.sin(i * 0.7) * 1.5);
		for (let y = top; y < sy + h; y++) {
			set(scene, sx + i, y, y === top ? C.white : C.ghostLight);
		}
	}
	// The whale, swimming left, blowing a spout.
	paint(
		scene,
		sx + 2,
		sy + 4,
		[
			'...s.s............',
			'....s.............',
			'....kkkkkkk.......',
			'..kkwwwwwwwkk...kk',
			'.kwwwwwwwwwwwk.kwk',
			'kwewwwwwwwwwwwkwk.',
			'kwwwwwwwwwwwwwwk..',
			'kbbbbbbbwwwwwwk...',
			'.kbbbbbbbbwwkk....',
			'..kkkkkkkkkk......',
		],
		{
			k: C.nightSea3,
			w: C.nightWaveDeep,
			b: C.foam,
			e: C.ink,
			s: C.white,
		}
	);
}

/**
 * Two cables from the headset to the side of the machine: one looping high over the bed, one sagging low beside the pillow.
 * Drawn before the outline pass, so each gets an ink edge.
 * @param {Canvas} scene
 */
function drawWires(scene) {
	for (const [
		colour,
		x0,
		cx,
		cy,
		y1,
	] of /** @type {[string, number, number, number, number][]} */ ([
		[C.stoneLight, FACE.x - 3, 18, 8, 27],
		[C.brickRedLight, FACE.x + 3, 27, 38, 39],
	])) {
		const y0 = FACE.y - 7;
		const x1 = 33;
		for (let t = 0; t <= 1; t += 0.01) {
			const x = Math.round(
				(1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1
			);
			const y = Math.round(
				(1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y1
			);
			set(scene, x, y, colour);
		}
	}
}

/**
 * The headset's sensors, lit teal.
 * @param {Canvas} scene
 */
function drawSensors(scene) {
	for (const x of [FACE.x - 3, FACE.x, FACE.x + 3]) {
		set(scene, x, FACE.y - 6, C.tealLight);
	}
}

/**
 * Lamps on the console blinking in a row, the needles on the dials, and the wave on the scope.
 * @param {Canvas} scene
 */
function drawLights(scene) {
	[
		C.brickRedLight,
		C.gold,
		C.tealLight,
		C.tealLight,
		C.gold,
		C.ghost,
	].forEach((colour, i) => {
		set(scene, 38 + i * 3, 43, colour);
		set(scene, 39 + i * 3, 43, mix(colour, C.stone, 0.5));
	});
	for (const [x, y] of [
		[38, 37],
		[47, 37],
		[52, 38],
	]) {
		set(scene, x, y, C.brickRed);
	}
	// The trace of the sleeping mind's waves on a small green scope.
	for (let x = 38; x <= 55; x++) {
		const wave = Math.sin(x * 0.9) * (x % 9 < 4 ? 2 : 1);
		set(scene, x, 48 + Math.round(wave), C.tealLight);
	}
}
