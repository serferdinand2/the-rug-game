// Where the styled tooltip (#137) sits: above its target, or below it when the top has no room, kept inside the window, with its arrow on the target's centre.

/** The space between a tooltip and its target, which its arrow fills. */
export const TOOLTIP_GAP = 10;

/** The closest a tooltip comes to the window's edges. */
export const TOOLTIP_MARGIN = 8;

/** The closest the arrow comes to the tooltip's corners. */
const ARROW_INSET = 12;

/**
 * A box in window pixels, as getBoundingClientRect gives it.
 * @typedef {Object} TooltipBox
 * @property {number} left
 * @property {number} top
 * @property {number} width
 * @property {number} height
 */

/**
 * Where a tooltip goes.
 * @typedef {Object} TooltipPlace
 * @property {number} left - Its left edge, in window pixels
 * @property {number} top - Its top edge, in window pixels
 * @property {'top' | 'bottom'} side - The side of the target it sits on
 * @property {number} arrow - The arrow's centre, in pixels from the tooltip's left edge
 */

/**
 * The place for a tooltip of a given size over a target.
 * @param {TooltipBox} target - The hovered or focused element
 * @param {{ width: number, height: number }} tip - The tooltip's measured size
 * @param {{ width: number, height: number }} viewport - The window's size
 * @returns {TooltipPlace}
 */
export function placeTooltip(target, tip, viewport) {
	const above = target.top - TOOLTIP_GAP - tip.height;
	const below = target.top + target.height + TOOLTIP_GAP;
	const fitsAbove = above >= TOOLTIP_MARGIN;
	const fitsBelow = below + tip.height <= viewport.height - TOOLTIP_MARGIN;
	/** @type {'top' | 'bottom'} */
	let side = 'top';
	if (!fitsAbove) {
		side =
			fitsBelow ||
			viewport.height - target.top - target.height > target.top
				? 'bottom'
				: 'top';
	}
	const centre = target.left + target.width / 2;
	const left = clamp(
		centre - tip.width / 2,
		TOOLTIP_MARGIN,
		viewport.width - TOOLTIP_MARGIN - tip.width
	);
	const top = clamp(
		side === 'top' ? above : below,
		TOOLTIP_MARGIN,
		viewport.height - TOOLTIP_MARGIN - tip.height
	);
	const arrow = clamp(centre - left, ARROW_INSET, tip.width - ARROW_INSET);
	return { left, top, side, arrow };
}

/**
 * The text a title shows in the tooltip: trimmed, its line breaks kept, and empty for a blank title.
 * @param {string | null | undefined} title
 * @returns {string}
 */
export function tooltipText(title) {
	return (title ?? '').trim();
}

/**
 * A value kept between a low and a high bound; the low bound wins when they cross, so a tooltip wider than the window
 * starts at its left margin.
 * @param {number} value
 * @param {number} low
 * @param {number} high
 * @returns {number}
 */
function clamp(value, low, high) {
	return Math.max(low, Math.min(value, high));
}
