// Democracy: citizens queueing across a sunny square to drop their ballots into a glass ballot box, a columned hall behind.
import {
	createCanvas,
	set,
	rect,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';
import { drawClassical } from '../../parts/classical.js';
import { drawFigure } from '../../parts/figures.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The square's first row, and the ballot box's front face: left column, top row and width. */
const SQUARE = 38;
const BOX_X = 35;
const BOX_Y = 48;
const BOX_W = 22;

/** How far the box's top and side recede, in pixels. */
const DEPTH = 5;

/** The hall door's centre column. */
const DOOR = 20;

/** The voter at the front of the queue: left column and feet. */
const VOTER_X = 30;
const VOTER_Y = 53;

/** The citizens waiting behind the voter, nearest first: left column, feet and clothes. */
const QUEUE = [
	{ x: 24, y: 51, clothes: C.brickRed },
	{ x: 18, y: 49, clothes: C.pine },
	{ x: 12, y: 47, clothes: C.amber },
	{ x: 6, y: 45, clothes: C.roofLight },
];

/**
 * Draws the Democracy scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(53);

	drawSky(layer, { time: 'day', horizon: SQUARE - 1, random });
	drawPaving(layer);

	// The hall stands behind the queue, so it gets its own outline.
	const hall = createCanvas(64, 64);
	drawHall(hall);
	drawCypress(hall, 47, 12);
	drawCypress(hall, 57, 20);
	outline(hall, C.ink);

	drawQueue(scene);
	drawBallotBox(scene);
	drawBallot(scene);
	outline(scene, C.ink);
	underlay(scene, hall);
	underlay(scene, layer);
	return scene;
}

/**
 * The square: pale sunlit flagstones in courses that deepen towards the viewer.
 * @param {Canvas} layer
 */
function drawPaving(layer) {
	let top = SQUARE;
	for (let course = 0; top < 64; course++) {
		const depth = 2 + course;
		const width = 7 + course * 3;
		const offset = (course % 2) * Math.floor(width / 2);
		for (let y = top; y < Math.min(top + depth, 64); y++) {
			for (let x = 0; x < 64; x++) {
				let colour = C.sandLight;
				if (y === top + depth - 1 || (x + offset) % width === 0) {
					colour = C.sand;
				} else if (y === top && course > 0) {
					colour = C.creamLight;
				}
				set(layer, x, y, colour);
			}
		}
		top += depth;
	}
}

/**
 * The hall of assembly: a columned front with a pediment, an open lit door and a round window.
 * @param {Canvas} hall
 */
function drawHall(hall) {
	drawClassical(hall, {
		x: 2,
		y: SQUARE - 1,
		width: 36,
		columns: 4,
		height: 9,
	});
	// The open door between the middle columns, warm light inside.
	rect(hall, DOOR - 3, 27, 6, 8, C.wood);
	rect(hall, DOOR - 2, 28, 4, 7, C.amber);
	rect(hall, DOOR - 2, 28, 4, 1, C.gold);
	// A round window in the pediment.
	for (let dy = -2; dy <= 2; dy++) {
		for (let dx = -2; dx <= 2; dx++) {
			const d = dx * dx + dy * dy;
			if (d <= 5) {
				set(
					hall,
					DOOR - 1 + dx,
					18 + dy,
					d > 3 && dx + dy > 0 ? C.creamShade : C.roofShade
				);
			}
		}
	}
}

/**
 * A tall, narrow cypress tree standing on the square, lit on its left.
 * @param {Canvas} hall
 * @param {number} cx - The trunk's column
 * @param {number} tip - The tree's top row
 */
function drawCypress(hall, cx, tip) {
	const base = SQUARE + 1;
	const height = base - 2 - tip;
	for (let y = tip; y < base - 1; y++) {
		const t = (y - tip) / height;
		const half = Math.round(
			3.4 * Math.min(1, t / 0.6) * (t > 0.88 ? 0.7 : 1)
		);
		for (let x = cx - half; x <= cx + half; x++) {
			const colour =
				x === cx - half
					? C.pineLight
					: x > cx
						? C.pineShade
						: (x + y) % 3 === 0
							? C.pineLight
							: C.pine;
			set(hall, x, y, colour);
		}
	}
	rect(hall, cx, base - 1, 1, 2, C.wood);
}

/**
 * The queue: citizens in single file crossing the square from the hall, the first one dropping a ballot in.
 * @param {Canvas} scene
 */
function drawQueue(scene) {
	// The furthest first, so nearer citizens stand in front.
	for (const citizen of [...QUEUE].reverse()) {
		drawFigure(scene, { ...citizen, facing: 'right' });
	}
	// The voter, one arm raised to push a ballot into the slot.
	const sleeve = C.daySea2;
	drawFigure(scene, {
		x: VOTER_X,
		y: VOTER_Y,
		facing: 'right',
		clothes: sleeve,
	});
	/** @type {[number, number, Colour][]} */
	const arm = [
		[4, -4, sleeve],
		[4, -5, sleeve],
		[5, -6, sleeve],
		[6, -7, sleeve],
		[7, -8, C.skin],
		[8, -9, C.skin],
		[9, -9, C.skinShade],
	];
	for (const [dx, dy, colour] of arm) {
		set(scene, VOTER_X + dx, VOTER_Y + dy, colour);
	}
}

/**
 * The folded ballot going into the slot, held at its corner.
 * @param {Canvas} scene
 */
function drawBallot(scene) {
	rect(scene, 40, 38, 5, 8, C.white);
	rect(scene, 44, 38, 1, 8, C.cream);
	rect(scene, 40, 41, 5, 1, C.creamShade);
}

/**
 * The ballot box, seen from above and to the left: a brass lid with a slot, glass sides in a timber
 * frame, and a pile of folded ballots inside.
 * @param {Canvas} scene
 */
function drawBallotBox(scene) {
	const right = BOX_X + BOX_W - 1;
	const bottom = BOX_Y + 13;
	const glass = mix(C.daySky5, C.foam, 0.3);
	const glassShade = mix(C.daySky3, C.foam, 0.25);
	// The wooden lid, receding up and to the right, with a brass plate round the slot.
	for (let k = 0; k < DEPTH; k++) {
		const y = BOX_Y - 1 - k;
		for (let x = BOX_X + 1 + k; x <= right + 1 + k; x++) {
			const edge = x === BOX_X + 1 + k || k === DEPTH - 1;
			set(scene, x, y, edge ? C.lampGlow : k === 0 ? C.amber : C.gold);
		}
	}
	rect(scene, 38, BOX_Y - 3, 10, 1, C.ink);
	rect(scene, 38, BOX_Y - 2, 10, 1, C.lampFrame);
	// The side, in shadow.
	for (let k = 0; k < DEPTH; k++) {
		const x = right + 1 + k;
		for (let y = BOX_Y - k; y <= bottom - k; y++) {
			const frame =
				k === DEPTH - 1 || y === bottom - k || y === BOX_Y - k;
			set(scene, x, y, frame ? C.wood : glassShade);
		}
	}
	// The front: corner posts, rails and a middle mullion around two glass panes.
	const mid = BOX_X + BOX_W / 2 - 1;
	rect(scene, BOX_X, BOX_Y, BOX_W, bottom - BOX_Y + 1, glass);
	for (let y = BOX_Y; y <= bottom; y++) {
		set(scene, BOX_X, y, C.timber);
		set(scene, BOX_X + 1, y, C.timberShade);
		set(scene, mid, y, C.timberShade);
		set(scene, mid + 1, y, C.wood);
		set(scene, right, y, C.wood);
	}
	rect(scene, BOX_X + 1, BOX_Y, BOX_W - 1, 1, C.timber);
	rect(scene, BOX_X + 1, bottom - 1, BOX_W - 2, 1, C.timberShade);
	rect(scene, BOX_X + 1, bottom, BOX_W - 1, 1, C.wood);
	// The ballots piled inside, and a glint of sun on each pane.
	for (const left of [BOX_X + 2, mid + 2]) {
		const paneW = mid - BOX_X - 2;
		for (let row = 0; row < 6; row++) {
			const y = bottom - 2 - row;
			for (let x = left; x < left + paneW; x++) {
				if (row === 5 && (x - left) % 4 > 1) {
					continue;
				}
				const end = (x - left + (row % 2) * 2) % 4 === 3;
				set(
					scene,
					x,
					y,
					end ? C.creamShade : row % 2 ? C.white : C.creamLight
				);
			}
		}
		set(scene, left + 1, BOX_Y + 3, C.white);
		set(scene, left + 2, BOX_Y + 2, C.white);
		set(scene, left + 3, BOX_Y + 1, C.white);
	}
	// Short feet.
	rect(scene, BOX_X + 1, bottom + 1, 3, 2, C.timberShade);
	rect(scene, right - 2, bottom + 1, 3, 2, C.timberShade);
}
