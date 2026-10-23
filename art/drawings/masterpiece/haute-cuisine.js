// Haute Cuisine: a gourmet plate on white linen by candlelight, a seared fillet with a swirl of wine sauce, herbs and edible flowers, a gloved hand lifting the silver cloche above it and a glass of red wine beside.
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

/** The table's back edge against the dark room. */
const TABLE = 33;

/** The candle: its column, the top of its taper, and its flame. */
const CANDLE = { x: 13, top: 11, base: 31 };
const FLAME = { x: 14, y: 7 };

/** The plate, its well and the fillet on it: centres, half-widths and half-heights. */
const PLATE = { x: 36, y: 48, rx: 22, ry: 9.5 };
const WELL = { x: 36, y: 48.5, rx: 16.5, ry: 6.6 };
const FILLET = { x: 35, y: 46, rx: 6.5, ry: 2.4, height: 5 };

/** The cloche: the middle of its open rim, its half-width, its height, the half-height of its opening and its tilt. */
const CLOCHE = { x: 44, y: 24, rx: 13.5, height: 12, open: 4.6, tilt: 0.36 };

/** The wine glass: its centre column, the rows of its rim, the wine's surface, its bowl's foot and its own foot. */
const GLASS = { x: 6, rim: 33, wine: 39, bowl: 46, foot: 55 };

/** The dark dining room: high and low, and the blurred lamps far behind. */
const ROOM_HIGH = mix(C.night, C.brickRedShade, 0.18);
const ROOM_LOW = mix(C.night, C.brickRedShade, 0.42);
const BOKEH = mix(ROOM_LOW, C.amber, 0.35);
const BOKEH_CORE = mix(ROOM_LOW, C.gold, 0.55);

/** White linen in candlelight: lit, plain, a pressed fold, and the plate's shadow. */
const LINEN_LIGHT = mix(C.creamLight, C.lampGlow, 0.35);
const LINEN = mix(C.cream, C.creamShade, 0.25);
const LINEN_FOLD = mix(C.creamShade, C.plasterShade, 0.3);
const LINEN_SHADOW = mix(C.creamShade, C.roofLight, 0.35);

/** The porcelain plate: lit, plain, shaded, and its gold band. */
const CHINA_LIGHT = C.white;
const CHINA = C.creamLight;
const CHINA_SHADE = mix(C.cream, C.stoneLight, 0.4);

/** The fillet: its seared crust lit, plain and dark, and the flakes of salt on it. */
const CRUST_LIGHT = mix(C.timberLight, C.amber, 0.3);
const CRUST = mix(C.timber, C.brickRedShade, 0.3);
const CRUST_DARK = mix(C.timberShade, C.ink, 0.3);
const SALT = C.creamLight;

/** The fillet's cut face: a thin grey band under the crust, pink, and a rosy heart. */
const MEAT_GREY = mix(C.timberLight, C.stone, 0.35);
const MEAT_PINK = mix(C.brickRedLight, C.skin, 0.55);
const MEAT_RED = mix(C.brickRed, C.brickRedLight, 0.65);

/** The wine sauce: a deep glossy red, lit along its edge. */
const SAUCE = mix(C.brickRedShade, C.arcaneShade, 0.15);
const SAUCE_LIGHT = mix(C.brickRed, C.brickRedLight, 0.3);

/** Herbs and flowers on the plate. */
const HERB = C.grass;
const HERB_LIGHT = C.grassLight;
const HERB_SHADE = C.forestFloor;
const PETAL_VIOLET = C.arcane;
const PETAL_VIOLET_LIGHT = C.arcaneLight;
const PETAL_ORANGE = mix(C.amber, C.brickRedLight, 0.35);

