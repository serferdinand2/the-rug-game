// Eyeglasses: a pair of round wire spectacles held up before a blurred market street, the view through each lens sharp.
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

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The two lenses' centres. */
const LENSES = [
	{ x: 15, y: 29 },
	{ x: 45, y: 29 },
];

/** The glass's radius, and the wire rim's outer radius around it. */
const GLASS = 12;
const RIM = 13.6;

/** How much the lenses enlarge the street behind them. */
const ZOOM = 1.3;

/** The first row of the cobbled street. */
const STREET = 39;

/** The haze over the street out of focus. */
const HAZE = C.cloudShade;

/**
 * Draws the Eyeglasses tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const sharp = createCanvas(64, 64);
	const random = seededRandom(5121);

	drawMarket(sharp, false);
	drawMarket(layer, true);
	soften(layer, random);
	drawShoppers(layer);
	drawBokeh(layer);

	for (const lens of LENSES) {
		drawLens(scene, sharp, lens);
		drawRim(scene, lens);
	}
	drawBridge(scene);
	drawHinges(scene);
	drawHand(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	for (const lens of LENSES) {
		drawGlint(scene, lens);
	}
	return scene;
}

/**
 * The market street: three shop fronts under striped awnings, their goods heaped on the counters.
 * Drawn twice: sharp for the view through the lenses, and soft, with the fine stripes and fruit left out, for the blur.
 * @param {Canvas} canvas
 * @param {boolean} soft - Leave out the details the blur would lose
 */
function drawMarket(canvas, soft) {
	// The sky above the roofs.
	const sky = [C.daySky4, C.daySky4, C.daySky5, C.daySky5, C.daySky6];
	for (let y = 0; y < 8; y++) {
		rect(canvas, 0, y, 64, 1, sky[Math.min(y, sky.length - 1)]);
	}
	drawTimberHouse(canvas);
	drawBrickHouse(canvas);
	drawStuccoHouse(canvas);
	// The dark shops under the awnings.
	rect(canvas, 0, 16, 64, 20, C.floorShade);
	drawAwning(canvas, 0, 20, C.brickRed, C.brickRedShade, soft);
	drawAwning(canvas, 20, 22, C.amber, C.lampFrame, soft);
	drawAwning(canvas, 42, 22, C.teal, C.tealShade, soft);
	drawFruit(canvas, soft);
	drawBread(canvas, soft);
	drawCloth(canvas);
	drawPots(canvas);
	// The counters' fronts.
	rect(canvas, 0, 36, 64, 3, C.timber);
	rect(canvas, 0, 36, 64, 1, C.timberLight);
	rect(canvas, 0, 38, 64, 1, C.timberShade);
	// The cobbles in the sun, in the counters' shadow at the kerb.
	rect(canvas, 0, STREET, 64, 2, C.stoneShade);
	rect(canvas, 0, STREET + 2, 64, 11, C.stoneLight);
	rect(canvas, 0, STREET + 13, 64, 64 - STREET - 13, C.stone);
}

/**
 * The half-timbered house on the left: a tiled roof, lime plaster between dark beams, and a window with a flower box.
 * @param {Canvas} canvas
 */
function drawTimberHouse(canvas) {
	rect(canvas, 0, 2, 20, 4, C.brickRedShade);
	rect(canvas, 0, 2, 20, 1, C.brickRed);
	rect(canvas, 0, 4, 20, 1, C.brickRed);
	rect(canvas, 0, 6, 20, 10, C.plasterLight);
	for (const x of [0, 6, 13, 19]) {
		rect(canvas, x, 6, 1, 10, C.timber);
	}
	rect(canvas, 0, 6, 20, 1, C.timber);
	rect(canvas, 8, 8, 4, 5, C.roofShade);
	set(canvas, 8, 8, C.daySky6);
	set(canvas, 9, 8, C.daySky5);
	rect(canvas, 7, 13, 6, 1, C.timberShade);
	for (const x of [7, 9, 11]) {
		set(canvas, x, 12, C.brickRedLight);
		set(canvas, x + 1, 12, C.grass);
	}
}

/**
 * The brick house in the middle: a stone cornice, a tall window, and a plain board sign hung on a bracket.
 * @param {Canvas} canvas
 */
