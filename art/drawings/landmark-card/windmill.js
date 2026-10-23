// Windmill: inside the mill by day, the great wooden brake wheel turning its pegged cogs into a lantern gear, the millstones below and flour pouring off a chute into a cord-tied sack, sunbeams slanting through the flour dust.
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

/** The brake wheel: its hub, the outside and inside of its rim, and its cogs. */
const WHEEL = { x: 21, y: 16, rim: 13, inner: 9, cogs: 16, cogLength: 3 };

/** The lantern gear under the wheel's lower right: its centre column, half its width, and its top and bottom rows. */
const LANTERN = { x: 37, half: 6, top: 27, bottom: 36 };

/** The millstones: the centre of the runner's top face, how wide and how deep its ellipse is, and each stone's thickness. */
const STONES = { x: 38, y: 41, rx: 15, ry: 4, runner: 3, bed: 3 };

/** The timber stage the stones stand on. */
const STAGE = { left: 20, right: 63, top: 52, bottom: 54 };

/** The floor below the stage. */
const FLOOR = 55;

/** The chute from the stones down to the sack's mouth. */
const CHUTE = { from: [23, 45], to: [15, 47] };

/** The sack standing on the floor in front: its centre column, the row of its open mouth under the chute, and half the mouth's width. */
const SACK = { x: 11, mouth: 51, half: 6 };

/** The window high in the back wall, the sun pouring in through it. */
const WINDOW = { x: 48, y: 3, w: 12, h: 12 };

/** The way the sunbeams fall from the window: down and to the left. */
const BEAM = normalise(-1, 1.15);

/** The dim board walls of the mill. */
const WALL = mix(C.wood, C.timberShade, 0.5);
const WALL_LIGHT = C.timberShade;
const WALL_SEAM = mix(C.wood, C.ink, 0.45);

/** The sunlight in the dusty air. */
const SUN = C.beamLight;

/** The dust the turning wheel sweeps round with it, fading behind the cogs. */
const SWING = mix(WALL, C.creamLight, 0.55);
const SWING_FAINT = mix(WALL, C.creamLight, 0.3);

/** The great wheel's oak: highlight, lit, face and shadow. */
const OAK_HIGHLIGHT = mix(C.timberLight, C.sandLight, 0.45);
const OAK_LIGHT = C.timberLight;
const OAK = C.timber;
const OAK_SHADE = C.timberShade;

/** The cogs and the lantern's staves, of paler, harder wood. */
const PEG_LIGHT = mix(C.sand, C.timberLight, 0.3);
const PEG = mix(C.sandShade, C.timberLight, 0.5);

/** Iron bands round the shafts. */
const IRON = C.stoneShade;
const IRON_LIGHT = C.stoneMid;

/** The millstones, warmed by the sun and dusted with flour. */
const GRIT_LIGHT = mix(C.stoneLight, C.cream, 0.35);
const GRIT = mix(C.stone, C.sand, 0.2);
const GRIT_SHADE = mix(C.stoneShade, C.timberShade, 0.25);
const FURROW = mix(C.stone, C.stoneShade, 0.5);

/** Flour, and the sack it fills. */
const FLOUR = C.creamLight;
const FLOUR_SHADE = C.cream;
const SACKING_LIGHT = mix(C.sand, C.timberLight, 0.25);
const SACKING = mix(C.sandShade, C.timberLight, 0.4);
const SACKING_SHADE = mix(C.timberLight, C.timber, 0.4);

/** The cord tied round the sack's neck. */
const CORD = C.timberShade;

/**
 * Draws the Windmill landmark card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const scene = createCanvas(64, 64);
	const random = seededRandom(1745);

	drawWalls(layer);
	drawFloor(layer);
	drawWindow(layer);
	drawSunbeams(layer, [0.32, 0.18]);

	drawWheel(scene);
	drawLantern(scene);
	drawStage(scene);
	drawStones(scene);
	drawChute(scene);
	drawSack(scene, random);
	outline(scene, C.ink);
	underlay(scene, layer);
	// The same beams fall across the gearing and the stones, more softly than on the dark wall, leaving the outlines crisp.
	drawSunbeams(scene, [0.2, 0.1], [C.ink]);

	drawPour(scene);
	drawSwing(scene);
	drawDust(scene, random);
	return scene;
}

/**
 * Turns a direction into a unit vector.
 * @param {number} x
 * @param {number} y
 * @returns {{ x: number, y: number }}
 */