/** Polished silver, which mirrors the room: its gleam, lit, plain, shaded, its dark band, and its warm reflection of the candle. */
const SILVER_GLEAM = C.white;
const SILVER_LIGHT = C.stoneLight;
const SILVER = mix(C.stone, C.stoneLight, 0.3);
const SILVER_SHADE = C.stoneShade;
const SILVER_DARK = mix(C.stoneShade, C.stoneMid, 0.3);
const SILVER_WARM = mix(C.stoneLight, C.gold, 0.45);
const CLOCHE_INSIDE = mix(C.night, C.roofShade, 0.4);
const CLOCHE_INSIDE_LIGHT = mix(C.roofShade, C.amber, 0.3);

/** The waiter's white glove and black sleeve. */
const GLOVE = C.white;
const GLOVE_SHADE = C.snowShade;
const SLEEVE = C.night;
const SLEEVE_LIGHT = mix(C.night, C.roofLight, 0.4);

/** The wine: deep red, glowing where the candle shines through it, and its glass. */
const WINE = mix(C.brickRedShade, C.ink, 0.35);
const WINE_GLOW = C.brickRed;
const WINE_LIGHT = C.brickRedLight;
const GLASS_EDGE = mix(C.stoneLight, C.white, 0.4);

/** The candle: wax lit and shaded, and its silver stick. */
const WAX = C.creamLight;
const WAX_SHADE = C.cream;

/** The colours the candle's glow leaves alone: the flame and things drawn already lit. */
const KEEP = [
	C.ink,
	C.white,
	C.lampGlow,
	C.gold,
	C.amber,
	BOKEH_CORE,
	CLOCHE_INSIDE,
	CLOCHE_INSIDE_LIGHT,
];

/**
 * Draws the Haute Cuisine masterpiece.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(7741);

	drawRoom(layer);
	drawLinen(layer);

	drawCandle(scene);
	drawPlate(scene);
	drawFillet(scene, random);
	drawSauce(scene);
	drawGarnish(scene);
	drawGlass(scene, layer);
	const cloche = createCanvas(64, 64);
	drawCloche(cloche);
	drawGlove(cloche);
	outline(cloche, C.ink);
	outline(scene, C.ink);
	stamp(scene, cloche);
	underlay(scene, layer);

	drawSteam(scene);
	glow(scene, {
		x: FLAME.x,
		y: FLAME.y,
		radius: 40,
		colour: C.gold,
		strength: 0.3,
		steps: 3,
		skip: KEEP,
	});
	drawFlame(scene);
	drawGleams(scene);
	return scene;
}

/**
 * Copies every painted pixel of one canvas over another.
 * @param {Canvas} canvas - Changed in place
 * @param {Canvas} part - The same size
 */
function stamp(canvas, part) {
	for (let i = 0; i < part.p.length; i++) {
		if (part.p[i]) {
			canvas.p[i] = part.p[i];
		}
	}
}

/**
 * How far a pixel lies from the middle of an oval, as a share of the oval: below 1 is inside.
 * @param {number} x
 * @param {number} y
 * @param {{ x: number, y: number, rx: number, ry: number }} o
 * @returns {number}
 */
function oval(x, y, o) {
	return Math.hypot((x + 0.5 - o.x) / o.rx, (y + 0.5 - o.y) / o.ry);
}

/**
 * The dark dining room behind the table, a little warmer near the table, with lamps blurred into soft discs far behind.
 * @param {Canvas} layer
 */
function drawRoom(layer) {
	for (let y = 0; y < TABLE; y++) {
		for (let x = 0; x < 64; x++) {
			const low = y + ((x + y) % 2) * 3 > 18;
			set(layer, x, y, low ? ROOM_LOW : ROOM_HIGH);
		}
	}
	for (const [bx, by, r] of [
		[28, 5, 2.6],
		[60, 7, 2.2],
		[33, 17, 1.8],
		[3, 20, 2.2],
		[24, 27, 1.5],
	]) {
		for (let y = Math.floor(by - r); y <= by + r; y++) {
			for (let x = Math.floor(bx - r); x <= bx + r; x++) {
				const d = Math.hypot(x + 0.5 - bx, y + 0.5 - by);
				if (d < r) {
					set(layer, x, y, d < r * 0.5 ? BOKEH_CORE : BOKEH);
				}
			}
		}
	}
}

