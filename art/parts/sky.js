// Scene part: the sky above a scene's horizon, with stars and a moon at night.
import { set } from '../painter.js';
import { PALETTE } from '../palette.js';

/** @typedef {import('../painter.js').Canvas} Canvas */
/** @typedef {import('../painter.js').Colour} Colour */

/**
 * Options for drawSky.
 * @typedef {Object} SkyOptions
 * @property {'night' | 'day' | 'dusk'} time - Time of day
 * @property {number} horizon - The last sky row; rows 0 to horizon are filled
 * @property {() => number} random - The scene's seeded random stream
 * @property {number} [stars=46] - Night: how many stars
 * @property {number} [starRows=32] - Night: stars fall in rows 0 to starRows - 1
 * @property {[number, number][]} [sparkles] - Night: bright four-point stars
 * @property {{ x: number, y: number }} [moon] - Night: the crescent moon's centre
 */

const NIGHT_RAMP = [
	PALETTE.nightSky1,
	PALETTE.nightSky2,
	PALETTE.nightSky3,
	PALETTE.nightSky4,
	PALETTE.nightSky5,
	PALETTE.nightSky6,
];

/**
 * Draws the sky from row 0 down to the horizon.
 * @param {Canvas} canvas - The background layer
 * @param {SkyOptions} options
 * @throws {Error} For an unknown time of day.
 */
export function drawSky(canvas, options) {
	if (options.time === 'night') {
		drawNightSky(canvas, options);
		return;
	}
	throw new Error(`drawSky: unknown time "${options.time}"`);
}

/**
 * The approved prototype's night sky. The order of random() calls is part of the
 * picture: each star takes x, then y, then its colour.
 * @param {Canvas} canvas
 * @param {SkyOptions} options
 */
function drawNightSky(
	canvas,
	{ horizon, random, stars = 46, starRows = 32, sparkles = [], moon }
) {
	gradient(canvas, horizon, NIGHT_RAMP);
	for (let i = 0; i < stars; i++) {
		const x = Math.floor(random() * canvas.w);
		const y = Math.floor(random() * starRows);
		set(canvas, x, y, random() > 0.6 ? PALETTE.white : PALETTE.starDim);
	}
	for (const [x, y] of sparkles) {
		set(canvas, x, y, PALETTE.white);
		for (const [dx, dy] of [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1],
		]) {
			set(canvas, x + dx, y + dy, PALETTE.starDim);
		}
	}
	if (moon) {
		drawMoon(canvas, moon.x, moon.y);
	}
}

/**
 * Fills rows 0 to horizon with a colour ramp, dithering where one band gives way to the next.
 * @param {Canvas} canvas
 * @param {number} horizon
 * @param {Colour[]} ramp - Colours from the top down
 */
function gradient(canvas, horizon, ramp) {
	for (let y = 0; y <= horizon; y++) {
		const t = (y / horizon) * (ramp.length - 1);
		const i = Math.floor(t);
		for (let x = 0; x < canvas.w; x++) {
			const dither =
				i + 1 < ramp.length && t - i > 0.6 && (x + y) % 2 === 0;
			set(canvas, x, y, dither ? ramp[i + 1] : ramp[i]);
		}
	}
}

/**
 * A crescent: a disc with a bite taken out of its upper right, with a darker rim.
 * @param {Canvas} canvas
 * @param {number} cx - Centre column
 * @param {number} cy - Centre row
 */
function drawMoon(canvas, cx, cy) {
	for (let y = cy - 7; y <= cy + 7; y++) {
		for (let x = cx - 7; x <= cx + 7; x++) {
			const distance = (x - cx) ** 2 + (y - cy) ** 2;
			const bite = (x - cx - 3) ** 2 + (y - cy + 2) ** 2 <= 26;
			if (distance <= 30 && !bite) {
				set(
					canvas,
					x,
					y,
					distance >= 20 ? PALETTE.moonRim : PALETTE.moon
				);
			}
		}
	}
}