function drawBrickHouse(canvas) {
	rect(canvas, 20, 0, 22, 16, C.brickRed);
	for (let y = 2; y < 16; y++) {
		for (let x = 20; x < 42; x++) {
			if (y % 3 === 1 || (x + (Math.floor(y / 3) % 2) * 3) % 6 === 0) {
				set(canvas, x, y, C.brickRedShade);
			}
		}
	}
	rect(canvas, 20, 0, 22, 2, C.stoneLight);
	rect(canvas, 20, 2, 22, 1, C.stoneShade);
	rect(canvas, 23, 4, 6, 10, C.roofShade);
	rect(canvas, 22, 4, 1, 10, C.timber);
	rect(canvas, 29, 4, 1, 10, C.timberShade);
	set(canvas, 23, 4, C.daySky6);
	set(canvas, 24, 5, C.daySky5);
	rect(canvas, 33, 5, 7, 1, C.wood);
	rect(canvas, 34, 6, 1, 2, C.wood);
	rect(canvas, 38, 6, 1, 2, C.wood);
	rect(canvas, 33, 8, 7, 5, C.timberLight);
	rect(canvas, 35, 9, 3, 3, C.gold);
}

/**
 * The stucco house on the right: a slate roof, a sandy wall and windows with teal shutters.
 * @param {Canvas} canvas
 */
function drawStuccoHouse(canvas) {
	rect(canvas, 42, 1, 22, 4, C.roof);
	rect(canvas, 42, 1, 22, 1, C.roofLight);
	rect(canvas, 42, 5, 22, 11, C.sand);
	rect(canvas, 42, 5, 2, 11, C.sandLight);
	for (const x of [47, 56]) {
		rect(canvas, x - 2, 7, 2, 6, C.teal);
		rect(canvas, x + 4, 7, 2, 6, C.tealShade);
		rect(canvas, x, 7, 4, 6, C.roofShade);
		set(canvas, x, 7, C.daySky6);
		rect(canvas, x - 2, 13, 8, 1, C.sandShade);
	}
}

/**
 * A striped awning over a shop front, its edge cut in scallops. Soft, it shows only its stripes' blend.
 * @param {Canvas} canvas
 * @param {number} x - Left column
 * @param {number} w - Width
 * @param {Colour} colour - The stripe colour, between cream stripes
 * @param {Colour} shade - The stripe colour in the awning's shadowed lower edge
 * @param {boolean} soft
 */
function drawAwning(canvas, x, w, colour, shade, soft) {
	for (let y = 16; y < 23; y++) {
		for (let i = 0; i < w; i++) {
			const stripe = Math.floor(i / 3) % 2 === 0;
			if (y === 22 && i % 3 !== 1) {
				continue;
			}
			let tone = stripe ? colour : C.creamLight;
			if (y >= 21) {
				tone = stripe ? shade : C.creamShade;
			}
			if (soft) {
				tone = mix(y >= 21 ? shade : colour, C.creamLight, 0.4);
			}
			set(canvas, x + i, y, tone);
		}
	}
	rect(canvas, x, 16, w, 1, soft ? mix(colour, C.white, 0.5) : C.white);
}

/**
 * Heaps of apples, oranges and green pears in baskets on the left stall, and a string of onions hung above.
 * @param {Canvas} canvas
 * @param {boolean} soft
 */
function drawFruit(canvas, soft) {
	const heaps = [
		{
			x: 0,
			w: 7,
			light: C.brickRedLight,
			main: C.brickRed,
			dark: C.brickRedShade,
		},
		{ x: 7, w: 7, light: C.gold, main: C.amber, dark: C.lampFrame },
		{ x: 14, w: 6, light: C.grassLight, main: C.grass, dark: C.grassShade },
	];
	const insets = [0, 0, 0, 0, 0, 1, 1, 2, 3];
	for (const heap of heaps) {
		insets.forEach((inset, row) => {
			const y = 31 - row;
			for (let i = inset; i < heap.w - inset; i++) {
				let tone = heap.main;
				if (!soft) {
					const cx = (i + Math.floor(row / 2)) % 2;
					const cy = row % 2;
					if (cx === 0 && cy === 1) {
						tone = heap.light;
					} else if (cx === 1 && cy === 0) {
						tone = heap.dark;
					}
				}
				set(canvas, heap.x + i, y, tone);
			}
		});
		// The wicker basket under the heap.
		rect(canvas, heap.x, 32, heap.w, 4, C.timberLight);
		if (!soft) {
			rect(canvas, heap.x, 32, heap.w, 1, C.sandLight);
			for (let i = 0; i < heap.w; i++) {
				set(canvas, heap.x + i, 33 + (i % 2), C.timber);
			}
			set(canvas, heap.x + heap.w - 1, 35, C.timberShade);
		}
	}
}

