// Polar's ice ridges: the Mountain's joined peaks and foothills turned to blue ice under snow, as the owner chose (#133).
import { PALETTE as C } from '../../palette.js';
import { paintMountains } from '../../../../src/lib/art/paint/relief/mountain.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../../../src/lib/art/paint/relief/footprint.js').Footprint} Footprint */

/**
 * Each colour of the Mountain's relief and its ice: grey rock to ice, the snow caps whiter, the earthen and green
 * foothills to snow. Ink outlines and shadows stay.
 * @type {Readonly<Record<string, string>>}
 */
export const TO_ICE = Object.freeze({
	[C.stoneLight]: C.iceLight,
	[C.stone]: C.ice,
	[C.stoneMid]: C.iceMid,
	[C.stoneShade]: C.iceShade,
	[C.roofShade]: C.iceDeep,
	[C.snow]: C.white,
	[C.snowShade]: C.snow,
	[C.swampMudLight]: C.snow,
	[C.swampMud]: C.snowShade,
	[C.swampMudShade]: C.iceMid,
	[C.alpineMeadow]: C.snowShade,
	[C.bottleSand]: C.white,
	[C.bottleSandShade]: C.snowShade,
});

/**
 * Paints a mat's impassable plots as the Mountain does, then turns every opaque pixel to its ice.
 * @param {Canvas} canvas - Empty, `fp.w` × `fp.h`
 * @param {Footprint} fp
 * @param {number} seed
 */
export function paintPolar(canvas, fp, seed) {
	paintMountains(canvas, fp, seed);
	for (let i = 0; i < canvas.p.length; i++) {
		const colour = canvas.p[i];
		if (
			colour &&
			(canvas.alpha?.[i] ?? 1) === 1 &&
			Object.hasOwn(TO_ICE, colour)
		) {
			canvas.p[i] = TO_ICE[colour];
		}
	}
}