/**
 * The white tablecloth: lit warm towards the candle, with a pressed fold down it and the plate's shadow thrown away from the flame.
 * @param {Canvas} layer
 */
function drawLinen(layer) {
	for (let y = TABLE; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const near = Math.hypot(x - FLAME.x, (y - FLAME.y) * 0.8);
			let colour = near + ((x + y) % 2) * 3 < 40 ? LINEN_LIGHT : LINEN;
			if (x === 50 + Math.floor((y - TABLE) / 6) || y === TABLE) {
				colour = LINEN_FOLD;
			}
			if (
				oval(x, y, { ...PLATE, x: PLATE.x + 4, y: PLATE.y + 1.5 }) <= 1
			) {
				colour = LINEN_SHADOW;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The candle behind the plate: a tall cream taper in a silver stick with a drip down its side. The flame is drawn last, over the glow.
 * @param {Canvas} scene
 */
function drawCandle(scene) {
	const { x, top, base } = CANDLE;
	rect(scene, x, top, 3, base - top, WAX);
	rect(scene, x + 2, top, 1, base - top, WAX_SHADE);
	rect(scene, x, top, 1, base - top, C.white);
	// A drip of wax down its side.
	rect(scene, x + 2, top + 1, 1, 4, C.white);
	set(scene, x + 3, top + 4, WAX);
	// The silver stick: a cup, a turned stem and a round foot on the cloth.
	rect(scene, x - 2, base, 7, 1, SILVER_LIGHT);
	rect(scene, x - 1, base + 1, 5, 1, SILVER);
	rect(scene, x, base + 2, 3, 3, SILVER);
	set(scene, x, base + 2, SILVER_LIGHT);
	set(scene, x, base + 3, SILVER_LIGHT);
	rect(scene, x - 1, base + 4, 5, 1, SILVER_SHADE);
	rect(scene, x - 3, base + 5, 9, 2, SILVER);
	rect(scene, x - 3, base + 5, 4, 1, SILVER_LIGHT);
	rect(scene, x + 3, base + 6, 3, 1, SILVER_SHADE);
}

/**
 * The porcelain plate: a wide rim with a gold band at its edge, sloping down into a shallow well, lit from the candle on the left.
 * @param {Canvas} scene
 */
function drawPlate(scene) {
	for (let y = Math.floor(PLATE.y - PLATE.ry); y <= PLATE.y + PLATE.ry; y++) {
		for (
			let x = Math.floor(PLATE.x - PLATE.rx);
			x <= PLATE.x + PLATE.rx;
			x++
		) {
			const d = oval(x, y, PLATE);
			if (d > 1) {
				continue;
			}
			const across = (x + 0.5 - PLATE.x) / PLATE.rx;
			const w = oval(x, y, WELL);
			let colour;
			if (d > 0.93) {
				colour = C.brass;
			} else if (w > 1) {
				// The rim: brightest on the side facing the flame.
				colour = across < -0.3 && y < PLATE.y + 3 ? CHINA_LIGHT : CHINA;
				if (across > 0.55 && y > PLATE.y) {
					colour = CHINA_SHADE;
				}
			} else if (w > 0.86) {
				// The well's slope: shaded on the near-the-flame side, lit on the far side.
				colour = across < 0 ? CHINA_SHADE : CHINA_LIGHT;
			} else {
				colour = CHINA;
			}
			set(scene, x, y, colour);
		}
	}
	// The gold band glints where it faces the flame.
	for (let x = 15; x < 26; x++) {
		const y =
			Math.round(
				PLATE.y -
					PLATE.ry *
						Math.sqrt(
							Math.max(
								0,
								1 - ((x + 0.5 - PLATE.x) / PLATE.rx) ** 2
							)
						)
			) + 1;
		if (get(scene, x, y) === C.brass) {
			set(scene, x, y, C.gold);
		}
	}
}

/**
 * The fillet: a thick round medallion seared dark, its top crust lit on the flame's side and flecked with salt.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawFillet(scene, random) {
	const { x: cx, y: cy, rx, ry, height } = FILLET;
	const topY = cy - height;
	for (let y = Math.floor(topY - ry); y <= Math.ceil(cy + ry); y++) {
		for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
			const across = (x + 0.5 - cx) / rx;
			if (Math.abs(across) > 1) {
				continue;
			}
			const top = oval(x, y, { x: cx, y: topY, rx, ry });
			const bottomEdge = cy + ry * Math.sqrt(1 - across * across);
			if (top <= 1) {
				let colour =
					across < -0.2 || y < topY - 1 ? CRUST_LIGHT : CRUST;
				if (top > 0.8 && across > 0.3) {
					colour = CRUST;
				}
				if (random() < 0.12) {
					colour = CRUST_DARK;
				}
				set(scene, x, y, colour);
			} else if (y >= topY && y + 0.5 <= bottomEdge) {
				// The cut face towards us: a seared rim round a rosy, medium-rare heart.
				const depth = Math.min(
					1 - Math.abs(across),
					(bottomEdge - y - 0.5) / (height + ry),
					(y - topY + 1) / (height + ry)
				);
				let colour = CRUST_DARK;
				if (depth > 0.3) {
					colour = MEAT_RED;
				} else if (depth > 0.14) {
					colour = MEAT_PINK;
				} else if (depth > 0.07) {
					colour = MEAT_GREY;
				}
				set(scene, x, y, colour);
			}
		}
	}
	// Flakes of salt on the crust.
	for (const [dx, dy] of [
		[-3, -6],
		[1, -5],
		[3, -6],
		[-1, -4],
	]) {
		set(scene, cx + dx, cy + dy, SALT);
	}
}

/**
 * The wine sauce: one swoosh curving round the front of the fillet, thick at its start and tapering away,
 * with three dots of sauce shrinking along the plate.
 * @param {Canvas} scene
 */
function drawSauce(scene) {
	for (let i = 0; i <= 40; i++) {
		const t = i / 40;
		const angle = Math.PI * (0.92 - t * 0.78);
		const x = FILLET.x + Math.cos(angle) * 11;
		const y = FILLET.y + 1 + Math.sin(angle) * 4.6;
		const r = 1.9 * (1 - t) + 0.4;
		for (let py = Math.floor(y - r); py <= y + r; py++) {
			for (let px = Math.floor(x - r); px <= x + r; px++) {
				if (Math.hypot(px + 0.5 - x, py + 0.5 - y) <= r) {
					set(scene, px, py, SAUCE);
				}
			}
		}
		// A gleam along its upper edge.
		if (t < 0.7) {
			set(scene, Math.round(x), Math.round(y - r + 0.4), SAUCE_LIGHT);
		}
	}
	for (const [x, y, size] of [
		[47, 44, 2],
		[51, 46, 2],
		[54, 48, 1],
	]) {
		rect(scene, x, y, size, size, SAUCE);
		set(scene, x, y, SAUCE_LIGHT);
	}
}

/**
 * The garnish: a sprig of thyme and a few leaves of cress on the fillet, a violet pansy and an orange nasturtium petal on the plate.
 * @param {Canvas} scene
 */
function drawGarnish(scene) {
	paint(
		scene,
		FILLET.x - 4,
		FILLET.y - FILLET.height - 4,
		['...l.....', '..lgl.l..', '.l.gglg..', 'gg..ggs.l', '.s...sgg.'],
		{ l: HERB_LIGHT, g: HERB, s: HERB_SHADE }
	);
	paint(scene, 22, 45, ['.v.', 'vgv', '.v.'], {
		v: PETAL_VIOLET,
		g: C.gold,
	});
	set(scene, 22, 45, PETAL_VIOLET_LIGHT);
	paint(scene, 43, 50, ['oo.', 'ooo', '.o.'], { o: PETAL_ORANGE });
	set(scene, 43, 50, C.gold);
	paint(scene, 46, 51, ['g.', '.g'], { g: HERB });
}

/**
 * The wine glass beside the plate: a tulip bowl half full of red wine glowing where the candle shines through it,
 * the cloth showing faintly through the empty glass above it, a thin rim, a slim stem and a round foot.
 * @param {Canvas} scene
 * @param {Canvas} layer - What shows through the glass
 */
function drawGlass(scene, layer) {
	const { x: cx, rim, wine, bowl, foot } = GLASS;
	for (let y = rim; y <= bowl; y++) {
		const t = (y - rim) / (bowl - rim);
		const half = 4.6 + Math.sin(t * Math.PI * 0.8) * 1.2 - t * t * 3.2;
		for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) {
			const across = (x + 0.5 - cx) / half;
			let colour;
			if (y < wine) {
				colour = mix(get(layer, x, y) ?? LINEN, C.white, 0.22);
				if (Math.abs(across) > 0.8 || y === rim) {
					colour = GLASS_EDGE;
				}
			} else if (y === wine) {
				colour = WINE_LIGHT;
			} else {
				colour = across < -0.2 ? WINE_GLOW : WINE;
			}
			set(scene, x, y, colour);
		}
	}
	rect(scene, cx, bowl + 1, 1, foot - bowl - 1, GLASS_EDGE);
	rect(scene, cx - 4, foot, 9, 1, GLASS_EDGE);
	rect(scene, cx - 3, foot - 1, 7, 1, mix(LINEN, C.white, 0.22));
}

/**
 * The silver cloche, lifted and tipped towards us: its domed back mirroring the dark room and the bright cloth,
 * a warm reflection of the candle on its flame side, the dark inside seen through its open rim, and its knob on top.
 * @param {Canvas} cloche
 */
function drawCloche(cloche) {
	const { x: ox, y: oy, rx, height, open, tilt } = CLOCHE;
	const right = { x: Math.cos(tilt), y: Math.sin(tilt) };
	const up = { x: Math.sin(tilt), y: -Math.cos(tilt) };
	for (let y = 0; y < 40; y++) {
		for (let x = 20; x < 64; x++) {
			const dx = x + 0.5 - ox;
			const dy = y + 0.5 - oy;
			const u = (dx * right.x + dy * right.y) / rx;
			const v = dx * up.x + dy * up.y;
			const dome = v >= 0 && Math.hypot(u, v / height) <= 1;
			const mouth = Math.hypot(u, v / open) <= 1;
			if (mouth) {
				const lip =
					Math.hypot(u * (rx / (rx - 1.2)), v / (open - 1)) > 1;
				if (lip) {
					set(cloche, x, y, u < -0.3 ? SILVER_GLEAM : SILVER_LIGHT);
				} else {
					// The far inside wall, dark, with a warm band where it mirrors the candle and the food.
					const band =
						v > open * 0.25 &&
						v < open * 0.5 &&
						u > -0.75 &&
						u < 0.3;
					set(
						cloche,
						x,
						y,
						band ? CLOCHE_INSIDE_LIGHT : CLOCHE_INSIDE
					);
				}
			} else if (dome) {
				set(cloche, x, y, silverTone(u, v / height));
			}
		}
	}
	// The knob: a silver bead on a short neck at the top of the dome.
	const top = {
		x: ox + up.x * (height + 1.5),
		y: oy + up.y * (height + 1.5),
	};
	const kx = Math.round(top.x);
	const ky = Math.round(top.y);
	rect(cloche, kx - 1, ky, 3, 2, SILVER);
	rect(cloche, kx - 1, ky - 2, 3, 2, SILVER_LIGHT);
	set(cloche, kx - 1, ky - 2, SILVER_GLEAM);
}

/**
 * Picks a silver tone for a point on the dome. Polished silver mirrors what is around it: the bright cloth along its foot,
 * a dark band of the room above that, and a warm patch of candlelight on the side facing the flame.
 * @param {number} u - Across the dome, from -1 on the flame's side to 1
 * @param {number} h - Up the dome, from 0 at the rim to 1 at the top
 * @returns {Colour}
 */
function silverTone(u, h) {
	const side = u + h * 0.2;
	if (h < 0.18) {
		return side < -0.2 ? SILVER_GLEAM : SILVER_LIGHT;
	}
	if (h < 0.42) {
		return side < -0.55 ? SILVER : side > 0.6 ? SILVER_DARK : SILVER_SHADE;
	}
	if (side < -0.45 && h < 0.8) {
		return h > 0.55 && h < 0.7 && side < -0.6 ? SILVER_GLEAM : SILVER_WARM;
	}
	return side > 0.45 ? SILVER_SHADE : SILVER;
}

/**
 * The waiter's white-gloved hand holding the cloche by its knob, its black sleeve reaching in from the top right.
 * @param {Canvas} cloche
 */
function drawGlove(cloche) {
	const { x: ox, y: oy, height, tilt } = CLOCHE;
	const kx = Math.round(ox + Math.sin(tilt) * (height + 1.5));
	const ky = Math.round(oy - Math.cos(tilt) * (height + 1.5));
	// The sleeve, from the corner down to the wrist, with a white cuff.
	for (let i = 0; i < 16; i++) {
		const x = kx + 5 + i;
		const y = ky - 4 - Math.round(i * 0.55);
		rect(cloche, x, y - 2, 1, 6, SLEEVE);
		set(cloche, x, y - 2, SLEEVE_LIGHT);
	}
	rect(cloche, kx + 4, ky - 6, 2, 6, C.creamLight);
	// The gloved fist round the knob, knuckles towards us.
	paint(
		cloche,
		kx - 3,
		ky - 6,
		['..wwwww.', '.wwwwwwg', 'wwwwwwgg', 'wgwgwgwg', '.w.w.w..'],
		{ w: GLOVE, g: GLOVE_SHADE }
	);
}

/**
 * Steam rising off the hot fillet up into the lifted cloche, two thin curling wisps blended with what lies behind.
 * @param {Canvas} scene
 */
function drawSteam(scene) {
	for (const [sx, phase] of [
		[33, 0],
		[38, 2],
	]) {
		for (let y = 30; y < 39; y++) {
			const x = sx + Math.round(Math.sin((y + phase) * 0.7) * 1.2);
			const under = get(scene, x, y);
			if (under && under !== C.ink) {
				set(scene, x, y, mix(under, C.white, 0.3));
			}
		}
	}
}

/**
 * The candle's flame: a white-hot core, a gold body and an amber tip, over its black wick.
 * @param {Canvas} scene
 */
function drawFlame(scene) {
	const { x, y } = FLAME;
	paint(
		scene,
		x - 2,
		y - 4,
		['..a..', '..g..', '.ggg.', '.gwg.', '.gwg.', '..k..'],
		{ a: C.amber, g: C.gold, w: C.lampGlow, k: C.ink }
	);
}

/**
 * Candlelight glinting on the glass, the wine's rim and the wet sauce.
 * @param {Canvas} scene
 */
function drawGleams(scene) {
	set(scene, GLASS.x + 3, GLASS.rim + 2, C.white);
	set(scene, GLASS.x + 3, GLASS.rim + 3, C.white);
	set(scene, GLASS.x + 2, GLASS.wine + 2, WINE_LIGHT);
	set(scene, 30, 49, C.white);
}
