// Cartography: looking down on a map table at night, a candle lighting an unrolled chart with a compass rose, dividers and a quill.
import {
	createCanvas,
	get,
	set,
	line,
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

/** The flat part of the chart, between its two rolled ends. */
const MAP = { left: 5, right: 58, top: 10, bottom: 51 };

/** The candle flame, and the compass rose's centre. */
const FLAME = { x: 53, y: 3 };
const ROSE = { x: 46, y: 40 };

/** The chart's inks and washes. */
const PAPER = C.sandLight;
const SEA = mix(C.sandLight, C.daySea1, 0.28);
const SEA_SHADE = mix(C.sandLight, C.daySea2, 0.45);
const RHUMB = mix(SEA, C.timber, 0.28);
const INK = C.timberShade;
const WOOD = mix(C.sand, C.pine, 0.45);

/**
 * Draws the Cartography scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(97);

	drawTable(layer, random);

	// The chart lies on the table under the tools, so it gets its own outline.
	const chart = createCanvas(64, 64);
	drawChart(chart, random);
	outline(chart, C.ink);

	drawDividers(scene);
	drawInkwell(scene);
	drawQuill(scene);
	drawCandle(scene);
	castShadows(scene, chart);
	outline(scene, C.ink);
	underlay(scene, chart);
	underlay(scene, layer);

	drawNight(scene);
	glow(scene, {
		x: FLAME.x,
		y: FLAME.y,
		radius: 36,
		colour: C.lampGlow,
		strength: 0.36,
		steps: 3,
		skip: [C.ink],
	});
	drawFlame(scene);
	return scene;
}

/**
 * The table top: dark planks running across, with grain and joints.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawTable(layer, random) {
	for (let y = 0; y < 64; y++) {
		const plank = Math.floor(y / 7);
		const joint = (plank * 23 + 9) % 64;
		for (let x = 0; x < 64; x++) {
			let colour = C.timberShade;
			if (y % 7 === 6 || x === joint) {
				colour = C.wood;
			} else if (y % 7 === 0) {
				colour = C.timber;
			} else if ((x * 3 + y * 5 + plank) % 11 === 0) {
				colour = C.wood;
			}
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 30; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.floor(random() * 64);
		if (y % 7 !== 6) {
			set(layer, x, y, C.timber);
		}
	}
}

/**
 * Tells whether a point of the chart is land: a large continent with a southern peninsula on the left, and an island on the right.
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function isLand(x, y) {
	/**
	 * A wobbly blob around a centre.
	 * @param {number} cx
	 * @param {number} cy
	 * @param {number} rx
	 * @param {number} ry
	 * @param {number} phase - Turns the blob's bumps
	 * @returns {boolean}
	 */
	const blob = (cx, cy, rx, ry, phase) => {
		const angle = Math.atan2(y - cy, x - cx);
		const reach =
			1 +
			0.2 * Math.sin(angle * 3 + phase) +
			0.1 * Math.sin(angle * 7 + phase * 2);
		return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= reach * reach;
	};
	const bay = ((x - 24) / 5) ** 2 + ((y - 33) / 4) ** 2 <= 1;
	return (
		(blob(17, 25, 11, 12, 0.6) && !bay) ||
		blob(25, 41, 6, 6, 2.1) ||
		blob(50, 25, 4, 3, 1.3)
	);
}

/**
 * The chart: parchment sea and land, coastlines, rhumb lines, a compass rose, a plotted voyage, a border and two rolled ends.
 * @param {Canvas} chart
 * @param {() => number} random
 */