function normalise(x, y) {
	const length = Math.hypot(x, y);
	return { x: x / length, y: y / length };
}

/**
 * The back wall: upright boards with dark seams, crossed by a heavy beam.
 * @param {Canvas} layer
 */
function drawWalls(layer) {
	for (let y = 0; y < FLOOR; y++) {
		for (let x = 0; x < 64; x++) {
			const board = x % 6;
			let colour = WALL;
			if (board === 0) {
				colour = WALL_SEAM;
			} else if (board === 1) {
				colour = WALL_LIGHT;
			}
			set(layer, x, y, colour);
		}
	}
	// The beam the upright shaft's bearing hangs from.
	rect(layer, 0, 21, 64, 1, OAK_LIGHT);
	rect(layer, 0, 22, 64, 3, OAK);
	rect(layer, 0, 25, 64, 1, OAK_SHADE);
}

/**
 * The floorboards below the stage.
 * @param {Canvas} layer
 */
function drawFloor(layer) {
	for (let y = FLOOR; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = C.floor;
			if ((y - FLOOR) % 3 === 2 || (x + (y - FLOOR) * 5) % 19 === 0) {
				colour = C.floorShade;
			} else if ((y - FLOOR) % 3 === 0) {
				colour = C.floorLight;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The window: a timber frame with a cross of glazing bars round bright sky.
 * @param {Canvas} layer
 */
function drawWindow(layer) {
	const { x, y, w, h } = WINDOW;
	for (let j = 0; j < h; j++) {
		for (let i = 0; i < w; i++) {
			const frame = i === 0 || j === 0 || i === w - 1 || j === h - 1;
			const bar = i === Math.floor(w / 2) || j === Math.floor(h / 2);
			let colour = j < h / 2 ? C.daySky5 : C.daySky6;
			if (frame) {
				colour = j === h - 1 ? OAK_LIGHT : OAK_SHADE;
			} else if (bar) {
				colour = OAK;
			} else if (i + j < 6) {
				colour = C.white;
			}
			set(layer, x + i, y + j, colour);
		}
	}
}

/**
 * How brightly the sun from the window lights a point: 0 outside the beams, 1 or 2 inside.
 * Three beams fall through the panes either side of the bars.
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function sunLevel(x, y) {
	const cx = WINDOW.x + WINDOW.w / 2;
	const cy = WINDOW.y + WINDOW.h / 2;
	const along = (x - cx) * BEAM.x + (y - cy) * BEAM.y;
	const across = (x - cx) * -BEAM.y + (y - cy) * BEAM.x;
	if (along < 6) {
		return 0;
	}
	const inBeam =
		(across > -8 && across < -1.5) || (across > 0.5 && across < 7);
	if (!inBeam) {
		return 0;
	}
	return along < 34 ? 2 : 1;
}

/**
 * Brightens everything already painted inside the sunbeams.
 * @param {Canvas} canvas
 * @param {[number, number]} strengths - How far towards the sunlight the bright and the faint parts of the beams move
 * @param {Colour[]} [skip] - Colours left as they are
 */
function drawSunbeams(canvas, [bright, faint], skip = []) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const level = sunLevel(x, y);
			const behind = canvas.p[y * 64 + x];
			if (level > 0 && behind && !skip.includes(behind)) {
				set(
					canvas,
					x,
					y,
					mix(behind, SUN, level === 2 ? bright : faint)
				);
			}
		}
	}
}

/**
 * The brake wheel: a rim of oak felloes pinned with treenails, held on four clasp arms round the square
 * windshaft, with stout pegged cogs all round its edge. The sun from the window lights its upper right.
 * @param {Canvas} scene
 */
