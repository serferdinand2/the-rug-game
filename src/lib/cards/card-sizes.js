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
