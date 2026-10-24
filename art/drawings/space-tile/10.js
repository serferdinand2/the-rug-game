// Space tile 10 (Invent and upgrade): a vast derelict alien hulk drifting in cold space, a bite torn out of its ridge where bare ribs stand against the stars and its green core blazes out, torn plates tumbling away.
import {
	createCanvas,
	get,
	set,
	paint,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { glow } from '../../effects.js';
import { PALETTE as C } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The hulk's long axis: a point on it, and its tilt, the bow raised to the right. */
const AXIS = { x: 30, y: 31, angle: -0.12 };
const COS = Math.cos(AXIS.angle);
const SIN = Math.sin(AXIS.angle);

/** The hull: its half-depth amidships, where the bow begins to taper, and the bow's point, along the axis. */
const HULL_SHAPE = { depth: 12, shoulder: 0, bow: 30 };

/** The wound torn through the flank: its centre along and across the axis. */
const WOUND = { s: -5, t: -1 };

/** The wound's half-length and half-depth: a rounded tear, ragged only gently. */
const TEAR = { a: 13.5, b: 7.5 };

/** The bite the blast tore out of the ridge above the wound, open to space: its middle along the axis, its half-length, and how deep it cuts below the ridge at its middle. */
const BITE = { s: -6, half: 10, depth: 8 };

/** The ribs of the frame crossing the wound, along the axis, and the row across the axis each still reaches up to; the others have snapped. */
const RIBS = [
	{ s: -12.5, end: -Infinity },
	{ s: -6.5, end: 0 },
];

/** The core, laid bare in the floor of the bite and blazing out into space: its centre along and across the axis, and its radius. */
const CORE = { s: -1.5, t: -5, r: 3.2 };

/** The conduit along the floor of the hold: its row across the axis, and its lit nodes along it. */
const CONDUIT = { t: 4, nodes: [-15.5, -9.5, -3.5, 8] };

/** The belly nacelles: where each runs along the axis, as from and to, and how deep it hangs. */
const NACELLES = [
	{ from: -34, to: -12, depth: 4 },
	{ from: 2, to: 14, depth: 3 },
];

/** The distant cold sun at the upper left that lights the hulk. */
const SUN = { x: 13, y: 9 };

/** Cold space, from the sunward corner to the far corner. */
const SPACE = [
	mix(C.stoneShade, C.nightSea2, 0.45),
	mix(C.stoneShade, C.nightSea3, 0.65),
	mix(C.nightSea3, C.night, 0.45),
	mix(C.night, C.nightSea3, 0.25),
	mix(C.ink, C.nightSea3, 0.2),
];

/** Cold starlight in three brightnesses. */
const STARS = [
	C.white,
	mix(C.starDim, C.foam, 0.45),
	mix(C.starDim, C.nightSea3, 0.5),
];

/** The carapace's blue-grey, from the sunlit ridge down to the dark belly. */
const SHELL = {
	glint: mix(C.snowShade, C.foam, 0.3),
	light: mix(C.stone, C.daySky4, 0.3),
	main: mix(C.stoneMid, C.nightSea2, 0.3),
	mid: mix(C.stoneShade, C.nightSea2, 0.25),
	shade: mix(C.stoneShade, C.nightSea3, 0.5),
	deep: mix(C.stoneShade, C.nightSea3, 0.75),
};

/** The hold's green light, from the white-hot heart out to the dark by the torn edge. */
const GREEN = {
	core: mix(C.ghostLight, C.white, 0.4),
	light: C.ghostLight,
	main: C.ghost,
	mid: mix(C.ghost, C.ghostShade, 0.5),
	shade: C.ghostShade,
	dark: mix(C.ghostShade, C.night, 0.5),
};

/** Machinery and the ship's inner frame against the glow. */
const MACHINE = mix(C.night, C.ink, 0.5);
const MACHINE_LIT = mix(C.ghostShade, C.night, 0.45);

/** Soot scorched into the carapace. */
const SOOT = mix(C.stoneShade, C.ink, 0.5);

/** The torn plates' edges, lit green by the hold, and in the shadow below it. */
const TORN = mix(SHELL.main, C.ghost, 0.45);
const TORN_DARK = mix(SHELL.shade, C.ghostShade, 0.45);

/**
 * Draws space tile 10.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const random = seededRandom(1010);

	drawSpace(layer, random);

	const hulk = createCanvas(64, 64);
	drawNacelles(hulk);
	drawShell(hulk);
	drawLance(hulk);
	drawSpines(hulk);
	drawRibs(hulk);
	drawDebris(hulk);
	outline(hulk, C.ink);
	drawHold(hulk);
	const open = hulk.p.map((colour) => colour === null);
	underlay(hulk, layer);

	// The core's light spilling over the torn hull and out into space.
	glow(hulk, {
		x: toX(CORE.s, CORE.t),
		y: toY(CORE.s, CORE.t),
		radius: 12,
		colour: C.ghost,
		strength: 0.28,
		steps: 3,
		skip: [...Object.values(GREEN), MACHINE, MACHINE_LIT, C.ink],
	});
	drawVapour(hulk, open, random);
	return hulk;
}

/**
 * How far along the axis a pixel lies, towards the bow.
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function along(x, y) {
	return (x + 0.5 - AXIS.x) * COS + (y + 0.5 - AXIS.y) * SIN;
}

/**
 * How far across the axis a pixel lies: negative towards the ridge, positive towards the belly.
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function across(x, y) {
	return -(x + 0.5 - AXIS.x) * SIN + (y + 0.5 - AXIS.y) * COS;
}

/**
 * The column of a point given along and across the axis.
 * @param {number} s
 * @param {number} t
 * @returns {number}
 */
function toX(s, t) {
	return Math.round(AXIS.x + s * COS - t * SIN - 0.5);
}

/**
 * The row of a point given along and across the axis.
 * @param {number} s
 * @param {number} t
 * @returns {number}
 */
function toY(s, t) {
	return Math.round(AXIS.y + s * SIN + t * COS - 0.5);
}

/**
 * The hull's half-depth at a point along the axis: full amidships, tapering to the bow's point;
 * the belly is flatter than the ridge.
 * @param {number} s
 * @param {boolean} ridge - Whether to measure the ridge side
 * @returns {number}
 */
function halfDepth(s, ridge) {
	const { depth, shoulder, bow } = HULL_SHAPE;
	let h = depth;
	if (s > shoulder) {
		h = depth * Math.max(0, 1 - ((s - shoulder) / (bow - shoulder)) ** 1.5);
	}
	return ridge ? h : h * 0.78;
}

/**
 * How far a point lies from the wound's centre, scaled so its ragged edge is 1: below 1 inside the wound,
 * and about 1.1 one pixel outside it. The tear is a rounded box whose edge wavers gently.
 * @param {number} s
 * @param {number} t
 * @returns {number}
 */
function woundReach(s, t) {
	const ds = (s - WOUND.s) / TEAR.a;
	const dt = (t - WOUND.t) / TEAR.b;
	const angle = Math.atan2(dt, ds);
	const jag =
		1 + 0.07 * Math.sin(4 * angle + 1) + 0.05 * Math.sin(7 * angle + 2);
	return (Math.abs(ds) ** 3 + Math.abs(dt) ** 3) ** (1 / 3) / jag;
}

/**
 * How deep the bite cuts below the ridge at a point along the axis, ragged at its floor; zero or less outside it.
 * @param {number} s
 * @returns {number}
 */
function biteDepth(s) {
	return (
		BITE.depth * (1 - ((s - BITE.s) / BITE.half) ** 2) +
		0.9 * Math.sin(s * 1.7)
	);
}

/**
 * Tells whether a point of the hull has been torn away by the bite, leaving open space.
 * @param {number} s
 * @param {number} t
 * @returns {boolean}
 */
function bitten(s, t) {
	const depth = biteDepth(s);
	return depth > 0 && t < -halfDepth(s, true) + depth;
}

/**
 * Cold, empty space: a blue-grey gradient from the sun's corner to the far corner, stars in three brightnesses,
 * a few sparkles and the small cold sun itself.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawSpace(layer, random) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const t =
				Math.min(0.999, Math.hypot(x - SUN.x, y - SUN.y) / 70) *
				SPACE.length;
			let band = Math.floor(t);
			if (t - band > 0.65 && (x + y) % 2 === 0) {
				band = Math.min(SPACE.length - 1, band + 1);
			}
			set(layer, x, y, SPACE[band]);
		}
	}
	for (let i = 0; i < 64; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.floor(random() * 64);
		const brightness = random();
		set(
			layer,
			x,
			y,
			STARS[brightness > 0.8 ? 0 : brightness > 0.45 ? 1 : 2]
		);
	}
	for (const [x, y] of [
		[52, 7],
		[6, 33],
		[57, 52],
	]) {
		set(layer, x, y, C.white);
		for (const [dx, dy] of [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1],
		]) {
			set(layer, x + dx, y + dy, STARS[1]);
		}
	}
	glow(layer, {
		x: SUN.x,
		y: SUN.y,
		radius: 10,
		colour: C.foam,
		strength: 0.35,
		steps: 3,
	});
	for (const [dx, dy] of [
		[0, 0],
		[1, 0],
		[-1, 0],
		[0, 1],
		[0, -1],
	]) {
		set(layer, SUN.x + dx, SUN.y + dy, C.white);
	}
	for (const [dx, dy] of [
		[2, 0],
		[-2, 0],
		[0, 2],
		[0, -2],
		[3, 0],
		[-3, 0],
	]) {
		set(layer, SUN.x + dx, SUN.y + dy, mix(C.white, C.foam, 0.5));
	}
}

/**
 * The carapace: long armour planes split by chine lines that run to the bow's point, sunlit along the ridge
 * and dark along the belly, crossed by plate grooves each with a raised lip, with the bite torn out of its ridge;
 * a row of dead ports, a ring of scorching round the wound and a dead breach near the bow.
 * @param {Canvas} hulk
 */
function drawShell(hulk) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const s = along(x, y);
			const t = across(x, y);
			const h = halfDepth(s, t < 0);
			if (h <= 0 || Math.abs(t) > h || bitten(s, t)) {
				continue;
			}
			set(hulk, x, y, shellColour(s, t / h));
		}
	}
	// A row of tiny dead ports along the flank, for the hulk's size; one still faintly lit.
	for (let s = -32; s <= 20; s += 3) {
		if (woundReach(s, -2.5) < 1.6 || bitten(s, -2.5)) {
			continue;
		}
		set(
			hulk,
			toX(s, -2.5),
			toY(s, -2.5),
			s === 13 ? GREEN.shade : SHELL.deep
		);
	}
	// Scorching round the wound, and a dead breach near the bow, dark and cold.
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const s = along(x, y);
			const t = across(x, y);
			const reach = woundReach(s, t);
			const scorch = reach < 1.18 + 0.1 * Math.sin(s * 1.3 + t * 0.7);
			if (scorch && get(hulk, x, y) && t > WOUND.t) {
				set(hulk, x, y, SOOT);
			}
			const breach = Math.hypot((s - 17) / 2.6, (t + 1) / 1.5);
			if (breach < 1 + 0.2 * Math.sin(Math.atan2(t + 1, s - 17) * 5)) {
				set(hulk, x, y, breach < 0.55 ? C.ink : SOOT);
			}
		}
	}
}