/**
 * Round loaves on the bakery's shelf and heaped in baskets on its counter.
 * @param {Canvas} canvas
 * @param {boolean} soft
 */
function drawBread(canvas, soft) {
	rect(canvas, 21, 27, 20, 1, C.timberShade);
	for (let x = 22; x < 40; x += 4) {
		rect(canvas, x, 25, 3, 2, C.sand);
		if (!soft) {
			set(canvas, x, 25, C.sandLight);
			set(canvas, x + 2, 26, C.sandShade);
		}
	}
	for (const x of [21, 30, 36]) {
		rect(canvas, x, 32, 6, 4, C.timberLight);
		rect(canvas, x, 29, 6, 3, C.sand);
		rect(canvas, x + 1, 28, 4, 1, C.sand);
		if (!soft) {
			rect(canvas, x, 33, 6, 1, C.timber);
			rect(canvas, x + 1, 28, 2, 1, C.sandLight);
			set(canvas, x, 29, C.sandLight);
			set(canvas, x + 3, 29, C.sandLight);
			set(canvas, x + 2, 30, C.sandShade);
			set(canvas, x + 5, 30, C.sandShade);
			rect(canvas, x, 31, 6, 1, C.sandShade);
		}
	}
}

/**
 * Bolts of dyed cloth hung in the cloth merchant's shop on the right.
 * @param {Canvas} canvas
 */
function drawCloth(canvas) {
	const bolts = [
		[C.arcane, C.arcaneShade],
		[C.brickRedLight, C.brickRed],
		[C.gold, C.amber],
		[C.tealLight, C.teal],
		[C.creamLight, C.creamShade],
		[C.roofLight, C.roof],
		[C.grassLight, C.grass],
	];
	bolts.forEach(([light, shade], i) => {
		const x = 42 + i * 3;
		const length = 7 + ((i * 5) % 3);
		rect(canvas, x, 23, 3, length, light);
		rect(canvas, x + 2, 23, 1, length, shade);
		rect(canvas, x, 23 + length - 1, 3, 1, shade);
	});
	rect(canvas, 42, 23, 22, 1, C.timberLight);
}

/**
 * Clay jugs and a stack of bowls on the cloth merchant's counter.
 * @param {Canvas} canvas
 */
function drawPots(canvas) {
	for (const x of [42, 47, 52]) {
		rect(canvas, x + 1, 29, 2, 2, C.timber);
		rect(canvas, x, 31, 4, 5, C.timberLight);
		rect(canvas, x + 3, 31, 1, 5, C.timber);
		rect(canvas, x, 33, 3, 1, C.brickRedShade);
		set(canvas, x, 31, C.sandLight);
		set(canvas, x + 1, 29, C.timberLight);
	}
	for (let k = 0; k < 4; k++) {
		rect(
			canvas,
			57 + k,
			35 - k,
			7 - k * 2,
			1,
			k % 2 ? C.plaster : C.creamLight
		);
	}
}

/**
 * Shoppers on the cobbles, already out of focus: soft shapes of hair, skin and clothes.
 * @param {Canvas} layer
 */
