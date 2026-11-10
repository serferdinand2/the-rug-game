// The Psionics (F&F, #40; 03 FF.3, R74): a gain each income turn, and one extra of every random draw or roll, keeping one.
import { isPlayerSeat, playerSeat } from '../state.js';

/** What each income turn gives the Psionics (03 FF.3). */
const INCOME =
	/** @type {Record<number, import('../data/effects.js').Effect[]>} */ ({
		2: [{ gain: { territory: 1 } }],
		3: [{ gain: { tapestry: 1 } }],
		4: [{ invent: {} }],
		5: [{ research: {} }],
	});

/**
 * Whether a seat holds the Psionics, so its random draws and rolls take one extra, keeping one.
 * @param {import('../state.js').State} state
 * @param {unknown} player
 * @returns {boolean}
 */
export function psionic(state, player) {
	return (
		isPlayerSeat(state, player) &&
		playerSeat(state, /** @type {number} */ (player)).civs.includes(
			'psionics'
		)
	);
}

/**
 * The Psionics' draw of one random card from a deck (a tech card, a masterpiece): 2 drawn to keep 1, the other shuffled
 * back once they pick (`chooseSample`, R74). With one card left it is the card; with none, null.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {'tech' | 'masterpieces'} stack
 * @param {() => string | null} draw - Takes the deck's top card, or null
 * @param {Record<string, any>} then - What the card kept goes on to: `invent`, `reserve` or `create`
 * @returns {string | null | undefined} The card when there was no choice; undefined once the choice is asked
 */
export function sampleCard(ctx, player, stack, draw, then) {
	const first = draw();
	if (first === null) {
		return null;
	}
	const second = draw();
	if (second === null) {
		return first;
	}
	ctx.push([
		{ player, kind: 'chooseSample', stack, options: [first, second], then },
	]);
	return undefined;
}

/** @type {import('./civ.js').Civ} */
export const psionics = {
	id: 'psionics',
	incomeTurns: [2, 3, 4, 5],
	income(ctx, player, turn) {
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: structuredClone(INCOME[turn] ?? []),
				origin: 'civ',
			},
		]);
	},
};
