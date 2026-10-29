// The World Map's painted terrain in the game (#134): what the painter is given, where its one picture goes, and its URL.
import { PICTURE_SIZE } from './art/hex-overlays.js';
import { paintMap } from './art/paint/map.js';
import { toSvg } from './art/paint/painter.js';

/** @typedef {import('./art/paint/map.js').MapHexArt} MapHexArt */
/** @typedef {import('./art/paint/map.js').PaintedMap} PaintedMap */
/** @typedef {import('./art/paint/painter.js').Canvas} Canvas */
/** @typedef {import('./hexmap.js').Box} Box */

const HALF_ROOT_3 = Math.sqrt(3) / 2;

/**
 * What the painter needs of each hex: its key, and for an explored hex its turned corners, island, clouds and
 * volcano. Pieces and labels are left out, so a change to them never repaints the map.
 * @param {readonly import('./hexmap.js').MapHex[]} hexes - From mapHexes()
 * @returns {MapHexArt[]}
 */
export function mapArt(hexes) {
	return hexes.map((hex) =>
		hex.corners
			? {
					key: hex.key,
					// A territory's terrains are never 'unexplored', which only names a hex without a tile.
					corners: /** @type {MapHexArt['corners']} */ ([
						...hex.corners,
					]),
					island: /** @type {MapHexArt['island']} */ ([
						...hex.island,
					]),
					clouds: hex.clouds,
					volcano: hex.volcano,
				}
			: { key: hex.key }
	);
}

/**
 * The painted map, or null when no hex is explored yet, as there is nothing to paint.
 * @param {readonly MapHexArt[]} art - From mapArt()
 * @returns {PaintedMap | null}
 */
export function paintedMap(art) {
	if (!art.some((hex) => hex.corners)) {
		return null;
	}
	return paintMap(art);
}

/**
 * Where the painted map's picture goes among hexes laid out at this size: scaled as hexPicture() scales one hex's
 * 64×56 picture, and moved so that hex 0_0's picture lies round the centre 0, 0.
 * @param {PaintedMap} painted
 * @param {number} size - The hex size the map is drawn at, such as HEX_SIZE
 * @returns {Box}
 */
export function mapPictureBox({ canvas, left, top }, size) {
	const [width, height] = PICTURE_SIZE;
	const across = (2 * size) / width;
	const down = (2 * HALF_ROOT_3 * size) / height;
	return {
		x: -size + left * across,
		y: -HALF_ROOT_3 * size + top * down,
		width: canvas.w * across,
		height: canvas.h * down,
	};
}

/**
 * A blob URL holding a painted picture as SVG. The caller revokes it with URL.revokeObjectURL once it is replaced.
 * @param {Canvas} canvas
 * @returns {string}
 */
export function pictureUrl(canvas) {
	return URL.createObjectURL(
		new Blob([toSvg(canvas)], { type: 'image/svg+xml' })
	);
}