function drawWheel(scene) {
	const { x: cx, y: cy, rim, inner, cogs, cogLength } = WHEEL;
	// The cogs first, so the rim's edge sits cleanly over their roots.
	for (let i = 0; i < cogs; i++) {
		const angle = (i / cogs) * Math.PI * 2 + 0.1;
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		for (let r = rim - 1; r <= rim + cogLength; r += 0.5) {
			for (const side of [-0.7, 0, 0.7]) {
				const x = Math.round(cx + cos * r - sin * side);
				const y = Math.round(cy + sin * r + cos * side);
				const lit = cos - sin > 0.3 ? side <= 0 : side < 0;
				set(scene, x, y, lit ? PEG_LIGHT : PEG);
			}
		}
	}
	for (let y = cy - rim - 1; y <= cy + rim + 1; y++) {
		for (let x = cx - rim - 1; x <= cx + rim + 1; x++) {
			const dx = x - cx;
			const dy = y - cy;
			const d = Math.hypot(dx, dy);
			if (d > rim + 0.4 || d < inner - 0.4) {
				continue;
			}
			const facing = (dx - dy) / (d * Math.SQRT2);
			let colour =
				facing > 0.45 ? OAK_LIGHT : facing > -0.45 ? OAK : OAK_SHADE;
			if (d > rim - 0.8 && facing > 0.2) {
				colour = OAK_HIGHLIGHT;
			} else if (d < inner + 0.8) {
				colour = OAK_SHADE;
			}
			// The joints between the felloes, one every eighth of a turn.
			const angle = Math.atan2(dy, dx) + Math.PI;
			const part = (angle / (Math.PI * 2)) * 8 + 0.5;
			if (Math.abs(part - Math.round(part)) < 0.06) {
				colour = C.wood;
			}
			set(scene, x, y, colour);
		}
	}
	// The treenails, one in the middle of each felloe.
	for (let i = 0; i < 8; i++) {
		const angle = (i / 8) * Math.PI * 2;
		set(
			scene,
			Math.round(cx + Math.cos(angle) * (rim - 2)),
			Math.round(cy + Math.sin(angle) * (rim - 2)),
			PEG_LIGHT
		);
	}
	drawClaspArms(scene);
}

/**
 * The clasp arms: two pairs of beams crossing in a square round the windshaft, which shows its iron-banded end.
 * @param {Canvas} scene
 */
function drawClaspArms(scene) {
	const { x: cx, y: cy, inner } = WHEEL;
	for (let t = -inner; t <= inner; t++) {
		for (let k = -3; k <= 3; k++) {
			// Each pair of beams lies tight against the shaft, so the four arms make one broad cross.
			const seam = k === 0;
			const upright = k < -1 ? OAK : k > 1 ? OAK_LIGHT : OAK;
			set(scene, cx + k, cy + t, seam ? OAK_SHADE : upright);
			const level = k < -1 ? OAK_LIGHT : k > 1 ? OAK_SHADE : OAK;
			set(scene, cx + t, cy + k, seam ? OAK_SHADE : level);
		}
	}
	// The windshaft's square end grain, wedged tight between the arms.
	rect(scene, cx - 2, cy - 2, 5, 5, OAK_SHADE);
	rect(scene, cx - 1, cy - 1, 3, 3, OAK);
	set(scene, cx, cy, OAK_SHADE);
	for (const [x, y] of [
		[cx - 2, cy - 2],
		[cx + 2, cy - 2],
		[cx - 2, cy + 2],
		[cx + 2, cy + 2],
	]) {
		set(scene, x, y, IRON_LIGHT);
	}
}

/**
 * The lantern gear: two oak discs joined by a ring of pale staves, on the upright shaft that runs down
 * into the runner stone.
 * @param {Canvas} scene
 */
function drawLantern(scene) {
	const { x: cx, half, top, bottom } = LANTERN;
	// The upright shaft, behind the staves and down into the stone's eye.
	rect(scene, cx - 1, top, 3, STONES.y - top + 1, OAK_SHADE);
	rect(scene, cx + 1, top, 1, STONES.y - top + 1, OAK);
	rect(scene, cx - 1, bottom + 2, 3, 1, IRON_LIGHT);
	for (const y of [top, bottom - 1]) {
		for (let x = cx - half; x <= cx + half; x++) {
			const end = x === cx - half || x === cx + half;
			set(scene, x, y, end ? OAK : OAK_LIGHT);
			set(scene, x, y + 1, end ? OAK_SHADE : OAK);
		}
	}
	for (let y = top + 2; y < bottom - 1; y++) {
		for (let x = cx - half + 1; x < cx + half; x += 2) {
			set(scene, x, y, x > cx ? PEG_LIGHT : PEG);
		}
	}
}

