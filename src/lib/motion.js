// What moves for a batch of fresh events (#29 design §8): the hexes to pulse on the map, the viewer's plots and landmarks to glow on the capital, and the chips whose VP rose; and whether anything may move (#119).

/** The events that change a hex someone can see on the map. */
const HEX_EVENTS = new Set([
	'explored',
	'conquered',
	'outpostPlaced',
	'outpostToppled',
	'outpostRaised',
	'tokenPlaced',
	'piecePlacedOnMap',
]);

/**
 * What to highlight for fresh events.
 * @typedef {Object} Highlights
 * @property {string[]} hexes - Hex keys, each once, in order
 * @property {{ row: number, col: number }[]} plots - The viewer's newly built plots
 * @property {string[]} landmarks - The viewer's newly placed landmarks
 * @property {number[]} vp - The seats whose VP rose, each once
 */

/**
 * The highlights for a batch of fresh events. The screen skips them all when the system asks for reduced motion.
 * @param {({ type: string, player?: number } & Record<string, any>)[]} events
 * @param {number | null} seat - The viewer's seat, whose capital is on show
 * @returns {Highlights}
 */
export function highlights(events, seat) {
	/** @type {Highlights} */
	const out = { hexes: [], plots: [], landmarks: [], vp: [] };
	for (const event of events) {
		if (
			HEX_EVENTS.has(event.type) &&
			typeof event.hex === 'string' &&
			!out.hexes.includes(event.hex)
		) {
			out.hexes.push(event.hex);
		}
		if (
			event.player === seat &&
			event.type === 'buildingPlaced' &&
			Number.isInteger(event.row) &&
			Number.isInteger(event.col)
		) {
			out.plots.push({ row: event.row, col: event.col });
		}
		if (event.player === seat && event.type === 'landmarkPlaced') {
			out.landmarks.push(event.landmark);
		}
		if (
			event.type === 'vpGained' &&
			event.vp > 0 &&
			typeof event.player === 'number' &&
			!out.vp.includes(event.player)
		) {
			out.vp.push(event.player);
		}
	}
	return out;
}

/**
 * Whether the system asks for reduced motion (#119): the one check the screens and the dice tray make.
 * @param {{ matchMedia?: (query: string) => { matches: boolean } }} [view] - The page's window; none in Node
 * @returns {boolean}
 */
export function prefersReducedMotion(
	view = typeof window === 'undefined' ? undefined : window
) {
	return Boolean(
		view?.matchMedia?.('(prefers-reduced-motion: reduce)').matches
	);
}

/**
 * A CSS time in milliseconds, such as a motion token's value read from the page (#119).
 * @param {string} time - Such as '220ms' or '0.38s'; an empty value is 0
 * @returns {number}
 */
export function msOf(time) {
	const value = parseFloat(time);
	if (Number.isNaN(value)) {
		return 0;
	}
	return time.trim().endsWith('ms') ? value : value * 1000;
}
