// Bakery: a golden domed loaf, newly risen and baked, on a wooden peel before the glowing mouth of a clay oven at night.
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

/** The clay oven's dome: its centre on the hearth row and its radii. */
const OVEN = { x: 12, y: 45, rx: 23, ry: 40 };

/** The oven's arched mouth: its centre column, its sill row, its width and its height. */
const MOUTH = { x: 12, sill: 42, w: 17, h: 17 };

/** Where the fire burns, deep in the mouth; the glow spreads from here. */
const FIRE = { x: 12, y: 36 };

/** The loaf: the centre and radii of its dome, and the row its flat base sits on. */
const LOAF = { x: 37, y: 37, rx: 18, ry: 15, base: 47 };

/** The peel's round blade under the loaf. */
const PEEL = { x: 37, y: 48, rx: 22, ry: 6 };

/** The little window high on the wall, onto the night. Its box includes the frame. */
const WINDOW = { x: 43, y: 2, w: 14, h: 15 };

/** The table's top row. */
const TABLE = 46;

/** The brick wall in the dark, its mortar, and the clay of the oven in four tones. */
const WALL = mix(C.brickRedShade, C.night, 0.66);
const WALL_LIGHT = mix(C.brickRedShade, C.night, 0.45);
const MORTAR = mix(C.night, C.ink, 0.5);
const CLAY_LIGHT = mix(C.timberLight, C.brickRed, 0.25);
const CLAY = mix(C.timber, C.brickRedShade, 0.3);
const CLAY_SHADE = mix(C.timberShade, C.brickRedShade, 0.35);
const CLAY_DARK = mix(C.timberShade, C.ink, 0.45);

/** The crust between amber and timber, and the dark inside the oven above the fire. */
const CRUST = mix(C.amber, C.timber, 0.45);
const HOT_DARK = mix(C.brickRedShade, C.ink, 0.35);

/** The peel's pale ash wood. */
const ASH_LIGHT = C.creamShade;
const ASH = mix(C.creamShade, C.sandShade, 0.55);
const ASH_SHADE = mix(C.sandShade, C.timber, 0.45);

/** The earthenware bowl. */
const POT_LIGHT = mix(C.brickRedLight, C.amber, 0.3);
const POT = mix(C.brickRed, C.timberLight, 0.45);
const POT_SHADE = mix(C.brickRedShade, C.timber, 0.4);

/** The blue gingham cloth over the dough: its checks where both stripes cross, where one does, and its shade. */
const CHECK = C.daySky1;
const CHECK_LIGHT = mix(C.daySky3, C.creamLight, 0.45);
const CHECK_SHADE = mix(C.daySky1, C.night, 0.35);

/**
 * Draws the Bakery tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(2391);

	drawWall(layer, random);
	drawWindow(layer);
	drawOven(layer, random);
	drawFire(layer, random);
	drawTable(layer, random);

	drawWheat(scene);
	drawPeel(scene, random);
	drawLoaf(scene, random);
	const bowl = createCanvas(64, 64);
	drawBowl(bowl);
	outline(bowl, C.ink);
	stamp(scene, bowl);
	outline(scene, C.ink);
	underlay(scene, layer);

	glow(scene, {
		x: FIRE.x,
		y: FIRE.y,
		radius: 54,
		colour: C.amber,
		strength: 0.24,
		steps: 4,
		skip: [C.ink, C.lampGlow, C.white],
	});
	drawGleams(scene);
	drawSteam(scene);
	return scene;
}

/**
 * The last glints of firelight on the glazed crust, painted over the outline.
 * @param {Canvas} scene
 */
function drawGleams(scene) {
	for (const [x, y] of [
		[24, 31],
		[24, 32],
		[25, 30],
		[26, 28],
		[27, 27],
	]) {
		set(scene, x, y, C.white);
	}
}

/**
 * The back wall: courses of dark brick, barely seen outside the firelight.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawWall(layer, random) {
	for (let y = 0; y < TABLE; y++) {
		const course = Math.floor(y / 4);
		const offset = (course % 2) * 4;
		for (let x = 0; x < 64; x++) {
			let colour = WALL;
			if (y % 4 === 3 || (x + offset) % 9 === 0) {
				colour = MORTAR;
			} else if (y % 4 === 0 && random() > 0.4) {
				colour = WALL_LIGHT;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * A small arched window high on the wall: a deep wooden frame round a pane of night sky with a crescent moon and stars.
 * @param {Canvas} layer
 */
