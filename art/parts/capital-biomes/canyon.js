// Capital terrain for the Canyon advanced mat (#6): a stub until its tiles are drawn.

/** @typedef {import('../../painter.js').Canvas} Canvas */

/**
 * The mat's printed layout, one string per row, top first: '.' an open plot, 'X' an impassable one. Empty until drawn.
 * @type {readonly string[]}
 */
export const LAYOUT = [];

/**
 * One 32×32 plot of this biome.
 * @param {boolean} blocked - An impassable plot
 * @param {number} variant - 0-7 for a buildable plot, 0-5 for an impassable one
 * @returns {Canvas}
 */
export function drawBiomeTile(blocked, variant) {
	throw new Error(`canyon tiles are not drawn yet (${blocked}, ${variant})`);
}

/**
 * The example mat, composed from this biome's tiles on its printed layout.
 * @returns {Canvas}
 */
export function drawBiomeMat() {
	throw new Error('the canyon mat is not drawn yet');
}