function drawChart(chart, random) {
	const { left, right, top, bottom } = MAP;
	for (let y = top; y <= bottom; y++) {
		for (let x = left; x <= right; x++) {
			set(chart, x, y, isLand(x, y) ? PAPER : SEA);
		}
	}
	drawRhumbLines(chart);
	// Coastlines in ink, with a band of darker water hugging each coast.
	for (let y = top; y <= bottom; y++) {
		for (let x = left; x <= right; x++) {
			if (!isLand(x, y)) {
				continue;
			}
			const shore = [
				[1, 0],
				[-1, 0],
				[0, 1],
				[0, -1],
			].some(([dx, dy]) => !isLand(x + dx, y + dy));
			if (shore) {
				set(chart, x, y, INK);
			}
		}
	}
	for (let y = top; y <= bottom; y++) {
		for (let x = left; x <= right; x++) {
			if (isLand(x, y)) {
				continue;
			}
			const near = [
				[2, 0],
				[-2, 0],
				[0, 2],
				[0, -2],
			].some(([dx, dy]) => isLand(x + dx, y + dy));
			if (near && get(chart, x, y) !== INK) {
				set(chart, x, y, SEA_SHADE);
			}
		}
	}
	drawLandDetail(chart, random);
	drawRose(chart);
	drawRoute(chart);
	// A double ruled border inside the edge.
	for (let x = left + 2; x <= right - 2; x++) {
		set(chart, x, top + 1, INK);
		set(chart, x, bottom - 1, INK);
	}
	for (let y = top + 1; y <= bottom - 1; y++) {
		set(chart, left + 2, y, INK);
		set(chart, right - 2, y, INK);
	}
	for (let x = left; x <= right; x++) {
		set(chart, x, top, PAPER);
		set(chart, x, bottom, PAPER);
	}
	for (let y = top; y <= bottom; y++) {
		set(chart, left, y, PAPER);
		set(chart, left + 1, y, PAPER);
		set(chart, right, y, C.sand);
		set(chart, right - 1, y, PAPER);
	}
	drawRoll(chart, top - 4);
	drawRoll(chart, bottom + 1);
}

/**
 * Faint rhumb lines fanning out across the sea from the compass rose.
 * @param {Canvas} chart
 */
function drawRhumbLines(chart) {
	for (let i = 0; i < 16; i++) {
		const angle = (i / 16) * Math.PI * 2;
		for (let r = 8; r < 70; r++) {
			const x = Math.round(ROSE.x + Math.cos(angle) * r);
			const y = Math.round(ROSE.y + Math.sin(angle) * r);
			if (
				x <= MAP.left + 2 ||
				x >= MAP.right - 2 ||
				y <= MAP.top + 1 ||
				y >= MAP.bottom - 1
			) {
				break;
			}
			if (get(chart, x, y) === SEA) {
				set(chart, x, y, RHUMB);
			}
		}
	}
}

/**
 * Woods, a mountain range and a river on the continent.
 * @param {Canvas} chart
 * @param {() => number} random
 */
function drawLandDetail(chart, random) {
	// A ridge of small inked mountains, lit on the left.
	for (const [x, y] of [
		[11, 19],
		[14, 17],
		[17, 19],
		[13, 22],
		[16, 23],
	]) {
		paint(chart, x, y, ['.a.', 'aAb'], {
			a: INK,
			A: C.sand,
			b: C.sandShade,
		});
	}
	// Woods: little clumps of green.
	for (let i = 0; i < 14; i++) {
		const x = 9 + Math.floor(random() * 20);
		const y = 26 + Math.floor(random() * 18);
		if (isLand(x, y) && isLand(x + 1, y) && get(chart, x, y) === PAPER) {
			set(chart, x, y, WOOD);
			set(chart, x + 1, y, mix(WOOD, C.pineShade, 0.4));
		}
	}
	// A river from the mountains down to the bay.
	for (const [x, y] of [
		[17, 24],
		[18, 25],
		[18, 26],
		[19, 27],
		[20, 28],
		[20, 29],
		[21, 30],
	]) {
		set(chart, x, y, mix(C.daySea2, INK, 0.2));
	}
}

/**
 * An eight-point compass rose over an inked ring: gilt main points and cream diagonals, each lit on its upper-left half, north in red.
 * @param {Canvas} chart
 */