function drawWindow(layer) {
	const { x, y, w, h } = WINDOW;
	const r = w / 2;
	const cx = x + r - 0.5;
	const spring = y + r;
	for (let j = y; j < y + h; j++) {
		for (let i = x; i < x + w; i++) {
			const d =
				j < spring ? Math.hypot(i - cx, j - spring) : Math.abs(i - cx);
			if (d >= r) {
				continue;
			}
			let colour = C.timber;
			if (d < r - 1.5 && j < y + h - 2) {
				const depth = (j - y) / h;
				colour =
					depth < 0.3
						? C.nightSky3
						: depth < 0.6
							? C.nightSky4
							: C.nightSky5;
			} else if (d >= r - 0.8 || j === y + h - 1) {
				colour = C.timberShade;
			}
			set(layer, i, j, colour);
		}
	}
	// The crescent moon and a few stars.
	for (let j = -3; j <= 3; j++) {
		for (let i = -3; i <= 3; i++) {
			const disc = i * i + j * j <= 10;
			const bite = (i - 2) ** 2 + (j + 1) ** 2 <= 6;
			if (disc && !bite) {
				set(layer, x + 7 + i, y + 6 + j, i < 0 ? C.moon : C.moonRim);
			}
		}
	}
	set(layer, x + 10, y + 4, C.white);
	set(layer, x + 4, y + 11, C.starDim);
	set(layer, x + 10, y + 10, C.starDim);
	// The sill, catching a little of the firelight.
	rect(layer, x - 1, y + h, w + 2, 1, C.timberLight);
	rect(layer, x - 1, y + h + 1, w + 2, 1, C.timberShade);
}

/**
 * The beehive oven: a clay dome, cracked and patched, with a brick arch round its mouth.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawOven(layer, random) {
	const { x: cx, y: cy, rx, ry } = OVEN;
	for (let y = cy - ry; y < TABLE; y++) {
		for (let x = 0; x <= cx + rx; x++) {
			const nx = (x - cx) / rx;
			const ny = (y - cy) / ry;
			const e = nx * nx + ny * ny;
			if (e >= 1) {
				continue;
			}
			// The dome is lit from the room's left; its curve darkens towards the rim.
			let colour = CLAY;
			if (e > 0.9) {
				colour = CLAY_DARK;
			} else if (e > 0.7 || nx > 0.45) {
				colour = CLAY_SHADE;
			} else if (nx < 0 && ny < -0.5 && e < 0.55) {
				colour = CLAY_LIGHT;
			}
			set(layer, x, y, colour);
		}
	}
	// Cracks in the clay.
	for (let i = 0; i < 22; i++) {
		const x = Math.floor(random() * (cx + rx));
		const y = Math.floor(cy - ry + 4 + random() * (ry - 22));
		if (get(layer, x, y) === CLAY || get(layer, x, y) === CLAY_LIGHT) {
			set(layer, x, y, CLAY_SHADE);
			set(layer, x + 1, y + 1, CLAY_SHADE);
		}
	}
	// The brick arch round the mouth.
	const left = MOUTH.x - Math.floor(MOUTH.w / 2);
	for (let y = MOUTH.sill - MOUTH.h - 3; y <= MOUTH.sill; y++) {
		for (let x = left - 3; x <= left + MOUTH.w + 2; x++) {
			const d = archDistance(x, y, 3);
			if (d >= 0 || archDistance(x, y) < 0) {
				continue;
			}
			const angle = Math.atan2(
				y - (MOUTH.sill - MOUTH.h + 9),
				x - MOUTH.x
			);
			const joint =
				Math.round(angle * 4) !== Math.round(angle * 4 + 0.15);
			set(layer, x, y, joint || d > -0.8 ? C.brickRedShade : C.brickRed);
		}
	}
	rect(layer, left - 4, MOUTH.sill + 1, MOUTH.w + 7, 2, C.stoneShade);
	rect(layer, left - 4, MOUTH.sill + 1, MOUTH.w + 7, 1, C.stone);
}

/**
 * How far a point lies outside the mouth's arch, in pixels; negative inside.
 * @param {number} x
 * @param {number} y
 * @param {number} [grow=0] - Widens the arch by this many pixels on every side
 * @returns {number}
 */
function archDistance(x, y, grow = 0) {
	const r = MOUTH.w / 2 + grow;
	const spring = MOUTH.sill - MOUTH.h + MOUTH.w / 2;
	if (y > MOUTH.sill) {
		return 99;
	}
	if (y >= spring) {
		return Math.abs(x - MOUTH.x) - r;
	}
	return Math.hypot(x - MOUTH.x, y - spring) - r;
}