/**
 * The colour of one point of the carapace.
 * @param {number} s - Along the axis
 * @param {number} v - Across the hull, from the ridge (-1) to the belly (1)
 * @returns {Colour}
 */
function shellColour(s, v) {
	/** The planes from the ridge down, each with the colour of its plate grooves and of their lips. */
	const planes = [
		{ to: -0.8, base: SHELL.glint, groove: SHELL.light, lip: SHELL.glint },
		{ to: -0.36, base: SHELL.light, groove: SHELL.main, lip: SHELL.glint },
		{ to: -0.29, base: SHELL.mid, groove: SHELL.mid, lip: SHELL.mid },
		{ to: 0.36, base: SHELL.main, groove: SHELL.mid, lip: SHELL.light },
		{ to: 0.43, base: SHELL.deep, groove: SHELL.deep, lip: SHELL.deep },
		{ to: 0.8, base: SHELL.shade, groove: SHELL.deep, lip: SHELL.main },
		{ to: 1.01, base: SHELL.deep, groove: SHELL.deep, lip: SHELL.shade },
	];
	const plane = planes.find(({ to }) => v < to) ?? planes[planes.length - 1];
	const plate = (s + 70) % 7;
	if (plate < 1) {
		return plane.groove;
	}
	if (plate < 2) {
		return plane.lip;
	}
	return plane.base;
}

