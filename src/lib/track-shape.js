// Track-space geometry for the interface: the pointed tile silhouette, its selected outline, tiers and progress lines.
// Layout only: which spaces a player may enter, and what they cost, come from the rules engine.

/** @typedef {{ x: number, y: number }} Point */

/**
 * Which ends of the track a space sits at.
 * @typedef {Object} SpaceEnds
 * @property {boolean} [first=false] - The first space: a flat left edge, no inlet
 * @property {boolean} [last=false] - The last space: a square right edge, no tip
 * @property {number} [tip=TRACK_TIP] - How far the arrow tip reaches past the body, in pixels
 */

/**
 * How far a progress line and its dashed preview reach, as fractions of the track's width.
 * @typedef {Object} ProgressSpan
 * @property {number} end - Where the solid line stops: beneath the middle of the reached space, or 0 at the start
 * @property {{ start: number, end: number } | null} next - The dashed preview to the middle of the next space, or null on the last space
 */

/** The spaces on one track. */
export const SPACE_COUNT = 12;

/** The arrow tip of a space and the inlet of the next one, in pixels. Keep in step with --track-tip in tokens.css. */
export const TRACK_TIP = 16;

/** How far the gold selected outline sits inside the silhouette: half its 3-pixel stroke. */
export const OUTLINE_INSET = 1.5;

/** Spaces that share one tier price (I–IV). */
export const TIER_SPACES = 3;

/**
 * The silhouette of a space, clockwise from the top-left corner, in pixels.
 * The arrow tip reaches past the body on the right; the inlet takes the previous tip on the left.
 * @param {number} width - The body's width
 * @param {number} height - The body's height
 * @param {SpaceEnds} [ends]
 * @returns {Point[]}
 */
export function spacePoints(
	width,
	height,
	{ first = false, last = false, tip = TRACK_TIP } = {}
) {
	const middle = height / 2;
	return [
		{ x: 0, y: 0 },
		{ x: width, y: 0 },
		...(last ? [] : [{ x: width + tip, y: middle }]),
		{ x: width, y: height },
		{ x: 0, y: height },
		...(first ? [] : [{ x: tip, y: middle }]),
	];
}

/**
 * Moves every edge of a clockwise polygon inwards by a distance and returns the new corners.
 * Ported from the play-page mockup (docs/ui/main-screen.html).
 * @param {readonly Point[]} points - Clockwise in screen coordinates (y grows downwards)
 * @param {number} distance - In pixels
 * @returns {Point[]}
 */
export function insetPolygon(points, distance) {
	return points.map((point, index) => {
		const previous = points[(index + points.length - 1) % points.length];
		const next = points[(index + 1) % points.length];
		const incomingX = point.x - previous.x;
		const incomingY = point.y - previous.y;
		const outgoingX = next.x - point.x;
		const outgoingY = next.y - point.y;
		const incomingLength = Math.hypot(incomingX, incomingY);
		const outgoingLength = Math.hypot(outgoingX, outgoingY);
		const firstX = point.x - (incomingY / incomingLength) * distance;
		const firstY = point.y + (incomingX / incomingLength) * distance;
		const secondX = point.x - (outgoingY / outgoingLength) * distance;
		const secondY = point.y + (outgoingX / outgoingLength) * distance;
		const offsetX = secondX - firstX;
		const offsetY = secondY - firstY;
		const denominator = incomingX * outgoingY - incomingY * outgoingX;
		const along = (offsetX * outgoingY - offsetY * outgoingX) / denominator;
		return { x: firstX + incomingX * along, y: firstY + incomingY * along };
	});
}

/**
 * The SVG path of the gold outline drawn on a selected space, in the space's own pixels.
 * @param {number} width - The space's measured width
 * @param {number} height - The space's measured height
 * @param {SpaceEnds & { inset?: number }} [options] - The space's ends, and how far inside to draw (default OUTLINE_INSET)
 * @returns {string} Path data such as 'M 1.5 1.5 L … Z', or '' before the space has a size.
 */
export function outlinePath(width, height, options = {}) {
	if (!(width > 0 && height > 0)) {
		return '';
	}
	const { inset = OUTLINE_INSET, ...ends } = options;
	const corners = insetPolygon(spacePoints(width, height, ends), inset);
	return (
		corners
			.map(
				({ x, y }, index) =>
					`${index === 0 ? 'M' : 'L'} ${round(x)} ${round(y)}`
			)
			.join(' ') + ' Z'
	);
}

/**
 * The tier a space belongs to: three spaces under each price.
 * @param {number} space - 1 to SPACE_COUNT
 * @returns {number} 1 to 4, shown as I–IV
 */
export function tierOf(space) {
	return Math.floor((space - 1) / TIER_SPACES) + 1;
}

/**
 * How far a player's progress line reaches, and where its dashed preview to the next space runs.
 * The solid line stops beneath the middle of the reached space; a player still at the start has none.
 * @param {number} position - Spaces reached, 0 (the start) to spaces
 * @param {number} [spaces=SPACE_COUNT] - Spaces on the track
 * @returns {ProgressSpan}
 */
export function progressSpan(position, spaces = SPACE_COUNT) {
	const reached = Math.min(Math.max(position, 0), spaces);
	const end = Math.max(reached - 0.5, 0) / spaces;
	return {
		end,
		next:
			reached < spaces
				? { start: end, end: (reached + 0.5) / spaces }
				: null,
	};
}

/**
 * Rounds a coordinate to a thousandth of a pixel, so the path data stays short.
 * @param {number} value
 * @returns {number}
 */
function round(value) {
	return Math.round(value * 1000) / 1000;
}