/**
 * The fire inside the mouth: the oven's red-hot vault above, flames and a bed of embers on the floor.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawFire(layer, random) {
	const left = MOUTH.x - Math.floor(MOUTH.w / 2);
	for (let y = MOUTH.sill - MOUTH.h; y <= MOUTH.sill; y++) {
		for (let x = left; x <= left + MOUTH.w; x++) {
			const d = archDistance(x, y);
			if (d >= 0) {
				continue;
			}
			const depth = (y - (MOUTH.sill - MOUTH.h)) / MOUTH.h;
			const centre = Math.abs(x - MOUTH.x) / (MOUTH.w / 2);
			const heat = depth * 1.05 - centre * 0.5;
			let colour = HOT_DARK;
			if (heat > 0.8) {
				colour = C.lampGlow;
			} else if (heat > 0.6) {
				colour = C.gold;
			} else if (heat > 0.4) {
				colour = C.amber;
			} else if (heat > 0.2) {
				colour = C.brickRed;
			} else if (heat > 0.02) {
				colour = C.brickRedShade;
			}
			set(layer, x, y, colour);
		}
	}
	// Tongues of flame licking up the back of the vault.
	for (const [fx, height] of [
		[7, 6],
		[10, 10],
		[14, 9],
		[17, 5],
	]) {
		for (let k = 0; k < height; k++) {
			const y = MOUTH.sill - 3 - k;
			const sway = Math.round(Math.sin(k * 0.9 + fx) * 0.8);
			let colour = C.amber;
			if (k < height / 3) {
				colour = C.lampGlow;
			} else if (k < (height * 2) / 3) {
				colour = C.gold;
			}
			set(layer, fx + sway, y, colour);
			if (k < height / 2) {
				set(layer, fx + sway + 1, y, C.gold);
			}
		}
	}
	// The embers: glowing coals along the floor.
	for (let x = left + 1; x < left + MOUTH.w; x++) {
		const coal = random();
		set(layer, x, MOUTH.sill - 1, coal > 0.6 ? C.brickRed : C.amber);
		set(layer, x, MOUTH.sill, coal > 0.3 ? C.brickRedShade : C.brickRed);
	}
}

/**
 * The baker's table: thick planks dusted with flour.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawTable(layer, random) {
	for (let y = TABLE; y < 64; y++) {
		const plank = Math.floor((y - TABLE) / 5);
		for (let x = 0; x < 64; x++) {
			let colour = C.timber;
			if ((y - TABLE) % 5 === 4) {
				colour = C.timberShade;
			} else if ((y - TABLE) % 5 === 0) {
				colour = C.timberLight;
			} else if ((x + plank * 11) % 23 === 0) {
				colour = C.timberShade;
			}
			set(layer, x, y, colour);
		}
	}
	// Flour on the boards.
	for (let i = 0; i < 30; i++) {
		const x = Math.floor(random() * 64);
		const y = TABLE + 1 + Math.floor(random() * (63 - TABLE));
		set(layer, x, y, random() > 0.5 ? C.creamShade : C.cream);
	}
}

/**
 * The peel: a round pale-wood blade under the loaf, its handle running off to the lower right.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawPeel(scene, random) {
	// The handle, running out of the picture towards the baker.
	line(scene, 48, 52, 58, 63, ASH_LIGHT);
	line(scene, 49, 52, 59, 63, ASH);
	line(scene, 50, 52, 60, 63, ASH);
	line(scene, 51, 52, 61, 63, ASH_SHADE);
	const { x: cx, y: cy, rx, ry } = PEEL;
	for (let y = cy - ry; y <= cy + ry; y++) {
		for (let x = cx - rx; x <= cx + rx; x++) {
			const nx = (x - cx) / rx;
			const ny = (y - cy) / ry;
			if (nx * nx + ny * ny >= 1) {
				continue;
			}
			let colour = ASH;
			if (ny > 0.6) {
				colour = ASH_SHADE;
			} else if (nx < -0.35 && ny < 0.3) {
				colour = ASH_LIGHT;
			}
			set(scene, x, y, colour);
		}
	}
	// A dusting of flour.
	for (let i = 0; i < 14; i++) {
		const x = Math.round(cx - rx + 2 + random() * (rx * 2 - 4));
		const y = Math.round(cy - 1 + random() * (ry - 1));
		if (get(scene, x, y) === ASH || get(scene, x, y) === ASH_SHADE) {
			set(scene, x, y, C.creamLight);
		}
	}
}

/**
 * The loaf: a high round dome of crust, lit from the oven on its left, scored with three slashes that opened into pale crumb.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawLoaf(scene, random) {
	const { x: cx, y: cy, rx, ry, base } = LOAF;
	const light = normalise([-0.7, -0.45, 0.55]);
	for (let y = cy - ry; y <= base; y++) {
		for (let x = cx - rx; x <= cx + rx; x++) {
			const nx = (x - cx) / rx;
			const ny = (y - cy) / ry;
			if (nx * nx + ny * ny >= 1) {
				continue;
			}
			const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
			const lambert = nx * light[0] + ny * light[1] + nz * light[2];
			set(scene, x, y, crustTone(lambert, y >= base - 1));
		}
	}
	// Blisters and cracks in the crust.
	for (let i = 0; i < 40; i++) {
		const x = Math.round(cx - rx + random() * rx * 2);
		const y = Math.round(cy - ry + random() * (base - cy + ry));
		const here = get(scene, x, y);
		if (here === C.amber) {
			set(scene, x, y, random() > 0.5 ? C.gold : CRUST);
		} else if (here === CRUST) {
			set(scene, x, y, random() > 0.5 ? C.amber : C.timber);
		} else if (here === C.timber) {
			set(scene, x, y, CRUST);
		}
	}
	// Three slashes across the crown, opened in the oven: a seam of crumb, a lit lip on the fire's side and a shadow on the other.
	for (const [sx, sy, length] of [
		[29, 34, 6],
		[36.5, 30.5, 8],
		[44, 32, 6],
	]) {
		drawSlash(scene, sx, sy, length);
	}
	// Flour dusted over the crown.
	for (let i = 0; i < 10; i++) {
		const x = Math.round(cx - 11 + random() * 16);
		const y = Math.round(cy - ry + 1 + random() * 5);
		const here = get(scene, x, y);
		if (here === C.gold || here === C.amber) {
			set(scene, x, y, C.cream);
		}
	}
}

/**
 * One slash: a lens of pale crumb along a line, widest in its middle.
 * @param {Canvas} scene
 * @param {number} sx - The slash's centre column
 * @param {number} sy - The slash's centre row
 * @param {number} length - Half its length, in pixels
 */
