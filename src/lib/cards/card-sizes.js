// Each card frame's size before any scaling, as the card styles draw it, so no caller types a card's size (#92).

/**
 * A card frame's unscaled size in CSS pixels. A frame without a height is as tall as its content.
 * @typedef {Object} CardSize
 * @property {number} width - The frame's width, its border included
 * @property {number} [height] - The frame's height, when the frame fixes it
 */

/**
 * The card frames shown smaller in the game. A tech card's rows are fixed (`.rg-tech-layout` in
 * `src/styles/card-layouts.css`); tapestry and civilization cards grow with their text, so ScaledCard measures them.
 * @type {Readonly<{ tech: Readonly<CardSize>, tapestry: Readonly<CardSize>, civilization: Readonly<CardSize> }>}
 */
export const CARD_SIZES = Object.freeze({
	tech: Object.freeze({ width: 425, height: 298 }),
	tapestry: Object.freeze({ width: 319 }),
	civilization: Object.freeze({ width: 425 }),
});

/**
 * The scale that fits cards into the height they may take: the tallest card's unscaled height into `available`
 * less `room` (padding, outlines), never above full size nor below `min`. Until both heights are measured, full
 * size (#118).
 * @param {number} available - The height the cards may take, in CSS pixels; 0 while unmeasured
 * @param {number} tallest - The tallest card's unscaled height; 0 while unmeasured
 * @param {{ min: number, room: number }} fit - The smallest scale, below which the row scrolls, and the height kept free
 * @returns {number}
 */
export function fitScale(available, tallest, { min, room }) {
	if (tallest <= 0 || available <= 0) {
		return 1;
	}
	return Math.min(1, Math.max(min, (available - room) / tallest));
}
