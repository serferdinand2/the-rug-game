// Light Bulb: a big glowing filament bulb hanging on its cord in a brass socket, lighting a dark workshop over a snuffed candle stub.
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

/** The bulb's globe: its centre and radius. The neck rises from it to the screw base. */
const BULB = { x: 32, y: 34, r: 14 };

/** The rows of the socket's parts: the cap, the shell, and the screw base the glass is sealed into. */
const SOCKET = { cap: 7, shell: 10, base: 15, neck: 19 };

/** Where the filament burns hottest; the glow spreads from here. */
const HEART = { x: 32, y: 36 };

/** The bench top's first row. */
const BENCH = 54;

/** The snuffed candle: its stub's left column and top row. */
const CANDLE = { x: 45, y: 46 };

/** The plank wall in the dark: board, lit edge and seam. */
const PLANK = mix(C.timberShade, C.night, 0.45);
const PLANK_LIGHT = mix(C.timber, C.night, 0.45);
const SEAM = mix(C.wood, C.ink, 0.55);

/** The glowing glass, from its white-hot heart out to its warm rim. */
const GLASS_HOT = C.lampGlow;
const GLASS = mix(C.lampGlow, C.gold, 0.45);
const GLASS_WARM = mix(C.gold, C.amber, 0.25);
const GLASS_RIM = mix(C.amber, C.gold, 0.2);

/** Copper wire and the cloth-covered cord. */
const COPPER = mix(C.amber, C.brickRed, 0.45);
const COPPER_SHADE = mix(C.brickRedShade, C.amber, 0.3);
const CORD = mix(C.brickRedShade, C.wood, 0.4);
const CORD_LIGHT = mix(C.brickRedShade, C.timberLight, 0.35);

/** The lead wires inside the glass. */
const WIRE = C.stoneShade;

/** The socket's brass between its lit and shaded sides. */
const BRASS_MID = mix(C.amber, C.lampFrame, 0.4);

/**
 * Draws the Light Bulb tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(3907);

	drawWall(layer, random);

	drawTools(scene);
	drawBench(scene, random);
	drawCandle(scene);
	drawCord(scene);
	drawSocket(scene);
	drawGlass(scene);
	drawFilament(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	glow(scene, {
		x: HEART.x,
		y: HEART.y,
		radius: 50,
		colour: C.lampGlow,
		strength: 0.45,
		steps: 6,
		skip: [
			C.ink,
			GLASS_HOT,
			GLASS,
			GLASS_WARM,
			GLASS_RIM,
			C.white,
			BRASS_MID,
			C.lampFrame,
			WIRE,
		],
	});
	drawSmoke(scene);
	drawGleams(scene);
	return scene;
}

/**
 * The workshop wall: dark upright planks with seams, knots and nail heads.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawWall(layer, random) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const board = x % 7;
			let colour = PLANK;
			if (board === 0) {
				colour = SEAM;
			} else if (board === 1) {
				colour = PLANK_LIGHT;
			}
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 30; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.floor(random() * 64);
		if (get(layer, x, y) === PLANK) {
			set(layer, x, y, random() > 0.5 ? PLANK_LIGHT : SEAM);
		}
	}
}

/**
 * The half-width of the glass on a row: the round globe, joined to the screw base by a widening neck.
 * @param {number} y
 * @returns {number} 0 where the row misses the glass.
 */
function glassHalf(y) {
	const dy = y - BULB.y;
	const globe = Math.abs(dy) < BULB.r ? Math.sqrt(BULB.r ** 2 - dy ** 2) : 0;
	const neck =
		y >= SOCKET.neck && y <= BULB.y ? 4 + (y - SOCKET.neck) * 0.45 : 0;
	return Math.max(globe, neck);
}

/**
 * The cord hanging from the top of the frame: a twisted cloth flex.
 * @param {Canvas} scene
 */
function drawCord(scene) {
	for (let y = 0; y < SOCKET.cap; y++) {
		const twist = y % 3;
		set(scene, BULB.x - 1, y, twist === 0 ? CORD_LIGHT : CORD);
		set(scene, BULB.x, y, twist === 1 ? CORD_LIGHT : CORD);
	}
}

/**
 * The brass socket: a small cap, a ribbed shell with its turning key, and the threaded screw base of the bulb.
 * @param {Canvas} scene
 */