function drawSlash(scene, sx, sy, length) {
	const along = normalise([0.55, 0.84]);
	const across = [along[1], -along[0]];
	const reach = Math.ceil(length) + 2;
	for (let y = Math.floor(sy) - reach; y <= sy + reach; y++) {
		for (let x = Math.floor(sx) - reach; x <= sx + reach; x++) {
			const u = (x - sx) * along[0] + (y - sy) * along[1];
			const v = (x - sx) * across[0] + (y - sy) * across[1];
			if (Math.abs(u) > length) {
				continue;
			}
			const width = 1.5 * (1 - (u / length) ** 2) + 0.2;
			if (Math.abs(v) < width * 0.45) {
				set(scene, x, y, C.creamLight);
			} else if (Math.abs(v) < width) {
				set(scene, x, y, C.sandLight);
			} else if (v < 0 && v > -width - 1.1) {
				set(scene, x, y, x < LOAF.x + 4 ? C.lampGlow : C.gold);
			} else if (v > 0 && v < width + 1.1) {
				set(scene, x, y, x < LOAF.x ? CRUST : C.timber);
			}
		}
	}
}

/**
 * Picks a crust tone for how much a point of the loaf faces the fire.
 * @param {number} lambert - From -1 (facing away) to 1 (facing the fire)
 * @param {boolean} underside - The tucked-under edge at the base
 * @returns {Colour}
 */
function crustTone(lambert, underside) {
	if (underside) {
		return lambert > 0.3 ? C.timber : C.timberShade;
	}
	if (lambert > 0.95) {
		return C.lampGlow;
	}
	if (lambert > 0.8) {
		return C.gold;
	}
	if (lambert > 0.52) {
		return C.amber;
	}
	if (lambert > 0.22) {
		return CRUST;
	}
	if (lambert > -0.3) {
		return C.timber;
	}
	return C.timberShade;
}

/**
 * Scales a vector to length 1.
 * @param {number[]} v
 * @returns {number[]}
 */
function normalise(v) {
	const length = Math.hypot(...v);
	return v.map((n) => n / length);
}

/**
 * Copies every painted pixel of one canvas onto another, so a part outlined on its own canvas keeps its edge.
 * @param {Canvas} target
 * @param {Canvas} source - The same size as the target
 */
function stamp(target, source) {
	for (let i = 0; i < source.p.length; i++) {
		if (source.p[i]) {
			target.p[i] = source.p[i];
		}
	}
}

/**
 * The earthenware bowl of dough on the left, rising in a dome under a blue gingham cloth.
 * @param {Canvas} scene - Its own canvas, outlined before it joins the scene
 */