/**
 * A long lance reaching forward from the bow's point, snapped off near its tip.
 * @param {Canvas} hulk
 */
function drawLance(hulk) {
	for (let k = 0; k <= 7; k++) {
		const s = HULL_SHAPE.bow - 2 + k;
		set(hulk, toX(s, -0.5), toY(s, -0.5), k > 5 ? TORN : SHELL.light);
		if (k < 5) {
			set(hulk, toX(s, 0.6), toY(s, 0.6), SHELL.shade);
		}
	}
}

/**
 * Long nacelles slung under the belly, ringed with bands.
 * @param {Canvas} hulk
 */
function drawNacelles(hulk) {
	for (const { from, to, depth } of NACELLES) {
		for (let y = 0; y < 64; y++) {
			for (let x = 0; x < 64; x++) {
				const s = along(x, y);
				const t = across(x, y);
				if (s < from || s > to) {
					continue;
				}
				const top = halfDepth(s, false) - 0.5;
				const round = Math.min(1, (s - from) / 2.5, (to - s) / 2.5);
				const bottom = top + depth * Math.sqrt(Math.max(0, round));
				if (t < top || t > bottom) {
					continue;
				}
				const v = (t - top) / depth;
				let colour =
					v < 0.2
						? SHELL.deep
						: v < 0.5
							? SHELL.main
							: v < 0.8
								? SHELL.mid
								: SHELL.shade;
				if (Math.round(s) % 5 === 0 && v >= 0.2) {
					colour = v < 0.5 ? SHELL.light : SHELL.main;
				}
				set(hulk, x, y, colour);
			}
		}
	}
}

