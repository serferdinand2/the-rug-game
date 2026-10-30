// A player's three tech rows, top first, as the Tech tab and the players overview name them (#94).

/**
 * One row of a player's tech cards.
 * @typedef {Object} TechRow
 * @property {'top' | 'middle' | 'bottom'} id - The row's key in a seat's `tech`
 * @property {string} label - Its name, such as 'Top row'
 * @property {'square' | 'circle' | 'none'} shape - The effect shape it marks: a square, a circle, or none for the bottom row
 */

/** The tech rows, top first, as the mockup draws them. */
export const TECH_ROWS = /** @type {readonly Readonly<TechRow>[]} */ (
	Object.freeze([
		Object.freeze({ id: 'top', label: 'Top row', shape: 'square' }),
		Object.freeze({ id: 'middle', label: 'Middle row', shape: 'circle' }),
		Object.freeze({ id: 'bottom', label: 'Bottom row', shape: 'none' }),
	])
);
