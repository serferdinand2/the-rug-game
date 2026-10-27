// Surprise Party: revellers in party hats burst from behind a garden wall with streamers and fireworks, as the soldier who walked up to it recoils, his helmet jumping off his head.
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
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The last sky row, the wall's coping row and its left end, and the ground's top row. */
const HORIZON = 44;
const WALL_TOP = 41;
const WALL_LEFT = 22;
const GROUND = 54;

/** A festive violet that the night sky is tinted towards. */
const VIOLET = mix(C.duskSky2, C.nightSky1, 0.35);

/** The firework colours: a gold burst, a rose one and a green one. */
const ROSE = mix(C.brickRedLight, C.white, 0.35);
const LIME = mix(C.grassLight, C.white, 0.2);

/**
 * The fireworks: centre, radius, colour and the bright core colour.
 * @type {{ x: number, y: number, r: number, colour: Colour, core: Colour }[]}
 */
const BURSTS = [
	{ x: 44, y: 11, r: 9, colour: C.gold, core: C.lampGlow },
	{ x: 16, y: 9, r: 7, colour: ROSE, core: C.white },
	{ x: 59, y: 27, r: 5, colour: LIME, core: C.white },
];

/**
 * The soldier, recoiling with his hands thrown up, eyes wide, mouth open, one foot off the ground. H hair, S skin,
 * s skin shade, W eye white, e pupil, o open mouth, c coat, C coat shade, g brass buttons, k belt, p breeches, f boots.
 */
const SOLDIER = [
	'.SS.......SS....',
	'.SS.......SS....',
	'..c.H.H.H.c.....',
	'..cHHHHHHHc.....',
	'..cHSSSWeSc.....',
	'..cHSSSSSSsc....',
	'..cHSSSSoSc.....',
	'...c.SSSs.c.....',
	'...cccSScccc....',
	'....cccgcccC....',
	'....ccccccCC....',
	'....cccgccCC....',
	'....ccccccCC....',
	'....cccgccCC....',
	'....kkkkkkkk....',
	'....pppppppp....',
	'....ppppppppp...',
	'....ppp..ppppp..',
	'....ppp....pppp.',
	'....ppp.....ffff',
	'....ppp.....fff.',
	'....ppp.........',
	'...ffff.........',
	'..fffff.........',
];

/** His helmet, jumping off his head: t steel, T lit steel, R the red crest. */
const HELMET = [
	'...RRRR..',
	'..RRttRR.',
	'..tTTttt.',
	'.tTTtttt.',
	'ttttttttt',
];

/**
 * A reveller behind the wall, arms up: a striped party hat with a pompom, a face shouting, and a tunic.
 * q pompom, a hat, B hat stripe, h hair, S skin, s skin shade, o open mouth, e eye, u tunic, U tunic shade.
 */
const REVELLER = [
	'.....q.....',
	'.....a.....',
	'....aB.....',
	'....Baa....',
	'...aaBaa...',
	'S..hhhhh..S',
	'S..SeSeS..S',
	'.S.SSSSS.S.',
	'.u.SSoSs.u.',
	'..u.SSs.u..',
	'..uuuuuuu..',
	'...uuuuuU..',
	'...uuuuuU..',
	'...uuuuuU..',
	'...uuuuuU..',
];

/**
 * Draws the Surprise Party scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(929);

	drawSky(layer, {
		time: 'night',
		horizon: HORIZON,
		random,
		stars: 20,
		starRows: 30,
	});
	tintSky(layer);
	drawTrails(layer);
	for (const burst of BURSTS) {
		glow(layer, {
			x: burst.x,
			y: burst.y,
			radius: burst.r + 5,
			colour: burst.colour,
			strength: 0.25,
		});
		drawBurst(layer, burst);
	}
	drawTreeline(layer);
	drawGround(layer, random);

	drawRevellers(scene);
	drawWall(scene);
	drawBunting(scene);
	drawSoldier(scene);
	outline(scene, C.ink);
	underlay(scene, layer);
	drawSweat(scene);
	drawStreamers(scene);
	drawConfetti(scene, random);
	return scene;
}

/**
 * Tints the night sky towards a festive violet.
 * @param {Canvas} layer
 */
function tintSky(layer) {
	for (let y = 0; y <= HORIZON; y++) {
		for (let x = 0; x < 64; x++) {
			const colour = get(layer, x, y);
			if (colour && colour !== C.white && colour !== C.starDim) {
				set(layer, x, y, mix(colour, VIOLET, 0.35));
			}
		}
	}
}