/**
 * Spines along the ridge, standing out from the carapace, some of them snapped; those over the bite are gone.
 * @param {Canvas} hulk
 */
function drawSpines(hulk) {
	for (const [s, length] of [
		[-29, 3],
		[-23, 5],
		[-17, 2],
		[-11, 5],
		[-5, 4],
		[1, 1],
		[7, 4],
		[13, 2],
	]) {
		if (biteDepth(s) > 0) {
			continue;
		}
		const h = halfDepth(s, true);
		for (let k = 0; k <= length; k++) {
			const x = toX(s - k * 0.3, -h - k);
			const y = toY(s - k * 0.3, -h - k);
			set(hulk, x, y, k === length ? SHELL.glint : SHELL.light);
			// Thick at the root, shaded on the side away from the sun.
			if (k < length - 1) {
				set(hulk, x + 1, y, SHELL.main);
			}
		}
	}
}

/**
 * Where a rib crosses the wound, along the axis at a row across it: it bows gently with the hull.
 * @param {{ s: number, end: number }} rib
 * @param {number} t
 * @returns {number}
 */
function ribAt(rib, t) {
	// A snapped rib's broken end is bent over towards the bow.
	const bent = rib.end > -Infinity && t < rib.end + 1.5 ? 1 : 0;
	return rib.s + bent + 0.012 * (t - WOUND.t) ** 2;
}

/**
 * Half a rib's width at a row across the axis: thick at its root in the floor, tapering towards the ridge.
 * @param {number} t
 * @returns {number}
 */
function ribHalf(t) {
	return t > -2 ? 1.5 : t > -8 ? 1.1 : 0.6;
}

/**
 * The ribs where they stand bare in the bite against space, lit by the sun; inside the hold they are
 * painted with it, black against its glow.
 * @param {Canvas} hulk
 */
function drawRibs(hulk) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const s = along(x, y);
			const t = across(x, y);
			if (!bitten(s, t) || t < -halfDepth(s, true)) {
				continue;
			}
			for (const rib of RIBS) {
				const off = s - ribAt(rib, t);
				if (Math.abs(off) < ribHalf(t) && t >= rib.end) {
					const tip = t < Math.max(rib.end, -halfDepth(s, true)) + 1;
					set(
						hulk,
						x,
						y,
						tip ? SHELL.glint : off < 0 ? SHELL.light : SHELL.main
					);
				}
			}
		}
	}
}

/**
 * Torn plates and spars tumbling away from the wound, each turned a different way.
 * @param {Canvas} hulk
 */
