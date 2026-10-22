// Soothsaying: a fortune teller at a lamplit table before her striped tent at dusk, three picture cards turned face up.
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
import { drawTerrain } from '../../parts/terrain.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The ground's first row, the tent's centre column, its eave row, and the table top's first row. */
const GROUND = 46;
const CX = 32;
const EAVE = 20;
const TABLE = 47;

/** The oil lamp's flame. */
const FLAME = { x: 13, y: 43 };

/** The tent's two stripe colours, each lit and shaded. */
const STRIPES = [
	{ lit: C.roofLight, shade: C.roof },
	{ lit: C.gold, shade: C.amber },
];

/** The warm, dim inside of the tent seen through the door. */
const INSIDE = mix(C.brickRedShade, C.ink, 0.35);

/**
 * Draws the Soothsaying scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(9203);

	drawSky(layer, { time: 'dusk', horizon: GROUND, random });
	drawTerrain(layer, { kind: 'grassland', top: GROUND, random });
	tintGround(layer);

	// The tent stands behind the teller and her table, so it gets its own outline.
	const tent = createCanvas(64, 64);
	drawTent(tent);
	drawPennant(tent);
	dimTent(tent);
	outline(tent, C.ink);

	drawTeller(scene);
	drawTable(scene);
	drawLamp(scene);
	outline(scene, C.ink);
	underlay(scene, tent);
	underlay(scene, layer);
	glow(scene, {
		x: FLAME.x,
		y: FLAME.y,
		radius: 20,
		colour: C.gold,
		strength: 0.35,
		skip: [C.ink, C.lampGlow, C.gold],
	});
	drawCards(scene);
	drawFlame(scene);
	return scene;
}

/** The grassland's colours, which the dusk dims. */
const GRASS = [C.grass, C.grassLight, C.grassShade, C.gold, C.creamLight];

/**
 * Dims the grass, its blades and its flowers to the dusk light.
 * @param {Canvas} layer
 */
function tintGround(layer) {
	for (let y = GROUND - 1; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const colour = get(layer, x, y);
			if (colour && GRASS.includes(colour)) {
				set(layer, x, y, mix(colour, C.duskSky3, 0.45));
			}
		}
	}
}

/**
 * The pavilion: a striped cone roof over striped walls, a scalloped valance, and the door held open on a warm, dim inside.
 * @param {Canvas} tent
 */
function drawTent(tent) {
	// The roof: stripes fanning out from the peak.
	for (let y = 4; y <= EAVE; y++) {
		const half = Math.round((y - 3) * 1.6);
		for (let x = CX - half; x <= CX + half; x++) {
			const fan = Math.floor(((x - CX) / (y - 2)) * 3.2 + 100.5) % 2;
			const shaded = x > CX + half * 0.35;
			set(tent, x, y, shaded ? STRIPES[fan].shade : STRIPES[fan].lit);
		}
	}
	// The walls: upright stripes.
	for (let y = EAVE + 1; y <= GROUND; y++) {
		for (let x = 7; x <= 57; x++) {
			const band = Math.floor((x - 7 + 2) / 5) % 2;
			const shaded = x > 44 || y > GROUND - 2;
			set(tent, x, y, shaded ? STRIPES[band].shade : STRIPES[band].lit);
		}
	}
	// The valance: a row of scallops along the eave.
	for (let x = 5; x <= 59; x++) {
		const i = Math.floor((x - 5) / 5);
		const depth = (x - 5) % 5 === 0 ? 1 : (x - 5) % 5 === 4 ? 2 : 3;
		for (let y = EAVE; y <= EAVE + depth; y++) {
			set(tent, x, y, i % 2 ? C.brickRed : C.brickRedLight);
		}
	}
	// The open door, its flaps tied back in folds on either side.
	for (let y = EAVE + 4; y <= GROUND; y++) {
		const half = Math.round(4 + (y - EAVE - 4) * 0.5);
		for (let x = CX - half; x <= CX + half; x++) {
			set(tent, x, y, INSIDE);
		}
		for (const side of [-1, 1]) {
			for (let i = 1; i <= 3; i++) {
				const fold = i === 2 ? C.roofShade : C.roof;
				set(tent, CX + side * (half + i), y, fold);
			}
		}
	}
	// The gold cords tying the flaps back.
	for (const side of [-1, 1]) {
		const half = Math.round(4 + (34 - EAVE - 4) * 0.5);
		for (let i = 1; i <= 3; i++) {
			set(tent, CX + side * (half + i), 34, C.gold);
		}
	}
}

/**
 * Dims the tent's cloth to the dusk light.
 * @param {Canvas} tent
 */
function dimTent(tent) {
	for (let i = 0; i < tent.p.length; i++) {
		const colour = tent.p[i];
		if (colour && colour !== INSIDE) {
			tent.p[i] = mix(colour, C.duskSky3, 0.22);
		}
	}
}

/**
 * A pole on the tent's peak flying a small swallow-tailed pennant.
 * @param {Canvas} tent
 */