function drawSocket(scene) {
	const cx = BULB.x;
	/**
	 * One row of brass, lit on the left and shaded on the right.
	 * @param {number} y
	 * @param {number} half
	 * @param {Colour} [mid=BRASS_MID]
	 */
	const band = (y, half, mid = BRASS_MID) => {
		for (let x = cx - half; x <= cx + half - 1; x++) {
			let colour = mid;
			if (x <= cx - half + 1) {
				colour = x === cx - half + 1 ? C.gold : C.brass;
			} else if (x >= cx + half - 2) {
				colour = C.lampFrame;
			}
			set(scene, x, y, colour);
		}
	};
	// The cap round the cord.
	band(SOCKET.cap, 2);
	band(SOCKET.cap + 1, 3);
	band(SOCKET.cap + 2, 4);
	// The shell, with a rib round it.
	for (let y = SOCKET.shell; y < SOCKET.base; y++) {
		band(y, 5, y === SOCKET.shell + 2 ? C.lampFrame : BRASS_MID);
	}
	set(scene, cx - 4, SOCKET.shell + 1, C.lampGlow);
	// The turning key on the right side.
	rect(scene, cx + 5, SOCKET.shell + 2, 2, 1, C.brass);
	rect(scene, cx + 7, SOCKET.shell + 1, 2, 3, C.gold);
	set(scene, cx + 8, SOCKET.shell + 3, C.amber);
	// The bulb's screw base: diagonal threads.
	for (let y = SOCKET.base; y < SOCKET.neck; y++) {
		for (let x = cx - 4; x <= cx + 3; x++) {
			const thread = (x + y * 2) % 4 < 2;
			let colour = thread ? C.brass : BRASS_MID;
			if (x === cx + 3) {
				colour = C.lampFrame;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The glass: brightest round the filament, warmer towards the rim, with a glass stem rising inside it.
 * @param {Canvas} scene
 */
function drawGlass(scene) {
	for (let y = SOCKET.neck; y <= BULB.y + BULB.r; y++) {
		const half = glassHalf(y);
		for (
			let x = Math.ceil(BULB.x - half);
			x <= Math.floor(BULB.x + half - 0.5);
			x++
		) {
			const d = Math.hypot(x - HEART.x, y - HEART.y);
			const edge = half - Math.abs(x - BULB.x + 0.5);
			let colour = GLASS_WARM;
			if (d < 10) {
				colour = GLASS;
			}
			if (edge < 1.2 || (y > BULB.y && BULB.y + BULB.r - y < 1)) {
				colour = GLASS_RIM;
			}
			set(scene, x, y, colour);
		}
	}
	// The glass stem the lead wires run down, from the neck to the middle of the globe.
	for (let y = SOCKET.neck; y <= BULB.y - 4; y++) {
		set(scene, BULB.x - 1, y, C.creamShade);
		set(scene, BULB.x, y, y < BULB.y - 6 ? C.cream : C.creamShade);
	}
	rect(scene, BULB.x - 2, BULB.y - 4, 4, 1, C.creamShade);
}

/**
 * The lead wires from the stem and the zigzag filament strung between them, white-hot.
 * @param {Canvas} scene
 */
function drawFilament(scene) {
	const top = BULB.y - 3;
	line(scene, BULB.x - 2, top, BULB.x - 7, HEART.y + 2, WIRE);
	line(scene, BULB.x + 1, top, BULB.x + 6, HEART.y + 2, WIRE);
	// Two support wires to the filament's lower bends.
	line(scene, BULB.x - 1, top, BULB.x - 3, HEART.y + 4, WIRE);
	line(scene, BULB.x, top, BULB.x + 2, HEART.y + 4, WIRE);
	const points = [
		[BULB.x - 7, HEART.y + 2],
		[BULB.x - 5, HEART.y - 2],
		[BULB.x - 3, HEART.y + 4],
		[BULB.x - 1, HEART.y - 2],
		[BULB.x, HEART.y - 2],
		[BULB.x + 2, HEART.y + 4],
		[BULB.x + 4, HEART.y - 2],
		[BULB.x + 6, HEART.y + 2],
	];
	for (let i = 0; i < points.length - 1; i++) {
		const [x0, y0] = points[i];
		const [x1, y1] = points[i + 1];
		line(scene, x0, y0, x1, y1, C.white);
	}
	// The white-hot halo round the filament, over the glass but not the wires.
	/** @type {[number, number][]} */
	const halo = [];
	for (let y = HEART.y - 3; y <= HEART.y + 5; y++) {
		for (let x = BULB.x - 9; x <= BULB.x + 9; x++) {
			const here = get(scene, x, y);
			if (here !== GLASS && here !== GLASS_WARM) {
				continue;
			}
			const near = [
				[1, 0],
				[-1, 0],
				[0, 1],
				[0, -1],
			].some(([dx, dy]) => get(scene, x + dx, y + dy) === C.white);
			if (near) {
				halo.push([x, y]);
			}
		}
	}
	for (const [x, y] of halo) {
		set(scene, x, y, GLASS_HOT);
	}
}

/**
 * The tools on the wall: a saw and a coil of copper wire on the left, a hammer and a spanner on the right.
 * @param {Canvas} scene
 */
function drawTools(scene) {
	// The saw: a steel blade with teeth, its wooden handle to the right.
	for (let x = 2; x <= 13; x++) {
		const top = 17 + Math.floor((x - 2) / 4);
		for (let y = top; y <= 24; y++) {
			set(scene, x, y, y === top ? C.stoneLight : C.stone);
		}
		set(scene, x, 25, x % 2 === 0 ? C.stoneShade : C.stone);
	}
	rect(scene, 14, 17, 4, 8, C.timber);
	rect(scene, 14, 17, 1, 8, C.timberLight);
	rect(scene, 15, 19, 2, 3, C.timberShade);
	// The coil of copper wire on a nail.
	for (let y = 30; y <= 44; y++) {
		for (let x = 2; x <= 16; x++) {
			const d = Math.hypot(x - 9, y - 37);
			if (d >= 4.2 && d < 7) {
				const strand = Math.floor(d * 2) % 2 === 0;
				set(scene, x, y, strand ? COPPER : COPPER_SHADE);
			}
		}
	}
	set(scene, 9, 30, C.stoneLight);
	// The hammer, hanging head down.
	rect(scene, 54, 12, 2, 18, C.timberLight);
	rect(scene, 55, 12, 1, 18, C.timber);
	rect(scene, 51, 30, 9, 3, C.stone);
	rect(scene, 51, 30, 9, 1, C.stoneLight);
	rect(scene, 58, 30, 2, 3, C.stoneShade);
	// The spanner, its open jaw at the top.
	rect(scene, 60, 18, 2, 16, C.stone);
	rect(scene, 60, 18, 1, 16, C.stoneLight);
	rect(scene, 59, 14, 4, 4, C.stone);
	rect(scene, 60, 14, 2, 2, SEAM);
	set(scene, 59, 14, C.stoneLight);
}

/**
 * The workbench: a worn top with a lit front edge, a drawer, and pliers lying on it.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawBench(scene, random) {
	rect(scene, 0, BENCH, 64, 1, C.timberLight);
	rect(scene, 0, BENCH + 1, 64, 3, C.timber);
	rect(scene, 0, BENCH + 4, 64, 1, C.timberShade);
	for (let i = 0; i < 10; i++) {
		const x = Math.floor(random() * 64);
		set(scene, x, BENCH + 1 + Math.floor(random() * 3), C.timberShade);
	}
	// The front, in shadow, with a drawer and its brass knob.
	rect(scene, 0, BENCH + 5, 64, 64 - BENCH - 5, C.wood);
	rect(scene, 18, BENCH + 6, 28, 4, C.timberShade);
	rect(scene, 18, BENCH + 6, 28, 1, C.timber);
	set(scene, 31, BENCH + 8, C.gold);
	set(scene, 32, BENCH + 8, C.brass);
	// The pliers on the bench top, at the left.
	line(scene, 6, BENCH - 1, 14, BENCH - 3, C.brickRed);
	line(scene, 6, BENCH, 14, BENCH - 2, C.brickRedShade);
	line(scene, 15, BENCH - 3, 19, BENCH - 4, C.stoneLight);
	line(scene, 15, BENCH - 2, 19, BENCH - 2, C.stone);
	set(scene, 15, BENCH - 3, C.stoneShade);
}

/**
 * The snuffed candle stub in a brass chamberstick, its wick bent and black, wax run down its side.
 * @param {Canvas} scene
 */
function drawCandle(scene) {
	const { x, y } = CANDLE;
	// The dish, with its ring handle on the right.
	rect(scene, x - 3, BENCH - 2, 11, 1, C.brass);
	set(scene, x - 3, BENCH - 2, C.gold);
	rect(scene, x - 4, BENCH - 1, 13, 1, BRASS_MID);
	rect(scene, x + 6, BENCH - 1, 3, 1, C.lampFrame);
	set(scene, x + 9, BENCH - 4, C.brass);
	set(scene, x + 10, BENCH - 3, C.brass);
	set(scene, x + 10, BENCH - 2, BRASS_MID);
	set(scene, x + 9, BENCH - 2, BRASS_MID);
	// The stub: short, lit on the left, with a drip of wax.
	for (let j = y; j < BENCH - 2; j++) {
		for (let i = x; i < x + 5; i++) {
			let colour = C.cream;
			if (i === x) {
				colour = C.creamLight;
			} else if (i === x + 4) {
				colour = C.creamShade;
			}
			set(scene, i, j, colour);
		}
	}
	set(scene, x + 1, y, C.creamShade);
	set(scene, x + 3, y, C.creamShade);
	set(scene, x - 1, y + 1, C.creamLight);
	set(scene, x - 1, y + 2, C.cream);
	// The black wick.
	set(scene, x + 2, y - 1, C.night);
	set(scene, x + 3, y - 2, C.night);
}

/**
 * A thin thread of smoke curling up from the snuffed wick, painted without an outline.
 * @param {Canvas} scene
 */
function drawSmoke(scene) {
	const { x, y } = CANDLE;
	const smoke = mix(C.stoneLight, C.cloudShade, 0.4);
	const faint = mix(C.stone, C.stoneLight, 0.5);
	for (let i = 0; i < 10; i++) {
		const sx =
			x + 3 + Math.round(Math.sin(i / 2) * 1.5) + Math.floor(i / 4);
		set(scene, sx, y - 3 - i, i < 7 ? smoke : faint);
	}
}

/**
 * The gleams of the glass and the brass, painted last.
 * @param {Canvas} scene
 */
function drawGleams(scene) {
	// The glass's reflection: a curved streak on the upper left.
	for (const [x, y] of [
		[22, 29],
		[22, 30],
		[22, 31],
		[23, 28],
		[24, 27],
		[23, 33],
	]) {
		set(scene, x, y, C.white);
	}
}
