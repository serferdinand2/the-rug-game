// The 3 achievements printed on the board, and their VP boxes on each map side (R23, R24; 01 §10).
import { deepFreeze } from './ids.js';

/**
 * An achievement. The first time a player meets its condition, their token goes on the highest
 * free box and they gain those VP at once, even on an opponent's turn (R23). Once every box is taken, later players get nothing.
 * @typedef {Object} Achievement
 * @property {string} id
 * @property {string} name - As printed
 * @property {{ large: readonly number[], small: readonly number[] }} vp - The VP boxes on each map side, highest first
 */

/** @type {readonly Achievement[]} */
export const ACHIEVEMENTS = deepFreeze([
	// A token on space 12 of any track; one removed by AI Singularity still counts.
	{
		id: 'complete-track',
		name: 'Complete any advancement track',
		vp: { large: [15, 10, 5], small: [10, 5] },
	},
	// Two opponent outposts toppled by your conquests or traps, both still toppled.
	{
		id: 'topple-two',
		name: 'Topple two opponent outposts',
		vp: { large: [15, 10, 5], small: [10, 5] },
	},
	// Gaining the conquer benefit on the middle island; a trap against it denies the achievement.
	{
		id: 'middle-island',
		name: 'Conquer middle island',
		vp: { large: [10, 5], small: [10, 5] },
	},
]);