function drawShoppers(layer) {
	const shoppers = [
		{ x: 5, y: 45, half: 4, clothes: C.brickRed, skin: C.skin },
		{ x: 35, y: 46, half: 4, clothes: C.roofLight, skin: C.skinDeep },
		{ x: 48, y: 51, half: 3, clothes: C.grass, skin: C.skinTan },
	];
	for (const { x, y, half, clothes, skin } of shoppers) {
		const r = half > 3 ? 2.6 : 2.1;
		const top = Math.ceil(y + r);
		for (let py = y - 3; py < 64; py++) {
			for (let px = x - half; px <= x + half; px++) {
				const d = Math.hypot(px - x, py - y);
				const row = py - top;
				const shoulders = half - Math.max(0, 2 - row);
				if (d < r) {
					const hair = py < y || (py === y && px > x);
					set(layer, px, py, mix(hair ? C.wood : skin, HAZE, 0.32));
				} else if (row >= 0 && Math.abs(px - x) <= shoulders) {
					set(layer, px, py, mix(clothes, HAZE, 0.32));
				}
			}
		}
	}
}

/**
 * Blurs the soft street: each pixel takes the commonest colour around it, edges where two colours meet are
 * dithered between them, and the whole is washed with haze.
 * @param {Canvas} canvas
 * @param {() => number} random
 */
function soften(canvas, random) {
	const before = canvas.p.slice();
	/** @type {Map<string, string>} */
	const hazed = new Map();
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			/** @type {Map<string, number>} */
			const counts = new Map();
			for (let dy = -2; dy <= 2; dy++) {
				for (let dx = -2; dx <= 2; dx++) {
					const nx = Math.min(63, Math.max(0, x + dx));
					const ny = Math.min(63, Math.max(0, y + dy));
					const colour = /** @type {string} */ (before[ny * 64 + nx]);
					counts.set(colour, (counts.get(colour) ?? 0) + 1);
				}
			}
			const ranked = [...counts].sort((a, b) => b[1] - a[1]);
			let best = ranked[0][0];
			if (ranked.length > 1 && ranked[1][1] >= 9 && random() < 0.3) {
				best = ranked[1][0];
			}
			if (!hazed.has(best)) {
				hazed.set(best, mix(best, HAZE, 0.32));
			}
			set(canvas, x, y, hazed.get(best));
		}
	}
}

/**
 * Soft discs of sunlight off windows and fruit, the way an out-of-focus street sparkles.
 * @param {Canvas} layer
 */
function drawBokeh(layer) {
	const discs = [
		[3, 2, 2.6],
		[37, 7, 2.2],
		[61, 11, 2.6],
		[31, 30, 2.2],
		[8, 50, 2.6],
		[38, 55, 2.2],
	];
	for (const [cx, cy, r] of discs) {
		for (let y = Math.floor(cy - r); y <= cy + r; y++) {
			for (let x = Math.floor(cx - r); x <= cx + r; x++) {
				const behind = get(layer, x, y);
				if (behind && Math.hypot(x - cx, y - cy) < r) {
					set(layer, x, y, mix(behind, C.white, 0.3));
				}
			}
		}
	}
}

/**
 * The view through one lens: the sharp street, enlarged, with the glass's edge catching the light at the top left.
 * @param {Canvas} scene
 * @param {Canvas} sharp
 * @param {{ x: number, y: number }} lens
 */