function drawRose(chart) {
	const { x: cx, y: cy } = ROSE;
	for (let y = cy - 6; y <= cy + 6; y++) {
		for (let x = cx - 6; x <= cx + 6; x++) {
			const d = Math.hypot(x - cx, y - cy);
			if (d >= 4.5 && d < 5.5) {
				set(chart, x, y, INK);
			}
		}
	}
	// The diagonal points, under the main ones.
	for (const [sx, sy] of [
		[1, -1],
		[1, 1],
		[-1, 1],
		[-1, -1],
	]) {
		for (let r = 1; r <= 6; r++) {
			const x = cx + sx * r;
			const y = cy + sy * r;
			set(chart, x, y, C.creamLight);
			if (r <= 4) {
				// The two pixels beside the axis: the one further up and left is lit.
				const lit = -sx < -sy;
				set(chart, x - sx, y, lit ? C.creamLight : C.sandShade);
				set(chart, x, y - sy, lit ? C.sandShade : C.creamLight);
			}
		}
	}
	// The main points: dark on the side away from the light (right of a vertical point, below a level one).
	for (const [ux, uy] of [
		[0, -1],
		[1, 0],
		[0, 1],
		[-1, 0],
	]) {
		const [px, py] = ux === 0 ? [1, 0] : [0, 1];
		const north = uy === -1;
		for (let r = 0; r <= 9; r++) {
			const half = r <= 3 ? 2 : r <= 6 ? 1 : 0;
			for (let k = -half; k <= half; k++) {
				let colour = k > 0 ? C.timber : C.gold;
				if (north) {
					colour = k > 0 ? C.brickRedShade : C.brickRedLight;
				}
				set(chart, cx + ux * r + px * k, cy + uy * r + py * k, colour);
			}
		}
	}
	set(chart, cx, cy, C.lampGlow);
}

/**
 * A voyage plotted in red dots from the continent's bay out to the island.
 * @param {Canvas} chart
 */
function drawRoute(chart) {
	for (let i = 0; i <= 12; i++) {
		const t = i / 12;
		const x = Math.round(28 + 21 * t);
		const y = Math.round(33 - 10 * t - Math.sin(t * Math.PI) * 6);
		if (i % 2 === 0 && !isLand(x, y)) {
			set(chart, x, y, C.brickRed);
		}
	}
}

/**
 * One rolled end of the chart: a parchment cylinder across the table, lit along its top.
 * @param {Canvas} chart
 * @param {number} top - The roll's first row
 */
function drawRoll(chart, top) {
	const rows = [C.creamShade, C.creamLight, C.cream, C.creamShade];
	rows.forEach((colour, j) => {
		for (let x = MAP.left - 1; x <= MAP.right + 1; x++) {
			set(chart, x, top + j, colour);
		}
	});
	// The roll's shadowed ends.
	for (const x of [MAP.left - 1, MAP.right + 1]) {
		set(chart, x, top + 1, C.plasterShade);
		set(chart, x, top + 2, C.plasterShade);
	}
}

/**
 * Brass-handled dividers lying open on the chart, their steel points walking off a course.
 * @param {Canvas} scene
 */
function drawDividers(scene) {
	const hinge = { x: 31, y: 14 };
	for (const [ex, ey] of [
		[35, 32],
		[40, 29],
	]) {
		line(scene, hinge.x, hinge.y, ex, ey, C.gold);
		line(scene, hinge.x + 1, hinge.y, ex + 1, ey, C.amber);
		// The steel needle at the leg's end.
		const nx = ex + Math.sign(ex - hinge.x);
		const ny = ey + 1;
		set(scene, ex, ey, C.stoneLight);
		set(scene, ex + 1, ey, C.stone);
		set(scene, nx, ny, C.stoneLight);
	}
	paint(scene, hinge.x - 1, hinge.y - 2, ['.gg.', 'gGGa', 'gkka', '.aa.'], {
		g: C.gold,
		G: C.lampGlow,
		a: C.amber,
		k: C.lampFrame,
	});
}