function drawDebris(hulk) {
	const keys = {
		l: SHELL.light,
		m: SHELL.main,
		s: SHELL.shade,
		g: TORN,
		k: SHELL.glint,
	};
	/** @type {[number, number, string[]][]} */
	const pieces = [
		[23, 47, ['..kl', '.lms', 'lms.', 'gs..']],
		[36, 50, ['kllk.', '.mmsg']],
		[30, 56, ['l', 'm', 's']],
		[45, 46, ['kl', 'ms']],
		[16, 53, ['.kl', 'lm.']],
		[49, 55, ['lg', '.s']],
		[38, 57, ['..kkl', '.llmms', 'lmmss.', '.gs...']],
	];
	for (const [x, y, rows] of pieces) {
		paint(hulk, x, y, rows, keys);
	}
}

/**
 * The hold seen through the wound below the bite, painted after the outline so its glow meets the torn edge
 * directly: the core blazing in the floor of the bite, two ribs black against the glow, a conduit with lit nodes
 * along the floor, a green-lit back wall, and the torn plate edges round it all.
 * @param {Canvas} hulk
 */
function drawHold(hulk) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const s = along(x, y);
			const t = across(x, y);
			const reach = woundReach(s, t);
			// The core shows wherever the hull is open, in the hold or rising into the bite.
			const core = Math.hypot(s - CORE.s, t - CORE.t);
			if (core < CORE.r && (reach <= 1 || bitten(s, t))) {
				set(
					hulk,
					x,
					y,
					core < CORE.r * 0.55 ? GREEN.core : GREEN.light
				);
				continue;
			}
			if (reach > 1.1 || !get(hulk, x, y) || bitten(s, t)) {
				continue;
			}
			if (reach > 1) {
				// The torn rim: plate edges bent inwards, sunlit above and lit green below.
				set(hulk, x, y, t < WOUND.t - 1 ? SHELL.glint : TORN_DARK);
				continue;
			}
			set(hulk, x, y, holdColour(s, t, reach));
		}
	}
}

/**
 * The colour of one point inside the hold.
 * @param {number} s - Along the axis
 * @param {number} t - Across the axis
 * @param {number} reach - How far out towards the torn edge, from 0 to 1
 * @returns {Colour}
 */
function holdColour(s, t, reach) {
	// The ribs, black against the glow, rimmed with its light on the side towards the core.
	for (const rib of RIBS) {
		const at = ribAt(rib, t);
		const off = s - at;
		if (Math.abs(off) < ribHalf(t) && t >= rib.end) {
			const towards = Math.sign(CORE.s - at) === Math.sign(off);
			return towards && Math.abs(off) > 0.4 ? MACHINE_LIT : MACHINE;
		}
	}
	// The conduit along the floor, carrying the core: a round pipe, lit along its top, with glowing nodes.
	const pipe = t - CONDUIT.t;
	if (Math.abs(pipe) < 1) {
		if (CONDUIT.nodes.some((n) => Math.abs(s - n) < 1)) {
			return pipe < 0 ? GREEN.core : GREEN.light;
		}
		return pipe < -0.2 ? TORN : MACHINE;
	}
	// The back wall, lit by the core and darkening to the torn edge, its bands dithered soft.
	const wall =
		Math.hypot((s - CORE.s) / 14, (t - CORE.t) / 7) * 0.7 + reach * 0.3;
	const ramp = [GREEN.main, GREEN.mid, GREEN.shade, GREEN.dark];
	const step = wall / 0.24;
	const dither = (Math.round(s * 2) + Math.round(t * 2)) % 2 === 0;
	const band = Math.floor(step) + (step % 1 > 0.6 && dither ? 1 : 0);
	return ramp[Math.min(ramp.length - 1, band)];
}

/**
 * Green motes of vapour leaking from the wound and drifting down after the debris, over open space only.
 * @param {Canvas} canvas
 * @param {boolean[]} open - Which pixels the hulk, its debris and their outline left empty
 * @param {() => number} random
 */
function drawVapour(canvas, open, random) {
	for (let i = 0; i < 16; i++) {
		const x = 22 + Math.floor(random() * 26);
		const y = 41 + Math.floor(random() * 16);
		const shade = random() < 0.4 ? GREEN.main : GREEN.shade;
		if (open[y * 64 + x]) {
			set(canvas, x, y, shade);
		}
	}
}