/**
 * The timber stage the stones stand on, its face pinned with treenails.
 * @param {Canvas} scene
 */
function drawStage(scene) {
	const { left, right, top, bottom } = STAGE;
	for (let x = left; x <= right; x++) {
		set(scene, x, top, OAK_LIGHT);
		for (let y = top + 1; y <= bottom; y++) {
			set(scene, x, y, y === bottom ? OAK_SHADE : OAK);
		}
		if (x % 7 === 3) {
			set(scene, x, top + 1, PEG_LIGHT);
		}
	}
}

/**
 * The millstones: the runner turning on the bed stone. The runner's top face shows the eye the shaft
 * drives it through, a ring of furrows and a dusting of flour; meal spills from the gap between the stones.
 * @param {Canvas} scene
 */
function drawStones(scene) {
	const { x: cx, y: cy, rx, ry, runner, bed } = STONES;
	for (let x = cx - rx - 1; x <= cx + rx + 1; x++) {
		const u = (x - cx) / (rx + 0.5);
		if (Math.abs(u) > 1) {
			continue;
		}
		const depth = ry * Math.sqrt(1 - u * u);
		const face = Math.round(cy + depth);
		// The stones' round edges: lit towards the window, rough with chisel marks.
		const tone = u > 0.45 ? GRIT_LIGHT : u > -0.35 ? GRIT : GRIT_SHADE;
		for (let y = face; y < face + runner; y++) {
			const mark = (x * 7 + y * 3) % 11 === 0;
			set(scene, x, y, mark ? GRIT_SHADE : tone);
		}
		set(scene, x, face + runner, x % 3 === 0 ? FLOUR : C.wood);
		for (let y = face + runner + 1; y <= face + runner + bed; y++) {
			set(scene, x, y, u > 0.45 ? GRIT : GRIT_SHADE);
		}
		for (let y = Math.round(cy - depth); y < face; y++) {
			set(scene, x, y, topFace(x - cx, y - cy));
		}
	}
	// The eye, with the iron rynd across it that the shaft turns.
	rect(scene, cx - 3, cy - 1, 7, 2, C.wood);
	rect(scene, cx - 3, cy, 7, 1, IRON);
	set(scene, cx + 2, cy, IRON_LIGHT);
	// Flour drips down the bed stone under the gap.
	for (const [x, length] of [
		[cx - 9, 2],
		[cx - 3, 1],
		[cx + 5, 2],
	]) {
		const below =
			Math.round(cy + ry * Math.sqrt(1 - ((x - cx) / (rx + 0.5)) ** 2)) +
			runner +
			1;
		rect(scene, x, below, 1, length, FLOUR_SHADE);
	}
}

/**
 * The colour of the runner's top face at a point: pale stone, a ring of furrows radiating from the eye,
 * and flour dust settled round it.
 * @param {number} dx - Across the face from the eye
 * @param {number} dy - Down the face from the eye
 * @returns {Colour}
 */
function topFace(dx, dy) {
	const u = dx / STONES.rx;
	const v = dy / STONES.ry;
	const r = Math.hypot(u, v);
	// The furrows lean round the eye like the harps on a dressed stone.
	const angle = Math.atan2(v, u) - r * 0.6;
	const furrow = Math.cos(angle * 5) > 0.82 && r > 0.35 && r < 0.92;
	if (r > 0.88 && v < 0) {
		return GRIT;
	}
	if (furrow) {
		return FURROW;
	}
	return r < 0.55 && (Math.round(dx) + Math.round(dy)) % 3 === 0
		? FLOUR_SHADE
		: GRIT_LIGHT;
}

/**
 * The wooden chute from the gap between the stones down to the sack, with flour running in it.
 * @param {Canvas} scene
 */
