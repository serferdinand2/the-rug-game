// The card fans beside the landing page's and the lobby's panels (#174): the game's own art before the first table.
import { ASSETS } from './art/catalog.js';

/**
 * One card of a fan: a picture and its name.
 * @typedef {{ name: string, art: string, titleSize: 'large' | 'small' }} FanCard
 */

/**
 * Picks pictures from one art group, each once.
 * @param {string} group - Such as 'civ'
 * @param {number} count
 * @param {(n: number) => number} random - A whole number from 0 to n − 1
 * @returns {FanCard[]}
 */
function pick(group, count, random) {
	const pool = ASSETS.filter((asset) => asset.group === group);
	/** @type {FanCard[]} */
	const cards = [];
	while (cards.length < count && pool.length > 0) {
		const [asset] = pool.splice(random(pool.length), 1);
		cards.push({
			name: asset.name,
			art: asset.id,
			titleSize: group === 'civ' ? 'large' : 'small',
		});
	}
	return cards;
}

/**
 * The two fans: three civilizations on the left, a landmark and two tapestry cards on the right.
 * @param {(n: number) => number} random - The store's injected random
 * @returns {{ left: FanCard[], right: FanCard[] }}
 */
export function artFans(random) {
	return {
		left: pick('civ', 3, random),
		right: [...pick('landmark', 1, random), ...pick('tapestry', 2, random)],
	};
}
