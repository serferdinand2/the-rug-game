// Scene part: a column of smoke or steam rising from a chimney, a smokestack or a funnel.
import { set } from '../painter.js';
import { PALETTE } from '../palette.js';

/** @typedef {import('../painter.js').Canvas} Canvas */

/**
 * Options for drawSmoke.
 * @typedef {Object} SmokeOptions
 * @property {number} x - The source's column (the top of the chimney)
 * @property {number} y - The source's row; nothing is drawn below it
 * @property {'smoke' | 'steam'} tone - Grey coal smoke or white steam
 * @property {number} [puffs=3] - How many puffs, each higher and larger than the last
 * @property {1 | -1} [drift=1] - Which way the wind takes it: 1 to the right, -1 to the left
 */

/** @type {Record<string, { light: string, shade: string }>} */
const TONES = {
	smoke: { light: PALETTE.stoneLight, shade: PALETTE.stone },
	steam: { light: PALETTE.white, shade: PALETTE.cloudShade },
};

/**
 * Draws puffs rising from a source and drifting with the wind, shaded on their lower side.
 * Draw it on the background layer, so the scene's outline pass leaves it soft.
 * @param {Canvas} canvas
 * @param {SmokeOptions} options
 * @throws {Error} For an unknown tone.
 */
export function drawSmoke(canvas, { x, y, tone, puffs = 3, drift = 1 }) {
	const colours = Object.hasOwn(TONES, tone) ? TONES[tone] : undefined;
	if (!colours) {
		throw new Error(`drawSmoke: unknown tone "${tone}"`);
	}
	let cy = y;
	for (let i = 0; i < puffs; i++) {
		const r = 1 + i;
		const cx = x + drift * (i * 3 + (i > 0 ? 1 : 0));
		cy -= r + (i > 0 ? 1 : 0);
		for (let dy = -r; dy <= r; dy++) {
			for (let dx = -r; dx <= r; dx++) {
				if (dx * dx + dy * dy > r * r + r || cy + dy > y) {
					continue;
				}
				const shaded = dy > 0 || dx * drift < -r / 2;
				set(
					canvas,
					cx + dx,
					cy + dy,
					shaded ? colours.shade : colours.light
				);
			}
		}
		cy -= r;
	}
}