function drawChute(scene) {
	const [x0, y0] = CHUTE.from;
	const [x1, y1] = CHUTE.to;
	line(scene, x0, y0 - 1, x1, y1 - 1, OAK_LIGHT);
	line(scene, x0, y0, x1, y1, FLOUR);
	line(scene, x0, y0 + 1, x1, y1 + 1, OAK);
	line(scene, x0, y0 + 2, x1, y1 + 2, OAK_SHADE);
}

/**
 * The sack: its mouth held open in a ruffled rim with flour heaped inside, its neck gathered in pleats and
 * tied round with a cord, and its body bulging below with the load.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawSack(scene, random) {
	const { x: cx, mouth, half } = SACK;
	// Half the sack's width on each row from the mouth down: the rim, the gathered neck, then the body.
	const widths = [half - 1, half, half - 1, 3, 3, 3, 5, 6, 7, 8];
	const cord = mouth + 3;
	for (let y = mouth - 1; y < 64; y++) {
		const w = widths[Math.min(widths.length - 1, y - mouth + 1)];
		for (let x = cx - w; x <= cx + w; x++) {
			const across = (x - cx) / w;
			let colour =
				across > 0.4
					? SACKING_LIGHT
					: across < -0.45
						? SACKING_SHADE
						: SACKING;
			if (y === mouth - 1 || y === mouth) {
				// The back of the rim, and the flour heaped inside the mouth.
				colour =
					Math.abs(x - cx) < w - 1
						? y === mouth - 1
							? FLOUR
							: C.white
						: SACKING_SHADE;
			} else if (y === mouth + 1) {
				// The front of the rim, ruffled where it folds over.
				colour = (x + cx) % 2 ? SACKING_LIGHT : SACKING;
			} else if (y === cord) {
				colour = CORD;
			} else if (y < cord + 2) {
				// Pleats where the cloth is gathered into the neck.
				colour = (x - cx) % 2 ? SACKING_SHADE : colour;
			} else if (
				x === cx - 3 + Math.floor((y - cord) / 3) ||
				random() < 0.08
			) {
				colour = SACKING_SHADE;
			}
			set(scene, x, y, colour);
		}
	}
	// The knot on the cord and its loose end hanging down the sack.
	rect(scene, cx + 3, cord - 1, 2, 2, CORD);
	set(scene, cx + 3, cord - 1, OAK);
	rect(scene, cx + 5, cord, 1, 3, CORD);
	set(scene, cx + 4, cord + 1, CORD);
}

/**
 * The flour pouring off the chute's lip into the sack's mouth, painted over the outline as a broad soft stream.
 * @param {Canvas} scene
 */
function drawPour(scene) {
	const [lip, top] = CHUTE.to;
	for (let y = top; y < SACK.mouth; y++) {
		set(scene, lip - 3, y, (y - top) % 2 ? FLOUR_SHADE : FLOUR);
		set(scene, lip - 2, y, C.white);
		set(scene, lip - 1, y, y === top ? C.white : FLOUR);
	}
	set(scene, lip - 4, SACK.mouth - 2, FLOUR);
}

/**
 * The wheel turning: two arcs of flour dust swept round just outside its cogs.
 * @param {Canvas} scene
 */
function drawSwing(scene) {
	const { x: cx, y: cy, rim, cogLength } = WHEEL;
	for (const [from, to, r] of [
		[3.3, 4.1, rim + cogLength + 2],
		[1.75, 2.45, rim + cogLength + 2],
	]) {
		for (let angle = from; angle <= to; angle += 0.05) {
			const x = Math.round(cx + Math.cos(angle) * r);
			const y = Math.round(cy + Math.sin(angle) * r);
			const fade = (angle - from) / (to - from);
			set(scene, x, y, fade < 0.5 ? SWING_FAINT : SWING);
		}
	}
}

/**
 * Flour dust drifting in the sunbeams, brightest where the sun is strongest.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawDust(scene, random) {
	for (let i = 0; i < 160; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.floor(random() * 60);
		const level = sunLevel(x, y);
		if (level > 0) {
			set(
				scene,
				x,
				y,
				level === 2 && random() < 0.5 ? C.white : C.lampGlow
			);
		}
	}
}