/**
 * Faint smoke trails the rockets left on their way up.
 * @param {Canvas} layer
 */
function drawTrails(layer) {
	const smoke = mix(C.roofLight, VIOLET, 0.4);
	line(layer, 40, 40, 44, 21, smoke);
	line(layer, 22, 40, 16, 17, smoke);
	line(layer, 55, 40, 59, 33, smoke);
}

/**
 * A dark line of trees behind the garden.
 * @param {Canvas} layer
 */
function drawTreeline(layer) {
	const dark = mix(C.pineShade, VIOLET, 0.45);
	for (let x = 0; x < 64; x++) {
		const top =
			38 +
			Math.round(
				Math.abs(Math.sin(x * 0.5)) * 3 + Math.sin(x * 0.17) * 2
			);
		for (let y = top; y < GROUND; y++) {
			set(layer, x, y, dark);
		}
	}
}

/**
 * The lawn in front of the wall, catching the fireworks' colours.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawGround(layer, random) {
	const grass = mix(C.grassShade, VIOLET, 0.5);
	const grassLit = mix(C.grass, C.gold, 0.25);
	const grassDark = mix(C.grassShade, C.nightSky1, 0.6);
	for (let y = GROUND; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = grass;
			if (y === GROUND) {
				colour = mix(grassLit, VIOLET, 0.4);
			} else if (y > 59 || (y > 56 && (x + y) % 2 === 0)) {
				colour = grassDark;
			}
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 20; i++) {
		const x = Math.floor(random() * 64);
		const y = GROUND + 1 + Math.floor(random() * 10);
		set(layer, x, y, mix(grassLit, VIOLET, 0.3));
	}
}

/**
 * Four revellers springing up behind the wall in different clothes, arms raised, the nearest one highest.
 * @param {Canvas} scene
 */
function drawRevellers(scene) {
	const people = [
		{
			x: 22,
			y: WALL_TOP - 14,
			tunic: ROSE,
			shade: C.brickRed,
			hat: C.gold,
			stripe: C.brickRed,
			hair: C.wood,
		},
		{
			x: 32,
			y: WALL_TOP - 11,
			tunic: C.daySea2,
			shade: C.daySea3,
			hat: C.brickRedLight,
			stripe: C.white,
			hair: C.amber,
		},
		{
			x: 42,
			y: WALL_TOP - 13,
			tunic: C.pine,
			shade: C.pineShade,
			hat: C.daySky4,
			stripe: C.gold,
			hair: C.timber,
		},
		{
			x: 52,
			y: WALL_TOP - 10,
			tunic: C.amber,
			shade: C.timber,
			hat: LIME,
			stripe: C.daySea2,
			hair: C.wood,
		},
	];
	for (const { x, y, tunic, shade, hat, stripe, hair } of people) {
		paint(scene, x, y, REVELLER, {
			q: C.white,
			a: hat,
			B: stripe,
			h: hair,
			S: C.skin,
			s: C.skinShade,
			e: C.ink,
			o: C.brickRedShade,
			u: tunic,
			U: shade,
		});
	}
}

/**
 * The garden wall: rough stone under a rounded coping, catching the fireworks' light on its top.
 * @param {Canvas} scene
 */
