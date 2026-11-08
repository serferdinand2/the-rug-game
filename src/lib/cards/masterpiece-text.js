// The masterpiece cards' words and faces (#35 part 4): what each gives when it fires, as the card, the shelf, the
// preview and the card reference show it.
import { masterpiece } from '../engine/data/masterpieces.js';
import { describeEffects } from '../describe.js';
import { artUrl } from '../ui.js';

/** @typedef {import('../engine/data/effects.js').Effect} Effect */

/**
 * A masterpiece card's face.
 * @typedef {Object} MasterpieceCardData
 * @property {string} id
 * @property {string} title - Its name, such as "Art Deco"
 * @property {string} artwork - Its picture's URL
 * @property {string} text - Its effect in words
 */

/**
 * The effects without the single-use card's turning face down, which the card's own note says instead: at the top
 * level (Art Deco) and in a trade's gain (Mime).
 * @param {readonly Effect[]} effects
 * @returns {Effect[]}
 */
function withoutTurning(effects) {
	return effects
		.filter((effect) => !('flipMasterpiece' in effect))
		.map((effect) => {
			if (!('trade' in effect)) {
				return effect;
			}
			const trade = /** @type {any} */ (effect).trade;
			return /** @type {Effect} */ ({
				trade: {
					...trade,
					offers: trade.offers.map(
						(/** @type {{ gain: Effect[] }} */ offer) => ({
							...offer,
							gain: withoutTurning(offer.gain),
						})
					),
				},
			});
		});
}

/**
 * A masterpiece's effect in words, as its card says it: "Gain 1 VP for each space you have advanced on Arts." A
 * single-use card (Art Deco, Mime) adds that it turns face down once used.
 * @param {string} id
 * @returns {string}
 */
export function masterpieceText(id) {
	const card = masterpiece(id);
	const words = `${describeEffects(withoutTurning(card.effects))}.`;
	return card.singleUse
		? `${words} Used once: then it turns face down.`
		: words;
}

/**
 * A masterpiece card's face, for MasterpieceCard.
 * @param {string} id
 * @returns {MasterpieceCardData}
 */
export function masterpieceCardData(id) {
	return {
		id,
		title: masterpiece(id).name,
		artwork: artUrl(`masterpiece/${id}`),
		text: masterpieceText(id),
	};
}