/**
 * A squat glass inkwell on the chart's near corner, full of black ink.
 * @param {Canvas} scene
 */
function drawInkwell(scene) {
	paint(
		scene,
		6,
		42,
		[
			'..ssss..',
			'.sKKKKs.',
			'.sKKKKs.',
			'bnnnnnnb',
			'bNNNNNnb',
			'bNNNNNnb',
			'bNNNNnnb',
			'.bbbbbb.',
		],
		{
			s: C.stoneShade,
			K: C.ink,
			b: C.roofShade,
			n: C.roof,
			N: C.roofLight,
		}
	);
}

/**
 * A white quill standing in the inkwell and leaning out over the table: a broad vane on one side of the shaft, a narrow one on the other.
 * @param {Canvas} scene
 */
function drawQuill(scene) {
	paint(
		scene,
		1,
		27,
		[
			'..W.......',
			'.WWg......',
			'.WWWg.....',
			'WWWWg.....',
			'.WWWsg....',
			'.WWWWsg...',
			'..WWWWsg..',
			'..WWWWsg..',
			'...WWWWsg.',
			'....WWWsg.',
			'.....WWsg.',
			'......Ws..',
			'.......s..',
			'.......s..',
			'........s.',
			'........s.',
		],
		{ W: C.white, g: C.cloudShade, s: C.creamShade }
	);
}

/**
 * A candle in a brass chamberstick, standing on the chart's far corner to hold it flat.
 * @param {Canvas} scene
 */
function drawCandle(scene) {
	paint(
		scene,
		46,
		6,
		[
			'.......kk.......',
			'......cCCs......',
			'......cCCs......',
			'.....ccCCs......',
			'.....c.CCs......',
			'......cCCs......',
			'......cCCs......',
			'....aacCCsaa....',
			'.gGGGGGGGGGGGa.hh',
			'gGaaaaaaaaaaaad.h',
			'.dddddddddddddhh.',
		],
		{
			k: C.wood,
			c: C.creamLight,
			C: C.cream,
			s: C.creamShade,
			g: C.gold,
			G: C.lampGlow,
			a: C.amber,
			d: C.lampFrame,
			h: C.brass,
		}
	);
}

/**
 * Soft shadows the tools cast on the chart, away from the candle (down and to the left).
 * @param {Canvas} scene - The tools, before their outline
 * @param {Canvas} chart
 */
function castShadows(scene, chart) {
	/** @type {Set<number>} */
	const shade = new Set();
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const inside = x >= 2 && y < 62;
			if (inside && get(scene, x, y) && !get(scene, x - 2, y + 2)) {
				shade.add((y + 2) * 64 + x - 2);
			}
		}
	}
	for (const i of shade) {
		const behind = chart.p[i];
		if (behind) {
			chart.p[i] = mix(behind, C.timberShade, 0.35);
		}
	}
}

/**
 * Darkens the room away from the candle in bands, so the far corner of the chart dims and the table falls into the night.
 * @param {Canvas} scene
 */
function drawNight(scene) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const d = Math.hypot(x - FLAME.x, y - FLAME.y);
			const band = Math.max(0, Math.min(3, Math.floor((d - 20) / 14)));
			const behind = scene.p[y * 64 + x];
			if (band && behind && behind !== C.ink) {
				scene.p[y * 64 + x] = mix(behind, C.night, band * 0.17);
			}
		}
	}
}

/**
 * The candle flame, drawn last so the glow leaves it at full strength.
 * @param {Canvas} scene
 */
function drawFlame(scene) {
	paint(
		scene,
		FLAME.x - 2,
		FLAME.y - 3,
		['..w...', '..Ww..', '.wWWw.', '.WGGW.', '.WGGW.', '..aa..'],
		{ w: C.gold, W: C.lampGlow, G: C.white, a: C.amber }
	);
}
