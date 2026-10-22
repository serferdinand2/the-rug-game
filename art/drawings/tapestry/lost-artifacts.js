// Lost Artifacts: at dusk an explorer with a lantern finds a glowing relic on a pedestal inside a vine-covered jungle ruin.
import {
	createCanvas,
	get,
	set,
	rect,
	line,
	paint,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { glow } from '../../effects.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The horizon behind the jungle, and the ruin's floor row. */
const HORIZON = 40;
const FLOOR = 50;

/** The gate: its two pillars, the lintel's top row, and the relic's centre. */
const GATE = { left: 14, right: 50, pillar: 8, lintel: 8 };
const RELIC = { x: 32, y: 30 };

/** Old stone, warmed by the dusk and greened by moss. */
const STONE_LIGHT = mix(C.stoneLight, C.duskSky6, 0.18);
const STONE = mix(C.stone, C.duskSky4, 0.15);
const STONE_SHADE = mix(C.stoneShade, C.duskSky2, 0.25);
const MOSS = mix(C.forestFloorLight, C.stone, 0.25);

/** Jungle greens, darkened by the dusk. */
const JUNGLE_FAR = mix(C.pineShade, C.duskSky2, 0.45);
const LEAF_LIGHT = mix(C.forestFloorLight, C.duskSky5, 0.15);
const LEAF = mix(C.pine, C.duskSky2, 0.2);
const LEAF_SHADE = mix(C.pineShade, C.duskSky1, 0.35);

/**
 * Draws the Lost Artifacts scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(4404);

	drawSky(layer, { time: 'dusk', horizon: HORIZON, random });
	drawJungle(layer, random);
	drawFloor(layer);

	// The gate stands behind the explorer and the leaves, so it gets its own outline.
	const ruin = createCanvas(64, 64);
	drawGate(ruin);
	drawPedestal(ruin);
	outline(ruin, C.ink);
	underlay(ruin, layer);
	drawVines(ruin, random);
	drawRelic(ruin);

	drawExplorer(scene, 2, 36);
	drawFronds(scene);
	outline(scene, C.ink);
	underlay(scene, ruin);
	drawLantern(scene);
	return scene;
}

/**
 * The jungle canopy behind the ruin: dark rounded crowns and two palms against the dusk.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawJungle(layer, random) {
	for (let x = 0; x < 64; x++) {
		const top = Math.round(
			HORIZON - 8 - Math.abs(Math.sin(x * 0.3 + 1.2)) * 6 - random() * 1.5
		);
		for (let y = top; y <= HORIZON + 10; y++) {
			set(
				layer,
				x,
				y,
				y === top ? mix(JUNGLE_FAR, C.duskSky5, 0.3) : JUNGLE_FAR
			);
		}
	}
	for (const [px, top, lean] of [
		[6, 15, -1],
		[57, 19, 1],
	]) {
		// The trunk, curving as it rises.
		for (let y = top; y < HORIZON; y++) {
			const bend = Math.round(((HORIZON - y) / (HORIZON - top)) ** 2 * 3);
			set(layer, px - lean * bend, y, LEAF_SHADE);
			set(layer, px - lean * bend + 1, y, LEAF_SHADE);
		}
		const cx = px - lean * 3;
		// Drooping fronds all round the crown.
		for (const [dir, rise, reach] of [
			[-1, 2, 7],
			[1, 2, 7],
			[-1, -1, 6],
			[1, -1, 6],
			[-1, 4, 4],
			[1, 4, 4],
		]) {
			for (let i = 0; i <= reach; i++) {
				const y = top - rise + Math.round((i * i) / 6);
				set(layer, cx + dir * i, y, LEAF_SHADE);
				set(layer, cx + dir * i, y + 1, LEAF_SHADE);
			}
		}
	}
}

/**
 * The ruin's paved floor in front of the gate, worn slabs with moss in the joints.
 * @param {Canvas} layer
 */
function drawFloor(layer) {
	for (let y = FLOOR; y < 64; y++) {
		const course = Math.floor((y - FLOOR) / 4);
		for (let x = 0; x < 64; x++) {
			let colour = y - FLOOR > 8 ? STONE_SHADE : STONE;
			if (y === FLOOR) {
				colour = STONE_LIGHT;
			} else if ((y - FLOOR) % 4 === 0) {
				colour = MOSS;
			} else if ((x + course * 5) % 11 === 0) {
				colour = STONE_SHADE;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * Paints a block of masonry, lit on the left and shaded on the right, with joints.
 * @param {Canvas} canvas
 * @param {number} x0 - Left column
 * @param {number} y0 - Top row
 * @param {number} x1 - Right column
 * @param {number} y1 - Bottom row
 */
function masonry(canvas, x0, y0, x1, y1) {
	for (let y = y0; y <= y1; y++) {
		for (let x = x0; x <= x1; x++) {
			let colour = STONE;
			if (x === x0 || y === y0) {
				colour = STONE_LIGHT;
			} else if (x >= x1 - 1) {
				colour = STONE_SHADE;
			} else if (
				(y - y0) % 5 === 0 ||
				(x - x0 + Math.floor((y - y0) / 5) * 3) % 6 === 0
			) {
				colour = mix(STONE, STONE_SHADE, 0.6);
			}
			set(canvas, x, y, colour);
		}
	}
}

/**
 * The gate: two massive pillars, a carved lintel and a crumbled top, with the dark doorway between.
 * @param {Canvas} ruin
 */
function drawGate(ruin) {
	const { left, right, pillar, lintel } = GATE;
	// The dark chamber beyond the doorway.
	rect(
		ruin,
		left + pillar,
		lintel + 8,
		right - left - pillar * 2 + 1,
		FLOOR - lintel - 8,
		C.roofShade
	);
	masonry(ruin, left, lintel + 8, left + pillar - 1, FLOOR);
	masonry(ruin, right - pillar + 1, lintel + 8, right, FLOOR);
	masonry(ruin, left - 4, lintel, right + 4, lintel + 7);
	// A carved band of raised blocks across the lintel.
	for (let x = left - 2; x <= right + 2; x += 4) {
		rect(ruin, x, lintel + 3, 2, 2, STONE_SHADE);
		set(ruin, x, lintel + 3, STONE_LIGHT);
	}
	// The crumbled course above the lintel, jagged and broken away towards the right.
	for (let x = left - 3; x <= right; x++) {
		const h = Math.max(
			0,
			Math.round(
				4.5 -
					(x - left) * 0.12 +
					Math.sin(x * 0.55) * 1.3 -
					(x % 5 === 0 ? 1 : 0)
			)
		);
		for (let y = lintel - h; y < lintel; y++) {
			const colour =
				y === lintel - h
					? STONE_LIGHT
					: (x + y) % 4 === 0
						? STONE_SHADE
						: STONE;
			set(ruin, x, y, colour);
		}
	}
	// A fallen block leaning on the right pillar's foot.
	masonry(ruin, right + 1, FLOOR - 5, right + 6, FLOOR);
	// Moss along the lintel's top.
	for (let x = left - 4; x <= right + 4; x++) {
		if ((x * 7) % 5 < 3) {
			set(ruin, x, lintel, MOSS);
		}
	}
}

/**
 * The pedestal in the doorway: a carved stone column on a step.
 * @param {Canvas} ruin
 */
function drawPedestal(ruin) {
	masonry(ruin, RELIC.x - 6, FLOOR - 2, RELIC.x + 6, FLOOR);
	masonry(ruin, RELIC.x - 3, RELIC.y + 8, RELIC.x + 3, FLOOR - 3);
	masonry(ruin, RELIC.x - 5, RELIC.y + 6, RELIC.x + 5, RELIC.y + 7);
}

/**
 * Vines hanging from the lintel down the pillars, with leaves along them.
 * @param {Canvas} ruin
 * @param {() => number} random
 */
function drawVines(ruin, random) {
	for (const [x, length] of [
		[GATE.left - 2, 22],
		[GATE.left + 3, 14],
		[GATE.left + 9, 9],
		[GATE.right - 6, 18],
		[GATE.right + 1, 26],
		[GATE.right - 11, 7],
	]) {
		for (let i = 0; i < length; i++) {
			const vx = x + Math.round(Math.sin(i * 0.5 + x) * 0.8);
			const vy = GATE.lintel + 2 + i;
			set(ruin, vx, vy, LEAF);
			if (random() > 0.55) {
				set(ruin, vx + (i % 2 ? 1 : -1), vy, LEAF_LIGHT);
			}
		}
	}
}

/**
 * The relic on the pedestal: a faceted violet crystal in a gold setting, glowing and shedding rays into the dark.
 * @param {Canvas} ruin
 */
function drawRelic(ruin) {
	glow(ruin, {
		x: RELIC.x,
		y: RELIC.y - 3,
		radius: 15,
		colour: C.arcaneLight,
		strength: 0.55,
		steps: 3,
	});
	// Rays fanning out through the doorway.
	for (const [dx, dy] of [
		[-10, -10],
		[-4, -14],
		[4, -14],
		[10, -10],
		[-13, -2],
		[13, -2],
	]) {
		for (let i = 5; i <= 10; i++) {
			const x = RELIC.x + Math.round((dx * i) / 10);
			const y = RELIC.y - 3 + Math.round((dy * i) / 10);
			const behind = get(ruin, x, y);
			if (behind) {
				set(ruin, x, y, mix(behind, C.white, 0.4));
			}
		}
	}
	paint(
		ruin,
		RELIC.x - 6,
		RELIC.y - 9,
		[
			'......k......',
			'.....kLk.....',
			'....kLlak....',
			'...kLllaSk...',
			'..kLllaaSSk..',
			'.kLllaaaSSSk.',
			'kLlllaaaSSSSk',
			'.klllaaaSSSk.',
			'..kllaaaSSk..',
			'...klaaaSk...',
			'....klaSk....',
			'...kGGGGGk...',
			'..kGgGgGgGk..',
			'.kGGGGGGGGgk.',
			'.kkkkkkkkkkk.',
		],
		{
			k: C.ink,
			L: C.white,
			l: C.arcaneLight,
			a: C.arcane,
			S: C.arcaneShade,
			G: C.gold,
			g: C.amber,
		}
	);
}

/**
 * The explorer: pith helmet, khaki shirt, satchel and boots, facing the relic with a lantern held out.
 * @param {Canvas} scene
 * @param {number} x - The sprite's left column
 * @param {number} y - The sprite's top row
 */
function drawExplorer(scene, x, y) {
	paint(
		scene,
		x,
		y,
		[
			'.....hhhh.......',
			'....hHHHHh......',
			'...hHHHHHHh.....',
			'..bbbbbbbbbbb...',
			'.....WSSSS......',
			'.....WSSeS......',
			'.....WSSSSs.....',
			'......SSSs......',
			'.......ss.......',
			'.....KKKKKk.....',
			'....KKKKKKKKKSS.',
			'...kKtKKKKKk....',
			'...kKKtKKKKk....',
			'..uukKKtKKKk....',
			'..uuBBBBBBBB....',
			'..uuPPPPPPPp....',
			'....PPPP.PPp....',
			'....PPP..PPp....',
			'....PPP..PPp....',
			'...PPP....PPp...',
			'...PPP....PPp...',
			'...DDD....DDD...',
			'...DDDD...DDDD..',
		],
		{
			h: C.creamLight,
			H: C.cream,
			b: C.creamShade,
			W: C.timber,
			S: C.skin,
			s: C.skinShade,
			e: C.ink,
			K: mix(C.sand, C.sandShade, 0.3),
			k: C.sandShade,
			t: C.timberShade,
			B: C.timberShade,
			u: C.timber,
			P: C.timber,
			p: C.timberShade,
			D: C.wood,
		}
	);
}

/**
 * The lantern hanging from the explorer's hand, drawn after the outline with its own warm glow.
 * @param {Canvas} scene
 */
function drawLantern(scene) {
	const lx = 17;
	const ly = 49;
	glow(scene, { x: lx, y: ly, radius: 8, colour: C.gold, strength: 0.4 });
	paint(
		scene,
		lx - 2,
		ly - 3,
		['..f..', '.f.f.', '.fff.', 'fgGgf', 'fGLGf', 'fgGgf', '.fff.'],
		{ f: C.ink, g: C.amber, G: C.gold, L: C.lampGlow }
	);
}

/**
 * Big jungle leaves in the foreground: fronds rising from the bottom right and hanging into the top left.
 * @param {Canvas} scene
 */
function drawFronds(scene) {
	for (const [x0, y0, x1, y1] of [
		[63, 63, 50, 44],
		[63, 63, 44, 54],
		[63, 63, 58, 40],
		[56, 63, 46, 58],
		[0, 0, 12, 10],
		[0, 6, 9, 16],
	]) {
		frond(scene, x0, y0, x1, y1);
	}
}

/**
 * One long leaf from its stalk to its tip, widest in the middle, with a lit midrib.
 * @param {Canvas} scene
 * @param {number} x0 - The stalk's column
 * @param {number} y0 - The stalk's row
 * @param {number} x1 - The tip's column
 * @param {number} y1 - The tip's row
 */
function frond(scene, x0, y0, x1, y1) {
	const length = Math.hypot(x1 - x0, y1 - y0);
	const nx = -(y1 - y0) / length;
	const ny = (x1 - x0) / length;
	const steps = Math.ceil(length * 2);
	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		const width = Math.sin(t * Math.PI) * 3.2;
		const cx = x0 + (x1 - x0) * t;
		const cy = y0 + (y1 - y0) * t;
		for (let w = -width; w <= width; w += 0.5) {
			const colour = w < -0.6 ? LEAF_LIGHT : w > 0.6 ? LEAF_SHADE : LEAF;
			set(
				scene,
				Math.round(cx + nx * w),
				Math.round(cy + ny * w),
				colour
			);
		}
	}
	line(scene, x0, y0, x1, y1, mix(LEAF_LIGHT, C.sandLight, 0.3));
}
