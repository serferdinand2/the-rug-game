// Track-space geometry for the interface: the pointed tile silhouette, its selected outline, tiers and the players' tokens.
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

// A space's tier is a rule, so it comes from the engine's track data (#128); components keep importing it from here.
export { TIER_SPACES, tierOf } from './engine/data/tracks.js';

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
 * One token under a track: a player's, on the space they reached, or the faint one of a previewed seat on its next space.
 * @typedef {Object} TrackToken
 * @property {import('./ui.js').Seat} seat
 * @property {number} lane - The player's place in the list, for a stable key and the preview tests
 * @property {number} end - The middle of its space, as a fraction of the track's width; 0 at the start
 * @property {number} slot - Its place among the tokens on the same space, from the left
 * @property {number} count - How many tokens share the space
 * @property {boolean} start - Whether it waits at the start, where the tokens line up inside the first space
 * @property {boolean} ghost - Whether it is a previewed seat's faint token on its next space
 */

/**
 * Where each player's token stands (#174): on the middle of the space reached, side by side with the tokens that share
 * it, in the players' order; a previewed seat's faint token joins the tokens on its next space, after them.
 * @param {readonly { seat: import('./ui.js').Seat, position: number }[]} players
 * @param {readonly import('./ui.js').Seat[]} [preview=[]] - The seats whose next space is previewed
 * @param {number} [spaces=SPACE_COUNT]
 * @returns {TrackToken[]}
 */
export function trackTokens(players, preview = [], spaces = SPACE_COUNT) {
	const placed = players.map((player, lane) => {
		const span = progressSpan(player.position, spaces);
		return {
			seat: player.seat,
			lane,
			end: span.end,
			start: player.position <= 0,
			ghost: false,
		};
	});
	const ghosts = players.flatMap((player, lane) => {
		const next = progressSpan(player.position, spaces).next;
		return preview.includes(player.seat) && next
			? [
					{
						seat: player.seat,
						lane,
						end: next.end,
						start: false,
						ghost: true,
					},
				]
			: [];
	});
	const all = [...placed, ...ghosts];
	/** @param {{ end: number, start: boolean }} token */
	const where = (token) => (token.start ? 'start' : String(token.end));
	return all.map((token) => {
		const group = all.filter((other) => where(other) === where(token));
		return { ...token, slot: group.indexOf(token), count: group.length };
	});
}

/**
 * Rounds a coordinate to a thousandth of a pixel, so the path data stays short.
 * @param {number} value
 * @returns {number}
 */
function round(value) {
	return Math.round(value * 1000) / 1000;
}