function drawLens(scene, sharp, lens) {
	const reach = Math.ceil(GLASS);
	for (let y = lens.y - reach; y <= lens.y + reach; y++) {
		for (let x = lens.x - reach; x <= lens.x + reach; x++) {
			const dx = x - lens.x;
			const dy = y - lens.y;
			const d = Math.hypot(dx, dy);
			if (d >= GLASS) {
				continue;
			}
			const sx = Math.round(lens.x + dx / ZOOM);
			const sy = Math.round(lens.y + dy / ZOOM);
			let colour = /** @type {Colour} */ (get(sharp, sx, sy));
			if (d >= GLASS - 1.2) {
				colour =
					dx + dy < 0
						? mix(colour, C.white, 0.35)
						: mix(colour, C.ink, 0.3);
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * Picks a wire tone for a point on a rim by how much it faces the sun at the top left.
 * @param {number} dx - Column offset from the centre
 * @param {number} dy - Row offset from the centre
 * @returns {Colour}
 */
function wireTone(dx, dy) {
	const facing = -(dx + dy) / ((Math.hypot(dx, dy) || 1) * Math.SQRT2);
	if (facing > 0.6) {
		return C.lampGlow;
	}
	if (facing > 0.1) {
		return C.gold;
	}
	if (facing > -0.5) {
		return C.brass;
	}
	return C.lampFrame;
}

/**
 * One lens's round wire rim.
 * @param {Canvas} scene
 * @param {{ x: number, y: number }} lens
 */
function drawRim(scene, lens) {
	const reach = Math.ceil(RIM);
	for (let y = lens.y - reach; y <= lens.y + reach; y++) {
		for (let x = lens.x - reach; x <= lens.x + reach; x++) {
			const d = Math.hypot(x - lens.x, y - lens.y);
			if (d >= GLASS && d < RIM) {
				set(scene, x, y, wireTone(x - lens.x, y - lens.y));
			}
		}
	}
}

/**
 * The arched bridge joining the two rims.
 * @param {Canvas} scene
 */
function drawBridge(scene) {
	line(scene, 26, 21, 28, 19, C.gold);
	line(scene, 28, 19, 32, 19, C.lampGlow);
	line(scene, 32, 19, 34, 21, C.gold);
	line(scene, 27, 22, 29, 20, C.brass);
	line(scene, 29, 20, 31, 20, C.brass);
	line(scene, 31, 20, 33, 22, C.lampFrame);
}

/**
 * The hinged end pieces on the rims' outer sides, and the temple arm running back from the right one.
 * @param {Canvas} scene
 */
function drawHinges(scene) {
	rect(scene, 0, 24, 3, 2, C.gold);
	rect(scene, 0, 26, 2, 1, C.brass);
	rect(scene, 57, 24, 3, 2, C.brass);
	rect(scene, 57, 26, 3, 1, C.lampFrame);
	line(scene, 60, 24, 63, 22, C.brass);
}

/**
 * The hand holding the spectacles up by the right temple arm: a fist round the hinge, its thumb laid over the top,
 * and the forearm in a rolled cuff and a blue sleeve running down out of the picture.
 * @param {Canvas} scene
 */
function drawHand(scene) {
	const lit = mix(C.skinTan, C.skin, 0.6);
	const shade = C.skinTanShade;
	const deep = mix(C.skinTanShade, C.skinDeepShade, 0.5);
	// The wrist and forearm, widening towards the viewer, then the cuff and the sleeve.
	for (let y = 34; y < 64; y++) {
		const left = Math.round(58 - Math.max(0, y - 37) * 0.3);
		for (let x = left; x < 64; x++) {
			let tone = x <= left ? lit : x >= 62 ? shade : C.skinTan;
			if (y >= 47) {
				tone =
					x <= left + 1
						? C.roofLight
						: x >= 61
							? C.roofShade
							: C.roof;
			} else if (y >= 45) {
				tone = x <= left + 1 ? C.white : C.creamLight;
			}
			set(scene, x, y, tone);
		}
	}
	// The fist: four curled fingers stacked down its front, knuckles towards the lens.
	const edges = [57, 56, 55, 56, 55, 55, 56, 55, 55, 56, 56, 57];
	edges.forEach((left, row) => {
		const y = 23 + row;
		const crease = row === 3 || row === 6 || row === 9;
		for (let x = left; x < 64; x++) {
			let tone = x <= left ? lit : x >= 62 ? shade : C.skinTan;
			if (crease && x <= left + 2) {
				tone = deep;
			}
			set(scene, x, y, tone);
		}
	});
	// The thumb, laid over the hinge and the top of the rim, its nail at the tip.
	rect(scene, 53, 21, 9, 2, C.skinTan);
	rect(scene, 54, 21, 6, 1, lit);
	rect(scene, 53, 21, 2, 1, mix(C.skin, C.creamLight, 0.5));
	rect(scene, 60, 22, 2, 1, shade);
	rect(scene, 57, 23, 4, 1, deep);
}

/**
 * Two strokes of sunlight glinting across a lens, painted over the outline.
 * @param {Canvas} scene
 * @param {{ x: number, y: number }} lens
 */
function drawGlint(scene, lens) {
	line(scene, lens.x - 8, lens.y - 2, lens.x - 3, lens.y - 7, C.white);
	line(scene, lens.x - 7, lens.y + 1, lens.x - 6, lens.y, C.white);
	line(scene, lens.x - 8, lens.y - 1, lens.x - 2, lens.y - 7, C.white);
}