function drawBowl(scene) {
	const cx = 9;
	const rim = 52;
	// The bowl: a wide belly narrowing to a foot.
	for (let y = rim; y < 64; y++) {
		const half = Math.round(11 - ((y - rim) / 11) ** 2 * 5);
		for (let x = cx - half; x <= cx + half; x++) {
			let colour = POT;
			if (y <= rim + 1) {
				colour = POT_LIGHT;
			} else if (x > cx + half - 4 || y > 60) {
				colour = POT_SHADE;
			} else if (x < cx - half + 4) {
				colour = POT_LIGHT;
			}
			set(scene, x, y, colour);
		}
	}
	// A dark band glazed round the belly.
	for (let x = cx - 10; x <= cx + 10; x++) {
		set(scene, x, rim + 4, POT_SHADE);
	}
	// The cloth, domed over the rising dough and hanging over the rim, its checks following the dome.
	for (let y = rim - 9; y <= rim + 1; y++) {
		for (let x = cx - 12; x <= cx + 12; x++) {
			const nx = (x - cx) / 12;
			const ny = (y - rim) / 9;
			if (y <= rim ? nx * nx + ny * ny >= 1 : Math.abs(nx) > 1) {
				continue;
			}
			const row =
				Math.floor((y - rim + 20 + Math.round(nx * nx * 3)) / 2) % 2;
			const column = Math.floor((x - cx + 20) / 2) % 2;
			const shaded = nx > 0.45 || y > rim - 1;
			let colour = shaded ? C.creamShade : C.cream;
			if (row && column) {
				colour = shaded ? CHECK_SHADE : CHECK;
			} else if (row || column) {
				colour = shaded ? CHECK : CHECK_LIGHT;
			} else if (nx < -0.1 && ny < -0.3) {
				colour = C.creamLight;
			}
			set(scene, x, y, colour);
		}
	}
	// A corner of the cloth hanging down the front.
	for (let k = 0; k < 4; k++) {
		set(scene, cx + 4 + Math.floor(k / 2), rim + 2 + k, CHECK_SHADE);
		set(
			scene,
			cx + 5 + Math.floor(k / 2),
			rim + 2 + k,
			k % 2 ? CHECK : C.cream
		);
	}
}

/**
 * A sheaf of ripe wheat standing against the wall on the right, tied with twine.
 * @param {Canvas} scene
 */
function drawWheat(scene) {
	const tie = { x: 58, y: 28 };
	for (const spread of [-5, -3, -1, 1, 3, 5]) {
		const top = {
			x: tie.x + spread,
			y: 9 + Math.round(Math.abs(spread) * 0.8),
		};
		const foot = { x: tie.x + Math.round(spread * 0.6), y: 44 };
		const stalk = spread < 0 ? C.sand : C.sandShade;
		line(
			scene,
			tie.x + Math.round(spread / 3),
			tie.y,
			top.x,
			top.y + 5,
			stalk
		);
		line(
			scene,
			tie.x + Math.round(spread / 3),
			tie.y,
			foot.x,
			foot.y,
			stalk
		);
		// The ear: plump grains in pairs, with whiskery awns above.
		for (let k = 0; k < 6; k++) {
			const y = top.y + 5 - k;
			set(scene, top.x, y, k % 2 ? C.gold : C.amber);
			if (k % 2 === 0) {
				set(scene, top.x + (spread < 0 ? -1 : 1), y, C.amber);
			}
		}
		set(scene, top.x - 1, top.y - 2, C.sandLight);
		set(scene, top.x + 1, top.y - 3, C.sandLight);
	}
	rect(scene, tie.x - 3, tie.y - 1, 7, 2, C.timberShade);
	rect(scene, tie.x - 3, tie.y - 1, 7, 1, C.brickRed);
}

/**
 * Steam curling up off the hot loaf in three soft wisps, painted over the outline.
 * @param {Canvas} scene
 */
function drawSteam(scene) {
	for (const [sx, sy, rise, phase] of [
		[32, 25, 13, 0],
		[39, 23, 18, 2],
		[45, 25, 12, 4],
	]) {
		for (let k = 0; k < rise; k++) {
			const x = Math.round(sx + Math.sin(k / 3 + phase) * 1.6 + k * 0.15);
			const y = sy - k;
			const here = get(scene, x, y);
			if (!here) {
				continue;
			}
			const t = 0.88 - (k / rise) * 0.5;
			set(scene, x, y, mix(here, C.white, t));
			if (k > 2 && k < rise - 3) {
				const side = get(scene, x + 1, y);
				if (side) {
					set(scene, x + 1, y, mix(side, C.white, t * 0.55));
				}
			}
		}
	}
}