function drawPennant(tent) {
	rect(tent, CX, 0, 1, 4, C.timber);
	paint(tent, CX + 1, 0, ['rrrrrr', 'rrrr..', 'rrrrrr'], {
		r: C.brickRedLight,
	});
}

/**
 * The fortune teller sitting in her doorway: a coin-trimmed violet headscarf, gold earrings, a necklace and a teal shawl.
 * @param {Canvas} scene
 */
function drawTeller(scene) {
	paint(
		scene,
		CX - 9,
		26,
		[
			'......RRRRRR......',
			'.....RRRRRRRR.....',
			'....gRgRgRgRgR....',
			'....RHSSSSSSHR....',
			'....RHSeSSeSHR....',
			'...gRHSSSSSSHRg...',
			'....RHSSssSSHRR...',
			'....RHHSSSSHHRR...',
			'.....HHHSSHHHRR...',
			'......TTSSTTTRr...',
			'....TTgTTTTgTRr...',
			'...TTTTgTTgTTRrT..',
			'...TTTtTggTtTTT...',
			'..TTTTtTTTTtTTTT..',
			'..TTTTTTTTTTTTTT..',
			'..TTt.TTTTTT.tTT..',
			'..TTt.TTTTTT.tTT..',
			'..TTt.TTTTTT.tTT..',
			'..TTt.TTTTTT.tTT..',
			'..SSs........sSS..',
		],
		{
			R: C.arcaneShade,
			r: C.roof,
			g: C.gold,
			H: C.wood,
			S: C.skin,
			s: C.skinShade,
			e: C.ink,
			T: C.teal,
			t: C.tealShade,
		}
	);
}

/**
 * The round table in front of her, under a deep red cloth with a gold fringe.
 * @param {Canvas} scene
 */
function drawTable(scene) {
	for (let y = TABLE; y <= 61; y++) {
		const top = y < TABLE + 6;
		const half = top ? 24 - Math.max(0, TABLE + 1 - y) * 2 : 25;
		for (let x = CX - half; x <= CX + half; x++) {
			let colour = top ? C.brickRed : C.brickRedShade;
			if (top && y === TABLE) {
				colour = C.brickRedLight;
			} else if (!top && (x - CX + 40) % 6 === 0) {
				colour = mix(C.brickRedShade, C.ink, 0.35);
			} else if (y >= 60) {
				colour = (x + y) % 2 ? C.gold : C.amber;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The brass oil lamp on the table, with a glass chimney.
 * @param {Canvas} scene
 */
function drawLamp(scene) {
	paint(
		scene,
		FLAME.x - 3,
		FLAME.y - 3,
		[
			'..ccc..',
			'..cLc..',
			'.cLLLc.',
			'.cLLLc.',
			'.cLLLc.',
			'..cLc..',
			'.BBBBB.',
			'BBGBBBB',
			'BGBBBbB',
			'.BBBBb.',
			'..BbB..',
		],
		{
			c: C.cloudShade,
			L: mix(C.lampGlow, C.gold, 0.4),
			B: C.brass,
			G: C.gold,
			b: C.lampFrame,
		}
	);
}

/**
 * Three cards turned face up, a sun, a crescent moon and a star, and the rest of the pack face down.
 * Each card gets its own ink edge so it sits clearly on the cloth.
 * @param {Canvas} scene
 */
function drawCards(scene) {
	const colours = {
		k: C.ink,
		w: C.creamLight,
		c: C.cream,
		y: C.gold,
		a: C.amber,
		b: C.daySea2,
		p: C.roofLight,
		r: C.brickRed,
	};
	const faces = [
		['y.y.y', '.yyy.', 'yyayy', '.yyy.', 'y.y.y'],
		['p.p.p', 'ppppp', '.ppp.', '.pkp.', '.ppp.'],
		['.r.r.', 'rrrrr', 'rrrrr', '.rrr.', '..r..'],
	];
	faces.forEach((face, i) => {
		const x = CX - 11 + i * 8;
		const y = TABLE + 1;
		rect(scene, x - 1, y - 1, 7, 9, C.ink);
		rect(scene, x, y, 5, 7, C.creamLight);
		rect(scene, x + 4, y, 1, 7, C.cream);
		paint(scene, x, y + 1, face, colours);
	});
	// The face-down pack to the right of the spread.
	const px = CX + 13;
	rect(scene, px - 1, TABLE + 3, 7, 6, C.ink);
	rect(scene, px, TABLE + 4, 5, 3, C.roofLight);
	set(scene, px + 2, TABLE + 5, C.gold);
	rect(scene, px, TABLE + 7, 5, 1, C.cream);
}

/**
 * The lamp's flame inside its chimney, painted last so nothing dims it.
 * @param {Canvas} scene
 */
function drawFlame(scene) {
	paint(scene, FLAME.x - 1, FLAME.y - 1, ['.l.', 'lyl', '.a.'], {
		l: C.lampGlow,
		y: C.white,
		a: C.amber,
	});
}
