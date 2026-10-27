// Where the map's cloud and volcano overlays sit in a territory's 64×56 picture (#6): one source for the art toolkit,
// which draws them into the territory tiles, and for the game, which lays them over the hexes it composes.

/** A territory picture's width and height: a flat-topped hex of radius 32. */
export const PICTURE_SIZE = /** @type {readonly [number, number]} */ (
	Object.freeze([64, 56])
);

/** The cloud overlay's width and height. */
export const CLOUD_SIZE = /** @type {readonly [number, number]} */ (
	Object.freeze([22, 12])
);

/** The cloud overlay's top-left pixel: over the top of the hex, clear of the island and the corners, in every turn. */
export const CLOUD_SPOT = /** @type {readonly [number, number]} */ (
	Object.freeze([21, 2])
);

/** The volcano overlay's width and height. */
export const VOLCANO_SIZE = 17;

/**
 * The volcano overlay's top-left pixel on each corner, 0–5 clockwise from the top-left: its crater on that corner's
 * line from the centre, so it always stands on the mountains.
 * @type {readonly (readonly [number, number])[]}
 */
export const VOLCANO_SPOTS = Object.freeze(
	/** @type {[number, number][]} */ ([
		[15, 3],
		[32, 3],
		[41, 19],
		[32, 34],
		[15, 34],
		[6, 19],
	]).map((spot) => Object.freeze(spot))
);

/**
 * The corner the volcano stands on: the middle of the longest run of mountain corners, the earlier of two middles.
 * @param {readonly string[]} corners - Turned, as shown
 * @returns {number} 0–5
 * @throws {Error} When no corner is a mountain.
 */
export function volcanoCorner(corners) {
	const mountain = (/** @type {number} */ k) =>
		corners[((k % 6) + 6) % 6] === 'mountain';
	let best = { start: -1, length: 0 };
	for (let start = 0; start < 6; start++) {
		// A run starts after a corner that isn't a mountain, or at corner 0 when all six are.
		const starts =
			mountain(start) &&
			(!mountain(start - 1) ||
				(start === 0 && corners.every((_, k) => mountain(k))));
		if (!starts) {
			continue;
		}
		let length = 0;
		while (length < 6 && mountain(start + length)) {
			length++;
		}
		if (length > best.length) {
			best = { start, length };
		}
	}
	if (best.start < 0) {
		throw new Error('volcanoCorner: no corner is a mountain');
	}
	return (best.start + Math.floor((best.length - 1) / 2)) % 6;
}