function drawWall(scene) {
	for (let y = WALL_TOP; y <= GROUND; y++) {
		for (let x = WALL_LEFT; x < 64; x++) {
			let colour = C.stone;
			const row = y - WALL_TOP;
			if (row === 0) {
				colour = C.stoneLight;
			} else if (row === 1) {
				colour = C.stone;
			} else if (row === 2) {
				colour = C.stoneShade;
			} else {
				const course = Math.floor((row - 3) / 3);
				if ((row - 3) % 3 === 2 || (x + course * 3) % 6 === 0) {
					colour = C.stoneShade;
				} else if (x === WALL_LEFT) {
					colour = C.stoneLight;
				} else if (row > 9) {
					colour = C.stoneMid;
				}
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * Bunting strung in two swags along the wall's face: a cord with pennants in the party colours.
 * @param {Canvas} scene
 */
function drawBunting(scene) {
	const colours = [C.gold, ROSE, C.foam, LIME];
	let n = 0;
	for (const [from, to] of [
		[WALL_LEFT + 1, 42],
		[42, 63],
	]) {
		for (let x = from; x <= to; x++) {
			const t = (x - from) / (to - from);
			const y = WALL_TOP + 3 + Math.round(Math.sin(t * Math.PI) * 3);
			set(scene, x, y, C.wood);
			if ((x - from) % 4 === 2 && x < to - 1) {
				const colour = colours[n % colours.length];
				rect(scene, x - 1, y + 1, 3, 1, colour);
				set(scene, x, y + 2, colour);
				n++;
			}
		}
	}
}

/**
 * The soldier on the left, recoiling with his hands up, his helmet jumping off and his spear falling.
 * @param {Canvas} scene
 */
function drawSoldier(scene) {
	// The spear, dropped and toppling backwards.
	line(scene, 1, 36, 9, GROUND, C.timberLight);
	rect(scene, 0, 33, 2, 3, C.stoneLight);
	paint(scene, 2, GROUND + 1 - SOLDIER.length, SOLDIER, {
		H: C.wood,
		S: C.skin,
		s: C.skinShade,
		W: C.white,
		e: C.ink,
		o: C.brickRedShade,
		c: C.daySea2,
		C: C.daySea3,
		g: C.gold,
		k: C.wood,
		p: C.cream,
		f: C.wood,
	});
	paint(scene, 4, GROUND - SOLDIER.length - 6, HELMET, {
		t: C.stone,
		T: C.stoneLight,
		R: C.brickRed,
	});
}

/**
 * A bead of sweat flying off the startled soldier, painted after the outline.
 * @param {Canvas} scene
 */
function drawSweat(scene) {
	set(scene, 14, 33, C.white);
	set(scene, 14, 34, C.foam);
	set(scene, 15, 31, C.foam);
}

/**
 * One firework in the sky: spokes of sparks from its centre, brightest near the core, breaking into dots at the tips.
 * @param {Canvas} layer
 * @param {{ x: number, y: number, r: number, colour: Colour, core: Colour }} burst
 */
function drawBurst(layer, { x, y, r, colour, core }) {
	const spokes = 12;
	for (let i = 0; i < spokes; i++) {
		const angle = (i / spokes) * Math.PI * 2 + 0.2;
		for (let d = 2; d <= r; d++) {
			if (d > r - 3 && d < r && d % 2 === 0) {
				continue;
			}
			const px = Math.round(x + Math.cos(angle) * d);
			const py = Math.round(y + Math.sin(angle) * d);
			set(layer, px, py, d < r / 2 ? core : colour);
		}
	}
	set(layer, x, y, core);
}

/**
 * Two paper streamers flung from the revellers' hands towards the soldier, twisting as they fly, each ending in a curl.
 * They are painted over the outline so they stay thin.
 * @param {Canvas} scene
 */
function drawStreamers(scene) {
	for (const { from, via, to, colour, twist } of [
		{
			from: [22, 31],
			via: [19, 13],
			to: [8, 19],
			colour: C.gold,
			twist: C.amber,
		},
		{
			from: [32, 34],
			via: [29, 8],
			to: [17, 14],
			colour: C.foam,
			twist: C.nightWave,
		},
	]) {
		/** @type {Set<string>} */
		const done = new Set();
		let n = 0;
		for (let i = 0; i <= 60; i++) {
			const t = i / 60;
			const x = Math.round(
				(1 - t) ** 2 * from[0] +
					2 * (1 - t) * t * via[0] +
					t ** 2 * to[0]
			);
			const y = Math.round(
				(1 - t) ** 2 * from[1] +
					2 * (1 - t) * t * via[1] +
					t ** 2 * to[1]
			);
			if (done.has(`${x},${y}`)) {
				continue;
			}
			done.add(`${x},${y}`);
			set(scene, x, y, Math.floor(n / 2) % 2 ? twist : colour);
			n++;
		}
		// The loose end curls round.
		const [x, y] = to;
		for (const [dx, dy] of [
			[0, 1],
			[1, 2],
			[2, 1],
			[1, 0],
		]) {
			set(scene, x + dx, y + dy, colour);
		}
	}
}

/**
 * Confetti scattered in the air between the revellers and the soldier.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawConfetti(scene, random) {
	const colours = [C.gold, ROSE, LIME, C.foam, C.white];
	for (let i = 0; i < 26; i++) {
		const x = 14 + Math.floor(random() * 46);
		const y = 18 + Math.floor(random() * 20);
		set(scene, x, y, colours[i % colours.length]);
	}
}
